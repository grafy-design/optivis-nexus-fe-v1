"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  children: React.ReactNode;
  width?: string | number;
}

export default function LiquidGlassButton({
  icon,
  children,
  className,
  width,
  style,
  ...props
}: LiquidGlassButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center",
        "h-12 rounded-[999px] overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{
        width: width ?? "auto",
        padding: "6px 20px",
        gap: "8px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        ...style,
      }}
      {...props}
    >
      {/* =================================================
          1) BASE — 위아래 그라데이션 (위쪽 진함 → 아래쪽 밝음)
         ================================================= */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "0px",
          borderRadius: "999px",
          background:
            "linear-gradient(180deg, #d6d4d5 0%, #dedddd 100%)",
          zIndex: 1,
        }}
      />

      {/* =================================================
          2) RING — 흰색 테두리
         ================================================= */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "2px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.92)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
          zIndex: 2,
        }}
      />

      {/* =================================================
          3) GLASS — 위아래 그라데이션 (위쪽 진함 → 아래쪽 밝음)
         ================================================= */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "999px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)",
          zIndex: 3,
        }}
      />

      {/* CONTENT */}
      <div className="relative z-[4] flex items-center gap-2">
        {icon && (
          <Image
            src={icon}
            alt=""
            width={22}
            height={22}
            className="object-contain"
          />
        )}
        <span className="text-body3 text-[rgba(0,0,0,0.85)]">
          {children}
        </span>
      </div>
    </button>
  );
}
