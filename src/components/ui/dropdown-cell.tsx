"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// 사이즈별 스타일 상수 / Size-specific style constants
const SIZE_CONFIG = {
  s: {
    triggerHeight: 28,
    triggerPaddingLeft: 8,
    triggerPaddingRight: 6,
    fontSize: 13,
    letterSpacing: "-0.52px",
    iconSize: 16,
    menuPadding: 6,
    menuMaxHeight: 180,
    optionHeight: 28,
    optionPaddingX: 4,
    optionPaddingY: 2,
  },
  sm: {
    triggerHeight: 28,
    triggerPaddingLeft: 8,
    triggerPaddingRight: 6,
    fontSize: 13,
    letterSpacing: "-0.52px",
    iconSize: 16,
    menuPadding: 6,
    menuMaxHeight: 180,
    optionHeight: 28,
    optionPaddingX: 4,
    optionPaddingY: 2,
  },
  md: {
    triggerHeight: 36,
    triggerPaddingLeft: 12,
    triggerPaddingRight: 8,
    fontSize: 15,
    letterSpacing: "-0.6px",
    iconSize: 18,
    menuPadding: 8,
    menuMaxHeight: 220,
    optionHeight: 36,
    optionPaddingX: 4,
    optionPaddingY: 2,
  },
  l: {
    triggerHeight: 36,
    triggerPaddingLeft: 12,
    triggerPaddingRight: 8,
    fontSize: 15,
    letterSpacing: "-0.6px",
    iconSize: 18,
    menuPadding: 8,
    menuMaxHeight: 220,
    optionHeight: 36,
    optionPaddingX: 4,
    optionPaddingY: 2,
  },
  lg: {
    triggerHeight: 44,
    triggerPaddingLeft: 16,
    triggerPaddingRight: 12,
    fontSize: 17,
    letterSpacing: "-0.68px",
    iconSize: 20,
    menuPadding: 10,
    menuMaxHeight: 280,
    optionHeight: 44,
    optionPaddingX: 6,
    optionPaddingY: 3,
  },
} as const;

export type DropdownCellSize = keyof typeof SIZE_CONFIG;

interface DropdownCellProps {
  value: string;
  width?: number | string;
  flex?: number | string;
  placeholder?: boolean;
  options?: string[];
  onChange?: (v: string) => void;
  size?: DropdownCellSize;
  className?: string;
}

/**
 * 포탈 기반 드롭다운 셀 — 선택된 값과 옵션 목록을 표시.
 * Portal-based dropdown cell — displays selected value and option list.
 * size: "sm" | "md" | "lg" (기본값 "md")
 */
export default function DropdownCell({
  value,
  width,
  flex,
  placeholder,
  options,
  onChange,
  size = "md",
  className,
}: DropdownCellProps) {
  const s = SIZE_CONFIG[size];
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기 / Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /** 트리거 클릭 → 메뉴 위치 계산 후 토글 / Calculate position then toggle open */
  const handleOpen = () => {
    if (!triggerRef.current) {
      setOpen((prev) => !prev);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen((prev) => !prev);
  };

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: "relative", width, flex, minWidth: 0, flexShrink: flex ? 1 : 0 }}
    >
      {/* 드롭다운 트리거 / Dropdown trigger */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className="rounded-[8px] gap-1"
        style={{
          width: "100%",
          height: s.triggerHeight,
          background: "var(--neutral-95)",
          display: "flex",
          alignItems: "center",
          paddingLeft: s.triggerPaddingLeft,
          paddingRight: s.triggerPaddingRight,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            flex: 1,
            fontWeight: 500,
            fontSize: s.fontSize,
            color: placeholder ? "var(--text-disabled)" : "var(--text-primary)",
            letterSpacing: s.letterSpacing,
            lineHeight: `${s.triggerHeight}px`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </span>
        {/* 열림/닫힘 상태 아이콘 / Open/close disclosure icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            open
              ? "/icons/disclosure/open-18.svg"
              : "/icons/disclosure/close-18.svg"
          }
          alt=""
          width={s.iconSize}
          height={s.iconSize}
          style={{ flexShrink: 0, display: "block" }}
        />
      </div>

      {/* 포탈 드롭다운 메뉴 / Portal dropdown menu */}
      {open &&
        options &&
        options.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="rounded-[8px] gap-0.5"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              background: "var(--neutral-95)",
              border: "1px solid var(--text-disabled)",
              padding: s.menuPadding,
              display: "flex",
              flexDirection: "column",
              zIndex: 9999,
              maxHeight: s.menuMaxHeight,
              overflowY: "auto",
              boxShadow: "0px 4px 16px rgba(0,0,0,0.10)",
            }}
          >
            {options.map((opt, idx) => (
              <React.Fragment key={opt}>
                {idx > 0 && (
                  <div style={{ height: 1, background: "var(--text-disabled)", flexShrink: 0 }} />
                )}
                <button
                  onMouseDown={() => {
                    onChange?.(opt);
                    setOpen(false);
                  }}
                  className="rounded-[4px]"
                  style={{
                    height: s.optionHeight,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: s.optionPaddingX,
                    paddingRight: s.optionPaddingX,
                    paddingTop: s.optionPaddingY,
                    paddingBottom: s.optionPaddingY,
                    fontWeight: 500,
                    fontSize: s.fontSize,
                    color: "var(--text-secondary)",
                    letterSpacing: s.letterSpacing,
                    lineHeight: 1.18,
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {opt}
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
