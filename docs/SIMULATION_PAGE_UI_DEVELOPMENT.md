# 시뮬레이션 페이지 UI 개발 - 연구노트

## 작업 개요
시뮬레이션 페이지의 왼쪽 파라미터 설정 카드 UI 개발 및 동적 게이지 컴포넌트 완성

## 주요 작업 내용

### 1. 왼쪽 파라미터 설정 카드 UI 개발

#### 1.1 타이포그래피 시스템 구축
- `globals.css`의 타이포그래피 클래스 활용
- 모든 텍스트 요소에 적절한 타이포그래피 클래스 적용:
  - `text-body2`: Simulation Setting 헤더
  - `text-body4`: 섹션 제목 (Disease, Treatment Duration, Trial Design, Active Data)
  - `text-body5`: 필드 레이블 및 Select box 텍스트
  - `text-body3m`: Norminal Power (Expected Effect Size와 동일한 스타일)

#### 1.2 필수 필드 표시 개선
- 별표(*) 기호를 텍스트와 분리하여 독립적인 요소로 배치
- 모든 별표 색상을 `#3609a1`로 통일
- 텍스트와 별표 사이 gap 제거

#### 1.3 섹션 구조 개선
- **Endpoints Design**: 텍스트와 + 버튼을 흰 카드 밖으로 이동
- **Trial Design**: 텍스트를 흰 카드 밖으로 이동, + 버튼 제거
- **Disease**: 텍스트와 Select box를 한 줄로 배치
- **Treatment Duration**: 텍스트와 Select box를 한 줄로 배치
- **Active Data**: 아이콘 추가 및 텍스트와 Select box를 한 줄로 배치

#### 1.4 InfoIcon 컴포넌트
- Hypothesis Type에만 InfoIcon 표시
- 새로운 SVG 디자인 적용 (원형 테두리 포함)
- 색상: `#484646`

#### 1.5 Active Data 아이콘
- 데이터베이스 아이콘 SVG 추가
- 아이콘과 텍스트를 함께 배치

### 2. Select Box 컴포넌트 개발

#### 2.1 기본 디자인
- 기본 사이즈: 154x26px
- 배경색: `#ebebf0`
- 텍스트: `text-body5` (SF Pro Semibold 12px)
- 텍스트 색상: `#787776`
- Border-radius: 8px

#### 2.2 화살표 아이콘
- 새로운 SVG 디자인 적용
- `mix-blend-mode: plus-darker` 스타일
- 색상: `#787776`

#### 2.3 드롭다운 메뉴 디자인
- 배경색: `#ebebf0`
- 보더: `#c6c5c9`
- 옵션 높이: 24px
- 구분선: `#c6c5c9`, 좌우 여백(`mx-3`) 적용
- 구분선 렌더링 안정화를 위한 `transform: scaleY(1)` 적용

#### 2.4 Hover 상태 디자인
- 각 옵션마다 둥근 div (`rounded-[8px]`) 추가
- Hover 시:
  - 배경색: `#3A11D8`
  - 텍스트 색상: 흰색
  - 패딩: `2px 4px`
- 기본 상태:
  - 패딩: `0 12px` (외부 컨테이너 `px-3 py-[2px]`)
- 텍스트 수직 중앙 정렬

#### 2.5 선택된 옵션 스타일
- 선택된 옵션에 대한 특별한 스타일 제거 (기본 스타일 유지)
- 모든 옵션이 동일한 정렬 유지

### 3. Slider 컴포넌트 활용

#### 3.1 Expected Effect Size 슬라이더
- Primary/Secondary Endpoint에 각각 적용
- Min/Max 표시
- 값 표시 박스 (`#ebebf0` 배경)

#### 3.2 Norminal Power 슬라이더
- 타이포그래피: `text-body5` (Expected Effect Size와 동일)
- 색상: `#3609a1`

### 4. Sample Size Control 슬라이더

#### 4.1 동작 기능 추가
- State 관리: `sampleSizeControl` (초기값: 0.51)
- 마우스 드래그로 슬라이더 이동 가능
- 실시간 값 업데이트
- 커서 스타일: `cursor-grab` / `active:cursor-grabbing`

#### 4.2 디자인
- 배경 트랙: `#787878` (opacity: 0.2)
- Fill 영역: `#f26702`
- 노브: 흰색 원형 (38x24px)

### 5. Apply 버튼

#### 5.1 디자인
- 크기: 90x30px
- 배경색: `#3A11D8`
- 텍스트 색상: `#e3dfff`
- Border-radius: 100px (rounded-full)
- 타이포그래피: `text-body4`
- 화살표 아이콘 SVG 추가

### 6. 동적 게이지 컴포넌트

#### 6.1 Gauge 컴포넌트
- 진행률 표시
- 값 텍스트 표시
- 인디케이터 표시 옵션

## 기술 스택

- **React/Next.js**: 컴포넌트 구조
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **SimpleBar**: 스크롤바 커스터마이징

## 주요 색상 팔레트

- Primary Purple: `#3A11D8`, `#3609a1`, `#231f52`, `#262255`
- Neutral Gray: `#ebebf0`, `#787776`, `#c6c5c9`, `#5f5e5e`, `#111111`
- Orange: `#f26702`
- White: `#ffffff`, `#e3dfff`

## 완성된 컴포넌트 목록

1. ✅ Select Box 컴포넌트 (드롭다운 메뉴 포함)
2. ✅ Slider 컴포넌트
3. ✅ InfoIcon 컴포넌트
4. ✅ Sample Size Control 슬라이더
5. ✅ Apply 버튼
6. ✅ Gauge 컴포넌트

## 향후 개선 사항

- [ ] Select box 드롭다운 애니메이션 추가
- [ ] 슬라이더 값 입력 필드 추가
- [ ] 폼 validation 로직 추가
- [ ] 반응형 디자인 최적화

