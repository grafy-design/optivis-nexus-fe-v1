"use client";

import { useState } from "react";
import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  variant?: "glass" | "solid" | "purple";
  isSelected?: boolean;
  onClick?: () => void;
  sectionType?: "package" | "service";
  locked?: boolean;
  disabled?: boolean;
}

/**
 * Figma 스펙 기반 FeatureCard
 *
 * Package 카드:
 *   - 기본: bg white r=24, 아이콘 bg #5C5891 r=32, 타이틀 #000 설명 #484646
 *   - 선택: bg #262255 r=24, 아이콘 bg white r=32, 타이틀 white 설명 white
 *   카드 크기: 414×352px, padding 24px, gap 60px (icon-text)
 *
 * Service 카드:
 *   - 기본: bg white r=24, 아이콘 bg #5C5891 r=32
 *   - Drug Response (purple variant): bg #C5C6EF r=24
 *   - 선택: 테두리만 강조 (bg 변경 없음)
 *   카드 크기: 413×352px, padding 24px, gap 30px (icon-text)
 */
export default function FeatureCard({
  title,
  description,
  icon,
  selectedIcon,
  variant: _variant = "glass",
  isSelected = false,
  onClick,
  sectionType = "package",
  locked = false,
  disabled = false,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isPackage = sectionType === "package";

  // 카드 배경색
  let cardBg: string;
  let cardBorder: string;
  let cardShadow: string;

  if (isPackage) {
    if (disabled) {
      cardBg = "linear-gradient(180deg, rgba(196,196,196,0.95) 0%, rgba(182,182,182,0.92) 100%)";
      cardBorder = "1px solid rgba(166,166,166,0.92)";
      cardShadow = "inset 0 1px 0 rgba(255,255,255,0.30)";
    } else if (isSelected) {
      // Figma: Fill #262255, Glass Effect black r=24
      cardBg = "linear-gradient(180deg, rgba(56,51,110,1) 0%, rgba(38,34,85,1) 100%)";
      cardBorder = "1px solid rgba(255,255,255,0.15)";
      cardShadow = "inset 0 1px 0 rgba(255,255,255,0.1)";
    } else {
      // Figma: Fill white, Glass Effect black r=24
      cardBg = "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.90) 100%)";
      cardBorder = "1px solid rgba(255,255,255,0.8)";
      cardShadow = "inset 0 1px 0 rgba(255,255,255,0.9)";
    }
  } else {
    if (disabled) {
      cardBg = "linear-gradient(180deg, rgba(226,226,226,0.95) 0%, rgba(215,215,215,0.92) 100%)";
      cardBorder = "1px solid rgba(196,196,196,0.92)";
      cardShadow = "inset 0 1px 0 rgba(255,255,255,0.45)";
    } else if (isSelected || isHovered) {
      // Service card selected/hovered: lavender glass background
      cardBg = "linear-gradient(180deg, rgba(232,230,255,0.8) 0%, rgba(220,218,255,0.75) 100%)";
      cardBorder = "1px solid rgba(100,88,220,0.4)";
      cardShadow = "inset 0 1px 0 rgba(255,255,255,0.9)";
    } else {
      // Default: white background
      cardBg = "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.90) 100%)";
      cardBorder = "1px solid rgba(255,255,255,0.8)";
      cardShadow = "inset 0 1px 0 rgba(255,255,255,0.9)";
    }
  }

  // 아이콘 배경색 및 필터 (검정색 아이콘 효과)
  let iconBg: string;
  let iconFilter: string = "none";

  if (isPackage) {
    if (disabled) {
      iconBg = "transparent";
      iconFilter = "brightness(0) saturate(0) opacity(0.58)";
    } else if (isSelected) {
      if (selectedIcon) {
        // 전용 선택 아이콘이 있는 경우 배경을 투명하게 하여 흰색 테두리 방지
        iconBg = "transparent";
      } else {
        iconBg = "#FFFFFF";
      }
      iconFilter = "none";
    } else {
      iconBg = "transparent"; /* 그레이 배경 제거 */
      iconFilter = "brightness(0)"; // 아이콘 완전 블랙
    }
  } else {
    if (disabled) {
      iconBg = "transparent";
      iconFilter = "brightness(0) saturate(0) opacity(0.58)";
    } else if (isSelected || isHovered) {
      if (selectedIcon) {
        // 이미 디자인된 전용 아이콘이 있는 경우 (예: Adaptive Trial)
        // 배경을 투명하게 하고 필터를 해제하여 원본 이미지를 그대로 노출 (중복 원 방지)
        iconBg = "transparent";
        iconFilter = "none";
      } else {
        // 전용 아이콘이 없는 경우 기본 아이콘을 화이트로 변경하여 사용
        iconBg = "#bdb9e9";
        iconFilter = "brightness(0) invert(1)";
      }
    } else {
      iconBg = "transparent"; /* 기본 상태 그레이 배경 제거 */
      iconFilter = "brightness(0)"; // 아이콘 완전 블랙
    }
  }

  // 텍스트 색상
  const titleColor = disabled
    ? "#7A7A7A"
    : isPackage && isSelected
      ? "#FFFFFF"
      : "#000000";
  const descColor = disabled
    ? "#888888"
    : isPackage && isSelected
      ? "rgba(255,255,255,0.85)"
      : "#484646";

  // 아이콘 소스 (호버 시에도 선택된 아이콘 사용하도록 변경, 단 Package는 선택 시에만)
  const iconSrc = (isSelected || (!isPackage && isHovered && !disabled)) && selectedIcon ? selectedIcon : icon;

  // 카드 padding / gap - Figma 기준
  const cardPad = 24; // 모든 방향 24px

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => {
        if (!disabled) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (!disabled) setIsHovered(false);
      }}
      className="relative flex flex-col"
      style={{
        width: "100%",
        /* 높이는 내용에 따라 flex로 채움 (Figma 352px 기준이나 반응형 허용) */
        flex: 1,
        minHeight: "200px",
        padding: `${cardPad}px`,
        borderRadius: "24px",
        background: cardBg,
        border: cardBorder,
        boxShadow: cardShadow,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isPackage && isHovered && !isSelected && !disabled ? "translateY(-4px)" : "none",
        display: "flex",
        flexDirection: "column",
        cursor: disabled ? "default" : "pointer",
        opacity: 1,
      }}
    >
      {locked && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "29px",
            height: "29px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10V7.5C8 5.01472 10.0147 3 12.5 3C14.9853 3 17 5.01472 17 7.5V10" stroke="#767676" strokeWidth="1.8" strokeLinecap="round"/>
            <rect x="6" y="10" width="13" height="11" rx="2.5" stroke="#767676" strokeWidth="1.8"/>
          </svg>
        </div>
      )}

      {/* 아이콘: 60x60 원형 프레임 (중간 원 제거를 위해 강제 크롭) */}
      <div
        className="home-feature-card-icon flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: iconBg,
          transition: "background-color 0.2s ease",
          position: "relative",
        }}
      >
        <Image
          src={iconSrc}
          alt={title}
          width={140}
          height={140}
          className="home-feature-card-icon-img object-cover"
          style={{
            filter: iconFilter,
            transition: "filter 0.2s ease",
            position: "absolute",
            top: "50%",
            left: "50%",
            /* 줌 효과 제거: 모든 상태에서 일정한 크기 유지 */
            transform: "translate(-50%, -50%) scale(1)",
          }}
        />
      </div>

      {/* Spacer to push content to bottom */}
      <div className="flex-1" />

      {/* 텍스트 영역: gap 8px */}
      <div className="flex flex-col" style={{ gap: "8px" }}>
        {/* 타이틀: Inter 600 19.5px */}
        <p
          className="home-feature-card-title"
          style={{
            fontFamily: "Inter",
            fontSize: "19.5px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: "-0.585px",
            color: titleColor,
            margin: 0,
            transition: "color 0.2s ease",
          }}
        >
          {title}
        </p>

        {/* 설명: Inter 400 15px */}
        <p
          className="home-feature-card-desc"
          style={{
            fontFamily: "Inter",
            fontSize: "15px",
            fontWeight: isPackage && isSelected ? 500 : 400,
            lineHeight: "1.115",
            letterSpacing: "-0.3px",
            color: descColor,
            margin: 0,
            transition: "color 0.2s ease",
          }}
        >
          {description}
        </p>
      </div>

      <style jsx>{`
        /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
        @media (max-width: 1800px) {
          .home-feature-card-icon {
            width: 51px !important;
            height: 51px !important;
          }

          .home-feature-card-icon-img {
            transform: translate(-50%, -50%) scale(0.86) !important;
          }

          .home-feature-card-title {
            font-size: 16.5px !important;
          }

          .home-feature-card-desc {
            font-size: 12px !important;
          }
        }
        */
      `}</style>
    </div>
  );
}
