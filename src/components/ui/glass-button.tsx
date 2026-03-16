"use client";

/** GlassButton / GlassTestButton — 유리 질감 배경과 hover/press 인터랙션을 제공하는 버튼 모음 */

import React from "react";

// ─── 제네릭 GlassButton ───────────────────────────────────────────────────────

interface GlassButtonBaseProps {
  disabled?: boolean;
  onClick?: () => void;
  height?: number;
  width?: number;
  boxShadow?: string;
  children: React.ReactNode;
}

/** 글래스 스타일 범용 버튼 — children을 감싸며 hover/press 인터랙션을 제공합니다. */
export function GlassButton({ disabled, onClick, height = 40, width, boxShadow = "1px 1px 2px 1px rgba(0,0,0,0.075)", children }: GlassButtonBaseProps) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const bg = disabled
    ? "#F5F5F7"
    : pressed
    ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)"
    : hovered
    ? "#EBEBEB"
    : "#F7F7F7";
  return (
    <div
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
      className="rounded-full relative flex items-center justify-center shrink-0"
      style={{
        height,
        width,
        paddingLeft: width ? 0 : 20,
        paddingRight: width ? 0 : 20,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow,
        transition: "opacity 0.12s",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <div className="rounded-full absolute inset-0" />
      <div className="rounded-full absolute inset-0" style={{ background: bg, transition: "background 0.12s" }} />
      <div className="rounded-full absolute inset-0" style={{ border: pressed ? "2px solid rgba(51, 0, 255, 0.4)" : "2px solid rgba(255,255,255,0.3)", boxShadow: "1px 1px px 1px rgba(0,0,0,0)", transition: "border-color 0.12s" }} />
      <div className="relative flex items-center gap-[6px]" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── GlassTestButton ──────────────────────────────────────────────────────────

interface GlassTestButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

/** 글래스 스타일 "Test Load" 버튼 — press 시 텍스트가 활성 색상으로 변합니다. */
export function GlassTestButton({ disabled, onClick }: GlassTestButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const bg = disabled
    ? "#F5F5F7"
    : pressed
    ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)"
    : hovered
    ? "#EBEBEB"
    : "#F7F7F7";
  const textColor = disabled
    ? "var(--text-disabled)"
    : pressed
    ? "var(--text-active)"
    : "var(--text-header)";
  return (
    <div
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
      className="rounded-full relative flex items-center justify-center shrink-0"
      style={{
        height: 40,
        paddingLeft: 20,
        paddingRight: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "1px 1px 2px 1px rgba(0,0,0,0.05)",
        transition: "opacity 0.12s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="rounded-full absolute inset-0" />
      <div className="rounded-full absolute inset-0" style={{ background: bg, transition: "background 0.12s" }} />
      <div className="rounded-full absolute inset-0" style={{ border: pressed ? "2px solid rgba(51, 0, 255, 0.4)" : "2px solid rgba(255,255,255,0.3)", boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)", transition: "border-color 0.12s" }} />
      <span
        className="relative text-body3"
        style={{
          zIndex: 1,
          color: textColor,
          whiteSpace: "nowrap",
          paddingTop: 2,
          transition: "color 0.12s",
        }}
      >
        Test Load
      </span>
    </div>
  );
}
