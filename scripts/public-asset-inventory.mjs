import { readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const deployableRoots = [
  { directory: "images", extension: /\.(?:avif|gif|jpe?g|png|svg|webp)$/i },
  { directory: "lottie", extension: /\.json$/i },
  { directory: "rive", extension: /\.riv$/i },
  { directory: "video", extension: /\.(?:mp4|webm)$/i },
  { directory: "videos", extension: /\.(?:mp4|webm)$/i },
];

async function walk(directory, extension, results, publicRoot) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path, extension, results, publicRoot);
    else if (extension.test(entry.name)) {
      results.push(`public/${relative(publicRoot, path).split(sep).join("/")}`);
    }
  }
}

export async function deployablePublicMedia(publicRoot = resolve(process.cwd(), "public")) {
  const results = [];
  for (const root of deployableRoots) {
    await walk(join(publicRoot, root.directory), root.extension, results, publicRoot);
  }
  return results.sort();
}
