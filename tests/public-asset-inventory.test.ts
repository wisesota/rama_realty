import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { deployablePublicMedia } from "../scripts/public-asset-inventory.mjs";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("deployable public media inventory", () => {
  it("includes media surfaces but excludes generated registry JSON", async () => {
    const publicRoot = await mkdtemp(join(tmpdir(), "rama-public-assets-"));
    temporaryRoots.push(publicRoot);
    for (const directory of ["images", "lottie", "rive", "r"]) {
      await mkdir(join(publicRoot, directory), { recursive: true });
    }
    await writeFile(join(publicRoot, "images", "hero.webp"), "image");
    await writeFile(join(publicRoot, "lottie", "signal.json"), "{}");
    await writeFile(join(publicRoot, "rive", "voice.riv"), "rive");
    await writeFile(join(publicRoot, "r", "component.json"), "{}");

    expect(await deployablePublicMedia(publicRoot)).toEqual([
      "public/images/hero.webp",
      "public/lottie/signal.json",
      "public/rive/voice.riv",
    ]);
  });
});
