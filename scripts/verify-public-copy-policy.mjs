import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const activeSources = [
  'app/layout.tsx',
  'components/decision-architecture-landing.tsx',
  'components/rama',
  'lib/i18n.ts',
  'registry.json',
  'public/r/registry.json',
];
const prohibited = /award[- ]winning|trusted by|verified reviews?|client satisfaction|exclusive allocation|guaranteed (?:yield|return|appreciation)|live inventory|market-leading|number one|#1/i;

function collect(target, files = []) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return files;
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [...files, absolute];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isDirectory()) collect(path.join(target, entry.name), files);
    else if (/\.(?:json|tsx?|jsx?)$/.test(entry.name)) files.push(path.join(absolute, entry.name));
  }
  return files;
}

const violations = [];
for (const file of activeSources.flatMap((source) => collect(source))) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const match = line.match(prohibited);
    const explicitBoundary = match?.[0].toLowerCase() === 'live inventory' && /not live inventory/i.test(line);
    if (match && !explicitBoundary) violations.push(`${path.relative(root, file)}:${index + 1} (${match[0]})`);
  });
}
if (violations.length) throw new Error(`Unsupported public claims found:\n${violations.join('\n')}`);
console.log('✓ Active public copy contains no prohibited credibility or inventory claims');
