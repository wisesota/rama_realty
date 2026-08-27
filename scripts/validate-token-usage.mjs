import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'docs', 'token-coverage-baseline.json');
const reportPath = path.join(root, 'docs', 'token-coverage.json');
const roots = ['app', 'components', 'design-system'];
const colorPattern = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b/i;
const dimensionPattern = /-?\d*\.?\d+(?:px|rem|em)\b/gi;
const governedProperties = /^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|inline|block))?(?:-color|-radius)?|outline-color|box-shadow|font-family|gap|row-gap|column-gap|padding(?:-(?:top|right|bottom|left|inline|block))?|margin(?:-(?:top|right|bottom|left|inline|block))?)$/i;
const allowedDimension = /^(?:0|1px|100%|auto|none|inherit|initial|unset)$/i;

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (/\.(?:css|tsx?|jsx?)$/.test(entry.name) && entry.name !== 'design-tokens.css') files.push(absolute);
  }
  return files;
}

function cssViolations(file, source) {
  const issues = [];
  const rootNode = postcss.parse(source, { from: file });
  rootNode.walkDecls((declaration) => {
    const customProperty = declaration.prop.startsWith('--');
    if (!customProperty && declaration.value.includes('var(--')) return;
    if (customProperty) {
      // DTCG references and documented calculations compose governed values;
      // the raw literals inside calc() are structural operators, not new tokens.
      if (declaration.value.includes('var(--')) return;
      const dimensions = declaration.value.match(dimensionPattern) ?? [];
      const hasRawDimension = dimensions.some((value) => !allowedDimension.test(value));
      if (colorPattern.test(declaration.value) || hasRawDimension) {
        issues.push({ line: declaration.source?.start?.line ?? 0, property: declaration.prop });
      }
      return;
    }
    if (!governedProperties.test(declaration.prop)) return;
    const hasRawColor = colorPattern.test(declaration.value);
    const dimensions = declaration.value.match(dimensionPattern) ?? [];
    const hasRawDimension = dimensions.some((value) => !allowedDimension.test(value));
    const hasRawFont = declaration.prop === 'font-family' && !/^(?:serif|sans-serif|monospace|system-ui)$/.test(declaration.value.trim());
    if (hasRawColor || hasRawDimension || hasRawFont) {
      issues.push({ line: declaration.source?.start?.line ?? 0, property: declaration.prop });
    }
  });
  return issues;
}

function scriptViolations(file, source) {
  const issues = [];
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.text === 'style' && node.initializer && ts.isJsxExpression(node.initializer)) {
      const expression = node.initializer.expression;
      if (expression && ts.isObjectLiteralExpression(expression)) {
        for (const property of expression.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const name = property.name.getText(sourceFile).replace(/["']/g, '');
          const value = property.initializer.getText(sourceFile).replace(/^['"]|['"]$/g, '');
          const dimensions = value.match(dimensionPattern) ?? [];
          const hasRawDimension = dimensions.some((dimension) => !allowedDimension.test(dimension));
          if (governedProperties.test(name) && !value.includes('var(--') && (colorPattern.test(value) || hasRawDimension)) {
            issues.push({ line: sourceFile.getLineAndCharacterOfPosition(property.getStart(sourceFile)).line + 1, property: name });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return issues;
}

const files = roots.flatMap((directory) => walk(path.join(root, directory)));
const byFile = {};
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const issues = file.endsWith('.css') ? cssViolations(file, source) : scriptViolations(file, source);
  if (issues.length) byFile[path.relative(root, file).replaceAll('\\', '/')] = issues;
}

const byDirectory = {};
for (const [file, issues] of Object.entries(byFile)) {
  const directory = file.split('/')[0];
  byDirectory[directory] = (byDirectory[directory] ?? 0) + issues.length;
}
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  totalViolations: Object.values(byFile).reduce((sum, issues) => sum + issues.length, 0),
  byDirectory,
  byFile,
};

if (process.argv.includes('--write-baseline')) {
  fs.writeFileSync(baselinePath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`✓ Token-usage baseline recorded with ${report.totalViolations} findings`);
  process.exit(0);
}

if (process.argv.includes('--write-report')) fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!fs.existsSync(baselinePath)) throw new Error('Token-usage baseline is missing. Run pnpm tokens:baseline.');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const increases = Object.entries(byFile).filter(([file, issues]) => issues.length > (baseline.byFile?.[file]?.length ?? 0));
if (increases.length || report.totalViolations > baseline.totalViolations) {
  throw new Error(`Ungoverned design-token usage increased: ${increases.map(([file, issues]) => `${file} (${issues.length})`).join(', ')}`);
}
console.log(`✓ Token usage did not increase (${report.totalViolations}/${baseline.totalViolations} baseline findings)`);
