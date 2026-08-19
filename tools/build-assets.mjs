import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets', { recursive: true });

const SRC = 'IMG_0668(1).jpg';
const W = 3200, H = 4668;
// 실측 문 영역 (원본 px)
const D = { L: 647, R: 2383, T: 455, B: 3180, C: 1600 };

const jpg = { quality: 78, mozjpeg: true };

// 1) 문틀 배경 (문 포함 전체) — 문 뒤에 깔릴 원경
await sharp(SRC).resize({ width: 1400 }).jpeg(jpg).toFile('assets/frame.jpg');

// 2) 좌/우 문짝
await sharp(SRC)
  .extract({ left: D.L, top: D.T, width: D.C - D.L, height: D.B - D.T })
  .resize({ width: 900 }).jpeg(jpg).toFile('assets/door-l.jpg');
await sharp(SRC)
  .extract({ left: D.C, top: D.T, width: D.R - D.C, height: D.B - D.T })
  .resize({ width: 780 }).jpeg(jpg).toFile('assets/door-r.jpg');

// 3) 본문 사진
await sharp('IMG_1413(1).jpg').resize({ width: 1200 }).jpeg(jpg).toFile('assets/hall-wide.jpg');
await sharp('IMG_1804(1).jpg').resize({ width: 1000 }).jpeg(jpg).toFile('assets/aisle.jpg');

// 4) 문 열린 뒤 올라올 자리 (신랑신부 사진 대체 플레이스홀더)
await sharp('IMG_1804(1).jpg')
  .extract({ left: 40, top: 40, width: 720, height: 940 })
  .resize({ width: 900 }).jpeg(jpg).toFile('assets/couple-placeholder.jpg');

console.log(JSON.stringify({
  door: {
    left:  (D.L / W * 100).toFixed(3),
    right: (D.R / W * 100).toFixed(3),
    top:   (D.T / H * 100).toFixed(3),
    bottom:(D.B / H * 100).toFixed(3),
    center:(D.C / W * 100).toFixed(3),
  }
}, null, 2));
