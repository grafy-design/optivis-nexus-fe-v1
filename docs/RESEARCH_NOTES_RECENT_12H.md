# 최근 12시간 작업 연구노트

## 작업 개요
- **기간**: 최근 12시간
- **목적**: 메인 페이지 및 시뮬레이션 페이지 UI 컴포넌트 개발

---

## 주요 작업

### 1. Main 페이지 Search Bar UI ✅
- **파일**: `src/components/home/simulation-search.tsx`, `src/components/ui/input.tsx`
- **구현**: 검색 아이콘 통합, 둥근 모서리 (rounded-[100px]), 높이 40px
- **상태**: 완료

### 2. 테이블 헤더/Body UI ✅
- **파일**: `src/components/home/simulation-table.tsx`
- **구현**: 
  - 헤더: 회색 배경 (#636364), 높이 46px
  - 바디: 흰색 배경, 최소 높이 394px
  - 서비스 ID별 동적 컬럼 (Adaptive Trial / Drug Response)
- **상태**: 완료

### 3. 시뮬레이션 페이지 헤더 UI ✅
- **파일**: `src/components/layout/SimulationHeader.tsx`
- **구현**: Breadcrumb, Make Report 버튼, 네비게이션 화살표, Help 버튼
- **상태**: 완료

### 4. Sample Size Control 카드 UI ✅
- **파일**: `src/app/simulation/page.tsx` (157-191라인)
- **구현**: 
  - Liquid Glass 효과 적용
  - 슬라이더 (Size - Power +)
  - 배경색: #262255, 슬라이더: #f26702
- **상태**: 완료

### 5. 게이지 컴포넌트 개발 🔄
- **파일**: `src/components/ui/gauge.tsx`
- **구현**:
  - 정적 SVG → 동적 React 컴포넌트 변환
  - 값에 따른 게이지 채움 (0~1)
  - 갭 기능 (채워진 부분 93%, 갭 5%, 빈 부분)
  - 인디케이터 (원 + 화살표)
  - 둥근 끝 처리
- **주요 이슈**:
  - 게이지 뒤집힘 → y축 반전으로 해결
  - 갭 구현 → gapRatio 0.93, gapAngleRatio 0.05 적용
  - 빈 arc 시작점 둥글게 → strokeLinecap="round" 적용
- **상태**: 진행 중

---

## 기술 스택
- React, Next.js, TypeScript
- TailwindCSS
- SVG Path 계산

---

## 다음 작업
- 게이지 컴포넌트 완성
- 애니메이션 추가 검토
- 반응형 개선


