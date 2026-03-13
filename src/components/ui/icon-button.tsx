"use client";

import React from "react";
import Button, { ButtonSize } from "./solid-button";

/**
 * IconButton은 이제 통합된 Button 컴포넌트를 기반으로 동작합니다.
 * 기존의 인터페이스를 유지하면서 내부 로직을 Button과 공유합니다.
 */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string | React.ReactNode;
  alt?: string;
  size?: "sm" | "md" | "lg";
  variant?: "rounded" | "pill" | "special";
  isActive?: boolean;
}

export default function IconButton({
  icon,
  alt: _alt,
  size = "md",
  variant: _variant = "rounded",
  isActive: _isActive = false,
  className,
  ...props
}: IconButtonProps) {
  // 기존 IconButton의 sm, md, lg를 통합 Button의 s, m, L로 매핑
  const sizeMap: Record<"sm" | "md" | "lg", ButtonSize> = {
    sm: "s",
    md: "m",
    lg: "L",
  };

  return (
    <Button
      size={sizeMap[size]}
      icon={icon}
      className={className}
      variant="ghost" // 기본적으로 배경이 없는 형태가 많으므로 ghost를 기반으로 합니다.
      {...props}
    />
  );
}
