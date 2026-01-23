"use client";

import React from "react";
import IconButton from "@/components/ui/icon-button";

export const SimulationHeader = () => {
  return (
    <header className="sticky top-0 z-[90] mt-0 pt-0 mb-0 w-full bg-[#e7e5e7]">
      <div className="w-full h-[76px] px-10 flex justify-between items-center">
        {/* Left - Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-body3 text-[#3c3f44]">Study Design Optimization</span>
          <span className="text-body3 text-[#929090]">/</span>
          <span className="text-body3 text-[#3c3f44]">Report</span>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-4">
          {/* Make Report Button */}
          <button className="px-5 py-2.5 bg-[#262255] text-white rounded-lg text-body3 hover:opacity-90 transition-opacity">
            Make Report
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center hover:opacity-70 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:opacity-70 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

    

          {/* Help Button */}
          <IconButton
            icon="/assets/header/help.png"
            alt="Help"
          />
        </div>
      </div>
    </header>
  );
};

