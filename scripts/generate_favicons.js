import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicons() {
  const inputPath = 'public/favicon.png';
  if (!fs.existsSync(inputPath)) {
    console.error('Input file public/favicon.png does not exist.');
    return;
  }

  console.log('Processing favicon.png...');
  const inputBuffer = fs.readFileSync(inputPath);
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  console.log(`Original image: ${metadata.width}x${metadata.height}`);

  // 1. Generate 512x512 optimized main favicon-512.png
  await sharp(inputBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile('public/favicon-512.png');

  // 2. Overwrite main public/favicon.png with 512x512 version (down from 4715x4715 188KB to ~25KB)
  await sharp(inputBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile('public/favicon.png');

  // 3. Generate 192x192 for Google Search and Android PWA
  await image
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile('public/favicon-192.png');

  // 4. Generate 32x32 for Browser Tabs
  await image
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile('public/favicon-32.png');

  // 5. Generate 180x180 for Apple Touch Icon
  await image
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile('public/apple-touch-icon.png');

  // 6. Generate favicon.ico (legacy fallback)
  await image
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFormat('png')
    .toFile('public/favicon.ico');

  console.log('Successfully generated all optimized favicons!');
}

generateFavicons().catch(console.error);
