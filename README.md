# 모바일 청첩장 — 스크롤로 문이 열리는 청첩장

베뉴(Villa de Tov Hesed) 실제 입구 사진을 좌·우 문짝으로 잘라, 스크롤 진행률에 맞춰 `rotateY` 로 열리게 한 단일 파일 모바일 청첩장.
동영상·GIF·이미지 시퀀스 미사용 → 총 자산 1MB 미만, 스크롤 역방향도 그대로 되감김.

## 1. 실행

```bash
npx serve -l 4321 .
```

→ http://localhost:4321 · 모바일 폭(375px)에서 확인 권장

빌드 과정 없음. `index.html` 하나 + `assets/` 뿐.

## 2. 파일 구성

| 경로 | 역할 |
|---|---|
| `index.html` | 전체 페이지 (HTML + CSS + JS 단일 파일) |
| `assets/frame.jpg` | 문틀·기둥·꽃·간판 — 스크롤 중 고정되는 배경 |
| `assets/door-l.jpg` · `door-r.jpg` | 좌·우 문짝 (각각 경첩 기준 회전) |
| `assets/gate-bg.jpg` | 문 뒤로 보이는 공간 |
| `assets/couple-placeholder.jpg` | 문 열린 뒤 올라오는 사진 자리 **(임시)** |
| `assets/hall-wide.jpg` `aisle.jpg` `g1~g3.jpg` | 본문·갤러리 사진 |
| `tools/build-assets.mjs` | 원본 사진 → 문짝·배경 자산 생성 |
| `tools/build-gen.mjs` | 원본 사진 → 문 뒤 배경·갤러리 자산 생성 |
| `tools/vertex-image.mjs` | Gemini 이미지 생성/편집 호출 (선택) |
| `IMG_0668(1).jpg` `IMG_1413(1).jpg` `IMG_1804(1).jpg` | 원본 사진 (자산 재생성용 소스) |

## 3. 동작 원리

스크롤 구간 `460svh` 를 진행률 `p` (0~1) 로 환산 → CSS 변수에 주입.

```
p 0.00~0.10   문 닫힘 + "SCROLL" 힌트
p 0.10~0.62   좌 rotateY(+θ) / 우 rotateY(−θ),  θ 0 → 108°  (안쪽으로 열림)
              동시에 화면 zoom 1 → 1.22 (문 안으로 걸어 들어가는 느낌)
p 0.46~0.74   전체 화이트아웃
p 0.60~1.00   사진 + 날짜가 아래에서 위로 상승
그 이후        IntersectionObserver 로 섹션별 순차 등장
```

레이어 순서 (아래 → 위): `frame` → `gate`(문 뒤 공간) → `door-l` / `door-r` → `flash`(화이트아웃) → `reveal`(상승 화면)

원본 사진 비율 박스(`3200:4668`)를 `cover` 로 화면에 채우고, 문짝을 그 박스의 **% 좌표**로 배치 → 화면 크기·기기와 무관하게 문틀과 정확히 정렬.

## 4. 수정 지점

### 문짝 위치가 문틀과 어긋날 때

`index.html` 의 `:root` 값만 조정. IMG_0668 원본(3200×4668) 기준 백분율.

```css
--door-l: 20.219%;  /* 문 왼쪽 끝 */
--door-r: 74.469%;  /* 문 오른쪽 끝 */
--door-t:  9.747%;  /* 문 위쪽 */
--door-b: 68.123%;  /* 문 아래쪽 */
--door-c: 50%;      /* 두 문짝 분할선 */
```

바꿨으면 문짝 이미지도 같은 좌표로 다시 잘라야 함 → `tools/build-assets.mjs` 상단 `D` 상수 수정 후

```bash
node tools/build-assets.mjs
```

### 열리는 속도·각도·연출

`index.html` 하단 스크립트의 타임라인 상수.

```js
const OPEN  = [0.10, 0.62];  // 문 회전 구간
const FLASH = [0.46, 0.74];  // 화이트아웃 구간
const RISE  = [0.60, 1.00];  // 다음 화면 상승 구간
const MAX_DEG  = 108;        // 최대 회전각
const MAX_ZOOM = 1.22;       // 최대 확대
```

스크롤 길이 자체를 늘리려면 CSS `.hero { height: 460svh }`.

### 사진 교체

`assets/` 의 같은 파일명으로 덮어쓰면 끝. 권장 스펙:

| 파일 | 비율 | 폭 |
|---|---|---|
| `couple-placeholder.jpg` | 3:4 세로 | 900px |
| `g1~g3.jpg` | 3:4 세로 | 800px |
| `hall-wide.jpg` | 자유 | 1200px |

### 텍스트

`index.html` 본문에 `OOO` / `0월 0일` 형태로 들어가 있음. 채워야 하는 곳:

- 신랑·신부 이름 (히어로 `.names`, 연락처 카드)
- 예식 일시·장소·주소
- 오시는 길 (지하철·버스·주차)
- 연락처 `tel:` / `sms:` 번호
- 계좌 정보

## 5. 자산 재생성

원본 사진 3장이 있어야 함. `node_modules` (sharp) 필요.

```bash
npm i && node tools/build-assets.mjs && node tools/build-gen.mjs
```

## 6. Gemini 이미지 생성 (선택)

문 뒤 공간을 blur 합성 대신 AI 인페인팅으로 만들고 싶을 때만 사용.

```bash
GEMINI_API_KEY=... node tools/vertex-image.mjs assets/gen-gate.png "<프롬프트>" "IMG_0668(1).jpg"
```

`GEMINI_API_KEY` 없으면 Vertex AI + gemini CLI OAuth 토큰으로 폴백. 단 해당 GCP 프로젝트에 `aiplatform.endpoints.predict` 권한이 있어야 함.

**입력은 반드시 원본 `IMG_0668(1).jpg`** — `assets/` 의 가공본은 축소·blur 로 정보가 손실돼 있어 소스로 부적합.

## 7. 배포 (GitHub Pages)

정적 파일뿐이라 그대로 올리면 됨.

1. GitHub 저장소 생성 후 push
2. Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`
3. `https://<계정>.github.io/<저장소>/` 로 접속

원본 사진 3장(합계 11MB)은 자산 재생성용이라 배포에는 불필요 — 저장소를 줄이려면 `.gitignore` 에 추가하고 별도 보관.

## 8. 남은 작업

`DOC-pending.md` 참조.
