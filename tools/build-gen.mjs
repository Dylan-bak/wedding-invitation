import sharp from 'sharp';

// gate-bg : 문이 열리면 뒤로 보이는 공간
// 소스 = assets/gate-src.jpg — 문짝만 지우도록 Gemini 로 인페인팅한 결과물 (848x1248)
// 좌표는 그 결과물(848x1248)에서 문틀 안쪽 개구부만 잘라낸 실측값
// 실제 문 열린 사진이 없어 이 방식을 쓰고 있고, 결과가 자연스러워 유지한다
await sharp('assets/gate-src.jpg')
  .extract({ left: 225, top: 214, width: 394, height: 611 })
  .resize({ width: 900 }).modulate({ brightness: 1.03 })
  .jpeg({ quality: 82, mozjpeg: true }).toFile('assets/hero/gate-bg.jpg');

console.log('gate-bg ok');
