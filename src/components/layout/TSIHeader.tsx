"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UnifiedHeader } from "./UnifiedHeader";
import { StepIndicator, type StepItem } from "./header/StepIndicator";
import { TSIActions } from "./header/TSIActions";

const TSI_STEPS: StepItem[] = [
  { key: "default-settings", label: "Default Settings", path: "/tsi" },
  { key: "patients-summary", label: "Patients Summary", path: "/tsi/patients-summary" },
  { key: "basis-selection", label: "Basis selection", path: "/tsi/basis-selection" },
  { key: "subgroup-selection", label: "Subgroup selection", path: "/tsi/subgroup-selection" },
  { key: "subgroup-explain", label: "Subgroup Explain", path: "/tsi/subgroup-explain" },
  { key: "report", label: "Report", path: "/tsi/report" },
];

/** pathname → 활성 스텝 인덱스 (Default Settings = /tsi, /tsi/filter 둘 다 step 0) */
function getTSIActiveStepIndex(pathname: string): number {
  if (pathname === "/tsi/report" || /^\/tsi\/[^/]+\/report/.test(pathname)) return 5;
  if (pathname === "/tsi/subgroup-explain") return 4;
  if (pathname === "/tsi/subgroup-selection" || pathname === "/tsi/refine-cutoffs") return 3;
  if (pathname === "/tsi/basis-selection") return 2;
  if (pathname === "/tsi/patients-summary") return 1;
  if (pathname === "/tsi" || pathname === "/tsi/filter") return 0;
  return 0;
}

/** TSI 현재 경로의 이전 단계 path (뒤로가기용) */
function getTSIPreviousStepPath(pathname: string): string | null {
  if (pathname === "/tsi/refine-cutoffs") return "/tsi/subgroup-selection";
  const index = getTSIActiveStepIndex(pathname);
  if (index <= 0) return null;
  return TSI_STEPS[index - 1].path;
}

/** TSI 헤더 — UnifiedHeader + StepIndicator(6단계, compact 반응형) + TSIActions 조합 */
export const TSIHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const activeStepIndex = getTSIActiveStepIndex(pathname);
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

  return (
    <UnifiedHeader
      left={
        <StepIndicator
          steps={TSI_STEPS}
          activeIndex={activeStepIndex}
          onStepClick={(path) => router.push(path)}
          compact={compact}
        />
      }
      right={
        <TSIActions
          onBack={() => {
            const prevPath = getTSIPreviousStepPath(pathname);
            router.push(prevPath ?? "/");
          }}
        />
      }
    />
  );
};
