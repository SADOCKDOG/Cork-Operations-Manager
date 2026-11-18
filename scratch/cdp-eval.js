// Evaluador CDP contra el WebView del emulador (adb forward tcp:9222).
// Uso: node scratch/cdp-eval.js "<expresión JS>"
const WebSocket = require('ws');
const http = require('http');

const expr = process.argv[2];
if (!expr) {
  console.error('Falta la expresión JS');
  process.exit(1);
}

// Puerto dedicado al emulador (9301). El 9222 queda reservado y NO se usa:
// un forward suelto en 9222 puede apuntar al tablet real.
const PORT = process.env.CDP_PORT || 9301;

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
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression: expr, returnByValue: true, awaitPromise: true },
        })
      );
    });
    ws.on('message', (m) => {
      const r = JSON.parse(m);
      if (r.id === 1) {
        if (r.result && r.result.exceptionDetails) {
          console.error(JSON.stringify(r.result.exceptionDetails, null, 1));
        } else {
          console.log(JSON.stringify(r.result.result.value, null, 1));
        }
        ws.close();
      }
    });
    ws.on('error', (e) => {
      console.error('WS error:', e.message);
      process.exit(1);
    });
  });
});
