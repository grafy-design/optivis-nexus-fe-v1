"use client";

import React from "react";
import Image from "next/image";

interface GlassBtnProps {
  children: React.ReactNode;
  iconSrc?: string;
  onClick?: () => void;
  width?: number;
  disabled?: boolean;
  className?: string;
  /** 텍스트·아이콘 색상 오버라이드 */
  color?: string;
}

/**
 * 글래스모피즘 필(pill) 버튼 — 홈 헤더 및 모달 닫기 버튼에서 사용
 *
 * 주요 수정사항:
 * - className prop 추가: 외부에서 추가 CSS 클래스 주입 (예: "glass-btn-dark")
 * - color prop 추가: 텍스트·아이콘 색상을 인스턴스별로 오버라이드 (기본값 "#0D063C")
 * - isLight 판별: color가 흰색(#ffffff/#fff/white)이면 아이콘에 brightness-0 invert 필터 적용
 * - glass-btn-dark 클래스와 조합 시: ::before(배경)만 brightness(0.6), 텍스트·아이콘은 영향 없음
 */
export const GlassBtn: React.FC<GlassBtnProps> = ({
  children,
  iconSrc,
  onClick,
  width,
  disabled,
  className: extraClassName,
  color,
}) => {
  /** 기본 텍스트 색상: prop 미지정 시 짙은 남색 (#0D063C) */
  const textColor = color ?? "#0D063C";
  /** 흰색 텍스트 여부 — true면 아이콘에 brightness-0 invert 적용하여 흰색 변환 */
  const isLight = color === "#ffffff" || color === "#fff" || color === "white";
  return (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`figma-header-btn-pil rounded-[32px] gap-1.5 px-6 py-5 [@media(max-width:1470px)]:px-4 [@media(max-width:1470px)]:py-3 [@media(max-width:1470px)]:rounded-[24px] inline-flex items-center justify-center border-none cursor-pointer shrink-0 transition-all glass-btn-responsive ${extraClassName ?? ""}`}
    style={{
      ...(width ? { "--glass-btn-w": `${width}px`, "--glass-btn-w-sm": `${Math.round(width * 0.75)}px` } as React.CSSProperties : {}),
      background: "transparent",
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? "default" : "pointer",
    }}
  >
    {iconSrc && (
      <span className="flex items-center shrink-0 relative" style={{ top: "-1px" }}>
        <Image src={iconSrc} alt="" width={16} height={16} className={`[@media(max-width:1470px)]:w-3 [@media(max-width:1470px)]:h-3 ${isLight ? "brightness-0 invert" : ""}`} style={{ objectFit: "contain"}} />
      </span>
    )}
    <span
      className="text-body4"
      style={{ color: textColor, whiteSpace: "nowrap", top: "-1px" }}
    >
      {children}
    </span>
  </button>
  );
};
