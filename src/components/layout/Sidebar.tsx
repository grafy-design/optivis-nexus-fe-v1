"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

function SidebarFrameButton({
  imageSrc,
  imageWidth,
  imageHeight,
  alt,
  href,
}: {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  href?: string;
}) {
  const content = (
    <span
      className="relative block"
      style={{
        width: 48,
        height: 48,
        overflow: "visible",
      }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          maxWidth: "none",
          maxHeight: "none",
        }}
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex"
        style={{ width: 48, height: 48, textDecoration: "none" }}
        aria-label={alt}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={alt}
      className="inline-flex border-none cursor-pointer"
      style={{
        width: 48,
        height: 48,
        background: "transparent",
        padding: 0,
      }}
    >
      {content}
    </button>
  );
}

function LogoBtn() {
  return (
    <SidebarFrameButton
      href="/"
      imageSrc="/assets/header/Logo.svg"
      imageWidth={52}
      imageHeight={52}
      alt="OPTIVIS"
    />
  );
}

export const Sidebar = () => {
  return (
    /*
     * Figma: Sidebar 96×1314px
     * position fixed, left=0, top=0
     * padding: 24px 사방
     * gap between groups: 148px (flex spacer로 처리)
     * 배경: 없음 (body bg 노출)
     */
    <div
      className="fixed flex flex-col items-center gap-0 p-6 pr-2 w-wrap h-full"
    >
      {/* 로고 (상단) */}
      <LogoBtn />

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex flex-col gap-3">
        <SidebarFrameButton
          imageSrc="/assets/figma/home/sidebar-folder-button.png"
          imageWidth={68}
          imageHeight={68}
          alt="Folder"
        />
        <SidebarFrameButton
          imageSrc="/assets/figma/home/sidebar-search-button.png"
          imageWidth={68}
          imageHeight={68}
          alt="Search"
        />
        <SidebarFrameButton
          imageSrc="/assets/figma/home/sidebar-plus-button.png"
          imageWidth={68}
          imageHeight={68}
          alt="Add"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex flex-col gap-3">
        <SidebarFrameButton
          imageSrc="/assets/figma/home/sidebar-settings-button.png"
          imageWidth={52}
          imageHeight={52}
          alt="Settings"
        />
        <SidebarFrameButton
          imageSrc="/assets/figma/home/sidebar-avatar-button.png"
          imageWidth={68}
          imageHeight={68.5}
          alt="Avatar"
        />
      </div>
    </div>
  );
};
