/**
 * Generates PNG icons for PWA manifest using jimp (pure JS, no native deps)
 * Run with: "C:\Program Files\nodejs\node.exe" scripts/generate-icons.mjs
 */
import { createRequire } from "module";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Jimp = require("jimp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

async function drawIcon(size) {
  // Dark green background #003d28
  const image = new Jimp(size, size, 0x003d28ff);

  // Pick font based on size
  let fontTop, fontBottom;
  const fontSize = size >= 256 ? 64 : size >= 128 ? 32 : size >= 64 ? 16 : 8;
  const fontKey = `FONT_SANS_${fontSize}_WHITE`;
  const font = await Jimp.loadFont(Jimp[fontKey]);
  fontTop = font;
  fontBottom = font;

  // "Fair" text - upper area, white (jimp doesn't support arbitrary colors)
  const fairW = Jimp.measureText(fontTop, "Fair");
  const fairH = Jimp.measureTextHeight(fontTop, "Fair", size);
  image.print(fontTop, Math.floor((size - fairW) / 2), Math.floor(size * 0.28), "Fair");

  // Tint "Fair" pixels gold: for each white pixel in the upper region, color it gold
  const fairY = Math.floor(size * 0.28);
  const goldR = 0xff, goldG = 0xb8, goldB = 0x00;
  image.scan(0, fairY, size, Math.floor(fairH * 1.5), function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    // If this pixel is bright (text pixel), tint it gold
    if (r > 100 && g > 100 && b > 100 && a > 100) {
      this.bitmap.data[idx] = goldR;
      this.bitmap.data[idx + 1] = goldG;
      this.bitmap.data[idx + 2] = goldB;
    }
  });

  // "Fare" text - lower area, white
  const fareW = Jimp.measureText(fontBottom, "Fare");
  image.print(fontBottom, Math.floor((size - fareW) / 2), Math.floor(size * 0.54), "Fare");

  return image;
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

for (const size of sizes) {
  const image = await drawIcon(size);
  const outPath = path.join(outDir, `icon-${size}.png`);
  await image.writeAsync(outPath);
  console.log(`✅ icon-${size}.png`);
}
console.log("Done!");
