# Nexus FE 코드리뷰 계획서

작성일: 2026-03-06
대상 저장소: `/Users/smlee/optivis-nexus-fe`
대상 브랜치: 현재 작업 브랜치 기준
문서 목적: 전체 코드리뷰를 일회성 코멘트가 아니라 실행 가능한 리뷰 프로세스와 결과 문서 체계로 정리한다.

## 1. 계획서 목표
- 프런트엔드 전체 범위를 구조적으로 리뷰한다.
- 리뷰 결과를 `Findings`, `근거`, `우선순위`, `후속 조치`까지 연결되는 문서로 남긴다.
- 대형 페이지, 느슨한 품질 게이트, 테스트 부재로 인한 위험을 먼저 식별한다.
- 이후 실제 수정 작업의 순서를 정할 수 있을 만큼 구체적인 판단 기준을 만든다.

## 2. 이번 리뷰의 성격
- 목적은 “좋아 보이는 코드” 찾기가 아니라 “실제 장애/회귀/유지보수 비용”을 줄이는 것이다.
- 스타일 선호도보다 동작 정확성, 상태 일관성, 데이터 정합성, 품질 게이트 부재를 우선한다.
- 리팩터링 제안은 반드시 사용자 영향, 변경 비용, 기대 효과가 설명될 때만 포함한다.
- 리뷰 코멘트는 산발적으로 남기지 않고 결과 문서에 체계적으로 축적한다.

## 3. 코드베이스 스냅샷

### 기술 스택
- `Next.js 15.5.12`
- `React 19.1.0`
- `TypeScript 5`
- `Tailwind CSS 4`
- `Zustand`
- `Radix UI`
- `ECharts`

### 구조 개요
- 라우팅: `src/app/*` 기반 App Router
- 상태 관리: `src/store/*`의 Zustand store
- API 계층: `src/services/*`
- 공통 유틸: `src/lib/*`, `src/hooks/*`
- 시각화 비중이 높은 차트 구조: `src/components/charts/*`

### 코드량 기준 현황
- `src/app`: 38 files
- `src/components`: 63 files
- `src/services`: 8 files
- `src/store`: 3 files
- `src/hooks`: 2 files
- `src/lib`: 5 files

### 도메인별 대략 규모
- `src/app/ats`: 10 files, 3466 lines
- `src/app/drd`: 12 files, 13486 lines
- `src/app/tsi`: 13 files, 7879 lines
- `src/components/charts`: 21 files, 2634 lines
- `src/components/ui`: 20 files, 3273 lines

### 현재 품질 게이트 관련 사실
- 자동 테스트 파일은 현재 확인되지 않음
- `next.config.ts`에서 아래 옵션이 켜져 있음
  - `eslint.ignoreDuringBuilds: true`
  - `typescript.ignoreBuildErrors: true`
- `eslint.config.mjs`에서 아래 규칙이 완화 또는 비활성화되어 있음
  - `react-hooks/exhaustive-deps: off`
  - `@typescript-eslint/no-explicit-any: warn`
  - `@typescript-eslint/no-unused-vars: warn`
- `src/services/study-service.ts`와 `src/services/studyService.ts`가 공존함
- `src/services/drd-mock-up-data.ts`처럼 mock 경로/시연 데이터가 실제 라우팅과 연결된 흔적이 있음
- `src/lib/fetcher.ts`에서 환경변수 미설정 시 외부 URL을 기본값으로 사용함

## 4. 리뷰 배경과 핵심 가설

### 핵심 가설
1. 대형 단일 페이지에서 UI, 상태, API, 데이터 가공, 라우팅이 섞여 회귀 위험이 높다.
2. 빌드가 타입/린트 오류를 막지 않기 때문에 잠재 결함이 누적되어 있을 가능성이 높다.
3. 차트 중심 화면은 데이터 변환, 리렌더링, fullscreen/export 처리에서 성능 및 정확성 문제가 숨어 있을 수 있다.
4. 테스트 부재로 인해 수동 검증 부담이 크고, 변경 안전성이 낮다.
5. 도메인별 상태 저장 방식이 다르면 화면 간 이동이나 복귀 시 stale state 문제가 발생할 수 있다.

