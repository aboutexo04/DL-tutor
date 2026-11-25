# 딥러닝 코딩 튜터 AI (DL Tutor)

PyTorch 딥러닝 코딩 인터뷰를 연습할 수 있는 AI 기반 튜터 애플리케이션입니다.

## 기능

- AI가 생성하는 딥러닝 코딩 문제
- 주제별 선택 (CNN, RNN, Transformer, GAN, Optimization 등)
- 난이도 조절 (Junior, Mid, Senior)
- AI 기반 코드 리뷰 및 채점
- 단계별 힌트 제공

## 로컬 실행

**필수 조건:** Node.js 18+

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정:
   ```bash
   cp .env.example .env.local
   ```
   `.env.local`에 서버 전용 키를 넣습니다. `VITE_` 접두사는 쓰면 안 됩니다. 키가 브라우저 번들에 들어갑니다.

   ```
   GEMINI_API_KEY=발급받은_키
   ```

   API 키는 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받습니다.

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```
   Vite가 `/api/gemini`를 개발 서버에서 처리합니다. `GEMINI_API_KEY`는 Node 프로세스에서만 읽습니다.

   Vercel 서버리스 함수와 같은 방식으로 실행하려면:
   ```bash
   npx vercel dev
   ```
   `vercel dev`도 `.env.local`의 `GEMINI_API_KEY`를 사용합니다.

4. 브라우저에서 http://localhost:3000 접속

## 프로덕션 빌드

```bash
npm run build
npm run preview
```

`vite preview`는 정적 파일만 제공합니다. Gemini 호출까지 확인하려면 `vercel dev` 또는 Vercel 배포를 사용하세요.

## Vercel 배포

Gemini 호출은 `api/gemini.ts` 서버리스 함수에서만 실행됩니다. 기본 모델은 GA Flash 모델 `gemini-3.8-flash`이며, `GEMINI_MODEL`로 바꿀 수 있습니다.

이전에 클라이언트에 들어가 있던 `VITE_API_KEY`는 더 이상 사용하지 않습니다. 배포 전에 아래를 진행하세요.

1. 기존 키는 번들에 노출되었으므로 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 **새 API 키**를 만들고, 기존 키는 폐기합니다.
2. Vercel 프로젝트 → Settings → Environment Variables에 `GEMINI_API_KEY`를 **Production, Preview, Development 모두** 추가합니다. 이름 앞에 `VITE_`를 붙이지 마세요.
3. 기존 환경 변수 `VITE_API_KEY`를 삭제합니다.
4. 다시 배포합니다. 환경 변수만 바꾼 경우에도 재배포가 필요합니다.

```bash
npm install -g vercel
vercel
```

## 기술 스택

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI (`@google/genai`, 서버 전용)
- Lucide React Icons
