# 모바일 청첩장 — 스크롤로 문이 열리는 청첩장

베뉴(Tov Hesed) 실제 입구 사진을 좌·우 문짝으로 잘라, 스크롤 진행률에 맞춰 `rotateY` 로 열리게 한 단일 파일 모바일 청첩장.
동영상·GIF·이미지 시퀀스 미사용 → 첫 화면 자산 400KB 미만, 스크롤 역방향도 그대로 되감김.

**배포 주소** — https://dylan-bak.github.io/wedding-invitation/ (GitHub Pages, `main` 에 push 하면 1~2분 뒤 자동 반영)

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
| `assets/hero/frame.jpg` | 문틀·기둥·꽃·간판 — 스크롤 중 고정되는 배경 |
| `assets/hero/door-l.jpg` · `door-r.jpg` | 좌·우 문짝 (각각 경첩 기준 회전) |
| `assets/hero/gate-bg.jpg` | 문 뒤로 보이는 공간 (문짝을 지운 인페인팅 결과에서 개구부만 크롭) |
| `assets/photo/reveal.jpg` | 문 열린 뒤 아래에서 올라오는 사진 |
| `assets/photo/s1~s2.jpg` | 갤러리 단독 게재 2장 (원본 비율 유지) |
| `assets/photo/t01~t15.jpg` | 갤러리 썸네일 15장 (336×366) |
| `assets/photo/f01~f15.jpg` | 썸네일 클릭 시 띄우는 확대본 (장변 2000, 장당 약 150KB) |
| `assets/photo/map.jpg` | 약도 |
| `assets/origin/` | 촬영 원본 `1~17` `door-2.jpeg` `map.jpg` — **git 제외**. 확장자가 `.jpg`/`.jpeg` 섞여 있어 빌드 스크립트가 있는 쪽을 찾아 쓴다 |
| `tools/build-assets.mjs` | `origin/door-2.jpeg` → 문틀·문짝 자산 |
| `tools/build-gen.mjs` | 인페인팅 결과 → 문 뒤 공간(`gate-bg`) |
| `tools/build-photos.mjs` | `origin/1~17`·`map.jpg` → 갤러리·약도·reveal |
| `tools/vertex-image.mjs` | Gemini 이미지 생성/편집 호출 (선택) |
| `assets/gate-src.jpg` | 문짝만 지운 인페인팅 결과(848×1248) — `gate-bg.jpg` 소스 |
| `assets/qr.svg` · `qr.png` | 배포 주소 QR — **종이 청첩장 인쇄 업체 전달용** |
| `tools/build-qr.mjs` | QR 생성 |
| `tools/measure-scroll.mjs` | 문 열림 구간 프레임·각도 측정 + 구간별 스냅샷 |

## 3. 동작 원리

스크롤 구간 `460svh` 를 진행률 `p` (0~1) 로 환산 → CSS 변수에 주입.

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

`MAX_DEG` 는 **90 미만**이어야 한다. 정확히 90도면 문짝이 정면으로 서서 두께 0 이 되어 사라진다.

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

`index.html` 의 `:root` 값만 조정. `assets/origin/door-2.jpeg`(1400×2061) 기준 백분율.

```css
--door-l: 17.429%;  /* 문 왼쪽 끝 */
--door-r: 82.214%;  /* 문 오른쪽 끝 */
--door-t: 10.626%;  /* 문 위쪽 */
--door-b: 67.443%;  /* 문 아래쪽 */
--door-c: 50.000%;  /* 두 문짝 분할선 */
--shift-x:  0.35%;  /* 첫 화면 좌우 이동. +면 오른쪽 */
```

바꿨으면 문짝 이미지도 같은 좌표로 다시 잘라야 함 → `tools/build-assets.mjs` 상단 `D` 상수 수정 후

```bash
node tools/build-assets.mjs
```

### 열리는 속도·각도·연출

`index.html` 하단 스크립트의 타임라인 상수.

```js
const OPEN  = [0.015, 0.50]; // 문 회전 구간
const FLASH = [0.42, 0.70];  // 화이트아웃 구간
const RISE  = [0.55, 1.00];  // 다음 화면 상승 구간
const MAX_DEG  = 82;         // 최대 회전각 (90 미만이어야 함)
const MAX_ZOOM = 1.22;       // 최대 확대
```

스크롤 길이 자체를 늘리려면 CSS `.hero { height: 460svh }`.

문 회전에는 **감속형 이징(`easeOutQuad`)만 쓴다.** 가속형(`easeInOut`)을 쓰면 스크롤 초반 수백 px 동안 각도가 1도도 안 움직여, 아무리 내려도 반응이 없는 것처럼 느껴진다.

### 문 두께

`.door::before` 가 문짝 여닫는 쪽 모서리에 세운 옆면이다. 폭 `10%` 를 키우면 두꺼워진다.

