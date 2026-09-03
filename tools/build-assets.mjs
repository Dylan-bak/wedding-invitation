import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets/hero', { recursive: true });

// 첫 화면 소스 = assets/origin/door-4.png
// 좌표는 이 이미지의 가장자리를 픽셀 밝기로 훑어 실측한 값 (문틀 하이라이트가 시작되는 x·y)
const SRC = 'assets/origin/door-4.png';
const W = 800, H = 1344;
const D = { L: 165, R: 633, T: 440, B: 1004, C: 400 };

const jpg = { quality: 84, mozjpeg: true };

// 문틀 배경 (문 포함 전체)
await sharp(SRC).jpeg(jpg).toFile('assets/hero/frame.jpg');

// 좌/우 문짝 — 원본 해상도가 낮아 확대하지 않고 그대로 잘라낸다
await sharp(SRC)
  .extract({ left: D.L, top: D.T, width: D.C - D.L, height: D.B - D.T })
  .jpeg(jpg).toFile('assets/hero/door-l.jpg');
await sharp(SRC)
  .extract({ left: D.C, top: D.T, width: D.R - D.C, height: D.B - D.T })
  .jpeg(jpg).toFile('assets/hero/door-r.jpg');

console.log(JSON.stringify({
  'img-w': W, 'img-h': H,
  'door-l': (D.L / W * 100).toFixed(3) + '%',
  'door-r': (D.R / W * 100).toFixed(3) + '%',
  'door-t': (D.T / H * 100).toFixed(3) + '%',
  'door-b': (D.B / H * 100).toFixed(3) + '%',
  'door-c': (D.C / W * 100).toFixed(3) + '%',
}, null, 1));
