export type DashboardCommand = {
  id: string;
  label: string;
  detail: string;
  href: string;
  terms: string;
};

const ignoredWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "in",
  "need",
  "of",
  "or",
  "show",
  "the",
  "to",
  "which",
  "with",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !ignoredWords.has(token));
}

export function rankDashboardCommands(
  commands: readonly DashboardCommand[],
  query: string,
) {
  const queryTokens = tokens(query);
  if (!queryTokens.length) return [...commands];

  return commands
    .map((command, index) => {
      const searchable = `${command.label} ${command.detail} ${command.terms}`.toLowerCase();
      const commandTokens = new Set(tokens(searchable));
      const score = queryTokens.reduce((total, token) => {
        if (commandTokens.has(token)) return total + 4;
        if (searchable.includes(token)) return total + 1;
        return total;
      }, 0);
      return { command, index, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.command);
}
