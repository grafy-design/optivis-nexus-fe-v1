"use client";

import React from "react";

interface UnifiedHeaderProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

/** 공통 헤더 셸 — sticky 90px, 좌/우 영역 슬롯 */
export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ left, right }) => (
  <header className="sticky top-0 z-[90] w-full bg-[#e7e5e7] shrink-0">
    <div className="w-full h-[90px] pl-7 pr-8 [@media(max-width:1470px)]:pl-5 [@media(max-width:1470px)]:pr-5 py-6 flex justify-between items-center">
      <div className="flex items-center">{left}</div>
      <div className="flex items-center gap-2.5">{right}</div>
    </div>
  </header>
);
