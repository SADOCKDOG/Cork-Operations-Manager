const fs = require('fs');
const path = require('path');
process.chdir('C:/Users/yo/repo/pesadas-corcho');

const files = [
  'www/css/styles.css',
  'www/index.html',
  'www/js/ui/dashboard-ui.js',
  'www/js/ui/pesadas-ui.js',
  'www/js/ui/zonas-ui.js',
  'www/js/ui/reportes-ui.js',
  'www/js/ui/fincas-ui.js',
  'www/js/ui/gastos-ui.js',
  'www/js/core/utils.js',
];

const toks = [
  '--p-cork','--p-cork-dark','--accent','--bg','--bg-deep','--surface','--surface-light',
  '--surface-glass','--text-p','--text-s','--text-secondary','--text-muted','--text-high',
  '--border','--border-default','--border-subtle','--success','--c-success','--warning',
  '--c-warning','--danger','--c-danger','--info','--c-info','--danger-bg','--success-bg',
  '--warning-bg','--info-bg','--color-metric-primary','--color-metric-warning',
  '--color-metric-danger','--color-metric-info','--radius','--radius-sm','--radius-md',
  '--radius-lg','--radius-xl','--radius-full','--touch-min','--tap-gap','--shadow-md',
  '--safe-top','--safe-bottom','--theme-color','--bg-surface','--neon-color','--card-color',
  '--metric-line','--metric-accent','--neon-glow','--neon-inner',
];

const cache = {};
for (const f of files) cache[f] = fs.readFileSync(f, 'utf8');

console.log('TOKEN'.padEnd(26) + 'css'.padStart(6) + 'html'.padStart(6) + 'js'.padStart(6));
for (const t of toks) {
  const re = new RegExp('var\\(' + t.replace(/-/g, '\\-') + '\\s*[,)]', 'g');
  const counts = files.map(f => (cache[f].match(re) || []).length);
  if (counts.some(x => x > 0)) {
    const js = counts.slice(2).reduce((a, b) => a + b, 0);
    console.log(t.padEnd(26) + String(counts[0]).padStart(6) + String(counts[1]).padStart(6) + String(js).padStart(6));
  }
}

console.log('\n=== rgba marrón 212,163,115 (línea y selector) ===');
const cssLines = cache['www/css/styles.css'].split('\n');
cssLines.forEach((l, i) => { if (/212,\s*163,\s*115/.test(l)) console.log((i + 1) + ': ' + l.trim().slice(0, 90)); });

console.log('\n=== font-size < 12px ===');
const sizes = [];
cssLines.forEach((l, i) => {
  const m = l.match(/font-size:\s*([0-9.]+)rem/);
  if (m && parseFloat(m[1]) * 16 < 12) sizes.push((i + 1) + ': ' + l.trim());
  const m2 = l.match(/font-size:\s*([0-9.]+)px/);
  if (m2 && parseFloat(m2[1]) < 12) sizes.push((i + 1) + ': ' + l.trim());
});
console.log(sizes.join('\n'));

console.log('\n=== height fijo (no min-height) ===');
const heights = [];
cssLines.forEach((l, i) => {
  if (/^\s*height:\s*(4[0-9]|5[0-9]|6[0-9]|8[0-9])px/.test(l)) heights.push((i + 1) + ': ' + l.trim());
});
console.log(heights.join('\n'));
