// 첫 화면 대문 사진 만들기 — assets/origin/door-5.jpg
//
// door-2 = 실제 촬영본. 나뭇결·조각이 선명하고 1400px 로 크다. 다만 문 위에 여백이 없어
//          문이 화면 맨 위에 붙는다.
// door-4 = AI 로 문 위를 채운 것. 여백은 생겼지만 800px 로 작아 나뭇결이 뭉갠다.
// → door-2 위쪽에 door-4 의 아이비 띠만 이어 붙여 둘의 장점을 합친다.
//   문짝과 문틀은 전부 door-2 픽셀이므로 질감이 살아 있다.
import sharp from 'sharp';

const D2 = 'assets/origin/door-2.jpeg';   // 1400x2061, 문 = L244 R1151 T219 B1390 C700
const D4 = 'assets/origin/door-4.png';    // 800x1344

const DROP = 57;   // door-2 맨 위 유리천장 조각 — 이어 붙일 자리라 버린다
const PAD  = 224;  // 새로 붙일 아이비 띠 높이
const H    = 2025; // 최종 높이. 이 값이 화면에서 문이 얼마나 커 보이는지를 정한다
const STRIP = { top: 230, height: 128 };  // door-4 에서 가져올 구간 (아이비가 가장 잘 보이는 곳)

const strip = await sharp(D4).extract({ left: 0, width: 800, ...STRIP })
  .resize({ width: 1400 }).toBuffer();
const body = await sharp(D2).rotate()
  .extract({ left: 0, top: DROP, width: 1400, height: 2061 - DROP }).toBuffer();

const joined = await sharp({ create: { width: 1400, height: (2061 - DROP) + PAD, channels: 3, background: '#ffffff' } })
  .composite([{ input: strip, top: 0, left: 0 }, { input: body, top: PAD, left: 0 }])
  .jpeg({ quality: 94 }).toBuffer();

await sharp(joined).extract({ left: 0, top: 0, width: 1400, height: H })
  .jpeg({ quality: 90, mozjpeg: true }).toFile('assets/origin/door-5.jpg');

console.log(`door-5 = 1400x${H} · 문 좌표 L244 R1151 T${219 - DROP + PAD} B${1390 - DROP + PAD} C700`);
