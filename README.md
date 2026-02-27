# Nexus FE

Nexus 프로젝트 프론트엔드 애플리케이션입니다.

## 기술 스택

- Next.js 15.5.4
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4
- Zustand (상태 관리)
- Radix UI (UI 컴포넌트)
- ECharts (차트 라이브러리)

## 시작하기

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 프로덕션 빌드

```bash
npm run build
npm start
```

## Docker tar 배포 (macOS/Linux)

플랫폼(아키텍처) mismatch를 피하려면 `platform`을 명시해서 빌드/실행하세요.

- 기본 권장: `linux/amd64`
- ARM 서버 대상: `linux/arm64`

tar 생성:

```bash
./create-tar.sh linux/amd64
```

배포:

```bash
./load.sh optivis-nexus-fe_YYYYMMDD_HHMMSS.tar linux/amd64
```

스크립트 파일:
- `create-tar.sh`, `load.sh`

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
├── components/       # React 컴포넌트
├── hooks/           # Custom React Hooks
├── stores/          # Zustand 스토어
├── utils/           # 유틸리티 함수
├── types/           # TypeScript 타입 정의
├── services/        # API 서비스
├── constants/       # 상수
└── lib/             # 라이브러리 설정
```

## 라이선스

Private


