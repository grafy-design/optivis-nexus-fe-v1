"use client";

import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  icon,
  rightIcon,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <div className="absolute left-[18px] flex items-center text-[#5f5e5e] z-10">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full rounded-[100px] bg-white py-[12px] text-[#5f5e5e] placeholder:text-feature-search placeholder:text-[#5f5e5e] focus:outline-none focus:ring-2 focus:ring-offset-2",
          icon ? "pl-[42px] pr-[18px]" : "px-[18px]",
          rightIcon && "pr-10",
          className
        )}
        style={{
          paddingTop: "12px",
          paddingBottom: "12px",
          height: "40px",
          fontSize: "16px",
          fontWeight: 510,
          lineHeight: "100%",
          fontVariantNumeric: "lining-nums tabular-nums",
          fontFeatureSettings: "'liga' off, 'clig' off",
        }}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-4 flex items-center text-[#5f5e5e]">
          {rightIcon}
        </div>
      )}
    </div>
  );
}
