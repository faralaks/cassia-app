/**
 * Generates iOS launch-screen (apple-touch-startup-image) PNGs into
 * public/res/splash/ — one light and one dark variant per device size, solid
 * theme background with the app logo centered.
 *
 * iOS only shows a startup image whose pixel size exactly matches the device,
 * so there is one image per known iPhone screen. The matching <link> tags live
 * in index.html; when adding a new device size here, add the tags there too.
 *
 * Colors mirror the themes' Background.Container: folds lightTheme (#F2F2F2)
 * and darkTheme in src/colors.css.ts (#1A1A1A). Re-run after changing either:
 *   npm run generate:splash
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/res/splash');
const LOGO = path.resolve('public/res/android/android-chrome-512x512.png');

const THEMES = {
  light: '#F2F2F2', // folds lightTheme Background.Container
  dark: '#1A1A1A', // darkTheme Background.Container (src/colors.css.ts)
};

// Portrait device sizes: [logical width, logical height, device-pixel-ratio].
// Covers iPhone SE (1st gen) through the iPhone 16/17 generation incl. Air.
const DEVICES = [
  [320, 568, 2],
  [375, 667, 2],
  [414, 736, 3],
  [375, 812, 3],
  [414, 896, 2],
  [414, 896, 3],
  [390, 844, 3],
  [428, 926, 3],
  [393, 852, 3],
  [430, 932, 3],
  [402, 874, 3],
  [420, 912, 3],
  [440, 956, 3],
];

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

for (const [w, h, ratio] of DEVICES) {
  const pw = w * ratio;
  const ph = h * ratio;
  // Same proportion as a native app icon on the launch screen: ~25% of width.
  const logoSize = Math.round(pw * 0.25);
  // eslint-disable-next-line no-await-in-loop
  const logo = await sharp(LOGO).resize(logoSize, logoSize).png().toBuffer();

  for (const [theme, background] of Object.entries(THEMES)) {
    const file = path.join(OUT_DIR, `splash-${theme}-${pw}x${ph}.png`);
    // eslint-disable-next-line no-await-in-loop
    await sharp({
      create: { width: pw, height: ph, channels: 3, background },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(file);
  }
  console.log(`generated ${pw}x${ph} (light+dark)`);
}

console.log(`done → ${OUT_DIR}`);
