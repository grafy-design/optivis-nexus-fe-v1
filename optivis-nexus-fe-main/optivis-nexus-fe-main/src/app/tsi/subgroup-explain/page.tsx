"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
  getExplainList,
} from "@/services/subgroup-service";

type BinRatioItem = { range: number[]; [groupKey: string]: number[] | number | undefined };
type BaselineBinRatioMock = Record<string, BinRatioItem[]>;

const toCaseInsensitiveFeatureKey = (value: string): string => value.trim().toLowerCase();

const resolveFeatureKey = <T,>(
  selectedFeature: string | null,
  source: Record<string, T> | undefined
): string | null => {
  if (!selectedFeature || !source) return null;

  if (Object.prototype.hasOwnProperty.call(source, selectedFeature)) {
    return selectedFeature;
  }

  const keys = Object.keys(source);
  if (keys.length === 0) return null;

  const targetKey = toCaseInsensitiveFeatureKey(selectedFeature);
  if (!targetKey) return null;

  const caseInsensitiveMatch = keys.find((key) => toCaseInsensitiveFeatureKey(key) === targetKey);
  return caseInsensitiveMatch ?? null;
};

const formatNumberMax2 = (value: number): string => {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 2,
  });
};

const formatCutoffValues = (values: number[] | undefined): string => {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values
    .map((value) => formatNumberMax2(Number(value)))
    .filter((value) => value.length > 0)
    .join(", ");
};

const formatPercentMax2 = (value: number): string => {
  const formatted = formatNumberMax2(value);
  return formatted ? `${formatted}%` : "";
};

const getTsiReportFeatureStorageKey = (taskId: string, subgroupId: string): string =>
  `tsi:report-feature:${taskId}:${subgroupId}`;

function WhitePlaceholderBox({ className = "" }: { className?: string }) {
  return <div className={`h-full w-full rounded-[12px] bg-white ${className}`.trim()} />;
}

