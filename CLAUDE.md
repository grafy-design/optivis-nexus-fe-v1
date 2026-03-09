# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 언어 규칙

- 모든 출력(응답, 계획, 태스크, 주석, 메모리 등)은 **한글**로 작성한다.
- 코드 내 변수명/함수명은 영문 유지, 주석과 설명은 한글로 작성한다.

## 프로젝트 개요

Nexus FE — 의약품/임상 시뮬레이션 플랫폼. 3개 제품 영역:
- **ATS** (Adaptive Trial Simulation) — 임상시험 시뮬레이션
- **DRD** (Drug Response Prediction Dashboard) — 약물 반응 예측 대시보드
- **TSI** (Target Subgroup Identification) — 타겟 하위군 식별

기술 스택: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Zustand 5

## 명령어

```bash
npm run dev           # 개발 서버 (Turbopack, 포트 3000)
npm run dev:webpack   # 개발 서버 (webpack 번들러)
npm run build         # 프로덕션 빌드
npm start             # 프로덕션 서버 (포트 3003)
npm run lint          # ESLint 실행
```

테스트 프레임워크는 설정되어 있지 않음.

## 아키텍처

### 라우팅 (`src/app/`)

파일 기반 App Router. 주요 라우트 그룹: `/ats/*`, `/drd/*`, `/tsi/*`. 모든 페이지 컴포넌트는 클라이언트 컴포넌트 (`"use client"`).

### 상태 관리 (Zustand)

- `src/store/homeStore.ts` — 홈 페이지 패키지/서비스 선택
- `src/store/simulationStore.ts` — ATS/DRD 시뮬레이션 상태
- `src/store/defaultSettingStore.ts` — DRD 기본 설정

스토어 패턴: `create<Interface>((set, get) => ({...}))` + `initialState`로 리셋 지원.

### API / 데이터 페칭

- `src/lib/fetcher.ts` — 범용 타입드 `fetcher<T>()`, 10분 타임아웃, AbortController
- 백엔드: `NEXT_PUBLIC_API_BASE_URL` (기본값 `https://nexus.oprimed.com`)
- 클라이언트 호출은 Next.js 프록시 라우트 (`src/app/api/proxy/`)를 통해 CORS 회피
- 서비스 레이어: `src/services/studyService.ts`, `src/services/subgroup-service.ts`
- 서비스 타입: `src/services/types/`

### 레이아웃 시스템

`AppLayout`이 모든 페이지를 감싸며 `headerType` ("default" | "ats" | "tsi" | "drd")과 `scaleMode` 사용.
- Home/ATS: `useAreaScale` 훅으로 비례 줌 스케일링 (디자인 기준: 2560×1314px)
- DRD/TSI: 고정 사이드바 (96px) + flex 레이아웃, 줌 스케일링 없음

### 컴포넌트 구조

```
src/components/
  layout/    # AppLayout, Sidebar, Headers, MainContainer, Footer
  ui/        # Button, Select, Input, Slider, Checkbox, RadioButton, Modal 등
  charts/    # ECharts 기반 차트 컴포넌트
  home/      # 랜딩 페이지 컴포넌트
  ats/       # ATS 전용 패널
  drd/       # DRD 전용 패널
  math/      # KaTeX 수식 컴포넌트
```

## 주요 패턴

### 스타일링

- **Tailwind CSS v4** — `globals.css`의 `@theme`으로 CSS-first 설정 (`tailwind.config.*` 파일 없음)
- 디자인 토큰: `--primary-{0..100}`, `--secondary-{0..100}`, `--tertiary-{0..100}`, `--neutral-{0..100}`, `--error-{0..100}`
- 타이포그래피 클래스: `.text-h0`~`.text-h4`, `.text-body1`~`.text-body5`, `.text-body1m`~`.text-body5m`, `.text-small1`, `.text-small2`
- Tailwind 클래스와 인라인 스타일을 함께 사용 (Figma 픽셀값 정밀 반영)
- `cn()` 유틸리티 (`clsx` + `twMerge`): `src/lib/cn.ts`

### 차트

- `echarts` + `echarts-for-react`
- `DynamicECharts.tsx` — 트리쉐이킹, 동적 로딩, SSR 비활성화 래퍼
- 차트 컴포넌트는 ECharts option 객체를 props로 받음

### UI 컴포넌트

- Radix UI 프리미티브 (Checkbox, Dialog, Popover, RadioGroup, ScrollArea, Tooltip)
- `lucide-react` 아이콘 + 인라인 SVG 아이콘
- `<img>` 태그 허용 (`no-img-element` 규칙 OFF); `next/image`는 `unoptimized: true`
- SVG: `@svgr/webpack` 또는 `<img>` src로 로드

### 언어

- UI 텍스트, 주석, 에러 메시지는 한국어
- 루트 HTML `lang="ko"`

## 빌드 설정 참고

- 빌드 시 ESLint 에러 무시 (`eslint.ignoreDuringBuilds: true`)
- 빌드 시 TypeScript 에러 무시 (`typescript.ignoreBuildErrors: true`)
- 개발: `.next-dev` distDir / 프로덕션: `.next`
- 경로 별칭: `@/*` → `./src/*`

## ESLint 규칙

- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: warn (언더스코어 접두사 변수 제외)
- `react-hooks/exhaustive-deps`: off
- `react/no-unescaped-entities`: off
- `@next/next/no-img-element`: off
