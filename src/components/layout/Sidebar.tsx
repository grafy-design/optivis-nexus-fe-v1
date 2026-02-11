"use client";
import React from "react";
import Link from "next/link";
import IconButton from "@/components/ui/icon-button";

export const Sidebar = () => {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-[68px] px-5 pt-4 z-[100] pb-4">
      <div className="flex flex-col items-start h-full w-12">
        {/* Logo - Top (Home 링크) */}
        <Link
          href="/"
          className="w-12 h-12 flex-shrink-0 block cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Home"
        >
          <img
            src="/assets/icons/logo.svg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation Items - Middle */}
        <div className="flex flex-col gap-2.5 items-start w-12 flex-shrink-0">
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Items - Bottom */}
        <div className="flex flex-col gap-2.5 items-start w-12 flex-shrink-0">
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
