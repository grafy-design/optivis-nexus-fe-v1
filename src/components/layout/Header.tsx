"use client";

import React from "react";
import Image from "next/image";
import IconButton from "@/components/ui/icon-button";
import Button from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-[90] mt-0 mb-0 w-full bg-[#ededee] pt-0">
      <div className="flex w-full min-w-0 justify-center">
        <div className="mx-auto flex h-[84px] w-[1772px] max-w-full flex-shrink-0 items-center justify-between pr-10 pl-[14px]">
          <h1 className="text-logo text-black">OPTIVIS Nexus</h1>

          {/* Right - Actions */}
          <div className="flex items-center gap-[60px]">
            {/* Buttons */}
            <div className="flex items-center gap-[12px]">
              {/* Data template button */}
              <Button
                unstyled
                className="relative inline-flex h-[48px] w-[182px] cursor-pointer items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
              >
                <Image
                  src="/button.png"
                  alt=""
                  width={182}
                  height={48}
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 px-5 py-[6px]">
                  <Image
                    src="/assets/header/download.svg"
                    alt=""
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                  <span className="text-body3 text-[rgba(0,0,0,0.85)]">Data template</span>
                </div>
              </Button>

              {/* Data setting button */}
              <Button
                unstyled
                className="relative inline-flex h-[48px] w-[182px] cursor-pointer items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
              >
                <Image
                  src="/button.png"
                  alt=""
                  width={182}
                  height={48}
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 px-5 py-[6px]">
                  <Image
                    src="/assets/header/setting.svg"
                    alt=""
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                  <span className="text-body3 text-[rgba(0,0,0,0.85)]">Data setting</span>
                </div>
              </Button>
            </div>

            {/* Help Button */}
            <IconButton icon="/assets/header/help.png" alt="Help" />
          </div>
        </div>
      </div>
    </header>
  );
};
