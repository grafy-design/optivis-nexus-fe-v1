"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UnifiedHeader } from "./UnifiedHeader";
import { StepIndicator, type StepItem } from "./header/StepIndicator";
import { DrdActions } from "./header/DrdActions";

const DRD_STEPS: StepItem[] = [
  { key: "default-settings", label: "Default Settings", path: "/drd/default-setting" },
  { key: "simulation-settings", label: "Simulation Settings", path: "/drd/simulation-setting" },
  { key: "dashboard", label: "Dash Board", path: "/drd/simulation-result" },
];

interface DrdHeaderProps {
  step: 1 | 2 | 3;
}

/** DRD 헤더 — UnifiedHeader + StepIndicator(3단계) + DrdActions 조합 */
export const DrdHeader = ({ step }: DrdHeaderProps) => {
  const router = useRouter();
  const activeIndex = step - 1;

  const handleGoBack = () => {
    if (step === 1) router.push("/");
    else if (step === 2) router.push("/drd/default-setting");
  };

  return (
    <UnifiedHeader
      left={
        <StepIndicator
          steps={DRD_STEPS}
          activeIndex={activeIndex}
          onStepClick={(path) => router.push(path)}
        />
      }
      right={<DrdActions step={step} onGoBack={handleGoBack} />}
    />
  );
};