### 이번 리뷰에서 반드시 답해야 할 질문
1. 지금 배포를 막아야 할 수준의 결함 후보가 있는가
2. 사용자가 가장 많이 밟는 플로우에서 실패 가능성이 있는가
3. 큰 파일을 당장 나눠야 할 정도로 유지보수 비용이 임계치를 넘었는가
4. 서비스 타입, store, 화면 소비 타입 사이에 계약 불일치가 있는가
5. 추후 개발 속도를 가장 많이 떨어뜨리는 병목이 어디인가

## 5. 리뷰 산출물

### 필수 문서
1. 계획서: `docs/CODE_REVIEW_PLAN.md`
2. 결과 문서: `docs/CODE_REVIEW_RESULTS.md`

### 선택 문서
- `docs/CODE_REVIEW_FIXLIST.md`
- `docs/CODE_REVIEW_BASELINE.md`
- 재현 절차 문서
- 성능 측정 메모
- 특정 도메인 상세 리뷰 메모

### 결과 문서의 역할
- 단순 메모가 아니라 “무엇을 왜 먼저 고쳐야 하는지”를 결정하는 기준 문서
- 추후 수정 PR의 백로그 역할
- 재검토 시 비교 기준이 되는 스냅샷 역할

## 6. 리뷰 성공 기준
- 공통 기반, Home, ATS, DRD, TSI, 차트 계층을 모두 최소 1회 이상 검토한다.
- 결과 문서에 `우선순위`, `근거`, `영향`, `권장 조치`가 모두 포함된다.
- 즉시 수정 가능한 항목과 구조 개선 항목이 분리된다.
- lint/type/build 기준선 결과가 결과 문서에 정리된다.
- 수동 스모크 테스트 시나리오가 결과 문서에 연결된다.
- 1차 리뷰 라운드는 총 5회차 리뷰를 완료한 시점에 종료로 본다.
- 각 회차의 초점 영역과 주요 Findings는 결과 문서에 회차 로그로 누적한다.

## 7. 리뷰 비목표
- 이번 단계에서 전면 리팩터링을 수행하지 않는다.
- 이번 리뷰 단계에서는 어떤 범위의 코드도 직접 수정하지 않는다.
- 백엔드 API 스펙을 재정의하지 않는다.
- 화면 디자인 선호도를 중심으로 품평하지 않는다.
- 테스트 프레임워크 도입 자체를 즉시 실행하지 않는다.

## 8. 리뷰 원칙
1. 동작과 데이터 정합성을 스타일보다 우선한다.
2. 지적 사항은 “코드 스멜” 수준에서 끝내지 않고 사용자 영향과 함께 적는다.
3. 각 Finding에는 가능한 한 재현 조건 또는 코드 근거를 남긴다.
4. 여러 파일에 걸친 문제는 “대표 원인 파일”과 “파급 파일”을 구분한다.
5. 중복 Findings는 합치고, 원인과 증상을 분리해 기록한다.
6. “고칠 수 있다”와 “지금 고쳐야 한다”를 구분한다.
7. 코멘트보다 문서화 품질을 우선한다. 나중에 읽어도 이해되어야 한다.
8. 리뷰 수행 중에는 코드, 설정, 의존성, 스크립트, 마크업을 포함한 프로젝트 산출물을 수정하지 않는다.
9. 수정이 필요해 보이는 항목이 발견되더라도 즉시 패치하지 않고 결과 문서에만 기록한다.

## 9. 우선순위 체계

### Severity
- `P0`: 배포 차단급. 기능 불능, 데이터 손상, 민감 정보 위험, 광범위 장애 가능성
- `P1`: 높은 우선순위. 핵심 플로우 실패, 계산 오류, 잘못된 데이터 표시, 높은 회귀 가능성
- `P2`: 중간 우선순위. 유지보수성 저하, 성능 문제, 타입 안정성 약화, 예외 처리 누락
- `P3`: 낮은 우선순위. 중복, 가독성, 일관성, 경미한 DX 문제

