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
    return true;
  }

  const candidate = error as { status?: unknown; statusCode?: unknown };
  const status =
    typeof candidate.statusCode === 'number'
      ? candidate.statusCode
      : candidate.status;

  if (typeof status !== 'number' || status === 0) {
    return true;
  }

  return status === 408 || status === 429 || status >= 500;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
