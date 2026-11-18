#!/usr/bin/env node
// Builds the MWSS RO · Water Efficiency Program lockup for the site from the official artwork
// (assets/brand/mwss-ro-wep-logo.png, dark text on white):
//
//   node scripts/make-brand-art.mjs
//
// - public/brand/lockup.png      the lockup for dark (ocean) backgrounds: transparent, with "MWSS" and
//                                "WATER EFFICIENCY PROGRAM" in white and "RO" in gold
// - public/brand/layers/*.png    the same lockup cut into pieces (the drop's three parts, the MWSS seal,
//                                each letter of MWSS and RO, the two text lines) for the splash animation
// - lib/brand-layers.ts          where each piece sits in the lockup, in % (generated — don't edit)
// - public/email/lockup.png      the lockup sized for the confirmation email
// - public/brand/og.png          the original artwork, for link previews
//
// Uses sharp, which Next.js installs alongside itself. Run it again if the artwork changes.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets', 'brand', 'mwss-ro-wep-logo.png');
const OUT = join(ROOT, 'public', 'brand');
mkdirSync(join(OUT, 'layers'), { recursive: true });
mkdirSync(join(ROOT, 'public', 'email'), { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const at = (x, y) => (y * W + x) * 3;
/** How far a pixel is from the white paper (0 = white). */
const ink = (x, y) => {
  const i = at(x, y);
  return 255 - Math.min(data[i], data[i + 1], data[i + 2]);
};

// ---------------------------------------------------------------- where things are

const SEAL = { cx: 449, cy: 713, r: 156.5 }; // the MWSS seal
const TEXT_X = 620; // the wordmark starts right of the mark
const BANDS = {
  mwss: [566, 715],
  ro: [716, 1010],
  line1: [1050, 1105],
  line2: [1118, 1172],
};

/** The column with the least ink between two letters that touch at their serifs. */
function splitColumn([y0, y1], xa, xb) {
  let best = xa;
  let min = Infinity;
  for (let x = xa; x <= xb; x++) {
    let c = 0;
    for (let y = y0; y <= y1; y++) if (ink(x, y) > 24) c++;
    if (c < min) {
      min = c;
      best = x;
    }
  }
  return best;
}
/** Runs of columns with ink in a band (letters that don't touch). */
function columnRuns([y0, y1], xa, xb) {
  const runs = [];
  let start = -1;
  for (let x = xa; x <= xb + 1; x++) {
    let has = false;
    if (x <= xb) for (let y = y0; y <= y1 && !has; y++) has = ink(x, y) > 24;
    if (has && start < 0) start = x;
    if (!has && start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  }
  return runs;
}

const mwssRuns = columnRuns(BANDS.mwss, TEXT_X, W - 1); // [M+W touching], S, S
const mwSplit = splitColumn(BANDS.mwss, 740, 880);
const roSplit = splitColumn(BANDS.ro, 830, 960);
const [mwRun, s1Run, s2Run] = mwssRuns;
if (!s2Run) throw new Error(`Expected M W S S in the wordmark, found ${JSON.stringify(mwssRuns)}`);

// ---------------------------------------------------------------- the mark: three parts of the drop

// Solid cores of the mark (outside the seal), labelled by connected region.
const LABEL = new Int16Array(W * H).fill(-1);
const insideSeal = (x, y) => Math.hypot(x - SEAL.cx, y - SEAL.cy) <= SEAL.r + 3;
const comps = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < TEXT_X; x++) {
    const p = y * W + x;
    if (LABEL[p] !== -1 || insideSeal(x, y) || ink(x, y) <= 40) continue;
    const id = comps.length;
    const stack = [p];
    LABEL[p] = id;
    let n = 0;
    let sx = 0;
    let sy = 0;
    while (stack.length) {
      const q = stack.pop();
      const qx = q % W;
      const qy = (q - qx) / W;
      n++;
      sx += qx;
      sy += qy;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + dx;
        const ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= TEXT_X || ny >= H) continue;
        const np = ny * W + nx;
        if (LABEL[np] !== -1 || insideSeal(nx, ny) || ink(nx, ny) <= 40) continue;
        LABEL[np] = id;
        stack.push(np);
      }
    }
    comps.push({ id, n, cx: sx / n, cy: sy / n });
  }
}
const big = comps.filter((c) => c.n > 2000);
if (big.length !== 3) throw new Error(`Expected the drop's 3 parts, found ${big.length}`);
// Name them by colour at their centre of mass... and position: sky is top-left, navy is right, gold is the rest.
const sky = big.reduce((a, b) => (a.cx + a.cy < b.cx + b.cy ? a : b));
const navy = big.filter((c) => c !== sky).reduce((a, b) => (a.cx > b.cx ? a : b));
const gold = big.find((c) => c !== sky && c !== navy);
const markName = new Map([
  [sky.id, 'sky'],
  [navy.id, 'navy'],
  [gold.id, 'gold'],
]);

