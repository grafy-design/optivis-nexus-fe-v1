"use client";

import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  extraPaddingBottom?: number;
}

export const MainContainer: React.FC<MainContainerProps> = ({ children, extraPaddingBottom = 0 }) => {
  return (
    /*
     * Figma: 콘텐츠 영역
     * x=110 (sidebar 96 + 14px), y=90 (header)
     * padding: 좌우 14px (sidebar가 96px 이미 처리)
     * 높이: 화면 전체 채움 (overflow auto로 스크롤)
     */
    <main
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        paddingLeft: "5px",
        paddingRight: "5px",
        paddingTop: "5px",
        paddingBottom: `${5 + extraPaddingBottom}px`,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {children}
    </main>
  );
};
