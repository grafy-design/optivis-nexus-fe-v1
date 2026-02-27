"use client";

import { cn } from "@/lib/cn";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  variant?: "rounded" | "pill" | "special";
  isActive?: boolean;
}

export default function IconButton({
  icon,
  alt,
  size = "md",
  variant: _variant = "rounded",
  isActive: _isActive = false,
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  };

  return (
    <button
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:opacity-70",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Icon - SVG with filters, use img tag for proper filter rendering */}
      <img
        src={icon}
        alt={alt}
        className="w-full h-full object-contain pointer-events-none"
      />
    </button>
  );
}