// Grow each part outwards over its soft (anti-aliased) edge, so edges stay smooth.
const owner = new Int16Array(W * H).fill(-1);
let frontier = [];
for (let p = 0; p < W * H; p++) {
  if (LABEL[p] >= 0 && markName.has(LABEL[p])) {
    owner[p] = LABEL[p];
    frontier.push(p);
  }
}
for (let step = 0; step < 6 && frontier.length; step++) {
  const next = [];
  for (const q of frontier) {
    const qx = q % W;
    const qy = (q - qx) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = qx + dx;
      const ny = qy + dy;
      if (nx < 0 || ny < 0 || nx >= TEXT_X || ny >= H) continue;
      const np = ny * W + nx;
      if (owner[np] !== -1 || insideSeal(nx, ny) || ink(nx, ny) <= 4) continue;
      owner[np] = owner[q];
      next.push(np);
    }
  }
  frontier = next;
}

// ---------------------------------------------------------------- painting the pieces

const GOLD_TEXT = (() => {
  // The flat gold of "RO": average of its solid pixels.
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = BANDS.ro[0]; y <= BANDS.ro[1]; y++) {
    for (let x = TEXT_X; x < W; x++) {
      const i = at(x, y);
      if (data[i + 2] < 70) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
})();
const NAVY_MIN = 29; // darkest channel of the navy text, so solid navy → fully opaque

/** RGBA for one pixel of the dark-background lockup, and which piece it belongs to. */
function paint(x, y) {
  const i = at(x, y);
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const d = 255 - Math.min(r, g, b);

  // The seal keeps its own white details; only its rim fades into the background.
  const dist = Math.hypot(x - SEAL.cx, y - SEAL.cy);
  if (dist <= SEAL.r + 1.5 && x < TEXT_X) {
    const rim = Math.min(1, Math.max(0, SEAL.r + 0.5 - dist + 1));
    const a = dist > SEAL.r - 6 ? Math.min(rim, Math.min(1, d / 120)) : 1;
    return a > 0 ? { piece: 'seal', rgba: unblend(r, g, b, a) } : null;
  }

  if (x < TEXT_X) {
    const o = owner[y * W + x];
    if (o < 0 || d <= 4) return null;
    const a = Math.min(1, (d - 4) / 44);
    return { piece: markName.get(o), rgba: unblend(r, g, b, a) };
  }

  // Wordmark: white (or gold) letters, alpha from how much ink the pixel holds.
  if (d <= 6) return null;
  if (y >= BANDS.ro[0] && y <= BANDS.ro[1]) {
    const a = Math.min(1, (255 - b) / (255 - GOLD_TEXT[2]));
    return { piece: x < roSplit ? 'R' : 'O', rgba: [...GOLD_TEXT, a] };
  }
  const a = Math.min(1, d / (255 - NAVY_MIN));
  if (y >= BANDS.mwss[0] && y <= BANDS.mwss[1]) {
    const piece = x < mwSplit ? 'M' : x <= mwRun[1] ? 'W' : x <= s1Run[1] + 6 ? 'S1' : 'S2';
    return { piece, rgba: [255, 255, 255, a] };
  }
  if (y >= BANDS.line1[0] && y <= BANDS.line1[1]) return { piece: 'line1', rgba: [255, 255, 255, a] };
  if (y >= BANDS.line2[0] && y <= BANDS.line2[1]) return { piece: 'line2', rgba: [255, 255, 255, a] };
  return null;
}

/** The colour a pixel had before it was blended with the white paper at opacity a. */
function unblend(r, g, b, a) {
  if (a >= 1) return [r, g, b, 1];
  const f = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)));
  return [f(r), f(g), f(b), a];
}

