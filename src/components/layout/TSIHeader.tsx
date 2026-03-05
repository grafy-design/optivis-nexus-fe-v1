"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/** TSI 브레드크럼 스텝 (기존 ATS 헤더와 동일한 원형·화살표 스타일, 숫자 1~6) */
const TSI_BREADCRUMB_STEPS = [
  {
    key: "default-settings",
    label: "Default Settings",
    path: "/tsi",
  },
  {
    key: "patients-summary",
    label: "Patients Summary",
    path: "/tsi/patients-summary",
  },
  {
    key: "basis-selection",
    label: "Basis selection",
    path: "/tsi/basis-selection",
  },
  {
    key: "subgroup-selection",
    label: "Subgroup selection",
    path: "/tsi/subgroup-selection",
  },
  {
    key: "subgroup-explain",
    label: "Subgroup Explain",
    path: "/tsi/subgroup-explain",
  },
  { key: "report", label: "Report", path: "/tsi/report" },
] as const;

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
  // refine-cutoffs는 subgroup-selection으로 돌아가야 함
  if (pathname === "/tsi/refine-cutoffs") {
    return "/tsi/subgroup-selection";
  }
  const index = getTSIActiveStepIndex(pathname);
  if (index <= 0) return null; // 첫 단계면 이전 없음 → 메인으로
  return TSI_BREADCRUMB_STEPS[index - 1].path;
}

/** TSI 헤더: ATS 헤더와 동일한 디자인(원형 16x16, 회색 화살표), 브레드크럼만 1~6 스텝으로 다름 */
export const TSIHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const activeStepIndex = getTSIActiveStepIndex(pathname);
  const [compact, setCompact] = useState(0);

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

  const iconSize = compact === 2 ? 14 : compact === 1 ? 15 : 16;
  const fontSize = compact === 2 ? "15px" : compact === 1 ? "18.5px" : "19.5px";
  const stepGap = compact === 2 ? "gap-[28px]" : compact === 1 ? "gap-[34px]" : "gap-[36px]";
  const innerGap = compact === 2 ? "gap-1" : compact === 1 ? "gap-[6px]" : "gap-2";

  return (
    <header className="sticky top-0 z-[90] mt-0 pt-0 mb-0 w-full bg-[#e7e5e7]">
      <div className="w-full h-[90px] px-[28px] py-[17px] flex justify-between items-center">
        {/* Left - Breadcrumb */}
        <div className={`flex items-center ${stepGap}`}>
          {/* 재생 아이콘 (ATS와 동일 - dark purple, 클릭 시 첫 스텝으로) */}

          {TSI_BREADCRUMB_STEPS.map((step, index) => {
            const isActive = activeStepIndex === index;
            const circleFill = isActive ? "#2D1067" : "#939090";

            return (
              <React.Fragment key={step.key}>
                {/* ATS와 동일: 스텝 사이에 회색 화살표 (첫 번째 스텝 앞에는 없음) */}
                {index > 0 && (
                  <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                  >
                    <rect width="16" height="16" rx="8" fill="#939090" />
                    <path
                      d="M10.8916 7.82715C10.8916 7.91504 10.874 7.99854 10.8389 8.07764C10.8066 8.15381 10.7539 8.22705 10.6807 8.29736L7.30127 11.6064C7.18701 11.7178 7.04785 11.7734 6.88379 11.7734C6.77832 11.7734 6.68018 11.7471 6.58936 11.6943C6.49854 11.6416 6.42529 11.5713 6.36963 11.4834C6.31689 11.3955 6.29053 11.2959 6.29053 11.1846C6.29053 11.0234 6.35205 10.8799 6.4751 10.7539L9.48535 7.82715L6.4751 4.90039C6.35205 4.77734 6.29053 4.63379 6.29053 4.46973C6.29053 4.36133 6.31689 4.26318 6.36963 4.17529C6.42529 4.08447 6.49854 4.0127 6.58936 3.95996C6.68018 3.90723 6.77832 3.88086 6.88379 3.88086C7.04785 3.88086 7.18701 3.93652 7.30127 4.04785L10.6807 7.35693C10.751 7.42725 10.8037 7.50049 10.8389 7.57666C10.874 7.65283 10.8916 7.73633 10.8916 7.82715Z"
                      fill="white"
                    />
                  </svg>
                )}
                <button
                  onClick={() => router.push(step.path)}
                  className={`flex items-center ${innerGap} hover:opacity-70 transition-opacity cursor-pointer`}
                >
                  {/* ATS와 동일: 16x16 원형, 흰색 숫자 */}
                  <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                  >
                    <rect width="16" height="16" rx="8" fill={circleFill} />
                    <text
                      x="7.75"
                      y="9"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
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
                  <span className={`font-semibold tracking-[-0.78px] whitespace-nowrap ${isActive ? "text-[#2D1067]" : "text-[#787776]"}`} style={{ fontSize }}>
                    {step.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right - 뒤로가기(전단계), 도움말 */}
        <div className="flex items-center gap-0">
          <button
            onClick={() => {
              const prevPath = getTSIPreviousStepPath(pathname);
              if (prevPath) {
                router.push(prevPath);
              } else {
                router.push("/");
              }
            }}
            className="relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0 hover:opacity-70 transition-opacity"
            style={{ backgroundImage: "url('/assets/sidebar-folder-button.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#262255" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            title="Help"
            className="relative w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer p-0"
            style={{ backgroundImage: "url('/assets/sidebar-folder-button.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
          >
            <span className="relative z-10 text-[#262255] font-bold text-[22px] leading-none">?</span>
          </button>
        </div>
      </div>
    </header>
  );
};
