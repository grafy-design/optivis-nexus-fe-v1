"use client";

import { Suspense, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MultiRankingBarChart } from "@/components/charts/MultiRankingBarChart";
import { SHAPSummaryPlotChart } from "@/components/charts/SHAPSummaryPlotChart";
import { BaselineDistributionHistogram } from "@/components/charts/BaselineDistributionHistogram";
import { ScatterSlopeChart } from "@/components/charts/ScatterSlopeChart";
import { SubgroupProportionChart } from "@/components/charts/SubgroupProportionChart";
import { Loading } from "@/components/common/Loading";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button";
import {
  ExplainExpectedTherapeuticGainItem,
  ExplainListData,
  ExplainOverviewDescriptionItem,
  getExplainList,
} from "@/services/subgroup-service";

/**
 * TSI Step 5: Subgroup Explain
 * 하위군 설명 페이지 — 왼쪽: Expected Therapeutic Gain 차트+테이블,
 * 오른쪽: Baseline Driver Top10 SHAP 차트 + 피처별 상세 차트 3개.
 *
 * Subgroup Explain page — displays expected therapeutic gain on the left,
 * and baseline driver analysis + feature-level charts on the right.
 *
 * 구조:
 * - 왼쪽 글래스 카드: 파란색 차트 카드 + 흰색 테이블 카드
 * - 오른쪽 글래스 카드: 상단(SHAP 차트+설명) + 하단(피처목록+3개 차트+설명)
 */

// ── 타입 정의 / Type definitions ─────────────────────────────────────────────

/** 히스토그램 빈 비율 아이템 / Histogram bin ratio item */
type BinRatioItem = { range: number[]; [groupKey: string]: number[] | number | undefined };

/** 피처별 히스토그램 빈 비율 맵 / Feature-keyed histogram bin ratio map */
type BaselineBinRatioMock = Record<string, BinRatioItem[]>;

// ── 포맷 유틸리티 / Format utilities ─────────────────────────────────────────

/**
 * 숫자를 최대 2자리 소수로 포맷 (유한하지 않으면 "-")
 * Formats a number to max 2 decimal places (returns "-" for non-finite)
 */
const formatNumberMax2 = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 2,
  });
};

/**
 * 컷오프 값 배열을 쉼표 구분 문자열로 포맷
 * Formats cutoff value array to comma-separated string
 */
const formatCutoffValues = (values: number[] | undefined): string => {
  if (!Array.isArray(values) || values.length === 0) return "-";
  return values.map((value) => formatNumberMax2(Number(value))).join(", ");
};

// ── 메인 페이지 컴포넌트 / Main page component ───────────────────────────────

/**
 * TSI Subgroup Explain 페이지 실제 컨텐츠
 * (useSearchParams 사용 → Suspense 래핑 필요)
 *
 * Actual Subgroup Explain page content
 * (uses useSearchParams → requires Suspense wrapper)
 */
