import { type AuthMiddlewareOptions } from '@commercetools/sdk-client-v2'; // Required for auth

import { readConfiguration } from '../infrastructure/utils/config.utils';

const configuration = readConfiguration();

/**
 * Configure Middleware. Example only. Adapt on your own
 */
export const authMiddlewareOptions: AuthMiddlewareOptions = {
  host: configuration.authUrl,
  projectKey: configuration.projectKey,
  credentials: {
    clientId: configuration.clientId,
    clientSecret: configuration.clientSecret,
  },
  scopes: configuration.scope.split(/\s+/).filter(Boolean),
};
