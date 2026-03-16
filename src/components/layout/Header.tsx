"use client";
/** Header — 페이지 유형(default/ats/tsi/drd)에 따라 로고 또는 스텝 인디케이터를 표시하는 공통 헤더 */

import React from "react";
import { UnifiedHeader } from "./header/UnifiedHeader";
import { HeaderLogo } from "./header/HeaderLogo";
import { HeaderSteps } from "./header/HeaderSteps";
import { HeaderActions } from "./header/HeaderActions";

// ── Main Header (기존 export 시그니처 유지) ──────────────────────────────────

interface HeaderProps {
  type?: "default" | "ats" | "tsi" | "drd";
  drdStep?: 1 | 2 | 3;
}

export const Header: React.FC<HeaderProps> = ({ type = "default", drdStep = 1 }) => (
  <UnifiedHeader
    left={
      type === "default" ? (
        <HeaderLogo />
      ) : (
        <HeaderSteps type={type} drdStep={drdStep} />
      )
    }
    right={<HeaderActions type={type} drdStep={drdStep} />}
  />
);
