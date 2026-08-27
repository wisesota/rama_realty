export const STORYBOOK_URL = process.env.STORYBOOK_URL ?? `http://localhost:${process.env.RAMA_STORYBOOK_PORT ?? "6006"}`;

export function getStoryUrl(id: string) {
  return `${STORYBOOK_URL}/iframe.html?id=${id}&viewMode=story`;
}
