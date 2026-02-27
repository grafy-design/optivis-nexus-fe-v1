"use client";

import React from "react";
import Image from "next/image";

/**
 * Liquid Glass 버튼 — CSS only (border-image 제거, 순수 CSS로 유리 효과 구현)
 * Figma: 154px(Data template) / 140px(Data setting) × 42px, r=32
 * 텍스트: Inter 400 14.875px #0D063C
 */
function LiquidGlassBtn({
  children,
  iconSrc,
  onClick,
  width,
  variant,
}: {
  children: React.ReactNode;
  iconSrc?: string;
  onClick?: () => void;
  width: number;
  variant: "template" | "setting";
}) {
  const className =
    variant === "template"
      ? "figma-nine-slice figma-header-btn-template"
      : "figma-nine-slice figma-header-btn-setting";

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",    /* 수직 가운데 정렬 */
        justifyContent: "center", /* 수평 가운데 정렬 */
        gap: "5px",               /* 아이콘과 글자 사이의 간격 */
        width: `${width}px`,
        height: "60px",
        paddingLeft: "20px",      /* 내부 왼쪽 여백 */
        paddingRight: "20px",     /* 내부 오른쪽 여백 */
        borderRadius: "32px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        flexShrink: 0,
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseDown={(e) => (e.currentTarget.style.opacity = "0.70")}
      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {iconSrc && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            position: "relative", /* 아이콘 위치 미세 조정을 위해 상대 위치 설정 */
            top: "-2px",           /* 아이콘 세로 위치 보정: 위(-값), 아래(+값) */
          }}
        >
          <Image
            src={iconSrc}
            alt=""
            width={40}
            height={40}
            style={{
              width: variant === "template" ? "24px" : "22px",
              height: variant === "template" ? "24px" : "22px",
              objectFit: "contain",
            }}
          />
        </span>
      )}
      <span
        style={{
          fontFamily: "Inter",
          fontSize: "16px",
          fontWeight: 500,
          lineHeight: "22px",
          letterSpacing: "-0.535px",
          color: "#0D063C",
          whiteSpace: "nowrap",
          position: "relative", /* 위치 미세 조정을 위해 상대 위치 설정 */
          top: "-2px",           /* 글자 세로 위치 보정: 위(-값), 아래(+값) */
        }}
      >
        {children}
      </span>
    </button>
  );
}

/** 물음표 버튼: Figma 42×42px, Liquid Glass (frame에 ? 포함) */
function HelpBtn() {
  return (
    <button
      type="button"
      className="figma-nine-slice figma-header-btn-help"
      aria-label="Help"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "60px",
        height: "60px",
        borderRadius: "18px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        flexShrink: 0,
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseDown={(e) => (e.currentTarget.style.opacity = "0.70")}
      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
    />
  );
}

export const Header = () => {
  return (
    /*
     * Figma: Header 90px, bg #E7E5E7
     * padding: 좌우 28px (메인 카드와 정렬)
     * 로고: Poppins 600 32px
     * 버튼 그룹: gap 14px
     */
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 90,
        width: "100%",
        height: "90px",
        backgroundColor: "#E7E5E7",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "28px",
        paddingRight: "28px",
        flexShrink: 0,
      }}
    >
      {/* 로고: Helvetica Now Display Bold */}
      <h1
        style={{
          fontFamily: "'Helvetica Now Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "42px",
          fontWeight: 700,
          lineHeight: "1",
          letterSpacing: "-1.2px",
          color: "#000000",
          margin: 0,
          flexShrink: 0,
        }}
      >
        OPTIVIS Nexus
      </h1>

      {/* 오른쪽: 버튼 3개, gap 10px (14px에서 30% 축소) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {/* Data template: 194×54px */}
        <LiquidGlassBtn
          width={170}
          variant="template"
          iconSrc="/assets/figma/home/header-download-icon.png"
        >
          Data template
        </LiquidGlassBtn>

        {/* Data setting: 174×54px */}
        <LiquidGlassBtn
          width={170}
          variant="setting"
          iconSrc="/assets/figma/home/header-setting-icon.png"
        >
          Data setting
        </LiquidGlassBtn>

        {/* ? 버튼: 54×54px */}
        <HelpBtn />
      </div>
    </header>
  );
};
