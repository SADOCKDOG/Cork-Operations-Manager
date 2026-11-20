// Verificación de la pantalla Nueva Pesada (Fase 2) sobre el WebView real.
// Uso: CDP_PORT=9301 node scratch/cdp-pesada.js
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.CDP_PORT || 9301;

const EXPR = `
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  location.hash = '#/nueva';
  await sleep(1200);

  const de = document.documentElement;
  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const r = el => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;

  // Contraste WCAG del valor del campo héroe sobre su propio fondo.
  const lum = c => {
    const [R, G, B] = c.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number).map(v => {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };

  const peso = q('#p-peso');
  const cta = q('.pesada-cta');
  const cs = getComputedStyle(peso);

  const inline = qa('#app-content [style]').map(el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' :: ' + el.getAttribute('style').slice(0, 60));

  const targets = qa('#app-content button, #app-content input, #app-content select').map(el => {
    const b = el.getBoundingClientRect();
    return { sel: (el.id ? '#' + el.id : el.className.split(' ')[0] + (el.dataset.quality ? '[' + el.dataset.quality + ']' : '')), w: Math.round(b.width), h: Math.round(b.height) };
  });

  const ctaRect = cta.getBoundingClientRect();
  const form = q('.pesada-form');
  const qLabels = qa('.quality-btn--wide').map(b => ({ txt: b.textContent.trim(), pressed: b.getAttribute('aria-pressed'), selected: b.classList.contains('selected') }));

  return JSON.stringify({
    dpr: window.devicePixelRatio,
    viewport: { cw: de.clientWidth, sw: de.scrollWidth, ch: de.clientHeight, sh: de.scrollHeight },
    fullScreenMode: document.body.classList.contains('full-screen-mode'),
    headerVisible: getComputedStyle(document.querySelector('header')).display !== 'none',
    navVisible: getComputedStyle(document.querySelector('nav.bottom-nav')).display !== 'none',
    input: { type: peso.type, inputmode: peso.getAttribute('inputmode'), enterkeyhint: peso.getAttribute('enterkeyhint'), pattern: peso.getAttribute('pattern'), fontSize: cs.fontSize, color: cs.color, bg: cs.backgroundColor, contrast: ratio(cs.color, cs.backgroundColor), rect: r(peso) },
    inlineStyles: inline,
    targets,
    cta: { position: getComputedStyle(cta).position, bottom: Math.round(window.innerHeight - ctaRect.bottom), height: Math.round(ctaRect.height), width: Math.round(ctaRect.width), text: cta.textContent.trim() },
    formPaddingBottom: getComputedStyle(form).paddingBottom,
    qualities: qLabels,
    msg: { text: q('#p-validation-msg').textContent, cls: q('#p-validation-msg').className },
    calcQ: q('#calc-q').textContent,
    quintalesLabel: q('.pesada-calc__label').textContent.trim(),
    safe: { top: getComputedStyle(de).getPropertyValue('--safe-top').trim(), bottom: getComputedStyle(de).getPropertyValue('--safe-bottom').trim() }
  }, null, 1);
})()
`;

http.get(`http://localhost:${PORT}/json/list`, (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    const page = JSON.parse(data).find((p) => p.type === 'page');
    if (!page) { console.error('No hay página'); process.exit(1); }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: EXPR, returnByValue: true, awaitPromise: true } })));
    ws.on('message', (m) => {
      const r = JSON.parse(m);
      if (r.id === 1) {
        if (r.result && r.result.exceptionDetails) console.error('EXCEPCION:', JSON.stringify(r.result.exceptionDetails.exText || r.result.exceptionDetails));
        else console.log(r.result.result.value);
        ws.close();
      }
    });
    ws.on('error', (e) => { console.error('WS:', e.message); process.exit(1); });
  });
});
