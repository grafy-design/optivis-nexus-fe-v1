"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPatientSummary, type PatientSummaryData } from "@/services/subgroup-service";

/**
 * TSI Step 2: Patients Summary
 * 피그마: [FLT-003] Patients Summary - 8
 */

const MOCK_TASK_ID = "test-task-id";

export default function TSIPatientsSummaryPage() {
  const router = useRouter();
  const taskId = MOCK_TASK_ID;
  const [patientSummaryData, setPatientSummaryData] = useState<PatientSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simDesc, setSimDesc] = useState("");

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

  const formatUpToTwoDecimals = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const handleGoToBasisSelection = () => {
    const query = new URLSearchParams({ taskId });
    router.push(`/tsi/basis-selection?${query.toString()}`);
  };

  const baselineData =
    patientSummaryData?.baseline_characteristics
      .filter((category) => category.category.toLowerCase() !== "gender")
      .map((category) => ({
        category: category.category_display || category.category,
        items: category.items.map((item) => ({
          label: item.group_name,
          fullCohort: {
            value: formatUpToTwoDecimals(item.full_cohort_n),
            percent: `${formatUpToTwoDecimals(item.full_cohort_pct)}%`,
          },
          filteredCohort: {
            value: formatUpToTwoDecimals(item.filtered_cohort_n),
            percent: `${formatUpToTwoDecimals(item.filtered_cohort_pct)}%`,
          },
        })),
      })) || [];

  const displayTotalCount = patientSummaryData?.full_cohort_n || 0;
  const displayFilteredCount = patientSummaryData?.filtered_cohort_n || 0;
  const displayConversionPercent = patientSummaryData?.conversion_percent || 0;

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      {/* 외부 래퍼 */}
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 28px)", height: "100%", marginLeft: "14px", marginRight: "14px", paddingBottom: "24px" }}>

        {/* 메인 컨테이너 */}
        <div className="relative overflow-hidden flex-1 min-h-0 flex flex-col gap-[24px]">

          {/* 1. 타이틀 */}
          <div className="flex flex-shrink-0 items-start justify-between gap-4" style={{ padding: "0px 12px 0 12px" }}>
            <div style={{ flexShrink: 0 }}>
              <h1 style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0 }}>
                Patients Summary
              </h1>
              <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
                Simulation templates are provided to show the required input structure. Please review before proceeding.
              </span>
            </div>
          </div>

          {/* 2. gap-0 컨테이너 */}
          <div className="flex flex-1 min-h-0 flex-col gap-0">

          {/* 2-1. 글래스 컨테이너 */}
          <div className="flex flex-1 min-h-0 flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: 12 }}>

            {/* 1. 숫자 요약 행 */}
            <div className="flex flex-row items-baseline gap-0 px-[12px] flex-shrink-0">
              <span className="text-body4m tabular-nums text-primary-50" style={{ fontSize: 28, fontWeight: 700 }}>{displayConversionPercent}</span>
              <span className="text-[17px] font-semibold text-primary-50">%</span>
              <span className="text-body4 text-neutral-50 mx-2">converted</span>
              <span className="text-[17px] font-semibold text-neutral-40">(</span>
              <span className="text-body4m tabular-nums text-neutral-40" style={{ fontSize: 20, fontWeight: 700 }}>{displayFilteredCount.toLocaleString()}</span>
              <span className="text-[17px] font-semibold text-neutral-40">/</span>
              <span className="text-body4m tabular-nums text-neutral-40" style={{ fontSize: 20, fontWeight: 700 }}>{displayTotalCount.toLocaleString()}</span>
              <span className="text-[17px] font-semibold text-neutral-40">)</span>
            </div>

            {/* 2. 테이블 헤더 + 바디 컨테이너 (gap-1) */}
            <div className="flex flex-1 min-h-0 flex-col gap-1">

              {/* 2-1. Table Header */}
              <div className="flex-shrink-0">
                <div className="grid grid-cols-4 gap-0 px-[12px]" style={{ alignItems: "end" }}>
                  <div className="text-body4 text-neutral-30">Baseline Characteristics</div>
                  <div />
                  <div className="flex items-baseline gap-2">
                    <span className="text-body3 text-neutral-30 flex-shrink-0" style={{ fontWeight: 590, fontSize: 15 }}>Full Cohort</span>
                    <span className="text-body5 text-neutral-60">N (%) or mean ± sd (min, max)</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-body3 text-neutral-30 flex-shrink-0" style={{ fontWeight: 590, fontSize: 15 }}>Filtered Cohort</span>
                    <span className="text-body5 text-neutral-60">N (%) or mean ± sd (min, max)</span>
                  </div>
                </div>
              </div>

              {/* 2-2. Table Body */}
              <div className="relative flex flex-col overflow-y-auto flex-1 min-h-0">
                <div className="overflow-y-auto flex flex-col gap-2">
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
                    baselineData.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="rounded-[16px] bg-white">
                        <div className="flex flex-col pt-[12px] px-[12px] pb-[8px]">
                          <div className="border-neutral-80 grid grid-cols-4 h-full items-end border-b gap-0 pb-1">
                            <div className="flex h-full items-end">
                              <div className="text-body2 text-neutral-30 items-end">{category.category}</div>
                            </div>
                            <div />
                            <div className="grid grid-cols-[80px_54px] items-end h-full">
                              <div className="text-body5m text-left text-neutral-50 items-end">Value</div>
                              <div className="text-body5m text-right text-neutral-50 items-end">Value%</div>
                            </div>
                            <div className="grid grid-cols-[80px_54px] items-end h-full">
                              <div className="text-body5m text-left text-primary-50 items-end">Value</div>
                              <div className="text-body5m text-right text-primary-50 items-end">Value%</div>
                            </div>
                          </div>
                          {category.items.map((item, itemIndex) => {
                            const isLast = itemIndex === category.items.length - 1;
                            return (
                              <div
                                key={itemIndex}
                                className={`grid grid-cols-4 h-full pt-2 pb-1 items-center gap-0 ${!isLast ? "border-neutral-80 border-b" : ""}`}
                              >
                                <div className="flex h-full items-center">
                                  <div className="text-body4m text-[#929090]">{item.label}</div>
                                </div>
                                <div />
                                <div className="grid grid-cols-[80px_54px] items-center h-full">
                                  <div className="text-body4m text-left tabular-nums text-neutral-50">{item.fullCohort.value}</div>
                                  <div className="text-body4m text-right tabular-nums text-neutral-50">{item.fullCohort.percent}</div>
                                </div>
                                <div className="grid grid-cols-[80px_54px] items-center h-full">
                                  <div className="text-body4m text-left tabular-nums text-primary-50">{item.filteredCohort.value}</div>
                                  <div className="text-body4m text-right tabular-nums text-primary-50">{item.filteredCohort.percent}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>{/* 2. gap-1 컨테이너 닫기 */}

          </div>{/* 2-1. 글래스 컨테이너 닫기 */}

          {/* 2-2. 버튼 컨테이너 */}
          <div className="flex flex-shrink-0 items-center justify-end gap-4" style={{ paddingRight: 8 }}>
            <button type="button" className="btn-tsi btn-tsi-secondary" onClick={() => setShowSaveModal(true)}>
              Save Simulation
            </button>
            <button type="button" onClick={handleGoToBasisSelection} className="btn-tsi btn-tsi-primary" style={{ paddingRight: 18, gap: 8 }}>
              Identify Subgroup
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M4 3L13 8L4 13V3Z" fill="white"/>
              </svg>
            </button>
          </div>

          </div>{/* 2. gap-0 컨테이너 닫기 */}

        </div>{/* 메인 컨테이너 닫기 */}

      </div>{/* 외부 래퍼 닫기 */}

      {/* Save Simulation 모달 */}
      {showSaveModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "660px", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "24px", pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "24px", background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "24px", background: "rgba(255,255,255,0.88)" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "24px", background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
            </div>
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "24px", color: "#262625", letterSpacing: "-0.72px", lineHeight: 1.2, margin: 0 }}>Study Title</p>
                <input type="text" value={simName} onChange={(e) => setSimName(e.target.value)} placeholder="Write a title"
                  style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#787776", letterSpacing: "-0.51px", lineHeight: 1.05, background: "none", border: "none", outline: "none", padding: 0, width: "100%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "24px", color: "#262625", letterSpacing: "-0.72px", lineHeight: 1.2, margin: 0 }}>Date</p>
                <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#787776", letterSpacing: "-0.51px", lineHeight: 1.05, margin: 0 }}>
                  {new Date().toISOString().replace("T", " ").slice(0, 19)}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "24px", color: "#262625", letterSpacing: "-0.72px", lineHeight: 1.2, margin: 0 }}>Description</p>
                <div style={{ background: "#d9d9d9", borderRadius: "16px", padding: "0 20px", height: "56px", display: "flex", alignItems: "center" }}>
                  <input type="text" value={simDesc} onChange={(e) => setSimDesc(e.target.value.slice(0, 30))} placeholder="Please enter a description."
                    style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "19.5px", color: "#787776", letterSpacing: "-0.585px", background: "none", border: "none", outline: "none", width: "100%" }} />
                </div>
              </div>
            </div>
            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "12px", justifyContent: "center" }}>
              <button type="button" onClick={() => setShowSaveModal(false)}
                style={{ width: "180px", height: "48px", borderRadius: "36px", border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#231f52", letterSpacing: "-0.51px", background: "rgba(255,255,255,0.92)", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
                Close
              </button>
              <button type="button" onClick={() => setShowSaveModal(false)}
                style={{ width: "180px", height: "48px", borderRadius: "36px", border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#ffffff", letterSpacing: "-0.51px", background: "#231f52", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
