"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSimulationStore, type SimulationState } from "@/store/simulationStore";
import { StepIndicator } from "../StepIndicator";
import {
  ATS_STEPS,
  TSI_STEPS,
  DRD_STEPS,
  getActiveStepIndex,
} from "./constants";

interface HeaderStepsProps {
  type: "ats" | "tsi" | "drd";
  drdStep?: number;
}

/** 좌측 스텝 인디케이터 — type에 따라 적절한 steps/activeIndex를 계산 */
export const HeaderSteps: React.FC<HeaderStepsProps> = ({ type, drdStep = 1 }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isApplied = useSimulationStore((state: SimulationState) => state.isApplied);

  // 반응형 compact (전체 헤더 공통)
  const [compact, setCompact] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 1470) setCompact(2);
      else if (w < 1688) setCompact(1);
      else setCompact(0);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const steps = type === "ats" ? ATS_STEPS : type === "tsi" ? TSI_STEPS : DRD_STEPS;
  const activeIndex = getActiveStepIndex(type, pathname, drdStep);

  return (
    <StepIndicator
      steps={steps}
      activeIndex={activeIndex}
      onStepClick={(path, idx) => {
        if (type === "ats" && idx === 1 && !isApplied) return;
        router.push(path);
      }}
      isStepDisabled={(idx) => type === "ats" && idx === 1 && !isApplied}
      compact={compact}
    />
  );
};
