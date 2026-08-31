import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets/hero', { recursive: true });

// 첫 화면 소스 = 촬영 원본 (간판 TOV HESED)
// 좌표는 이 이미지에서 가장자리 확대로 실측한 값
const SRC = 'assets/origin/door.png';
const W = 3533, H = 5200;
const D = { L: 632, R: 2895, T: 557, B: 3510, C: 1765 };

const jpg = { quality: 82, mozjpeg: true };

// 1) 문틀 배경 (문 포함 전체)
await sharp(SRC).resize({ width: 1400 }).jpeg(jpg).toFile('assets/hero/frame.jpg');

// 2) 좌/우 문짝 — 화면에서 차지하는 폭에 맞춰 축소
await sharp(SRC)
  .extract({ left: D.L, top: D.T, width: D.C - D.L, height: D.B - D.T })
  .resize({ width: 900 }).jpeg(jpg).toFile('assets/hero/door-l.jpg');
await sharp(SRC)
  .extract({ left: D.C, top: D.T, width: D.R - D.C, height: D.B - D.T })
  .resize({ width: 900 }).jpeg(jpg).toFile('assets/hero/door-r.jpg');

console.log(JSON.stringify({
  'img-w': W, 'img-h': H,
  'door-l': (D.L / W * 100).toFixed(3) + '%',
  'door-r': (D.R / W * 100).toFixed(3) + '%',
  'door-t': (D.T / H * 100).toFixed(3) + '%',
  'door-b': (D.B / H * 100).toFixed(3) + '%',
  'door-c': (D.C / W * 100).toFixed(3) + '%',
}, null, 1));
