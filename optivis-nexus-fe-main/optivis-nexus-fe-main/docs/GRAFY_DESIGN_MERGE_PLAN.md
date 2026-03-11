# feature/grafy 디자인 병합 작업 계획서

작성일: 2026-03-06

## 목표
- `feature/grafy`의 디자인(퍼블리싱) 결과를 `main` 브랜치에 안전하게 병합한다.
- 대규모 일괄 병합이 아닌, 기능 단위의 작은 작업으로 나누어 순차 적용한다.

## 핵심 원칙
1. 기능 충돌 시 `main` 우선
2. 디자인/스타일 충돌 시 `feature/grafy` 우선
3. 하나의 파일에 기능+디자인이 섞여 충돌하면, `main` 기능 로직을 기준으로 `feature/grafy` 스타일을 재적용한다.
4. 작업 순서는 "안전 구간 우선" 원칙을 적용한다.
5. 단, `loader`/`loading` UI 디자인은 `main`을 우선한다.
6. 차트(그래프) 관련 UI와 스타일은 `main`을 우선한다.

## 작업 순서 선정 룰
1. 아예 터지지 않는(충돌/회귀 위험이 낮은) 영역부터 먼저 작업한다.
2. 다음 작업에서 터질 가능성이 있는 위험 구간은 작업 전에 브리핑한다.
3. 브리핑 후 사용자 판단을 받아 진행 여부를 확정한다.

## 충돌 판정 기준
- 기능(메인 우선): API 호출, 상태관리(store), 데이터 가공 로직, 이벤트 핸들러의 동작, 라우팅, 비즈니스 분기
- 디자인(그래피 우선): 레이아웃 구조, `className`, 스타일 토큰, 간격/정렬, 아이콘/이미지/폰트, 시각 컴포넌트 외형
- 예외(메인 우선): `loader`/`loading` 화면 및 컴포넌트의 디자인/스타일
- 예외(메인 우선): 차트(그래프) 시각화, 차트 래퍼, 범례/축/툴팁 등 차트 관련 UI/스타일
- 혼합 구간: JSX 구조는 화면 일치를 위해 `feature/grafy` 참고, 내부 계산/상태/데이터 흐름은 `main` 유지

## 작업 브랜치 운영
- 기준 동기화: `origin/main` 최신화 후 시작
- 통합 기준 브랜치: `codex/grafy-design-merge-base`
- 단위 작업 브랜치: `codex/grafy-ui-unit-XX-<scope>`
- 각 단위는 개별 PR로 병합하고, 리뷰 승인 후 다음 단위 진행

## 단위 작업 절차
1. 단위 범위 파일 목록 확정
2. 위험도 분류(안전 구간 / 주의 구간) 후 안전 구간부터 적용
3. 주의 구간 진입 전, 예상 충돌/회귀 포인트 브리핑
4. 사용자 진행 판단 확인 후 작업 진행
5. `main` 대비 `feature/grafy` 스타일 변경점만 선별 적용
6. 충돌 발생 시 핵심 원칙에 따라 수동 정리
7. 로컬 검증 실행
8. 단위 커밋/PR 생성

## 진행 상태 관리 규칙
- 상태 값은 `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`를 사용한다.
- 단위 시작 시 `IN_PROGRESS`로 변경하고, PR 생성 시 `REVIEW`, 병합 완료 시 `DONE`으로 변경한다.
- 사용자 판단 대기 상태는 `BLOCKED`로 표기하고, 사유를 함께 남긴다.

## 기능 단위 분할 계획

