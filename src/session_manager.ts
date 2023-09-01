// SessionManager is used by the Client to help maintain the access and refresh tokens.
// By default, an in-memory version will be used. A custom implementation can be provided
// using `WithSessionManager`, if the tokens should be stored e.g. in a config file.
export interface SessionManager {
  set(key: SessionKey, value: string): void;
  get(key: SessionKey): string | undefined;
  remove(key: SessionKey): void;
}

export enum SessionKey {
  AccessToken = '_access_token',
  RefreshToken = '_refresh_token',
  UserID = '_user_id',
  User = '_user',
  ProjectToken = '_project_token'
}

export class InMemorySessionManager {
  private map: Map<SessionKey, string> = new Map();

  set(key: SessionKey, value: string) {
    this.map.set(key, value);
  }

  get(key: SessionKey): string | undefined {
    return this.map.get(key);
  }

  remove(key: SessionKey) {
    this.map.delete(key);
  }
}

export class LocalStorageSessionManager {
  set(key: SessionKey, value: string) {
    localStorage.setItem(key, value);
  }

  get(key: SessionKey): string | undefined {
    return localStorage.getItem(key) ?? undefined;
  }

  remove(key: SessionKey) {
    localStorage.removeItem(key);
  }
}
