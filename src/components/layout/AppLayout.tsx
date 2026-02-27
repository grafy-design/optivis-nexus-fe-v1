"use client";

import React, { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ATSHeader } from "./ATSHeader";
import { TSIHeader } from "./TSIHeader";
import { MainContainer } from "./MainContainer";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface AppLayoutProps {
  children: React.ReactNode;
  headerType?: "default" | "ats" | "tsi";
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, headerType = "default" }) => {
  const header = (() => {
    if (headerType === "ats") return <ATSHeader />;
    if (headerType === "tsi") {
      return (
        <Suspense fallback={<div className="h-[76px] w-full" />}>
          <TSIHeader />
        </Suspense>
      );
    }
    return <Header />;
  })();

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Sidebar />
      <div
        className="flex h-screen min-w-0 flex-col overflow-hidden"
        style={{ width: "calc(100% - 96px)", marginLeft: "96px" }}
      >
        {header}
        <div className="min-w-0 flex-1 overflow-auto">
          <MainContainer>{children}</MainContainer>
        </div>
      </div>
    </div>
  );
};
