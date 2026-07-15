import { createHash } from 'crypto';

export const DEFAULT_CLIENT_FIXED_TOKEN =
  'df991b67-24b2-4121-8c73-9c3ab4b0dba2';

export function getPublicEndpointToken(): string {
  return process.env.CLIENT_FIXED_TOKEN ?? DEFAULT_CLIENT_FIXED_TOKEN;
}

export function isValidPublicEndpointToken(token?: string): boolean {
  return (token ?? '').trim() === getPublicEndpointToken();
}
