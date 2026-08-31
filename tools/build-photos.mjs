import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('assets/photo', { recursive: true });
const jpg = { quality: 82, mozjpeg: true };

// 단독 게재 3장 — 원본 비율 유지 (자르지 않는다)
for (const n of [1, 2, 3]) {
  await sharp(`assets/origin/${n}.jpg`).rotate().resize({ width: 1200 })
    .jpeg(jpg).toFile(`assets/photo/s${n}.jpg`);
}

// 2x2 격자 4장 — 정사각으로 통일해야 격자가 어긋나지 않는다
for (const n of [4, 5, 6, 7]) {
  await sharp(`assets/origin/${n}.jpg`).rotate()
    .resize({ width: 900, height: 900, fit: 'cover', position: 'centre' })
    .jpeg(jpg).toFile(`assets/photo/g${n - 3}.jpg`);
}

// 문이 열린 뒤 아래에서 올라오는 사진 = 대표컷(1번)을 3:4 로
await sharp('assets/origin/1.jpg').rotate()
  .resize({ width: 900, height: 1200, fit: 'cover', position: 'centre' })
  .jpeg({ quality: 84, mozjpeg: true }).toFile('assets/photo/reveal.jpg');

// 약도 — 글자가 많아 화질을 더 준다. 원본 폭이 932 라 확대하지 않는다
await sharp('assets/origin/map.jpg').resize({ width: 932 })
  .jpeg({ quality: 90, mozjpeg: true }).toFile('assets/photo/map.jpg');

console.log('photo assets ok');
