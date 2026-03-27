import { GameConfig } from '../config/GameConfig.js';

export function el(id) {
  return document.getElementById(id);
}

export function show(id) {
  el(id).style.display = 'flex';
}

export function hide(id) {
  el(id).style.display = 'none';
}

export function setText(id, v) {
  const e = el(id);
  if (e) e.textContent = v;
}

export function rnd(n) {
  return Math.floor(Math.random() * n);
}

export function rndF(a, b) {
  return a + Math.random() * (b - a);
}

export function shuffle(a) {
  const b = a.slice();
  let i;
  let j;
  let t;
  for (i = b.length - 1; i > 0; i--) {
    j = rnd(i + 1);
    t = b[i];
    b[i] = b[j];
    b[j] = t;
  }
  return b;
}

/** @param {number} n @param {string} [locale='ru-RU'] */
export function fmt(n, locale = 'ru-RU') {
  return Math.round(n).toLocaleString(locale);
}

export function fmtK(n) {
  const r = Math.round(n);
  if (r >= 1_000_000) return (r / 1_000_000).toFixed(1) + 'M';
  if (r >= 1000) return Math.round(r / 1000) + 'k';
  return String(r);
}

/** Цвет индикатора населения по доле от MAX_POP */
export function popCol(p) {
  const r = p / GameConfig.MAX_POP;
  if (r > 0.7) return '#8A9A5B';
  if (r > 0.3) return '#C4A84A';
  return '#D65108';
}
