"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SimulationHeader } from "./SimulationHeader";
import { MainContainer } from "./MainContainer";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";


interface AppLayoutProps {
  children: React.ReactNode;
  headerType?: "default" | "simulation";
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, headerType = "default" }) => {
  return (
    <SimpleBar className="h-screen w-full" style={{ maxHeight: '100vh' }}>
      <div className="bg-[#e7e5e7] w-full min-w-[68px]">
        <Sidebar />
        <div className="flex flex-col ml-[68px] min-w-0" style={{ minWidth: 'calc(100% - 200px)' }}>
          {headerType === "simulation" ? <SimulationHeader /> : <Header />}
          <MainContainer>{children}</MainContainer>
        </div>
      </div>
    </SimpleBar>
  );
};


