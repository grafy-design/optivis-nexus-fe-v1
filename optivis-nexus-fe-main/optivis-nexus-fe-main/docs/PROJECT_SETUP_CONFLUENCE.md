# OPTIVIS Nexus Frontend 프로젝트 셋팅 가이드

## 프로젝트 개요

**프로젝트명**: OPTIVIS Nexus Frontend  
**버전**: 0.1.0  
**프레임워크**: Next.js 15.5.4 (App Router)  
**언어**: TypeScript 5

---

## 기술 스택

### Core Framework
- **Next.js**: 15.5.4
- **React**: 19.1.0
- **TypeScript**: 5
- **Node.js**: 20+

### 스타일링
- **Tailwind CSS**: 4.0
- **PostCSS**: @tailwindcss/postcss
- **tw-animate-css**: 1.4.0

### UI 라이브러리
- **Radix UI**: 
  - Checkbox, Dialog, Popover, Radio Group
  - Scroll Area, Separator, Slot, Tooltip
- **Lucide React**: 0.545.0 (아이콘)

### 상태 관리 & 유틸리티
- **Zustand**: 5.0.8 (상태 관리)
- **clsx**: 2.1.1 (클래스 병합)
- **tailwind-merge**: 3.3.1 (Tailwind 클래스 병합)
- **class-variance-authority**: 0.7.1 (컴포넌트 변형)

### 차트 & 데이터 시각화
- **ECharts**: 5.6.0
- **echarts-for-react**: 3.0.2
- **echarts-stat**: 1.2.0

### 기타 라이브러리
- **axios**: 1.13.0 (HTTP 클라이언트)
- **react-hot-toast**: 2.6.0 (토스트 알림)
- **jspdf**: 3.0.3 (PDF 생성)
- **html-to-image**: 1.11.13 (이미지 변환)
- **cmdk**: 1.1.1 (Command Menu)
- **pretendard**: 1.3.9 (한글 폰트)

### 개발 도구
- **ESLint**: 9
- **TypeScript**: 5
- **@svgr/webpack**: 8.1.0 (SVG 컴포넌트 변환)

---

## 프로젝트 구조

```
nexus-fe/
├── public/
│   └── assets/
│       └── icons/          # SVG/PNG 아이콘 파일
├── src/
│   ├── app/                # Next.js App Router 페이지
│   │   ├── layout.tsx      # 루트 레이아웃
│   │   ├── page.tsx        # 메인 페이지
│   │   └── globals.css     # 전역 스타일 및 디자인 토큰
│   ├── components/
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainContainer.tsx
│   │   ├── home/           # 홈 페이지 컴포넌트
│   │   └── ui/             # 재사용 가능한 UI 컴포넌트
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── icon-button.tsx
│   │       └── input.tsx
│   ├── lib/                # 유틸리티 라이브러리
│   │   ├── cn.ts           # 클래스 병합 유틸리티
│   │   └── utils.ts
│   ├── hooks/              # Custom React Hooks
│   ├── stores/             # Zustand 스토어
│   ├── services/           # API 서비스
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 유틸리티 함수
│   ├── constants/          # 상수
│   └── data/               # 정적 데이터
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 환경 설정

### 필수 요구사항
- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

#### 1. 의존성 설치
```bash
npm install
```

#### 2. 개발 서버 실행
```bash
npm run dev
```
- 기본 포트: `http://localhost:3000`

---

## 주요 설정 파일

### `next.config.ts`
- **output**: `standalone` (독립 실행형 배포)
- **images**: `unoptimized: true`
- **SVGR**: SVG를 React 컴포넌트로 import 가능
- **ESLint/TypeScript**: 빌드 시 타입 체크 건너뛰기 (빠른 배포용)

### `tsconfig.json`
- **paths**: `@/*` → `./src/*` (절대 경로 import)
- **target**: ES2017
- **module**: esnext
- **jsx**: preserve

### `globals.css`
- Tailwind CSS 4.0 import
- 디자인 토큰 정의:
  - Primary Colors (Purple): 0-100 단계
  - Secondary Colors (Orange): 0-100 단계
  - Tertiary Colors (Purple): 0-100 단계
  - Neutral Colors (Gray): 0-100 단계
  - Error Colors (Red): 0-100 단계
- 타이포그래피 유틸리티 클래스:
  - H0, Title, H1-H4
  - Body1-Body5, Body1m-Body5m
  - Small1, Small2

---

## 폰트 설정

### 사용 폰트
1. **Poppins** (Google Fonts)
   - 가중치: 400, 500, 600, 700
   - 용도: 제목 및 강조 텍스트

2. **Pretendard** (Local Font)
   - 가중치: 400, 500, 600, 700
   - 용도: 본문 텍스트 (한글 최적화)

3. **SF Pro** (시스템 폰트)
   - macOS/iOS 기본 폰트
   - 웹에서는 `-apple-system`으로 대체
   - 용도: 타이포그래피 유틸리티 클래스

4. **Geist Sans/Mono** (Google Fonts)
   - 기본 폰트로 설정

---

## 디자인 시스템

### 색상 팔레트
- **Primary**: 보라색 계열 (#262255)
- **Secondary**: 주황색 계열 (#f46904)
- **Tertiary**: 보라색 계열 (#3a11d8)
- **Neutral**: 회색 계열
- **Error**: 빨간색 계열 (#ba1a1a)
- **Background**: #e7e5e7

### 타이포그래피
- **H0**: SF Pro Medium 60px
- **Title**: Poppins SemiBold 48px
- **H1-H4**: SF Pro Semibold/Medium 28-48px
- **Body1-Body5**: SF Pro Semibold/Medium 12-24px
- **Small1-Small2**: SF Pro Medium/Semibold 9-10.5px

---

## 주요 컴포넌트

### Layout Components
- `AppLayout`: 전체 앱 레이아웃 래퍼 (flex 레이아웃)
- `Header`: 상단 헤더 (고정)
- `Sidebar`: 좌측 사이드바 (고정)
- `MainContainer`: 메인 컨텐츠 영역

### UI Components
- `Button`: 다양한 variant 지원 (primary, glass, orange 등)
- `Card`: Glass morphism 효과 카드
- `IconButton`: 아이콘 전용 버튼
- `Input`: 입력 필드 컴포넌트

---

## 개발 가이드라인

### 코드 스타일
- TypeScript strict mode 활성화
- 함수형 컴포넌트 사용
- `"use client"` 지시어로 클라이언트 컴포넌트 명시

### Import 경로
- 절대 경로 사용: `@/components/...`
- 상대 경로 지양

### 스타일링
- Tailwind CSS 유틸리티 클래스 우선 사용
- 디자인 토큰은 CSS 변수로 정의 (`globals.css`)
- 커스텀 유틸리티 클래스는 `@layer utilities` 사용

---


**최종 업데이트**: 2024년

