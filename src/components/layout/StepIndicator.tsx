"use client";

import React from "react";

export interface StepItem {
  key: string;
  label: string;
  path: string;
}

interface StepIndicatorProps {
  steps: StepItem[];
  activeIndex: number;
  onStepClick: (path: string, index: number) => void;
  /** 특정 스텝을 비활성(클릭 불가)으로 표시 */
  isStepDisabled?: (index: number) => boolean;
  /** 반응형 compact 레벨 (0=기본, 1=중간, 2=최소) — TSI 6단계용 */
  compact?: 0 | 1 | 2;
}

/** 스텝 사이 화살표 구분자 SVG (ATS/TSI 공통 filled chevron) */
const SeparatorArrow = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    <rect width="16" height="16" rx="8" fill="var(--icon-secondary)" />
    <path
      d="M10.8916 7.82715C10.8916 7.91504 10.874 7.99854 10.8389 8.07764C10.8066 8.15381 10.7539 8.22705 10.6807 8.29736L7.30127 11.6064C7.18701 11.7178 7.04785 11.7734 6.88379 11.7734C6.77832 11.7734 6.68018 11.7471 6.58936 11.6943C6.49854 11.6416 6.42529 11.5713 6.36963 11.4834C6.31689 11.3955 6.29053 11.2959 6.29053 11.1846C6.29053 11.0234 6.35205 10.8799 6.4751 10.7539L9.48535 7.82715L6.4751 4.90039C6.35205 4.77734 6.29053 4.63379 6.29053 4.46973C6.29053 4.36133 6.31689 4.26318 6.36963 4.17529C6.42529 4.08447 6.49854 4.0127 6.58936 3.95996C6.68018 3.90723 6.77832 3.88086 6.88379 3.88086C7.04785 3.88086 7.18701 3.93652 7.30127 4.04785L10.6807 7.35693C10.751 7.42725 10.8037 7.50049 10.8389 7.57666C10.874 7.65283 10.8916 7.73633 10.8916 7.82715Z"
      fill="var(--icon-inverted)"
    />
  </svg>
);

/** 원형 숫자 뱃지 SVG (SVG <text> 방식으로 통일) */
const StepBadge = ({ index, fill, size }: { index: number; fill: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    <rect width="16" height="16" rx="8" fill={fill} />
    <text
      x="7.75"
      y="9"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="var(--icon-inverted)"
      style={{
        fontSize: "12px",
        fontWeight: 590,
        letterSpacing: "-0.36px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {index + 1}
    </text>
  </svg>
);

/**
 * 공통 스텝 인디케이터 — ATS(2단계), DRD(3단계), TSI(6단계) 공용.
 * 원형 숫자 뱃지 + 레이블 텍스트 + 화살표 구분자로 구성된다.
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  activeIndex,
  onStepClick,
  isStepDisabled,
  compact = 0,
}) => {
  const iconSize = compact === 2 ? 14 : compact === 1 ? 15 : 16;
  const fontSize = compact === 2 ? "15px" : compact === 1 ? "18.5px" : "19.5px";
  const stepGap = compact === 2 ? "gap-[28px]" : compact === 1 ? "gap-[34px]" : "gap-[36px]";
  const innerGap = compact === 2 ? "gap-1" : compact === 1 ? "gap-[6px]" : "gap-2";

  return (
    <div className={`flex items-center ${stepGap}`}>
      {steps.map((step, index) => {
        const isActive = activeIndex === index;
        const disabled = isStepDisabled?.(index) ?? false;
        const circleFill = isActive
          ? "var(--icon-on-button)"
          : "var(--icon-secondary)";

        return (
          <React.Fragment key={step.key}>
            {/* 화살표 구분자 */}
            {index > 0 && <SeparatorArrow size={iconSize} />}

            {/* 스텝 버튼 (뱃지 + 레이블) */}
            <button
              onClick={() => !disabled && onStepClick(step.path, index)}
              disabled={disabled}
              className={`flex items-center ${innerGap} bg-transparent border-none p-0 transition-opacity ${
                disabled
                  ? "cursor-not-allowed"
                  : "hover:opacity-70 cursor-pointer"
              }`}
            >
              <StepBadge index={index} fill={circleFill} size={iconSize} />
              <span
                className={`font-semibold tracking-[-0.78px] whitespace-nowrap ${
                  isActive ? "text-icon-on-button" : "text-icon-primary"
                }`}
                style={{ fontSize }}
              >
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
