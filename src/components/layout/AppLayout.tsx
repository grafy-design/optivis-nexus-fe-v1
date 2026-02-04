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
    <div className="h-screen w-full relative">
      <Sidebar />
      <div
        className="h-screen overflow-x-auto overflow-y-auto"
        style={{
          width: "calc(100% - 68px)",
          marginLeft: "68px",
        }}
      >
        <div className="bg-[#e7e5e7] w-full min-w-0">
          <div
            className="flex flex-col min-w-0"
            style={{ minWidth: "calc(100% - 200px)" }}
          >
            {headerType === "ats" ? (
              <ATSHeader />
            ) : headerType === "tsi" ? (
              <TSIHeader />
            ) : (
              <Header />
            )}
            <MainContainer>{children}</MainContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
