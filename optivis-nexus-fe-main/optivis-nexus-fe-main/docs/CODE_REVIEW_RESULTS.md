# Nexus FE 코드리뷰 결과

작성일: 2026-03-06
최종 갱신: 2026-03-07
리뷰 상태: 1차 목표 완료 후 후속 라운드 진행 중 (6회차 리뷰 반영)
리뷰 원칙: 코드 수정 없이 문서화만 수행
대상 저장소: `/Users/smlee/optivis-nexus-fe`

## 1. 개요
- 본 문서는 `docs/CODE_REVIEW_PLAN.md`에 따라 진행 중인 코드리뷰 결과를 기록한다.
- 총 5회차 리뷰를 기준으로 1차 리뷰 라운드를 완료했고, 현재 6회차 후속 리뷰를 진행 중이다.
- 기준선 수집, 공통 계층, ATS, DRD, TSI 주요 흐름에 대한 1차 Findings를 누적했고, 6회차에서 공통 Select와 TSI refine-cutoffs를 추가 점검했다.
- 아직 모든 세부 화면을 끝까지 소진한 것은 아니므로, 후속 라운드에서 Findings가 더 늘어날 수 있다.

### 1.1 리뷰 회차 로그

| 회차 | 날짜 | 초점 영역 | 결과 |
|---|---|---|---|
| 1회차 | 2026-03-06 | 기준선 수집, 공통 fetcher/service/store 초기 점검 | build/lint/typecheck 기준선 수집, 공통 P1/P2 Findings 기록 |
| 2회차 | 2026-03-06 | TSI 초기 흐름 및 결과 문서 보강 | TSI mock task, summary 스케일, report refetch 이슈 기록 |
| 3회차 | 2026-03-07 | 공통 레이아웃/공통 UI 입력 컴포넌트 점검 | 공통 Slider 입력 한계, 스케일링 계층 위험 점검 |
| 4회차 | 2026-03-07 | DRD 단계형 task 문맥 및 진입 흐름 심층 점검 | mock task 자동 주입, task alias 중복 문제 기록 |
| 5회차 | 2026-03-07 | ATS 리포트/PDF 상호작용 및 다운로드 흐름 점검 | ATS PDF 동작 불일치, 리포트 인터랙션 이슈 보강 |
| 6회차 | 2026-03-07 | 공통 Select, TSI refine-cutoffs 오류 처리 점검 | 공통 Select 접근성 결손, TSI refine-cutoffs 무음 실패 문제 기록 |

## 2. 기준선 점검 결과

### 2.1 lint
- 명령: `npm run lint`
- 결과: 성공
- 세부: `0 errors`, `81 warnings`
- 주요 집중 구간:
  - `src/app/ats/simulation/report/page.tsx`
  - `src/app/drd/default-setting/page.tsx`
  - `src/app/drd/filter/page.tsx`
  - `src/app/tsi/refine-cutoffs/components/RefineCutoffChartEditor.tsx`
  - `src/components/charts/*`
- 해석:
  - 현재 lint는 통과하지만 `any`, 미사용 변수, 불필요한 eslint-disable이 다수 남아 있다.
  - 경고만으로 남겨둔 규칙이 많아서 품질 게이트로서의 강도가 낮다.

### 2.2 typecheck
- 명령: `npx tsc --noEmit`
- 결과: 성공
- 해석:
  - 현재 타입 체크 자체는 통과한다.
  - 다만 build 시 타입 오류를 무시하도록 설정되어 있어서, 실제 배포 단계에서 타입 검증이 강제되지는 않는다.

### 2.3 build
- 명령: `npm run build`
- 결과: 실패
- 관찰 내용:
  - Next.js가 워크스페이스 루트를 `/Users/smlee`로 추론했다는 경고를 출력했다.
  - 이후 `Skipping validation of types`, `Skipping linting`이 출력되었다.
  - 마지막에 `PageNotFoundError: Cannot find module for page: /_document`로 실패했다.
- 해석:
  - 이 실패는 현재 워크스페이스 루트 추론 문제와 연관될 가능성이 크다.
  - 동시에, build 단계가 lint/type 검증을 실제로 수행하지 않는다는 점도 확인되었다.

## 3. 핵심 Findings 요약

