"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button";

/** TSI 브레드크럼 스텝 (기존 ATS 헤더와 동일한 원형·화살표 스타일, 숫자 1~6) */
const TSI_BREADCRUMB_STEPS = [
  {
    key: "default-settings",
    label: "Default Settings",
    path: "/tsi",
  },
  {
    key: "patients-summary",
    label: "Cohort Summary",
    path: "/tsi/patients-summary",
  },
  {
    key: "basis-selection",
    label: "Subgroup Configuration",
    path: "/tsi/basis-selection",
  },
  {
    key: "subgroup-selection",
    label: "Target Subgroup Identification",
    path: "/tsi/subgroup-selection",
  },
  {
    key: "subgroup-explain",
    label: "Subgroup Determinants Analysis",
    path: "/tsi/subgroup-explain",
  },
  { key: "report", label: "Subgroup Analysis Report", path: "/tsi/report" },
] as const;

/** pathname → 활성 스텝 인덱스 (Default Settings = /tsi, /tsi/filter 둘 다 step 0) */
function getTSIActiveStepIndex(pathname: string): number {
  if (pathname === "/tsi/report" || /^\/tsi\/[^/]+\/report$/.test(pathname)) return 5;
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

type QueryGetter = {
  get: (key: string) => string | null;
};

const getTsiReportFeatureStorageKey = (taskId: string, subgroupId: string): string =>
  `tsi:report-feature:${taskId}:${subgroupId}`;

function getTsiReportPath(query: QueryGetter, reportFeature: string | null): string | null {
  const taskId = query.get("taskId");
  const subgroupId = query.get("subgroupId");

  if (!taskId || !subgroupId || !reportFeature) {
    return null;
  }

  const nextQuery = new URLSearchParams({
    taskId,
    subgroupId,
  });

  return `/tsi/${encodeURIComponent(reportFeature)}/report?${nextQuery.toString()}`;
}

function withTsiContextQuery(path: string, query: QueryGetter): string {
  if (!path.startsWith("/tsi")) {
    return path;
  }

  const nextQuery = new URLSearchParams();
  const taskId = query.get("taskId");
  const setNo = query.get("setNo");

  if (taskId) {
    nextQuery.set("taskId", taskId);
  }
  if (path === "/tsi/subgroup-selection" && setNo) {
    nextQuery.set("setNo", setNo);
  }

  const queryString = nextQuery.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** TSI 헤더: ATS 헤더와 동일한 디자인(원형 16x16, 회색 화살표), 브레드크럼만 1~6 스텝으로 다름 */
export const TSIHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStepIndex = getTSIActiveStepIndex(pathname);
  const [compact, setCompact] = useState(0);
  const [reportFeature, setReportFeature] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      if (width < 1470) {
        setCompact(2);
      } else if (width < 1688) {
        setCompact(1);
      } else {
        setCompact(0);
      }
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const syncReportFeature = () => {
      const taskId = searchParams.get("taskId");
      const subgroupId = searchParams.get("subgroupId");

      if (!taskId || !subgroupId) {
        setReportFeature(null);
        return;
      }

      const storedFeature = window.sessionStorage.getItem(
        getTsiReportFeatureStorageKey(taskId, subgroupId)
      );
      setReportFeature(storedFeature);
    };

    syncReportFeature();
    window.addEventListener("tsi-report-feature-change", syncReportFeature);
    window.addEventListener("storage", syncReportFeature);
    return () => {
      window.removeEventListener("tsi-report-feature-change", syncReportFeature);
      window.removeEventListener("storage", syncReportFeature);
    };
  }, [pathname, searchParams]);

  const iconSize = compact === 2 ? 14 : compact === 1 ? 15 : 16;
  const fontSize = compact === 2 ? "12.5px" : compact === 1 ? "13.5px" : "14.5px";
  const stepGap = compact === 2 ? "gap-[16px]" : compact === 1 ? "gap-[20px]" : "gap-[24px]";
  const innerGap = compact === 2 ? "gap-1" : compact === 1 ? "gap-[6px]" : "gap-2";
  const labelMaxWidth = compact === 2 ? "96px" : compact === 1 ? "112px" : "128px";

  return (
    <header className="sticky top-0 z-[90] mt-0 pt-0 mb-0 w-full bg-[#e7e5e7]">
      <div className="w-full h-[90px] px-[28px] py-[17px] flex justify-between items-center">
        {/* Left - Breadcrumb */}
        <div className={`flex min-w-0 items-center ${stepGap}`}>
          {/* 재생 아이콘 (ATS와 동일 - dark purple, 클릭 시 첫 스텝으로) */}

          {TSI_BREADCRUMB_STEPS.map((step, index) => {
            const isActive = activeStepIndex === index;
            const isFutureStep = index > activeStepIndex;
            const reportPath = step.key === "report" ? getTsiReportPath(searchParams, reportFeature) : null;
            const isReportStepEnabled =
              step.key === "report" && pathname === "/tsi/subgroup-explain" && Boolean(reportPath);
            const isDisabled = isFutureStep && !isReportStepEnabled;
            const circleFill = isActive ? "#2D1067" : "#939090";
            const textColor = isActive ? "text-[#2D1067]" : "text-[#787776]";

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
                <Button
                  unstyled
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    if (step.key === "report" && reportPath) {
                      router.push(reportPath);
                      return;
                    }
                    router.push(withTsiContextQuery(step.path, searchParams));
                  }}
                  className={`flex min-w-0 items-center ${innerGap} transition-opacity ${isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-70"} ${textColor}`}
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
                  <span
                    className="font-semibold tracking-[-0.36px] leading-[1.05] text-left"
                    style={{
                      fontSize,
                      maxWidth: labelMaxWidth,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {step.label}
                  </span>
                </Button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right - 뒤로가기(전단계), 도움말 */}
        <div className="flex items-center gap-0">
          <button
            aria-label="Go to previous TSI step"
            onClick={() => {
              const prevPath = getTSIPreviousStepPath(pathname);
              if (prevPath) {
                router.push(withTsiContextQuery(prevPath, searchParams));
              } else {
                router.push("/");
              }
            }}
            className="relative flex h-[55px] w-[55px] cursor-pointer items-center justify-center border-none p-0 transition-opacity hover:opacity-70"
            style={{
              backgroundImage: "url('/assets/sidebar-folder-button.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="relative z-10"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="#262255"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            aria-label="Help"
            title="Help"
            className="relative flex h-[55px] w-[55px] cursor-pointer items-center justify-center border-none p-0"
            style={{
              backgroundImage: "url('/assets/sidebar-folder-button.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="relative z-10 text-[22px] leading-none font-bold text-[#262255]">?</span>
          </button>
        </div>
      </div>
    </header>
  );
};
