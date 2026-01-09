/**
 * Returns a promise that resolves after the specified number of milliseconds.
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculates backoff time for rate limit retries.
 * Uses the larger of the Retry-After header value or an exponential backoff.
 *
 * @param retryAfter - The Retry-After header value in seconds
 * @param retryCount - The current retry attempt number (1-indexed)
 * @returns The backoff time in milliseconds
 */
export const calculateBackoff = (retryAfter: number, retryCount: number): number =>
  Math.max(retryAfter * 1000, 100 * Math.pow(2, retryCount));
