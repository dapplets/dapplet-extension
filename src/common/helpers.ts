export function getHostName(url: string): string {
  return new URL(url).hostname;
}