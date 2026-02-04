"use client";

import { AppLayout } from "@/components/layout/AppLayout";

/**
 * TSI (Target Subgroup Identification) 시뮬레이션 페이지.
 * ATS와 동일한 헤더/레이아웃을 쓰고, 본문은 빈 페이지(추후 개발 예정).
 */
export default function TSISimulationReportPage() {
  return (
    <AppLayout headerType="tsi">
      <div className="w-full min-h-[calc(100vh-76px)] bg-[#e7e5e7]" />
    </AppLayout>
  );
}
