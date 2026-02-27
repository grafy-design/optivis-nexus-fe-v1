# ATS Components - AGENTS.md

**Path:** `src/components/ats/`  
**Type:** React Components  
**Complexity:** Very High (2 files, ~2,249 lines)

---

## OVERVIEW

ATS 시뮬레이션 페이지의 주요 UI 컴포넌트들입니다. 시뮬레이션 설정과 결과 표시를 담당하는 대형 컴포넌트들이 위치합니다.

---

## STRUCTURE

```
src/components/ats/
├── LeftPanel.tsx          # 시뮬레이션 설정 패널
└── RightPanel.tsx         # 결과 표시 패널 (~1,600 lines)
```

---

## COMPONENTS

### LeftPanel

**File:** `LeftPanel.tsx` (~649 lines)

**역할:**
- 시뮬레이션 파라미터 설정
- Primary/Secondary 엔드포인트 관리
- 가설 유형 선택 (Superiority, Non-inferiority, Equivalence)

**Props:**
```typescript
interface LeftPanelProps {
  // Zustand store에서 상태 직접 조회
}
```

**주요 기능:**
- 엔드포인트 추가/삭제/수정
- 효과 크기(effect size) 설정
- 다중성 보정(multiplicity adjustment) 설정
- 샘플 크기 컨트롤

---

### RightPanel

**File:** `RightPanel.tsx` (~1,600 lines) ⚠️ 대형 파일

**역할:**
- 시뮬레이션 결과 시각화
- 다양한 차트 타입 지원
- Insight cards 표시
- 전체화면 차트 모달

**Props:**
```typescript
interface RightPanelProps {
  apiData: ApiData | null;
  sampleSizeControl: number;
}
```

**주요 섹션:**
1. **Compare View** - OPTIVIS vs Traditional 비교
2. **Insight Cards** - Smaller Sample, Lower Cost 등
3. **Tables** - 결과 데이터 테이블
4. **Formula Cards** - 통계 공식 표시

---

## ANTI-PATTERNS

### ⚠️ RightPanel 리팩토링 필요

**현재 상태:**
- ~1,600 lines
- 너무 많은 책임 (UI 렌더링, 데이터 변환, 차트 설정)

**권장 분리:**
```
src/components/ats/
├── panels/
│   ├── CompareView.tsx
│   ├── InsightCards.tsx
│   ├── ResultTables.tsx
│   └── FormulaDisplay.tsx
├── charts/
│   ├── SampleSizeChart.tsx
│   ├── CostChart.tsx
│   └── PowerChart.tsx
└── modals/
    └── FullscreenChartModal.tsx
```

---

## CONVENTIONS

### 차트 설정 패턴

ECharts 옵션 설정:
```typescript
const option = {
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'value' },
  series: [...]
};
```

### 데이터 변환

API 응답 데이터를 차트 데이터로 변환:
```typescript
const chartData = useMemo(() => {
  if (!apiData) return null;
  // 데이터 변환 로직
  return transformedData;
}, [apiData]);
```

### 전체화면 모달

차트 클릭 시 전체화면:
```typescript
const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
const [fullscreenChartType, setFullscreenChartType] = useState<string>();

const handleFullscreenClick = (chartType: string) => {
  setFullscreenChartType(chartType);
  setFullscreenModalOpen(true);
};
```

---

## NOTES

- RightPanel은 `apiData` prop을 통해 시뮬레이션 결과 수신
- 모든 차트는 ECharts for React 사용
- 색상 팔레트: Primary (보라색), Secondary (주황색)
- 반응형 고려: `useProcessedStudyData` hook 사용
- 큰 파일이므로 변경 시 충분한 테스트 필요
