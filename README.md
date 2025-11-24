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
   cp .env.example .env
   ```
   `.env` 파일을 열고 `GEMINI_API_KEY`에 실제 API 키 입력

   API 키는 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받을 수 있습니다.

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

4. 브라우저에서 http://localhost:3000 접속

## 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 배포

빌드된 `dist/` 폴더를 정적 호스팅 서비스(Vercel, Netlify, GitHub Pages 등)에 배포할 수 있습니다.

### Vercel 배포 예시

```bash
npm install -g vercel
vercel
```

### Netlify 배포 예시

```bash
npm run build
# dist 폴더를 Netlify에 드래그 앤 드롭 또는 CLI 사용
```

## 기술 스택

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI (@google/genai)
- Lucide React Icons
