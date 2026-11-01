import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

// Master brand icon exports are derived from the approved Kiwi Gardeners .com logo.
// Keep both versioned paths (cache busting) and old aliases (legacy browser requests).
const versions = [
  ["favicon-32-v2.png", "favicon-32-v2.png"],
  ["favicon-32-v2.png", "favicon-32.png"],
  ["apple-touch-icon-v2.png", "apple-touch-icon-v2.png"],
  ["apple-touch-icon-v2.png", "apple-touch-icon.png"],
  ["icon-192-v2.png", "icon-192-v2.png"],
  ["icon-192-v2.png", "icon-192.png"],
  ["icon-512-v2.png", "icon-512-v2.png"],
  ["icon-512-v2.png", "icon-512.png"],
  ["icon-maskable-512-v2.png", "icon-maskable-512-v2.png"],
  ["favicon.ico", "favicon.ico"]
];

export async function writeIconSet(distDir) {
  for (const [source, output] of versions) {
    const dest = join(distDir, output);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(join("assets", "brand", source), dest);
  }
}
