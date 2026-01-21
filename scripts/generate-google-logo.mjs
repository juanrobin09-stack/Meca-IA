#!/usr/bin/env node
/**
 * Script to generate Google OAuth logo (120x120) from SVG logo
 * Run: node scripts/generate-google-logo.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG file
const iconSvgPath = join(publicDir, 'logo-icon.svg');

let iconSvgContent;

try {
  iconSvgContent = readFileSync(iconSvgPath, 'utf-8');
  console.log('✓ Loaded logo-icon.svg');
} catch {
  console.error('✗ Could not find logo-icon.svg');
  process.exit(1);
}

async function generateGoogleLogo() {
  console.log('\n🎨 Generating Google OAuth Logo (120x120)...\n');

  const outputPath = join(publicDir, 'google-oauth-logo.png');

  await sharp(Buffer.from(iconSvgContent))
    .resize(120, 120)
    .png()
    .toFile(outputPath);

  console.log('✓ Generated google-oauth-logo.png (120x120)');
  console.log('\n✅ Logo ready for Google Cloud Console!');
  console.log('   Upload this file to: Google Cloud Console → OAuth consent screen → App logo');
  console.log(`   Path: ${outputPath}`);
}

generateGoogleLogo().catch(console.error);
