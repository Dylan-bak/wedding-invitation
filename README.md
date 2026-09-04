# 모바일 청첩장 — 스크롤로 문이 열리는 청첩장
베뉴(Tov Hesed) 실제 입구 사진을 좌·우 문짝으로 잘라, 스크롤 진행률에 맞춰 `rotateY` 로 열리게 한 단일 파일 모바일 청첩장.
동영상·GIF·이미지 시퀀스 미사용 → 첫 화면 자산 400KB 미만, 스크롤 역방향도 그대로 되감김.

**배포 주소** — https://dylan-bak.github.io/wedding-invitation/ (GitHub Pages, `main` 에 push 하면 1~2분 뒤 자동 반영)

## 1. 실행
```bash
npx serve -l 4321 .
```

http://localhost:4321
빌드 과정 없음. `index.html` 하나 + `assets/` 뿐.

## 2. 파일 구성

| 경로 | 역할 |
|---|---|
| `index.html` | 전체 페이지 (HTML + CSS + JS 단일 파일) |
| `assets/hero/frame.jpg` | 문틀·기둥·꽃·간판 — 스크롤 중 고정되는 배경 |
| `assets/hero/door-l.jpg` · `door-r.jpg` | 좌·우 문짝 (각각 경첩 기준 회전) |
| `assets/hero/gate-bg.jpg` | 문 뒤로 보이는 공간 (문짝을 지운 인페인팅 결과에서 개구부만 크롭) |
| `assets/photo/reveal.jpg` | 문 열린 뒤 아래에서 올라오는 사진 |
| `assets/photo/s1~s2.jpg` | 갤러리 단독 게재 2장 — origin `2`·`8` (원본 비율 유지) |
| `assets/photo/t01~t15.jpg` | 갤러리 썸네일 15장 (336×366) |
| `assets/photo/f01~f15.jpg` | 썸네일 클릭 시 띄우는 확대본 (장변 2800, 장당 약 260KB) |
| `assets/photo/map.jpg` | 약도 |
| `assets/origin/` | 촬영 원본 `1~17` `map.jpg` `door-2.jpeg`, AI 로 문 위를 채운 `door-4.png`, 둘을 합친 첫 화면 소스 `door-5.jpg` — **git 제외**. 확장자가 `.jpg`/`.jpeg` 섞여 있어 빌드 스크립트가 있는 쪽을 찾아 쓴다 |
| `tools/build-door.mjs` | `origin/door-2.jpeg` + `door-4.png` → 첫 화면 소스 `origin/door-5.jpg` |
| `tools/build-assets.mjs` | `origin/door-5.jpg` → 문틀·문짝 자산 |
| `tools/build-gen.mjs` | 인페인팅 결과 → 문 뒤 공간(`gate-bg`) |
| `tools/build-photos.mjs` | `origin/1~17`·`map.jpg` → 갤러리·약도·reveal. 어느 원본이 어디로 가는지는 §4 사진 교체 |
| `tools/vertex-image.mjs` | Gemini 이미지 생성/편집 호출 (선택) |
| `assets/gate-src.jpg` | 문짝만 지운 인페인팅 결과(848×1248) — `gate-bg.jpg` 소스 |
| `assets/qr.svg` · `qr.png` | 배포 주소 QR — **종이 청첩장 인쇄 업체 전달용** |
| `tools/build-qr.mjs` | QR 생성 |
| `tools/build-og.mjs` | 공유 미리보기 카드 이미지 생성 → `assets/og.jpg` |
| `assets/og.jpg` | 카카오톡·문자 공유 시 뜨는 미리보기 카드 (1200×630) |
| `assets/bgm.mp3` | 배경음악 — Pixabay "Wedding" (PaulYudin, 1:59, 3.64MB). **없으면 재생 버튼이 뜨지 않는다** |
| `HANDOFF.md` | 남은 작업·함정·종결 판정 (진행상황은 이쪽 소관) |
| `tools/rsvp.gs` | 참석 의사 수집용 Apps Script (스프레드시트에 붙여넣는 코드) |
| `tools/measure-scroll.mjs` | 문 열림 구간 프레임·각도 측정 + 구간별 스냅샷 |

## 3. 동작 원리
스크롤 구간 `300svh` 를 진행률 `p` (0~1) 로 환산 → CSS 변수에 주입.

```
p 0.000~0.015  문 닫힘 + "SCROLL" 힌트
p 0.015~0.50   좌 rotateY(-θ) / 우 rotateY(+θ),  θ 0 → 82°  (기본 = 바깥쪽으로 열림)
               동시에 화면 zoom 1 → 1.22 (문 안으로 걸어 들어가는 느낌)
p 0.42~0.70    전체 화이트아웃
p 0.55~1.00    사진 + 날짜가 아래에서 위로 상승
그 이후        IntersectionObserver 로 섹션별 순차 등장
```

