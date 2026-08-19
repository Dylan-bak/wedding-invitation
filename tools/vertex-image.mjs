// gemini-2.5-flash-image 이미지 생성/편집
// 인증 2가지 — 자동 선택
//   ① GEMINI_API_KEY 있으면 → Google AI (generativelanguage.googleapis.com)  ← 권장
//   ② 없으면 → Vertex AI + gemini CLI OAuth 토큰 (프로젝트에 aiplatform 권한 필요)
// 사용: node tools/vertex-image.mjs <out.png> "<prompt>" [inputImage...]
import { readFileSync, writeFileSync } from 'fs';

const MODEL = 'gemini-2.5-flash-image';
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const [out, prompt, ...inputs] = process.argv.slice(2);
if (!out || !prompt) { console.error('usage: node tools/vertex-image.mjs <out> "<prompt>" [in...]'); process.exit(1); }

let url, authHeaders;
if (KEY) {
  url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  authHeaders = { 'x-goog-api-key': KEY };
  console.error('auth: API key');
} else {
  const CREDS = 'C:/Users/Administrator/.gemini/oauth_creds.json';
  const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'prd-ai-prj';
  const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global';
  const host = LOCATION === 'global' ? 'aiplatform.googleapis.com' : `${LOCATION}-aiplatform.googleapis.com`;
  url = `https://${host}/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
  const { access_token, expiry_date } = JSON.parse(readFileSync(CREDS, 'utf8'));
  if (Date.now() > expiry_date) { console.error('토큰 만료 — `gemini -p ping` 한 번 실행해 갱신'); process.exit(2); }
  authHeaders = { Authorization: `Bearer ${access_token}` };
  console.error('auth: Vertex OAuth (GEMINI_API_KEY 없음)');
}

const mime = f => f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const parts = [
  ...inputs.map(f => ({ inlineData: { mimeType: mime(f), data: readFileSync(f).toString('base64') } })),
  { text: prompt },
];

const res = await fetch(url, {
  method: 'POST',
  headers: { ...authHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  }),
});

if (!res.ok) { console.error(res.status, (await res.text()).slice(0, 1200)); process.exit(3); }

const json = await res.json();
const cand = json.candidates?.[0]?.content?.parts ?? [];
const img = cand.find(p => p.inlineData)?.inlineData;
if (!img) { console.error('이미지 없음:', JSON.stringify(json).slice(0, 1200)); process.exit(4); }

writeFileSync(out, Buffer.from(img.data, 'base64'));
console.log('saved', out, Buffer.from(img.data, 'base64').length, 'bytes');
