"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getPatientSummary,
  type BaselineCharacteristicItem,
  type PatientSummaryData,
} from "@/services/subgroup-service";

/**
 * TSI Step 2: Patients Summary
 * 피그마: [FLT-003] Patients Summary - 8
 */

// TODO(taskId): Replace this temporary value with the real taskId source
// (e.g. simulation creation response, store, or query param) once defined.
const MOCK_TASK_ID = "test-task-id";

function AnimatedNumber({
  value,
  format,
  duration = 700,
}: {
  value: number;
  format: (v: number) => string;
  duration?: number;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let raf = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [duration, value]);

  return <>{format(current)}</>;
}

export default function TSIPatientsSummaryPage() {
  const router = useRouter();
  const [titleFontSize, setTitleFontSize] = useState(42);

  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // TODO(taskId): Remove this alias after wiring the real taskId source.
  const taskId = MOCK_TASK_ID;
  const [patientSummaryData, setPatientSummaryData] = useState<PatientSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 마운트 시 API 호출
  useEffect(() => {
    const fetchPatientSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getPatientSummary(taskId);
        setPatientSummaryData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Patient Summary 조회에 실패했습니다.");
        console.error("Patient Summary API 호출 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientSummary();
  }, [taskId]);

  const formatCount = (value: number) =>
    Math.round(value).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });

  const formatPercentage = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const shouldHideEmptyUnknownRow = (item: BaselineCharacteristicItem) => {
    const normalizedLabel = item.group_name.trim().toLowerCase();
    return normalizedLabel === "unknown" && item.full_cohort_n <= 0 && item.filtered_cohort_n <= 0;
  };

  const handleGoToBasisSelection = () => {
    const query = new URLSearchParams({ taskId });
    router.push(`/tsi/basis-selection?${query.toString()}`);
  };

  // API 데이터를 UI 데이터 구조로 변환 (Gender 제외)
  const baselineData =
    patientSummaryData?.baseline_characteristics
      .filter((category) => category.category.toLowerCase() !== "gender")
      .map((category) => ({
        category: category.category_display || category.category,
        items: category.items
          .filter((item) => !shouldHideEmptyUnknownRow(item))
          .map((item) => ({
            label: item.group_name,
            fullCohort: {
              value: item.full_cohort_n,
              percent: item.full_cohort_pct,
            },
            filteredCohort: {
              value: item.filtered_cohort_n,
              percent: item.filtered_cohort_pct,
            },
          })),
      }))
      .filter((category) => category.items.length > 0) || [];

  const displayNumberAnalyzed = patientSummaryData?.number_analyzed || 0;
  const displayConversionPercent = patientSummaryData?.conversion_percent || 0;
  const displayFilteredCount = patientSummaryData?.filtered_cohort_n || 0;
  const displayTotalCount = patientSummaryData?.full_cohort_n || 0;

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          marginLeft: "14px",
          marginRight: "14px",
          paddingBottom: 24,
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col gap-[24px] overflow-hidden">
          <div
            className="flex flex-shrink-0 items-start justify-between gap-4"
            style={{ padding: "0px 12px 0 12px" }}
          >
            <div style={{ flexShrink: 0 }}>
              <h1
                style={{
                  fontFamily: "Poppins, Inter, sans-serif",
                  fontSize: titleFontSize,
                  fontWeight: 600,
                  color: "rgb(17,17,17)",
                  letterSpacing: "-1.5px",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Cohort Summary
              </h1>
              <span
                style={{
                  fontFamily: "Inter",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "rgb(120,119,118)",
                  letterSpacing: "-0.48px",
                }}
              >
                Simulation templates are provided to show the required input structure. Please
                review before proceeding.
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-0">
            <div
              className="flex min-h-0 flex-1 flex-col gap-0.5"
              style={{
                borderImage:
                  'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
                borderStyle: "solid",
                borderTopWidth: "20px",
                borderBottomWidth: "28px",
                borderLeftWidth: "24px",
                borderRightWidth: "24px",
                borderColor: "transparent",
              }}
            >
              <div className="h-wrap -mt-2 mr-0.5 mb-1 flex flex-shrink-0 flex-row items-baseline justify-end gap-0 px-[4px]">
                <div className="h-wrap text-body4 pr-[16px] text-neutral-50">
                  Number Analyzed{" "}
                  <AnimatedNumber value={displayNumberAnalyzed} format={formatCount} /> participants
                </div>
                <div className="h-wrap">
                  <span className="text-body4 text-neutral-50">
                    <AnimatedNumber value={displayConversionPercent} format={formatPercentage} />%
                  </span>
                  <span className="text-body5 mx-1 text-neutral-50">
                    converted (
                    <AnimatedNumber value={displayFilteredCount} format={formatCount} />/
                    <AnimatedNumber value={displayTotalCount} format={formatCount} />)
                  </span>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div
                  className="flex w-full items-center rounded-[16px] py-[8px]"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  <div
                    className="grid w-full grid-cols-4 px-[12px]"
                    style={{ alignItems: "center" }}
                  >
                    <div className="text-body3m text-neutral-99">Baseline Characteristics</div>
                    <div />
                    <div className="grid grid-cols-[1fr_1fr_1fr]">
                      <div className="col-span-2 flex flex-col items-end">
                        <div className="text-body3m text-neutral-99">Full Cohort</div>
                        <div className="text-body5 text-neutral-80 -mt-0.5">
                          N (%) or mean ± sd (min, max)
                        </div>
                      </div>
                      <div />
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1fr]">
                      <div className="col-span-2 flex flex-col items-end">
                        <div className="text-body3m text-neutral-99">Filtered Cohort</div>
                        <div className="text-body5 text-neutral-80 -mt-0.5">
                          N (%) or mean ± sd (min, max)
                        </div>
                      </div>
                      <div />
                    </div>
                  </div>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
                  {isLoading ? (
                    <div className="mt-2 flex h-full items-center justify-center">
                      <div className="text-body3 text-neutral-50">Loading...</div>
                    </div>
                  ) : error ? (
                    <div className="mt-2 flex h-full items-center justify-center">
                      <div className="text-body3 text-red-500">Error: {error}</div>
                    </div>
                  ) : baselineData.length === 0 ? (
                    <div className="mt-2 flex h-full items-center justify-center">
                      <div className="text-body3 text-neutral-50">No data available</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto">
                      {baselineData.map((category, categoryIndex) => (
                        <div
                          key={categoryIndex}
                          className="overflow-hidden rounded-[16px] bg-white"
                        >
                          <div className="flex flex-col px-[12px] pt-[12px] pb-[8px]">
                            <div className="border-neutral-80 grid h-full grid-cols-4 items-end gap-0 border-b pb-1">
                              <div className="flex h-full items-end">
                                <div className="text-body2 text-neutral-30">
                                  {category.category}
                                </div>
                              </div>
                              <div />
                              <div className="grid h-full grid-cols-[1fr_1fr_1fr] items-end">
                                <div className="text-body5m text-right text-neutral-50">
                                  Patients
                                </div>
                                <div className="text-body5m text-right text-neutral-50">%</div>
                                <div />
                              </div>
                              <div className="grid h-full grid-cols-[1fr_1fr_1fr] items-end">
                                <div className="text-body5m text-primary-50 text-right">
                                  Patients
                                </div>
                                <div className="text-body5m text-primary-50 text-right">%</div>
                                <div />
                              </div>
                            </div>

                            {category.items.map((item, itemIndex) => {
                              const isLast = itemIndex === category.items.length - 1;
                              return (
                                <div
                                  key={itemIndex}
                                  className={`grid h-full grid-cols-4 items-center gap-0 pt-2 pb-1 ${
                                    !isLast ? "border-neutral-80 border-b" : ""
                                  }`}
                                >
                                  <div className="flex h-full items-center">
                                    <div className="text-body4m text-[#929090]">{item.label}</div>
                                  </div>
                                  <div />
                                  <div className="grid h-full grid-cols-[1fr_1fr_1fr] items-center">
                                    <div className="text-body4m text-right text-neutral-50 tabular-nums">
                                      <AnimatedNumber
                                        value={item.fullCohort.value}
                                        format={formatCount}
                                      />
                                    </div>
                                    <div className="text-body4m text-right text-neutral-50 tabular-nums">
                                      <AnimatedNumber
                                        value={item.fullCohort.percent}
                                        format={(value) => `${formatPercentage(value)}%`}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid h-full grid-cols-[1fr_1fr_1fr] items-center">
                                    <div className="text-body4m text-primary-50 text-right tabular-nums">
                                      <AnimatedNumber
                                        value={item.filteredCohort.value}
                                        format={formatCount}
                                      />
                                    </div>
                                    <div className="text-body4m text-primary-50 text-right tabular-nums">
                                      <AnimatedNumber
                                        value={item.filteredCohort.percent}
                                        format={(value) => `${formatPercentage(value)}%`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center justify-end gap-4 pr-[8px]">
              <button
                type="button"
                style={{
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: 36,
                  background: "#787776",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.45px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Save Process
              </button>
              <button
                type="button"
                onClick={handleGoToBasisSelection}
                style={{
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 18,
                  borderRadius: 36,
                  background: "#F06600",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.45px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                Identify Subgroup
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M4 3L13 8L4 13V3Z" fill="white" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