레이어 순서 (아래 → 위): `frame` → `gate`(문 뒤 공간) → `doors`(문짝 2장) → `flash`(화이트아웃) → `reveal`(상승 화면)

**`perspective` 는 `.doors` 에만 둔다. `.photo` 에 `transform-style: preserve-3d` 를 주면 안 된다.**
같은 3D 공간에 있는 형제 요소는 DOM 순서가 아니라 z 깊이로 정렬된다. 문짝이 안쪽으로 회전하면 z 가 음수가 되어 불투명한 `.gate` 뒤로 밀리고, **문이 열리기 시작하는 순간 문짝이 통째로 사라진다**(닫힘/열림 2컷처럼 보임).
`perspective` 를 `.doors` 에 두면 문짝 회전은 그 박스 안에서만 3D 로 계산되고 `.doors` 자체는 평면 요소로 취급되어, DOM 순서대로 항상 `.gate` 위에 그려진다.

`MAX_DEG` 는 90 을 넘겨도 된다. 90 도를 지나면 문짝 뒷면이 보이는데, 앞면 무늬가 좌우로 뒤집혀 그려질 뿐 나뭇결 판문이라 티가 나지 않고 활짝 젖혀진 문으로 읽힌다. 현재값 110.

### 열리는 방향

`:root` 의 `--swing` 값 하나로 뒤집는다.

| 값 | 방향 | 인상 |
|---|---|---|
| `1` | 안쪽 — 문이 홀 안으로 밀려 들어감 | 문 너머 공간이 넓게 드러난다. 차분함 |
| `-1` (기본) | 바깥쪽 — 문이 보는 사람 쪽으로 열림 | 문짝이 원근으로 커지며 화면 양옆을 스쳐 지나간다. 극적 |

바깥쪽으로 돌릴 때는 문짝 z 가 양수가 되므로 3D 정렬 문제가 없다. 안쪽으로 돌릴 때만 위의 `.doors` 구조가 필요하다.

원본 사진 비율 박스(`--img-w : --img-h`)를 `cover` 로 화면에 채우고, 문짝을 그 박스의 **% 좌표**로 배치 → 화면 크기·기기와 무관하게 문틀과 정확히 정렬.

## 4. 수정 지점

### 문짝 위치가 문틀과 어긋날 때

`index.html` 의 `:root` 값만 조정. `assets/origin/door-5.jpg`(1400×2025) 기준 백분율 — `tools/build-assets.mjs` 를 돌리면 그대로 출력된다.

문이 화면에서 차지하는 크기(= 카메라가 얼마나 앞인지)는 `tools/build-door.mjs` 의 `H` 로 정해진다. 세로가 짧을수록 화면 높이에 맞추느라 문이 커진다. 문이 화면에서 얼마나 아래에 놓이는지는 `GLASS`(유리천장을 눌러 넣는 높이) — 키울수록 위가 채워지고 아래 계단이 줄어든다. 아이비는 눌리면 티가 나서 비율 그대로 붙인다. 아이폰(390×844) 기준 실측.

| 대문 사진 | 문짝(좌) 폭 | 문 높이 | 문 상단 위치 |
|---|---|---|---|
| door-2 원본 | 187px | 480px | 90px |
| door-4 (AI 로 문 위를 채운 것) | 148px | 354px | 276px |
| **door-5 (지금)** | **190px** | **488px** | **171px** |

door-4 를 그대로 쓰지 않는 이유 = 800px 로 작아 나뭇결·조각이 뭉갠다. Gemini 는 1400×2352 를 요청해도 800×1344 로만 출력한다(2회 실측). 그래서 문짝·문틀은 촬영 원본 door-2(1400px)를 그대로 쓰고, 문 위 유리천장·아이비만 door-4 에서 가져와 붙였다.

위를 채운 만큼 문 아래 계단이 줄어든다 — 화면 높이가 정해져 있어 위아래가 서로 자리를 뺏는다. `GLASS 150`(원래 333px 을 45% 로 누름) + `IVY_H 56`(아이비 띠 위쪽 1/3 만) 에서 문 위 171px · 문 아래 185px.

```css
--door-l: 17.429%;  /* 문 왼쪽 끝 */
--door-r: 82.214%;  /* 문 오른쪽 끝 */
--door-t: 20.247%;  /* 문 위쪽 */
--door-b: 78.074%;  /* 문 아래쪽 */
--door-c: 50.000%;  /* 두 문짝 분할선 */
--shift-x:  0.35%;  /* 첫 화면 좌우 이동. +면 오른쪽 */
```

