// 문 열림 구간의 실제 프레임 레이트·각도 변화를 측정하고 스냅샷을 남긴다.
// 사용: node tools/measure-scroll.mjs [url] [--shots]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.argv[2] || 'http://localhost:4321/';
const SHOTS = process.argv.includes('--shots');

mkdirSync('tools/shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(URL, { waitUntil: 'networkidle0' });

// 문 열림 구간(진행률 0.10~0.62)을 실제 휠 스크롤로 통과시키며 프레임 간격 기록
const result = await page.evaluate(async () => {
  const hero = document.getElementById('hero');
  const total = hero.offsetHeight - innerHeight;
  const from = Math.round(total * 0.08);
  const to = Math.round(total * 0.66);

  scrollTo(0, from);
  await new Promise(r => setTimeout(r, 400));

  const frames = [];   // {t, theta}
  let stop = false;
  const rec = t => {
    const th = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--theta'));
    frames.push({ t, th });
    if (!stop) requestAnimationFrame(rec);
  };
  requestAnimationFrame(rec);

  // 휠 한 칸(100px)씩, 60ms 간격 — 사람이 굴리는 속도에 가깝게
  for (let y = from; y <= to; y += 100) {
    scrollTo(0, y);
    await new Promise(r => setTimeout(r, 60));
  }
  await new Promise(r => setTimeout(r, 500));
  stop = true;

  const dts = [];
  for (let i = 1; i < frames.length; i++) dts.push(frames[i].t - frames[i - 1].t);
  dts.sort((a, b) => a - b);

  const thetas = frames.map(f => f.th);
  const jumps = [];
  for (let i = 1; i < thetas.length; i++) {
    const d = Math.abs(thetas[i] - thetas[i - 1]);
    if (d > 0.001) jumps.push(d);
  }
  jumps.sort((a, b) => b - a);

  return {
    frames: frames.length,
    medianDt: +dts[Math.floor(dts.length / 2)].toFixed(2),
    p95Dt: +dts[Math.floor(dts.length * 0.95)].toFixed(2),
    maxDt: +dts[dts.length - 1].toFixed(2),
    fps: +(1000 / dts[Math.floor(dts.length / 2)]).toFixed(1),
    thetaMin: +Math.min(...thetas).toFixed(2),
    thetaMax: +Math.max(...thetas).toFixed(2),
    distinctThetas: new Set(thetas.map(v => v.toFixed(2))).size,
    biggestThetaJumps: jumps.slice(0, 5).map(v => +v.toFixed(2)),
  };
});

console.log(JSON.stringify(result, null, 2));

if (SHOTS) {
  const total = await page.evaluate(() => {
    const h = document.getElementById('hero');
    return h.offsetHeight - innerHeight;
  });
  for (const p of [0, 0.01, 0.02, 0.04, 0.07, 0.12, 0.20, 0.32, 0.44, 0.60]) {
    await page.evaluate(y => scrollTo(0, y), Math.round(total * p));
    await new Promise(r => setTimeout(r, 500));
    const name = `tools/shots/p${String(Math.round(p * 100)).padStart(2, '0')}.png`;
    await page.screenshot({ path: name });
    const th = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--theta').trim());
    console.log(name, 'theta=' + th);
  }
}

await browser.close();
