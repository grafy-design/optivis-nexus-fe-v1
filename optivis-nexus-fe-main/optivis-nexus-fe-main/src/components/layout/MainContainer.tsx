"use client";

import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
  extraPaddingBottom?: number;
  noPadding?: boolean;
}

export const MainContainer: React.FC<MainContainerProps> = ({
  children,
  extraPaddingBottom = 0,
  noPadding = false,
}) => {
  return (
    <main
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        paddingLeft: noPadding ? 0 : "5px",
        paddingRight: noPadding ? 0 : "5px",
        paddingTop: noPadding ? 0 : "5px",
        paddingBottom: noPadding ? 0 : `${5 + extraPaddingBottom}px`,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {children}
    </main>
  );
};