대문 사진 자체를 다시 만들려면 `tools/build-door.mjs` 를 먼저 돌린다. 문 좌표를 출력하므로 그 값을 `build-assets.mjs` 의 `D`·`H` 와 `index.html` 의 `:root` 에 옮긴다.

```bash
node tools/build-door.mjs && node tools/build-assets.mjs
```

### 열리는 속도·각도·연출

`index.html` 하단 스크립트의 타임라인 상수.

```js
const OPEN  = [0.015, 0.50]; // 문 회전 구간
const FLASH = [0.42, 0.70];  // 화이트아웃 구간
const RISE  = [0.55, 1.00];  // 다음 화면 상승 구간
const MAX_DEG  = 110;        // 최대 회전각
const MAX_ZOOM = 1.22;       // 최대 확대
```

스크롤 길이는 CSS `.hero { height: 300svh }` 로 정한다. 아이폰(390×844) 기준 실측.

| 지점 | 진행률 | 내려야 하는 거리 |
|---|---|---|
| 문이 화면 밖으로 사라짐 | 0.26 | 439px (0.52화면) |
| 화이트아웃 시작 | 0.42 | 709px (0.84화면) |
| 화이트아웃 끝 | 0.70 | 1182px (1.40화면) |
| 다음 사진 완전 등장 | 1.00 | 1688px (2.00화면) |

문 회전에는 **감속형 이징(`easeOutQuad`)만 쓴다.** 가속형(`easeInOut`)을 쓰면 스크롤 초반 수백 px 동안 각도가 1도도 안 움직여, 아무리 내려도 반응이 없는 것처럼 느껴진다.

### 문 두께

`.door::before` 가 문짝 여닫는 쪽 모서리에 세운 옆면이다. 폭 `10%` 를 키우면 두꺼워진다.

**단위는 `%`(문짝 폭 기준)를 쓴다. `rem`·`px` 은 쓰지 않는다** — 문짝 폭은 화면 크기에 비례해 변하는데 두께만 고정되면 큰 화면에서 얇고 작은 화면에서 두꺼워 보인다.

### 사진 교체

`assets/origin/` 에 새 사진을 넣고 번호를 맞춘 뒤 `node tools/build-photos.mjs` 를 다시 돌린다.

| origin | 쓰이는 곳 | 처리 |
|---|---|---|
| `1` | 문 열린 뒤 올라오는 사진(`reveal.jpg`) + 갤러리 격자 4번째 | reveal 은 3:4 중앙 크롭 |
| `2` | 갤러리 단독 1번(`s1.jpg`) | 원본 비율 유지 (자르지 않음) |
| `8` | 갤러리 단독 2번(`s2.jpg`) | 원본 비율 유지 (자르지 않음) |
| `3~7` `9~17` + `1` | 갤러리 썸네일 격자 15장 (`1` 은 4번째 자리) | 썸네일은 112:122 중앙 크롭(336×366), 확대본은 원본 비율 장변 2800 |
| `map.jpg` | 약도 | 폭 932 그대로, 품질 90 |

### 배경음악

`assets/bgm.mp3` 를 넣으면 우측 상단에 음표 버튼이 나타난다. 파일이 없으면 버튼째 숨겨져 페이지는 그대로 동작한다.

| 동작 | 이유 |
|---|---|
| 첫 탭·스크롤 때 재생 시작 | 모바일 브라우저는 사용자가 화면을 건드리기 전에는 소리를 못 낸다 |
| 재생 시작 순간 버튼 옆에 `배경음악 재생 중 · 탭하여 끄기` 3초 표시 + 버튼 테두리 2회 퍼짐 | 소리가 나는 줄 모르고 있다가 놀라지 않게. 페이지를 열 때마다 한 번 |
| 3초에 걸쳐 소리 키움 (최대 35%) | 갑자기 크게 나면 놀란다 |
| 껐으면 다음에 와도 꺼짐 | 브라우저에 `bgm-off` 로 기록 |
| 다른 탭으로 가면 멈춤 | 돌아오면 다시 켜진다 |

지금 음원 = Pixabay **"Wedding"** by PaulYudin · 1:59 · 3.64MB · 라이선스 `Pixabay Content License`(상업적 이용 무료·출처 표기 불필요). 출처 = https://pixabay.com/music/modern-classical-wedding-485932/

바꾸려면 `assets/bgm.mp3` 만 덮어쓴다. 조건 = 저작권 걸리지 않는 것(CC0·로열티 프리 또는 직접 구매), 1~3분. `preload="none"` 이라 첫 조작 전에는 내려받지 않으므로 용량이 첫 로딩에 영향을 주지 않는다.

### 텍스트

문구는 전부 채워져 있다. 플레이스홀더 잔존 0건.

