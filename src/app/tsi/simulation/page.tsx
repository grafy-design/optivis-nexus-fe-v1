"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * TSI (Target Subgroup Identification) 시뮬레이션 루트 페이지.
 * Filter 페이지로 리다이렉트합니다.
 */
export default function TSISimulationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tsi/simulation/filter");
  }, [router]);

  return null;
}
