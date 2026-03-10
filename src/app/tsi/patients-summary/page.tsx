"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { TSISaveModal } from "@/components/tsi/TSISaveModal";
import { getPatientSummary, type PatientSummaryData } from "@/services/subgroup-service";

/**
 * TSI Step 2: Patients Summary
 * 환자 데이터 요약 페이지 — 전체 코호트 vs 필터 코호트 기초 특성 비교 테이블 표시.
 *
 * Patients Summary page — displays a comparison table of baseline characteristics
 * between the Full Cohort and Filtered Cohort.
 */

// ── 임시 Task ID (개발/테스트용) / Mock task ID for dev/testing ─────────────
const MOCK_TASK_ID = "test-task-id";

/**
 * 숫자 카운트업 애니메이션 컴포넌트
 * 마운트 또는 value 변경 시 0 → target 으로 ease-out cubic 애니메이션
 */
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
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(value * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(current)}</>;
}

/**
 * 숫자를 소수점 최대 2자리까지 포맷하는 헬퍼
 * Formats a number with up to 2 decimal places
 */

export default function TSIPatientsSummaryPage() {
  const router = useRouter();
  const [titleFontSize, setTitleFontSize] = useState(42);
  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── taskId: 현재는 mock, 추후 URL 쿼리로 대체 예정
  //    taskId: currently mock, to be replaced with URL query param
  const taskId = MOCK_TASK_ID;

  // ── 서버 데이터 상태 / Server data state ──────────────────────────────────
  const [patientSummaryData, setPatientSummaryData] = useState<PatientSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Save Simulation 모달 상태 / Save Simulation modal state ───────────────
  const [showSaveModal, setShowSaveModal] = useState(false);

  // ── 마운트 시 Patient Summary API 호출 / Fetch on mount ───────────────────
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

  /** "Identify Subgroup" 버튼 → Basis Selection 페이지 이동 / Navigate to Basis Selection */
  const handleGoToBasisSelection = () => {
    const query = new URLSearchParams({ taskId });
    router.push(`/tsi/basis-selection?${query.toString()}`);
  };

  // ── API 데이터를 테이블용 형태로 변환 (Gender 카테고리 제외)
  //    Transform API data to table format (excludes Gender category)
  const baselineData =
    patientSummaryData?.baseline_characteristics
      .filter((category) => category.category.toLowerCase() !== "gender")
      .map((category) => ({
        category: category.category_display || category.category,
        items: category.items.map((item) => ({
          label: item.group_name,
          fullCohort: {
            n: item.full_cohort_n,
            pct: item.full_cohort_pct,
          },
          filteredCohort: {
            n: item.filtered_cohort_n,
            pct: item.filtered_cohort_pct,
          },
        })),
      })) || [];

  // ── 요약 숫자: 전체/필터 인원수, 전환율 / Summary counts: total/filtered/conversion
  const displayTotalCount = patientSummaryData?.full_cohort_n || 0;
  const displayFilteredCount = patientSummaryData?.filtered_cohort_n || 0;
  const displayConversionPercent = patientSummaryData?.conversion_percent || 0;

  return (
    <AppLayout headerType="tsi" scaleMode="fit">

      {/* ── 외부 래퍼: 좌우 마진, 하단 패딩 / Outer wrapper with horizontal margins */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          marginLeft: "14px",
          marginRight: "14px",
          paddingBottom: "24px",
        }}
      >

        {/* ── 메인 컨테이너 / Main container ──────────────────────────────── */}
        <div className="relative overflow-hidden flex-1 min-h-0 flex flex-col gap-[24px]">

          {/* ── 1. 페이지 타이틀 / Page title ────────────────────────────── */}
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
                Patients Summary
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
                Simulation templates are provided to show the required input structure. Please review before proceeding.
              </span>
            </div>
          </div>

          {/* ── 2. 글래스 카드 + 버튼 컨테이너 / Glass card + button container ── */}
          <div className="flex flex-1 min-h-0 flex-col gap-0">

            {/* ── 2-1. 글래스 배경 카드 / Glass background card ───────────── */}
            <div
              className="figma-nine-slice figma-home-panel-middle flex flex-1 min-h-0 flex-col gap-0.5"
            >

              {/* ── 2-1-A. 숫자 요약 행 / Stats summary row ─────────────── */}
              <div className="flex flex-row h-wrap items-baseline gap-0 px-[4px] flex-shrink-0 justify-end -mt-2 mb-1 mr-0.5">
                {/* 전체 분석 인원 레이블 / Total analyzed count label */}
                <div className="h-wrap text-body4 text-neutral-50 pr-[16px]">
                  Number Analyzed 480 participants
                </div>
                {/* 전환율 + 필터/전체 인원 수 / Conversion rate + filtered/total counts */}
                <div className="h-wrap">
                  <span className="text-body4 text-neutral-50">
                    <AnimatedNumber value={displayConversionPercent} format={(v) => v.toFixed(1)} />
                  </span>
                  <span className="text-body4 text-neutral-50">%</span>
                  <span className="text-body5 text-neutral-50 mx-1">converted</span>
                  <span className="text-body5 text-neutral-50">(</span>
                  <span className="text-body5 tabular-nums text-neutral-50">
                    <AnimatedNumber value={displayFilteredCount} format={(v) => Math.round(v).toLocaleString()} />
                  </span>
                  <span className="text-body5 text-neutral-50">/</span>
                  <span className="text-body5 tabular-nums text-neutral-50">
                    <AnimatedNumber value={displayTotalCount} format={(v) => Math.round(v).toLocaleString()} />
                  </span>
                  <span className="text-body5 text-neutral-50">)</span>
                </div>
              </div>

              {/* ── 2-1-B. 테이블 헤더 + 바디 / Table header + body ──────── */}
              <div className="flex flex-1 min-h-0 flex-col gap-2">

                {/* ── 테이블 헤더 행 / Table header row ────────────────── */}
                <div
                  className="rounded-[16px] w-full flex items-center pt-[8px] pb-1.5"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  <div
                    className="grid grid-cols-4 -gap-1 px-[12px] w-full"
                    style={{ alignItems: "center" }}
                  >
                    {/* 컬럼 1: Baseline Characteristics 레이블 */}
                    <div className="text-body3m text-neutral-99">Baseline Characteristics</div>

                    {/* 컬럼 2: 빈 공간 */}
                    <div />

                    {/* 컬럼 3: Full Cohort 헤더 */}
                    <div className="grid grid-cols-[1fr_1fr_1fr]">
                      <div className="col-span-2 flex flex-col items-end">
                        <div className="text-body3m text-neutral-99 flex-shrink-0">Full Cohort</div>
                        <div className="text-body5 text-neutral-80 flex-shrink-0 -mt-0.25">
                          N (%) or mean ± sd (min, max)
                        </div>
                      </div>
                      <div />
                    </div>

                    {/* 컬럼 4: Filtered Cohort 헤더 */}
                    <div className="grid grid-cols-[1fr_1fr_1fr]">
                      <div className="col-span-2 flex flex-col items-end -gap-1">
                        <div className="text-body3m text-neutral-99 flex-shrink-0">Filtered Cohort</div>
                        <div className="text-body5 text-neutral-80 flex-shrink-0 -mt-0.25">
                          N (%) or mean ± sd (min, max)
                        </div>
                      </div>
                      <div />
                    </div>
                  </div>
                </div>

                {/* ── 테이블 바디 / Table body ─────────────────────────── */}
                <div className="relative flex flex-col overflow-y-auto flex-1 min-h-0">
                  <div className="overflow-y-auto flex flex-col gap-2">

                    {/* 로딩 / 에러 / 빈 데이터 / 실제 데이터 분기 렌더링
                        Loading / Error / Empty / Data conditional rendering */}
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
                        /* ── 카테고리 카드 / Category card ── */
                        <div key={categoryIndex} className="rounded-[16px] bg-white">
                          <div className="flex flex-col pt-[12px] px-[12px] pb-[8px]">

                            {/* 카테고리 헤더 행 / Category header row */}
                            <div className="border-neutral-80 grid grid-cols-4 h-full items-end border-b gap-0 pb-1">
                              <div className="flex h-full items-end">
                                <div className="text-body2 text-neutral-30 items-end">{category.category}</div>
                              </div>
                              <div />
                              <div className="grid grid-cols-[1fr_1fr_1fr] items-end h-full">
                                <div className="text-body5m text-right text-neutral-50 items-end">Patients</div>
                                <div className="text-body5m text-right text-neutral-50 items-end">%</div>
                                <div />
                              </div>
                              <div className="grid grid-cols-[1fr_1fr_1fr] items-end h-full">
                                <div className="text-body5 text-right text-primary-50 items-end">Patients</div>
                                <div className="text-body5 text-right text-primary-50 items-end">%</div>
                              </div>
                            </div>

                            {/* 카테고리 아이템 행들 / Category item rows */}
                            {category.items.map((item, itemIndex) => {
                              const isLast = itemIndex === category.items.length - 1;
                              return (
                                <div
                                  key={itemIndex}
                                  className={`grid grid-cols-4 h-full pt-2 pb-1 items-center gap-0 ${
                                    !isLast ? "border-neutral-80 border-b" : ""
                                  }`}
                                >
                                  {/* 아이템 레이블 / Item label */}
                                  <div className="flex h-full items-center">
                                    <div className="text-body4m text-neutral-50">{item.label}</div>
                                  </div>
                                  <div />

                                  {/* Full Cohort 값 / Full cohort values */}
                                  <div className="grid grid-cols-[1fr_1fr_1fr] items-center h-full">
                                    <div className="text-body4m text-right tabular-nums text-neutral-50">
                                      <AnimatedNumber value={item.fullCohort.n} format={(v) => Math.round(v).toLocaleString()} />
                                    </div>
                                    <div className="text-body4m text-right tabular-nums text-neutral-50">
                                      <AnimatedNumber value={item.fullCohort.pct} format={(v) => `${v.toFixed(1)}%`} />
                                    </div>
                                  </div>

                                  {/* Filtered Cohort 값 / Filtered cohort values */}
                                  <div className="grid grid-cols-[1fr_1fr_1fr] items-center h-full">
                                    <div className="text-body4 text-right tabular-nums text-primary-50">
                                      <AnimatedNumber value={item.filteredCohort.n} format={(v) => Math.round(v).toLocaleString()} />
                                    </div>
                                    <div className="text-body4 text-right tabular-nums text-primary-50">
                                      <AnimatedNumber value={item.filteredCohort.pct} format={(v) => `${v.toFixed(1)}%`} />
                                    </div>
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
                {/* ── 테이블 영역 닫기 / End table area ── */}

              </div>
            </div>
            {/* ── 2-1. 글래스 카드 닫기 / End glass card ── */}

            {/* ── 2-2. 하단 버튼 영역 / Bottom action buttons ──────────────── */}
            <div
              className="flex flex-shrink-0 items-center justify-end gap-3"
              style={{ paddingRight: 8 }}
            >
              {/* Save Simulation 버튼 → 모달 열기 / Opens save modal */}
              <button
                type="button"
                className="btn-tsi btn-tsi-secondary"
                onClick={() => setShowSaveModal(true)}
              >
                Save Simulation
              </button>

              {/* Identify Subgroup 버튼 → Basis Selection 이동 / Navigate to Basis Selection */}
              <button
                type="button"
                onClick={handleGoToBasisSelection}
                className="btn-tsi btn-tsi-primary"
                style={{ paddingRight: 18, gap: 8 }}
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
          {/* ── 2. 카드 + 버튼 컨테이너 닫기 / End card + button container ── */}

        </div>
        {/* ── 메인 컨테이너 닫기 / End main container ── */}

      </div>
      {/* ── 외부 래퍼 닫기 / End outer wrapper ── */}

      {/* ── Save Simulation 모달 / Save Simulation modal ──────────────────── */}
      <TSISaveModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(_name, _desc) => {
          setShowSaveModal(false);
        }}
      />

    </AppLayout>
  );
}
