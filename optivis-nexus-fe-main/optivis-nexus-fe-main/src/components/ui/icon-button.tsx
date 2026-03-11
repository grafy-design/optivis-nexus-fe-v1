"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  variant?: "rounded" | "pill" | "special";
  isActive?: boolean;
  children?: ReactNode;
}

export default function IconButton({
  icon,
  alt,
  size = "md",
  variant = "rounded",
  isActive = false,
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };
  const variantClasses = {
    rounded: "rounded-[20px]",
    pill: "rounded-[100px]",
    special: "rounded-[20px]",
  };

  const resolvedAriaLabel = ariaLabel ?? alt;

  return (
    <button
      aria-label={resolvedAriaLabel}
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none",
        sizeClasses[size],
        variantClasses[variant],
        isActive && "opacity-100",
        className
      )}
      {...props}
    >
      {children ??
        (icon ? (
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : null)}
    </button>
  );
}
