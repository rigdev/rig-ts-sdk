import { createConnectTransport, Transport } from '@bufbuild/connect-web';
import { Interceptor, createPromiseClient, PromiseClient } from '@bufbuild/connect';

import { Service as AuthService } from '@rig/api/api/v1/authentication/service_connect.js';
import { LoginRequest, LoginResponse } from '@rig/api/api/v1/authentication/service_pb.js';

import { SessionManager, InMemorySessionManager, LocalStorageSessionManager, SessionKey } from './session_manager.js';
import { defaultHost, defaultLoginMethod } from './defaults.js';
import { Service as UserService } from '@rig/api/api/v1/user/service_connect.js';
import { Service as UserSettingsService } from '@rig/api/api/v1/user/settings/service_connect.js';
import { Service as ProjectSettingsService } from '@rig/api/api/v1/project/settings/service_connect.js';
import { Service as ProjectService } from '@rig/api/api/v1/project/service_connect.js';
import { Service as GroupService } from '@rig/api/api/v1/group/service_connect.js';
import { Service as StorageService } from '@rig/api/api/v1/storage/service_connect.js';
import { Service as DatabaseService } from '@rig/api/api/v1/database/service_connect.js';
import { Service as ServiceAccountService } from '@rig/api/api/v1/service_account/service_connect.js';
import { Service as CapsuleService } from '@rig/api/api/v1/capsule/service_connect.js';
import { PartialMessage } from '@bufbuild/protobuf';

export interface ClientOptions {
  host?: string;
  credentials?: Credentials;
  projectID?: string;
}

export interface Credentials {
  id: string;
  secret: string;
}

const omitTypes: Set<string> = new Set([
  '/api.v1.authentication.Service/Login',
  '/api.v1.authentication.Service/Register',
  '/api.v1.authentication.Service/VerifyEmail',
  '/api.v1.authentication.Service/RefreshToken',
  '/api.v1.authentication.Service/OauthCallback',
  '/api.v1.authentication.Service/SendPasswordReset',
  '/api.v1.authentication.Service/ResetPassword',
  '/api.v1.authentication.Service/GetAuthConfig'
]);

export class Client {
  user: PromiseClient<typeof UserService>;
  userSettings: PromiseClient<typeof UserSettingsService>;
  projectSettings: PromiseClient<typeof ProjectSettingsService>;
  projects: PromiseClient<typeof ProjectService>;
  storage: PromiseClient<typeof StorageService>;
  group: PromiseClient<typeof GroupService>;
  database: PromiseClient<typeof DatabaseService>;
  serviceAccount: PromiseClient<typeof ServiceAccountService>;
  capsule: PromiseClient<typeof CapsuleService>;
  auth: PromiseClient<typeof AuthService>;

  private _authInterceptor: Interceptor = (next) => async (req) => {
    const path = new URL(req.url).pathname;
    if (omitTypes.has(path)) {
      return await next(req);
    }

    const accessToken = await this.getAccessToken();
    if (accessToken) {
      req.header.set('Authorization', 'Bearer ' + accessToken);
      // TODO What is project token and how should I get it??
      // const projectToken = await this.getProjectToken();
      // if (projectToken) {
      //   req.header.set('X-Rig-Project-Token', projectToken);
      // }
    }
    return await next(req);
  };
  private _transport: Transport;

  sessionManager: SessionManager;
  host: string;
  loginRequest: PartialMessage<LoginRequest> | undefined;

  public async getAccessToken(): Promise<string | undefined> {
    let accessToken = this.sessionManager.get(SessionKey.AccessToken);

    if (!accessToken && this.loginRequest !== undefined) {
      const response = await createPromiseClient(AuthService, this._transport).login(this.loginRequest);
      if (response.token) {
        this.sessionManager.set(SessionKey.AccessToken, response.token.accessToken);
        this.sessionManager.set(SessionKey.RefreshToken, response.token.refreshToken);
        accessToken = response.token.accessToken;
      }
    }

    if (!accessToken) return;

    try {
      const jwtPayload = JSON.parse(atob(accessToken.split('.')[1]));
      if (Date.now() >= jwtPayload.exp * 1000) {
        const refreshToken = this.sessionManager.get(SessionKey.RefreshToken);
        const response = await createPromiseClient(AuthService, this._transport).refreshToken({
          refreshToken
        });
        this.sessionManager.set(SessionKey.AccessToken, response.token?.accessToken ?? '');
        this.sessionManager.set(SessionKey.RefreshToken, response.token?.refreshToken ?? '');
        accessToken = response.token?.accessToken ?? '';
      }
    } catch (e) {
      this.logout();
      return; // Return undefined to avoid entering the infinite loop
    }
    return accessToken;
  }

  constructor(options: ClientOptions) {
    this.host = options.host ?? defaultHost();

    if (options.credentials !== undefined) {
      this.loginRequest = {
        method: {
          case: 'clientCredentials',
          value: {
            clientId: options.credentials.id,
            clientSecret: options.credentials.secret
          }
        }
      };
    } else {
      this.loginRequest = defaultLoginMethod();
    }

    this.sessionManager =
      typeof localStorage === 'undefined' ? new InMemorySessionManager() : new LocalStorageSessionManager();

    this._transport = createConnectTransport({
      baseUrl: this.host,
      interceptors: [this._authInterceptor]
    });

    this.user = createPromiseClient(UserService, this._transport);
    this.userSettings = createPromiseClient(UserSettingsService, this._transport);
    this.projectSettings = createPromiseClient(ProjectSettingsService, this._transport);
    this.projects = createPromiseClient(ProjectService, this._transport);
    this.storage = createPromiseClient(StorageService, this._transport);
    this.group = createPromiseClient(GroupService, this._transport);
    this.database = createPromiseClient(DatabaseService, this._transport);
    this.serviceAccount = createPromiseClient(ServiceAccountService, this._transport);
    this.capsule = createPromiseClient(CapsuleService, this._transport);
    this.auth = createPromiseClient(AuthService, this._transport);
  }

  async login(loginRequest: PartialMessage<LoginRequest>): Promise<LoginResponse> {
    this.loginRequest = loginRequest;
    const response: LoginResponse = await this.auth.login(this.loginRequest);
    if (response.token && response.token.accessToken !== '') {
      this.sessionManager.set(SessionKey.AccessToken, response.token?.accessToken ?? '');
      this.sessionManager.set(SessionKey.RefreshToken, response.token?.refreshToken ?? '');
    }
    return response;
  }

  logout() {
    this.sessionManager.remove(SessionKey.AccessToken);
    this.sessionManager.remove(SessionKey.RefreshToken);
  }
}
