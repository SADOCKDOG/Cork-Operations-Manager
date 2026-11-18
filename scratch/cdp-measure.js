// Batería de medición sobre el WebView de un dispositivo real vía CDP.
// Uso: CDP_PORT=9303 node scratch/cdp-measure.js
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.CDP_PORT || 9303;

const EXPR = `
(async () => {
  const routes = ['/', '/nueva', '/lista', '/zonas', '/gastos', '/informes', '/ajustes'];
  const out = {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (const r of routes) {
    location.hash = '#' + r;
    await sleep(700);
    const de = document.documentElement;
    const main = document.getElementById('app-content');
    const fab = document.getElementById('fab-nueva');
    let tapado = null;
    if (fab && !fab.classList.contains('hidden')) {
      window.scrollTo(0, de.scrollHeight);
      await sleep(350);
      const fr = fab.getBoundingClientRect();
      const kids = Array.from(main.children).filter(el => el.getBoundingClientRect().height > 0);
      const last = kids[kids.length - 1];
      tapado = last ? Math.round(last.getBoundingClientRect().bottom) > Math.round(fr.top) : null;
      window.scrollTo(0, 0);
      await sleep(250);
    }
    let small = 0;
    main.querySelectorAll('*').forEach(el => {
      if (!el.textContent.trim()) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 12) small++;
    });
    out[r] = { cw: de.clientWidth, sw: de.scrollWidth, small, tapado };
  }
  return JSON.stringify({ dpr: window.devicePixelRatio, rutas: out });
})()
`;

http.get(`http://localhost:${PORT}/json/list`, (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    let page;
    try {
      page = JSON.parse(data).find((p) => p.type === 'page');
    } catch (e) {
      console.error('JSON inválido de /json/list');
      process.exit(1);
    }
    if (!page) {
      console.error('No hay página WebView');
      process.exit(1);
    }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: EXPR, returnByValue: true, awaitPromise: true } }));
    });
    ws.on('message', (m) => {
      const r = JSON.parse(m);
      if (r.id === 1) {
        if (r.result && r.result.exceptionDetails) console.error(JSON.stringify(r.result.exceptionDetails.exText || r.result.exceptionDetails, null, 1));
        else console.log(JSON.stringify(JSON.parse(r.result.result.value), null, 1));
        ws.close();
      }
    });
    ws.on('error', (e) => {
      console.error('WS error:', e.message);
      process.exit(1);
    });
  });
});