### 판단 보조 축
- `Impact`: 사용자 영향 범위
- `Likelihood`: 실제 발생 가능성
- `Fix Cost`: 수정 비용과 회귀 위험
- `Blast Radius`: 관련 파일/플로우 파급 범위

우선순위는 Severity만으로 끝내지 않고 위 4개 보조 축까지 함께 기록한다.

## 10. 리뷰 결과 문서 포맷

### 기본 섹션
1. 개요
2. 기준선 점검 결과
3. 핵심 Findings 요약
4. 상세 Findings
5. 빠른 수정 항목
6. 구조 개선 항목
7. 재검증 필요 항목
8. 부록: 명령 결과, 수동 테스트 메모

### 상세 Finding 표준 포맷

| ID | Priority | Area | File | Symptom | Impact | Evidence | Recommendation | Fix Cost | Status |
|---|---|---|---|---|---|---|---|---|---|
| CR-001 | P1 | TSI | `src/app/tsi/...` | 증상 요약 | 사용자 영향 | 코드/재현 근거 | 수정 방향 | M | Open |

### 상세 본문 템플릿
```md
#### CR-001 [P1] TSI query param 부재 시 잘못된 기본 선택
- Area: TSI
- File: `src/app/tsi/subgroup-selection/page.tsx`
- Symptom: `taskId` 또는 `setNo` 이상값 조합에서 기본 선택 상태가 의도와 다를 가능성
- Why it matters: 잘못된 subgroup이 기본 선택되면 리포트/편집 플로우가 잘못된 데이터로 이어질 수 있음
- Evidence:
  - 코드 상 `...`
  - 재현 조건 `...`
- Recommendation:
  - query parsing을 분리
  - invalid input fallback 규칙 명시
  - 화면 표시와 내부 state 초기화 조건 통일
- Fix Cost: M
- Status: Open
```

## 11. 리뷰 범위

