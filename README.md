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
**배포에 필요한 것은 `index.html` + `assets/` 뿐.** 원본 사진(`IMG_*.jpg`, 약 13MB)과 `tools/` 는 자산 재생성용이라 업로드 대상이 아니다.

**쉬운 순서** = GitHub Pages(3클릭) → Amplify Hosting(콘솔 5분) → S3+CloudFront(20~30분) → EC2(1시간+).
**React 로 바꿀 필요 없다.** Amplify Hosting 은 React 전용이 아니라 정적 파일도 그대로 받는다. React 로 옮기면 번들러·빌드 파이프라인이 추가되고 스크롤 로직도 다시 짜야 해서 더 어려워진다.

### 7-1. GitHub Pages (무료 · 가장 빠름)

1. 저장소 push
2. Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`
3. `https://<계정>.github.io/wedding-invitation/` 로 접속

한계 = 커스텀 도메인에 HTTPS는 되지만 접속 로그·리다이렉트 제어 불가, 저장소가 public 이어야 무료.

### 7-2. AWS

네 가지 중 하나 고르면 된다. **청첩장 용도 권장 = ②** (커스텀 도메인 + HTTPS + 캐싱, 월 1달러 미만).

| 방식 | 커스텀 도메인 | HTTPS | 월 비용(체감) | 세팅 난이도 | 언제 |
|---|---|---|---|---|---|
| ① S3 정적 웹사이트 호스팅 | O | **X (http만)** | ~0.1 USD | 낮음 | 테스트·임시 |
| ② **S3 + CloudFront + ACM** | O | O | ~0.3 USD | 중간 | **실사용 권장** |
| ③ Amplify Hosting | O | O | ~0.5 USD | 가장 낮음 | git push 자동배포 원할 때 |
| ④ Lightsail / EC2 + nginx | O | O | 3.5~5 USD | 높음 | 불필요 (정적인데 서버 유지비만 나감) |

전제 = AWS CLI 설치 + `aws configure` 완료. 아래 `wedding-invitation-dylan` / `wed.example.com` 은 본인 값으로 교체.

#### ① S3 정적 웹사이트 호스팅 (http만)

```bash
aws s3 mb s3://wedding-invitation-dylan --region ap-northeast-2
aws s3 website s3://wedding-invitation-dylan --index-document index.html --error-document index.html
```

