"use client";

import React from "react";

/** 홈/ATS 헤더 좌측 — "OPTIVIS Nexus" 텍스트 로고 */
export const HeaderLogo: React.FC = () => (
  <h1
    className="shrink-0"
    style={{
      fontFamily:
        "'Helvetica Now Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: "36px",
      fontWeight: 700,
      lineHeight: "1",
      letterSpacing: "-0.1px",
      color: "#000000",
      margin: 0,
    }}
  >
    OPTIVIS Nexus
  </h1>
);
