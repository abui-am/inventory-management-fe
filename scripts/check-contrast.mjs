#!/usr/bin/env node
/**
 * Memeriksa kontras WCAG antar token warna, di tema terang DAN gelap.
 *
 * Dijalankan langsung dari src/styles/tokens.css, jadi begitu sebuah token diubah
 * pemeriksaan ini ikut berubah — syarat AA jadi bisa diuji, bukan sekadar diklaim.
 *
 *   node scripts/check-contrast.mjs
 *
 * Keluar dengan kode 1 kalau ada pasangan yang gagal, supaya bisa dipasang di CI.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

const parseBlock = (selector) => {
  const body = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css)?.[1] ?? '';
  const out = {};
  for (const [, name, h, s, l] of body.matchAll(/--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%;/g)) {
    out[name] = [Number(h), Number(s) / 100, Number(l) / 100];
  }
  return out;
};

const hslToRgb = ([h, s, l]) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][Math.floor(h / 60) % 6];
  return seg.map((v) => v + m);
};

const luminance = (hsl) => {
  const [r, g, b] = hslToRgb(hsl).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// min 4.5 = AA teks normal; 3.0 = AA komponen non-teks / teks non-esensial
const PAIRS = [
  ['foreground', 'background', 4.5, 'teks utama di ground'],
  ['foreground', 'surface', 4.5, 'teks utama di kartu'],
  ['foreground-muted', 'surface', 4.5, 'teks sekunder'],
  ['foreground-subtle', 'surface', 3.0, 'placeholder / meta'],
  ['accent', 'surface', 4.5, 'tautan'],
  ['accent-foreground', 'accent', 4.5, 'teks tombol utama'],
  ['success', 'success-subtle', 4.5, 'pill kredit'],
  ['warning', 'warning-subtle', 4.5, 'pill menunggu'],
  ['destructive', 'destructive-subtle', 4.5, 'pill gagal'],
  ['info', 'info-subtle', 4.5, 'pill ditinjau'],
  ['success', 'surface', 4.5, 'angka kredit'],
  ['destructive', 'surface', 4.5, 'angka debit'],
  ['warning', 'surface', 4.5, 'teks peringatan'],
  ['ring', 'background', 3.0, 'ring fokus'],
];

let failed = 0;
for (const [label, selector] of [['TERANG', ':root'], ['GELAP', '\\.dark']]) {
  const t = parseBlock(selector);
  console.log(`\n== ${label} ==`);
  for (const [fg, bg, min, note] of PAIRS) {
    if (!t[fg] || !t[bg]) {
      console.log(`  LEWAT  token hilang: ${fg} / ${bg}`);
      continue;
    }
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failed += 1;
    console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} / ${bg} — ${note}`);
  }
}

console.log(failed === 0 ? '\nSemua pasangan lolos WCAG AA.' : `\n${failed} pasangan GAGAL.`);
process.exit(failed === 0 ? 0 : 1);
