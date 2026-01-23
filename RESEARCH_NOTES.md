# 연구 노트 - Main 화면 개발


## 작업 개요
Main 화면(홈페이지)의 레이아웃, 스타일링, 및 사용자 인터랙션 기능 개발

---

## 주요 작업 내용

### 1. 우측 상세 패널 배경 이미지 최종화
- **목적**: 우측 상세 패널의 배경 이미지 결정 및 크기 최적화
- **변경 사항**:
  - `test.png` → `detail.png`로 최종 배경 이미지 변경
  - 배경 이미지 크기: `920px × 936px` (고정)
  - `backgroundSize`, `width`, `height` 명시적 설정
- **파일**: `src/app/page.tsx` (159-169줄)

### 2. Header 레이아웃 조정
- **목적**: Header 내 "OPTIVIS Nexus" 텍스트 좌측 정렬 및 패딩 최적화
- **변경 사항**:
  - Header 패딩: `px-[122px]` → `px-8`로 변경
  - 텍스트 좌측 정렬 적용
- **파일**: `src/components/layout/Header.tsx`

### 3. 반응형 스크롤 기능 구현
- **목적**: 화면 확대 시 콘텐츠가 잘리지 않도록 좌우 스크롤 제공
- **변경 사항**:
  - `AppLayout` 최상위 div에 `overflow-x-auto` 추가
  - 메인 콘텐츠 영역에 `min-w-max` 적용하여 콘텐츠 너비 유지
- **파일**: `src/components/layout/AppLayout.tsx`

### 4. 스크롤바 디자인 통일
- **목적**: 상하 스크롤바와 좌우 스크롤바 디자인 일관성 유지
- **변경 사항**:
  - `*` 선택자로 모든 스크롤 가능 요소에 스크롤바 스타일 적용
  - 스크롤바 스타일:
    - 너비/높이: `12px`
    - 트랙 배경: `#e7e5e7`
    - 썸 배경: `#c0c0c0` (border-radius: 6px)
    - 호버: `#a0a0a0`
  - Firefox 지원: `scrollbar-width`, `scrollbar-color` 추가
- **파일**: `src/app/globals.css` (137-153줄)

### 5. 사이드바와 스크롤바 레이아웃 충돌 해결
- **문제**: 사이드바가 `fixed`로 고정되어 있어 스크롤바가 사이드바 뒤로 가려지는 현상
- **해결 방법**:
  - `AppLayout` 최상위 div에서 스크롤 처리 (`overflow-x-auto overflow-y-auto`)
  - 사이드바에 `pointer-events-none` 적용 (스크롤바와의 상호작용 방지)
  - 사이드바 내부 요소는 `pointer-events-auto`로 클릭 가능 유지
- **파일**: 
  - `src/components/layout/AppLayout.tsx`
  - `src/components/layout/Sidebar.tsx`

---

## 기술적 구현 세부사항

### 레이아웃 구조
```
AppLayout (overflow-x-auto, overflow-y-auto)
├── Sidebar (fixed, z-100, pointer-events-none)
└── Main Content Area (ml-[68px])
    ├── Header
    └── MainContainer
        └── Page Content
            ├── Package Section (400px)
            ├── Service Section (400px)
            └── Detail Panel (920px × 936px, detail.png 배경)
```

### 주요 스타일링 결정사항
1. **MainContainer**: 최대 너비 `1772px`, 양옆 패딩 `16px` (`px-4`)
2. **Grid 레이아웃**: `grid-cols-[400px_400px_1fr]`, gap `16px`
3. **우측 패널**: 고정 크기 `920px × 936px`, `detail.png` 배경

### 스크롤 동작
- 수평 스크롤: 화면 너비가 콘텐츠보다 작을 때 자동 활성화
- 수직 스크롤: 콘텐츠 높이가 뷰포트를 초과할 때 자동 활성화
- 스크롤바 위치: 브라우저 오른쪽 끝 (사이드바와 독립적)

---

## 해결된 문제들

1. ✅ 우측 패널 배경 이미지 최종 결정 (`detail.png`)
2. ✅ Header 패딩 및 정렬 최적화
3. ✅ 화면 확대 시 콘텐츠 잘림 방지 (좌우 스크롤)
4. ✅ 스크롤바 디자인 일관성 확보
5. ✅ 사이드바와 스크롤바의 레이아웃 충돌 해결

---

## 향후 개선 사항

- [ ] 다양한 화면 크기에서의 레이아웃 테스트
- [ ] 모바일 반응형 대응 (현재 데스크톱 중심)
- [ ] 스크롤 성능 최적화 (필요시)

---

## 참고 파일
- `src/app/page.tsx` - Main 페이지 컴포넌트
- `src/components/layout/AppLayout.tsx` - 전체 레이아웃 구조
- `src/components/layout/Sidebar.tsx` - 사이드바 컴포넌트
- `src/components/layout/Header.tsx` - 헤더 컴포넌트
- `src/components/layout/MainContainer.tsx` - 메인 컨테이너
- `src/app/globals.css` - 전역 스타일 (스크롤바 포함)


