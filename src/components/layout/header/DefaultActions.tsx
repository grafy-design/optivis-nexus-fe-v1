"use client";

import React from "react";
import { LiquidGlassBtn } from "./LiquidGlassBtn";

/** Help 버튼 (figma-header-btn-cir, 물음표) */
function HelpBtn() {
  return (
    <button
      type="button"
      className="figma-header-btn-cir rounded-[18px] inline-flex items-center justify-center border-none cursor-pointer shrink-0"
      aria-label="Help"
      style={{
        width: "60px",
        height: "60px",
        background: "transparent",
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseDown={(e) => (e.currentTarget.style.opacity = "0.70")}
      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <span className="relative z-10 text-icon-on-button font-bold text-[22px] leading-none">?</span>
    </button>
  );
}

/** 홈 헤더 우측 — Data template + Data setting + Help */
export const DefaultActions: React.FC = () => {
  return (
    <div className="flex items-center shrink-0 gap-2.5">
      <LiquidGlassBtn
        width={170}
        variant="template"
        iconSrc="/assets/figma/home/header-download-icon.png"
      >
        Data template
      </LiquidGlassBtn>
      <LiquidGlassBtn
        width={170}
        variant="setting"
        iconSrc="/assets/figma/home/header-setting-icon.png"
      >
        Data setting
      </LiquidGlassBtn>
      <HelpBtn />
    </div>
  );
};
