"use client";

import React from "react";
import Image from "next/image";

interface GlassBtnProps {
  children: React.ReactNode;
  iconSrc?: string;
  onClick?: () => void;
  width: number;
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
    className="figma-header-btn-pil rounded-[32px] gap-[4px] inline-flex items-center justify-center border-none cursor-pointer shrink-0"
    style={{
      width: `${width}px`,
      height: "60px",
      background: "transparent",
      transition: "opacity 0.15s ease",
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? "default" : "pointer",
    }}
  >
    {iconSrc && (
      <span className="flex items-center shrink-0 relative" style={{ top: "-2px" }}>
        <Image src={iconSrc} alt="" width={24} height={24} style={{ objectFit: "contain" }} />
      </span>
    )}
    <span
      className="text-body3m"
      style={{ color: "#0D063C", whiteSpace: "nowrap", position: "relative", top: "-2px" }}
    >
      {children}
    </span>
  </button>
);
