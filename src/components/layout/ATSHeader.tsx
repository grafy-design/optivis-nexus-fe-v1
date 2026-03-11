"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSimulationStore, type SimulationState } from "@/store/simulationStore";
import { UnifiedHeader } from "./UnifiedHeader";
import { StepIndicator, type StepItem } from "./header/StepIndicator";
import { ATSActions } from "./header/ATSActions";

const ATS_STEPS: StepItem[] = [
  { key: "simulation", label: "Study Design Optimization", path: "/ats/simulation" },
  { key: "report", label: "Report", path: "/ats/simulation/report" },
];

/** ATS 헤더 — UnifiedHeader + StepIndicator(2단계) + ATSActions 조합 */
export const ATSHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isApplied = useSimulationStore((state: SimulationState) => state.isApplied);

  const reportPath = "/ats/simulation/report";
  const simulationBasePath = "/ats/simulation";
  const isReportPage = pathname === reportPath;
  const activeIndex = isReportPage ? 1 : 0;

  return (
    <UnifiedHeader
      left={
        <StepIndicator
          steps={ATS_STEPS}
          activeIndex={activeIndex}
          onStepClick={(path, index) => {
            if (index === 1 && !isApplied) return;
            router.push(path);
          }}
          isStepDisabled={(index) => index === 1 && !isApplied}
        />
      }
      right={
        <ATSActions
          isReportPage={isReportPage}
          isApplied={isApplied}
          onSavePDF={() => window.dispatchEvent(new Event("save-report-pdf"))}
          onMakeReport={() => {
            if (isApplied) router.push(reportPath);
          }}
          onBack={() => router.push(isReportPage ? simulationBasePath : "/")}
          onForward={() => {
            if (isApplied) router.push(reportPath);
          }}
        />
      }
    />
  );
};