퍼블릭 읽기 허용 — 버킷 정책 (`bucket-policy.json` 로 저장 후 적용):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::wedding-invitation-dylan/*"
  }]
}
```

```bash
aws s3api put-public-access-block --bucket wedding-invitation-dylan \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
aws s3api put-bucket-policy --bucket wedding-invitation-dylan --policy file://bucket-policy.json
```

업로드 (원본 사진·도구 제외, 캐시 헤더 분리):

```bash
aws s3 sync ./assets s3://wedding-invitation-dylan/assets --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./index.html s3://wedding-invitation-dylan/index.html --cache-control "no-cache"
```

접속 = `http://wedding-invitation-dylan.s3-website.ap-northeast-2.amazonaws.com`

> 카카오톡은 http 링크도 열리지만 og:image 를 http로 주면 미리보기가 안 뜨는 경우가 있음 → 공유용이면 ② 로 갈 것.

#### ② S3 + CloudFront + ACM (권장)

버킷은 ①처럼 만들되 **퍼블릭 차단 유지**(정적 웹사이트 호스팅 설정도 불필요). CloudFront 가 OAC로 대신 읽는다.

```bash
aws s3 mb s3://wedding-invitation-dylan --region ap-northeast-2
aws s3 sync ./assets s3://wedding-invitation-dylan/assets --cache-control "public,max-age=31536000,immutable"
aws s3 cp ./index.html s3://wedding-invitation-dylan/index.html --cache-control "no-cache"
```

1. **인증서** — ACM은 CloudFront용이면 반드시 `us-east-1`

   ```bash
   aws acm request-certificate --domain-name wed.example.com \
     --validation-method DNS --region us-east-1
   ```

   출력된 CNAME 검증 레코드를 도메인 DNS에 등록 → `ISSUED` 되면 다음 단계

2. **CloudFront 배포 생성** (콘솔이 빠름)
   - Origin: 위 S3 버킷 선택 → **Origin access: Origin access control (OAC)** → `Create new OAC`
   - 안내되는 버킷 정책을 그대로 복사해 버킷에 적용 (CloudFront 만 읽게 됨)
   - Viewer protocol policy: `Redirect HTTP to HTTPS`
   - Default root object: `index.html`
   - Alternate domain name: `wed.example.com` + 위 ACM 인증서 선택
   - Price class: `Use only North America, Europe, Asia` (한국 하객이면 충분)

3. **DNS** — Route 53이면 A 레코드 Alias → CloudFront 배포. 타 등록기관이면 CNAME → `dxxxx.cloudfront.net`

4. **갱신 배포** — 파일 바꾼 뒤

   ```bash
   aws s3 cp ./index.html s3://wedding-invitation-dylan/index.html --cache-control "no-cache"
   aws cloudfront create-invalidation --distribution-id <배포ID> --paths "/index.html" "/assets/*"
   ```

   `index.html` 만 `no-cache`, `assets/*` 는 1년 캐시 → 사진 교체 시 파일명을 바꾸면 invalidation 없이도 즉시 반영된다.

#### ③ Amplify Hosting (git 연동 자동배포)

빌드 스텝이 없으므로 `amplify.yml` 만 두면 된다.

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

콘솔 → Amplify → `Host web app` → GitHub 저장소 `wedding-invitation` 연결 → 브랜치 `main`.
이후 `git push` 만으로 재배포되고 HTTPS·커스텀 도메인도 자동. 가장 손이 덜 감.

#### ④ Lightsail / EC2 + nginx

정적 사이트에 서버를 띄우는 건 비용·관리 낭비라 **비권장**. 그래도 필요하면:

```bash
sudo apt update && sudo apt install -y nginx
sudo rsync -av --delete ./index.html ./assets /var/www/html/
sudo snap install --classic certbot && sudo certbot --nginx -d wed.example.com
```

### 7-3. 비용 — 어디까지 무료인가

자산 총량이 약 1.3MB, 하객 500명이 각 3회씩 열어도 월 전송량 2GB 미만. **어느 방식을 골라도 트래픽 요금이 발생하는 구간에 도달하지 않는다.** 돈이 새는 곳은 트래픽이 아니라 **DNS 호스팅 영역과 도메인 등록비** 뿐이다.

| 항목 | 무료 범위 | 초과 시 단가 | 이 프로젝트 실제 |
|---|---|---|---|
| CloudFront 전송 | **월 1TB · 요청 1,000만 건 (계정 나이 무관, 영구 무료)** | $0.114/GB | 0원 |
| S3 스토리지 | 12개월 프리티어 5GB | $0.025/GB/월 (서울) | 1.3MB → 0.003센트 |
| S3 요청 | 12개월 프리티어 GET 2만/PUT 2천 | GET $0.00043/1천 | 0원 수준 |
| ACM 인증서 | **영구 무료** | — | 0원 |
| **Route 53 호스팅 영역** | **무료 없음** | **$0.50/월** | 커스텀 도메인 쓸 때만 |
| 도메인 등록 (.com) | 무료 없음 | 약 $14/년 | 커스텀 도메인 쓸 때만 |
| Amplify Hosting | 12개월 프리티어 빌드 1000분 · 전송 15GB · 저장 5GB | 전송 $0.15/GB | 0원 |

정리 —

- **CloudFront 기본 주소(`dxxxx.cloudfront.net`)로 만족하면 AWS 비용은 사실상 0원.** 청구서에 센트 단위가 찍히는 정도
- 커스텀 도메인(`wed.example.com`)을 쓰고 Route 53에 올리면 **월 $0.50 고정** + 도메인 등록비
- **Route 53 우회 = Cloudflare DNS(무료)** 에 도메인을 올리고 CNAME 만 CloudFront로 넘기면 월 $0.50도 안 낸다. ACM DNS 검증 레코드도 Cloudflare 쪽에 넣으면 됨

### 7-4. 완전 무료로만 가고 싶으면

AWS를 안 쓰는 쪽이 더 싸고 더 쉽다. 정적 사이트라 결과물은 동일하다.

| 서비스 | 무료 범위 | 커스텀 도메인 HTTPS | 배포 방법 |
|---|---|---|---|
| **GitHub Pages** | public 저장소 무제한 · 월 100GB 전송 | 무료 | Settings → Pages 3클릭 |
| **Cloudflare Pages** | 전송 무제한 · 빌드 월 500회 | 무료 | 저장소 연결 |
| Vercel / Netlify | 월 100GB 전송 | 무료 | 저장소 연결 |

도메인 등록비(연 1~2만원)는 어디서든 피할 수 없다. 그것마저 안 쓰면 `<계정>.github.io/wedding-invitation` 같은 무료 주소로 끝낼 수 있다.

### 7-5. 배포 전 체크

- [ ] `index.html` 의 `OOO` · `0월 0일` 플레이스홀더 전부 교체
- [ ] `assets/couple-placeholder.jpg` 를 실제 웨딩 사진으로 교체
- [ ] `DOC-pending.md` 의 og 태그 · BGM 반영 여부 확인
- [ ] 모바일 실기기에서 스크롤 문열림 프레임 확인 (iOS Safari · Android Chrome)

## 8. 남은 작업

`DOC-pending.md` 참조.
