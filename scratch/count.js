const fs = require('fs');
process.chdir('C:/Users/yo/repo/pesadas-corcho');
const files = [
  'www/css/styles.css', 'www/index.html',
  'www/js/ui/dashboard-ui.js', 'www/js/ui/pesadas-ui.js', 'www/js/ui/zonas-ui.js',
  'www/js/ui/reportes-ui.js', 'www/js/ui/fincas-ui.js', 'www/js/ui/gastos-ui.js',
  'www/js/core/utils.js',
];
const css = fs.readFileSync('www/css/styles.css', 'utf8');
const start = css.indexOf(':root');
const rootBlock = css.slice(start, css.indexOf('}', start));
const defined = [...rootBlock.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map(m => m[1]);
const all = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const used = defined.filter(t => {
  const esc = t.replace(/-/g, '\\-');
  return new RegExp('var\\(' + esc + '\\s*[,)]').test(all);
});
const unused = defined.filter(t => !used.includes(t));
console.log('definidos en :root =', defined.length);
console.log('con uso          =', used.length);
console.log('sin uso          =', unused.length, '->', unused.join(', '));
const inl = files.reduce((a, f) => a + ((fs.readFileSync(f, 'utf8').match(/style="/g) || []).length), 0);
console.log('atributos style= =', inl);
