import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets', 'masters', 'rama-dubai-residential-cityscape-8k.jpg');
const output = path.join(root, 'public', 'images');
const desktop = [1280, 1920, 2560];
const mobile = [720, 1080, 1440];

async function render(width, aspect, label) {
  const height = Math.round(width / aspect);
  const pipeline = sharp(source)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toColourspace('srgb');
  await Promise.all([
    pipeline.clone().avif({ quality: 55, effort: 6, chromaSubsampling: '4:2:0' }).toFile(path.join(output, `rama-dubai-residential-cityscape-${label}-${width}.avif`)),
    pipeline.clone().webp({ quality: 78, effort: 6 }).toFile(path.join(output, `rama-dubai-residential-cityscape-${label}-${width}.webp`)),
  ]);
}

if (!fs.existsSync(source)) throw new Error(`Missing image master: ${source}`);
fs.mkdirSync(output, { recursive: true });
for (const width of desktop) await render(width, 16 / 9, 'hero');
for (const width of mobile) await render(width, 3 / 4, 'mobile');

const rightsPath = path.join(root, 'docs', 'PUBLIC_ASSET_RIGHTS.json');
const rights = JSON.parse(fs.readFileSync(rightsPath, 'utf8'));
rights.assets = rights.assets.filter((asset) => !/rama-dubai-residential-cityscape-(?:hero|mobile)(?:\.|-)/.test(asset.path));
const records = [];
for (const [label, widths] of [['hero', desktop], ['mobile', mobile]]) {
  for (const width of widths) {
    for (const format of ['avif', 'webp']) {
      const relativePath = `public/images/rama-dubai-residential-cityscape-${label}-${width}.${format}`;
      const bytes = fs.readFileSync(path.join(root, relativePath));
      const mobileCrop = label === 'mobile';
      records.push({
        path: relativePath,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        bytes: bytes.byteLength,
        kind: `illustrative_dubai_residential_cityscape_${label}_${width}_${format}`,
        runtimeSurfaces: [`/[locale] centered cinematic hero ${mobileCrop ? 'at 700px and below' : 'above 700px'}`],
        ownershipBasis: 'generated_for_rama_with_openai_image_tool_2026-08-24; deterministic derivative from 8K archival master',
        documentaryProof: 'Codex task generation record 01a026d0-8614-7fe2-8156-13dff29e51cb',
        legalReview: 'pending',
        productionEligibility: 'blocked_pending_legal_review',
        cropRule: mobileCrop
          ? 'Preserve the inhabited terrace facade and a readable slice of skyline; never present the scene as a listing or named development.'
          : 'Preserve the foreground residential terraces and Dubai skyline context; maintain central negative space for copy and never present the scene as a listing or named development.',
        localizedAlternativeText: mobileCrop
          ? { en: 'Illustrative close view of a planted Dubai residence with the evening skyline beyond', ar: 'منظر توضيحي قريب لمسكن مزروع في دبي مع أفق المدينة المسائي في الخلفية' }
          : { en: 'Illustrative blue-hour Dubai residences with planted terraces and a distant city skyline', ar: 'مساكن توضيحية في دبي عند الساعة الزرقاء مع شرفات مزروعة وأفق المدينة البعيد' },
        accessibilityTreatment: 'empty alternative text because the image is decorative; the adjacent localized disclosure states that it is illustrative and not inventory',
        derivativeSettings: format === 'avif'
          ? 'sRGB; metadata stripped; AVIF quality 55; effort 6; chroma 4:2:0'
          : 'sRGB; metadata stripped; WebP quality 78; effort 6',
      });
    }
  }
}
rights.assets.unshift(...records);
rights.updatedAt = new Date().toISOString();
fs.writeFileSync(rightsPath, `${JSON.stringify(rights, null, 2)}\n`);
console.log('✓ Generated deterministic hero derivatives and refreshed the public asset-rights register');