| ID | Priority | Area | File | 요약 | Status |
|---|---|---|---|---|---|
| CR-COMMON-001 | P1 | Common | `src/services/studyService.ts` | DRD가 브라우저에서 존재 확인이 안 되는 `/api/proxy/*` 경로에 의존 | Open |
| CR-COMMON-002 | P1 | Common | `src/lib/fetcher.ts` | 환경변수 미설정 시 외부 운영 API로 자동 fallback | Open |
| CR-COMMON-003 | P2 | Common | `next.config.ts`, `eslint.config.mjs` | 배포 빌드에서 타입/린트 검증을 사실상 우회 | Open |
| CR-COMMON-004 | P2 | Common | `src/lib/fetcher.ts` | 빈 응답을 `{}`로 강제 캐스팅하여 계약 오류를 숨김 | Open |
| CR-COMMON-005 | P1 | Common | `src/store/simulationStore.ts` | ATS/DRD가 오류를 store에 기록만 하고 화면에 소비하지 않을 가능성 | Open |
| CR-COMMON-006 | P2 | Common | `src/components/ui/slider.tsx` | 공통 Slider가 마우스 이벤트만 처리해 터치 입력을 지원하지 않음 | Open |
| CR-COMMON-007 | P2 | Common | `src/components/ui/select.tsx` | 공통 Select가 키보드 조작과 기본 접근성 속성을 갖추지 못함 | Open |
| CR-DRD-001 | P1 | DRD | `src/store/simulationStore.ts` | ATS와 DRD가 같은 전역 store의 `taskId`를 공유해 task 문맥이 섞일 수 있음 | Open |
| CR-DRD-002 | P1 | DRD | `src/app/drd/page.tsx` | `/drd` 진입 시 task 문맥이 없으면 mock task/data를 자동 주입함 | Open |
| CR-DRD-003 | P2 | DRD | `src/app/drd/*` | `task_id`/`taskId`/`test_id` 정규화 로직이 다수 페이지에 중복되어 있음 | Open |
| CR-ATS-001 | P1 | ATS | `src/app/ats/simulation/report/page.tsx` | overview 일부 누락 시 리포트 화면이 오류 없이 빈 화면으로 끝날 수 있음 | Open |
| CR-ATS-002 | P2 | ATS | `src/app/ats/simulation/report/page.tsx` | 같은 페이지의 `Save as PDF` 버튼 두 개가 서로 다른 다운로드 경로를 사용 | Open |
| CR-TSI-001 | P1 | TSI | `src/app/tsi/patients-summary/page.tsx` | TSI 실제 task 문맥이 연결되지 않았고 `test-task-id`가 하드코딩되어 있음 | Open |
| CR-TSI-002 | P2 | TSI | `src/app/tsi/subgroup-selection/page.tsx` | 좌측 summary 차트가 set마다 독립 스케일을 써서 행 간 비교를 왜곡할 수 있음 | Open |
| CR-TSI-003 | P2 | TSI | `src/app/tsi/[feature]/report/page.tsx` | 동일 페이지 인스턴스에서 파라미터가 바뀌면 refetch 로딩 상태가 다시 올라가지 않음 | Needs Validation |
| CR-TSI-004 | P1 | TSI | `src/app/tsi/refine-cutoffs/page.tsx` | refine-cutoffs의 조회/생성/저장이 실패해도 사용자에게 오류가 거의 보이지 않음 | Open |

## 4. 상세 Findings

### CR-COMMON-001 [P1] DRD 분석 요청이 저장소 내부에 없는 `/api/proxy/*` 경로에 의존
- Area: Common / DRD
- File:
  - `src/services/studyService.ts`
  - `src/app/drd/default-setting/page.tsx`
- Symptom:
  - 구형 `studyService.ts`는 브라우저 환경에서 `callMLStudyDesign`을 `/api/proxy/study-play`로 보내고, 다운로드는 `/api/proxy/download/:taskId`로 보낸다.
  - 현재 저장소에는 해당 API route나 `rewrites` 설정이 보이지 않는다.
  - DRD Default Setting 페이지는 이 구형 서비스를 직접 import해서 사용한다.
- Evidence:
  - `src/services/studyService.ts:284-287`
  - `src/services/studyService.ts:342-345`
  - `src/app/drd/default-setting/page.tsx:22`
  - `src/app/drd/default-setting/page.tsx:912`
  - 저장소 검색 결과 기준 `src/app/api/*` 및 `next.config.ts`에 해당 proxy route/rewrite 정의를 확인하지 못함
- Why it matters:
  - DRD의 `Apply to Analysis` 핵심 요청이 환경 의존적으로 실패할 수 있다.
  - ATS는 다른 구현(`src/services/study-service.ts`)을 쓰고 있어서, 같은 기능이 도메인마다 서로 다른 네트워크 경로를 타게 된다.
  - 인프라 외부 설정에 의존하는 숨은 전제가 생겨 로컬/스테이징/리뷰 환경에서 장애가 발생하기 쉽다.
- Recommendation:
  - study API 계층을 하나로 통합하고, 클라이언트/서버 모두에서 동일한 transport 규칙을 쓰도록 정리할 필요가 있다.
  - 만약 proxy가 의도된 구조라면, 저장소 안에서 route/rewrite를 명시하거나 운영 의존성을 문서화해야 한다.
- Fix Cost: M
- Status: Open

### CR-COMMON-002 [P1] API base URL이 미설정 시 운영 호스트로 자동 fallback됨
- Area: Common
- File:
  - `src/lib/fetcher.ts`
  - `src/services/studyService.ts`
