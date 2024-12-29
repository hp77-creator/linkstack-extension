import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    // Convert SVG to PNG using sharp
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted ${path.basename(svgPath)} to ${path.basename(pngPath)}`);
  } catch (error) {
    console.error(`Error converting ${path.basename(svgPath)}:`, error);
  }
}

async function convertAllIcons() {
  const sizes = [16, 48, 128];
  const iconsDir = path.join(__dirname, '../icons');

  // Ensure icons directory exists
  try {
    await fs.access(iconsDir);
  } catch {
    await fs.mkdir(iconsDir, { recursive: true });
  }

  // Convert each size
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);
    await convertSvgToPng(svgPath, pngPath, size);
  }
}

// Run conversion
convertAllIcons().catch(console.error);