// ---------------------------------------------------------------- write everything

const PAD = 8;
let bx0 = W;
let by0 = H;
let bx1 = 0;
let by1 = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (ink(x, y) > 24) {
      bx0 = Math.min(bx0, x);
      by0 = Math.min(by0, y);
      bx1 = Math.max(bx1, x);
      by1 = Math.max(by1, y);
    }
  }
}
const box = { x: bx0 - PAD, y: by0 - PAD, w: bx1 - bx0 + 1 + PAD * 2, h: by1 - by0 + 1 + PAD * 2 };

const composite = Buffer.alloc(box.w * box.h * 4);
const pieces = new Map(); // name → { x0, y0, x1, y1, pixels: [[x, y, rgba]] }
for (let y = box.y; y < box.y + box.h; y++) {
  for (let x = box.x; x < box.x + box.w; x++) {
    const p = paint(x, y);
    if (!p) continue;
    const [r, g, b, a] = p.rgba;
    const o = ((y - box.y) * box.w + (x - box.x)) * 4;
    composite[o] = r;
    composite[o + 1] = g;
    composite[o + 2] = b;
    composite[o + 3] = Math.round(a * 255);
    let s = pieces.get(p.piece);
    if (!s) pieces.set(p.piece, (s = { x0: x, y0: y, x1: x, y1: y, pixels: [] }));
    s.x0 = Math.min(s.x0, x);
    s.y0 = Math.min(s.y0, y);
    s.x1 = Math.max(s.x1, x);
    s.y1 = Math.max(s.y1, y);
    s.pixels.push([x, y, composite.subarray(o, o + 4)]);
  }
}

const png = (buf, w, h) => sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9, palette: false });
await png(composite, box.w, box.h).toFile(join(OUT, 'lockup.png'));
await png(composite, box.w, box.h).resize({ width: 440 }).toFile(join(ROOT, 'public', 'email', 'lockup.png'));
await sharp(SRC).png({ compressionLevel: 9 }).toFile(join(OUT, 'og.png'));

const ORDER = ['sky', 'gold', 'navy', 'seal', 'M', 'W', 'S1', 'S2', 'R', 'O', 'line1', 'line2'];
const manifest = [];
for (const name of ORDER) {
  const s = pieces.get(name);
  if (!s) throw new Error(`Missing piece ${name}`);
  const w = s.x1 - s.x0 + 1;
  const h = s.y1 - s.y0 + 1;
  const buf = Buffer.alloc(w * h * 4);
  for (const [x, y, rgba] of s.pixels) buf.set(rgba, ((y - s.y0) * w + (x - s.x0)) * 4);
  const file = `${name.toLowerCase()}.png`;
  await png(buf, w, h).toFile(join(OUT, 'layers', file));
  const pct = (v) => Math.round(v * 10000) / 100;
  manifest.push({
    name,
    src: `/brand/layers/${file}`,
    left: pct((s.x0 - box.x) / box.w),
    top: pct((s.y0 - box.y) / box.h),
    width: pct(w / box.w),
    height: pct(h / box.h),
  });
}

const ts = `// Generated by scripts/make-brand-art.mjs — don't edit by hand; run the script again instead.
// Where each piece of the MWSS RO · Water Efficiency Program lockup sits, in % of the lockup box.

export const LOCKUP = { src: '/brand/lockup.png', width: ${box.w}, height: ${box.h} } as const;

export const LAYERS = ${JSON.stringify(manifest, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")} as const;

export type LayerName = (typeof LAYERS)[number]['name'];
`;
writeFileSync(join(ROOT, 'lib', 'brand-layers.ts'), ts);

console.log(`Lockup ${box.w}×${box.h}; pieces: ${manifest.map((m) => m.name).join(', ')}; gold ${GOLD_TEXT.join(',')}; splits M|W at ${mwSplit}, R|O at ${roSplit}.`);