**단위는 `%`(문짝 폭 기준)를 쓴다. `rem`·`px` 은 쓰지 않는다** — 문짝 폭은 화면 크기에 비례해 변하는데 두께만 고정되면 큰 화면에서 얇고 작은 화면에서 두꺼워 보인다.

### 사진 교체

`assets/origin/` 에 새 사진을 넣고 번호를 맞춘 뒤 `node tools/build-photos.mjs` 를 다시 돌린다.

| origin | 쓰이는 곳 | 처리 |
|---|---|---|
| `1` | 갤러리 단독 1번 + 문 열린 뒤 올라오는 사진 | 단독은 원본 비율, reveal 은 3:4 |
| `2` | 갤러리 단독 2번 | 원본 비율 유지 (자르지 않음) |
| `3~17` | 갤러리 썸네일 격자 15장 | 썸네일은 112:122 중앙 크롭(336×366), 확대본은 원본 비율 장변 2000 |
| `map.jpg` | 약도 | 폭 932 그대로, 품질 90 |

### 텍스트

이름·일시·연락처·계좌는 채워져 있다. `index.html` 에 `OO` 로 남은 곳만 확인하면 된다.

| 위치 | 상태 |
|---|---|
| 대문 중앙 로고 `.hero__logo` | Yuchan & Hyejin |
| 대문 하단 `.names` `.when` | 유찬💕혜진 / 11/14(토) 오후 6:30 |
| 예식 안내 일시 | 2026년 11월 14일 토요일 오후 6시 30분 |
| 연락처 카드 · 계좌 | 채워짐 |
| **예식장 주소 · 오시는 길(지하철·버스)** | **`OO` 로 비어 있음** |

### 대문 중앙 로고

`.hero__logo` — Cormorant Garamond SemiBold(600), 흰색, 트래킹 `.05em`(+50).
`&` 는 이름의 `0.5em`.

**Photoshop 과 달리 CSS `text-shadow` 에 spread 미존재.** 값 4개 중 `offset-x offset-y blur color` 만 지원 → 퍼짐은 짧은 그림자를 겹쳐 흉내낸다. 현재값 = `0 0 21px rgba(0,0,0,.48)` + `0 0 7px rgba(0,0,0,.34)`. 정확히 재현하려면 SVG `feMorphology` + `feGaussianBlur` 필요.
마지막 글자 뒤에 붙는 자간 때문에 가운데정렬이 왼쪽으로 밀리므로 `margin-right:-.05em` 로 상쇄한다.

## 5. QR 코드 — 종이 청첩장 인쇄용

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

### 넘기기 전 확인 (2가지 모두)

**1) 파일이 올바른 주소를 담고 있는지 디코딩으로 확인.** 눈으로는 틀린 QR 을 구별할 수 없다.

```bash
node -e "(async()=>{const sharp=(await import('sharp')).default;const jsQR=(await import('jsqr')).default;const {data,info}=await sharp('assets/qr.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});console.log(jsQR(new Uint8ClampedArray(data),info.width,info.height).data)})()"
```

**2) 시안이 나오면 실제 인쇄물을 휴대폰으로 스캔.** 화면에서 읽히는 것과 종이에서 읽히는 것은 다르다 — 잉크 번짐·크기 축소·코팅 반사에서 실패한다.

## 6. 자산 재생성

`assets/origin/` 의 촬영 원본이 있어야 함. `node_modules` (sharp) 필요.

```bash
npm i && node tools/build-assets.mjs && node tools/build-gen.mjs && node tools/build-photos.mjs
```

## 7. Gemini 이미지 생성 (선택)

`assets/hero/gate-bg.jpg` 는 이미 AI 인페인팅 결과(`assets/gate-src.jpg`)로 적용돼 있음. 다시 만들 때만 아래 사용.

사용한 프롬프트:

> 첨부한 웨딩홀 정면 사진에서 가운데 나무 여닫이문 두 짝만 완전히 제거하고, 그 자리에 문 안쪽으로 이어지는 실내 공간을 자연스럽게 채워줘. 원본의 대리석 헤링본 바닥, 회색 석재 문틀, 조명 톤, 원근을 그대로 유지. 문틀 바깥 영역(간판, 꽃, 기둥, 계단)은 픽셀 단위로 원본 그대로 보존. 안쪽은 밝은 자연광이 쏟아지는 하얀 공간으로. 원본과 동일한 해상도.

생성 결과는 원본 좌표와 어긋나므로 **문틀 안쪽 개구부만 잘라내 쓴다** (`tools/build-gen.mjs` 의 `extract` 좌표. 결과물 해상도가 바뀌면 이 좌표도 다시 재야 함).

```bash
GEMINI_API_KEY=... node tools/vertex-image.mjs assets/gen-gate.png "<프롬프트>" "assets/origin/door-2.jpeg"
```

