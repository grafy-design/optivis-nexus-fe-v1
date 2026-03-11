"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
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

  /*
   * FIGMA LAYOUT RULES:
   * drd / tsi: No scale, fixed sidebar (88px offset)
   * default / ats: Scaled, fixed sidebar
   */
  const skipScaling = headerType === "drd" || headerType === "tsi";

  if (skipScaling) {
    return (
      <div
        className="relative overflow-hidden gap-0"
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#E7E5E7",
        }}
      >
        <Sidebar />
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            marginLeft: 80,
            width: "calc(100vw - 80px)",
            height: "100vh",
          }}
        >
          <div className="shrink-0 w-full">
            <Header type={headerType} drdStep={drdStep} />
          </div>
          {/* 컨텐츠 */}
          <div
            className={`flex-1 overflow-hidden min-w-0 min-h-0 flex flex-col${headerType === "tsi" ? " tsi-page" : headerType === "drd" ? " drd-page" : ""} w-full pb-5`}
          >
            <MainContainer extraPaddingBottom={headerType === "drd" ? 6 : 0}>{children}</MainContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#E7E5E7",
      }}
    >
      <Sidebar />

      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          zoom: scale,
          width: `calc(${100 / scale}vw - ${60 / scale}px)`,
          height: `${100 / scale}vh`,
          marginLeft: `${80 / scale}px`,
        }}
      >
        <Header type={headerType} />
        
        {/* 컨텐츠 영역 */}
        <div
          className="flex-1 overflow-hidden min-w-0 min-h-0 flex flex-col w-full pb-5 "
        >
          <MainContainer>{children}</MainContainer>
        </div>
      </div>
    </div>
  );
};
