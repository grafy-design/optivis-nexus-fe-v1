"use client";

import { cn } from "@/lib/cn";
import React from "react";

interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function LiquidGlass({
  children,
  className,
  ...props
}: LiquidGlassProps) {
  return (
    <div
      className={cn(
        "relative w-12 h-12 overflow-hidden",
        className
      )}
      style={{
        borderRadius: "1000px",
      }}
      {...props}
    >
      {/* Blur Layer - Shadow effect with mask */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "1000px",
          overflow: "hidden",
        }}
      >
        {/* Blur effect - opacity 0.04, blendMode HARD_LIGHT */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "1000px",
            background: "rgba(0, 0, 0, 0.04)",
            mixBlendMode: "hard-light",
          }}
        />
      </div>

      {/* Fill Layer - 여러 fill이 겹쳐진 구조 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "296px",
        }}
      >
        {/* Fill 1 - COLOR_DODGE with #333333 */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "296px",
            background: "#333333",
            mixBlendMode: "color-dodge",
          }}
        />
        {/* Fill 2 - White overlay with 0.5 opacity */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "296px",
            background: "rgba(255, 255, 255, 0.5)",
            mixBlendMode: "normal",
          }}
        />
        {/* Fill 3 - LINEAR_BURN with #f7f7f7 */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "296px",
            background: "#f7f7f7",
            mixBlendMode: "linear-burn" as React.CSSProperties["mixBlendMode"],
          }}
        />
      </div>

      {/* Glass Effect - Subtle overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "296px",
          background: "rgba(0, 0, 0, 0.004)",
          mixBlendMode: "normal",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
