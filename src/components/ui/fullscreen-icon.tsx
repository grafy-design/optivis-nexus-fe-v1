"use client";

/** FullscreenIcon — 전체화면 전환용 대각선 화살표 SVG 아이콘 (m/s 크기 지원) */

import React from "react";

const SIZES = {
  m: { px: 36, rx: 8.47059, sw: 2.11765, clip: 16.9412, clip2: 16.7738, offset: 9.5293, offset2: 9.61328, d1end: [24.4016, 11.6472], d2: [25.2669, 25.4141, 25.2669, 10.737, 10.5898, 10.737], d1start: [10.5879, 25.4609] },
  s: { px: 24 },
} as const;

interface FullscreenIconProps {
  className?: string;
  color?: string;
  backgroundColor?: string;
  size?: "m" | "s";
}

export default function FullscreenIcon({
  className = "",
  color = "var(--icon-inverted)",
  backgroundColor = "var(--icon-secondary)",
  size = "m",
}: FullscreenIconProps) {
  const uniqueId = React.useId().replace(/:/g, '_');
  const clipPathId0 = `clip0_fullscreen_${uniqueId}`;
  const clipPathId1 = `clip1_fullscreen_${uniqueId}`;
  const px = size === "s" ? 24 : 36;
  const scale = px / 36;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cursor-pointer ${className}`}
    >
      <rect
        width="36"
        height="36"
        rx="8.47059"
        fill={backgroundColor}
        fillOpacity="1"
      />
      <g clipPath={`url(#${clipPathId0})`}>
        <g clipPath={`url(#${clipPathId1})`}>
          <path
            d="M10.5879 25.4609L24.4016 11.6472"
            stroke={color}
            strokeWidth="2.11765"
            strokeLinejoin="round"
          />
          <path
            d="M25.2669 25.4141L25.2669 10.737L10.5898 10.737"
            stroke={color}
            strokeWidth="2.11765"
            strokeLinejoin="round"
          />
        </g>
      </g>
      <defs>
        <clipPath id={clipPathId0}>
          <rect width="16.9412" height="16.9412" fill="white" transform="translate(9.5293 9.5293)"/>
        </clipPath>
        <clipPath id={clipPathId1}>
          <rect width="16.7738" height="16.7738" fill="white" transform="translate(9.5293 9.61328)"/>
        </clipPath>
      </defs>
    </svg>
  );
}
