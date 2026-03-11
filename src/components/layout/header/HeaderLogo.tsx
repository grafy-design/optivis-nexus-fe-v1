"use client";

import React from "react";

/** 홈 페이지 로고 — "OPTIVIS Nexus" */
export const HeaderLogo: React.FC = () => (
  <h1
    className="shrink-0"
    style={{
      fontFamily: "'Helvetica Now Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: "36px",
      fontWeight: 700,
      lineHeight: "1",
      letterSpacing: "-0.1px",
      color: "#000000",
      margin: 0,
      cursor: "pointer",
    }}
    onClick={() => (window.location.href = "/")}
  >
    OPTIVIS Nexus
  </h1>
);
