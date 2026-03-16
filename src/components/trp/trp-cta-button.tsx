"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TrpCtaButtonVariant = "primary" | "secondary";

type TrpCtaButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: TrpCtaButtonVariant;
  endIcon?: React.ReactNode;
};

export default function TrpCtaButton({
  variant = "primary",
  className,
  children,
  endIcon,
  ...props
}: TrpCtaButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[42px] items-center justify-center gap-2 rounded-full px-6 text-[15px] leading-[1.35] font-[var(--font-inter)] font-semibold tracking-[-0.03em] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#262255]/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary"
          ? "bg-[#F16600] text-white shadow-[0_12px_20px_rgba(241,102,0,0.18)] hover:bg-[#D85A00] disabled:bg-[#F16600]"
          : "bg-[#B4B4B8] text-white hover:bg-[#A6A6AB] disabled:bg-[#B4B4B8]",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {endIcon ? <span className="shrink-0 text-inherit">{endIcon}</span> : null}
    </button>
  );
}