`GEMINI_API_KEY` 없으면 Vertex AI + gemini CLI OAuth 토큰으로 폴백. 단 해당 GCP 프로젝트에 `aiplatform.endpoints.predict` 권한이 있어야 함.

**입력은 반드시 촬영 원본 `assets/origin/door-2.jpeg`** — 가공본은 축소로 정보가 손실돼 있어 소스로 부적합.

## 8. 배포

빌드·서버 로직이 없는 순수 정적 사이트 → 정적 호스팅 아무 곳이나 가능.
**올릴 것은 `index.html` + `assets/hero` + `assets/photo` + `assets/qr.*` 뿐.**
`assets/origin/`(촬영 원본, git 제외)과 `tools/` 는 자산 재생성용이라 배포 대상이 아니다.

### 결론

**GitHub Pages 가 완전 무료 + 가장 쉽다. 청첩장 용도면 이걸로 끝내면 된다.**
AWS 는 학습 목적이거나 접속 로그·세밀한 캐시 제어가 필요할 때만.

| # | 방식 | 실제 비용 | 세팅 시간 | HTTPS | 자동배포 |
|---|---|---|---|---|---|
| **8-1** | **GitHub Pages** | **0원** | **3클릭** | O | O (push 시) |
| 8-2 | Amplify Hosting | 0원 (12개월 프리티어) | 콘솔 5분 | O | O (push 시) |
| 8-3 | S3 + CloudFront | **0원** (기본 주소 사용 시) | 20~30분 | O | X (수동 sync) |
| 8-4 | S3 단독 · EC2 | 0.1 / 3.5~5 USD | — | X / O | X |

**React 로 바꿀 필요 없다.** Amplify Hosting 은 React 전용이 아니라 정적 파일을 그대로 받는다. React 로 옮기면 번들러·빌드 파이프라인이 추가되고 스크롤 문열림 로직도 다시 짜야 해서 더 어려워진다.

---

### 8-1. GitHub Pages — 무료 · 가장 쉬움

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

### 8-2. Amplify Hosting — 콘솔 5분 · git 연동 자동배포

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

### 8-3. S3 + CloudFront — 커스텀 도메인 없이 쓰면 무료

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

### 8-4. 나머지 (비권장)

| 방식 | 판정 | 사유 |
|---|---|---|
| S3 정적 웹사이트 호스팅 단독 | 비권장 | **http 만.** 카카오톡 공유 시 og:image 미리보기가 안 뜨는 경우가 있음 |
| Lightsail / EC2 + nginx | 비권장 | 정적 사이트인데 서버 유지비 월 3.5~5 USD 만 나감. 필요하면 `apt install nginx` → `rsync` → `certbot --nginx` |

---

### 8-5. 비용 — 어디까지 무료인가

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

### 8-6. AWS 를 아예 안 쓰는 무료 대안

정적 사이트라 결과물은 동일하다.

| 서비스 | 무료 범위 | 커스텀 도메인 HTTPS |
|---|---|---|
| **GitHub Pages** | public 저장소 · 월 100GB 전송 | 무료 |
| **Cloudflare Pages** | 전송 무제한 · 빌드 월 500회 | 무료 |
| Vercel / Netlify | 월 100GB 전송 | 무료 |

도메인 등록비는 어디서도 못 피한다. 그것마저 안 쓰면 `<계정>.github.io/wedding-invitation` 무료 주소로 끝낼 수 있다.

### 8-7. 배포 전 체크

- [ ] `index.html` 의 `OOO` · `0월 0일` 플레이스홀더 전부 교체
- [ ] `assets/temp/couple-placeholder.jpg` 를 실제 웨딩 사진으로 교체
- [ ] `DOC-pending.md` 의 og 태그 · BGM 반영 여부 확인
- [ ] 모바일 실기기에서 스크롤 문열림 프레임 확인 (iOS Safari · Android Chrome)

## 9. 남은 작업

배포는 이미 동작 중이고, 남은 것은 내용 채우기다.

| 구분 | 내용 |
|---|---|
| **필수** | `index.html` 의 `OOO` · `0월 0일` 플레이스홀더 전부 교체 (이름·일시·장소·주소·연락처·계좌) |
| **필수** | `assets/temp/couple-placeholder.jpg` 를 실제 웨딩 사진으로 교체 |
| 권장 | `assets/g1~g3.jpg` · `hall-wide.jpg` · `aisle.jpg` 도 현재 베뉴 사진(임시)이라 촬영본으로 교체 |
| 권장 | 실기기(iOS Safari · Android Chrome)에서 문 열림 확인 |
| 보류 | 카카오톡 공유 메타태그(og:image), 배경음악 — `DOC-pending.md` 참조 |

내용을 채운 뒤에는 **QR 을 다시 뽑을 필요가 없다.** 주소가 그대로이므로 이미 만든 QR 이 계속 유효하다.
