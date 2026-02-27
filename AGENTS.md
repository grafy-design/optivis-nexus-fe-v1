# Nexus FE - AGENTS.md

**Generated:** 2026-02-11  
**Project:** Nexus Frontend (Next.js + TypeScript)  
**Type:** Clinical Trial Platform UI

---

## OVERVIEW

Nexus FE는 임상시험 데이터 분석 및 시뮬레이션 플랫폼의 프론트엔드입니다. Next.js 15 App Router 기반으로 TSI (Target Subgroup Identification)와 ATS (Adaptive Trial Simulation) 두 가지 주요 워크플로우를 제공합니다.

---

## STRUCTURE

```
.
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── ats/          # Adaptive Trial Simulation 워크플로우
│   │   ├── tsi/          # Target Subgroup Identification 워크플로우
│   │   ├── page.tsx      # 메인 홈페이지
│   │   └── layout.tsx    # 루트 레이아웃
│   ├── components/       # React 컴포넌트
│   │   ├── ats/          # ATS 전용 컴포넌트
│   │   ├── charts/       # ECharts 기반 차트 컴포넌트
│   │   ├── home/         # 홈페이지 컴포넌트
│   │   ├── layout/       # 레이아웃 컴포넌트 (Header, Sidebar, etc)
│   │   ├── math/         # 수식/수학 컴포넌트
│   │   └── ui/           # 공통 UI 컴포넌트
│   ├── services/         # API 서비스 (studyService.ts)
│   ├── store/            # Zustand 상태 관리
│   ├── hooks/            # Custom React Hooks
│   ├── lib/              # 유틸리티 (cn.ts)
│   └── types/            # TypeScript 타입 정의
├── public/               # 정적 자산
├── docs/                 # 프로젝트 문서
└── docs/*.md             # 개발 가이드 및 전략 문서
```

---

## WHERE TO LOOK

| 작업 유형 | 위치 | 비고 |
|-----------|------|------|
| **새로운 페이지 추가** | `src/app/` | App Router 사용 |
| **ATS 기능 개발** | `src/app/ats/`, `src/components/ats/` | 시뮬레이션 관련 |
| **TSI 기능 개발** | `src/app/tsi/` | 서브그룹 식별 관련 |
| **차트 개발** | `src/components/charts/`, `src/app/ats/simulation/report/charts/` | ECharts 사용 |
| **UI 컴포넌트** | `src/components/ui/` | 버튼, 입력, 모달 등 |
| **API 호출** | `src/services/studyService.ts` | 백엔드 통신 |
| **상태 관리** | `src/store/` | Zustand 스토어 |
| **레이아웃 수정** | `src/components/layout/` | Header, Sidebar 등 |
| **글로벌 스타일** | `src/app/globals.css` | CSS 변수, 디자인 토큰 |

---

## CONVENTIONS

### Import 규칙
- **절대 경로만 사용**: `@/components/...`, `@/store/...`
- **상대 경로 금지** (`../` 사용 불가)
- `tsconfig.json`에서 `@/*` → `./src/*`로 매핑됨

### 클라이언트 컴포넌트
- 모든 상호작용 컴포넌트는 **반드시** 파일 최상단에 `"use client"` 추가
- 서버 컴포넌트는 데이터 fetching에만 사용

### 클래스 병합
- **clsx 직접 사용 금지**
- 반드시 `cn()` 유틸리티 사용:
```typescript
import { cn } from "@/lib/cn";
className={cn("base-classes", condition && "conditional-class")}
```

### 상태 관리 (Zustand)
```typescript
// store/pattern.ts
import { create } from "zustand";

interface StoreState {
  value: string;
  setValue: (v: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  value: "",
  setValue: (v) => set({ value: v }),
}));
```

### Tailwind 사용법
- 유틸리티 클래스 우선
- CSS 변수는 `globals.css`에 정의된 디자인 토큰 사용
- 고정 너비 대신 반응형 너비 사용: `max-w-[1772px] w-full`

### API 서비스
- 모든 API 호출은 `services/studyService.ts`에 집중
- 인터페이스로 응답 타입 정의
- 에러 처리 및 타임아웃 포함

---

## ANTI-PATTERNS (THIS PROJECT)

### 금지 사항
1. **상대 경로 import** - 절대 경로 `@/` 사용 필수
2. **clsx 직접 사용** - `cn()` 함수 사용
3. **큰 파일 생성** - 500라인 이상 파일 분할 권장
4. **고정 너비 남용** - `max-w` + `w-full` 조합 사용
5. **빌드 전 ESLint 미확인** - 빌드 시 체크를 건지므로 수동 확인 필요

### 주의사항
- **스크롤 문제**: 수평/수직 스크롤 충돌 주의 - `pointer-events-none` 패턴 참조
- **포트**: 개발 3000, 프로덕션 3003
- **이미지**: SVGR 사용 가능 (SVG를 컴포넌트로 import)
- **빌드**: standalone 모드로 배포

