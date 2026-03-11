"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useAreaScale } from "@/hooks/useAreaScale";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ATSHeader } from "./ATSHeader";
import { TSIHeader } from "./TSIHeader";
import { DrdHeader } from "./DrdHeader";
import { MainContainer } from "./MainContainer";

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
  scaleMode = "none",
}) => {
  const shouldUseScaledLayout = scaleMode !== "none";
  const [isLayoutReady, setIsLayoutReady] = useState(() => {
    if (typeof window === "undefined") {
      return !shouldUseScaledLayout;
    }

    return (
      !shouldUseScaledLayout || window.__NEXUS_LAYOUT_READY__ === true
    );
  });
  const { scale } = useAreaScale(scaleMode);

  useEffect(() => {
    if (!shouldUseScaledLayout) {
      return;
    }

    if (window.__NEXUS_LAYOUT_READY__ !== true) {
      window.__NEXUS_LAYOUT_READY__ = true;
    }

    if (!isLayoutReady) {
      setIsLayoutReady(true);
    }
  }, [isLayoutReady, shouldUseScaledLayout]);

  const header = (() => {
    if (headerType === "ats") return <ATSHeader />;
    if (headerType === "tsi") {
      return (
        <Suspense fallback={<div className="h-[90px] w-full" />}>
          <TSIHeader />
        </Suspense>
      );
    }
    if (headerType === "drd") return <DrdHeader step={drdStep} />;
    return <Header />;
  })();

  if (headerType === "tsi") {
    return (
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          backgroundColor: "#E7E5E7",
          overflow: "hidden",
        }}
      >
        <Sidebar />
        <div
          style={{
            marginLeft: 96,
            width: "calc(100vw - 96px)",
            height: "100vh",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ flexShrink: 0 }}>{header}</div>
          <div
            className="tsi-page"
            style={{
              flex: 1,
              overflow: "hidden",
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MainContainer noPadding>{children}</MainContainer>
          </div>
        </div>
      </div>
    );
  }

  if (shouldUseScaledLayout && !isLayoutReady) {
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

  const appliedScale = shouldUseScaledLayout ? scale : 1;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#E7E5E7",
        overflow: "hidden",
      }}
    >
      <Sidebar />
      <div
        style={{
          zoom: appliedScale,
          width: `calc(${100 / appliedScale}vw - ${96 / appliedScale}px)`,
          height: `${100 / appliedScale}vh`,
          marginLeft: `${96 / appliedScale}px`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {header}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MainContainer extraPaddingBottom={headerType === "drd" ? 6 : 0}>
            {children}
          </MainContainer>
        </div>
      </div>
    </div>
  );
};
