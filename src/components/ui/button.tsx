"use client";

import { cn } from "@/lib/cn";
import Image from "next/image";

type IconType = "play" | "plus" | string; // "play", "plus" 또는 이미지 경로

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "glass" | "orange";
  size?: "sm" | "md" | "lg";
  icon?: IconType;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  children: React.ReactNode;
}

// 내장 아이콘 컴포넌트
const PlayIcon = ({ className }: { className?: string }) => (
  <svg
    width="11"
    height="13"
    viewBox="0 0 11 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0 }}
  >
    <path
      d="M0 11.2324V1.06641C0 0.700195 0.090332 0.431641 0.270996 0.260742C0.45166 0.0849609 0.666504 -0.00292969 0.915527 -0.00292969C1.13525 -0.00292969 1.35986 0.0605469 1.58936 0.1875L10.1221 5.17529C10.4248 5.35107 10.6348 5.50977 10.752 5.65137C10.874 5.78809 10.9351 5.9541 10.9351 6.14941C10.9351 6.33984 10.874 6.50586 10.752 6.64746C10.6348 6.78906 10.4248 6.94775 10.1221 7.12354L1.58936 12.1113C1.35986 12.2383 1.13525 12.3018 0.915527 12.3018C0.666504 12.3018 0.45166 12.2139 0.270996 12.0381C0.090332 11.8623 0 11.5938 0 11.2324Z"
      fill="currentColor"
    />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: "16px", height: "16px" }}
  >
    <path
      d="M8 3V13M3 8H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  disabled = false,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#262255] text-white hover:bg-[#1a1a3e]",
    ghost: "bg-transparent hover:bg-gray-100",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    glass: "bg-[rgba(36,36,36,0.3)] backdrop-blur-[10px] text-[black] hover:bg-[rgba(36,36,36,0.4)]",
    orange: "bg-[#f16600] text-white hover:bg-[#d85a00] disabled:opacity-50 disabled:hover:bg-[#f16600]",
  };

  const sizes = {
    sm: "h-8 px-3 text-body5 rounded-lg",
    md: "h-[42px] px-5 text-body3 rounded-[21px] [&_*]:text-inherit",
    lg: "h-14 px-6 text-body4 rounded-xl",
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    if (!icon) return null;

    // 내장 아이콘 타입
    if (icon === "play") {
      return <PlayIcon className="flex-shrink-0" />;
    }
    if (icon === "plus") {
      return <PlusIcon className="flex-shrink-0" />;
    }

    // 이미지 경로인 경우
    return (
      <Image
        src={icon}
        alt=""
        width={20}
        height={20}
        className="object-contain flex-shrink-0"
      />
    );
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      style={{
        ...(variant === "orange" && { color: "#ffffff" }),
        ...props.style,
      }}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="flex-shrink-0" style={{ color: "inherit" }}>
          {renderIcon()}
        </span>
      )}
      <span style={{ color: "inherit" }}>{children}</span>
      {icon && iconPosition === "right" && (
        <span className="flex-shrink-0" style={{ color: "inherit" }}>
          {renderIcon()}
        </span>
      )}
    </button>
  );
}


