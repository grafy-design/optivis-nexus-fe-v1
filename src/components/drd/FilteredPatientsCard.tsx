/**
 * FilteredPatientsCard — DRD 왼쪽 패널 상단 남색 카드
 *
 * 필터링된 환자 비율, 프로그레스 바, Initial/Final Cohort 수치를 표시합니다.
 * animated=true이면 비율(%) 숫자가 ease-out cubic으로 카운트업 애니메이션됩니다.
 */
"use client";

import React from "react";

export interface FilteredPatientsCardProps {
  /** 필터링 비율(%) */
  filteredRatio: number;
  /** Initial Cohort 수 */
  initialCohort: number;
  /** Final Cohort 수 */
  finalCohort: number;
  /** 카운트업 애니메이션 적용 여부 (default-setting 전용) */
  animated?: boolean;
  /** "Add data" 버튼 클릭 핸들러 */
  onAddDataClick?: () => void;
}

export function FilteredPatientsCard({
  filteredRatio,
  initialCohort,
  finalCohort,
  animated = false,
  onAddDataClick,
}: FilteredPatientsCardProps) {
  // 애니메이션 모드: 비율을 ease-out cubic으로 카운트업
  const [animatedRatio, setAnimatedRatio] = React.useState(0);
  React.useEffect(() => {
    if (!animated) return;
    const target = filteredRatio;
    const duration = 1000;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedRatio(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [filteredRatio, animated]);

  const displayRatio = animated ? animatedRatio : filteredRatio;

  return (
    <div className="shrink-0 h-[250px] relative rounded-[24px] overflow-hidden flex flex-col p-[16px] shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)]">
      {/* Navy 그라디언트 배경 */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(90deg, #262255 0%, #262255 100%)" }}
      />
      <div className="absolute inset-0 bg-[rgba(38,38,38,0.25)] mix-blend-color-dodge z-[1]" />

      {/* 카드 내용 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* 상단: filtered patients + Add data */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-[4px]">
            <span className="text-caption text-white">filtered patients</span>
            <span className="text-h3 text-white">{displayRatio}%</span>
          </div>
          {onAddDataClick && (
            <button
              onClick={onAddDataClick}
              className="flex items-center gap-[4px] h-[30px] px-[14px] py-[8px] rounded-[36px] border-none cursor-pointer relative bg-transparent overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#f06600] mix-blend-plus-lighter" />
              <span className="relative z-10 text-body4 text-white mix-blend-screen">
                Add data
              </span>
              <span className="relative z-10 text-[16px] text-white font-bold mix-blend-screen">+</span>
            </button>
          )}
        </div>

        {/* 프로그레스 바 */}
        <div style={{ marginTop: "24px" }}>
          <div className="relative h-[18px] w-full rounded-[12px]" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div
              className="absolute left-0 top-0 h-full bg-[#f06600] rounded-[12px] overflow-hidden"
              style={{ width: `${displayRatio}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-[11.13px]">
              <span
                className="text-caption text-white text-right"
                style={{ textShadow: "0 0 6px rgba(0,0,0,0.4)" }}
              >
                {finalCohort.toLocaleString()}/{initialCohort.toLocaleString()} patients
              </span>
            </div>
          </div>
        </div>

        {/* OPMD 섹션 */}
        <div className="mt-auto flex flex-col gap-[2px]">
          <div className="text-body4 text-white">OPMD</div>
          <div className="flex gap-[11px]">
            <div className="flex gap-[3px] items-center">
              <span className="text-small1 text-white">Initial Cohort</span>
              <span className="text-body4 text-white w-[86px]">{initialCohort.toLocaleString()}</span>
            </div>
            <div className="flex gap-[3px] items-center">
              <span className="text-small1 text-white">Final Cohort</span>
              <span className="text-body4 text-white w-[86px]">{finalCohort.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
