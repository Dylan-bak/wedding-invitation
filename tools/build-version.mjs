// 배포본 식별값을 index.html 과 assets/version.txt 에 같이 심는다.
// 두 값이 어긋나면 페이지가 스스로 새 주소로 한 번 다시 받는다 (README §4 「하객 화면이 옛 내용일 때」).
//
// 사용: node tools/build-version.mjs [--assets]
//   --assets = 사진·아이콘·음악 주소에도 ?v= 를 붙인다. 자산 파일을 교체했을 때만 쓴다
//              (붙이면 이미 받아둔 하객도 사진 4.3MB 를 다시 받는다)
import fs from 'fs';

const ROOT = 'D:/Projects/Dylan/wed';
const HTML = ROOT + '/index.html';
const TXT = ROOT + '/assets/version.txt';
const STAMP_ASSETS = process.argv.includes('--assets');

// 식별값 = 한국 시각 YYYYMMDD-HHmmss. 배포마다 반드시 달라야 무한 새로고침이 안 생긴다
const id = new Date()
  .toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
  .replace(/[-:]/g, '')
  .replace(' ', '-');

let s = fs.readFileSync(HTML, 'utf8');

const build = /window\.BUILD = '[^']*'/;
if (!build.test(s)) { console.error('index.html 에 window.BUILD 줄이 없다'); process.exit(1); }
s = s.replace(build, `window.BUILD = '${id}'`);

const assetV = /const ASSET_V = '[^']*'/;
if (!assetV.test(s)) { console.error('index.html 에 ASSET_V 줄이 없다'); process.exit(1); }
s = s.replace(assetV, `const ASSET_V = '${STAMP_ASSETS ? '?v=' + id : ''}'`);

// 먼저 이전 회차가 붙인 ?v= 를 떼고, --assets 일 때만 새로 붙인다. og.jpg 는 제외
// (카카오톡이 미리보기 카드를 주소 기준으로 따로 캐시해 주소가 바뀌면 카드가 깨진다)
s = s.replace(/(assets\/[\w./-]+\.(?:jpg|png|mp3|svg))\?v=[\w-]*/g, '$1');
let n = 0;
if (STAMP_ASSETS) {
  s = s.replace(/assets\/[\w./-]+\.(?:jpg|png|mp3|svg)/g, m => {
    if (m.endsWith('og.jpg')) return m;
    n++;
    return m + '?v=' + id;
  });
}

fs.writeFileSync(HTML, s);
fs.writeFileSync(TXT, id + '\n');
console.log(`build = ${id} · 자산 주소 ${STAMP_ASSETS ? n + '건 갱신' : '미갱신(--assets 없음)'}`);
