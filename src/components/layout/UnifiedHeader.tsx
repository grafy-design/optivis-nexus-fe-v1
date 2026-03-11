"use client";

import React from "react";

interface UnifiedHeaderProps {
  left: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * 통합 헤더 셸 — 좌측(left)과 우측(right)을 조합하는 공통 컨테이너.
 * 모든 제품 헤더(default, ATS, DRD, TSI)가 이 셸을 사용한다.
 */
export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ left, right }) => {
  return (
    <header className="sticky top-0 z-[90] w-full bg-[#e7e5e7] shrink-0">
      <div className="w-full h-[90px] px-8 py-[17px] flex justify-between items-center">
        {/* 좌측 영역 (로고 또는 스텝 인디케이터) */}
        <div className="flex items-center">
          {left}
        </div>
        {/* 우측 영역 (액션 버튼) */}
        <div className="flex items-center">
          {right}
        </div>
      </div>
    </header>
  );
};
