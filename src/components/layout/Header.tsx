"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/button";
import LiquidGlassButton from "@/components/ui/liquid-glass-button";
import IconButton from "@/components/ui/icon-button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-[90] mt-0 pt-0 mb-0 w-full bg-[#ededee]">
      <div className="w-full flex justify-center min-w-0">
        <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto h-[84px] px-10 flex justify-between items-center">
   
        <h1 className="text-logo text-black">
          OPTIVIS Nexus
        </h1>

        {/* Right - Actions */}
        <div className="flex items-center gap-[60px]">
          {/* Buttons */}
          <div className="flex items-center gap-[12px]">
            {/* Data template button */}
            <button className="relative cursor-pointer inline-flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80 w-[182px] h-[48px]">
              <Image
                src="/button.png"
                alt=""
                width={182}
                height={48}
                className="object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-1 py-[6px] px-5">
                <Image
                  src="/assets/header/download.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="object-contain"
                />
                <span className="text-body3 text-[rgba(0,0,0,0.85)]">
                  Data template
                </span>
              </div>
            </button>

            {/* Data setting button */}
            <button className="relative cursor-pointer inline-flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80 w-[182px] h-[48px]">
              <Image
                src="/button.png"
                alt=""
                width={182}
                height={48}
                className="object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-1 py-[6px] px-5">
                <Image
                  src="/assets/header/setting.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="object-contain"
                />
                <span className="text-body3 text-[rgba(0,0,0,0.85)]">
                  Data setting
                </span>
              </div>
            </button>
          </div>

          {/* Help Button */}
          <IconButton
            icon="/assets/header/help.png"
            alt="Help"
    
          />
        </div>
        </div>
      </div>
    </header>
  );
};


