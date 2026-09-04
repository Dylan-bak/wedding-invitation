import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';

mkdirSync('assets/photo', { recursive: true });
const jpg = { quality: 82, mozjpeg: true };

// origin 의 확장자가 파일마다 다르므로(.jpg/.jpeg) 있는 쪽을 찾아 쓴다
const src = n => {
  for (const ext of ['jpg', 'jpeg', 'png']) {
    const p = `assets/origin/${n}.${ext}`;
    if (existsSync(p)) return p;
  }
  throw new Error(`origin/${n} 없음`);
};

// 단독 게재 2장 — 원본 비율 유지 (자르지 않는다)
// 1 은 쓰지 않는다. 문 열린 뒤 올라오는 사진과 같은 컷이라 두 번 보이게 된다
for (const [i, n] of [2, 8].entries()) {
  await sharp(src(n)).rotate().resize({ width: 1200 }).jpeg(jpg)
    .toFile(`assets/photo/s${i + 1}.jpg`);
}

// 문이 열린 뒤 아래에서 올라오는 사진 = 대표컷(1번)을 3:4 로
await sharp(src(1)).rotate()
  .resize({ width: 900, height: 1200, fit: 'cover', position: 'centre' })
  .jpeg({ quality: 84, mozjpeg: true }).toFile('assets/photo/reveal.jpg');

// 갤러리 3~17 — 썸네일 격자 + 클릭 시 확대
// 썸네일은 화면에서 112x122 로 보이므로 고밀도 화면(DPR3)까지 커버하도록 3배 크기
// 8 은 단독 게재로 빠졌다. 1 은 문 열린 뒤 올라오는 사진과 같은 컷이지만 갤러리 4번째로도 쓴다
const GALLERY = [3, 4, 5, 1, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17];
for (const [i, n] of GALLERY.entries()) {
  const id = String(i + 1).padStart(2, '0');
  await sharp(src(n)).rotate()
    .resize({ width: 336, height: 366, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 78, mozjpeg: true }).toFile(`assets/photo/t${id}.jpg`);

  // 확대용 — 장변 2800. 아이폰 Pro Max·폴드 펼침·태블릿에서 축소 없이 표시. 클릭할 때만 내려받으므로 첫 로딩에 영향 없다
  await sharp(src(n)).rotate()
    .resize({ width: 2800, height: 2800, fit: 'inside', withoutEnlargement: true })
    .jpeg(jpg).toFile(`assets/photo/f${id}.jpg`);
}

// 약도 — 글자가 많아 화질을 더 준다. 원본 폭이 932 라 확대하지 않는다
await sharp(src('map')).jpeg({ quality: 90, mozjpeg: true }).toFile('assets/photo/map.jpg');

console.log(`photo assets ok — 단독 2, 갤러리 ${GALLERY.length}, reveal, map`);
