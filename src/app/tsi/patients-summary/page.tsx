"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPatientSummary, type PatientSummaryData } from "@/services/subgroup-service";

/**
 * TSI Step 2: Patients Summary
 * 피그마: [FLT-003] Patients Summary - 8
 */

// TODO(taskId): Replace this temporary value with the real taskId source
// (e.g. simulation creation response, store, or query param) once defined.
const MOCK_TASK_ID = "test-task-id";

export default function TSIPatientsSummaryPage() {
  const router = useRouter();
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

  const formatUpToTwoDecimals = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

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

  const displayNumberAnalyzed = patientSummaryData?.number_analyzed || 0;
  const displayTotalCount = patientSummaryData?.full_cohort_n || 0;
  const displayFilteredCount = patientSummaryData?.filtered_cohort_n || 0;
  const displayConversionPercent = patientSummaryData?.conversion_percent || 0;

  return (
  <AppLayout headerType="tsi" scaleMode="fit" >
      
        {/* Liquid Glass Main Container */}
        <div
           className="relative overflow-hidden rounded-[36px] flex-1 min-h-0 flex flex-col" style={{borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", marginLeft:"12px", marginRight:"20px", marginBottom:"8px"}}
          >
            <div style={{ display: "flex", flexDirection: "column", width:"full", height: "100%", gap: 60 }}>
        {/* Title + Info Block */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4" style={{ padding: "4px 4px 0 8px" }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0 }}>
              Patients Summary
            </h1>
          </div>
        </div>

            {/* Table + Button wrapper */}
            <div className="flex flex-1 min-h-0 flex-col" style={{ gap: 12 }}>
            {/* Table Section */}
            <div className="relative flex flex-col overflow-y-auto flex-1 min-h-0">
              {/* Table Header */}
              <div className="mb-0">
                {/* 텍스트 헤더 행 */}
                <div className="grid grid-cols-4 gap-0 px-[12px]" style={{ alignItems: "end" }}>
                  {/* Baseline Characteristics */}
                  <div className="text-body4 text-neutral-30">Baseline Characteristics</div>
                  <div />
                  {/* Full Cohort */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-body3 text-neutral-30 flex-shrink-0" style={{ fontWeight: 590, fontSize: 15 }}>
                      Full Cohort
                    </span>
                    <span className="text-body5 text-neutral-60">
                      N (%) or mean ± sd (min, max)
                    </span>
                  </div>
                  {/* Filtered Cohort */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-body3 text-neutral-30 flex-shrink-0" style={{ fontWeight: 590, fontSize: 15 }}>
                      Filtered Cohort
                    </span>
                    <span className="text-body5 text-neutral-60">
                      N (%) or mean ± sd (min, max)
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-y-auto flex flex-col rounded-[16px]" style={{ marginTop: 8 }}>
                {/* 숫자 요약 행 */}
                <div className="bg-primary-15 grid grid-cols-4 items-start gap-0 px-3 pt-2 pb-1 rounded-[16px]">
                  <div className="flex flex-row h-full text-body3m text-white items-start gap-2">
                     <div className="text-[17px] font-semibold text-white self-center">Number Analyzed </div>
                     <div className="text-[17px] font-semibold text-white self-center">{displayFilteredCount.toLocaleString()} participants</div>
                  </div>
                  <div />
                  <div className="grid grid-cols-[80px_54px] h-full items-start">
                    <div className="text-body4m tabular-nums text-neutral-98 self-center">{displayTotalCount.toLocaleString()}</div>
                    <div className="text-body1m tabular-nums text-neutral-98 text-right">100<span className="text-[15px]">%</span></div>
                  </div>
                  <div className="grid grid-cols-[80px_54px] h-full items-start">
                    <div className="text-body4m tabular-nums text-primary-90 self-center">{displayFilteredCount.toLocaleString()}</div>
                    <div className="text-body1m tabular-nums text-primary-90 text-right">{displayConversionPercent}<span className="text-[15px]">%</span></div>
                  </div>
                </div>
                {/* 카테고리 카드 목록 */}
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
                  baselineData.map((category, categoryIndex) => {
                    return (
                      <div
                        key={categoryIndex}
                        className="mt-2 rounded-[16px] bg-white"
                      >
                        <div className="flex flex-col pt-[12px] px-[12px] pb-[8px]">
                          {/* Category Header Row */}
                          <div className="border-neutral-80 grid grid-cols-4 h-full items-end border-b gap-0 pb-1">
                            {/* Category Label */}
                            <div className="flex h-full items-end">
                              <div className="text-body2 text-neutral-30 items-end">{category.category}</div>
                            </div>
                            {/* Empty space for conversion rate */}
                            <div />
                            {/* Full Cohort Header */}
                            <div className="grid grid-cols-[80px_54px] items-end h-full">
                              <div className="text-body5m text-left text-neutral-50 items-end">Value</div>
                              <div className="text-body5m text-right text-neutral-50 items-end">Value%</div>
                            </div>
                            {/* Filtered Cohort Header */}
                            <div className="grid grid-cols-[80px_54px] items-end h-full">
                              <div className="text-body5m text-left text-primary-50 items-end">Value</div>
                              <div className="text-body5m text-right text-primary-50 items-end">Value%</div>
                            </div>
                          </div>
                          {/* Category Items */}
                          {category.items.map((item, itemIndex) => {
                            const isLast = itemIndex === category.items.length - 1;
                            return (
                              <div
                                key={itemIndex}
                                className={`grid grid-cols-4 h-full pt-2 pb-1 items-center gap-0 ${!isLast ? "border-neutral-80 border-b" : ""}`}
                              >
                                {/* Item Label */}
                                <div className="flex h-full items-center">
                                  <div className="text-body4m text-[#929090]">{item.label}</div>
                                </div>
                                {/* Empty space for conversion rate */}
                                <div />
                                {/* Full Cohort Value */}
                                <div className="grid grid-cols-[80px_54px] items-center h-full">
                                  <div className="text-body4m text-left tabular-nums text-neutral-50">
                                    {item.fullCohort.value}
                                  </div>
                                  <div className="text-body4m text-right tabular-nums text-neutral-50">
                                    {item.fullCohort.percent}
                                  </div>
                                </div>
                                {/* Filtered Cohort Value */}
                                <div className="grid grid-cols-[80px_54px] items-center h-full">
                                  <div className="text-body4m text-left tabular-nums text-primary-50">
                                    {item.filteredCohort.value}
                                  </div>
                                  <div className="text-body4m text-right tabular-nums text-primary-50">
                                    {item.filteredCohort.percent}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })
                  )}
              </div>
            </div>
          {/* 하단 버튼 바 */}
          <div className="flex flex-shrink-0 items-center justify-end gap-4" style={{ paddingRight: 8 }}>
            <button type="button" className="btn-tsi btn-tsi-secondary">
              Save Simulation
            </button>
            <button type="button" onClick={handleGoToBasisSelection} className="btn-tsi btn-tsi-primary" style={{ paddingRight: 18, gap: 8 }}>
              Identify Subgroup
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M4 3L13 8L4 13V3Z" fill="white"/>
              </svg>
            </button>
          </div>
            </div>{/* Table + Button wrapper 닫기 */}
            </div>
        </div>
    </AppLayout>
  );
}
