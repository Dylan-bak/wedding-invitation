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
| `assets/gate-bg.jpg` | 문 뒤로 보이는 공간 (문짝을 지운 인페인팅 결과에서 개구부만 크롭) |
| `assets/couple-placeholder.jpg` | 문 열린 뒤 올라오는 사진 자리 **(임시)** |
| `assets/hall-wide.jpg` `aisle.jpg` `g1~g3.jpg` | 본문·갤러리 사진 |
| `tools/build-assets.mjs` | 원본 사진 → 문짝·배경 자산 생성 |
| `tools/build-gen.mjs` | 원본 사진 → 문 뒤 배경·갤러리 자산 생성 |
| `tools/vertex-image.mjs` | Gemini 이미지 생성/편집 호출 (선택) |
| `IMG_0668(1).jpg` `IMG_1413(1).jpg` `IMG_1804(1).jpg` | 원본 사진 (자산 재생성용 소스) |
| `IMG_0668(1)-2.jpg` | 원본 0668에서 문짝만 지운 인페인팅 결과 — `gate-bg.jpg` 소스 |

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

레이어 순서 (아래 → 위): `frame` → `gate`(문 뒤 공간) → `doors`(문짝 2장) → `flash`(화이트아웃) → `reveal`(상승 화면)

**`perspective` 는 `.doors` 에만 둔다. `.photo` 에 `transform-style: preserve-3d` 를 주면 안 된다.**
같은 3D 공간에 있는 형제 요소는 DOM 순서가 아니라 z 깊이로 정렬된다. 문짝이 안쪽으로 회전하면 z 가 음수가 되어 불투명한 `.gate` 뒤로 밀리고, **문이 열리기 시작하는 순간 문짝이 통째로 사라진다**(닫힘/열림 2컷처럼 보임).
`perspective` 를 `.doors` 에 두면 문짝 회전은 그 박스 안에서만 3D 로 계산되고 `.doors` 자체는 평면 요소로 취급되어, DOM 순서대로 항상 `.gate` 위에 그려진다.

`MAX_DEG` 는 **90 미만**이어야 한다. 정확히 90도면 문짝이 정면으로 서서 두께 0 이 되어 사라진다.

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

`assets/gate-bg.jpg` 는 이미 AI 인페인팅 결과(`IMG_0668(1)-2.jpg`)로 적용돼 있음. 다시 만들 때만 아래 사용.

사용한 프롬프트:

> 첨부한 웨딩홀 정면 사진에서 가운데 나무 여닫이문 두 짝만 완전히 제거하고, 그 자리에 문 안쪽으로 이어지는 실내 공간을 자연스럽게 채워줘. 원본의 대리석 헤링본 바닥, 회색 석재 문틀, 조명 톤, 원근을 그대로 유지. 문틀 바깥 영역(간판, 꽃, 기둥, 계단)은 픽셀 단위로 원본 그대로 보존. 안쪽은 밝은 자연광이 쏟아지는 하얀 공간으로. 원본과 동일한 3200x4668 해상도.

생성 결과는 원본 좌표와 어긋나므로 **문틀 안쪽 개구부만 잘라내 쓴다** (`tools/build-gen.mjs` 의 `extract` 좌표. 결과물 해상도가 바뀌면 이 좌표도 다시 재야 함).

```bash
GEMINI_API_KEY=... node tools/vertex-image.mjs assets/gen-gate.png "<프롬프트>" "IMG_0668(1).jpg"
```

`GEMINI_API_KEY` 없으면 Vertex AI + gemini CLI OAuth 토큰으로 폴백. 단 해당 GCP 프로젝트에 `aiplatform.endpoints.predict` 권한이 있어야 함.

**입력은 반드시 원본 `IMG_0668(1).jpg`** — `assets/` 의 가공본은 축소·blur 로 정보가 손실돼 있어 소스로 부적합.

## 7. 배포

빌드·서버 로직이 없는 순수 정적 사이트 → 정적 호스팅 아무 곳이나 가능.
**올릴 것은 `index.html` + `assets/` 뿐.** 원본 사진(`IMG_*.jpg`, 약 13MB)과 `tools/` 는 자산 재생성용이라 배포 대상이 아니다.

### 결론

**GitHub Pages 가 완전 무료 + 가장 쉽다. 청첩장 용도면 이걸로 끝내면 된다.**
AWS 는 학습 목적이거나 접속 로그·세밀한 캐시 제어가 필요할 때만.

| # | 방식 | 실제 비용 | 세팅 시간 | HTTPS | 자동배포 |
|---|---|---|---|---|---|
| **7-1** | **GitHub Pages** | **0원** | **3클릭** | O | O (push 시) |
| 7-2 | Amplify Hosting | 0원 (12개월 프리티어) | 콘솔 5분 | O | O (push 시) |
| 7-3 | S3 + CloudFront | **0원** (기본 주소 사용 시) | 20~30분 | O | X (수동 sync) |
| 7-4 | S3 단독 · EC2 | 0.1 / 3.5~5 USD | — | X / O | X |

**React 로 바꿀 필요 없다.** Amplify Hosting 은 React 전용이 아니라 정적 파일을 그대로 받는다. React 로 옮기면 번들러·빌드 파이프라인이 추가되고 스크롤 문열림 로직도 다시 짜야 해서 더 어려워진다.

---

### 7-1. GitHub Pages — 무료 · 가장 쉬움

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

### 7-2. Amplify Hosting — 콘솔 5분 · git 연동 자동배포

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

### 7-3. S3 + CloudFront — 커스텀 도메인 없이 쓰면 무료

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

### 7-4. 나머지 (비권장)

| 방식 | 판정 | 사유 |
|---|---|---|
| S3 정적 웹사이트 호스팅 단독 | 비권장 | **http 만.** 카카오톡 공유 시 og:image 미리보기가 안 뜨는 경우가 있음 |
| Lightsail / EC2 + nginx | 비권장 | 정적 사이트인데 서버 유지비 월 3.5~5 USD 만 나감. 필요하면 `apt install nginx` → `rsync` → `certbot --nginx` |

---

### 7-5. 비용 — 어디까지 무료인가

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

### 7-6. AWS 를 아예 안 쓰는 무료 대안

정적 사이트라 결과물은 동일하다.

| 서비스 | 무료 범위 | 커스텀 도메인 HTTPS |
|---|---|---|
| **GitHub Pages** | public 저장소 · 월 100GB 전송 | 무료 |
| **Cloudflare Pages** | 전송 무제한 · 빌드 월 500회 | 무료 |
| Vercel / Netlify | 월 100GB 전송 | 무료 |

도메인 등록비는 어디서도 못 피한다. 그것마저 안 쓰면 `<계정>.github.io/wedding-invitation` 무료 주소로 끝낼 수 있다.

### 7-7. 배포 전 체크

- [ ] `index.html` 의 `OOO` · `0월 0일` 플레이스홀더 전부 교체
- [ ] `assets/couple-placeholder.jpg` 를 실제 웨딩 사진으로 교체
- [ ] `DOC-pending.md` 의 og 태그 · BGM 반영 여부 확인
- [ ] 모바일 실기기에서 스크롤 문열림 프레임 확인 (iOS Safari · Android Chrome)

## 8. 남은 작업

`DOC-pending.md` 참조.
