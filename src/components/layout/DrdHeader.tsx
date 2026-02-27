"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface DrdHeaderProps {
  step: 1 | 2 | 3;
}

/**
 * DRD 전용 헤더 컴포넌트
 * Figma 디자인을 바탕으로 1(Default Settings), 2(Simulation Settings), 3(Dash Board) 단계를 표시합니다.
 */
export const DrdHeader = ({ step }: DrdHeaderProps) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (step === 1) {
      router.push("/");
    } else if (step === 2) {
      router.push("/drd/default-setting");
    }
  };

  return (
    <header className="flex items-center justify-between px-[28px] py-[17px] h-[90px] w-full bg-[#E7E5E7] sticky top-0 z-[90] shrink-0">
      {/* ── 왼쪽: 단계별 상태 ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-[36px]">
        {/* Step 1: Default Settings */}
        <button
          onClick={() => router.push("/drd/default-setting")}
          className="flex items-center gap-[8px] bg-transparent border-none p-0 cursor-pointer"
        >
          <div className={`inline-flex items-center justify-center w-[16px] h-[16px] rounded-full ${step === 1 ? 'bg-[#262255]' : 'bg-[#929090]'}`}>
            <span className="text-white text-[10px] font-bold" style={{ lineHeight: 1 }}>1</span>
          </div>
          <span className={`text-[19.5px] font-semibold tracking-[-0.78px] ${step === 1 ? 'text-[#262255]' : 'text-[#787776]'}`}>
            Default Settings
          </span>
        </button>

        {/* Arrow / Indicator */}
        <div className="flex items-center justify-center w-[16px] h-[16px] rounded-full bg-[#B2B1B1] shadow-[0px_1px_2px_rgba(0,0,0,0.1)]">
          <svg width="5" height="8" viewBox="0 0 8 12" fill="none">
            <path d="M2 2L6 6L2 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Step 2: Simulation Settings */}
        <button
          onClick={() => router.push("/drd/simulation-setting")}
          className="flex items-center gap-[8px] bg-transparent border-none p-0 cursor-pointer"
        >
          <div className={`inline-flex items-center justify-center w-[16px] h-[16px] rounded-full ${step === 2 ? 'bg-[#262255]' : 'bg-[#929090]'}`}>
            <span className="text-white text-[10px] font-bold" style={{ lineHeight: 1 }}>2</span>
          </div>
          <span className={`text-[19.5px] font-semibold tracking-[-0.78px] ${step === 2 ? 'text-[#262255]' : 'text-[#787776]'}`}>
            Simulation Settings
          </span>
        </button>

        {/* Arrow / Indicator */}
        <div className="flex items-center justify-center w-[16px] h-[16px] rounded-full bg-[#B2B1B1] shadow-[0px_1px_2px_rgba(0,0,0,0.1)]">
          <svg width="5" height="8" viewBox="0 0 8 12" fill="none">
            <path d="M2 2L6 6L2 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Step 3: Dash Board */}
        <button
          onClick={() => router.push("/drd/simulation-result")}
          className="flex items-center gap-[8px] bg-transparent border-none p-0 cursor-pointer"
        >
          <div className={`inline-flex items-center justify-center w-[16px] h-[16px] rounded-full ${step === 3 ? 'bg-[#262255]' : 'bg-[#929090]'}`}>
            <span className="text-white text-[10px] font-bold" style={{ lineHeight: 1 }}>3</span>
          </div>
          <span className={`text-[19.5px] font-semibold tracking-[-0.78px] ${step === 3 ? 'text-[#262255]' : 'text-[#787776]'}`}>
            Dash Board
          </span>
        </button>
      </div>

      {/* ── 오른쪽: 버튼 그룹 (Variant 3: Go Back + Help) — step 3에서 숨김 ── */}
      {step !== 3 && (
        <div className="flex items-center gap-0">
          {/* Go Back 버튼 */}
          <button
            onClick={handleGoBack}
            title="Go Back"
            className="relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0"
            style={{ backgroundImage: "url('/assets/sidebar-folder-button.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#262255" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Help 버튼 */}
          <button
            title="Help"
            className="relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0"
            style={{ backgroundImage: "url('/assets/sidebar-folder-button.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
          >
            <span className="relative z-10 text-[#262255] font-bold text-[22px] leading-none">?</span>
          </button>
        </div>
      )}
    </header>
  );
};
