export function getHostName(url: string): string {
  return new URL(url).hostname;
}

/**
 * Merges and deduplicates arrays of arrays
 * @param input arrays of arrays
 */
export function mergeDedupe<T>(input: T[][]): T[] {
  return [...new Set(mergeArrays(input))];
}

/**
 * Merges arrays of arrays
 * @param input arrays of arrays
 */
export function mergeArrays<T>(input: T[][]): T[] {
  return [].concat(...input);
}