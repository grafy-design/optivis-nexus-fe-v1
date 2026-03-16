"use client";

import type { ChangeEvent, CSSProperties, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TrpSelectOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

type TrpSelectVariant = "soft" | "muted" | "outline" | "inline" | "compact";

type TrpSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  variant?: TrpSelectVariant;
  options: readonly TrpSelectOption[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  placeholderColor?: string;
  iconColor?: string;
  disabledOpacity?: number;
};

export default function TrpSelect({
  options,
  value,
  className,
  style,
  onChange,
  onValueChange,
  wrapperClassName,
  wrapperStyle,
  variant = "soft",
  placeholderColor,
  iconColor,
  disabled = false,
  disabledOpacity = 0.75,
  ...props
}: TrpSelectProps) {
  const resolvedVariant: TrpSelectVariant = variant ?? "soft";
  const isEmpty = value === "" || value === undefined || value === null;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  return (
    <div
      className={cn("relative w-full", wrapperClassName)}
      style={{
        ...wrapperStyle,
        ...(disabled ? { opacity: disabledOpacity } : {}),
      }}
    >
      <select
        {...props}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={cn(
          "w-full appearance-none transition-[border-color,box-shadow,background-color,color] outline-none focus-visible:ring-2 focus-visible:ring-[#3A11D8]/15 disabled:cursor-not-allowed",
          resolvedVariant === "soft" &&
            "h-8 rounded-[8px] border border-[#EFEFF4] bg-[#EFEFF4] px-3 pr-9 text-[12px] font-semibold tracking-[-0.03em] text-[#4E4A57]",
          resolvedVariant === "muted" &&
            "h-[34px] rounded-[10px] border border-[#DDDCE7] bg-[#F4F2F8] px-3 pr-9 text-[12px] font-semibold text-[#4E4A57]",
          resolvedVariant === "outline" &&
            "h-[34px] rounded-[10px] border border-[rgba(214,213,221,0.95)] bg-white px-3 pr-9 text-[13px] font-semibold text-[#484646]",
          resolvedVariant === "inline" &&
            "h-[34px] rounded-[4px] border border-transparent bg-[#EFEFF4] px-[10px] pr-9 text-[14px] font-semibold text-[#484646]",
          resolvedVariant === "compact" &&
            "h-7 rounded-[6px] border border-transparent bg-[#F6F5FA] px-2 pr-7 text-[12px] font-semibold text-[#262255]",
          className
        )}
        style={{
          fontFamily: "Inter, sans-serif",
          ...style,
          ...(isEmpty && placeholderColor ? { color: placeholderColor } : {}),
        }}
      >
        {options.map((option) => (
          <option
            key={`${option.value}-${option.label}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2",
          resolvedVariant === "inline"
            ? "right-[10px] h-4 w-4"
            : resolvedVariant === "compact"
              ? "right-2 h-3.5 w-3.5"
              : "right-3 h-4 w-4"
        )}
      >
        <path
          d="M4.5 6.75H13.5L9 11.25L4.5 6.75Z"
          fill={iconColor ?? (resolvedVariant === "compact" ? "#262255" : "#6E6C7D")}
        />
      </svg>
    </div>
  );
}
