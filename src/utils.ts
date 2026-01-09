/**
 * Returns a promise that resolves after the specified number of milliseconds.
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
