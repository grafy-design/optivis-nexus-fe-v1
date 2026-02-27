"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ATSHeader } from "./ATSHeader";
import { TSIHeader } from "./TSIHeader";
import { DrdHeader } from "./DrdHeader";
import { MainContainer } from "./MainContainer";
// --- [TEMP_SCALE_START] proportional scaling import ---
import { useAreaScale } from "@/hooks/useAreaScale";
// --- [TEMP_SCALE_END] ---

declare global {
  interface Window {
    __NEXUS_LAYOUT_READY__?: boolean;
  }
}

interface AppLayoutProps {
  children: React.ReactNode;
  headerType?: "default" | "ats" | "tsi" | "drd";
  drdStep?: 1 | 2 | 3;
  scaleMode?: "width" | "height" | "fit" | "none";
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  headerType = "default",
  drdStep = 1,
  scaleMode = "width",
}) => {
  const [isLayoutReady, setIsLayoutReady] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.__NEXUS_LAYOUT_READY__ === true;
  });

  useEffect(() => {
    if (window.__NEXUS_LAYOUT_READY__ !== true) {
      window.__NEXUS_LAYOUT_READY__ = true;
    }

    if (!isLayoutReady) {
      setIsLayoutReady(true);
    }
  }, [isLayoutReady]);

  // --- [TEMP_SCALE_START] proportional scaling ---
  const { scale } = useAreaScale(scaleMode);
  // --- [TEMP_SCALE_END] ---

  if (!isLayoutReady) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#E7E5E7",
        }}
      />
    );
  }

  return (
    /*
     * Figma 전체 프레임: 2560×1314px
     * bg: rgb(231,229,231) = #E7E5E7
     * Sidebar: 96px 고정
     * 나머지: sidebar 이후 영역
     */
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#E7E5E7",
        overflow: "hidden",
      }}
    >
      {/* 사이드바: 줌(zoom)에 영향을 받지 않도록 최상위에 배치 */}
      <Sidebar />

      {/* 나머지 영역: 줌을 적용하여 비례 축소/확대 */}
      <div
        style={{
          zoom: scale,
          width: `calc(${100 / scale}vw - ${96 / scale}px)`,
          height: `${100 / scale}vh`,
          marginLeft: `${96 / scale}px`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {headerType === "ats" ? (
          <ATSHeader />
        ) : headerType === "tsi" ? (
          <TSIHeader />
        ) : headerType === "drd" ? (
          <DrdHeader step={drdStep as 1 | 2 | 3} />
        ) : (
          <Header />
        )}
        {/* 컨텐츠 영역: 헤더 아래 나머지 100% 채움 */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MainContainer extraPaddingBottom={headerType === "drd" ? 6 : 0}>{children}</MainContainer>
        </div>
      </div>
    </div>
  );
};
