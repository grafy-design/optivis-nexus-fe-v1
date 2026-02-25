"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import { MultiRankingBarChart } from "@/components/charts/MultiRankingBarChart";
import { SHAPSummaryPlotChart } from "@/components/charts/SHAPSummaryPlotChart";

import {
  BASE_LINE_DRIVER_MOCK,
  BASELINE_BIN_RATIO_MOCK,
  BASELINE_DISTRIBUTION_MOCK,
  BASELINE_SLOPE_MOCK,
  EXPORTED_THERAPEUTIC_GAIN_MOCK,
} from "./mock";
import { BaselineDistributionHistogram } from "@/components/charts/BaselineDistributionHistogram";
import { ScatterSlopeChart } from "@/components/charts/ScatterSlopeChart";
import { SubgroupProportionChart } from "@/components/charts/SubgroupProportionChart";
import { useRouter, useSearchParams } from "next/navigation";
import { getExplainList } from "@/services/subgroupService";

const FEATURE_LIST = [
  "ADAS Cog 11 BL",
  "ADAS Cog 13 BL",
  "ADORIENT",
  "ADRECOG",
  "CDJUD",
  "CDMEM",
  "ADDRECALL",
  "ADAS Cog 13",
  "PTAU",
];
const DEFAULT_SELECTED_FEATURE = "ADDRECALL";

type TherapeuticGainMetric = "variance_reduction" | "relative_contribution";
type TherapeuticGainRiskType = "Slow" | "Rapid";
type TherapeuticGainItem = {
  rank: number;
  variance_reduction: number;
  relative_contribution: number;
  cutoff: number[];
  risk_type: TherapeuticGainRiskType;
  feature_name: string;
};

type MultiRankingBarItem = {
  id: string;
  rank: number;
  label: string;
  value: number;
};

type BaselineSlopeGroup = {
  points: { x: number; y: number }[];
  regression?: { slope: number; intercept: number };
};

type BaselineSlopeFeature = Record<string, BaselineSlopeGroup>;

type BaselineSlopeMock = Record<string, BaselineSlopeFeature>;
type BinRatioItem = { range: number[]; [groupKey: string]: number[] | number | undefined };
type BaselineBinRatioMock = Record<string, BinRatioItem[]>;

const convertTherapeuticGainToMultiRankingData = (
  rows: TherapeuticGainItem[],
  options: {
    metric: TherapeuticGainMetric;
    riskType?: TherapeuticGainRiskType;
    topN?: number;
  }
): MultiRankingBarItem[] => {
  const { metric, riskType, topN = 10 } = options;
  const filteredRows = riskType ? rows.filter((row) => row.risk_type === riskType) : rows;

  const byRank = new Map<number, TherapeuticGainItem>();
  filteredRows
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .forEach((row) => {
      if (!byRank.has(row.rank)) {
        byRank.set(row.rank, row);
      }
    });

  return Array.from(byRank.values())
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN)
    .map((row) => ({
      id: `${riskType ?? "all"}-${row.rank}-${row.feature_name}`,
      rank: row.rank,
      label: `#${row.rank}`,
      value: Number(row[metric]) || 0,
    }));
};

const EXPECTED_THERAPEUTIC_GAIN_CHART_DATA = convertTherapeuticGainToMultiRankingData(
  EXPORTED_THERAPEUTIC_GAIN_MOCK as TherapeuticGainItem[],
  {
    metric: "variance_reduction",
    riskType: "Slow",
  }
);

const MOCK_TASK_ID = "test-task-id";
/**
 * TSI Step 5: Subgroup Explain
 * 구조: 상위 배경 카드 2개 나란히
 * - 왼쪽 상위: explain-left.png → 안에 파란색 그래프 카드 + 흰색 테이블 카드
 * - 오른쪽 상위: explain-right.png → 안에 파란색 그래프 카드 + 설명 / 흰색 카드 + 파란색 카드(흰색 그래프 3개) + 설명
 */
