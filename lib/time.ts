export function isOlderThanDays(value: string, days: number) {
  return Date.now() - new Date(value).getTime() > days * 24 * 60 * 60 * 1000;
}