- Symptom:
  - `NEXT_PUBLIC_API_BASE_URL`이 없으면 API 호출이 자동으로 `https://nexus.oprimed.com`으로 향한다.
  - 이 fallback은 공통 fetcher뿐 아니라 구형 study service에도 중복 존재한다.
- Evidence:
  - `src/lib/fetcher.ts:3`
  - `src/lib/fetcher.ts:47-57`
  - `src/services/studyService.ts:1-2`
  - `src/services/studyService.ts:287`
  - `src/services/studyService.ts:345`
- Why it matters:
  - 로컬 개발, 리뷰 환경, CI에서 환경변수 누락 시 의도치 않게 운영 API를 호출할 수 있다.
  - 테스트 데이터와 운영 데이터를 혼동하거나, 외부 시스템 부하/오염을 유발할 수 있다.
  - 문제 발생 시 원인이 “환경 누락”인지 “서버 장애”인지 구분하기 어려워진다.
- Recommendation:
  - 환경변수 미설정 시 즉시 실패하도록 하고, 필요한 경우 개발용 기본값은 별도의 안전한 mock/staging endpoint로 제한하는 편이 낫다.
  - 동일 fallback이 중복된 서비스 계층은 단일화가 필요하다.
- Fix Cost: S
- Status: Open

### CR-COMMON-003 [P2] build 단계가 타입/린트 검증을 우회해 배포 신뢰도가 낮음
- Area: Common
- File:
  - `next.config.ts`
  - `eslint.config.mjs`
- Symptom:
  - production build에서 ESLint와 TypeScript 오류를 무시하도록 설정되어 있다.
  - lint 규칙도 `react-hooks/exhaustive-deps` 비활성화, `any`와 unused vars 경고화 등으로 완화돼 있다.
- Evidence:
  - `next.config.ts:28-35`
  - `eslint.config.mjs:24-39`
  - 실제 build 로그에 `Skipping validation of types`, `Skipping linting`이 출력됨
  - 실제 lint 결과는 `81 warnings`
- Why it matters:
  - 핵심 회귀가 build에서 걸러지지 않는다.
  - 리뷰 중 발견되는 품질 문제를 CI가 계속 통과시킬 수 있어, 장기적으로 결함 누적 속도가 빨라진다.
  - 특히 대형 페이지와 차트 계층에서는 작은 타입/훅 의존성 문제도 런타임 장애로 이어질 수 있다.
- Recommendation:
  - 단번에 엄격화하기 어렵다면, 우선 build 무시 옵션 제거 계획과 warning 감축 기준선을 별도로 잡는 것이 필요하다.
  - `react-hooks/exhaustive-deps`는 전면 off 대신 예외 구간만 국소 억제로 줄이는 것이 바람직하다.
- Fix Cost: M
- Status: Open

### CR-COMMON-004 [P2] 공통 fetcher가 빈 응답을 `{}`로 캐스팅해 계약 오류를 숨김
- Area: Common
- File: `src/lib/fetcher.ts`
- Symptom:
  - JSON 응답 본문이 비어 있으면 `return {} as T`로 강제 반환한다.
  - 호출자는 실제로는 body가 없는 응답과 정상적인 빈 객체 응답을 구분할 수 없다.
- Evidence:
  - `src/lib/fetcher.ts:69-73`
- Why it matters:
  - API 계약이 어긋나도 호출부에서 조용히 넘어갈 수 있다.
  - 이후 화면에서 optional chaining으로만 접근하면 “빈 화면” 또는 “데이터 없음”처럼 보이면서 실제 계약 오류가 숨어버릴 수 있다.
  - 디버깅 시 서버 문제와 프런트 처리 문제를 구분하기 어려워진다.
- Recommendation:
  - `204/empty body`를 명시적으로 처리하고, JSON 본문이 필요한 API에서는 빈 응답을 오류로 다루는 편이 안전하다.
  - 최소한 호출자가 빈 응답을 식별할 수 있는 contract를 만들어야 한다.
- Fix Cost: S
- Status: Open

### CR-COMMON-005 [P1] 전역 simulation error 상태가 기록만 되고 소비되지 않아 실패가 사용자에게 보이지 않을 수 있음
- Area: Common / ATS / DRD
- File:
  - `src/store/simulationStore.ts`
  - `src/app/ats/simulation/page.tsx`
  - `src/app/drd/default-setting/page.tsx`
  - `src/app/drd/filter/page.tsx`
  - `src/app/drd/patient-disease-info/page.tsx`
  - `src/app/drd/high-risk-subgroup/page.tsx`
  - `src/app/drd/medical-history/page.tsx`
- Symptom:
  - `simulationStore`에는 `error`와 `setError`가 정의돼 있다.
  - ATS/DRD 여러 핵심 화면이 실패 시 `setError(...)`를 호출한다.
  - 그러나 저장소 전체 검색 기준 이 `error` 상태를 구독해서 렌더링하거나 toast로 표시하는 소비 지점을 찾지 못했다.
