"use client";
import React from "react";
import Link from "next/link";
import IconButton from "@/components/ui/icon-button";

export const Sidebar = () => {
  return (
    <div className="fixed top-0 bottom-0 left-0 z-[100] p-6">
      <div className="flex h-full w-12 flex-col items-start">
        {/* Logo - Top (Home 링크) */}
        <Link
          href="/"
          className="block h-12 w-12 flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
          aria-label="Home"
        >
          <img src="/assets/icons/logo.svg" alt="Logo" className="h-full w-full object-contain" />
        </Link>

        {/* Navigation Items - Middle */}
        <div className="mt-[148px] flex flex-shrink-0 flex-col items-start gap-2.5">
          <IconButton icon="/assets/icons/folder.png" alt="Home" size="md" variant="rounded" />
          <IconButton icon="/assets/icons/search.png" alt="Search" size="md" variant="rounded" />
          <IconButton icon="/assets/icons/plus.png" alt="Add" size="md" variant="rounded" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Items - Bottom */}
        <div className="flex w-12 flex-shrink-0 flex-col items-start gap-2.5">
          <IconButton icon="/assets/icons/setting.png" alt="Settings" size="md" variant="special" />
          <IconButton icon="/assets/icons/admin.png" alt="Avatar" size="md" variant="special" />
        </div>
      </div>
    </div>
  );
};