| 단위 | 상태 | 범위 | 대표 파일(예시) | 검증 포인트 |
|---|---|---|---|---|
| Unit 01 | `REVIEW` | 공통 레이아웃/토큰 | `src/app/globals.css`, `src/components/layout/*`, `src/components/ui/button.tsx`, `src/components/ui/icon-button.tsx` | 전체 화면 레이아웃 깨짐, 공통 버튼/헤더 스타일 일관성 |
| Unit 02 | `REVIEW` | 홈/진입 화면 | `src/app/page.tsx`, `src/components/home/*` | 홈 카드/검색/테이블 UI 일치, 상호작용 유지 |
| Unit 03 | `REVIEW` | TSI 진입/필터/요약 | `src/app/tsi/page.tsx`, `src/app/tsi/filter/page.tsx`, `src/app/tsi/patients-summary/page.tsx` | 필터 동작 유지, 화면 스타일 반영 |
| Unit 04 | `REVIEW` | TSI Subgroup Selection/Explain | `src/app/tsi/subgroup-selection/page.tsx`, `src/app/tsi/subgroup-explain/page.tsx` | 선택 플로우 기능 정상, 그래프/패널 퍼블리싱 일치 |
| Unit 05 | `REVIEW` | TSI Refine Cutoffs | `src/app/tsi/refine-cutoffs/page.tsx`, 관련 차트 컴포넌트 | 임계값 조정 기능 유지, 차트 UI 정합성 |
| Unit 06 | `REVIEW` | TSI Basis Selection | `src/app/tsi/basis-selection/page.tsx`, `src/app/tsi/basis-selection/charts/*` | 차트 렌더링/레이블/범례 스타일 일치 |
| Unit 07 | `IN_PROGRESS` | TSI Report | `src/app/tsi/[feature]/report/page.tsx`, `src/components/charts/tsi-report/*` | 리포트 섹션별 UI, 데이터 표시 정확성 |
| Unit 08 | `TODO` | 마무리 정리 | 누락 스타일/에셋/경로 정리 | 전체 회귀 스모크, 라우트별 시각 점검 |
| Unit 09 | `REVIEW` | ATS Simulation 안전 구간(레이아웃/헤더 배치) | `src/app/ats/simulation/page.tsx`, `src/components/layout/ATSHeader.tsx` | 기존 Apply/모달/탭 기능 유지 + 레이아웃 깨짐 없음 |
| Unit 10 | `REVIEW` | ATS Simulation 주의 구간(좌우 패널 상세 스타일) | `src/components/ats/LeftPanel.tsx`, `src/components/ats/RightPanel.tsx` | Apply 후 로딩/결과 반영, 탭 전환, 차트 full-screen 동작 |
| Unit 11 | `REVIEW` | ATS Report 스타일 병합 | `src/app/ats/simulation/report/page.tsx`, `src/app/ats/simulation/report/charts/*` | 리포트 렌더/내보내기/차트 스타일 정합성 |

## 단위별 완료 조건 (Definition of Done)
- 충돌 정리 기준이 문서 원칙과 일치한다.
- 기능 회귀 없음(핵심 사용자 플로우 수동 점검 완료).
- 스타일 반영 확인(대상 화면 캡처 기준 비교 완료).
- `npm run lint` 통과 (경고/에러 확인 포함).
- PR 설명에 "기능은 main 우선, 디자인은 feature/grafy 우선" 적용 내역 명시.

## 권장 검증 시나리오
- 홈 -> TSI 진입 -> Filter -> Patients Summary -> Subgroup Selection -> Subgroup Explain -> Refine Cutoffs -> Basis Selection -> Report 순서 스모크 테스트
- 버튼, 모달, 체크박스, 차트 툴팁 등 공통 UI 상호작용 확인
- 해상도별(데스크톱/랩톱) 레이아웃 깨짐 확인

## 리스크 및 대응
- 리스크: JSX 구조 변경 과정에서 이벤트 연결 누락
- 대응: 이벤트 핸들러/props 연결은 `main` 기준으로 재확인 후 스타일만 덮어쓰기

- 리스크: 차트 컴포넌트 스타일 반영 중 데이터 매핑 로직 손상
- 대응: 차트는 `main` 우선 원칙을 적용하고, 필요한 경우 외곽 레이아웃만 제한적으로 정리

- 리스크: 단위 경계가 애매해 중복 수정 발생
- 대응: 단위 시작 전 파일 소유 범위를 고정하고, 선행 단위 머지 후 다음 단위 리베이스

## 커밋 메시지 템플릿
- `feat(ui): merge grafy design for <scope> with main-first logic`
- `chore(ui): resolve merge conflicts (main logic, grafy style)`
