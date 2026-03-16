"use client";

/** ArrowIcon — 상/하 방향 전환이 가능한 SVG 화살표 아이콘 (s/m/l/xl 크기 지원) */

import React from "react";

const SIZES = { s: 12, m: 20, l: 28, xl: 32 } as const;

interface ArrowIconProps {
  className?: string;
  direction?: "up" | "down";
  color?: string;
  size?: "s" | "m" | "l" | "xl";
}

export default function ArrowIcon({
  className = "",
  direction = "down",
  color = "var(--icon-on-button)",
  size = "m",
}: ArrowIconProps) {
  const uniqueId = React.useId().replace(/:/g, '_');
  const clipPathId = `clip0_arrow_${uniqueId}`;
  const px = SIZES[size];

  if (direction === "up") {
    return (
      <svg
        width={px}
        height={px}
        style={{ width: px, height: px }}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`ats-arrow-icon ${className}`}
      >
        <g clipPath={`url(#${clipPathId})`}>
          <path
            d="M9.5 19.6758L9.5 -0.0996094"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M17.1875 9.18945L9.50206 1.09961L1.81656 9.18945"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id={clipPathId}>
            <rect width="20" height="20" fill="white" transform="translate(0 20) rotate(-90)"/>
          </clipPath>
        </defs>
      </svg>
    );
  }

  return (
    <svg
      width={px}
      height={px}
      style={{ width: px, height: px }}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ats-arrow-icon ${className}`}
    >
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M9.5 -1.09961L9.5 18.6758"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M1.8125 10.5858L9.49794 18.6758L17.1834 10.5858"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="20" height="20" fill="white" transform="translate(0 20) rotate(-90)"/>
        </clipPath>
      </defs>
    </svg>
  );
}
