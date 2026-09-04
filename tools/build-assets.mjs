import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets/hero', { recursive: true });

// 첫 화면 소스 = assets/origin/door-4.png
// 좌표는 이 이미지의 가장자리를 픽셀 밝기로 훑어 실측한 값 (문틀 하이라이트가 시작되는 x·y)
const SRC = 'assets/origin/door-4.png';
// 위 130 / 아래 54 를 잘라낸다. 세로가 짧아지면 화면 높이에 맞추느라 문이 커진다
// (door-2 시절 문 크기와 door-4 원본의 중간). 위쪽 유리천장·아이비 길이도 함께 줄어든다
const CUT_TOP = 130, CUT_BOT = 54;
const W = 800, H = 1344 - CUT_TOP - CUT_BOT;
const D0 = { L: 165, R: 633, T: 440, B: 1004, C: 400 };
const D = { ...D0, T: D0.T - CUT_TOP, B: D0.B - CUT_TOP };

const jpg = { quality: 84, mozjpeg: true };

// 문틀 배경 (문 포함 전체)
await sharp(SRC).extract({ left: 0, top: CUT_TOP, width: W, height: H })
  .jpeg(jpg).toFile('assets/hero/frame.jpg');

// 좌/우 문짝 — 원본 해상도가 낮아 확대하지 않고 그대로 잘라낸다
await sharp(SRC)
  .extract({ left: D0.L, top: D0.T, width: D0.C - D0.L, height: D0.B - D0.T })
  .jpeg(jpg).toFile('assets/hero/door-l.jpg');
await sharp(SRC)
  .extract({ left: D0.C, top: D0.T, width: D0.R - D0.C, height: D0.B - D0.T })
  .jpeg(jpg).toFile('assets/hero/door-r.jpg');

console.log(JSON.stringify({
  'img-w': W, 'img-h': H,
  'door-l': (D.L / W * 100).toFixed(3) + '%',
  'door-r': (D.R / W * 100).toFixed(3) + '%',
  'door-t': (D.T / H * 100).toFixed(3) + '%',
  'door-b': (D.B / H * 100).toFixed(3) + '%',
  'door-c': (D.C / W * 100).toFixed(3) + '%',
}, null, 1));
