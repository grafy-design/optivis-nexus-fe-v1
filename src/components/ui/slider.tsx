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
  const [isHovered, setIsHovered] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 1470px 이하 반응형 감지
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1470px)");
    setIsSmall(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const percentage = ((value - min) / (max - min)) * 100;

  // 핸들 상태별 스타일 (DRD ResizablePill 참고)
  const knobState = disabled ? "disabled" : isDragging ? "pressed" : isHovered ? "hover" : "default";
  const knobStyles = {
    default:  { bg: "var(--neutral-95)", border: "var(--text-disabled)", fill: "#231f52", track: "var(--neutral-90)" },
    hover:    { bg: "#d4d3dc", border: "#8f8ac4", fill: "#231f52", track: "var(--neutral-90)" },
    pressed:  { bg: "#c5c0fe", border: "#5c588e", fill: "#3a11d8", track: "var(--neutral-90)" },
    disabled: { bg: "#f5f5f7", border: "var(--neutral-90)", fill: "var(--text-disabled)", track: "var(--neutral-90)" },
  }[knobState];

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

  const knobW = isSmall ? 30 : 38;
  const knobH = isSmall ? 18 : 24;
  const trackH = isSmall ? 18 : 24;
  const barH = isSmall ? 4 : 6;
  const tickTop = isSmall ? "13px" : "17px";
  const tickSize = isSmall ? "w-0.5 h-0.5" : "w-1 h-1";
  const valueBoxH = isSmall ? 20 : 24;
  const valueBoxW = isSmall ? 36 : 44;

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex items-center mb-1 select-none", isSmall ? "gap-1" : "gap-2")}>
        <span className={cn("text-text-secondary", isSmall ? "text-small2 w-[16px]" : "text-body5m w-[21px]")}>Min</span>
        <div className="flex-1 relative">
          <div
            ref={trackRef}
            className="relative flex items-center cursor-pointer select-none"
            style={{ height: trackH }}
            onMouseDown={handleMouseDown}
          >
            {/* Track */}
            <div
              className="absolute w-full rounded-[3px]"
              style={{ height: barH, backgroundColor: knobStyles.track }}
            />

            {/* Fill */}
            <div
              className="absolute rounded-[3px]"
              style={{ height: barH, width: `${percentage}%`, backgroundColor: knobStyles.fill }}
            />

            {/* Ticks */}
            <div className="absolute w-full flex justify-between px-0" style={{ top: tickTop }}>
              {[0, 1, 2, 3, 4].map((tick) => (
                <div
                  key={tick}
                  className={cn("rounded-full bg-neutral-90", tickSize)}
                />
              ))}
            </div>

            {/* Knob/Handle */}
            <div
              className="absolute"
              onMouseEnter={() => !disabled && setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: knobW,
                height: knobH,
                borderRadius: 9999,
                backgroundColor: knobStyles.bg,
                border: `1px solid ${knobStyles.border}`,
                left: `calc(${percentage}% - ${knobW / 2}px)`,
                transform: "translateY(-50%)",
                top: "50%",
                cursor: disabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
                transition: "background-color 0.12s, border-color 0.12s",
              }}
            />
          </div>
        </div>
        <span className={cn("text-text-secondary text-right", isSmall ? "text-small2 w-[18px]" : "text-body5m w-[23px]")}>Max</span>
        {showValue && (
          <div
            className="bg-neutral-95 rounded-[8px] flex items-center justify-center"
            style={{ height: valueBoxH, width: valueBoxW }}
          >
            <span className={cn(isSmall ? "text-small2" : "text-body5", "text-neutral-50")}>
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