- Evidence:
  - `src/store/simulationStore.ts:110-167`
  - `src/store/simulationStore.ts:245-247`
  - `src/app/ats/simulation/page.tsx:639`
  - `src/app/drd/default-setting/page.tsx:793`
  - `src/app/drd/default-setting/page.tsx:975`
  - `src/app/drd/filter/page.tsx:1036-1086`
  - `src/app/drd/patient-disease-info/page.tsx:438-481`
  - 저장소 검색 결과 기준 `useSimulationStore(...error...)` 소비 지점을 확인하지 못함
- Why it matters:
  - 저장, 조회, Apply 실패가 발생해도 사용자에게는 아무 일도 없었던 것처럼 보일 수 있다.
  - 특히 DRD 단계형 플로우에서는 실패를 모르고 다음 단계로 이동하거나 같은 시도를 반복할 가능성이 높다.
  - 운영 중 장애 탐지가 늦어지고, 재현 정보도 부족해진다.
- Recommendation:
  - 공통 에러 표시 채널을 만들거나, 각 화면에서 최소한 저장/조회 실패 상태를 명시적으로 렌더링해야 한다.
  - “store에 기록만 하는 에러” 패턴은 제거하는 편이 안전하다.
- Fix Cost: M
- Status: Open

### CR-COMMON-006 [P2] 공통 Slider가 마우스 이벤트만 처리해 터치 기반 입력을 지원하지 않음
- Area: Common UI / ATS / DRD
- File:
  - `src/components/ui/slider.tsx`
  - `src/components/ats/LeftPanel.tsx`
  - `src/components/drd/LeftPanel.tsx`
- Symptom:
  - 공통 Slider는 `onMouseDown`, `document.mousemove`, `document.mouseup`만 사용한다.
  - `touchstart`, `touchmove`, `pointerdown` 계열 처리가 없다.
  - 이 Slider는 ATS/DRD 좌측 입력 패널의 핵심 제어에 재사용되고 있다.
- Evidence:
  - `src/components/ui/slider.tsx:34-53`
  - `src/components/ui/slider.tsx:69-131`
  - `src/components/ats/LeftPanel.tsx:341`
  - `src/components/drd/LeftPanel.tsx:336`
- Why it matters:
  - 터치 기반 디바이스나 터치스크린 환경에서는 핵심 입력이 동작하지 않을 가능성이 높다.
  - 공통 컴포넌트 수준의 한계라서 ATS/DRD 여러 화면에 동시에 영향을 준다.
  - 입력 컨트롤이 조용히 반응하지 않으면 사용자 입장에서는 데이터가 잠긴 것처럼 보일 수 있다.
- Recommendation:
  - Slider 입력 계층을 pointer event 또는 touch 지원 방식으로 통합하는 것이 안전하다.
  - 최소한 모바일/터치 환경 지원 범위를 문서화하거나 별도 fallback을 둬야 한다.
- Fix Cost: M
- Status: Open

### CR-COMMON-007 [P2] 공통 Select가 키보드 조작과 기본 접근성 속성을 갖추지 못해 핵심 입력이 마우스 중심으로 제한됨
- Area: Common UI / ATS / DRD / TSI
- File:
  - `src/components/ui/select.tsx`
  - `src/components/ats/LeftPanel.tsx`
  - `src/components/drd/LeftPanel.tsx`
  - `src/app/tsi/refine-cutoffs/page.tsx`
  - `src/components/ui/add-endpoints-modal.tsx`
- Symptom:
  - 공통 Select는 트리거 버튼의 `onClick`으로만 열리고, 파일 전체에 `onKeyDown` 기반 키보드 탐색 처리가 없다.
  - 드롭다운은 `role="listbox"`와 `role="option"`만 부여하고, 트리거 쪽 `aria-expanded`, `aria-controls`, active option 이동 같은 기본 상호작용은 구현하지 않았다.
  - 이 컴포넌트는 ATS/DRD 좌측 패널, TSI `refine-cutoffs`의 month selector, endpoint 설정 모달 등 핵심 입력 흐름 전반에 재사용되고 있다.
- Evidence:
  - `src/components/ui/select.tsx:56-59`
  - `src/components/ui/select.tsx:103-116`
  - `src/components/ats/LeftPanel.tsx:319`
  - `src/components/drd/LeftPanel.tsx:314`
  - `src/app/tsi/refine-cutoffs/page.tsx:1065-1074`
  - `src/components/ui/add-endpoints-modal.tsx:433-438`
