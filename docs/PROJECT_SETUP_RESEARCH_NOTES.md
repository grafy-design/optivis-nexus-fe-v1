# OPTIVIS Nexus Frontend 프로젝트 셋팅 연구노트

## 프로젝트 개요

**프로젝트명**: OPTIVIS Nexus Frontend  
**시작일**: 2024년  
**프레임워크**: Next.js 15.5.4 (App Router)  
**목적**: 의료 데이터 시뮬레이션 및 분석 플랫폼 프론트엔드 개발

---

## 기술 스택 선택 이유

### Next.js 15.5.4 선택
- **이유**: 
  - App Router의 안정성과 성능
  - React Server Components 지원
  - 파일 기반 라우팅의 직관성
  - SEO 최적화 내장
- **고려사항**: 
  - React 19와의 호환성 확인 필요
  - Server Components vs Client Components 구분 중요

### React 19.1.0
- **이유**: 최신 기능 활용
- **주의사항**: 일부 라이브러리 호환성 확인 필요

### Tailwind CSS 4.0
- **이유**: 
  - 유틸리티 퍼스트 접근
  - JIT 컴파일로 빠른 개발
  - 커스텀 디자인 토큰 통합 용이
- **특징**: 
  - `@import "tailwindcss"` 방식 사용
  - PostCSS 통합

---

## 프로젝트 구조 설계

### 디렉토리 구조 결정 과정

#### `src/app/` - App Router
- Next.js 15의 App Router 사용
- `layout.tsx`: 루트 레이아웃 (폰트, 전역 스타일)
- `page.tsx`: 메인 페이지
- `globals.css`: 디자인 토큰 및 전역 스타일

#### `src/components/` 구조화
```
components/
├── layout/     # 레이아웃 관련 (재사용 빈도 높음)
├── home/       # 페이지별 컴포넌트
└── ui/         # 범용 UI 컴포넌트
```

**결정 이유**:
- 컴포넌트 재사용성 고려
- 페이지별 컴포넌트와 범용 컴포넌트 분리
- 유지보수성 향상

---

## 디자인 시스템 구현

### Figma 연동
- **채널**: `jekfq7pl`, `ferl8vqw`
- **디자인 토큰 추출**:
  - Typography: `0n94uiof`
  - Colors: `otmx6ybq`

### 색상 시스템
- **구조**: 0-100 단계로 세분화
- **이유**: Material Design 3 스타일 참고
- **구현**: CSS 변수로 정의 (`:root`)

```css
:root {
  --primary-100: #ffffff;
  --primary-0: #000000;
  /* ... */
}
```

### 타이포그래피 시스템
- **폰트 선택**:
  - Poppins: 제목 (영문 최적화)
  - Pretendard: 본문 (한글 최적화)
  - SF Pro: 시스템 폰트 (macOS/iOS 느낌)
- **구현**: 유틸리티 클래스로 정의
  - `.text-h0`, `.text-title`, `.text-h1` 등

---

## 주요 컴포넌트 개발 이력

### Layout 컴포넌트

#### 초기 구조 (`app-shell.tsx`)
- **문제점**: 
  - 모든 레이아웃을 하나의 컴포넌트에 집중
  - 재사용성 낮음
  - 스크롤 영역 관리 복잡

#### 개선된 구조 (`AppLayout`, `Header`, `Sidebar`, `MainContainer`)
- **변경 이유**: 
  - 컴포넌트 분리로 재사용성 향상
  - 각 레이아웃 요소의 독립적 관리
  - `trial-fe` 프로젝트 구조 참고

**구현 세부사항**:
- `AppLayout`: flex 레이아웃, 배경색#e7e5e7
- `Sidebar`: 고정 위치 (`fixed`), z-index 100
- `Header`: 고정 위치 (`sticky`), z-index 90, 중앙 정렬, 너비 1320px
- `MainContainer`: 메인 컨텐츠 영역, 중앙 정렬, 너비 1320px
- 스크롤: `body` 레벨에서 관리 (`overflow-y-auto`)
- 최소 너비 제약 제거: 반응형 레이아웃 지원

### Liquid Glass 컴포넌트

