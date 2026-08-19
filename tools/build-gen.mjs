import sharp from 'sharp';
const jpg = { quality: 80, mozjpeg: true };

// 흰색 반투명 레이어 생성기
const veil = (w, h, a) => sharp({
  create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: a } }
}).png().toBuffer();

// 1) gate-bg : 문 뒤로 보일 공간 (IMG_1413 홀 내부 → blur + 화이트 워시)
{
  const W = 1279, H = 2008;              // 문 비율 0.637 에 맞춘 세로 크롭
  const base = await sharp('IMG_1413(1).jpg')
    .extract({ left: 700, top: 0, width: W, height: H })
    .blur(22).modulate({ brightness: 1.28, saturation: 0.75 })
    .resize({ width: 900 }).toBuffer();
  const m = await sharp(base).metadata();
  await sharp(base)
    .composite([{ input: await veil(m.width, m.height, 0.42), blend: 'over' }])
    .jpeg(jpg).toFile('assets/gate-bg.jpg');
}

// 2) couple-placeholder : 신랑신부 실사진 들어올 자리 (IMG_1413 플라워 아치)
await sharp('IMG_1413(1).jpg')
  .extract({ left: 120, top: 200, width: 825, height: 1100 })
  .modulate({ brightness: 1.06 })
  .resize({ width: 900 }).jpeg(jpg).toFile('assets/couple-placeholder.jpg');

// 3) 갤러리 3장 (IMG_1804 은 하단 워터마크 잘라냄)
await sharp('IMG_1804(1).jpg').extract({ left: 0, top: 0, width: 800, height: 1100 })
  .resize({ width: 800 }).jpeg(jpg).toFile('assets/aisle.jpg');
await sharp('IMG_1413(1).jpg').extract({ left: 1100, top: 120, width: 900, height: 1200 })
  .resize({ width: 800 }).jpeg(jpg).toFile('assets/g1.jpg');
await sharp('IMG_1413(1).jpg').extract({ left: 1900, top: 300, width: 900, height: 1200 })
  .resize({ width: 800 }).jpeg(jpg).toFile('assets/g2.jpg');
await sharp('IMG_0668(1).jpg').extract({ left: 400, top: 2600, width: 2400, height: 1800 })
  .resize({ width: 800 }).jpeg(jpg).toFile('assets/g3.jpg');

console.log('gen ok');