- Why it matters:
  - 키보드 사용자나 보조기기 사용자 입장에서는 옵션 열기, 이동, 선택이 사실상 막히거나 매우 불안정해질 수 있다.
  - 공통 컴포넌트 수준의 결손이라서 ATS, DRD, TSI, 모달 기반 설정 화면에 동시에 영향을 준다.
  - 특히 설정형 화면에서는 입력 자체가 불가능해지는 순간 기능 결함으로 이어진다.
- Recommendation:
  - 가능하면 네이티브 `select`를 우선 검토하고, 커스텀 UI를 유지할 경우 combobox/listbox 패턴의 키보드/ARIA 상호작용을 완성해야 한다.
  - 최소한 `Enter`, `Space`, `ArrowUp/Down`, `Escape`, `Tab` 동작과 `aria-expanded`/`aria-controls`를 명시적으로 추가해야 한다.
- Fix Cost: M
- Status: Open

### CR-DRD-001 [P1] ATS와 DRD가 같은 전역 `taskId` 저장소를 공유해 task 문맥이 섞일 수 있음
- Area: DRD / ATS
- File:
  - `src/store/simulationStore.ts`
  - `src/app/ats/simulation/page.tsx`
  - `src/app/drd/patient-disease-info/page.tsx`
  - `src/app/drd/filter/page.tsx`
- Symptom:
  - ATS와 DRD가 동일한 `simulationStore`를 공유한다.
  - 이 store에는 `taskId`, API 결과, endpoint 설정 등 ATS 성격의 상태가 함께 들어 있다.
  - ATS 시뮬레이션 페이지는 뒤로가기 시 데이터를 유지하기 위해 reset 호출을 제거했다고 명시한다.
  - DRD 여러 페이지는 query에 `task_id`가 없을 때 이 shared store의 `simulationTaskId`를 fallback으로 사용한다.
- Evidence:
  - `src/store/simulationStore.ts:57-167`
  - `src/store/simulationStore.ts:170-248`
  - `src/app/ats/simulation/page.tsx:68-70`
  - `src/app/drd/patient-disease-info/page.tsx:409-418`
  - `src/app/drd/filter/page.tsx:965-974`
- Why it matters:
  - ATS에서 남은 `taskId`가 DRD 페이지의 기본 문맥으로 재사용될 수 있다.
  - 서로 다른 도메인의 task 식별자가 같은 전역 store 슬롯을 공유하면, 잘못된 데이터 조회/저장으로 이어질 위험이 있다.
  - 특히 query가 누락되거나 사용자가 뒤로가기/재진입을 반복할 때 재현 가능성이 높다.
- Recommendation:
  - ATS와 DRD의 실행 문맥은 store를 분리하거나 최소한 `taskId` namespace를 분리할 필요가 있다.
  - query 부재 시 shared store를 fallback으로 쓰는 규칙은 보수적으로 재검토해야 한다.
- Fix Cost: M
- Status: Open

### CR-DRD-002 [P1] `/drd` 루트 진입 시 실제 문맥이 없어도 mock task/data를 자동 주입함
- Area: DRD
- File:
  - `src/app/drd/page.tsx`
  - `src/services/drd-mock-up-data.ts`
- Symptom:
  - `/drd` 진입 시 `task_id`, `taskId`, `test_id`가 모두 없으면 mock task를 자동으로 넣는다.
  - `disease_id`, `data_id`도 없으면 시연용 기본값을 같이 주입한 뒤 `/drd/default-setting`으로 redirect한다.
- Evidence:
  - `src/app/drd/page.tsx:28-46`
  - `src/services/drd-mock-up-data.ts:3-23`
- Why it matters:
  - 실제 문맥 누락과 데모 진입을 구분하지 못하게 된다.
  - 사용자는 “정상 진입”이라고 생각하지만 내부적으로는 시연용 task를 보고 있을 수 있다.
  - 운영/검증 환경에서 데이터 출처를 혼동하게 만들어 장애 분석과 QA를 어렵게 한다.
- Recommendation:
  - mock 진입은 명시적인 데모 모드로 분리하고, 기본 라우트에서는 문맥 누락을 오류 또는 선택 화면으로 처리하는 편이 안전하다.
- Fix Cost: S
- Status: Open

### CR-DRD-003 [P2] DRD의 task query 정규화 로직이 다수 페이지에 중복 구현되어 유지보수 위험이 큼
- Area: DRD
- File:
  - `src/app/drd/default-setting/page.tsx`
  - `src/app/drd/filter/page.tsx`
  - `src/app/drd/patient-disease-info/page.tsx`
  - `src/app/drd/high-risk-subgroup/page.tsx`
  - `src/app/drd/medical-history/page.tsx`
  - `src/app/drd/simulation-condition/page.tsx`
  - `src/app/drd/simulation-setting/page.tsx`
  - `src/app/drd/simulation-result/page.tsx`
  - `src/app/drd/smile-setting/page.tsx`
