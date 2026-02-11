"use client";

import React from "react";

interface MainContainerProps {
  children: React.ReactNode;
}

export const MainContainer: React.FC<MainContainerProps> = ({ children }) => {
  return (
    <main className="w-full flex flex-col items-center min-w-0">
      <div className="flex justify-center pb-0 w-full min-w-0">
        <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto flex flex-col pt-3 pb-3 min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
};