function TSISubgroupExplainPageContent() {
  // ── 피처 선택 상태 (기본: ADDRECALL) / Selected feature state ──────────────
  const [defaultSelectedFeature] = useState("ADDRECALL");
  const [selectedFeature, setSelectedFeature] = useState(defaultSelectedFeature);

  // ── URL 쿼리 파라미터 / URL query parameters ──────────────────────────────
  const searchParams = useSearchParams();
  const subgroupId = searchParams.get("subgroupId") ?? "";
  const taskId = searchParams.get("taskId") ?? "";

  // ── API 응답 데이터 상태 / API response data state ────────────────────────
  const [resultData, setResultData] = useState<ExplainListData>();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── 화면 너비 반응형 처리 / Responsive window width ──────────────────────
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const router = useRouter();

  // ── 피처별 차트 데이터 파생 / Derive per-feature chart data ──────────────
  const baselineDistributionData =
    resultData?.explain_json.explain_histogram[selectedFeature] ??
    resultData?.explain_json.explain_histogram[defaultSelectedFeature] ??
    resultData?.explain_json.explain_histogram.ADDRECALL ??
    resultData?.explain_json.explain_histogram.ADRECOG ??
    Object.values(resultData?.explain_json.explain_histogram || {})[0];

  const baselineSlopeData =
    resultData?.explain_json.explain_scatter[selectedFeature] ??
    resultData?.explain_json.explain_scatter[defaultSelectedFeature] ??
    resultData?.explain_json.explain_scatter.ADDRECALL ??
    resultData?.explain_json.explain_scatter.ADRECOG ??
    Object.values(resultData?.explain_json.explain_scatter || {})[0];

  const baselineBinRatioMock = (resultData?.explain_json.explain_bin_ratio ?? {}) as BaselineBinRatioMock;
  const overviewDescription = resultData?.explain_json.overview_description;

  const baselineBinRatioData =
    baselineBinRatioMock[selectedFeature] ??
    baselineBinRatioMock[defaultSelectedFeature] ??
    baselineBinRatioMock.ADDRECALL ??
    baselineBinRatioMock.ADRECOG ??
    Object.values(baselineBinRatioMock)[0];

  // ── 설명 텍스트 메시지 파생 / Derive description message items ────────────
  const baselineDriverTop10Messages =
    overviewDescription?.baseline_driver_top10_msg?.filter(
      (item) => item?.title?.trim() || item?.description?.trim()
    ) ?? [];

  const featureMessages = (overviewDescription?.[selectedFeature] ??
    overviewDescription?.[defaultSelectedFeature] ??
    overviewDescription?.ADDRECALL ??
    overviewDescription?.ADRECOG ??
    Object.entries(overviewDescription ?? {}).find(
      ([key, value]) =>
        key !== "baseline_driver_top10_msg" &&
        Array.isArray(value) &&
        value.some((item) => item?.title?.trim() || item?.description?.trim())
    )?.[1] ??
    []) as ExplainOverviewDescriptionItem[];

  const baselineDriverMessageItems = baselineDriverTop10Messages;
  const featureMessageItems = featureMessages;

  /** "View Report" 버튼 → Report 페이지 이동 / Navigate to Report page */
  const handleClickViewReport = () => {
    if (!taskId || !subgroupId) return;
    const query = new URLSearchParams({ taskId, subgroupId });
    router.push(`/tsi/${encodeURIComponent(selectedFeature)}/report?${query.toString()}`);
  };

  // ── Explain 데이터 API 호출 / Fetch explain data from API ────────────────
  useEffect(() => {
    let cancelled = false;

    if (!taskId || !subgroupId) {
      setResultData(undefined);
      setFetchError(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const res = await getExplainList(taskId, subgroupId);
        if (cancelled) return;
        setResultData(res.data);
      } catch (error) {
        if (cancelled) return;
        setResultData(undefined);
        setFetchError(
          error instanceof Error ? error.message : "Subgroup Explain 데이터 조회에 실패했습니다."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [subgroupId, taskId]);

  /**
   * Expected Therapeutic Gain 데이터를 rank 기준으로 그룹핑·평균화
   * Groups and averages Expected Therapeutic Gain data by rank
   */
  const convertExpectedTherapeuticGain = (
    originData: ExplainExpectedTherapeuticGainItem[]
  ): ExplainExpectedTherapeuticGainItem[] => {
    const groupedByRank = new Map<
      number,
      {
        count: number;
        varianceReductionSum: number;
        relativeContributionSum: number;
        cutoffSums: number[];
        cutoffCounts: number[];
        sample: ExplainExpectedTherapeuticGainItem;
      }
    >();

    originData.forEach((row) => {
      const varianceReduction = Number(row.variance_reduction);
      const relativeContribution = Number(row.relative_contribution);
      const cutoffs = Array.isArray(row.cutoff) ? row.cutoff : [];
      const existing = groupedByRank.get(row.rank);

      if (!existing) {
        const cutoffSums = cutoffs.map(() => 0);
        const cutoffCounts = cutoffs.map(() => 0);
        groupedByRank.set(row.rank, {
          count: 1,
          varianceReductionSum: Number.isFinite(varianceReduction) ? varianceReduction : 0,
          relativeContributionSum: Number.isFinite(relativeContribution) ? relativeContribution : 0,
          cutoffSums,
          cutoffCounts,
          sample: row,
        });
        cutoffs.forEach((value, index) => {
          const numericValue = Number(value);
          if (!Number.isFinite(numericValue)) return;
          cutoffSums[index] += numericValue;
          cutoffCounts[index] += 1;
        });
        return;
      }

      existing.count += 1;
      existing.varianceReductionSum += Number.isFinite(varianceReduction) ? varianceReduction : 0;
      existing.relativeContributionSum += Number.isFinite(relativeContribution)
        ? relativeContribution
        : 0;

      cutoffs.forEach((value, index) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return;
        if (existing.cutoffSums[index] === undefined) {
          existing.cutoffSums[index] = 0;
          existing.cutoffCounts[index] = 0;
        }
        existing.cutoffSums[index] += numericValue;
        existing.cutoffCounts[index] += 1;
      });
    });

    return Array.from(groupedByRank.entries())
      .sort(([leftRank], [rightRank]) => leftRank - rightRank)
      .map(([rank, grouped]) => ({
        rank,
        variance_reduction: grouped.varianceReductionSum / grouped.count,
        relative_contribution: grouped.relativeContributionSum / grouped.count,
        cutoff: grouped.cutoffSums.map((sum, index) => {
          const count = grouped.cutoffCounts[index] ?? 0;
          return count > 0 ? sum / count : 0;
        }),
        risk_type: grouped.sample.risk_type,
        feature_name: grouped.sample.feature_name,
      }));
  };

  // ── 차트/테이블 데이터 변환 / Transform chart/table data ─────────────────
  const expectedTherapeuticGainData = convertExpectedTherapeuticGain(
    resultData?.explain_json.expected_therapeutic_gain ?? []
  );
  const featureList = expectedTherapeuticGainData.map(({ feature_name }) => feature_name);

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <Loading isLoading={isLoading} />

      {/* ── 외부 래퍼 / Outer wrapper ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          gap: 24,
          marginLeft: "14px",
          marginRight: "14px",
          paddingBottom: 24,
        }}
      >

        {/* ── 1. 페이지 타이틀 / Page title ──────────────────────────── */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 42,
              fontWeight: 600,
              color: "rgb(17,17,17)",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Target Subgroup Identification
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
            Subgroup Explain
          </span>
        </div>

        {/* 에러 배너 / Error banner */}
        {fetchError && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-red-700">
            {fetchError}
          </div>
        )}

        {/* ── 2. 메인 카드 + 버튼 컨테이너 / Main cards + button container ── */}
        <div className="flex flex-col flex-1 min-h-0 gap-0">

          {/* ── 2-A. 카드 2개 가로 배치 / Two cards side by side ──────── */}
          <div
            className="flex flex-row flex-nowrap items-stretch gap-0 flex-1 min-h-0"
            style={{ minWidth: 0 }}
          >

            {/* ── 2-A-1. 왼쪽 글래스 카드 (Expected Therapeutic Gain)
                         Left glass card (Expected Therapeutic Gain) ─── */}
            <div
              className="flex min-h-0 w-[400px] [@media(min-width:1470px)]:w-[520px] flex-shrink-0 flex-col overflow-hidden rounded-[36px] gap-3 p-0"
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

              {/* 파란색 차트 카드: Expected Therapeutic Gain / Blue chart card */}
              <div
                className="bg-primary-15 flex min-h-0 w-full flex-[3] flex-col overflow-hidden rounded-[24px] p-3 gap-6"
                style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
              >
                <h2 className="text-body2m flex-shrink-0 text-white pl-[2px]">
                  Expected Therapeutic Gain
                </h2>
                <div className="flex min-h-0 flex-1 flex-col rounded-[16px] bg-white p-3">
                  <div className="flex min-h-0 flex-1 rounded-[12px] bg-white">
                    <MultiRankingBarChart data={expectedTherapeuticGainData} />
                  </div>
                </div>
              </div>

              {/* 흰색 테이블 카드 / White table card */}
              <div
                className="flex min-h-0 w-full flex-[2] flex-col overflow-hidden rounded-[24px] bg-white"
                style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="flex min-h-0 flex-1 flex-col px-4">

                  {/* 테이블 헤더 / Table header */}
                  <div className="border-neutral-80 flex min-h-[48px] flex-shrink-0 items-center border-b py-2">
                    <div className="text-body5 text-neutral-30 flex-[3] min-w-0 shrink-0">Rank</div>
                    <div className="text-body5 text-neutral-30 flex-[7] min-w-0 shrink-0">Feature name</div>
                    <div className="text-body5 text-neutral-30 flex-[7] min-w-0 shrink-0 leading-tight">
                      Max Variance<br />Reduction(△▽)
                    </div>
                    <div className="text-body5 text-neutral-30 flex-[5] min-w-0 shrink-0">Contribution</div>
                    <div className="text-body5 text-neutral-30 flex-[7] min-w-0 shrink-0 leading-tight">
                      Cutoff<br />(Auto-derived)
                    </div>
                  </div>

                  {/* 테이블 바디 / Table body */}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {expectedTherapeuticGainData.map((row, index) => (
                      <div
                        key={`${row.rank}_${index}`}
                        className="border-neutral-80 flex min-h-[44px] items-center border-b py-1"
                      >
                        <div className="text-body4 text-neutral-40 flex-[3] min-w-0">{row.rank}</div>
                        <div className="text-body4 text-neutral-40 flex-[7] min-w-0 truncate">
                          {row.feature_name}
                        </div>
                        <div className="text-body4 text-neutral-40 flex-[7] min-w-0">
                          {formatNumberMax2(Number(row.variance_reduction))}
                        </div>
                        <div className="text-body4 text-neutral-40 flex-[5] min-w-0">
                          {formatNumberMax2(Number(row.relative_contribution))}%
                        </div>
                        <div className="text-body4 text-neutral-40 flex-[7] min-w-0">
                          {formatCutoffValues(row.cutoff)}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
            {/* ── 왼쪽 카드 닫기 / End left card ── */}

            {/* ── 2-A-2. 오른쪽 글래스 카드 (Baseline Driver + 피처 상세)
                         Right glass card (Baseline Driver + feature detail) ── */}
            <div
              className="flex min-h-0 flex-1 min-w-0 flex-col overflow-y-auto rounded-[36px] p-0"
              style={{
                borderImage:
                  'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
                borderStyle: "solid",
                borderTopWidth: "20px",
                borderBottomWidth: "28px",
                borderLeftWidth: "24px",
                borderRightWidth: "24px",
                borderColor: "transparent",
                paddingBottom: 24,
              }}
            >
              <div className="flex flex-col min-h-0 flex-1" style={{ gap: 12 }}>

                {/* ── 상단 행: SHAP 차트 + 설명 텍스트 / Top row: SHAP chart + description ── */}
                <div className="flex flex-[2] [@media(min-width:1470px)]:min-h-[62vh]">

                  {/* 파란색 SHAP 차트 카드 / Blue SHAP chart card */}
                  <div
                    className="bg-primary-15 flex min-h-100 flex-1 flex-shrink-0 flex-col gap-6 overflow-hidden rounded-[24px] p-3"
                    style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                  >
                    <h2 className="text-body2m flex-shrink-0 text-white pl-[2px]">
                      Baseline driver Top 10
                    </h2>

                    {/* SHAP 그래프 + 설명 텍스트 묶음 / SHAP chart + description row */}
                    <div className="flex min-h-0 flex-1 flex-row gap-3">

                      {/* SHAP Summary Plot 차트 / SHAP Summary Plot chart */}
                      <div className="flex min-w-0 min-h-0 flex-[7] flex-col overflow-hidden">
                        <div className="flex w-full flex-1 min-h-0 flex-col rounded-[16px] bg-white p-3">
                          <h3 className="text-body4 text-neutral-40 mb-6 flex-shrink-0">
                            {`Baseline Features Explaining △${resultData?.outcome ?? "ADAS-Cog"}`}
                          </h3>
                          <div
                            className="flex flex-1 min-h-0 w-full rounded-[12px] bg-white [@media(max-width:1470px)]:!h-[320px] [@media(max-width:1470px)]:flex-none"
                            style={{ height: "100%" }}
                          >
                            <div className="flex-1 min-w-0 min-h-0">
                              <SHAPSummaryPlotChart
                                data={resultData?.explain_json.baseline_driver}
                              />
                            </div>
                            {/* Visual Map 범례 (High → Low 그라데이션) */}
                            <div className="flex flex-shrink-0 flex-col items-center justify-center gap-1" style={{ width: 32, paddingLeft: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 500, color: "#5F6072", fontFamily: "Inter, sans-serif" }}>High</span>
                              <div
                                className="flex-1 rounded-[4px]"
                                style={{
                                  width: 12,
                                  minHeight: 120,
                                  background: "linear-gradient(to bottom, #231F52, #D8D3FF)",
                                }}
                              />
                              <span style={{ fontSize: 11, fontWeight: 500, color: "#5F6072", fontFamily: "Inter, sans-serif" }}>Low</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Baseline Driver 설명 텍스트 / Baseline Driver description text */}
                      <div className="flex min-w-0 h-wrap flex-[3] flex-col justify-start">
                        <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                          {baselineDriverMessageItems.map((item, index) => (
                            <li
                              key={`${item.no ?? index}-${item.title}`}
                              className="flex flex-col"
                              style={{ lineHeight: 1.2 }}
                            >
                              <span className="text-body3m mb-1">{item.title}</span>
                              <span className="text-body5m whitespace-pre-line">{item.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>

                </div>
                {/* ── 상단 행 닫기 / End top row ── */}

                {/* ── 하단 행: 피처 목록 + 상세 차트 3개 + 설명
                             Bottom row: feature list + 3 detail charts + description ── */}
                <div className="flex flex-shrink-0 gap-3">

                  {/* 왼쪽 피처 목록 카드 / Left feature list card */}
                  <div
                    className="flex flex-[2] flex-col overflow-hidden rounded-[24px] bg-white"
                    style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {featureList.map((feature, index) => (
                        <Button
                          unstyled
                          key={feature}
                          onClick={() => setSelectedFeature(feature)}
                          className={`text-body4 flex h-[48px] w-full items-center gap-[10px] self-stretch px-[12px] py-[12px] transition-colors focus:outline-none ${
                            index < featureList.length - 1 ? "border-neutral-90 border-b" : ""
                          } ${
                            selectedFeature === feature
                              ? "bg-primary-15 text-white active:bg-primary-15"
                              : "text-neutral-30 hover:bg-neutral-95 active:bg-neutral-95"
                          }`}
                        >
                          {feature}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 오른쪽 파란색 상세 카드 (차트 3개 세로 + 설명)
                      Right blue detail card (3 charts vertically + description) */}
                  <div
                    className="bg-primary-15 flex flex-[8] flex-shrink-0 flex-row gap-3 rounded-[24px] p-3"
                    style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                  >

                    {/* 차트 3개 세로 배치 / Three charts stacked vertically */}
                    <div className="flex min-w-0 flex-[5] flex-col gap-3">

                      {/* 차트 1: Baseline Distribution Histogram */}
                      <div className="flex w-full flex-shrink-0 flex-col rounded-[12px] bg-white px-3 pt-3 pb-2">
                        <h3 className="text-body4 text-neutral-40 mb-2">
                          Baseline Distribution of {selectedFeature} (Baseline)
                        </h3>
                        <BaselineDistributionHistogram
                          histogramData={baselineDistributionData ?? { bins: [], groups: {} }}
                          height={windowWidth <= 1470 ? "200px" : "300px"}
                        />
                      </div>

                      {/* 차트 2: ADAS Progression Slope Scatter */}
                      <div className="flex w-full flex-shrink-0 flex-col rounded-[12px] bg-white px-3 pt-3 pb-2">
                        <h3 className="text-body4 text-neutral-40 mb-2">
                          ADAS Progression Slope vs. {selectedFeature} (Baseline)
                        </h3>
                        <ScatterSlopeChart
                          data={baselineSlopeData ?? {}}
                          height={windowWidth <= 1470 ? "200px" : "300px"}
                        />
                      </div>

                      {/* 차트 3: Subgroup Proportion */}
                      <div className="flex w-full flex-shrink-0 flex-col rounded-[12px] bg-white px-3 pt-3 pb-2">
                        <h3 className="text-body4 text-neutral-40 mb-2">
                          Subgroup Proportion by {selectedFeature} (Baseline)
                        </h3>
                        <SubgroupProportionChart
                          data={baselineBinRatioData ?? []}
                          height={windowWidth <= 1470 ? "200px" : "300px"}
                        />
                      </div>

                    </div>

                    {/* 피처별 설명 텍스트 / Feature-level description text */}
                    <div className="flex min-w-0 flex-[3] flex-col justify-start pt-3">
                      <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                        {featureMessageItems.map((item, index) => (
                          <li
                            key={`${item.no ?? index}-${item.title}`}
                            className="flex flex-col"
                            style={{ lineHeight: 1.2 }}
                          >
                            <span className="text-body3m mb-1">{item.title}</span>
                            <span className="text-body5m whitespace-pre-line">{item.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>
                {/* ── 하단 행 닫기 / End bottom row ── */}

              </div>
            </div>
            {/* ── 오른쪽 카드 닫기 / End right card ── */}

          </div>
          {/* ── 카드 2개 영역 닫기 / End two-card area ── */}

          {/* ── 2-B. 하단 버튼 영역 / Bottom action buttons ─────────────── */}
          <div
            className="flex flex-shrink-0 items-center justify-end gap-4"
            style={{ paddingRight: 8 }}
          >
            {/* Save Progress 버튼 / Save Progress button */}
            <button type="button" className="btn-tsi btn-tsi-secondary">
              Save Progress
            </button>
            {/* View Report 버튼 → Report 페이지 이동 / Navigate to Report page */}
            <button
              type="button"
              onClick={handleClickViewReport}
              className="btn-tsi btn-tsi-primary"
            >
              View Report
            </button>
          </div>

        </div>
        {/* ── 메인 + 버튼 컨테이너 닫기 / End main + button container ── */}

      </div>
      {/* ── 외부 래퍼 닫기 / End outer wrapper ── */}

    </AppLayout>
  );
}

/**
 * Suspense 래퍼 (useSearchParams 사용 필요)
 * Suspense wrapper (required for useSearchParams)
 */
export default function TSISubgroupExplainPage() {
  return (
    <Suspense fallback={null}>
      <TSISubgroupExplainPageContent />
    </Suspense>
  );
}
