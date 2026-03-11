"use client";

import React from "react";
import Image from "next/image";
import SolidButton from "@/components/ui/solid-button";

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
        <SolidButton
          onClick={onSavePDF}
          variant="secondary"
          size="L"
          icon="/assets/header/download.svg"
          className="rounded-full"
        >
          Save as PDF
        </SolidButton>
      )}
      {!isReportPage && (
        <SolidButton
          onClick={onMakeReport}
          disabled={!isApplied}
          variant="purple"
          size="L"
          icon="/assets/simulation/FilePdf.png"
          className="rounded-full"
        >
          Make Report
        </SolidButton>
      )}

      {/* Back / Forward 네비게이션 */}
      <div className="flex items-center gap-4">
        <SolidButton
          onClick={onBack}
          variant="ghost"
          size="L"
          icon="/assets/simulation/back.png"
          className="w-12 h-12 p-0"
        />
        <SolidButton
          onClick={onForward}
          disabled={!isApplied}
          variant="ghost"
          size="L"
          icon="/assets/simulation/front.png"
          className="w-12 h-12 p-0"
        />
      </div>

      <SolidButton
        variant="ghost"
        size="L"
        icon="/assets/header/help.png"
        className="w-12 h-12 p-0"
      />
    </div>
  );
};
