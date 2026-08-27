type RetryOptions = {
  attempts?: number;
  initialDelayMilliseconds?: number;
};

export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, initialDelayMilliseconds = 200 }: RetryOptions = {}
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (attempt >= attempts || !isTransient(error)) {
        throw error;
      }

      await delay(initialDelayMilliseconds * 2 ** (attempt - 1));
    }
  }
}

function isTransient(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    details?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };
  const details =
    candidate.details && typeof candidate.details === 'object'
      ? (candidate.details as { status?: unknown })
      : undefined;
  const status = [candidate.statusCode, candidate.status, details?.status].find(
    (value): value is number => typeof value === 'number'
  );

  if (status !== undefined) {
    return status === 408 || status === 429 || (status >= 500 && status < 600);
  }

  return (
    error instanceof TypeError ||
    (typeof candidate.code === 'string' &&
      TRANSIENT_NETWORK_ERROR_CODES.has(candidate.code))
  );
}

const TRANSIENT_NETWORK_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETDOWN',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
]);

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
