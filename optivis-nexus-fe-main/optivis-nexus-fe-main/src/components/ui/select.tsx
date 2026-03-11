"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";

interface SelectProps {
  value?: string;
  placeholder?: string;
  options?: string[];
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  /** 우측 아이콘 커스텀 (예: /assets/icons/chevron-select.svg) */
  iconPath?: string;
  /** iconPath 사용 시 아이콘 크기 (기본 14x22) */
  iconWidth?: number;
  iconHeight?: number;
}

export default function Select({
  value,
  placeholder = "Select",
  options = [],
  onChange,
  className,
  disabled = false,
  iconPath,
  iconWidth = 14,
  iconHeight = 22,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (selectRef.current && !selectRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange?.(option);
    setIsOpen(false);
  };

  const hasWidthClass = className?.includes("w-");
  const defaultWidth = hasWidthClass ? "" : "w-[180px]";

  return (
    <div ref={selectRef} className={cn("relative", defaultWidth, className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "w-full bg-neutral-90 h-[26px] px-3 flex items-center justify-between",
          "text-body5 text-neutral-50",
          "cursor-pointer transition-all rounded-[8px]",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="flex-1 text-left truncate text-body5 py-1">
          {value || placeholder}
        </span>
        {iconPath ? (
          <img
            src={iconPath}
            alt=""
            width={iconWidth}
            height={iconHeight}
            className={cn(
              "transition-transform flex-shrink-0 object-contain",
              isOpen && "rotate-180",
            )}
          />
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "transition-transform flex-shrink-0",
              isOpen && "rotate-180",
            )}
          >
            <g style={{ mixBlendMode: "plus-darker" }}>
              <path
                d="M6.77336 6.10156L13.3829 6.10156C13.621 6.10156 13.7956 6.15113 13.9067 6.25026C14.021 6.34939 14.0781 6.46727 14.0781 6.60391C14.0781 6.72447 14.0369 6.84771 13.9543 6.97363L10.7115 11.6555C10.5972 11.8216 10.494 11.9368 10.4019 12.0011C10.313 12.0681 10.2051 12.1016 10.0781 12.1016C9.95432 12.1016 9.84638 12.0681 9.75432 12.0011C9.66225 11.9368 9.55908 11.8216 9.44479 11.6555L6.20193 6.97363C6.1194 6.84771 6.07813 6.72447 6.07813 6.60391C6.07813 6.46727 6.13527 6.34939 6.24955 6.25026C6.36384 6.15113 6.53844 6.10156 6.77336 6.10156Z"
                fill="var(--neutral-50)"
              />
            </g>
          </svg>
        )}
      </button>

      {isOpen && options.length > 0 && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 py-2 bg-neutral-90 rounded-[8px] border border-neutral-80 max-h-[200px] overflow-auto shadow-lg min-w-0"
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = value === option;
            return (
              <div key={index} className="px-1 py-1 relative">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full text-left text-body5 relative flex items-center flex-shrink-0 self-stretch cursor-pointer",
                    isSelected ? "text-white" : "text-neutral-50",
                  )}
                  style={{
                    fontSize: "12px",
                    fontWeight: 590,
                    letterSpacing: "-0.36px",
                    lineHeight: "13.2px",
                    height: "24px",
                  }}
                >
                  <div
                    className={cn(
                      "w-full h-full flex items-center px-2 rounded-[8px] transition-colors",
                      isSelected
                        ? "bg-tertiary-40"
                        : "bg-transparent hover:bg-neutral-85",
                    )}
                  >
                    {option}
                  </div>
                </button>
                {index < options.length - 1 && (
                  <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-neutral-80" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
