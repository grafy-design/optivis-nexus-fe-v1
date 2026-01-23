"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  showValue = true,
  className,
  disabled = false,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    onChange?.(clampedValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-body5m text-[#c9c6c5] w-[21px]">Min</span>
        <div className="flex-1 relative">
          <div
            ref={trackRef}
            className="relative h-[24px] flex items-center cursor-pointer"
            onMouseDown={handleMouseDown}
          >
            {/* Track */}
            <div className="absolute w-full h-[6px] rounded-[3px] bg-[#e2e1e5]" />
            
            {/* Fill */}
            <div
              className="absolute h-[6px] rounded-[3px] bg-[#231f52]"
              style={{ width: `${percentage}%` }}
            />

            {/* Ticks */}
            <div className="absolute w-full flex justify-between px-0" style={{ top: "17px" }}>
              {[0, 1, 2, 3, 4].map((tick) => (
                <div
                  key={tick}
                  className="w-1 h-1 rounded-full bg-[#e2e1e5]"
                />
              ))}
            </div>

            {/* Knob */}
            <div
              className="absolute w-[38px] h-[24px] rounded-full bg-[#fcf8f8] border border-[#e2e1e5] cursor-grab active:cursor-grabbing"
              style={{
                left: `calc(${percentage}% - 19px)`,
                transform: "translateY(-50%)",
                top: "50%",
              }}
            />
          </div>
        </div>
        <span className="text-body5m text-[#c9c6c5] w-[23px] text-right">Max</span>
        {showValue && (
          <div className="bg-[#ebebf0] rounded-[8px] h-[24px] px-2 flex items-center justify-center min-w-[36px]">
            <span className="text-body5 text-[#787776]">{value.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

