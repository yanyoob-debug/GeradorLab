import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import QRCode from 'qrcode';
import { generate, types } from './src/generators.js';

const assets = { '/': ['index.html','text/html; charset=utf-8'], '/app.js': ['app.js','text/javascript; charset=utf-8'], '/styles.css': ['styles.css','text/css; charset=utf-8'] };
export const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/api/health' && req.method === 'GET') return json(200, { status: 'ok' });
    if (path === '/api/tools' && req.method === 'GET') return json(200, { tools: types });
    if (path === '/api/generate') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(405, { error: 'Use POST.' }); }
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(403, { error: 'Origem não autorizada.' });
      if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { error: 'Envie application/json.' });
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 16384) return json(413, { error: 'Requisição muito grande.' });
      }
      let data;
      try { data = JSON.parse(body); } catch { return json(400, { error: 'JSON inválido.' }); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, { error: 'Corpo inválido.' });
      try {
        let results = generate(data.type, data.options, data.count);
        if (data.type === 'qrcode') results = await Promise.all(results.map(async value => ({ ...value, imagem: await QRCode.toDataURL(value.texto, { width: 320, margin: 4, errorCorrectionLevel: 'M' }) })));
        return json(200, { results });
      }
      catch (error) { return json(400, { error: error.message }); }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(405, { error: 'Método não permitido.' });
    if (!Object.hasOwn(assets, path)) return json(404, { error: 'Página não encontrada.' });
    const [name, mime] = assets[path];
    const content = await readFile(new URL(`./public/${name}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': mime });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { if (!res.headersSent) json(500, { error: 'Não foi possível processar a solicitação.' }); else res.end(); }
});
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '127.0.0.1', () => console.log(`Gerador Lab: http://localhost:${port}`));
}
