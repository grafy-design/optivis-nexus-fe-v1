"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Button from "@/components/ui/button";
import Image from "next/image";
import { getPatientSummary, type PatientSummaryData } from "@/services/subgroupService";

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
            value: item.full_cohort_n.toLocaleString(),
            percent: `${item.full_cohort_pct.toFixed(1)}%`,
          },
          filteredCohort: {
            value: item.filtered_cohort_n.toLocaleString(),
            percent: `${item.filtered_cohort_pct.toFixed(1)}%`,
          },
        })),
      })) || [];

  const displayNumberAnalyzed = patientSummaryData?.number_analyzed || 0;
  const displayConversionRate = patientSummaryData?.conversion_label || "";

  return (
    <AppLayout headerType="tsi">
      <div className="flex w-full flex-col items-center">
        <div className="mx-auto h-[1094px] w-[1772px] flex-shrink-0">
          {/* Liquid Glass Main Container */}
          <div
            className="relative h-full w-full overflow-hidden rounded-[36px]"
            style={{
              backgroundImage: "url(/assets/tsi/default-setting-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="relative flex h-full flex-col p-6">
              {/* Header Section */}
              <div className="mb-8 flex items-start justify-between">
                {/* Title layout */}
                <div className="flex flex-col gap-2">
                  <div className="text-title text-neutral-5">Patient Summary</div>
                  <div className="text-body2m text-neutral-50">
                    Number Analyzed {displayNumberAnalyzed} participants
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Save Simulation Button - 왼쪽 */}
                  <button
                    className="text-primary-15 text-body3 flex h-[48px] w-[202px] cursor-pointer items-center justify-center gap-2 rounded-[100px] bg-cover bg-center bg-no-repeat transition-opacity hover:opacity-90"
                    style={{
                      backgroundImage: "url(/assets/tsi/save-btn.png)",
                    }}
                  >
                    Save Simulation
                    <Image
                      src="/assets/tsi/check.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </button>
                  {/* Identify Subgroup Button - 오른쪽 */}
                  <Button
                    variant="orange"
                    size="md"
                    onClick={handleGoToBasisSelection}
                    className="bg-secondary-60 text-body3 h-[42px] w-[208px] rounded-[100px] text-white"
                    icon="play"
                    iconPosition="right"
                  >
                    Identify Subgroup
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Table Header */}
                <div className="mb-0 h-[44px]">
                  <div className="flex items-center" style={{ gap: "24px" }}>
                    {/* Baseline Characteristics */}
                    <div className="flex h-[34px] w-[405px] items-center px-[30px]">
                      <div className="text-body2 text-neutral-5">Baseline Characteristics</div>
                    </div>
                    {/* Conversion Rate */}
                    <div className="flex h-[34px] w-[405px] items-center">
                      <div className="text-body2m text-neutral-60">{displayConversionRate}</div>
                    </div>
                    {/* Full Cohort */}
                    <div className="flex h-[42px] w-[405px] flex-col justify-center">
                      <div className="text-body1 text-neutral-30 mb-1" style={{ fontWeight: 590 }}>
                        Full Cohort
                      </div>
                      <div className="text-body5 text-neutral-60">
                        N (%) or mean ± sd (min, max)
                      </div>
                    </div>
                    {/* Filtered Cohort */}
                    <div className="flex h-[42px] w-[405px] flex-col justify-center">
                      <div className="text-body1 text-neutral-30 mb-1" style={{ fontWeight: 590 }}>
                        Filtered Cohort
                      </div>
                      <div className="text-body5 text-neutral-60">
                        N (%) or mean ± sd (min, max)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-body2 text-neutral-50">Loading...</div>
                    </div>
                  ) : error ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-body2 text-red-500">Error: {error}</div>
                    </div>
                  ) : baselineData.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-body2 text-neutral-50">No data available</div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col gap-3">
                      {baselineData.map((category, categoryIndex) => (
                        <div
                          key={categoryIndex}
                          className="overflow-hidden rounded-[16px] bg-white"
                        >
                          <div className="flex flex-col p-[18px] px-[30px]">
                            {/* Category Header Row */}
                            <div
                              className="border-neutral-80 flex h-[44px] items-center border-b"
                              style={{
                                gap: "24px",
                              }}
                            >
                              {/* Category Label */}
                              <div className="flex h-full w-[405px] items-center px-[0px]">
                                <div className="text-body2 text-neutral-5">{category.category}</div>
                              </div>
                              {/* Empty space for conversion rate */}
                              <div className="w-[405px] px-[0px]" />
                              {/* Full Cohort Header */}
                              <div className="flex h-full w-[405px] items-center gap-2 px-[0px]">
                                <div className="text-body3m text-neutral-50">Value</div>
                                <div className="text-body3m text-neutral-50">Value%</div>
                              </div>
                              {/* Filtered Cohort Header */}
                              <div className="flex h-full w-[405px] items-center gap-2 px-[0px]">
                                <div className="text-body3m text-neutral-5">Value</div>
                                <div className="text-body3m text-primary-60">Value%</div>
                              </div>
                            </div>
                            {/* Category Items */}
                            {category.items.map((item, itemIndex) => {
                              const isLast = itemIndex === category.items.length - 1;
                              return (
                                <div
                                  key={itemIndex}
                                  className={`flex h-[44px] items-center ${
                                    !isLast ? "border-neutral-80 border-b" : ""
                                  }`}
                                  style={{
                                    gap: "24px",
                                  }}
                                >
                                  {/* Item Label */}
                                  <div className="flex h-full w-[405px] items-center px-[0px]">
                                    <div className="text-body3m text-neutral-50">{item.label}</div>
                                  </div>
                                  {/* Empty space for conversion rate */}
                                  <div className="w-[405px] px-[0px]" />
                                  {/* Full Cohort Value */}
                                  <div className="flex h-full w-[405px] items-center gap-2 px-[0px]">
                                    <div className="text-body3m text-neutral-50">
                                      {item.fullCohort.value}
                                    </div>
                                    <div className="text-body3m text-neutral-50">
                                      {item.fullCohort.percent}
                                    </div>
                                  </div>
                                  {/* Filtered Cohort Value */}
                                  <div className="flex h-full w-[405px] items-center gap-2 px-[0px]">
                                    <div className="text-body3m text-neutral-5">
                                      {item.filteredCohort.value}
                                    </div>
                                    <div className="text-body3m text-primary-60">
                                      {item.filteredCohort.percent}
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