| 위치 | 내용 |
|---|---|
| 대문 중앙 로고 `.hero__logo` | Yuchan & Hyejin |
| 대문 하단 `.hero__title` | 유찬💕혜진 / 11/14(토) 오후 6:30 — `visibility:hidden` 으로 감춰둠. 되살리려면 그 한 줄 삭제 |
| 예식 안내 | 2026년 11월 14일 토요일 오후 6시 30분 · 토브헤세드 |
| 예식장 주소 | 서울시 강남구 논현 2동 도산대로 38길 32 (논현동 72-8번지) |
| 오시는 길 | 약도 이미지 + 네이버·카카오 지도 앱 버튼. 지하철·버스 안내문은 두지 않는다 |
| 연락처 카드 · 계좌 | 신랑·신부 양가 |

### 대문 중앙 로고

`.hero__logo` — Cormorant Garamond SemiBold(600), 흰색, 트래킹 `.05em`(+50).
이름 `clamp(68px, 21.54vw, 122px)` = 화면 폭 비례(390px 폰에서 84px), `&` 는 이름의 `0.7em`(390px 폰에서 59px), 행간 `1`. 위치 = 문 세로 중앙에서 문 높이의 15% 위 (문 좌표로 계산).

**Photoshop 과 달리 CSS `text-shadow` 에 spread 미존재.** 값 4개 중 `offset-x offset-y blur color` 만 지원 → 퍼짐은 짧은 그림자를 겹쳐 흉내낸다. 현재값 = `0 0 21px rgba(0,0,0,.48)` + `0 0 7px rgba(0,0,0,.34)`. 정확히 재현하려면 SVG `feMorphology` + `feGaussianBlur` 필요.
마지막 글자 뒤에 붙는 자간 때문에 가운데정렬이 왼쪽으로 밀리므로 `margin-right:-.05em` 로 상쇄한다.

## 5. 참석 의사 전달 (R.S.V.P)

응답은 Google 스프레드시트에 쌓인다. 정적 사이트라 서버가 없으므로 Apps Script 웹앱을 수집처로 쓴다.

### 배포 (1회)

1. **스프레드시트 생성** — https://sheets.new 접속. 이름은 아무거나.

2. **Apps Script 열기** — 그 스프레드시트에서 `확장 프로그램` → `Apps Script`

3. **코드 붙여넣기** — 편집기의 기존 코드(`function myFunction() {}`)를 **전부 지우고**,
   `tools/rsvp.gs` 내용을 붙여넣은 뒤 저장(Ctrl+S)

4. **배포** — `배포` → `새 배포` → 톱니바퀴에서 유형 `웹 앱` 선택

   | 항목 | 값 |
   |---|---|
   | 설명 | 아무거나 (예: rsvp v1) |
   | 실행 계정 | **나** |
   | 액세스 권한이 있는 사용자 | **모든 사용자** |

   `모든 사용자` 로 바꾸지 않으면 하객이 보낼 때 실패한다. 기본값이 `나만` 이므로 반드시 확인.

5. **권한 승인** — 처음 배포하면 경고 화면이 나온다.
   `고급` → `<프로젝트 이름>(으)로 이동` → 계정 선택 → `허용`

6. **URL 복사** — 배포 완료 창의 `웹 앱 URL`
   (`https://script.google.com/macros/s/AKfy.../exec` 형태)

7. **주소를 넣고 배포**

   `index.html` 에서 `RSVP_ENDPOINT` 를 찾아 6번의 URL 을 넣는다.

   ```js
   const RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfy.../exec';
   ```

   ```bash
   git add index.html
   git commit -m "chore: 참석 의사 수집 주소 연결"
   git push origin main
   ```

   1~2분 뒤 사이트에 섹션과 팝업이 나타난다.

8. **확인** — 사이트에서 직접 한 번 보내보고 스프레드시트 `모청 참석 회신 v3` 시트에 줄이 생기는지 본다.
   실패하면 4단계의 액세스 권한을 다시 확인한다.

#### 코드를 고친 뒤에는 다시 배포해야 한다

`tools/rsvp.gs` 를 수정하면 `배포` → `배포 관리` → 연필 → 버전 `새 버전` → `배포`.
새 배포를 만들면 URL 이 바뀌므로, 기존 URL 을 유지하려면 **배포 관리에서 버전만 올린다**.

#### 열 구성을 바꿀 때는 시트 버전을 올린다

`SHEET_NAME` 뒤 버전을 올린다 (`모청 참석 회신 v3` → `v4`).
같은 이름을 두면 열 순서가 달라진 회신이 옛 줄과 섞여 읽을 수 없게 된다. 버전을 올리면 새 시트가 자동으로 생기고 옛 회신은 옛 시트에 그대로 남는다.


### 동작

