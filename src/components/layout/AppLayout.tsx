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

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  headerType = "default",
}) => {
  return (
    <div className="h-screen w-full relative overflow-hidden">
      <Sidebar />
      <div className="flex flex-col h-screen overflow-hidden min-w-0" style={{ width: "calc(100% - 68px)", marginLeft: "68px" }}>
        {headerType === "ats" ? (
          <ATSHeader />
        ) : headerType === "tsi" ? (
          <TSIHeader />
        ) : (
          <Header />
        )}
        <div
          className="flex-1 overflow-auto min-w-0"
        >
          <MainContainer>{children}</MainContainer>
        </div>
      </div>
    </div>
  );
};
