"use client";

import React from "react";
import Image from "next/image";
import IconButton from "@/components/ui/icon-button";

interface ATSActionsProps {
  isReportPage: boolean;
  isApplied: boolean;
  onSavePDF: () => void;
  onMakeReport: () => void;
  onBack: () => void;
  onForward: () => void;
}

/** ATS 헤더 우측 — Save PDF / Make Report + Back/Forward + Help */
export const ATSActions: React.FC<ATSActionsProps> = ({
  isReportPage,
  isApplied,
  onSavePDF,
  onMakeReport,
  onBack,
  onForward,
}) => {
  return (
    <div className="flex items-center gap-4">
      {/* 리포트 페이지: Save as PDF / 시뮬레이션 페이지: Make Report */}
      {isReportPage && (
        <button
          onClick={onSavePDF}
          className="h-12 px-5 bg-[#aaaaad] text-white rounded-[100px] text-body3 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
        >
          <Image
            src="/assets/header/download.svg"
            alt=""
            width={22}
            height={22}
            className="object-contain brightness-0 invert"
          />
          Save as PDF
        </button>
      )}
      {!isReportPage && (
        <button
          onClick={onMakeReport}
          disabled={!isApplied}
          className={`px-5 py-2.5 rounded-[100px] text-body3 transition-opacity flex items-center gap-2 ${
            isApplied
              ? "bg-[#262255] text-white hover:opacity-90 cursor-pointer"
              : "bg-[#262255] text-white cursor-not-allowed"
          }`}
        >
          Make Report
          <Image
            src="/assets/simulation/FilePdf.png"
            alt="PDF"
            width={24}
            height={24}
            className="flex-shrink-0"
          />
        </button>
      )}

      {/* Back / Forward 네비게이션 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-12 h-12 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer rounded-full overflow-hidden"
        >
          <Image
            src="/assets/simulation/back.png"
            alt="Back"
            width={48}
            height={48}
            className="flex-shrink-0 w-full h-full object-contain"
          />
        </button>
        <button
          onClick={onForward}
          disabled={!isApplied}
          className={`w-12 h-12 flex items-center justify-center transition-opacity rounded-full overflow-hidden ${
            isApplied
              ? "hover:opacity-70 cursor-pointer"
              : "cursor-not-allowed"
          }`}
        >
          <Image
            src="/assets/simulation/front.png"
            alt="Forward"
            width={48}
            height={48}
            className="flex-shrink-0 w-full h-full object-contain"
          />
        </button>
      </div>

      <IconButton icon="/assets/header/help.png" alt="Help" />
    </div>
  );
};
