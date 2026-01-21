#!/usr/bin/env node
/**
 * Script to generate PWA icons and OG image from SVG logo
 * Run: npm run generate-icons
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG files
const iconSvgPath = join(publicDir, 'logo-icon.svg');
const faviconSvgPath = join(publicDir, 'favicon.svg');

let iconSvgContent, faviconSvgContent;

try {
  iconSvgContent = readFileSync(iconSvgPath, 'utf-8');
  console.log('✓ Loaded logo-icon.svg');
} catch {
  // Fallback to favicon.svg if logo-icon.svg doesn't exist
  iconSvgContent = readFileSync(faviconSvgPath, 'utf-8');
  console.log('✓ Loaded favicon.svg (fallback)');
}

faviconSvgContent = readFileSync(faviconSvgPath, 'utf-8');

// Icon sizes to generate
const iconSizes = [192, 512];

async function generateIcons() {
  console.log('\n🎨 Generating MECAI Premium Assets...\n');

  // Generate PNG icons from logo-icon.svg
  for (const size of iconSizes) {
    const outputPath = join(publicDir, `logo-${size}.png`);
    await sharp(Buffer.from(iconSvgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated logo-${size}.png (${size}x${size})`);
  }

  // Generate Apple Touch Icon
  const appleTouchPath = join(publicDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(iconSvgContent))
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('✓ Generated apple-touch-icon.png (180x180)');

  // Generate favicon.ico size
  const favicon32Path = join(publicDir, 'favicon-32.png');
  await sharp(Buffer.from(faviconSvgContent))
    .resize(32, 32)
    .png()
    .toFile(favicon32Path);
  console.log('✓ Generated favicon-32.png (32x32)');

  // Generate Premium OG Image (1200x630)
  await generateOGImage();

  console.log('\n✅ All premium assets generated successfully!');
}

async function generateOGImage() {
  const ogWidth = 1200;
  const ogHeight = 630;
  const logoSize = 160;

  // Create premium dark gradient background
  const ogSvg = `
    <svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background gradient -->
        <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>

        <!-- Text gradient -->
        <linearGradient id="og-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="40%" stop-color="#f43f5e"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>

        <!-- Glow effect -->
        <radialGradient id="og-glow" cx="50%" cy="40%" r="40%">
          <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="${ogWidth}" height="${ogHeight}" fill="url(#og-bg)"/>

      <!-- Subtle grid pattern -->
      <g stroke="#334155" stroke-width="1" opacity="0.1">
        ${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="${ogHeight}"/>`).join('')}
        ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="${ogWidth}" y2="${i * 50}"/>`).join('')}
      </g>

      <!-- Glow effect -->
      <ellipse cx="${ogWidth / 2}" cy="280" rx="400" ry="200" fill="url(#og-glow)"/>

      <!-- MECAI Logo Text -->
      <text
        x="${ogWidth / 2}"
        y="280"
        font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
        font-size="120"
        font-weight="900"
        text-anchor="middle"
        fill="url(#og-text-grad)"
        letter-spacing="-0.03em"
      >MECAI</text>

      <!-- Tagline -->
      <text
        x="${ogWidth / 2}"
        y="360"
        font-family="Inter, sans-serif"
        font-size="36"
        font-weight="600"
        text-anchor="middle"
        fill="#94a3b8"
        letter-spacing="0.05em"
      >TON EXPERT AUTO PAR IA</text>

      <!-- Features -->
      <text
        x="${ogWidth / 2}"
        y="440"
        font-family="Inter, sans-serif"
        font-size="22"
        font-weight="500"
        text-anchor="middle"
        fill="#64748b"
      >Diagnostic Instantané • Analyse Devis • Chat 24/7</text>

      <!-- Badge -->
      <rect x="${(ogWidth - 180) / 2}" y="480" width="180" height="44" rx="22" fill="#f97316" fill-opacity="0.15"/>
      <text
        x="${ogWidth / 2}"
        y="510"
        font-family="Inter, sans-serif"
        font-size="18"
        font-weight="700"
        text-anchor="middle"
        fill="#f97316"
      >DISPONIBLE 2026</text>

      <!-- Bottom decorative line -->
      <rect x="${(ogWidth - 200) / 2}" y="${ogHeight - 20}" width="200" height="4" rx="2" fill="url(#og-text-grad)" opacity="0.6"/>
    </svg>
  `;

  const ogOutputPath = join(publicDir, 'og-image.png');
  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(ogOutputPath);

  console.log(`✓ Generated og-image.png (${ogWidth}x${ogHeight}) - Premium design`);
}

generateIcons().catch(console.error);
