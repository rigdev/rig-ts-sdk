import { PartialMessage } from '@bufbuild/protobuf';
import { LoginRequest } from '@rigdev/api/api/v1/authentication/service_pb.js';

export function defaultHost(): string {
  const _default = 'http://localhost:4747/';
  if (typeof process === 'undefined') {
    return _default;
  }
  return process.env.RIG_HOST || _default;
}

export function defaultProjectID(): string {
  const _default = 'c10c947b-91f1-41ea-96df-ea13ee68a7fc0';
  if (typeof process === 'undefined') {
    return _default;
  }
  return process.env.RIG_PROJECT_ID || _default;
}

export function defaultLoginMethod(): PartialMessage<LoginRequest> | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }

  if (process.env.RIG_CLIENT_ID === undefined || process.env.RIG_CLIENT_SECRET === undefined) {
    return undefined;
  }

  return {
    method: {
      case: 'clientCredentials',
      value: {
        clientId: process.env.RIG_CLIENT_ID,
        clientSecret: process.env.RIG_CLIENT_SECRET
      }
    }
  };
}
