// 첫 화면(대문) 자산 생성
// 소스 = 1000017567.png — IMG_0668(1).jpg 의 간판을 "TOV HESED" 로 고친 생성본 (848x1236)
import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets', { recursive: true });

const SRC = '1000017567.png';
const W = 848, H = 1236;
// 실측 문 영역 (소스 px)
const D = { L: 157, R: 685, T: 119, B: 840, C: 424 };

const jpg = { quality: 82, mozjpeg: true };

// 1) 문틀 배경 (문 포함 전체)
await sharp(SRC).jpeg(jpg).toFile('assets/frame.jpg');

// 2) 좌/우 문짝
await sharp(SRC)
  .extract({ left: D.L, top: D.T, width: D.C - D.L, height: D.B - D.T })
  .jpeg(jpg).toFile('assets/door-l.jpg');
await sharp(SRC)
  .extract({ left: D.C, top: D.T, width: D.R - D.C, height: D.B - D.T })
  .jpeg(jpg).toFile('assets/door-r.jpg');

console.log(JSON.stringify({
  imgW: W, imgH: H,
  doorPct: {
    l: +(D.L / W * 100).toFixed(3),
    r: +(D.R / W * 100).toFixed(3),
    t: +(D.T / H * 100).toFixed(3),
    b: +(D.B / H * 100).toFixed(3),
    c: +(D.C / W * 100).toFixed(3),
  }
}));
