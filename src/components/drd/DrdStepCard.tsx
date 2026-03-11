/**
 * DrdStepCard — DRD 왼쪽 패널 하단 스텝 카드 단일 항목
 *
 * 활성 상태일 때 Navy(#262255) 배경 + 흰색 텍스트 + 오렌지 아이콘으로 표시되고,
 * 비활성 상태일 때 투명 배경 + hover/active 효과가 적용됩니다.
 */
"use client";

import React from "react";

export interface DrdStepCardProps {
  /** 아이콘 컴포넌트 (size prop 지원) */
  icon: React.ComponentType<{ size?: number }>;
  /** 스텝 제목 */
  title: string;
  /** 스텝 설명 */
  description: string;
  /** 활성 상태 — Navy 배경 + 흰색 텍스트 */
  isActive?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 카드 높이 (기본 100px, simulation-setting은 96px) */
  height?: number;
}

export function DrdStepCard({
  icon: Icon,
  title,
  description,
  isActive = false,
  onClick,
  height = 100,
}: DrdStepCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col justify-center w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150",
        isActive ? "" : "hover:bg-[#f9f8fc] active:bg-[#efeff4]",
      ].join(" ")}
      style={{
        backgroundColor: isActive ? "#262255" : "transparent",
        height,
      }}
    >
      <div className="flex items-center gap-[18px]">
        <div className="shrink-0 flex items-center justify-center">
          <Icon size={24} />
        </div>
        <span
          className="text-body3"
          style={{ color: isActive ? "var(--text-inverted)" : "#484646" }}
        >
          {title}
        </span>
      </div>
      <div className="pl-[42px] mt-0">
        <p
          className="text-small1 leading-[1.1] m-0"
          style={{ color: isActive ? "#c9c5c8" : "var(--text-secondary)" }}
        >
          {description}
        </p>
      </div>
    </button>
  );
}
