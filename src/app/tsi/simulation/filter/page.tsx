"use client";

import { AppLayout } from "@/components/layout/AppLayout";

/**
 * TSI (Target Subgroup Identification) Filter 페이지.
 * 첫 번째 스텝으로, 필터링 설정을 위한 페이지 (추후 개발 예정).
 */
export default function TSIFilterPage() {
  return (
    <AppLayout headerType="tsi">
      <div className="w-full min-h-[calc(100vh-76px)] bg-[#e7e5e7]" />
    </AppLayout>
  );
}