---

## TECH STACK

- **Framework:** Next.js 15.5.7, React 19.1.0
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4, PostCSS
- **UI:** Radix UI, Lucide React
- **State:** Zustand 5.0.8
- **Charts:** ECharts 5.6.0
- **HTTP:** Axios 1.13.0
- **Font:** Pretendard (한글 최적화)

---

## COMMANDS

```bash
# 개발
npm run dev          # localhost:3000

# 빌드 및 배포
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 서버 :3003
npm run deploy       # build + start

# 품질
npm run lint         # ESLint (수동 확인 필수)
npm run audit        # 보안 감사

# 재설치
npm run clean-install # node_modules 완전 재설치
```

---

## DESIGN TOKENS

### 색상 팔레트 (CSS Variables)
```css
/* Primary - 복용색 계열 */
--primary-0 ~ --primary-100

/* Secondary - 주황색 계열 */
--secondary-0 ~ --secondary-100

/* Neutral - 회색 계열 */
--neutral-0 ~ --neutral-100

/* Semantic */
--error: #e04646
--success: #1ba70b
```

### 타이포그래피
- `text-title`: 페이지 타이틀
- `text-h0` ~ `text-h4`: 헤딩
- `text-body1` ~ `text-body5`: 본문
- `text-small1` ~ `text-small2`: 작은 텍스트

---

## LAYOUT SYSTEM

### AppLayout 구조
```
AppLayout (overflow-x-auto, overflow-y-auto)
├── Sidebar (fixed, w-[68px], z-[100], pointer-events-none)
└── Main Content (ml-[68px], flex-1, overflow-auto)
    ├── Header (sticky, z-[90])
    └── MainContainer (w-[1772px], mx-auto)
```

### 주요 레이아웃 값
- 사이드바 너비: `68px`
- 메인 컨텐츠 최대 너비: `1772px`
- 헤더 높이: `76px` ~ `84px`
- 컨테이너 패딩: `px-10`

---

## DOCUMENTATION

- `RESEARCH_NOTES.md` - 메인 화면 개발 기록
- `docs/PROJECT_SETUP_CONFLUENCE.md` - 프로젝트 셋업 가이드
- `docs/HORIZONTAL_SCROLL_FIX_STRATEGY.md` - 스크롤 전략
- `docs/SIMULATION_PAGE_UI_DEVELOPMENT.md` - 시뮬레이션 페이지 UI

---

## NOTES

1. **빌드 최적화**: ESLint와 TypeScript 체크를 빌드 시 무시함 (next.config.ts). 개발 중 `npm run lint`로 반드시 확인할 것.

2. **스크롤 이슈**: 사이드바와 메인 컨텐츠 스크롤 충돌 방지를 위해 `pointer-events-none` 패턴 사용. 자세한 내용은 `HORIZONTAL_SCROLL_FIX_STRATEGY.md` 참조.

3. **대형 파일**: `src/components/ats/RightPanel.tsx` (1600라인+), `src/app/tsi/refine-cutoffs/page.tsx` (1894라인) 등 관리 필요.

4. **환경 변수**: `.env.deploy` 참조. API_BASE_URL 기본값은 `https://nexus.oprimed.com`.

5. **테스트 없음**: 현재 테스트 프레임워크 미설정. 필요 시 Jest/Vitest 추가 검토.

---

## AI ASSISTANT SETTINGS

### 자동 적용 스킬 (Auto-Load Skills)

사용자가 다음 키워드를 언급하면 **자동으로 해당 스킬을 로드**하여 작업:

| 키워드/패턴 | 자동 로드 스킬 | 적용 대상 |
|------------|---------------|----------|
| "버셀스킬", "vercel 스킬", "Vercel 기준" | `vercel-react-best-practices` | React/Next.js 코드 작성/리뷰 |
| "버셀스킬의 능력치까지 다 동원해서" | `vercel-react-best-practices` + 관련 카테고리 | 성능 최적화 중심 개발 |

### vercel-react-best-practices 스킬 적용 시

1. **57개 규칙 자동 적용**: Waterfall 제거, Bundle 최적화, Server 성능, Re-render 최적화 등
2. **우선순위 기반 개선**: CRITICAL → HIGH → MEDIUM → LOW 순으로 개선
3. **코드 생성 시**: 성능 최적화 패턴을 기본으로 적용
4. **코드 리뷰 시**: 위반 항목을 찾아 개선안 제시

### 예시 요청 패턴

```
"버셀스킬의 능력치까지 다 동원해서 작성해줘"
→ vercel-react-best-practices 스킬 자동 로드
→ React/Next.js 성능 최적화 기준으로 코드 생성

"이 컴포넌트 Vercel 기준으로 리팩터링해줘"
→ vercel-react-best-practices 스킬 자동 로드  
→ 57개 규칙으로 코드 검토 및 개선
```
