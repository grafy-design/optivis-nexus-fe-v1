"use client";

import React from "react";

interface TSIActionsProps {
  onBack: () => void;
}

/** 공통 backgroundImage 스타일 (TSI 글래스 버튼) */
const glassButtonStyle: React.CSSProperties = {
  backgroundImage: "url('/assets/sidebar-folder-button.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

/** TSI 헤더 우측 — Back + Help */
export const TSIActions: React.FC<TSIActionsProps> = ({ onBack }) => {
  return (
    <div className="flex items-center gap-0">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0 hover:opacity-70 transition-opacity"
        style={glassButtonStyle}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--icon-on-button)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Help 버튼 */}
      <button
        title="Help"
        className="relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0"
        style={glassButtonStyle}
      >
        <span className="relative z-10 text-icon-on-button font-bold text-[22px] leading-none">?</span>
      </button>
    </div>
  );
};