export default function TSISubgroupExplainPage() {
  const [selectedFeature, setSelectedFeature] = useState(DEFAULT_SELECTED_FEATURE);
  const searchParams = useSearchParams();
  const subgroupId = searchParams.get("subgroupId") ?? "";

  const router = useRouter();
  const baselineDistributionData =
    BASELINE_DISTRIBUTION_MOCK[selectedFeature] ??
    BASELINE_DISTRIBUTION_MOCK[DEFAULT_SELECTED_FEATURE] ??
    BASELINE_DISTRIBUTION_MOCK.ADDRECALL ??
    BASELINE_DISTRIBUTION_MOCK.ADRECOG ??
    Object.values(BASELINE_DISTRIBUTION_MOCK)[0];
  const baselineSlopeMock = BASELINE_SLOPE_MOCK as BaselineSlopeMock;
  const baselineSlopeData =
    baselineSlopeMock[selectedFeature] ??
    baselineSlopeMock[DEFAULT_SELECTED_FEATURE] ??
    baselineSlopeMock.ADDRECALL ??
    baselineSlopeMock.ADRECOG ??
    Object.values(baselineSlopeMock)[0];
  const baselineBinRatioMock = BASELINE_BIN_RATIO_MOCK as BaselineBinRatioMock;
  const baselineBinRatioData =
    baselineBinRatioMock[selectedFeature] ??
    baselineBinRatioMock[DEFAULT_SELECTED_FEATURE] ??
    baselineBinRatioMock.ADDRECALL ??
    baselineBinRatioMock.ADRECOG ??
    Object.values(baselineBinRatioMock)[0];

  const handleClickViewReport = () => {
    router.push(`/tsi/${selectedFeature}/report`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await getExplainList(MOCK_TASK_ID, subgroupId);

      console.log(res);
    };

    fetchData();
  }, [subgroupId]);
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
                <MultiRankingBarChart data={EXPECTED_THERAPEUTIC_GAIN_CHART_DATA} />
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
                  {EXPORTED_THERAPEUTIC_GAIN_MOCK.filter(
                    ({ risk_type }) => risk_type === "Rapid"
                  ).map((row, index) => (
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
                    <SHAPSummaryPlotChart data={BASE_LINE_DRIVER_MOCK} />
                  </div>
                </div>

                {/* 설명 텍스트 */}
                <div className="flex min-w-0 flex-1 flex-col justify-end">
                  <ul className="flex list-disc flex-col gap-3 pl-4 text-white">
                    <li className="break-words">
                      <span className="text-body1m">X-axis (SHAP value):</span>
                      <br />
                      <span className="text-body4m">
                        Represents the impact on the model's predicted value. A value further to the
                        right of 0 indicates a factor that increases the output (in this case,
                        ΔADAS-Cog).
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">Color (Feature Value):</span>
                      <br />
                      <span className="text-body4m">
                        Represents the magnitude (size) of the value for that specific variable.
                        High value, Light Blue. Low value.
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">Dot:</span>
                      <br />
                      <span className="text-body4m">
                        Each dot represents one patient. A thicker (denser) vertical accumulation of
                        dots indicates a higher concentration of data points, representing higher
                        frequency and reliability in that specific range.
                      </span>
                    </li>
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
                  {FEATURE_LIST.map((feature, index) => (
                    <button
                      key={feature}
                      onClick={() => setSelectedFeature(feature)}
                      className={`text-body4 flex h-[59px] w-full items-center gap-[10px] self-stretch px-[12px] py-[18px] transition-colors ${
                        index < FEATURE_LIST.length - 1 ? "border-neutral-90 border-b" : ""
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
                    <li className="break-words">
                      <span className="text-body1m">ADAS Word Delay Recall:</span>
                      <br />
                      <span className="text-body4m">
                        Higher scores indicate worse cognitive performance (greater disease
                        severity).
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">Early Detection Indicator:</span>
                      <br />
                      <span className="text-body4m">
                        Delayed word recall is used as a highly sensitive indicator for the early
                        detection of the disease, as it is one of the first symptoms to appear in
                        patients with Alzheimer's disease or Mild Cognitive Impairment (MCI).
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">Core Assessment Goal:</span>
                      <br />
                      <span className="text-body4m">
                        It is a key assessment item that captures memory decline, particularly in
                        the early stages of dementia, by measuring how well one can remember 10
                        recently learned words after a short period of time.
                      </span>
                    </li>
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
