// 카카오톡·문자 공유 미리보기 카드 이미지 생성 (1200x630)
// 한글 글꼴이 필요해 sharp 대신 헤드리스 Chrome 으로 그린다
// 사용: node tools/build-og.mjs
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1200, H = 630;   // 카카오톡·오픈그래프 권장 비율 1.91:1
const SRC = 'assets/origin/2.jpg';

// 배경 사진을 data URL 로 심는다 (로컬 서버 없이 렌더되게)
const buf = await sharp(SRC).rotate().resize({ width: 1600 })
  .jpeg({ quality: 92 }).toBuffer();
const bg = `data:image/jpeg;base64,${buf.toString('base64')}`;

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;600&family=Cormorant+Garamond:wght@600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px; height:${H}px; overflow:hidden; position:relative;
       font-family:"Noto Serif KR",serif; color:#fff}
  /* 세로 사진을 가로 카드에 담으므로 두 사람 얼굴이 들어오는 높이로 맞춘다 */
  .bg{position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
      object-position:50% 38%}
  /* 밝은 사진이라 글자가 묻히지 않게 아래쪽을 진하게 */
  .veil{position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(20,16,12,0) 0%, rgba(20,16,12,.22) 42%, rgba(20,16,12,.66) 74%, rgba(20,16,12,.88) 100%)}
  .wrap{position:absolute; inset:auto 0 52px 0; text-align:center}
  .logo{font-family:"Cormorant Garamond",serif; font-weight:600; font-size:42px;
        letter-spacing:.14em; opacity:.92; margin-bottom:16px}
  .names{font-size:60px; font-weight:600; letter-spacing:.06em;
         text-shadow:0 2px 26px rgba(0,0,0,.6)}
  .when{margin-top:18px; font-size:27px; font-weight:300; letter-spacing:.1em; opacity:.95}
</style>
<img class="bg" src="${bg}">
<div class="veil"></div>
<div class="wrap">
  <div class="logo">YUCHAN &amp; HYEJIN</div>
  <div class="names">유찬 &#128149; 혜진 결혼합니다</div>
  <div class="when">2026. 11. 14. 토요일 오후 6시 30분 · 토브헤세드</div>
</div>`;

const b = await puppeteer.launch({
  executablePath: CHROME, headless: 'shell',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const p = await b.newPage();
await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));      // 웹폰트 적용 대기
await p.screenshot({ path: 'assets/og.jpg', type: 'jpeg', quality: 88 });
await b.close();
console.log(`og.jpg ${W}x${H} ok`);
