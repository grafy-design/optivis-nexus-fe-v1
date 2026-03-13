"use client";

import React from "react";
import Image from "next/image";

interface GlassBtnProps {
  children: React.ReactNode;
  iconSrc?: string;
  onClick?: () => void;
  width?: number;
  disabled?: boolean;
}

/** 글래스모피즘 필(pill) 버튼 — 홈 헤더 등에서 사용 */
export const GlassBtn: React.FC<GlassBtnProps> = ({
  children,
  iconSrc,
  onClick,
  width,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="figma-header-btn-pil rounded-[32px] gap-1.5 pl-6 pr-6 py-5 [@media(max-width:1470px)]:pl-4 [@media(max-width:1470px)]:pr-4 [@media(max-width:1470px)]:py-3 [@media(max-width:1470px)]:rounded-[24px] inline-flex items-center justify-center border-none cursor-pointer shrink-0 transition-all glass-btn-responsive"
    style={{
      ...(width ? { "--glass-btn-w": `${width}px`, "--glass-btn-w-sm": `${Math.round(width * 0.75)}px` } as React.CSSProperties : {}),
      background: "transparent",
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? "default" : "pointer",
    }}
  >
    {iconSrc && (
      <span className="flex items-center shrink-0 relative" style={{ top: "-1px" }}>
        <Image src={iconSrc} alt="" width={16} height={16} className="[@media(max-width:1470px)]:w-3 [@media(max-width:1470px)]:h-3" style={{ objectFit: "contain"}} />
      </span>
    )}
    <span
      className="text-body4 [@media(max-width:1470px)]:pr-2"
      style={{ color: "#0D063C", whiteSpace: "nowrap", top: "-1px" }}
    >
      {children}
    </span>
  </button>
);
