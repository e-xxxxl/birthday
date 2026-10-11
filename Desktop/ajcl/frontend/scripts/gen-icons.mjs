/**
 * Generate the PWA / favicon assets from public/logo.png.
 *
 *   node scripts/gen-icons.mjs
 *
 * Writes square icons (logo contain-fitted on white) for the manifest, Apple
 * touch icon and favicon. Re-run whenever public/logo.png changes.
 */
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "..", "public");
const SRC = resolve(pub, "logo.png");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function square(size, { pad = 0.12, bg = WHITE, out }) {
  const inner = Math.round(size * (1 - pad * 2));
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(resolve(pub, out));
  console.log(`  ${out}  (${size}x${size})`);
}

console.log("Generating icons from public/logo.png …");
await square(192, { out: "icon-192.png" });
await square(512, { out: "icon-512.png" });
await square(512, { pad: 0.22, out: "icon-512-maskable.png" }); // extra safe-zone
await square(180, { out: "apple-touch-icon.png" });
await sharp(SRC)
  .resize(64, 64, { fit: "contain", background: WHITE })
  .flatten({ background: WHITE })
  .toFile(resolve(pub, "favicon-64.png"))
  .then(() => console.log("  favicon-64.png"));
// favicon.ico — 32px png renamed; browsers accept PNG favicons via <link>.
await square(32, { out: "favicon.png" });
console.log("Done.");
