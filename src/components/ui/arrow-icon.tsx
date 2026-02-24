"use client";

import React from "react";

interface ArrowIconProps {
  className?: string;
  direction?: "up" | "down";
  color?: string;
}

export default function ArrowIcon({ 
  className = "", 
  direction = "down",
  color = "#231F52" 
}: ArrowIconProps) {
  const uniqueId = React.useId().replace(/:/g, '_');
  const clipPathId = `clip0_arrow_${uniqueId}`;

  if (direction === "up") {
    return (
      <svg 
        width="19" 
        height="20" 
        viewBox="0 0 19 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
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
            <rect width="20" height="19" fill="white" transform="translate(0 20) rotate(-90)"/>
          </clipPath>
        </defs>
      </svg>
    );
  }

  return (
    <svg 
      width="19" 
      height="20" 
      viewBox="0 0 19 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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
          <rect width="20" height="19" fill="white" transform="translate(0 20) rotate(-90)"/>
        </clipPath>
      </defs>
    </svg>
  );
}






