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
      style={{
        position: "relative",
        display: "block",
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
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          maxWidth: "none",
          maxHeight: "none",
          pointerEvents: "none",
        }}
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{ width: 48, height: 48, display: "inline-flex", textDecoration: "none" }}
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
      style={{
        width: 48,
        height: 48,
        display: "inline-flex",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
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
      imageSrc="/assets/figma/home/sidebar-logo-button.png"
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
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 96,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
        gap: 0,
      }}
    >
      {/* 로고 (상단) */}
      <LogoBtn />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