- Symptom:
  - `task_id`, `taskId`, `test_id`를 읽고 다시 `task_id`로 쓰는 로직이 여러 페이지에 거의 같은 형태로 복제되어 있다.
  - 각 페이지는 자체 `resolveTaskId`, `buildDrdPathWithContext`를 가지고 있다.
- Evidence:
  - `src/app/drd/filter/page.tsx:965-989`
  - `src/app/drd/high-risk-subgroup/page.tsx:436-455`
  - `src/app/drd/medical-history/page.tsx:420-441`
  - 저장소 검색 기준 DRD 다수 페이지에 동일 패턴 반복
- Why it matters:
  - query 규칙이 바뀌거나 우선순위를 조정해야 할 때 수정 지점이 너무 많다.
  - 한 페이지만 alias 처리 순서가 달라져도 단계형 플로우가 불안정해질 수 있다.
  - 이미 `simulationStore.taskId` fallback까지 섞여 있어 문맥 추적 난이도가 높다.
- Recommendation:
  - DRD 전용 task context 유틸 또는 hook으로 단일화하는 것이 바람직하다.
  - alias 허용 정책을 먼저 정하고, 이후 모든 라우팅 빌더가 같은 구현을 쓰게 해야 한다.
- Fix Cost: M
- Status: Open

### CR-ATS-001 [P1] ATS 리포트는 overview 데이터가 부분 누락되면 오류 없이 빈 화면으로 종료될 수 있음
- Area: ATS
- File: `src/app/ats/simulation/report/page.tsx`
- Symptom:
  - `result_resultsoverview`가 있더라도 `OPTIVIS[0]` 또는 `TRADITIONAL[0]` 중 하나라도 없으면 `reportData`가 `null`이 된다.
  - 이후 페이지는 `!isApplied || !apiData || !reportData` 조건에서 그냥 `null`을 반환한다.
  - 이 경우 redirect는 일어나지 않고, 사용자에게 오류/빈 상태도 보여주지 않는다.
- Evidence:
  - `src/app/ats/simulation/report/page.tsx:103-116`
  - `src/app/ats/simulation/report/page.tsx:481-482`
- Why it matters:
  - 부분 응답이나 비정상 응답 상황에서 화면이 “조용히 사라지는” 형태가 되어 장애 탐지가 늦어진다.
  - 특히 리포트는 사용자가 결과 확인/다운로드를 기대하는 화면이라 빈 화면은 체감 장애가 크다.
- Recommendation:
  - redirect 대상과 invalid data 상태를 분리해야 한다.
  - `apiData`는 있지만 report rendering에 필요한 필드가 부족한 경우에는 명시적인 오류/빈 상태를 보여주는 것이 안전하다.
- Fix Cost: S
- Status: Open

### CR-ATS-002 [P2] ATS 리포트에는 같은 이름의 PDF 버튼 두 개가 있고 서로 다른 다운로드 구현을 사용함
- Area: ATS
- File: `src/app/ats/simulation/report/page.tsx`
- Symptom:
  - 상단 `Save as PDF` 버튼은 클라이언트에서 캡처한 DOM을 `jsPDF`로 생성해 다운로드한다.
  - Appendix 섹션의 `Save as PDF` 버튼은 백엔드 `downloadReportFile(taskId)`를 호출해 별도 파일을 받는다.
  - 두 버튼의 라벨은 동일하지만 파일명, 생성 방식, 실패 처리 방식이 다르다.
- Evidence:
  - `src/app/ats/simulation/report/page.tsx:505-512`
  - `src/app/ats/simulation/report/page.tsx:230-458`
  - `src/app/ats/simulation/report/page.tsx:460-478`
  - `src/app/ats/simulation/report/page.tsx:1296-1302`
- Why it matters:
  - 사용자는 같은 액션으로 이해하지만 실제로는 서로 다른 산출물을 받게 된다.
  - QA 관점에서도 어떤 PDF가 기준 결과물인지 모호해진다.
  - 장애 발생 시 재현이 어려워지고, 사용자 기대와 다운로드 결과가 쉽게 어긋난다.
- Recommendation:
  - PDF 다운로드 경로를 하나로 통일하거나, 두 동작을 명확히 다른 이름으로 분리해야 한다.
  - 최소한 어떤 버튼이 “현재 화면 캡처”이고 어떤 버튼이 “서버 리포트 다운로드”인지 구분이 필요하다.
- Fix Cost: S
- Status: Open

### CR-TSI-001 [P1] TSI 플로우의 실제 task 문맥이 연결되지 않았고 `test-task-id`가 하드코딩되어 있음
- Area: TSI
- File:
  - `src/app/tsi/page.tsx`
  - `src/app/tsi/filter/page.tsx`
  - `src/app/tsi/patients-summary/page.tsx`
  - `src/app/tsi/basis-selection/page.tsx`
