# DRD API Guide

`docs/DRD_API_GUIDE.pdf`(14p) 내용을 정리한 문서입니다.  
이미지 기반 확인을 위해 각 API에 원본 PDF 페이지를 매핑했습니다.

## 1) PDF 페이지 매핑 요약

| PDF 페이지 | 주요 내용                                       |
| ---------- | ----------------------------------------------- |
| 1          | 표지 (약물 대시보드 API 설명)                   |
| 2          | Disease 원본 데이터 목록 조회                   |
| 3-4        | group-manage task 조회/생성 (중복)              |
| 5          | DRD Task 요약 조회                              |
| 6          | DRD 정보 조회 4종                               |
| 7          | DRD Clear 4종                                   |
| 8          | DRD 환자 정보 저장                              |
| 9          | Disease 목록 조회, group-manage 필터 저장       |
| 10         | DRD 고위험 서브그룹 저장                        |
| 11         | DRD 병력 정보 저장                              |
| 12         | SMILES 유사 화합물 검색                         |
| 13         | Disease Feature/Drug 조회, Simulation 조건 저장 |
| 14         | Simulation 조건 Clear/조회, Simulation 실행     |

## 2) 공통/초기 조회

| Method | Endpoint                                        | 설명                          | PDF 페이지 | 비고                           |
| ------ | ----------------------------------------------- | ----------------------------- | ---------- | ------------------------------ |
| GET    | `/api/nexus/disease/data/list/`                 | Disease 원본 데이터 목록 조회 | 2          | 구성화면에서 사용              |
| GET    | `/api/nexus/group-manage/{entity_type}/info/`   | 최근 task 조회(info)          | 3, 4       | task가 있으면 `task_id` 재사용 |
| POST   | `/api/nexus/group-manage/{entity_type}/insert/` | task_id 생성(insert)          | 3, 4       | 최근 task가 없을 때 생성       |
| GET    | `/api/nexus/drd/task/summary/`                  | DRD Task 요약 조회            | 5          |                                |

## 3) DRD 정보 조회 (Load)

| Method | Endpoint                                   | 설명                                   | PDF 페이지 |
| ------ | ------------------------------------------ | -------------------------------------- | ---------- |
| GET    | `/api/nexus/drd/patient-info/info/`        | DRD 환자 정보 조회                     | 6          |
| GET    | `/api/nexus/drd/group-manage-filter/info/` | DRD group-manage 필터 조회             | 6          |
| GET    | `/api/nexus/drd/subgroups/list/`           | DRD 서브그룹 목록 조회 (Load Subgroup) | 6          |
| GET    | `/api/nexus/drd/medical-history/info/`     | DRD 병력 정보 조회                     | 6          |

## 4) DRD 비활성화 (Clear)

| Method | Endpoint                                    | 설명                                  | PDF 페이지 |
| ------ | ------------------------------------------- | ------------------------------------- | ---------- |
| PATCH  | `/api/nexus/drd/patient-info/clear/`        | DRD 환자 정보 비활성화(clear)         | 7          |
| PATCH  | `/api/nexus/drd/group-manage-filter/clear/` | DRD group-manage 필터 비활성화(clear) | 7          |
| PATCH  | `/api/nexus/drd/subgroups/clear/`           | DRD 고위험 서브그룹 비활성화(clear)   | 7          |
| PATCH  | `/api/nexus/drd/medical-history/clear/`     | DRD 병력 정보 비활성화(clear)         | 7          |

## 5) DRD 저장 (Save)

| Method | Endpoint                                   | 설명                       | PDF 페이지 | 비고                                                 |
| ------ | ------------------------------------------ | -------------------------- | ---------- | ---------------------------------------------------- |
| PUT    | `/api/nexus/drd/patient-info/save/`        | DRD 환자 정보 저장         | 8          |                                                      |
| PUT    | `/api/nexus/drd/group-manage-filter/save/` | DRD group-manage 필터 저장 | 9          |                                                      |
| PUT    | `/api/nexus/drd/subgroups/save/`           | DRD 고위험 서브그룹 저장   | 10         | 여러 feature(컬럼명) 내 하위 그룹 중 1개만 선택 가능 |
| PUT    | `/api/nexus/drd/medical-history/save/`     | DRD 병력 정보 저장         | 11         |                                                      |

## 6) Disease / SMILES / Simulation

| Method | Endpoint                                     | 설명                                | PDF 페이지 | 비고                                   |
| ------ | -------------------------------------------- | ----------------------------------- | ---------- | -------------------------------------- |
| GET    | `/api/nexus/disease/list/`                   | Disease 목록 조회                   | 9          |                                        |
| GET    | `/api/nexus/disease/feature/list/`           | Disease Feature 목록 조회           | 13         |                                        |
| GET    | `/api/nexus/disease/drug/list/`              | Disease 약물 목록 조회              | 13         |                                        |
| POST   | `/api/nexus/smiles/list/`                    | SMILES 유사 화합물 검색 목록        | 12         |                                        |
| PUT    | `/api/nexus/drd/simulation-condition/save/`  | DRD 시뮬레이션 조건 저장            | 13         |                                        |
| PATCH  | `/api/nexus/drd/simulation-condition/clear/` | DRD 시뮬레이션 조건 비활성화(clear) | 14         |                                        |
| GET    | `/api/nexus/drd/simulation-condition/info/`  | DRD 시뮬레이션 조건 조회            | 14         |                                        |
| POST   | `/api/nexus/drd/simulation/play/`            | DRD 시뮬레이션 머신러닝 실행 등록   | 14         | 호출 완료 시 결과 화면용 데이터를 반환 |

## 7) 추출/정규화 메모

- PDF 본문에서 줄바꿈으로 분리된 경로는 실제 URL 형태로 정규화했습니다.
  - 예: `group-manage-` + `filter/...` -> `group-manage-filter/...`
  - 예: `simulation-` + `condition/...` -> `simulation-condition/...`
- 3페이지와 4페이지의 `group-manage` 관련 항목은 중복으로 보여 1회 정의로 간주했습니다.
