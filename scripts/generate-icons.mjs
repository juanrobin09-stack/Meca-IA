#!/usr/bin/env node
/**
 * Script to generate PWA icons and OG image from SVG logo
 * Run: npm run generate-icons
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG file
const svgPath = join(publicDir, 'favicon.svg');
const svgContent = readFileSync(svgPath, 'utf-8');

// Icon sizes to generate
const iconSizes = [192, 512];

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  // Generate PNG icons
  for (const size of iconSizes) {
    const outputPath = join(publicDir, `logo-${size}.png`);
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated logo-${size}.png`);
  }

  // Generate OG image (1200x630 with logo centered)
  const ogWidth = 1200;
  const ogHeight = 630;
  const logoSize = 200;

  // Create background with gradient-like effect using blue color
  const background = await sharp({
    create: {
      width: ogWidth,
      height: ogHeight,
      channels: 4,
      background: { r: 59, g: 130, b: 246, alpha: 1 } // #3B82F6
    }
  }).png().toBuffer();

  // Resize logo
  const logoBuffer = await sharp(Buffer.from(svgContent))
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  // Create text overlay SVG
  const textOverlay = `
    <svg width="${ogWidth}" height="${ogHeight}">
      <style>
        .title { fill: white; font-family: Arial, sans-serif; font-weight: bold; }
        .subtitle { fill: rgba(255,255,255,0.9); font-family: Arial, sans-serif; }
      </style>
      <text x="${ogWidth/2}" y="${ogHeight/2 + 60}" class="title" font-size="72" text-anchor="middle">MECAI</text>
      <text x="${ogWidth/2}" y="${ogHeight/2 + 120}" class="subtitle" font-size="32" text-anchor="middle">Diagnostic Auto par IA</text>
    </svg>
  `;

  // Composite everything
  const ogOutputPath = join(publicDir, 'og-image.png');
  await sharp(background)
    .composite([
      {
        input: logoBuffer,
        top: Math.round((ogHeight - logoSize) / 2 - 80),
        left: Math.round((ogWidth - logoSize) / 2)
      },
      {
        input: Buffer.from(textOverlay),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile(ogOutputPath);

  console.log(`✓ Generated og-image.png (${ogWidth}x${ogHeight})`);

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
