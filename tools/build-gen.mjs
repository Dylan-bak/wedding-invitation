import sharp from 'sharp';
const jpg = { quality: 80, mozjpeg: true };

// 흰색 반투명 레이어 생성기
const veil = (w, h, a) => sharp({
  create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: a } }
}).png().toBuffer();

// 1) gate-bg : 문 뒤로 보일 공간
//    소스 = IMG_0668(1)-2.jpg — 원본에서 문짝만 제거하도록 Gemini(nano banana)로 인페인팅한 결과물
//    아래 좌표는 그 결과물(848x1248)에서 문틀 안쪽 개구부만 잘라낸 실측값
await sharp('IMG_0668(1)-2.jpg')
  .extract({ left: 225, top: 214, width: 394, height: 611 })
  .resize({ width: 900 }).modulate({ brightness: 1.03 })
  .jpeg({ quality: 82, mozjpeg: true }).toFile('assets/gate-bg.jpg');

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
