"use client";

import { cn } from "@/lib/cn";
import Image from "next/image";
import React from "react";

// 버튼의 종류와 스타일 타입 정의
export type ButtonVariant = 
  | "primary"        // Orange (#F06600)
  | "secondary"      // Gray (#787776)
  | "purple"         // Purple (#3A11D8)
  | "light-purple"   // Light Purple (#8F8AC4)
  | "ghost"          // 투명 배경
  | "outline"        // 테두리만
  | "glass"          // 유리 질감
  | "orange"         // (호환성용) primary와 동일
  | "neutral";       // (호환성용) secondary와 동일

// 버튼의 크기 타입 정의
// L: 40px, m: 36px, s: 24px
export type ButtonSize = "L" | "m" | "s" | "lg" | "md" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode | "play" | "plus" | string;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  /** Skip default variant and padding styles */
  unstyled?: boolean;
  /** children이 없으면 아이콘-버튼(Squarish)으로 동작합니다. */
  children?: React.ReactNode;
}

// 내장 아이콘 컴포넌트
const Icons = {
  play: ({ className }: { className?: string }) => (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", className)}>
      <path d="M0 11.2324V1.06641C0 0.700195 0.090332 0.431641 0.270996 0.260742C0.45166 0.0849609 0.666504 -0.00292969 0.915527 -0.00292969C1.13525 -0.00292969 1.35986 0.0605469 1.58936 0.1875L10.1221 5.17529C10.4248 5.35107 10.6348 5.50977 10.752 5.65137C10.874 5.78809 10.9351 5.9541 10.9351 6.14941C10.9351 6.33984 10.874 6.50586 10.752 6.64746C10.6348 6.78906 10.4248 6.94775 10.1221 7.12354L1.58936 12.1113C1.35986 12.2383 1.13525 12.3018 0.915527 12.3018C0.666504 12.3018 0.45166 12.2139 0.270996 12.0381C0.090332 11.8623 0 11.5938 0 11.2324Z" fill="currentColor" />
    </svg>
  ),
  plus: ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function SolidButton({
  variant = "primary",
  size = "m",
  icon,
  iconPosition = "left",
  disabled = false,
  unstyled = false,
  children,
  className,
  ...props
}: ButtonProps) {
  // 실제 렌더링에 사용할 픽스된 사이즈 값들
  const normalizedSize = (size === "lg" ? "L" : size === "md" ? "m" : size === "sm" ? "s" : size) as "L" | "m" | "s";

  const isIconOnly = !children && !!icon;
  const hasBoth = !!children && !!icon;

  // 스타일 맵
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-secondary-60 text-white hover:bg-secondary-50 active:bg-secondary-40",
    orange: "bg-secondary-60 text-white hover:bg-secondary-50 active:bg-secondary-40",
    secondary: "bg-neutral-50 text-white hover:bg-neutral-40 active:bg-neutral-30",
    neutral: "bg-neutral-50 text-white hover:bg-neutral-40 active:bg-neutral-30",
    purple: "bg-tertiary-40 text-white hover:bg-tertiary-35 active:bg-tertiary-30",
    "light-purple": "bg-primary-60 text-white hover:bg-primary-50 active:bg-primary-40",
    ghost: "bg-transparent text-neutral-30 hover:bg-neutral-98 active:bg-neutral-95",
    outline: "border border-neutral-80 bg-transparent text-neutral-30 hover:bg-neutral-98 active:bg-neutral-95",
    glass: "glass-effect text-white hover:bg-[rgba(255,255,255,0.2)]",
  };

  const sizeBaseClasses = {
    L: isIconOnly ? "w-10 h-10" : "h-10 text-body3",
    m: isIconOnly ? "w-9 h-9" : "h-9 text-body4",
    s: isIconOnly ? "w-6 h-6" : "h-6 text-body5", // typo map might differ
  };

  // 패딩 로직: 텍스트+아이콘 여부에 따라 달라짐
  const paddingMap: Record<"L" | "m" | "s", string> = {
    L: isIconOnly ? "p-0" : (hasBoth ? (iconPosition === "left" ? "pl-[14px] pr-[24px]" : "pr-[14px] pl-[24px]") : "px-[24px]"),
    m: isIconOnly ? "p-0" : (hasBoth ? (iconPosition === "left" ? "pl-[16px] pr-[20px]" : "pr-[16px] pl-[20px]") : "px-[20px]"),
    s: isIconOnly ? "p-0" : (hasBoth ? (iconPosition === "left" ? "pl-[8px] pr-[12px]" : "pr-[8px] pl-[12px]") : "px-[12px]"),
  };

  // 아이콘 렌더링 함수
  const renderIcon = (iconContent: React.ReactNode | string) => {
    if (!iconContent) return null;

    if (typeof iconContent === "string") {
      if (iconContent === "play") return <Icons.play className="shrink-0" />;
      if (iconContent === "plus") return <Icons.plus className="shrink-0" />;
      
      return (
        <Image
          src={iconContent}
          alt=""
          width={normalizedSize === "s" ? 16 : 20}
          height={normalizedSize === "s" ? 16 : 20}
          className="object-contain shrink-0"
        />
      );
    }
    
    // React Component인 경우
    return iconContent;
  };

  if (unstyled) {
    return (
      <button
        className={cn("bg-transparent border-none p-0 cursor-pointer outline-none", className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={cn(
        "inline-flex w-fit items-center justify-center gap-2 rounded-full font-semibold transition-all select-none border-none cursor-pointer",
        "disabled:bg-neutral-80 disabled:text-neutral-90 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeBaseClasses[normalizedSize],
        paddingMap[normalizedSize],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {hasBoth && iconPosition === "left" && (
        <span className="shrink-0 flex items-center justify-center">
          {renderIcon(icon)}
        </span>
      )}
      
      {isIconOnly ? (
        <span className="flex items-center justify-center">
          {renderIcon(icon)}
        </span>
      ) : (
        <span className="leading-none whitespace-nowrap">{children}</span>
      )}

      {hasBoth && iconPosition === "right" && (
        <span className="shrink-0 flex items-center justify-center">
          {renderIcon(icon)}
        </span>
      )}
    </button>
  );
}
