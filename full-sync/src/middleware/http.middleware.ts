import { type HttpMiddlewareOptions } from '@commercetools/sdk-client-v2'; // Required for sending HTTP requests
import { readConfiguration } from '../infrastructure/utils/config.utils';

/**
 * Configure Middleware. Example only. Adapt on your own
 */
export const httpMiddlewareOptions: HttpMiddlewareOptions = {
  host: `https://api.${readConfiguration().region}.commercetools.com`,
  enableRetry: true,
  retryConfig: {
    backoff: true,
    maxDelay: 5_000,
    maxRetries: 3,
    retryCodes: [408, 429, 500, 502, 503, 504],
    retryDelay: 200,
    retryOnAbort: true,
  },
};
