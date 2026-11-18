#!/usr/bin/env node
// Builds the images the confirmation email uses into public/email (mail apps don't show SVG):
// the four detail icons and the wave under the header. (The logo, public/email/lockup.png, comes
// from scripts/make-brand-art.mjs.)
//
//   node scripts/make-email-art.mjs
//
// Uses sharp, which Next.js installs alongside itself. Run it again after changing the icons.

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'email');
mkdirSync(OUT, { recursive: true });

// Detail icons: the site's line icons in white on an ocean-blue drop of colour, 40 px shown (80 px file).
const ICONS = {
  'icon-calendar': '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M16 3v3M8 3v3M3 9.5h18"/>',
  'icon-clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'icon-pin': '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'icon-scan':
    '<path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16"/><rect x="7" y="7" width="4" height="4" rx="0.6"/><rect x="13" y="13" width="4" height="4" rx="0.6"/><path d="M13 7h4v2M7 15v2h2"/>',
};
for (const [name, paths] of Object.entries(ICONS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22b8e8"/><stop offset="0.55" stop-color="#0a6fc2"/><stop offset="1" stop-color="#04407f"/></linearGradient></defs>
  <rect width="80" height="80" rx="24" fill="url(#g)"/>
  <circle cx="64" cy="16" r="5" fill="#fdc500"/>
  <g transform="translate(20 20) scale(1.6667)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(OUT, `${name}.png`));
}

// The wave where the ocean-blue header meets the white card (transparent above the wave).
const wave = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="72" viewBox="0 0 1200 72" preserveAspectRatio="none">
  <path d="M0 40 C 200 6 400 6 600 40 S 1000 74 1200 40 V72 H0 Z" fill="#5fd3f3" fill-opacity="0.35"/>
  <path d="M0 52 C 200 22 400 22 600 50 S 1000 78 1200 50 V72 H0 Z" fill="#ffffff"/>
</svg>`;
await sharp(Buffer.from(wave)).png({ compressionLevel: 9 }).toFile(join(OUT, 'wave.png'));

console.log('Email images written to public/email.');