| 항목 | 내용 |
|---|---|
| 위치 | 오시는 길 다음 · 마음 전하실 곳 앞 |
| 팝업 | **자동으로 뜨지 않는다.** 버튼을 눌러야 열리고, 몇 번이든 다시 고칠 수 있다 |
| 입력 | 필수 = 구분 · 참석 여부 · 식사 인원수 (전부 버튼) / 선택 = 성함 · 전달 말씀 |
| 식사 인원수 | 1~4 버튼 + 증감 버튼(0~20). 미참석 선택 시 항목 비활성 |
| 재전송 | 한 번 답하면 버튼 문구가 `참석 의사 다시 전달하기` 로 바뀌고, 다시 보내면 같은 줄을 고쳐 쓴다 |
| 방문자 식별 | `crypto.randomUUID()` 로 만든 값을 `localStorage` 에 저장. **브라우저는 MAC 주소·기기 고유번호에 접근할 수 없다** |
| 전송 | 요청 헤더를 붙이지 않아 사전요청(preflight)이 생기지 않는다. Apps Script 가 시트에 한 줄 추가 |

`localStorage` 는 시크릿 모드·일부 인앱 브라우저에서 **접근만으로도 예외를 던진다.** 감싸지 않으면 그 아래 스크립트 전체가 실행되지 않으므로 `try/catch` 로 감싸 쓴다.

### 응답 확인

스프레드시트 `모청 참석 회신 v3` 시트 — 방문자ID · 구분 · 참석여부 · 식사인원 · 성함 · 전달말씀 · 최초접수 · 최종수정 · 수정횟수.

같은 방문자 ID 로 다시 보내면 **새 줄을 만들지 않고 그 줄을 고쳐 쓰고 수정횟수를 올린다.**
웹앱 URL 을 브라우저에서 그냥 열면 현재 접수 건수가 JSON 으로 나온다.

브라우저 저장소를 지우거나 다른 기기로 접속하면 새 방문자로 잡혀 줄이 하나 더 생긴다.

**IP 는 쓸 수 없다** — Apps Script 는 요청자 IP 를 받지 못하고, 외부 API 로 받아도 통신사 NAT 로 여러 사용자가 같은 값을 쓰거나 접속마다 바뀌어 식별자로는 UUID 보다 못하다.
**기기 이름·계정명도 얻을 수 없다** — 브라우저에 해당 API 가 없다. 성함(선택)을 받는 것이 사람을 특정하는 유일한 수단.


## 6. 공유 미리보기 카드 (카카오톡·문자)

링크를 카카오톡·문자로 보낼 때 채팅방에 뜨는 카드. `index.html` `<head>` 의 Open Graph 태그가 내용을 정한다.
태그가 없으면 카드가 아니라 주소만 덩그러니 뜬다.

```bash
node tools/build-og.mjs
```

| 항목 | 값 |
|---|---|
| 이미지 | `assets/og.jpg` 1200×630 (권장 비율 1.91:1) · 약 100KB |
| 배경 사진 | `assets/origin/2.jpg` (본문 두 번째 단독 사진) · 세로 사진이라 얼굴이 위로 오게 `object-position:50% 38%` 로 잘라낸다 |
| 제목 | 유찬 💕 혜진 결혼합니다 |
| 설명 | 2026. 11. 14. 토요일 오후 6시 30분 · 토브헤세드 |

**`og:image` 는 절대주소여야 한다.** 상대경로를 쓰면 카카오톡이 이미지를 못 가져온다.
한글 글꼴이 필요해 이미지는 sharp 가 아니라 헤드리스 Chrome 으로 그린다.

### 카드가 안 바뀔 때

