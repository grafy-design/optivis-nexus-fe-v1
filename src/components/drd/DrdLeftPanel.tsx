/**
 * DrdLeftPanel — DRD 왼쪽 패널 조립 컴포넌트
 *
 * Navy Liquid Glass 9-slice 배경 위에 다음을 조합합니다:
 * - (선택적) FilteredPatientsCard — 상단 남색 카드
 * - DrdStepCard 목록 — 하단 스텝 카드 스크롤 영역
 */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FilteredPatientsCard, type FilteredPatientsCardProps } from "./FilteredPatientsCard";
import { DrdStepCard } from "./DrdStepCard";
import type { DrdStepItem } from "./drd-step-data";

export interface DrdLeftPanelProps {
  /** FilteredPatientsCard 표시 여부 (default: true, simulation-setting은 false) */
  showFilteredPatients?: boolean;
  /** FilteredPatientsCard에 전달할 props */
  filteredPatientsProps?: FilteredPatientsCardProps;
  /** 스텝 카드 목록 데이터 */
  steps: DrdStepItem[];
  /** 각 스텝 카드 높이 (기본 100px, simulation-setting은 96px) */
  stepCardHeight?: number;
}

export function DrdLeftPanel({
  showFilteredPatients = true,
  filteredPatientsProps,
  steps,
  stepCardHeight = 100,
}: DrdLeftPanelProps) {
  const router = useRouter();

  return (
    <div className="figma-nine-slice figma-home-panel-left drd-left-panel flex-shrink-0 rounded-[36px] gap-[12px] overflow-hidden flex flex-col">
      {/* 상단 남색 카드 (조건부) */}
      {showFilteredPatients && filteredPatientsProps && (
        <FilteredPatientsCard {...filteredPatientsProps} />
      )}

      {/* 하단 스텝 카드 스크롤 영역 */}
      <div className="flex-1 rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[10px] overflow-hidden min-h-0">
        <div className="flex flex-col gap-[8px] overflow-y-auto overflow-x-hidden h-full">
          {steps.map((step) => (
            <DrdStepCard
              key={step.id}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isActive={step.isActive}
              onClick={() => router.push(step.route)}
              height={stepCardHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
