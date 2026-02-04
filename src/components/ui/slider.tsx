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
  valuePrecision?: number; // 표시할 소수점 자릿수
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
  valuePrecision,
  className,
  disabled = false,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault(); // 텍스트 선택 방지
    e.stopPropagation(); // 이벤트 전파 방지
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    e.preventDefault(); // 드래그 중 텍스트 선택 방지
    updateValue(e);
  };

  const handleMouseUp = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      // 드래그 중 모든 텍스트 선택 방지
      const preventSelect = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      const preventDrag = (e: DragEvent) => {
        e.preventDefault();
        return false;
      };

      const handleMouseMoveWrapper = (e: MouseEvent) => {
        e.preventDefault();
        handleMouseMove(e);
      };

      const handleMouseUpWrapper = (e: MouseEvent) => {
        e.preventDefault();
        handleMouseUp(e);
      };

      // 모든 선택 관련 이벤트 차단
      document.addEventListener("mousemove", handleMouseMoveWrapper, { passive: false });
      document.addEventListener("mouseup", handleMouseUpWrapper, { passive: false });
      document.addEventListener("selectstart", preventSelect);
      document.addEventListener("select", preventSelect);
      document.addEventListener("dragstart", preventDrag);
      
      // 전역 스타일로 텍스트 선택 완전히 차단
      const bodyStyle = document.body.style as any;
      const originalUserSelect = bodyStyle.userSelect;
      const originalWebkitUserSelect = bodyStyle.webkitUserSelect;
      const originalMozUserSelect = bodyStyle.mozUserSelect;
      const originalMsUserSelect = bodyStyle.msUserSelect;
      
      bodyStyle.userSelect = "none";
      bodyStyle.webkitUserSelect = "none";
      bodyStyle.mozUserSelect = "none";
      bodyStyle.msUserSelect = "none";
      
      // CSS 클래스로도 차단
      document.body.classList.add("no-select");
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMoveWrapper);
        document.removeEventListener("mouseup", handleMouseUpWrapper);
        document.removeEventListener("selectstart", preventSelect);
        document.removeEventListener("select", preventSelect);
        document.removeEventListener("dragstart", preventDrag);
        
        // 원래 스타일 복원
        const bodyStyle = document.body.style as any;
        bodyStyle.userSelect = originalUserSelect;
        bodyStyle.webkitUserSelect = originalWebkitUserSelect;
        bodyStyle.mozUserSelect = originalMozUserSelect;
        bodyStyle.msUserSelect = originalMsUserSelect;
        document.body.classList.remove("no-select");
      };
    }
  }, [isDragging, disabled]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-1 select-none">
        <span className="text-body5m text-[#c9c6c5] w-[21px]">Min</span>
        <div className="flex-1 relative">
          <div
            ref={trackRef}
            className="relative h-[24px] flex items-center cursor-pointer select-none"
            onMouseDown={handleMouseDown}
            style={{ userSelect: "none" }}
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
            <span className="text-body5 text-[#787776]">
              {valuePrecision !== undefined 
                ? value.toFixed(valuePrecision) 
                : value.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