### 11.1 공통 기반
대상:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/*`
- `src/components/ui/*`
- `src/lib/*`
- `src/hooks/*`
- `src/store/*`
- `src/services/*`

핵심 질문:
- 공통 컴포넌트가 도메인 지식을 과도하게 알고 있는가
- 전역 스타일이 특정 페이지를 깨뜨릴 가능성이 있는가
- fetcher가 timeout, 오류 메시지, 환경 분기에서 안전한가
- store가 지나치게 비대하거나 setter 중심으로 흩어져 있는가
- 서비스 타입과 실제 소비 타입이 분리되어 중복되고 있는가

### 11.2 Home
대상:
- `src/app/page.tsx`
- `src/components/home/*`

핵심 질문:
- 첫 진입 플로우에서 상태 초기화와 선택 흐름이 안정적인가
- 검색/테이블/카드가 불필요한 전역 상태에 의존하는가
- 홈에서 다른 도메인으로 넘기는 파라미터가 일관적인가

### 11.3 ATS
대상:
- `src/app/ats/simulation/page.tsx`
- `src/app/ats/simulation/report/page.tsx`
- `src/components/ats/*`
- `src/app/ats/simulation/report/charts/*`

핵심 질문:
- `simulationStore`가 너무 많은 책임을 떠안고 있는가
- 파생 데이터 계산이 page와 panel에 중복되어 있는가
- Apply 이후 비동기 호출과 결과 반영 흐름이 안정적인가
- chart highlight, fullscreen, export 흐름에서 상태 불일치가 있는가

### 11.4 DRD
대상:
- `src/app/drd/**/*`
- `src/components/drd/*`
- `src/services/drd-service.ts`
- `src/services/drd-mock-up-data.ts`

핵심 질문:
- 단계형 화면 이동에서 `task_id`, `disease_id`, `data_id` 전달이 일관적인가
- mock-up 경로와 실제 프로덕션 흐름이 섞여 있지는 않은가
- 한 파일에 입력/변환/표시/라우팅이 너무 많이 결합되어 있지는 않은가
- 저장, clear, reload 흐름에서 상태 불일치가 없는가

### 11.5 TSI
대상:
- `src/app/tsi/**/*`
- `src/components/charts/tsi-report/*`
- `src/services/subgroup-service.ts`

핵심 질문:
- `taskId`, `feature`, `setNo`, `subgroupId`, `month` 등 쿼리 의존 흐름이 안정적인가
- 테이블 확장, 라디오 선택, 차트 표시가 동일한 source of truth를 보는가
- 편집형 화면에서 저장 전/후 상태 동기화 규칙이 명확한가
- 리포트 페이지에서 없는 데이터와 빈 데이터를 구분하는가

### 11.6 공통 차트 계층
대상:
- `src/components/charts/*`
- fullscreen/export 관련 UI 컴포넌트

핵심 질문:
- 차트 옵션이 매 렌더마다 재생성되는가
- SSR/CSR 경계가 깨질 수 있는 브라우저 전용 API 사용이 있는가
- 차트 데이터 변환 로직이 여러 파일에 복제되어 있는가
- resize/fullscreen/export 시 메모리 누수나 이벤트 누락 가능성이 있는가

## 12. 우선 검토 대상 파일

| 파일 | 라인 수 | 우선 이유 |
|---|---:|---|
| `src/app/drd/smile-setting/page.tsx` | 2012 | 대형 단일 페이지, 입력/계산/표시 혼합 가능성 |
| `src/app/tsi/subgroup-selection/page.tsx` | 1887 | query, API, 테이블, 차트, 선택 상태 결합 |
| `src/app/drd/simulation-condition/page.tsx` | 1871 | 조건 편집과 시뮬레이션 상태 연결 중심 |
| `src/app/drd/filter/page.tsx` | 1845 | 필터 로직과 렌더링 분기 복잡도 높음 |
| `src/app/drd/simulation-result/page.tsx` | 1823 | 결과 렌더링과 도메인 표현 혼합 |
| `src/components/ats/RightPanel.tsx` | 1636 | ATS 핵심 계산/표시 집중 |
| `src/components/drd/RightPanel.tsx` | 1611 | DRD 핵심 인터랙션 집중 |
| `src/app/ats/simulation/report/page.tsx` | 1382 | 리포트 조합과 차트 정합성 확인 필요 |
| `src/app/tsi/refine-cutoffs/page.tsx` | 1291 | 편집형 UI와 저장 흐름 결합 |
| `src/app/tsi/[feature]/report/page.tsx` | 1012 | 동적 라우트, 리포트 데이터 조건 분기 |
| `src/app/ats/simulation/page.tsx` | 715 | 대형 store 소비와 파생 데이터 계산 |
| `src/hooks/useProcessedStudyData.ts` | 118 | ATS 데이터 가공 기준 로직 |
| `src/lib/fetcher.ts` | 80 | 모든 네트워크 호출 공통 기반 |

## 13. 예상 주요 이슈 축

### 아키텍처/구조
- 대형 파일 비대화
- 도메인 규칙과 UI 표현 로직 혼합
- 중복 타입/서비스 계층 공존

### 안정성
- query param 이상값 처리 미흡
- null/empty/error 상태 누락
- fetch race condition, stale state

### 타입 안정성
- `any` 또는 넓은 타입 단언
- 동일한 도메인 타입의 중복 정의
- 서비스 응답과 컴포넌트 소비 타입 불일치

### 성능
- 대형 배열 매핑/정렬/필터링 반복
- chart options 재계산
- 큰 페이지 단위 재렌더

### 운영성
- 외부 API 기본 URL 하드코딩 fallback
- build 시 오류 무시
- mock 데이터, 임시 파일, `.DS_Store` 등 리포지토리 위생 문제

### 접근성/UX
- 라디오/체크박스/모달 시맨틱 부족
- 테이블 구조 접근성 부족
- 오류 상태가 콘솔에만 남고 UI에 드러나지 않음

## 14. 리뷰 절차

### 공통 운영 규칙
- 본 계획에 따른 리뷰는 `read-only` 원칙으로 수행한다.
- 리뷰 중에는 애플리케이션 코드, 설정 파일, 스타일 파일, 테스트 파일, 문서 외 산출물을 수정하지 않는다.
- 필요한 경우 생성 가능한 산출물은 리뷰 문서와 메모 문서로 한정한다.
- 수정 제안이 필요하면 코드 변경 대신 Finding과 Recommendation으로만 남긴다.
- 리뷰는 단발성 점검이 아니라 반복 라운드 방식으로 수행한다.
- 1차 라운드의 기본 목표치는 총 5회차 리뷰이며, 각 회차마다 초점 영역을 달리한다.
- 회차별 결과는 `docs/CODE_REVIEW_RESULTS.md`에 누적하고, 이전 회차 결과를 덮어쓰지 않는다.

### Phase 0. 준비와 기준선 수집
목표:
- 현재 상태를 측정하고 리뷰 우선순위를 잡는다.

실행 항목:
1. 현재 브랜치 및 작업트리 상태 확인
2. 설치 상태 확인
3. 아래 명령 실행
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`

기록 방식:
- 성공/실패 여부
- 실패 시 대표 오류 유형
- 오류가 발생한 파일의 도메인 분포
- 현재 설정이 오류를 숨기는지 여부

산출물:
- `CODE_REVIEW_RESULTS.md`의 “기준선 점검 결과” 섹션 초안

### Phase 1. 공통 기반 리뷰
목표:
- 도메인별 리뷰 전에 공통 원인을 먼저 묶는다.

점검 대상:
- layout
- ui
- lib
- hooks
- store
- services

구체 점검:
- `fetcher` 예외 메시지, 응답 파싱, 환경변수 fallback
- store reset/hydration 규칙
- 서비스 계층 네이밍 일관성
- 공통 UI의 접근성 속성
- 브라우저 전용 API 사용 위치

산출물:
- 공통 Findings
- 도메인별 파급 가능성 메모

### Phase 2. Home 리뷰
목표:
- 진입 플로우와 전역 선택 상태 연결성을 점검한다.

점검 항목:
- 홈 선택 상태 store 사용 이유
- 검색/카드/테이블 상호작용
- 라우팅 진입점에서 파라미터 구성

### Phase 3. ATS 리뷰
목표:
- 시뮬레이션 입력, API 호출, 리포트 소비 흐름을 검토한다.

점검 항목:
- `simulationStore` 책임 과밀 여부
- page와 panel 간 파생 계산 중복
- Apply 전후 상태 초기화
- 리포트 차트 데이터 매핑 정확성
- fullscreen/export 동작과 메모리/상태 안정성

### Phase 4. DRD 리뷰
목표:
- 다단계 플로우와 대형 페이지의 유지보수 위험을 점검한다.

점검 항목:
- `task_id` 전달 체계
- 단계 완료 상태와 저장 상태 연결
- mock-up 경로 의존 여부
- 대형 페이지 분할 필요성
- clear/load/save API 호출의 일관성

### Phase 5. TSI 리뷰
목표:
- 쿼리 파라미터 의존형 플로우와 리포트/편집 화면의 정확성을 점검한다.

점검 항목:
- `taskId`, `feature`, `setNo` 파싱 및 fallback 규칙
- 선택/확장/편집 상태 동기화
- chart/table/report가 동일한 데이터 원천을 사용하는지 여부
- 빈 응답, 부분 응답, 잘못된 응답 처리

### Phase 6. 횡단 관심사 리뷰
목표:
- 도메인 공통으로 발생하는 문제를 별도로 추출한다.

점검 항목:
- 성능
- 접근성
- 운영성
- 코드 중복
- 타입 계층 정합성

### Phase 7. 결과 문서 정리
목표:
- Findings를 실제 조치 가능한 백로그로 정리한다.

점검 항목:
- 중복 Findings 병합
- 우선순위 재조정
- 빠른 수정 / 구조 개선 분리
- 재검증 항목 작성

## 15. 실제 실행 순서
1. 기준선 수집
2. 공통 기반
3. Home
4. ATS
5. DRD
6. TSI
7. 공통 차트 계층
8. 횡단 관심사 정리
9. 결과 문서 완성

이 순서를 쓰는 이유:
- 공통 기반에서 발견한 문제가 도메인 전체에 반복될 수 있기 때문
- ATS는 store와 차트 파생 데이터 검토가 명확해서 리뷰 기준을 잡기 좋음
- DRD와 TSI는 대형 페이지가 많아 앞선 기준이 있어야 리뷰 품질이 올라감

## 16. 도메인별 상세 체크리스트

### 16.1 공통 기반 체크리스트
- `use client`가 필요한 파일에만 붙어 있는가
- 전역 폰트/스타일이 페이지별 레이아웃을 침범하지 않는가
- 공통 UI 컴포넌트가 aria 속성, role, keyboard support를 갖추는가
- `fetcher`가 실패 시 문맥 있는 오류를 주는가
- API base URL fallback이 개발/운영에서 안전한가
- 서비스 네이밍과 타입 소스가 단일화되어 있는가
- Zustand store reset 규칙이 명확한가

### 16.2 ATS 체크리스트
- 입력값과 API payload가 1:1로 추적 가능한가
- `nominalPower`, `sampleSizeControl`, highlight point 계산이 일관적인가
- 결과 화면이 이전 실행 결과를 잘못 재사용하지 않는가
- Traditional/OPTIVIS 데이터 부재 시 fallback이 안전한가
- 차트용 데이터 변환이 훅과 컴포넌트에 중복되지 않는가
- 보고서 export/download 실패가 UI에 드러나는가

### 16.3 DRD 체크리스트
- 페이지 간 이동 시 필수 query가 누락되면 어떻게 동작하는가
- “완료됨” 상태와 실제 저장된 서버 상태가 엇갈릴 수 있는가
- 필터와 subgroup 조건 로직이 UI 문자열에 묻혀 있지는 않은가
- mock data path가 실제 프로덕션 코드에 남아 있는가
- load 후 hydrate와 local 수정 상태가 충돌하지 않는가

### 16.4 TSI 체크리스트
- `taskId` 부재 시 화면이 안전하게 종료되는가
- `setNo`나 `feature` 이상값이 들어오면 잘못된 default selection이 생기지 않는가
- 테이블 확장 상태와 선택 상태가 충돌하지 않는가
- 편집 화면에서 저장 전후 차트 데이터가 일관적인가
- 리포트 화면에서 데이터 누락과 빈 데이터가 구분되는가
- chart wrapper가 작은 화면과 fullscreen 모두에서 안정적인가

### 16.5 차트 계층 체크리스트
- option 객체가 매 렌더 생성되는가
- `window`, `ResizeObserver`, export API를 안전하게 다루는가
- no-data/loading/error 상태가 일관적인가
- 축 범위, label, tooltip 포맷이 데이터 타입과 맞는가
- DOM 의존 라이브러리가 SSR 경계 밖에서만 실행되는가

## 17. 정적 분석 체크리스트
- `rg "any\\b" src`
- `rg "as\\s+" src`
- `rg "useEffect\\(" src`
- `rg "console\\." src`
- `rg "TODO|FIXME|HACK" src docs`
- `rg "NEXT_PUBLIC_API_BASE_URL|process\\.env" src`
- `rg "\\.DS_Store" -g '*'`

위 결과는 Finding 자체가 아니라 “의심 지점 목록”으로 사용한다.

## 18. 수동 스모크 테스트 시나리오

### Home
1. 홈 진입
2. 패키지/서비스 선택
3. 검색/테이블 상호작용
4. 목적 도메인 이동 확인

### ATS
1. 시뮬레이션 페이지 진입
2. 엔드포인트 설정 변경
3. Apply 실행
4. 결과 차트 확인
5. 리포트 페이지 이동
6. fullscreen/export/download 확인

### DRD
1. 진입 후 초기 task/data 선택
2. patient disease info 입력
3. filter 설정
4. subgroup/medical history 흐름 확인
5. simulation condition/save/load 흐름 확인
6. result 페이지 확인

### TSI
1. 진입 페이지 데이터 선택
2. filter
3. patient summary
4. subgroup selection
5. subgroup explain
6. refine cutoffs
7. basis selection
8. report 확인

### 공통 체크
- 브라우저 콘솔 오류
- 로딩/빈 상태/오류 상태 노출
- 뒤로가기/재진입 시 상태 일관성
- 새로고침 후 필수 데이터 복구 가능 여부

## 19. 리뷰 기록 규칙
1. Finding마다 반드시 대상 파일을 적는다.
2. 재현 가능한 경우 URL, query, 입력값을 함께 적는다.
3. 코드를 근거로 쓸 때는 관련 조건문, state 변화, API 호출 흐름을 요약한다.
4. 하나의 증상이 여러 파일에 걸치면 대표 원인 파일을 먼저 적는다.
5. “수정 제안”은 반드시 실행 단위로 적는다.
6. 애매한 추측은 Findings로 단정하지 않고 `Need Validation`로 남긴다.

## 20. 결과 문서 작성 규칙

### Findings 작성 규칙
- 한 Finding에는 하나의 핵심 문제만 적는다.
- 서로 다른 문제를 억지로 합치지 않는다.
- 반대로 같은 원인에서 나온 증상은 묶는다.

### Recommendation 작성 규칙
- “리팩터링 필요” 같은 추상 표현 금지
- 가능한 형태
  - query parsing 유틸 분리
  - API 응답 타입 단일 소스로 통합
  - 화면 파생 데이터 계산을 hook으로 이동
  - build 타입 체크 무시 옵션 제거 전 단계적 대응

### Status 값
- `Open`
- `Needs Validation`
- `Accepted`
- `Deferred`
- `Fixed`

## 21. 리뷰 중 특히 주의할 코드 포인트
- `src/services/study-service.ts`와 `src/services/studyService.ts`의 역할 중복 및 타입 중복
- `src/lib/fetcher.ts`의 기본 URL fallback과 오류 메시지 처리
- `src/store/simulationStore.ts`의 상태 과밀도
- `src/store/defaultSettingStore.ts`의 hydrate/reset 규칙
- 대형 페이지에서의 query param parsing, default selection, data transformation
- `.next`, `.DS_Store`, mock path 등 운영/리포지토리 위생 신호

## 22. 예상 후속 작업 분류

### 빠른 수정 후보
- 명백한 query guard 추가
- 잘못된 fallback 처리 보완
- 중복 타입 정리 시작점 정의
- 콘솔 에러/빈 상태 처리 보완
- build/lint 설정 리스크 문서화

### 구조 개선 후보
- 대형 페이지 분해
- 서비스/타입 계층 단일화
- chart data transform 공통화
- store 책임 축소
- 테스트 가능한 단위로 로직 분리

## 23. 완료 조건
- 전체 범위 리뷰 1회 완료
- 결과 문서 초안 작성 완료
- 우선순위가 부여된 Findings 목록 완성
- 수동 스모크 테스트 메모 포함
- 빠른 수정과 구조 개선이 분리됨
- 다음 액션이 명시됨

## 24. 바로 다음 실행 항목
1. `Phase 0` 기준선 수집
2. `docs/CODE_REVIEW_RESULTS.md` 파일 생성
3. 공통 기반 리뷰 시작
4. ATS -> DRD -> TSI 순으로 상세 Findings 축적

## 부록 A. 결과 문서 최소 템플릿
```md
# Nexus FE 코드리뷰 결과

작성일: YYYY-MM-DD
기준 브랜치: ...

## 1. 개요

## 2. 기준선 점검 결과
- lint:
- typecheck:
- build:

## 3. 핵심 Findings 요약

## 4. 상세 Findings

## 5. 빠른 수정 항목

## 6. 구조 개선 항목

## 7. 재검증 필요 항목
```

## 부록 B. Finding ID 규칙
- 공통: `CR-COMMON-001`
- Home: `CR-HOME-001`
- ATS: `CR-ATS-001`
- DRD: `CR-DRD-001`
- TSI: `CR-TSI-001`
- Chart: `CR-CHART-001`

## 부록 C. 리뷰 메모에 포함할 최소 정보
- 날짜
- 대상 영역
- 확인한 파일
- 실행한 명령
- 재현 URL 또는 조건
- 잠정 결론
