import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets', { recursive: true });

// 첫 화면 소스 = 간판을 TOV HESED 로 수정한 재생성 이미지 (848x1248)
// 원본 IMG_0668(1).jpg(3200x4668)와 기하가 다르므로 좌표는 이 이미지에서 재실측한 값
const SRC = '3c4b782e-d48a-4e8d-8e9e-a11900226e3b.png';
const W = 848, H = 1248;
const D = { L: 139, R: 690, T: 142, B: 840, C: 425 };

const jpg = { quality: 82, mozjpeg: true };

// 1) 문틀 배경 (문 포함 전체)
await sharp(SRC).jpeg(jpg).toFile('assets/temp/frame.jpg');

// 2) 좌/우 문짝
await sharp(SRC)
  .extract({ left: D.L, top: D.T, width: D.C - D.L, height: D.B - D.T })
  .jpeg(jpg).toFile('assets/temp/door-l.jpg');
await sharp(SRC)
  .extract({ left: D.C, top: D.T, width: D.R - D.C, height: D.B - D.T })
  .jpeg(jpg).toFile('assets/temp/door-r.jpg');

// 3) 본문 사진 (임시 — 실사진으로 교체 예정)
await sharp('IMG_1413(1).jpg').resize({ width: 1200 }).jpeg(jpg).toFile('assets/temp/hall-wide.jpg');

console.log(JSON.stringify({
  'door-l%': (D.L / W * 100).toFixed(3),
  'door-r%': (D.R / W * 100).toFixed(3),
  'door-t%': (D.T / H * 100).toFixed(3),
  'door-b%': (D.B / H * 100).toFixed(3),
  'door-c%': (D.C / W * 100).toFixed(3),
}));
