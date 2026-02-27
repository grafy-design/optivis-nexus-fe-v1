"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import { MultiRankingBarChart } from "@/components/charts/MultiRankingBarChart";
import { SHAPSummaryPlotChart } from "@/components/charts/SHAPSummaryPlotChart";

import { BaselineDistributionHistogram } from "@/components/charts/BaselineDistributionHistogram";
import { ScatterSlopeChart } from "@/components/charts/ScatterSlopeChart";
import { SubgroupProportionChart } from "@/components/charts/SubgroupProportionChart";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExplainExpectedTherapeuticGainItem,
  ExplainListData,
  ExplainOverviewDescriptionItem,
  getExplainList,
} from "@/services/subgroupService";

type BinRatioItem = { range: number[]; [groupKey: string]: number[] | number | undefined };
type BaselineBinRatioMock = Record<string, BinRatioItem[]>;

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
      (item: ExplainOverviewDescriptionItem) => item?.title?.trim() || item?.description?.trim()
    ) ?? [];
  const featureMessages =
    (overviewDescription?.[selectedFeature] ??
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
    if (!taskId || !subgroupId) {
      setResultData(undefined);
      return;
    }

    const fetchData = async () => {
      const res = await getExplainList(taskId, subgroupId);

      setResultData(res.data);
    };

    fetchData();
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
    <AppLayout headerType="tsi">
      <div className="flex w-full flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="mb-2 flex w-full max-w-full justify-center">
          <div className="mx-auto w-[1772px] max-w-full flex-shrink-0">
            <div className="flex flex-shrink-0 flex-col items-start gap-1">
              <div className="text-title text-neutral-5 mb-2 text-left">Subgroup Explain</div>
              <p className="text-body2m text-left text-neutral-50">Drug Responsiveness</p>
            </div>
          </div>
        </div>

        {/* 메인: 상위 배경 카드 2개 나란히 */}
        <div className="mx-auto flex w-[1772px] flex-shrink-0 flex-row flex-nowrap items-stretch gap-2">
          {/* 왼쪽 상위 배경 카드 */}
          <div
            className="flex h-[875px] w-[565px] flex-shrink-0 flex-col overflow-hidden rounded-[36px] bg-white p-3"
            style={{
              backgroundImage: "url(/assets/tsi/explain-left-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* 파란색 그래프 카드: Expected Therapeutic Gain */}
            <div
              className="bg-primary-15 mb-4 flex h-[549px] w-full flex-shrink-0 flex-col overflow-hidden rounded-[24px] p-5"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 className="text-body2 mb-4 flex-shrink-0 text-white">
                Expected Therapeutic Gain
              </h2>
              {/* 그래프 영역 */}
              <div className="mt-auto flex h-[452px] flex-shrink-0 items-center justify-center rounded-[16px] bg-white">
                <MultiRankingBarChart data={expectedTherapeuticGainData} />
              </div>
            </div>

            {/* 흰색 테이블 카드 */}
            <div
              className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px] bg-white"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* 테이블 전체 컨테이너 */}
              <div className="flex min-h-0 flex-1 flex-col px-4">
                {/* 테이블 헤더 */}
                <div className="border-neutral-80 flex h-[64px] flex-shrink-0 items-center gap-4 border-b">
                  <div className="text-body4 text-neutral-30 w-[60px]">Rank</div>
                  <div className="text-body4 text-neutral-30 w-[140px]">Feature name</div>
                  <div className="text-body4 text-neutral-30 w-[140px] leading-tight">
                    Max Variance
                    <br />
                    Reduction(△▽)
                  </div>
                  <div className="text-body4 text-neutral-30 w-[100px]">Contribution</div>
                  <div className="text-body4 text-neutral-30 w-[140px] leading-tight">
                    Cutoff
                    <br />
                    (Auto-derived)
                  </div>
                </div>

                {/* 테이블 바디 */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {expectedTherapeuticGainData.map((row, index) => (
                    <div
                      key={`${row.rank}_${index}`}
                      className="border-neutral-80 flex h-[52px] items-center gap-4 border-b"
                    >
                      <div className="text-body4 text-neutral-40 w-[60px]">{row.rank}</div>
                      <div className="text-body4 text-neutral-40 w-[140px]">{row.feature_name}</div>
                      <div className="text-body4 text-neutral-40 w-[140px]">
                        {row.variance_reduction}
                      </div>
                      <div className="text-body4 text-neutral-40 w-[100px]">
                        {row.relative_contribution.toFixed(2)}%
                      </div>
                      <div className="text-body4 text-neutral-40 w-[140px]">{row.cutoff}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 상위 배경 카드 */}
          <div
            className="flex h-[1075px] w-[1195px] flex-shrink-0 flex-col overflow-hidden rounded-[36px] bg-white p-3"
            style={{
              backgroundImage: "url(/assets/tsi/explain-right-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* 상단 행: 파란색 그래프 카드 + 설명 텍스트 */}
            <div className="mb-[12px] flex flex-shrink-0 gap-4">
              {/* 파란색 그래프 카드: Baseline driver Top 10 (전체 너비) */}
              <div
                className="bg-primary-15 flex h-[423px] flex-1 flex-shrink-0 flex-row gap-5 overflow-hidden rounded-[24px] p-4"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 그래프 영역 */}
                <div className="flex w-[659px] flex-shrink-0 flex-col">
                  <h2 className="text-body2 mb-4 flex-shrink-0 text-white">
                    Baseline driver Top 10
                  </h2>
                  <div className="mt-auto flex h-[322px] w-full flex-shrink-0 items-center justify-center rounded-[16px] bg-white">
                    <SHAPSummaryPlotChart data={resultData?.explain_json.baseline_driver} />
                  </div>
                </div>

                {/* 설명 텍스트 */}
                <div className="flex min-w-0 flex-1 flex-col justify-end">
                  <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                    {baselineDriverMessageItems.map((item: ExplainOverviewDescriptionItem, index: number) => (
                      <li
                        key={`${item.no ?? index}-${item.title}`}
                        className="break-words"
                      >
                        <span className="text-body1m">{item.title}</span>
                        <br />
                        <span className="text-body4m whitespace-pre-line">{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 하단 행: 흰색 카드 + 파란색 카드(흰색 그래프 3개 + 설명) */}
            <div className="flex min-h-0 flex-1 gap-[12px]">
              {/* 왼쪽 흰색 카드: Feature 목록 */}
              <div
                className="flex h-[616px] w-[200px] flex-shrink-0 flex-col overflow-hidden rounded-[24px] bg-white py-3"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {featureList.map((feature, index) => (
                    <button
                      key={feature}
                      onClick={() => setSelectedFeature(feature)}
                      className={`text-body4 flex h-[59px] w-full items-center gap-[10px] self-stretch px-[12px] py-[18px] transition-colors ${
                        index < featureList.length - 1 ? "border-neutral-90 border-b" : ""
                      } ${
                        selectedFeature === feature
                          ? "bg-primary-15 text-white"
                          : "text-neutral-0 hover:bg-neutral-95"
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* 파란색 카드: 흰색 그래프 카드 3개 + 설명 텍스트 (나머지 전체 너비) */}
              <div
                className="bg-primary-15 flex h-[616px] flex-1 flex-shrink-0 flex-row gap-4 overflow-hidden rounded-[24px] p-4"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 그래프 카드 3개 세로 배치 */}
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  {/* 그래프 카드 1: Baseline Distribution */}
                  <div className="flex min-h-0 w-[442px] flex-1 flex-col overflow-hidden rounded-[16px] bg-white p-4">
                    <h3 className="text-body4 text-neutral-40 mb-3">
                      Baseline Distribution of {selectedFeature} (Baseline)
                    </h3>
                    <div className="flex min-h-0 flex-1 items-center justify-center rounded bg-white">
                      <BaselineDistributionHistogram
                        histogramData={
                          baselineDistributionData ?? {
                            bins: [],
                            groups: {},
                          }
                        }
                      />
                    </div>
                  </div>

                  {/* 그래프 카드 2: ADAS Progression Slope */}
                  <div className="flex min-h-0 w-[442px] flex-1 flex-col overflow-hidden rounded-[16px] bg-white p-4">
                    <h3 className="text-body4 text-neutral-40 mb-3">
                      ADAS Progression Slope vs. {selectedFeature} (Baseline)
                    </h3>
                    <div className="flex min-h-0 flex-1 items-center justify-center rounded bg-white">
                      <ScatterSlopeChart data={baselineSlopeData ?? {}} />
                    </div>
                  </div>

                  {/* 그래프 카드 3: Subgroup Proportion */}
                  <div className="flex min-h-0 w-[442px] flex-1 flex-col overflow-hidden rounded-[16px] bg-white p-4">
                    <h3 className="text-body4 text-neutral-40 mb-3">
                      Subgroup Proportion by {selectedFeature} (Baseline)
                    </h3>
                    <div className="flex min-h-0 flex-1 items-center justify-center rounded bg-white">
                      <SubgroupProportionChart data={baselineBinRatioData ?? []} />
                    </div>
                  </div>
                </div>

                {/* 오른쪽 설명 텍스트 */}
                <div className="flex min-w-0 flex-1 flex-col justify-start pt-4">
                  <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                    {featureMessageItems.map((item: ExplainOverviewDescriptionItem, index: number) => (
                      <li
                        key={`${item.no ?? index}-${item.title}`}
                        className="break-words"
                      >
                        <span className="text-body1m">{item.title}</span>
                        <br />
                        <span className="text-body4m whitespace-pre-line">{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼: 카드 밖 아래 */}
        <div className="mx-auto mt-4 flex w-[1772px] flex-shrink-0 items-center justify-end gap-4 pb-2">
          <button
            type="button"
            className="inline-flex h-[48px] cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-90"
            aria-label="Save Progress"
          >
            <Image
              src="/assets/tsi/savebtn.png"
              alt="Save Progress"
              width={160}
              height={48}
              className="h-[48px] w-auto object-contain"
            />
          </button>
          <button
            type="button"
            className="text-body3 text-neutral-30 inline-flex h-[48px] w-[179px] shrink-0 cursor-pointer items-center justify-center rounded-[100px] border-0 bg-cover bg-center bg-no-repeat transition-opacity hover:opacity-90"
            style={{ backgroundImage: "url(/assets/tsi/btn.png)" }}
            aria-label="View Report"
            onClick={handleClickViewReport}
          >
            View Report
          </button>
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
