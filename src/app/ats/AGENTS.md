# ATS (Adaptive Trial Simulation) - AGENTS.md

**Path:** `src/app/ats/`  
**Type:** Next.js App Router Pages  
**Complexity:** High (10 files, ~3,457 lines)

---

## OVERVIEW

ATS 워크플로우는 적응형 임상시험 시뮬레이션 기능을 제공합니다. 시뮬레이션 설정부터 결과 리포트까지 3단계로 구성됩니다.

---

## STRUCTURE

```
src/app/ats/
├── simulation/
│   ├── page.tsx               # 시뮬레이션 설정 (867 lines)
│   └── report/
│       ├── page.tsx           # 결과 리포트 (1,231 lines)
│       └── charts/            # 리포트 차트 컴포넌트
│           ├── Step1SampleSizeChart.tsx
│           ├── Step1PrecisionModelChart.tsx
│           ├── Step2DecisionStabilityChart.tsx
│           ├── Step2RobustnessProofChart.tsx
│           ├── Step2TypeSafetyChart.tsx
│           ├── Step2VarianceDeclineChart.tsx
│           └── Step3AbsolutePerformanceChart.tsx
```

---

## WHERE TO LOOK

| 페이지 | 파일 | 설명 |
|--------|------|------|
| **Simulation Setup** | `simulation/page.tsx` | 가설 설정, 엔드포인트 구성, 파라미터 조정 |
| **Report** | `simulation/report/page.tsx` | 분석 결과 리포트 및 차트 (대형 파일) |
| **Report Charts** | `simulation/report/charts/*.tsx` | ECharts 기반 결과 시각화 |

---

## CONVENTIONS

### 페이지 레이아웃 패턴

```tsx
<div className="w-full flex flex-col items-center">
  <div className="w-[1772px] flex-shrink-0 mx-auto">
    {/* 컨텐츠 */}
  </div>
</div>
```

### 헤더 사용

ATS 전용 헤더 컴포넌트 사용:
```tsx
import { ATSHeader } from "@/components/layout/ATSHeader";

// page.tsx에서 상태에 따라 리포트 버튼 활성화
```

### 상태 관리

Zustand 스토어 사용:
```tsx
import { useSimulationStore } from "@/store/simulationStore";

const { 
  primaryEndpoints, 
  secondaryEndpoints,
  isApplied,
  setIsApplied 
} = useSimulationStore();
```

---

## ANTI-PATTERNS

### 대형 파일 주의
- `simulation/page.tsx` (~867 lines)
- `simulation/report/page.tsx` (~1,231 lines)

**권장:**
- 시뮬레이션 로직을 `hooks/`로 분리
- 차트 설정은 차트 컴포넌트 내부에서 관리
- API 호출은 `services/studyService.ts` 사용

### 컴포넌트 분리
시뮬레이션 페이지의 복잡한 UI는 다음으로 분리:
- `src/components/ats/LeftPanel.tsx` - 좌측 설정 패널
- `src/components/ats/RightPanel.tsx` - 우측 결과 패널

---

## WORKFLOW STEPS

ATSHeader의 workflow 순서:

1. **Simulation** (`/ats/simulation`)
   - 가설 설정
   - 엔드포인트 구성
   - 파라미터 조정
   - 시뮬레이션 실행

2. **Report** (`/ats/simulation/report`) - `isApplied` 상태일 때 활성화
   - 결과 개요
   - 상세 차트
   - 다운로드 기능

---

## NOTES

- 시뮬레이션 실행 후 `isApplied` 상태가 true로 설정됨
- 리포트 페이지는 `isApplied`가 true일 때만 접근 가능
- 차트는 ECharts 5.6.0 사용
- 배경 이미지: `/assets/simulation/bg.png`
- API 호출: `callMLStudyDesign()` 함수 사용 (10분 타임아웃)
