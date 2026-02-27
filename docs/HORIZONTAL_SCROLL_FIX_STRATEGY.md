# 우측 스크롤 문제 해결 전략

## 문제 분석

### 원인 파악
1. **고정 너비 사용**
   - 시뮬레이션 페이지: `w-[1772px]` (16번째 라인)
   - 메인 페이지: `width: '930px'` (167번째 라인)
   - 고정 너비 요소가 viewport보다 클 때 스크롤 발생

2. **레이아웃 구조**
   - Sidebar: `w-[68px]` 고정
   - MainContainer: `ml-[68px]` 마진
   - 컨텐츠 영역이 제대로 제한되지 않음

3. **현재 CSS 설정**
   - `html`, `body`에 `overflow-x: hidden` 적용됨
   - 하지만 내부 요소가 고정 너비로 인해 여전히 스크롤 발생 가능

---

## 해결 전략

### 전략 1: 반응형 너비 적용 (권장) ⭐

#### 1.1 시뮬레이션 페이지
```typescript
// 현재: w-[1772px] 고정
// 변경: max-w-[1772px] w-full
<div className="w-full max-w-[1772px] min-w-0">
```

**장점**:
- 큰 화면에서는 최대 1772px 유지
- 작은 화면에서는 자동으로 축소
- 스크롤 없이 반응형 동작

**단점**:
- 작은 화면에서 레이아웃이 좁아질 수 있음
- 미디어 쿼리로 추가 조정 필요할 수 있음

---

#### 1.2 메인 페이지
```typescript
// 현재: width: '930px' 고정
// 변경: max-w-[930px] w-full
<div className="w-full max-w-[930px] min-w-0">
```

**장점**:
- 반응형 동작
- 기존 디자인 유지

---

### 전략 2: 컨테이너 래퍼 개선

#### 2.1 MainContainer 수정
```typescript
// 현재 AppLayout.tsx
<div className="flex flex-col ml-[68px] min-w-0" style={{ minWidth: 'calc(100% - 200px)' }}>

// 변경: overflow-x-hidden 추가
<div className="flex flex-col ml-[68px] min-w-0 overflow-x-hidden" style={{ width: 'calc(100% - 68px)' }}>
```

**장점**:
- 가로 스크롤 완전 차단
- 컨텐츠가 자동으로 줄어듦

---

### 전략 3: 미디어 쿼리 적용

#### 3.1 브레이크포인트 설정
```css
/* 작은 화면에서 컨텐츠 축소 */
@media (max-width: 1920px) {
  .simulation-container {
    max-width: calc(100vw - 100px);
  }
}

@media (max-width: 1440px) {
  .simulation-container {
    max-width: calc(100vw - 80px);
  }
}
```

---

### 전략 4: Flexbox/Grid 개선

#### 4.1 시뮬레이션 페이지 3열 레이아웃
```typescript
// 현재: 고정 너비
<div className="w-[380px] flex-shrink-0">  // Left
<div className="flex-1 min-w-0">            // Middle
<div className="w-[446px] flex-shrink-0">  // Right

// 개선: min-width 설정
<div className="w-[380px] min-w-[300px] flex-shrink-0">  // Left
<div className="flex-1 min-w-[400px]">                   // Middle
<div className="w-[446px] min-w-[350px] flex-shrink-0"> // Right
```

**장점**:
- 최소 너비 보장
- 작은 화면에서도 레이아웃 유지
- 필요시 축소 가능

---

## 권장 구현 순서

### Phase 1: 즉시 적용 (우선순위 높음)
1. ✅ `AppLayout.tsx`에 `overflow-x-hidden` 추가
2. ✅ 시뮬레이션 페이지 `w-[1772px]` → `max-w-[1772px] w-full`
3. ✅ 메인 페이지 고정 너비 → `max-w-[930px] w-full`

### Phase 2: 레이아웃 개선
4. ✅ 3열 레이아웃에 `min-width` 설정
5. ✅ `MainContainer` 너비 계산 개선

### Phase 3: 반응형 최적화
6. ✅ 미디어 쿼리 추가 (선택사항)
7. ✅ 작은 화면 대응 (선택사항)

---

## 예상 결과

### Before
- 화면 너비 < 1772px → 우측 스크롤 발생
- 고정 레이아웃으로 인한 반응형 부재

### After
- 모든 화면 크기에서 스크롤 없음
- 반응형 레이아웃으로 자동 조정
- 최대 너비 유지하면서 작은 화면 대응

---

## 주의사항

1. **최소 너비 고려**
   - 너무 작은 화면에서는 레이아웃이 깨질 수 있음
   - `min-width` 설정으로 최소 크기 보장

2. **테스트 필요**
   - 다양한 화면 크기에서 테스트
   - 1920px, 1440px, 1280px, 1024px 등

3. **디자인 일관성**
   - 반응형 적용 시 디자인 의도 유지
   - 필요시 디자이너와 협의

---

## 구현 체크리스트

- [ ] AppLayout에 overflow-x-hidden 추가
- [ ] 시뮬레이션 페이지 고정 너비 → max-width 변경
- [ ] 메인 페이지 고정 너비 → max-width 변경
- [ ] 3열 레이아웃 min-width 설정
- [ ] 다양한 화면 크기 테스트
- [ ] 스크롤 발생 여부 확인

