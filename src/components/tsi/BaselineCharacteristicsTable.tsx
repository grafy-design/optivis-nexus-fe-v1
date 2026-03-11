"use client";

import { useState, useEffect } from "react";

// ── 타입 정의 ──────────────────────────────────────────────────────────────
export interface BaselineItem {
  label: string;
  fullCohort: { n: number; pct: number };
  filteredCohort: { n: number; pct: number };
}

export interface BaselineCategory {
  category: string;
  items: BaselineItem[];
}

interface BaselineCharacteristicsTableProps {
  data: BaselineCategory[];
  isLoading: boolean;
  error: string | null;
}

// ── 숫자 카운트업 애니메이션 컴포넌트 ─────────────────────────────────────
export function AnimatedNumber({
  value,
  format,
  duration = 700,
}: {
  value: number;
  format: (v: number) => string;
  duration?: number;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(value * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(current)}</>;
}

// ── 테이블 컴포넌트 ────────────────────────────────────────────────────────
export function BaselineCharacteristicsTable({
  data,
  isLoading,
  error,
}: BaselineCharacteristicsTableProps) {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-2">

      {/* ── 테이블 헤더 행 ───────────────────────────────────────────── */}
      <div className="rounded-[12px] w-full flex items-center pt-[8px] pb-1.5 bg-[var(--table-header-background)]">
        <div className="grid grid-cols-4 gap-0 px-[12px] w-full" style={{ alignItems: "center" }}>
          {/* 컬럼 1: Baseline Characteristics 레이블 */}
          <div className="text-body3m text-neutral-99">Baseline Characteristics</div>

          {/* 컬럼 2: 빈 공간 */}
          <div />

          {/* 컬럼 3: Full Cohort 헤더 */}
          <div className="grid grid-cols-[1fr_1fr_1fr]">
            <div className="col-span-2 flex flex-col items-end">
              <div className="text-right text-body3m text-neutral-99 flex-shrink-0">Full Cohort</div>
              <div className="text-right text-small1 text-neutral-80 flex-shrink-0 -mt-0.25">
                N (%) or mean ± sd (min, max)
              </div>
            </div>
            <div />
          </div>

          {/* 컬럼 4: Filtered Cohort 헤더 */}
          <div className="grid grid-cols-[1fr_1fr_1fr]">
            <div className="col-span-2 flex flex-col items-end">
              <div className="text-right text-body3m text-neutral-99 flex-shrink-0">Filtered Cohort</div>
              <div className="text-right text-small1 text-neutral-80 flex-shrink-0 -mt-0.25">
                N (%) or mean ± sd (min, max)
              </div>
            </div>
            <div />
          </div>
        </div>
      </div>

      {/* ── 테이블 바디 ─────────────────────────────────────────────── */}
      <div className="relative flex flex-col overflow-y-auto flex-1 min-h-0">
        <div className="overflow-y-auto flex flex-col gap-2">
          {isLoading ? (
            <div className="mt-2 flex h-full items-center justify-center">
              <div className="text-body3 text-neutral-50">Loading...</div>
            </div>
          ) : error ? (
            <div className="mt-2 flex h-full items-center justify-center">
              <div className="text-body3 text-red-500">Error: {error}</div>
            </div>
          ) : data.length === 0 ? (
            <div className="mt-2 flex h-full items-center justify-center">
              <div className="text-body3 text-neutral-50">No data available</div>
            </div>
          ) : (
            data.map((category, categoryIndex) => (
              /* ── 카테고리 카드 ── */
              <div key={categoryIndex} className="rounded-[12px] bg-white">
                <div className="flex flex-col pt-[12px] px-[12px] pb-[8px]">

                  {/* 카테고리 헤더 행 */}
                  <div className="border-neutral-80 grid grid-cols-4 h-full items-end border-b gap-0 pb-1">
                    <div className="flex h-full items-end">
                      <div className="text-body2 text-neutral-30 items-end">{category.category}</div>
                    </div>
                    <div />
                    <div className="grid grid-cols-[1fr_1fr_1fr] items-end h-full">
                      <div className="text-body5m text-right text-neutral-50 items-end">Patients</div>
                      <div className="text-body5m text-right text-neutral-50 items-end">%</div>
                      <div />
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1fr] items-end h-full">
                      <div className="text-body5 text-right text-primary-50 items-end">Patients</div>
                      <div className="text-body5 text-right text-primary-50 items-end">%</div>
                    </div>
                  </div>

                  {/* 카테고리 아이템 행들 */}
                  {category.items.map((item, itemIndex) => {
                    const isLast = itemIndex === category.items.length - 1;
                    return (
                      <div
                        key={itemIndex}
                        className={`grid grid-cols-4 h-full pt-2 pb-1 items-center gap-0 ${
                          !isLast ? "border-neutral-80 border-b" : ""
                        }`}
                      >
                        {/* 아이템 레이블 */}
                        <div className="flex h-full items-center">
                          <div className="text-body4m text-neutral-50">{item.label}</div>
                        </div>
                        <div />

                        {/* Full Cohort 값 */}
                        <div className="grid grid-cols-[1fr_1fr_1fr] items-center h-full">
                          <div className="text-body4m text-right tabular-nums text-neutral-50">
                            <AnimatedNumber value={item.fullCohort.n} format={(v) => Math.round(v).toLocaleString()} />
                          </div>
                          <div className="text-body4m text-right tabular-nums text-neutral-50">
                            <AnimatedNumber value={item.fullCohort.pct} format={(v) => `${v.toFixed(1)}%`} />
                          </div>
                        </div>

                        {/* Filtered Cohort 값 */}
                        <div className="grid grid-cols-[1fr_1fr_1fr] items-center h-full">
                          <div className="text-body4 text-right tabular-nums text-primary-50">
                            <AnimatedNumber value={item.filteredCohort.n} format={(v) => Math.round(v).toLocaleString()} />
                          </div>
                          <div className="text-body4 text-right tabular-nums text-primary-50">
                            <AnimatedNumber value={item.filteredCohort.pct} format={(v) => `${v.toFixed(1)}%`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
