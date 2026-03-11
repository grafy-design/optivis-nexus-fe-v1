"use client";

import React from "react";
import Image from "next/image";

interface LiquidGlassBtnProps {
  children: React.ReactNode;
  iconSrc?: string;
  onClick?: () => void;
  width: number;
  variant: "template" | "setting";
}

/**
 * Liquid Glass 버튼 — CSS only (순수 CSS 유리 효과)
 * Figma: 154px(Data template) / 140px(Data setting) x 42px, r=32
 */
export const LiquidGlassBtn: React.FC<LiquidGlassBtnProps> = ({
  children,
  iconSrc,
  onClick,
  width,
  variant,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="figma-header-btn-pil rounded-[32px] gap-[4px] inline-flex items-center justify-center border-none cursor-pointer shrink-0"
      style={{
        width: `${width}px`,
        height: "60px",
        background: "transparent",
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseDown={(e) => (e.currentTarget.style.opacity = "0.70")}
      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {iconSrc && (
        <span
          className="flex items-center shrink-0 relative"
          style={{ top: "-2px" }}
        >
          <Image
            src={iconSrc}
            alt=""
            width={40}
            height={40}
            style={{
              width: variant === "template" ? "24px" : "22px",
              height: variant === "template" ? "24px" : "22px",
              objectFit: "contain",
            }}
          />
        </span>
      )}
      <span
        style={{
          fontFamily: "Inter",
          fontSize: "16px",
          fontWeight: 500,
          lineHeight: "22px",
          letterSpacing: "-0.535px",
          color: "#0D063C",
          whiteSpace: "nowrap",
          position: "relative",
          top: "-2px",
        }}
      >
        {children}
      </span>
    </button>
  );
};
