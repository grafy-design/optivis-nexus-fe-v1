"use client";

import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
}

export const MainContainer: React.FC<MainContainerProps> = ({ children }) => {
  return (
    <main className="bg-[#e7e5e7] w-full flex flex-col items-center min-w-max overflow-hidden">
      <div className="w-full flex justify-center pb-0 max-w-full bg-[#e7e5e7]">
        <div className="w-[1772px] flex-shrink-0 mx-auto flex flex-col pt-3 pb-3 bg-[#e7e5e7]">
          {children}
        </div>
      </div>
    </main>
  );
};