- Symptom:
  - TSI 진입 페이지와 filter 페이지는 다음 단계로 이동할 때 `taskId`를 넘기지 않는다.
  - `patients-summary`는 실제 task source를 읽지 않고 `const taskId = "test-task-id"`를 사용한다.
  - 이후 `basis-selection`으로도 이 하드코딩된 `taskId`를 다시 전달한다.
  - `basis-selection`에서 `taskId`가 없으면 다시 `/tsi/patients-summary`로 보내는데, 이 페이지는 또 mock task를 사용한다.
- Evidence:
  - `src/app/tsi/page.tsx:122-125`
  - `src/app/tsi/filter/page.tsx:204-205`
  - `src/app/tsi/patients-summary/page.tsx:13-20`
  - `src/app/tsi/patients-summary/page.tsx:31`
  - `src/app/tsi/patients-summary/page.tsx:50-52`
  - `src/app/tsi/basis-selection/page.tsx:80-87`
- Why it matters:
  - 사용자가 어떤 데이터를 선택했는지와 무관하게 이후 단계가 고정된 테스트 task를 볼 수 있다.
  - 실제 task 기반 API 계약이 연결되지 않아, TSI 주요 플로우가 “보이는 화면은 동작하지만 실제 데이터 문맥은 틀린” 상태가 될 수 있다.
  - 데모 데이터와 실제 데이터가 섞이면 검증 결과 자체를 신뢰하기 어려워진다.
- Recommendation:
  - TSI 진입점에서 선택된 데이터의 실제 식별자를 명시적으로 넘기고, 이후 단계는 그 단일 source만 사용해야 한다.
  - `MOCK_TASK_ID`는 리뷰 기준상 임시 코드가 아니라 기능 결함으로 취급하는 편이 맞다.
- Fix Cost: M
- Status: Open

### CR-TSI-002 [P2] TSI subgroup summary 차트가 set마다 독립 스케일을 사용해 행 간 비교를 왜곡할 수 있음
- Area: TSI
- File: `src/app/tsi/subgroup-selection/page.tsx`
- Symptom:
  - 좌측 `Subgroup Sets Summary`에서 각 set의 mean/CI를 그릴 때, 현재 set의 min/max만으로 정규화한다.
  - 따라서 위아래 다른 set의 막대 길이나 점 위치를 직접 비교할 수 없는데, UI상으로는 같은 축 안에서 비교 가능한 것처럼 보인다.
- Evidence:
  - `src/app/tsi/subgroup-selection/page.tsx:437-450`
  - 코드 주석에 `각 Set마다 독립적인 스케일`이라고 명시되어 있음
- Why it matters:
  - summary 패널이 set 비교용으로 사용될 경우 사용자가 variance나 mean 차이를 시각적으로 잘못 해석할 수 있다.
  - 특히 선택 전 overview 단계에서 “어떤 set이 더 벌어져 보이는지” 같은 판단이 왜곡될 수 있다.
- Recommendation:
  - 행 간 비교를 의도한 UI라면 공통 축을 써야 한다.
  - 독립 스케일이 의도라면, 축/라벨/설명을 추가해 직접 비교가 불가능하다는 점을 표시해야 한다.
- Fix Cost: M
- Status: Open

### CR-TSI-003 [P2] TSI report는 파라미터 변경 시 refetch 로딩 상태를 다시 올리지 않음
- Area: TSI
- File: `src/app/tsi/[feature]/report/page.tsx`
- Symptom:
  - report fetch effect는 파라미터가 바뀔 때 `reportResponse`와 `fetchError`는 초기화하지만 `setIsLoading(true)`를 다시 호출하지 않는다.
  - 첫 진입 후 같은 페이지 인스턴스가 재사용되는 클라이언트 전환이라면, 새 요청 동안 로딩 UI 없이 빈 데이터 기반 화면이 먼저 렌더될 수 있다.
- Evidence:
  - `src/app/tsi/[feature]/report/page.tsx:467`
  - `src/app/tsi/[feature]/report/page.tsx:469-491`
- Why it matters:
  - feature/subgroup 전환 시 사용자에게 로딩 대신 비어 있는 섹션이 잠깐 보이거나 stale state처럼 보일 수 있다.
  - 리포트는 섹션 수가 많아 partial empty render가 실제 데이터 결함처럼 보일 가능성이 높다.
- Recommendation:
  - refetch 시작 시 로딩 상태를 명시적으로 올리고, 이전 응답을 유지할지 초기화할지 정책을 분리해야 한다.
- Fix Cost: S
- Status: Needs Validation

### CR-TSI-004 [P1] TSI refine-cutoffs는 조회/생성/저장이 실패해도 사용자에게 오류가 거의 보이지 않음
- Area: TSI
- File:
  - `src/app/tsi/refine-cutoffs/page.tsx`
  - `src/services/subgroup-service.ts`
