"use client";

import React from "react";
import { UnifiedHeader } from "./UnifiedHeader";
import { HeaderLogo } from "./header/HeaderLogo";
import { DefaultActions } from "./header/DefaultActions";

/** 홈/기본 헤더 — UnifiedHeader + HeaderLogo + DefaultActions 조합 */
export const Header = () => (
  <UnifiedHeader
    left={<HeaderLogo />}
    right={<DefaultActions />}
  />
);
