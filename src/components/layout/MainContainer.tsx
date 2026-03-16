"use client";
/** MainContainer — 헤더 아래 메인 콘텐츠 영역을 감싸는 스크롤 가능한 래퍼 */

import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  extraPaddingBottom?: number;
  noPadding?: boolean;
}

export const MainContainer: React.FC<MainContainerProps> = ({ children, extraPaddingBottom = 0, noPadding = false }) => {
  return (
    /*
     * Figma: 콘텐츠 영역
     * x=110 (sidebar 96 + 14px), y=90 (header)
     * padding: 좌우 14px (sidebar가 96px 이미 처리)
     * 높이: 화면 전체 채움 (overflow auto로 스크롤)
     */
    <main className="w-full flex-1 min-h-0 flex flex-col box-border overflow-hidden px-6 -ml-1 gap-6 "
    >
      {children}
    </main>
  );
};
