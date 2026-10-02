// WebKit(사파리 렌더링 엔진) + iPhone 뷰포트로 청첩장 확인
// 실행: node tools/iphone-preview.js [--shot] [기기명]   주소 = WED_URL (기본 http://localhost:4321)
const { webkit, devices } = require('playwright');
const { mkdirSync } = require('fs');

const URL = process.env.WED_URL || 'http://localhost:4321';
const name = process.argv.find(a => !a.startsWith('--') && a.includes('iPhone')) || 'iPhone 14 Pro';
const shot = process.argv.includes('--shot');
const OUT = 'tools/shots/iphone-preview.png';   // tools/shots/ = git 제외

(async () => {
  const device = devices[name];
  if (!device) { console.error(`알 수 없는 기기: ${name}`); process.exit(1); }
  const browser = await webkit.launch({ headless: shot });
  const ctx = await browser.newContext({ ...device, locale: 'ko-KR' });
  const page = await ctx.newPage();
  page.on('console', m => console.log(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => console.log(`[pageerror] ${e.message}`));
  await page.goto(URL, { waitUntil: 'networkidle' });
  if (shot) {
    mkdirSync('tools/shots', { recursive: true });
    await page.screenshot({ path: OUT, fullPage: true });
    console.log('저장 = ' + OUT);
    await browser.close();
  } else {
    console.log(`${name} 창 열림. 닫으면 종료.`);
    await page.waitForEvent('close', { timeout: 0 });
    await browser.close();
  }
})();
