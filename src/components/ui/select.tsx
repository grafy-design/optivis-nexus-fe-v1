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
}

export default function Select({
  value,
  placeholder = "Select",
  options = [],
  onChange,
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange?.(option);
    setIsOpen(false);
  };

  // className에 width 관련 클래스가 있는지 확인
  const hasWidthClass = className?.includes('w-');
  const defaultWidth = hasWidthClass ? '' : 'w-[154px]';

  return (
    <div ref={selectRef} className={cn("relative", defaultWidth, className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full rounded-[8px] bg-[#ebebf0] h-[26px] px-3 flex items-center justify-between",
          "text-body5 text-[#787776]",
          "cursor-pointer hover:opacity-80 transition-opacity",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="flex-1 text-left truncate text-body5">
          {value || placeholder}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("transition-transform flex-shrink-0", isOpen && "rotate-180")}
        >
          <g style={{ mixBlendMode: "plus-darker" }}>
            <path
              d="M6.77336 6.10156L13.3829 6.10156C13.621 6.10156 13.7956 6.15113 13.9067 6.25026C14.021 6.34939 14.0781 6.46727 14.0781 6.60391C14.0781 6.72447 14.0369 6.84771 13.9543 6.97363L10.7115 11.6555C10.5972 11.8216 10.494 11.9368 10.4019 12.0011C10.313 12.0681 10.2051 12.1016 10.0781 12.1016C9.95432 12.1016 9.84638 12.0681 9.75432 12.0011C9.66225 11.9368 9.55908 11.8216 9.44479 11.6555L6.20193 6.97363C6.1194 6.84771 6.07813 6.72447 6.07813 6.60391C6.07813 6.46727 6.13527 6.34939 6.24955 6.25026C6.36384 6.15113 6.53844 6.10156 6.77336 6.10156Z"
              fill="#787776"
            />
          </g>
        </svg>
      </button>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 w-full py-2 pt-1 pb-1 bg-[#ebebf0] rounded-[8px] border border-[#c6c5c9] max-h-60 overflow-auto">
          {options.map((option, index) => (
            <div key={index} className="px-1 py-1 relative">
              <button
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full text-left text-body5 text-[#787776] relative flex items-center flex-shrink-0 self-stretch group cursor-pointer"
                style={{ 
                  fontFamily: "SF Pro", 
                  fontSize: "12px", 
                  fontWeight: 590, 
                  letterSpacing: "-0.36px", 
                  lineHeight: "13.2px",
                  height: "24px"
                }}
              >
                <div className="w-full h-full flex items-center px-2 rounded-[8px] transition-colors group-hover:bg-[#3A11D8] group-hover:text-white">
                  {option}
                </div>
              </button>
              {index < options.length - 1 && (
                <div 
                  className="absolute bottom-0 left-3 right-3 h-[1px] bg-[#c6c5c9]"
                  style={{ transform: 'scaleY(1)' }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

