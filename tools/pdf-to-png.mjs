// PDF 한 페이지를 PNG 로 렌더 (pdf.js + 헤드리스 Chrome, 외부 도구 불필요)
// 로컬 서버(npx serve -l 4321)가 떠 있어야 한다. URL 에 .html 을 붙이면 301 리다이렉트로
// 쿼리스트링이 사라지므로 확장자 없이 요청한다
// 사용: node tools/pdf-to-png.mjs <pdf경로> <출력png> [페이지] [배율]
import puppeteer from 'puppeteer-core';

const [pdf, out, pageNo = '1', scale = '3'] = process.argv.slice(2);
if (!pdf || !out) { console.error('usage: node tools/pdf-to-png.mjs <pdf> <out.png> [page] [scale]'); process.exit(1); }

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'shell', args: ['--no-sandbox'] });
const p = await b.newPage();
p.on('pageerror', e => console.error('PAGEERROR', e.message));
const url = `http://localhost:4321/tools/pdf-render?f=${encodeURIComponent('/' + pdf)}&p=${pageNo}&s=${scale}`;
await p.goto(url, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.__done', { timeout: 60000 });
const info = await p.evaluate(() => window.__done);
await p.setViewport({ width: info.w, height: info.h, deviceScaleFactor: 1 });
await (await p.$('#c')).screenshot({ path: out });
console.log(JSON.stringify(info));
await b.close();
