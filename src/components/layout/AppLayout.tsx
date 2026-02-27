"use client";

import React from "react";
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
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Sidebar />
      <div
        className="flex h-screen min-w-0 flex-col overflow-hidden"
        style={{ width: "calc(100% - 96px)", marginLeft: "96px" }}
      >
        {headerType === "ats" ? <ATSHeader /> : headerType === "tsi" ? <TSIHeader /> : <Header />}
        <div className="min-w-0 flex-1 overflow-auto">
          <MainContainer>{children}</MainContainer>
        </div>
      </div>
    </div>
  );
};