카카오톡은 링크별 카드를 오래 캐시한다. 태그를 고친 뒤 옛 카드가 계속 나오면
[카카오 개발자 도구 → 캐시 초기화](https://developers.kakao.com/tool/clear/og) 에 주소를 넣어 지운다.

## 7. QR 코드 — 종이 청첩장 인쇄용

청첩장 주소를 QR 로 뽑아 **인쇄 업체에 전달**하는 용도. 웹 페이지 안에는 넣지 않는다.

```bash
node tools/build-qr.mjs
```

주소가 바뀌면 인자로 넘긴다 — `node tools/build-qr.mjs https://example.com/`

### 업체에 넘길 파일

| 파일 | 설명 | 우선순위 |
|---|---|---|
| `assets/qr.svg` | 벡터. 업체가 어떤 크기로 배치해도 안 깨진다 | **이걸 먼저 준다** |
| `assets/qr.png` | 1200px 래스터. 업체가 SVG 를 못 받을 때만 | 대체용 |

### 인쇄 사양 (업체 전달 시 함께 명시)

| 항목 | 값 | 이유 |
|---|---|---|
| 코드 구성 | 37×37 모듈 + 사방 여백 4모듈 = **45×45** | — |
| **최소 인쇄 크기** | **가로세로 25mm 이상** | 모듈 하나가 0.5mm 이상이어야 휴대폰 카메라가 안정적으로 읽는다 |
| 권장 크기 | 30~40mm | 실내 조명·구형 기기까지 여유 |
| 여백(quiet zone) | **사방 흰 여백을 잘라내지 말 것** | 이미 파일에 4모듈 포함. 잘라내면 인식률이 급격히 떨어진다 |
| 색상 | 코드 `#3a352f` / 배경 흰색 | 청첩장 본문 색과 맞춘 값. 명암비 충분 |
| 반전 | **금지** — 밝은 배경 위 어두운 코드 유지 | 반전 코드는 못 읽는 리더기가 많다 |
| 배경 | 사진·패턴 위에 얹지 말 것 | 단색 배경만 |

업체가 순수 검정(`#000000`)을 요구하면 `tools/build-qr.mjs` 의 `dark` 값만 바꿔 다시 생성한다.

오류정정 수준 **Q** (25% 손상까지 복원) — 인쇄물이 접히거나 가운데에 작은 로고를 얹어도 읽힌다.

## 8. Gemini 이미지 생성 (선택)

`assets/hero/gate-bg.jpg` 는 이미 AI 인페인팅 결과(`assets/gate-src.jpg`)로 적용돼 있음. 다시 만들 때만 아래 사용.

사용한 프롬프트:

> 첨부한 웨딩홀 정면 사진에서 가운데 나무 여닫이문 두 짝만 완전히 제거하고, 그 자리에 문 안쪽으로 이어지는 실내 공간을 자연스럽게 채워줘. 원본의 대리석 헤링본 바닥, 회색 석재 문틀, 조명 톤, 원근을 그대로 유지. 문틀 바깥 영역(간판, 꽃, 기둥, 계단)은 픽셀 단위로 원본 그대로 보존. 안쪽은 밝은 자연광이 쏟아지는 하얀 공간으로. 원본과 동일한 해상도.

생성 결과는 원본 좌표와 어긋나므로 **문틀 안쪽 개구부만 잘라내 쓴다** (`tools/build-gen.mjs` 의 `extract` 좌표. 결과물 해상도가 바뀌면 이 좌표도 다시 재야 함).

```bash
GEMINI_API_KEY=... node tools/vertex-image.mjs assets/gen-gate.png "<프롬프트>" "assets/origin/door-2.jpeg"
```

`GEMINI_API_KEY` 없으면 Vertex AI + gemini CLI OAuth 토큰으로 폴백. 단 해당 GCP 프로젝트에 `aiplatform.endpoints.predict` 권한이 있어야 함.

**입력은 반드시 촬영 원본 `assets/origin/door-2.jpeg`** — 가공본은 축소로 정보가 손실돼 있어 소스로 부적합.

## 9. 배포

**지금 쓰는 방식 = GitHub Pages.** 완전 무료 + 가장 쉬움. AWS 는 학습 목적이거나 접속 로그·세밀한 캐시 제어가 필요할 때만.

빌드·서버 로직이 없는 순수 정적 사이트 → 정적 호스팅 아무 곳이나 가능.
**올릴 것은 `index.html` + `assets/hero` + `assets/photo` + `assets/qr.*` 뿐.**
`assets/origin/`(촬영 원본, git 제외)과 `tools/` 는 자산 재생성용이라 배포 대상이 아니다.

| # | 방식 | 비용 | 세팅 | HTTPS | 자동배포 | 판정 |
|---|---|---|---|---|---|---|
| 9-1 | GitHub Pages | 0원 | 3클릭 | O | push 시 | **채택** |
| 9-2 | Amplify Hosting | 12개월 뒤 유료 | 콘솔 5분 | O | push 시 | 대안 |
| 9-3 | S3 + CloudFront | 0원 (CloudFront 기본 주소일 때만) | 20~30분 | O | 수동 sync | 대안 |
| 9-4 | S3 단독 | 월 0.1 USD | 10분 | X (http 만) | 수동 sync | 비권장 |
| 9-4 | Lightsail · EC2 + nginx | 월 3.5~5 USD | 30분+ | O | 수동 | 비권장 |

### 9-1. GitHub Pages — 무료 · 가장 쉬움

저장소가 **public** 이어야 무료다. private 이면 GitHub Pro 필요.

1. 저장소에 push

   ```bash
   git push -u origin main
   ```

2. GitHub 저장소 → **Settings** → 좌측 **Pages**
3. Source = `Deploy from a branch` · Branch = `main` · 폴더 = `/ (root)` → **Save**
4. 1~2분 후 상단에 주소가 뜬다 → `https://<계정>.github.io/wedding-invitation/`

#### 커스텀 도메인 (선택)

1. Pages 화면의 **Custom domain** 에 `wed.example.com` 입력 → Save
2. 도메인 DNS에 CNAME 추가 — `wed` → `<계정>.github.io`
3. 검증되면 **Enforce HTTPS** 체크박스 활성화 → 체크 (인증서 무료·자동 갱신)

도메인 등록비(연 1~2만원) 외 추가 비용 없음.

#### 주의

- 저장소 루트에 `index.html` 이 있으므로 Jekyll 빌드가 끼어들 여지는 없다. `_` 로 시작하는 파일도 없으니 `.nojekyll` 불필요
- 원본 사진 4장이 저장소에 함께 올라가 있다. Pages 로 서빙되긴 하지만 `index.html` 이 참조하지 않으므로 하객 트래픽에는 영향 없음
- 소프트 제한 = 저장소 1GB · 월 전송 100GB. 현재 저장소 15MB 라 무관

---

### 9-2. Amplify Hosting — 콘솔 5분 · git 연동 자동배포

빌드 스텝이 없으므로 아래 파일만 저장소 루트에 두면 된다.

`amplify.yml`

```yaml
version: 1
frontend:
  phases:
    build:
      commands:
        - echo "static site, no build"
  artifacts:
    baseDirectory: /
    files:
      - index.html
      - assets/**/*
```

1. AWS 콘솔 → **Amplify** → `Deploy an app`
2. Source = **GitHub** → 권한 승인 → 저장소 `wedding-invitation` · 브랜치 `main`
3. Build settings = 위 `amplify.yml` 자동 인식 (안 잡히면 화면에서 직접 붙여넣기)
4. `Save and deploy` → 2~3분 후 `https://main.dxxxxxx.amplifyapp.com` 발급

이후 `git push` 만 하면 자동 재배포. HTTPS 기본 포함.

#### 커스텀 도메인 (선택)

Amplify → 해당 앱 → **Hosting → Custom domains** → 도메인 입력.
Route 53 에 있으면 레코드까지 자동 생성, 외부 등록기관이면 안내되는 CNAME 을 직접 등록. 인증서는 Amplify 가 발급·갱신.

#### 비용

12개월 프리티어 = 빌드 1000분/월 · 전송 15GB/월 · 저장 5GB.
이 프로젝트는 빌드가 사실상 0초, 전송 2GB 미만 → **프리티어 안에서 0원.** 프리티어 만료 후엔 전송 $0.15/GB → 월 몇십원 수준.

---

### 9-3. S3 + CloudFront — 커스텀 도메인 없이 쓰면 무료

**CloudFront 기본 주소(`dxxxxxxxx.cloudfront.net`)만 쓰면 인증서·DNS 비용이 아예 발생하지 않는다.**
CloudFront 무료 티어(월 1TB 전송 · 1,000만 요청)는 계정 나이와 무관한 영구 무료라, 남는 과금 요소는 S3 스토리지 1.3MB 뿐 → 월 0.003센트, 청구서엔 `$0.00` 으로 찍힌다.

전제 = AWS CLI 설치 + `aws configure` 완료. 아래 `wedding-invitation-dylan` 은 전 세계에서 유일해야 하므로 본인 값으로 교체.

#### 1) 버킷 생성 + 업로드

퍼블릭 공개를 하지 않는다. CloudFront 가 OAC(Origin Access Control)로 대신 읽는다.

```bash
aws s3 mb s3://wedding-invitation-dylan --region ap-northeast-2
aws s3 sync ./assets s3://wedding-invitation-dylan/assets --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./index.html s3://wedding-invitation-dylan/index.html --cache-control "no-cache"
```

`index.html` 만 `no-cache`, `assets/*` 는 1년 캐시. 사진을 교체할 때 파일명을 바꾸면 캐시 무효화 없이 즉시 반영된다.

#### 2) CloudFront 배포 생성

콘솔 → CloudFront → `Create distribution`

| 항목 | 값 |
|---|---|
| Origin domain | 위 S3 버킷 선택 (`...s3.ap-northeast-2.amazonaws.com`) |
| Origin access | **Origin access control (OAC)** → `Create new OAC` |
| Viewer protocol policy | `Redirect HTTP to HTTPS` |
| Default root object | `index.html` |
| Price class | `Use only North America, Europe, Asia` (한국 하객이면 충분) |
| Alternate domain name / Custom SSL | **비워둔다** ← 여기서 도메인을 안 넣는 것이 무료의 조건 |

생성 직후 안내되는 **버킷 정책을 복사해 S3 버킷에 적용**한다 (CloudFront 만 읽도록). 콘솔의 `Copy policy` 버튼 → S3 → 해당 버킷 → Permissions → Bucket policy 에 붙여넣기.

배포 상태가 `Deployed` 되면 (5~10분) `https://dxxxxxxxx.cloudfront.net` 으로 접속.

#### 3) 갱신 배포

```bash
aws s3 cp ./index.html s3://wedding-invitation-dylan/index.html --cache-control "no-cache"
aws s3 sync ./assets s3://wedding-invitation-dylan/assets --cache-control "public,max-age=31536000,immutable"
aws cloudfront create-invalidation --distribution-id <배포ID> --paths "/index.html" "/assets/*"
```

무효화는 월 1,000경로까지 무료.

#### 4) 커스텀 도메인을 붙이려면 (여기서부터 유료)

1. **ACM 인증서** — CloudFront용은 반드시 `us-east-1`

   ```bash
   aws acm request-certificate --domain-name wed.example.com \
     --validation-method DNS --region us-east-1
   ```

   출력된 CNAME 검증 레코드를 도메인 DNS 에 등록 → `ISSUED` 확인

2. CloudFront 배포 편집 → **Alternate domain name** 에 `wed.example.com` + 위 인증서 선택
3. DNS 연결
   - Route 53 사용 시 = A 레코드 Alias → CloudFront 배포. **호스팅 영역 월 $0.50 발생**
   - **Cloudflare DNS(무료) 사용 시** = CNAME `wed` → `dxxxxxxxx.cloudfront.net`. ACM 검증 레코드도 여기 넣으면 **$0.50 을 안 낸다**

---

### 9-4. 나머지 (비권장)

| 방식 | 판정 | 사유 |
|---|---|---|
| S3 정적 웹사이트 호스팅 단독 | 비권장 | **http 만.** 카카오톡 공유 시 og:image 미리보기가 안 뜨는 경우가 있음 |
| Lightsail / EC2 + nginx | 비권장 | 정적 사이트인데 서버 유지비 월 3.5~5 USD 만 나감. 필요하면 `apt install nginx` → `rsync` → `certbot --nginx` |

---

### 9-5. 비용 — 어디까지 무료인가

자산 총량 약 1.3MB, 하객 500명이 각 3회 열어도 월 전송량 2GB 미만. **어느 방식을 골라도 트래픽 요금 구간에 도달하지 않는다.** 돈이 새는 곳은 트래픽이 아니라 **DNS 호스팅 영역과 도메인 등록비** 뿐이다.

| 항목 | 무료 범위 | 초과 단가 | 이 프로젝트 실제 |
|---|---|---|---|
| CloudFront 전송 | **월 1TB · 요청 1,000만 (계정 나이 무관 영구 무료)** | $0.114/GB | 0원 |
| S3 스토리지 | 12개월 프리티어 5GB | $0.025/GB/월 (서울) | 1.3MB → 0.003센트 |
| S3 요청 | 12개월 프리티어 GET 2만 / PUT 2천 | GET $0.00043/1천 | 0원 수준 |
| CloudFront 무효화 | 월 1,000 경로 | $0.005/경로 | 0원 |
| ACM 인증서 | **영구 무료** | — | 0원 |
| **Route 53 호스팅 영역** | **무료 없음** | **$0.50/월** | 커스텀 도메인 쓸 때만 |
| 도메인 등록 (.com) | 무료 없음 | 약 $14/년 | 커스텀 도메인 쓸 때만 |
| Amplify Hosting | 12개월 프리티어 (빌드 1000분 · 전송 15GB · 저장 5GB) | 전송 $0.15/GB | 0원 |
| GitHub Pages | public 저장소 무제한 · 월 100GB 전송 | — | 0원 |

정리 —

- **CloudFront 기본 주소로 만족하면 AWS 비용 0원.** 도메인·DNS를 안 사는 것이 조건
- 커스텀 도메인 + Route 53 = **월 $0.50 고정** + 도메인 등록비
- Route 53 우회 = **Cloudflare DNS(무료)** 에 도메인 올리고 CNAME 만 CloudFront 로 → 월 $0.50 도 안 낸다

### 9-6. AWS 를 아예 안 쓰는 무료 대안

정적 사이트라 결과물은 동일하다.

| 서비스 | 무료 범위 | 커스텀 도메인 HTTPS |
|---|---|---|
| **GitHub Pages** | public 저장소 · 월 100GB 전송 | 무료 |
| **Cloudflare Pages** | 전송 무제한 · 빌드 월 500회 | 무료 |
| Vercel / Netlify | 월 100GB 전송 | 무료 |

도메인 등록비는 어디서도 못 피한다. 그것마저 안 쓰면 `<계정>.github.io/wedding-invitation` 무료 주소로 끝낼 수 있다.