#### 개발 과정
1. **초기 구현**: 일반적인 glass morphism 효과
2. **Figma 디자인 분석**: 
   - Blur 레이어 (opacity 0.04, hard-light)
   - Fill 레이어 (3개 겹침)
     - COLOR_DODGE (#333333)
     - NORMAL (rgba(255,255,255,0.5))
     - LINEAR_BURN (#f7f7f7)
   - Glass Effect (opacity 0.004)
3. **최종 구현**: xs, Default variant만 구현

**기술적 고려사항**:
- `mix-blend-mode: linear-burn` TypeScript 타입 이슈
- 해결: `as React.CSSProperties["mixBlendMode"]` 타입 단언

---

## 트러블슈팅

### 1. Favicon 오류
**문제**: `Image import is not a valid image file`  
**원인**: `favicon.ico` 파일 손상  
**해결**: 
- 파일 삭제
- Next.js App Router의 자동 favicon 처리 활용
- `metadata.icons` 제거

### 2. Tailwind CSS 유틸리티 클래스 오류
**문제**: `Cannot apply unknown utility class 'border-border'`  
**원인**: `@theme` 블록의 변수 정의가 제대로 인식되지 않음  
**해결**: 
- CSS 변수를 `:root`에 직접 정의
- 유틸리티 클래스 대신 직접 hex 값 사용

### 3. 컴포넌트 Export/Import 오류
**문제**: `Element type is invalid: expected a string...`  
**원인**: 
- 파일이 0바이트로 생성됨
- Named export vs Default export 혼동  
**해결**: 
- 파일 재생성
- Export/Import 방식 통일 (Named export 사용)

### 4. 스크롤 영역 문제
**문제**: 
- 좌우 스크롤바 발생
- 상하 스크롤 위치 이상
- 스크롤 배경색 불일치  
**해결**: 
- `overflow-x-hidden` 추가
- `max-w-[100vw]` 설정
- 커스텀 스크롤바 스타일 적용
- `body` 레벨에서 스크롤 관리

### 5. SVG 렌더링 문제
**문제**: SVG 아이콘에 원형 배경이 추가로 나타남  
**원인**: SVG 내부 필터와 컴포넌트 스타일 충돌  
**해결**: 
- `Image` 컴포넌트 대신 `img` 태그 사용
- SVG 내부 스타일 유지

### 6. Z-index 레이어링
**문제**: Header와 Sidebar가 겹침  
**해결**: 
- Sidebar: z-index 100
- Header: z-index 90
- 명확한 레이어 순서 정의

---

## 성능 최적화

### 빌드 설정
- **standalone 모드**: 독립 실행형 배포
- **이미지 최적화**: `unoptimized: true` (정적 export 대비)
- **빌드 시 타입 체크 건너뛰기**: 빠른 배포를 위해 (개발 환경에서는 활성화 권장)

### 폰트 최적화
- **next/font**: 자동 폰트 최적화
- **display: swap**: 폰트 로딩 중 텍스트 표시
- **가변 폰트**: 필요한 가중치만 로드

---

## 개발 워크플로우

### 컴포넌트 개발 순서
1. **타이포그래피 정의** (`globals.css`)
2. **색상 정의** (`globals.css`)
3. **기본 UI 컴포넌트** (`components/ui/`)
4. **레이아웃 컴포넌트** (`components/layout/`)
5. **페이지 컴포넌트** (`components/home/`)

### Figma 연동 프로세스
1. Figma 채널 연결
2. 디자인 토큰 추출 (Typography, Colors)
3. CSS 변수 및 유틸리티 클래스 정의
4. 컴포넌트 구현
5. 디자인 검증 및 조정



---

## 참고 자료 및 학습 내용

### 공식 문서
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [Tailwind CSS 4.0](https://tailwindcss.com/docs)

### 참고 프로젝트
- `trial-fe`: 레이아웃 구조 참고

### 디자인 시스템
- Material Design 3: 색상 시스템 참고
- Figma Design System: 실제 디자인 토큰

---

## 개발 환경

### 로컬 개발
- **OS**: Windows 10/11
- **Shell**: Git Bash
- **Editor**: VS Code / Cursor
- **Node Version**: 20+

### 브라우저 지원
- Chrome (최신)
- Safari (최신)
- Firefox (최신)
- Edge (최신)

---

## 배포 환경

### 프로덕션 설정
- **포트**: 3003
- **빌드 모드**: standalone
- **환경 변수**: 추후 추가 예정

---

**작성일**: 2024년  
**최종 업데이트**: 2024년