- Symptom:
  - 초기 데이터 조회는 실패 시 `featureInfoData`와 `setInfoData`를 `null`로 비우고 종료하지만, 오류 상태를 별도로 저장하거나 안내 메시지를 렌더링하지 않는다.
  - `Generate Subgroups`도 실패 시 결과만 비우고 끝나서 사용자는 빈 패널만 보게 된다.
  - 저장 버튼은 `saveSubgroupIdentification(...)`를 `try/finally`로만 감싸고 있어, 네트워크 오류나 4xx/5xx가 발생하면 로딩만 내려간 채 이유를 설명하지 못한다.
  - 페이지는 `Loading` 오버레이만 렌더링하고, 조회/생성/저장 실패를 표시하는 에러 UI가 없다.
- Evidence:
  - `src/app/tsi/refine-cutoffs/page.tsx:633-743`
  - `src/app/tsi/refine-cutoffs/page.tsx:705-709`
  - `src/app/tsi/refine-cutoffs/page.tsx:726-729`
  - `src/app/tsi/refine-cutoffs/page.tsx:761-795`
  - `src/app/tsi/refine-cutoffs/page.tsx:798-854`
  - `src/app/tsi/refine-cutoffs/page.tsx:859`
  - `src/services/subgroup-service.ts:136-161`
- Why it matters:
  - 백엔드 오류가 발생해도 사용자는 “데이터가 원래 없는 화면”처럼 오해할 수 있다.
  - cutoff 저장 실패는 사용자가 방금 조정한 기준을 잃은 채 원인도 모르는 상태로 남게 만든다.
  - 이 단계는 subgroup 확정 직전의 핵심 화면이라서, 무음 실패는 결과 신뢰도와 재시도 효율을 크게 떨어뜨린다.
- Recommendation:
  - 조회, subgroup 생성, 저장을 각각 분리된 오류 상태로 관리하고, 화면 내 메시지 또는 toast로 실패 원인을 노출해야 한다.
  - 저장 경로는 `catch`를 명시적으로 두고 현재 입력을 유지한 채 재시도할 수 있어야 한다.
- Fix Cost: M
- Status: Open

## 5. 빠른 수정 후보
- study API 호출 경로를 단일화하고 `/api/proxy/*` 의존성의 실제 존재 여부를 명확히 정리
- `NEXT_PUBLIC_API_BASE_URL` 미설정 시 실패하도록 환경 가드 추가
- empty response를 `{}`로 캐스팅하는 fetcher 처리 제거 또는 호출부 contract 명시
- 공통 Select에 키보드/ARIA 상호작용을 추가하거나 네이티브 대체안을 검토
- ATS report의 `reportData === null` 경로에 오류/빈 상태 UI 추가
- TSI `MOCK_TASK_ID` 제거 및 실제 task 전달 경로 단일화
- TSI refine-cutoffs의 조회/생성/저장 오류를 분리 표시하고 저장 실패 재시도 경로 추가
- `/drd` 기본 진입 시 mock task 자동 주입을 데모 모드로 격리
- 공통 Slider 입력을 pointer/touch 대응으로 보강

## 6. 구조 개선 후보
- `src/services/study-service.ts`와 `src/services/studyService.ts` 통합
- 공통 fetcher와 도메인 서비스의 역할 경계 재정리
- build 단계 품질 게이트 복구 계획 수립
- 대형 페이지의 데이터 파싱/변환 로직 분리
- TSI 단계 간 query/state 전달 규칙 정립
- DRD task context 해석과 라우팅 빌더 단일화
- ATS PDF 생성/다운로드 경로 단일화

## 7. 재검증 필요 항목
- build 실패의 직접 원인이 현재 워크스페이스 루트 추론 문제인지, 저장소 설정 자체인지 추가 분리 필요
- DRD `Apply to Analysis`가 실제 운영 환경에서 어떤 프록시 인프라를 전제로 하는지 확인 필요
- ATS report가 partial data 응답을 실제로 받을 수 있는지 백엔드 계약 확인 필요
- TSI report 페이지가 feature/subgroup 전환 시 실제로 컴포넌트를 재사용하는지 확인 필요
- Slider의 실제 모바일/터치 동작을 브라우저에서 실기 확인 필요

## 8. 다음 리뷰 범위
- 공통 계층 추가 점검
  - `src/store/defaultSettingStore.ts`
  - `src/store/simulationStore.ts`
  - `src/components/layout/AppLayout.tsx`
- ATS 심층 리뷰
  - `src/app/ats/simulation/page.tsx`
  - `src/components/ats/RightPanel.tsx`
- DRD 단계형 플로우 재검토
  - `src/app/drd/default-setting/page.tsx`
  - `src/app/drd/filter/page.tsx`
  - `src/app/drd/patient-disease-info/page.tsx`
- TSI 후속 라운드 후보
  - `src/app/tsi/refine-cutoffs/components/RefineCutoffChartEditor.tsx`
  - `src/app/tsi/basis-selection/page.tsx`
  - `src/app/tsi/subgroup-selection/page.tsx`