function TSISubgroupExplainPageContent() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const subgroupId = searchParams.get("subgroupId") ?? "";
  const taskId = searchParams.get("taskId") ?? "";
  const [resultData, setResultData] = useState<ExplainListData>();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const router = useRouter();

  const handleClickViewReport = () => {
    if (!taskId || !subgroupId || !selectedFeature) {
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
      setSelectedFeature(null);
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
          const count = grouped.cutoffCounts[index];
          return typeof count === "number" && count > 0 ? sum / count : Number.NaN;
        }),
        risk_type: grouped.sample.risk_type,
        feature_name: grouped.sample.feature_name,
      }));
  };

  const expectedTherapeuticGainData = convertExpectedTherapeuticGain(
    resultData?.explain_json.expected_therapeutic_gain ?? []
  );
  const featureList = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          expectedTherapeuticGainData
            .map(({ feature_name }) => feature_name?.trim())
            .filter((name): name is string => Boolean(name))
        )
      ),
    [expectedTherapeuticGainData]
  );

  useEffect(() => {
    if (featureList.length === 0) {
      setSelectedFeature(null);
      return;
    }

    setSelectedFeature((prev) => (prev && featureList.includes(prev) ? prev : featureList[0]));
  }, [featureList]);

  useEffect(() => {
    if (!taskId || !subgroupId || !selectedFeature) {
      return;
    }

    window.sessionStorage.setItem(
      getTsiReportFeatureStorageKey(taskId, subgroupId),
      selectedFeature
    );
    window.dispatchEvent(new CustomEvent("tsi-report-feature-change"));
  }, [selectedFeature, subgroupId, taskId]);

  const overviewDescription = resultData?.explain_json.overview_description;
  const histogramFeatureKey = resolveFeatureKey(
    selectedFeature,
    resultData?.explain_json.explain_histogram
  );
  const scatterFeatureKey = resolveFeatureKey(
    selectedFeature,
    resultData?.explain_json.explain_scatter
  );
  const binRatioFeatureKey = resolveFeatureKey(
    selectedFeature,
    resultData?.explain_json.explain_bin_ratio
  );
  const overviewFeatureKey = resolveFeatureKey(selectedFeature, overviewDescription);

  const baselineDistributionData = histogramFeatureKey
    ? resultData?.explain_json.explain_histogram[histogramFeatureKey]
    : undefined;
  const baselineSlopeData = scatterFeatureKey
    ? resultData?.explain_json.explain_scatter[scatterFeatureKey]
    : undefined;
  const baselineBinRatioData = binRatioFeatureKey
    ? (resultData?.explain_json.explain_bin_ratio[
        binRatioFeatureKey
      ] as BaselineBinRatioMock[string])
    : undefined;
  const baselineDriverMessageItems =
    overviewDescription?.baseline_driver_top10_msg?.filter(
      (item) => item?.title?.trim() || item?.description?.trim()
    ) ?? [];
  const featureMessageItems =
    (overviewFeatureKey && Array.isArray(overviewDescription?.[overviewFeatureKey])
      ? overviewDescription[overviewFeatureKey]
      : []
    ).filter((item) => item?.title?.trim() || item?.description?.trim()) ?? [];
  const hasBaselineDistributionData =
    !!baselineDistributionData &&
    Array.isArray(baselineDistributionData.bins) &&
    baselineDistributionData.bins.length > 1;
  const hasBaselineSlopeData =
    !!baselineSlopeData &&
    Object.values(baselineSlopeData).some((group) => (group?.points?.length ?? 0) > 0);
  const hasBaselineBinRatioData =
    Array.isArray(baselineBinRatioData) && baselineBinRatioData.length > 0;
  const hasBaselineDriverData =
    Array.isArray(resultData?.explain_json.baseline_driver) &&
    resultData.explain_json.baseline_driver.some((item) => {
      const hasShapValue =
        Array.isArray(item?.shap_value) &&
        item.shap_value.some((value) => Number.isFinite(Number(value)));
      const hasColorValue =
        Array.isArray(item?.color_value) &&
        item.color_value.some((value) => Number.isFinite(Number(value)));

      return hasShapValue && hasColorValue;
    });
  const displaySelectedFeature = isLoading ? null : selectedFeature;
  const displayFeatureList = isLoading ? [] : featureList;
  const displayBaselineDriverMessageItems = isLoading ? [] : baselineDriverMessageItems;
  const displayFeatureMessageItems = isLoading ? [] : featureMessageItems;
  const showBaselineDriverChart = !isLoading && hasBaselineDriverData;
  const showBaselineDistributionChart = !isLoading && hasBaselineDistributionData;
  const showBaselineSlopeChart = !isLoading && hasBaselineSlopeData;
  const showBaselineBinRatioChart = !isLoading && hasBaselineBinRatioData;
  const displayExpectedTherapeuticGainData = isLoading ? [] : expectedTherapeuticGainData;

  return (
    <AppLayout headerType="tsi">
      <Loading isLoading={isLoading} />
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
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1
            className="m-0 text-[36px] leading-[1.1] font-semibold tracking-[-1.5px] text-[#111111] [@media(min-width:1470px)]:text-[42px]"
            style={{ fontFamily: "Poppins, Inter, sans-serif" }}
          >
            Subgroup Determinants Analysis
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

        {fetchError && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-red-700">
            {fetchError}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-0">
          <div
            className="flex min-h-0 flex-1 flex-row flex-nowrap items-stretch gap-0"
            style={{ minWidth: 0 }}
          >
            <div
              className="flex min-h-0 w-[400px] flex-shrink-0 flex-col gap-3 overflow-hidden rounded-[36px] p-0 [@media(min-width:1470px)]:w-[520px]"
              style={{
                borderImage:
                  'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
                borderStyle: "solid",
                borderTopWidth: "20px",
                borderRightWidth: "24px",
                borderBottomWidth: "28px",
                borderLeftWidth: "24px",
                borderColor: "transparent",
              }}
            >
              <div
                className="bg-primary-15 flex min-h-0 w-full flex-[3] flex-col gap-6 overflow-hidden rounded-[24px] p-3"
                style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
              >
                <h2 className="text-body2m flex-shrink-0 pl-[2px] text-white">
                  Expected Therapeutic Gain
                </h2>
                <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-[16px] bg-white p-2">
                  {isLoading ? (
                    <div className="flex min-h-0 flex-1 rounded-[12px] bg-white">
                      <WhitePlaceholderBox className="rounded-[12px]" />
                    </div>
                  ) : (
                    <>
                      <div className="flex min-h-0 flex-1 rounded-[12px] bg-white">
                        <MultiRankingBarChart data={displayExpectedTherapeuticGainData} />
                      </div>
                      <div className="flex justify-center">
                        <span className="text-body5 text-neutral-50">Feature</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 w-full flex-[2] flex-col overflow-hidden rounded-[24px] bg-white">
                {isLoading ? (
                  <WhitePlaceholderBox className="rounded-[24px]" />
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
                    <div className="border-neutral-80 -mt-2 flex min-h-[24px] flex-shrink-0 items-center border-b py-2 [@media(max-width:1470px)]:pb-1">
                      <div className="text-body5 text-neutral-30 min-w-0 flex-[3] shrink-0">
                        Rank
                      </div>
                      <div className="text-body5 text-neutral-30 min-w-0 flex-[7] shrink-0 leading-tight">
                        Feature name
                      </div>
                      <div className="text-body5 text-neutral-30 min-w-0 flex-[7] shrink-0 leading-tight">
                        Max Variance Reduc&shy;tion(△▽)
                      </div>
                      <div className="text-body5 text-neutral-30 min-w-0 flex-[5] shrink-0 leading-tight">
                        Contri&shy;bution
                      </div>
                      <div className="text-body5 text-neutral-30 min-w-0 flex-[7] shrink-0 leading-tight">
                        Cutoff (Auto-derived)
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {displayExpectedTherapeuticGainData.map((row, index) => (
                        <div
                          key={`${row.rank}_${index}`}
                          className="border-neutral-80 flex min-h-[36px] items-center border-b py-1"
                        >
                          <div className="text-body5 text-neutral-40 min-w-0 flex-[3]">
                            {row.rank}
                          </div>
                          <div className="text-body5 text-neutral-40 min-w-0 flex-[7] truncate">
                            {row.feature_name}
                          </div>
                          <div className="text-body5 text-neutral-40 min-w-0 flex-[7]">
                            {formatNumberMax2(Number(row.variance_reduction))}
                          </div>
                          <div className="text-body5 text-neutral-40 min-w-0 flex-[5]">
                            {formatPercentMax2(Number(row.relative_contribution))}
                          </div>
                          <div className="text-body5 text-neutral-40 min-w-0 flex-[7]">
                            {formatCutoffValues(row.cutoff)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-[36px] p-0"
              style={{
                borderImage:
                  'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
                borderStyle: "solid",
                borderTopWidth: "20px",
                borderRightWidth: "24px",
                borderBottomWidth: "28px",
                borderLeftWidth: "24px",
                borderColor: "transparent",
                paddingBottom: 24,
              }}
            >
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex">
                  <div
                    className="bg-primary-15 flex flex-1 flex-col gap-6 rounded-[24px] p-3"
                    style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                  >
                    <h2 className="text-body2m flex-shrink-0 pl-[2px] text-white">
                      Baseline driver Top 10
                    </h2>
                    <div className="flex flex-row gap-3">
                      <div className="flex min-h-0 min-w-0 flex-[7] flex-col">
                        <div className="flex w-full flex-col gap-6 rounded-[16px] bg-white p-3">
                          {isLoading ? (
                            <div
                              className="flex w-full rounded-[12px] bg-white"
                              style={{ aspectRatio: "1 / 0.5" }}
                            >
                              <WhitePlaceholderBox className="rounded-[12px]" />
                            </div>
                          ) : (
                            <>
                              <h3 className="text-body5m flex-shrink-0 text-center text-neutral-50">
                                {`Baseline Features Explaining △${resultData?.outcome ?? "ADAS-Cog"}`}
                              </h3>
                              <div
                                className="flex w-full rounded-[12px] bg-white"
                                style={{ aspectRatio: "1 / 0.5" }}
                              >
                                <div className="min-h-0 min-w-0 flex-1">
                                  {showBaselineDriverChart ? (
                                    <SHAPSummaryPlotChart
                                      data={resultData?.explain_json.baseline_driver}
                                      showTooltip={false}
                                    />
                                  ) : (
                                    <WhitePlaceholderBox className="rounded-[12px]" />
                                  )}
                                </div>
                                <div
                                  className="flex flex-shrink-0 flex-col items-center justify-center gap-1.5 pl-[2px]"
                                  style={{ width: 32 }}
                                >
                                  <span className="text-body5m text-neutral-50">High</span>
                                  <div
                                    className="flex-1 rounded-[4px]"
                                    style={{
                                      width: 12,
                                      minHeight: 120,
                                      background: "linear-gradient(to bottom, #231F52, #D8D3FF)",
                                    }}
                                  />
                                  <span className="text-body5m text-neutral-50">Low</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-[3] flex-col justify-start">
                        <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                          {displayBaselineDriverMessageItems.map((item, index) => (
                            <li
                              key={`${item.no ?? index}-${item.title}`}
                              style={{ lineHeight: 1.2 }}
                            >
                              <div className="flex flex-col">
                                <span className="text-body3m mb-1" style={{ lineHeight: 1.2 }}>
                                  {item.title}
                                </span>
                                <span
                                  className="text-body5m whitespace-pre-line"
                                  style={{ lineHeight: 1.2 }}
                                >
                                  {item.description}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 gap-3">
                  <div
                    className="flex flex-[2] flex-col overflow-hidden rounded-[24px] bg-white"
                    style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {displayFeatureList.length === 0 ? (
                        <WhitePlaceholderBox className="rounded-none" />
                      ) : (
                        displayFeatureList.map((feature, index) => (
                          <Button
                            unstyled
                            key={feature}
                            onClick={() => setSelectedFeature(feature)}
                            className={`text-body4 flex h-[48px] w-full items-center gap-[10px] self-stretch px-[12px] py-[12px] transition-colors focus:outline-none ${
                              index < displayFeatureList.length - 1
                                ? "border-neutral-90 border-b"
                                : ""
                            } ${
                              selectedFeature === feature
                                ? "bg-primary-15 text-white hover:bg-[#2e2a66] active:bg-[#1e1a44]"
                                : "text-neutral-30 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                            }`}
                          >
                            {feature}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>

                  <div
                    className="bg-primary-15 flex flex-[8] flex-shrink-0 flex-row gap-3 rounded-[24px] p-3"
                    style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                  >
                    <div className="flex min-w-0 flex-[5] flex-col gap-3">
                      <div className="flex w-full flex-shrink-0 flex-col gap-3 rounded-[12px] bg-white px-3 pt-3 pb-2">
                        <h3 className="text-body4 text-primary-15">
                          Baseline Distribution
                          {displaySelectedFeature ? ` of ${displaySelectedFeature}` : ""} (Baseline)
                        </h3>
                        <div className="h-[200px] [@media(min-width:1470px)]:h-[300px]">
                          {showBaselineDistributionChart ? (
                            <BaselineDistributionHistogram
                              histogramData={baselineDistributionData}
                              height="100%"
                              showTooltip={false}
                            />
                          ) : (
                            <WhitePlaceholderBox className="rounded-[12px]" />
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-shrink-0 flex-col gap-3 rounded-[12px] bg-white px-3 pt-3 pb-2">
                        <h3 className="text-body4 text-primary-15">
                          ADAS Progression Slope
                          {displaySelectedFeature ? ` vs. ${displaySelectedFeature}` : ""}{" "}
                          (Baseline)
                        </h3>
                        <div className="h-[200px] [@media(min-width:1470px)]:h-[300px]">
                          {showBaselineSlopeChart ? (
                            <ScatterSlopeChart
                              data={baselineSlopeData}
                              height="100%"
                              showTooltip={false}
                            />
                          ) : (
                            <WhitePlaceholderBox className="rounded-[12px]" />
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-shrink-0 flex-col gap-3 rounded-[12px] bg-white px-3 pt-3 pb-2">
                        <h3 className="text-body4 text-primary-15">
                          Subgroup Proportion
                          {displaySelectedFeature ? ` by ${displaySelectedFeature}` : ""} (Baseline)
                        </h3>
                        <div className="h-[200px] [@media(min-width:1470px)]:h-[300px]">
                          {showBaselineBinRatioChart ? (
                            <SubgroupProportionChart
                              data={baselineBinRatioData}
                              height="100%"
                              showTooltip={false}
                            />
                          ) : (
                            <WhitePlaceholderBox className="rounded-[12px]" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-[3] flex-col justify-start">
                      <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                        {displayFeatureMessageItems.map((item, index) => (
                          <li key={`${item.no ?? index}-${item.title}`} style={{ lineHeight: 1.2 }}>
                            <div className="flex flex-col">
                              <span className="text-body3m mb-1" style={{ lineHeight: 1.2 }}>
                                {item.title}
                              </span>
                              <span
                                className="text-body5m whitespace-pre-line"
                                style={{ lineHeight: 1.2 }}
                              >
                                {item.description}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center justify-end gap-4 pr-2">
            <button type="button" className="btn-tsi btn-tsi-secondary">
              Save Progress
            </button>
            <button
              type="button"
              onClick={handleClickViewReport}
              className="btn-tsi btn-tsi-primary"
              disabled={!selectedFeature}
            >
              View Report
            </button>
          </div>
        </div>
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
