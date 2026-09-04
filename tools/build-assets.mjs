import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets/hero', { recursive: true });

// 첫 화면 소스 = assets/origin/door-5.jpg (tools/build-door.mjs 가 만든다)
// 좌표는 그 스크립트가 출력한다
const SRC = 'assets/origin/door-5.jpg';
const W = 1400, H = 2025;
const D = { L: 244, R: 1151, T: 789, B: 1960, C: 700 };

const jpg = { quality: 84, mozjpeg: true };

// 문틀 배경 (문 포함 전체)
await sharp(SRC).jpeg(jpg).toFile('assets/hero/frame.jpg');

// 좌/우 문짝 — 촬영 원본 화소를 그대로 쓴다
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
