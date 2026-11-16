#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Códigos de color ANSI para la terminal
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function getJsFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

// -------- Cargar archivos fuente --------
const css = readFile('www/css/styles.css');
const html = readFile('www/index.html');
const jsFiles = getJsFiles('www/js');
const jsAll = jsFiles.map(f => readFile(f)).join('\n');
const cssJs = css + '\n' + jsAll;

// CSS sin comentarios (para parseo de tokens y variables)
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

// -------- Criterio 1: undefined-tokens --------
// Tokens definidos dentro del bloque :root
const rootMatch = cssNoComments.match(/:root\s*\{([\s\S]*?)\}/);
const definedTokens = new Set();
if (rootMatch) {
  const declRe = /--([\w-]+)\s*:/g;
  let m;
  while ((m = declRe.exec(rootMatch[1])) !== null) {
    definedTokens.add(m[1]);
  }
}

// Todas las referencias var(--xxx) en CSS + JS
const varRe = /var\(--([\w-]+)/g;
const undefinedTokens = {};
let vm;
while ((vm = varRe.exec(cssJs)) !== null) {
  const token = vm[1];
  if (!definedTokens.has(token)) {
    undefinedTokens[token] = (undefinedTokens[token] || 0) + 1;
  }
}
const undefinedTotal = Object.values(undefinedTokens).reduce((a, b) => a + b, 0);

// -------- Criterio 2: brown-remnants --------
const brownRe = /212,\s*163,\s*115/g;
const brownCount = (css.match(brownRe) || []).length;

// -------- Criterio 3: removed-aliases --------
const aliases = [
  'accent', 'text-secondary', 'text-high', 'border-default',
  'c-success', 'c-warning', 'c-danger', 'c-info', 'theme-color'
];
const aliasDetails = {};
let aliasTotal = 0;
for (const alias of aliases) {
  const re = new RegExp('var\\(--' + alias + '\\)', 'g');
  const matches = (cssJs.match(re) || []).length;
  aliasDetails[alias] = matches;
  aliasTotal += matches;
}

// -------- Criterio 4: var(--radius) (exacto, no --radius-md etc.) --------
const radiusRe = /var\(--radius(?![\w-])/g;
const radiusCount = (cssJs.match(radiusRe) || []).length;

// -------- Criterio 5: small-fonts (font-size < 12px) --------
const fontSizeRe = /font-size:\s*([\d.]+)(px|rem)/gi;
const smallFonts = [];
let fm;
while ((fm = fontSizeRe.exec(cssNoComments)) !== null) {
  const val = parseFloat(fm[1]);
  const unit = fm[2];
  const px = unit === 'rem' ? val * 16 : val;
  if (px < 12) {
    smallFonts.push({ raw: fm[0], value: fm[1] + unit, px });
  }
}

// -------- Criterio 6: fixed-heights (height: XXpx con XX >= 40) --------
const heightRe = /height:\s*(\d+)px/g;
const fixedHeights = [];
let hm;
while ((hm = heightRe.exec(cssNoComments)) !== null) {
  const val = parseInt(hm[1], 10);
  if (val >= 40) {
    fixedHeights.push(val);
  }
}

// -------- Criterio 7: bg-surface-defined --------
const bgSurfaceDefined = /^--bg-surface:/m.test(css);

// -------- Criterio 8: zoom-blocked --------
const zoomBlocked = /maximum-scale|user-scalable=no/i.test(html);

// -------- Criterio 9: theme-color --------
const themeColorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
const themeColorValue = themeColorMatch ? themeColorMatch[1] : '(no encontrada)';

// -------- Criterio 10: utility-hex --------
const textGreyBlock = css.match(/\.text-grey\s*\{[\s\S]*?\}/);
const textLimeBlock = css.match(/\.text-lime\s*\{[\s\S]*?\}/);
const textGreyColor = textGreyBlock ? textGreyBlock[0].match(/color:\s*([^;}]+)/) : null;
const textLimeColor = textLimeBlock ? textLimeBlock[0].match(/color:\s*([^;}]+)/) : null;
const textGreyHex = textGreyColor ? /^\s*#/.test(textGreyColor[1]) : null;
const textLimeHex = textLimeColor ? /^\s*#/.test(textLimeColor[1]) : null;

// -------- Imprimir informe --------
const line = '========================================';
console.log(line);
console.log('  VERIFICADOR DE TOKENS — Estado inicial');
console.log(line);
console.log();

function show(name, actual, expected) {
  console.log(`${BOLD}${name}:${RESET} ${RED}${actual}${RESET}  (esperado: ${expected})`);
}

show('undefined-tokens', undefinedTotal, '0');
for (const [token, count] of Object.entries(undefinedTokens)) {
  console.log(`   ${DIM}--${token}: ${count} referencia(s) sin definir en :root${RESET}`);
}

show('brown-remnants', brownCount, '0');

show('removed-aliases', aliasTotal, '0');
for (const [alias, count] of Object.entries(aliasDetails)) {
  if (count > 0) {
    console.log(`   ${DIM}var(--${alias}): ${count}${RESET}`);
  }
}

show('var(--radius)', radiusCount, '0');

show('small-fonts', smallFonts.length, '0');
for (const f of smallFonts) {
  console.log(`   ${DIM}${f.raw} (${f.px}px)${RESET}`);
}

show('fixed-heights', fixedHeights.length, '0');
for (const h of fixedHeights) {
  console.log(`   ${DIM}height: ${h}px${RESET}`);
}

show('bg-surface-defined', bgSurfaceDefined ? 'SÍ' : 'NO', 'SÍ');
show('zoom-blocked', zoomBlocked ? 'SÍ' : 'NO', 'NO');
show('theme-color', themeColorValue, '#CCFF00');

const utilBothHex = textGreyHex === true && textLimeHex === true;
const utilBothVar = textGreyHex === false && textLimeHex === false;
const utilStatus = utilBothHex ? 'hex' : utilBothVar ? 'var()' : 'mixto';
show('utility-hex', utilStatus, 'var()');
console.log(`   ${DIM}.text-grey: ${textGreyHex ? 'hex' : 'var()'}${RESET}`);
console.log(`   ${DIM}.text-lime: ${textLimeHex ? 'hex' : 'var()'}${RESET}`);

console.log();
console.log('Todos los valores se muestran en rojo porque reflejan el estado');
console.log('actual (antes de aplicar los cambios de la Fase 1).');
