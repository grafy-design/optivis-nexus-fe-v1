"use client";

/** InputCell — 테이블/폼 행 안에서 사용하는 인라인 텍스트 입력 셀 컴포넌트 */

import React from "react";
import { cn } from "@/lib/cn";

// ── 사이즈별 스타일 설정 / Size-specific style config ────────────────────────
const SIZE_CONFIG = {
  s: {
    height: 28,
    paddingX: 10,
    text: "text-body5m",
    radius: "rounded-[8px]",
  },
  m: {
    height: 32,
    paddingX: 12,
    text: "text-body5m",
    radius: "rounded-[8px]",
  },
  l: {
    height: 36,
    paddingX: 12,
    text: "text-body4m",
    radius: "rounded-[8px]",
  },
} as const;

type InputCellSize = keyof typeof SIZE_CONFIG;

// ── Props ────────────────────────────────────────────────────────────────────
interface InputCellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: InputCellSize;
  flex?: number | string;
  className?: string;
  disabled?: boolean;
}

/**
 * InputCell — 테이블/폼 행 안에서 사용하는 텍스트 입력 셀 컴포넌트.
 * size: "s" (28px) | "m" (32px, 기본값) | "l" (36px)
 */
export default function InputCell({
  value,
  onChange,
  placeholder = "Write input",
  size = "m",
  flex,
  className,
  disabled = false,
}: InputCellProps) {
  const s = SIZE_CONFIG[size];

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "bg-neutral-95 text-text-primary placeholder:text-neutral-80 outline-none",
        s.text,
        s.radius,
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-text",
        className,
      )}
      style={{
        flex: flex ?? undefined,
        minWidth: 0,
        height: s.height,
        paddingLeft: s.paddingX,
        paddingRight: s.paddingX,
        border: "none",
        letterSpacing: "-0.68px",
      }}
    />
  );
}
