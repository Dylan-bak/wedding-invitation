// 참고안(pwinvitation) 에서 받은 사진을 사이트 자산으로 변환 — assets/origin/ref/ → assets/photo/
//
// cover   = 대문 열린 뒤 첫 사진 (아치 모양). 원본 940x1411
// invite  = 초대합니다 아래 가로 사진. 원본 1000x604
// groom · bride = 소개 절 어린 시절 사진. 원형으로 보이므로 정방형 그대로
// info-cookie · info-shuttle = 안내사항 탭 사진 1000x600
// g01~g17 = 갤러리(격자 썸네일 480px) · f01~f17 = 확대 보기(원본 1000px 그대로 복사)
import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';

const SRC = 'assets/origin/ref/';
const OUT = 'assets/photo/';
mkdirSync(OUT, { recursive: true });

const one = async (from, to, opt = {}) => {
  let s = sharp(SRC + from).rotate();
  if (opt.w) s = s.resize({ width: opt.w, height: opt.h, fit: opt.fit || 'inside' });
  await s.jpeg({ quality: opt.q || 84, mozjpeg: true }).toFile(OUT + to);
};

await one('edit-image.jpg_43193_edit_main1_1788577351558.jpg', 'cover.jpg', { w: 940, q: 86 });
await one('IMG_5630.jpg_43193_1000_main3_1788579880461.jpg', 'invite.jpg', { w: 1000 });
await one('edit-image.jpg_43193_edit_main28_0_1788580201738.jpg', 'groom.jpg', { w: 400, h: 400, fit: 'cover' });
await one('edit-image.jpg_43193_edit_main28_1_1788580245294.jpg', 'bride.jpg', { w: 400, h: 400, fit: 'cover' });
await one('IMG_5634.jpg_43193_1000_main11_1788581276442.jpg', 'info-cookie.jpg', { w: 1000 });
await one('IMG_5632.jpg_43193_1000_main11_1788581398823.jpg', 'info-shuttle.jpg', { w: 1000 });

// 갤러리 순서 = 참고안 화면 순서 그대로 (5527 5528 5529 5530 5531 5532 5533 | 5545 5534 5535 5536 5554 5538 5540 5544 5542 5543)
const GALLERY = [5527, 5528, 5529, 5530, 5531, 5532, 5533, 5545, 5534, 5535, 5536, 5554, 5538, 5540, 5544, 5542, 5543];
const files = (await import('fs')).readdirSync(SRC);
const pad = n => String(n).padStart(2, '0');
for (let i = 0; i < GALLERY.length; i++) {
  const f = files.find(x => x.startsWith(`IMG_${GALLERY[i]}.jpg`));
  if (!f) throw new Error('없음 ' + GALLERY[i]);
  await sharp(SRC + f).rotate().resize({ width: 480, height: 540, fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}g${pad(i + 1)}.jpg`);
  copyFileSync(SRC + f, `${OUT}f${pad(i + 1)}.jpg`);
}
// 지도 = 참고안의 네이버 지도 화면 캡처 (2배 해상도 png → jpg)
// 오른쪽 확대 조절 막대(90px)를 잘라낸다
await sharp(SRC + 'naver-map.png').extract({ left: 0, top: 0, width: 690, height: 600 }).jpeg({ quality: 88, mozjpeg: true }).toFile(OUT + 'map-naver.jpg');
// 아이콘·배경은 그대로 복사 — 지도앱 로고 3종 · 달력 하트 표식 · 남은 시간 띠 배경
for (const [from, to] of [['icon-n-map.png', 'ico-naver.png'], ['icon-k-map.png', 'ico-kakao.png'], ['icon-t-map.png', 'ico-tmap.png'],
  ['main2-heart.png', 'heart.png'], ['banner-img01.jpg', 'banner.jpg']]) copyFileSync(SRC + from, OUT + to);
console.log('done', GALLERY.length, '장');
