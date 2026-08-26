// 청첩장 주소 QR 생성 — 화면용 SVG + 인쇄용 PNG
// 사용: node tools/build-qr.mjs [url]
import QRCode from 'qrcode';
import { mkdirSync } from 'fs';

const URL = process.argv[2] || 'https://dylan-bak.github.io/wedding-invitation/';

mkdirSync('assets', { recursive: true });

// errorCorrectionLevel Q = 25% 손상까지 복원. 인쇄물이 접히거나 가운데 로고를 얹어도 읽힌다
// margin 4 = QR 규격이 요구하는 여백(quiet zone) 4모듈. 인쇄 업체가 여백을 잘라내면 인식률이 떨어진다
const common = { errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#3a352f', light: '#ffffff' } };

await QRCode.toFile('assets/qr.svg', URL, { ...common, type: 'svg' });

// 1200px = 300dpi 로 약 10cm. 종이 청첩장·현장 안내판 모두 커버
await QRCode.toFile('assets/qr.png', URL, { ...common, type: 'png', width: 1200 });

console.log('QR ->', URL);
