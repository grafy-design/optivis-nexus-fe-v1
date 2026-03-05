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

type BinRatioItem = { range: number[]; [groupKey: string]: number[] | number | undefined };
type BaselineBinRatioMock = Record<string, BinRatioItem[]>;

const formatNumberMax2 = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 2,
  });
};

const formatCutoffValues = (values: number[] | undefined): string => {
  if (!Array.isArray(values) || values.length === 0) return "-";
  return values.map((value) => formatNumberMax2(Number(value))).join(", ");
};

/**
 * TSI Step 5: Subgroup Explain
 * 구조: 상위 배경 카드 2개 나란히
 * - 왼쪽 상위: explain-left.png → 안에 파란색 그래프 카드 + 흰색 테이블 카드
 * - 오른쪽 상위: explain-right.png → 안에 파란색 그래프 카드 + 설명 / 흰색 카드 + 파란색 카드(흰색 그래프 3개) + 설명
 */
function TSISubgroupExplainPageContent() {
  const [defaultSelectedFeature] = useState("ADDRECALL");
  const [selectedFeature, setSelectedFeature] = useState(defaultSelectedFeature);
  const searchParams = useSearchParams();
  const subgroupId = searchParams.get("subgroupId") ?? "";
  const taskId = searchParams.get("taskId") ?? "";
  const [resultData, setResultData] = useState<ExplainListData>();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const router = useRouter();
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
  const baselineBinRatioMock = (resultData?.explain_json.explain_bin_ratio ??
    {}) as BaselineBinRatioMock;
  const overviewDescription = resultData?.explain_json.overview_description;
  const baselineBinRatioData =
    baselineBinRatioMock[selectedFeature] ??
    baselineBinRatioMock[defaultSelectedFeature] ??
    baselineBinRatioMock.ADDRECALL ??
    baselineBinRatioMock.ADRECOG ??
    Object.values(baselineBinRatioMock)[0];
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

  const handleClickViewReport = () => {
    if (!taskId || !subgroupId) {
      return;
    }

    const query = new URLSearchParams({
      taskId,
      subgroupId,
    });
    router.push(`/tsi/${encodeURIComponent(selectedFeature)}/report?${query.toString()}`);
  };

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
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [subgroupId, taskId]);

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

  const expectedTherapeuticGainData = convertExpectedTherapeuticGain(
    resultData?.explain_json.expected_therapeutic_gain ?? []
  );

  const featureList = expectedTherapeuticGainData.map(({ feature_name }) => feature_name);

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <Loading isLoading={isLoading} />
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, marginLeft: "8px", marginRight: "8px", paddingBottom: 18 }}>
        {/* Title */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1 style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0 }}>
            Target Subgroup Identification
          </h1>
          <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
            Subgroup Explain
          </span>
        </div>
        {fetchError && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-red-700">
            {fetchError}
          </div>
        )}

        {/* 메인 + 버튼 wrapper */}
        <div className="flex flex-col flex-1 min-h-0 gap-0">
        {/* 메인: 상위 배경 카드 2개 나란히 */}
        <div className="flex flex-row flex-nowrap items-stretch gap-0 flex-1 min-h-0" style={{ minWidth: 0 }}>
          {/* 왼쪽 상위 배경 카드 */}
          <div
            className="flex min-h-0 w-[520px] [@media(min-width:1441px)]:w-[570px] flex-shrink-0 flex-col overflow-hidden rounded-[36px] gap-3 p-0"
           style={{borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", }}
          >
            {/* 파란색 그래프 카드: Expected Therapeutic Gain */}
            <div
              className="bg-primary-15 flex min-h-0 w-full flex-[3] flex-col overflow-hidden rounded-[24px] p-3 gap-6"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 className="text-body2m flex-shrink-0 text-white pl-[2px]">
                Expected Therapeutic Gain
              </h2>
              {/* 그래프 영역 */}
              <div className="flex min-h-0 flex-1 flex-col rounded-[16px] bg-white p-3">
                <div className="flex min-h-0 flex-1 rounded-[12px] bg-white">
                  <MultiRankingBarChart data={expectedTherapeuticGainData} />
                </div>
              </div>
            </div>

            {/* 흰색 테이블 카드 */}
            <div
              className="flex min-h-0 w-full flex-[2] flex-col overflow-hidden rounded-[24px] bg-white"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* 테이블 전체 컨테이너 */}
              <div className="flex min-h-0 flex-1 flex-col px-4">
                {/* 테이블 헤더 */}
                <div className="border-neutral-80 flex min-h-[48px] flex-shrink-0 items-center border-b py-2">
                  <div className="text-body4 text-neutral-30 flex-[3] min-w-0 shrink-0">Rank</div>
                  <div className="text-body4 text-neutral-30 flex-[7] min-w-0 shrink-0">Feature name</div>
                  <div className="text-body4 text-neutral-30 flex-[7] min-w-0 shrink-0 leading-tight">
                    Max Variance<br />Reduction(△▽)
                  </div>
                  <div className="text-body4 text-neutral-30 flex-[5] min-w-0 shrink-0">Contribution</div>
                  <div className="text-body4 text-neutral-30 flex-[7] min-w-0 shrink-0 leading-tight">
                    Cutoff<br />(Auto-derived)
                  </div>
                </div>

                {/* 테이블 바디 */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {expectedTherapeuticGainData.map((row, index) => (
                    <div
                      key={`${row.rank}_${index}`}
                      className="border-neutral-80 flex min-h-[44px] items-center border-b py-1"
                    >
                      <div className="text-body4 text-neutral-40 flex-[3] min-w-0">{row.rank}</div>
                      <div className="text-body4 text-neutral-40 flex-[7] min-w-0 truncate">{row.feature_name}</div>
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

          {/* 오른쪽 상위 배경 카드 */}
          <div
            className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden rounded-[36px] p-0 "
           style={{borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", paddingBottom: 24}}
          >
            <div className="flex flex-col min-h-0 flex-1" style={{ gap: 12 }}>
            {/* 상단 행: 그래프 카드 + 설명 텍스트 */}
            <div className="flex flex-[2] [@media(min-width:1470px)]:min-h-[62vh]">
              {/* 파란색 그래프 카드 */}
              <div
                className="bg-primary-15 flex min-h-100 flex-1 flex-shrink-0 flex-col gap-6  overflow-hidden rounded-[24px] p-3"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h2 className="text-body2m flex-shrink-0 text-white pl-[2px]">
                  Baseline driver Top 10
                </h2>
                {/* 그래프 + 설명 텍스트 묶음 */}
                <div className="flex min-h-0 flex-1 flex-row gap-3">
                  {/* 그래프 영역 */}
                  <div className="flex min-w-0 min-h-0 flex-[7] flex-col overflow-hidden">
                    <div
                      className="flex w-full flex-1 min-h-0 flex-col rounded-[16px] bg-white p-3"
                    >
                      <h3 className="text-body4 text-neutral-40 mb-6 flex-shrink-0">
                        {`Baseline Features Explaining △${resultData?.outcome ?? "ADAS-Cog"}`}
                      </h3>
                      <div className="flex flex-1 min-h-0 w-full rounded-[12px] bg-white" style={{ height: "100%" }}>
                        <SHAPSummaryPlotChart
                          data={resultData?.explain_json.baseline_driver}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 설명 텍스트 */}
                  <div className="flex min-w-0 h-wrap flex-[3] flex-col justify-start">
                    <ul className="flex list-disc flex-col gap-[9px] pl-4 text-white">
                      {baselineDriverMessageItems.map((item, index) => (
                        <li key={`${item.no ?? index}-${item.title}`} className="break-words leading-[1.2]">
                          <span className="text-body3m">{item.title}</span>
                          <br />
                          <span className="text-body5m whitespace-pre-line leading-[1.2]">{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 행: 흰색 카드 + 파란색 카드(흰색 그래프 3개 + 설명) */}
            <div className="flex flex-shrink-0 gap-3">
              {/* 왼쪽 흰색 카드: Feature 목록 */}
              <div
                className="flex flex-[2] flex-col overflow-hidden rounded-[24px] bg-white"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {featureList.map((feature, index) => (
                    <Button
                      unstyled
                      key={feature}
                      onClick={() => setSelectedFeature(feature)}
                      className={`text-body5 flex h-[48px] w-full items-center gap-[10px] self-stretch px-[12px] py-[12px] transition-colors focus:outline-none ${
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

              {/* 파란색 카드: 흰색 그래프 카드 3개 + 설명 텍스트 (나머지 전체 너비) */}
              <div
                className="bg-primary-15 flex flex-[8] flex-shrink-0 flex-row gap-3 rounded-[24px] p-3"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 그래프 카드 3개 세로 배치 */}
                <div className="flex min-w-0 flex-[5] flex-col gap-3">
                  {/* 그래프 카드 1: Baseline Distribution */}
                  <div className="flex w-full flex-shrink-0 flex-col rounded-[12px] bg-white px-3 pt-3 pb-2">
                    <h3 className="text-body4 text-neutral-40 mb-2">
                      Baseline Distribution of {selectedFeature} (Baseline)
                    </h3>
                    <BaselineDistributionHistogram
                      histogramData={
                        baselineDistributionData ?? {
                          bins: [],
                          groups: {},
                        }
                      }
                    />
                  </div>

                  {/* 그래프 카드 2: ADAS Progression Slope */}
                  <div className="flex w-full flex-shrink-0 flex-col rounded-[12px] bg-white px-3 pt-3 pb-2">
                    <h3 className="text-body4 text-neutral-40 mb-2">
                      ADAS Progression Slope vs. {selectedFeature} (Baseline)
                    </h3>
                    <ScatterSlopeChart data={baselineSlopeData ?? {}} />
                  </div>

                  {/* 그래프 카드 3: Subgroup Proportion */}
                  <div className="flex w-full flex-shrink-0 flex-col rounded-[12px] bg-white px-3 pt-3 pb-2">
                    <h3 className="text-body4 text-neutral-40 mb-2">
                      Subgroup Proportion by {selectedFeature} (Baseline)
                    </h3>
                    <SubgroupProportionChart data={baselineBinRatioData ?? []} />
                  </div>
                </div>

                {/* 오른쪽 설명 텍스트 */}
                <div className="flex min-w-0 flex-[3] flex-col justify-start pt-3">
                  <ul className="flex list-disc flex-col gap-[9px] pl-4 text-white">
                    {featureMessageItems.map((item, index) => (
                      <li key={`${item.no ?? index}-${item.title}`} className="break-words leading-[1.2]">
                        <span className="text-body3m">{item.title}</span>
                        <br />
                        <span className="text-body5m whitespace-pre-line leading-[1.2]">{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* 버튼: 카드 밖 아래 */}
        <div className="flex flex-shrink-0 items-center justify-end gap-4" style={{ paddingRight: 8 }}>
          <button type="button" className="btn-tsi btn-tsi-secondary">
            Save Progress
          </button>
          <button type="button" onClick={handleClickViewReport} className="btn-tsi btn-tsi-primary">
            View Report
          </button>
        </div>
        </div>{/* 메인 + 버튼 wrapper 닫기 */}
      </div>
    </AppLayout>
  );
}

export default function TSISubgroupExplainPage() {
  return (
    <Suspense fallback={null}>
      <TSISubgroupExplainPageContent />
    </Suspense>
  );
}
