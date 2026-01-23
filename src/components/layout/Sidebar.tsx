"use client";
import React, { use } from "react";
import IconButton from "@/components/ui/icon-button";

export const Sidebar = () => {
  return (
    <div className="fixed left-0 top-0 w-[68px] px-5 py-4  bg-[#e7e5e7] z-[100] h-screen">
      <div className="flex flex-col items-start justify-between h-full w-12">
        {/* Logo */}
        <div className="w-12 h-12">
          <img
            src="/assets/icons/logo.svg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-2.5 items-start w-12">
          <IconButton
            icon="/assets/icons/folder.png"
            alt="Home"
            size="md"
            variant="rounded"
          />
          <IconButton
            icon="/assets/icons/search.png"
            alt="Search"
            size="md"
            variant="rounded"
          />
          <IconButton
            icon="/assets/icons/plus.png"
            alt="Add"
            size="md"
            variant="rounded"
          />
        </div>

        {/* Bottom Items */}
        <div className="flex flex-col gap-2.5 items-start w-12">
          <IconButton
            icon="/assets/icons/setting.png"
            alt="Settings"
            size="md"
            variant="special"
          />
          <IconButton
            icon="/assets/icons/admin.png"
            alt="Avatar"
            size="md"
            variant="special"
          />
        </div>
      </div>
    </div>
  );
};
