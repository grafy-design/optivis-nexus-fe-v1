"use client";

import React from "react";

interface DrdActionsProps {
  step: 1 | 2 | 3;
  onGoBack: () => void;
}

/** DRD 헤더 우측 — GoBack + Help (step 3에서는 숨김) */
export const DrdActions: React.FC<DrdActionsProps> = ({ step, onGoBack }) => {
  // step 3 (Dashboard) 에서는 우측 버튼 없음
  if (step === 3) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Go Back 버튼 */}
      <button
        onClick={onGoBack}
        title="Go Back"
        className="figma-header-btn-cir relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--icon-on-button)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Help 버튼 */}
      <button
        title="Help"
        className="figma-header-btn-cir relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0"
      >
        <span className="relative z-10 text-icon-on-button font-bold text-[22px] leading-none">?</span>
      </button>
    </div>
  );
};
