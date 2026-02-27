"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  MultiLineWithErrorBar,
  type ErrorBarGroup,
  type ErrorBarPoint,
} from "@/components/charts/MultiLineWithErrorBar";
import {
  RiskResponseMatrixChartPanel,
  StratificationComparisonChartPanel,
  StratificationComparisonChartPanelAlt,
  type ForestIntervalData,
  type RiskMetricKey,
  type RiskResponseRow,
  type RiskResponseSet,
  type VarianceBarsChartData,
  type VarianceStackChartData,
} from "./components/ReportChartPanels";
import { getReportByFeature } from "@/services/subgroupService";
import type {
  ReportByFeatureResponse,
  ReportRiskResponseAssessmentItem,
  ReportStratificationStrategyItem,
} from "@/services/subgroupService";

/**
 * TSI (Target Subgroup Identification) Report 페이지.
 * Step 6: 리포트 페이지
 */

type SubgroupLegendRow = {
  subgroupName: string;
  riskLabel: string;
  cutoff: string;
};

const RISK_SERIES_COLORS = ["#A6A3E3", "#6E6AA7", "#272354"];
const FEATURE_BASED_RISK_SERIES_COLORS = ["#26225B", "#EF6A00", "#4327E6"];

const REPORT_SET_TYPES = ["feature_based", "model_based"] as const;
const REPORT_SET_TYPE_TO_NAME = {
  feature_based: "Set 1",
  model_based: "Set 2",
} as const;
const REPORT_SET_TYPE_TO_COLORS = {
  feature_based: ["#3E26D9", "#EF6A00", "#2C295A"],
  model_based: ["#4E4C84", "#7773AC", "#A5A1D9"],
} as const;

const getGroupOrder = <T extends { group: string }>(rows: T[]): string[] => {
  return Array.from(new Set(rows.map((row) => row.group))).sort((a, b) => {
    const aNum = Number(a.replace(/\D/g, ""));
    const bNum = Number(b.replace(/\D/g, ""));
    if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
      return a.localeCompare(b);
    }
    return aNum - bNum;
  });
};

const mapStrategyToErrorBarGroup = (
  strategyRows: ReportStratificationStrategyItem[],
  fallback: ErrorBarGroup[]
): ErrorBarGroup[] => {
  if (strategyRows.length === 0) return fallback;

  const groupOrder = getGroupOrder(strategyRows);
  const grouped = new Map<string, ErrorBarPoint[]>();

  strategyRows.forEach((row) => {
    const error = Math.max(0, (row.ci_high - row.ci_low) / 2);
    const points = grouped.get(row.group) ?? [];
    points.push([row.month, row.mean, error]);
    grouped.set(row.group, points);
  });

  const mapped = groupOrder.map((group) => (grouped.get(group) ?? []).sort((a, b) => a[0] - b[0]));

  return mapped.length > 0 ? mapped : fallback;
};

const getRiskRankByGroup = (strategyRows: ReportStratificationStrategyItem[]): Map<string, number> => {
  const latestRowByGroup = new Map<string, ReportStratificationStrategyItem>();

  strategyRows.forEach((row) => {
    const current = latestRowByGroup.get(row.group);
    if (!current || row.month >= current.month) {
      latestRowByGroup.set(row.group, row);
    }
  });

  return new Map(
    Array.from(latestRowByGroup.entries())
      .sort(([, left], [, right]) => left.mean - right.mean)
      .map(([group], index) => [group, index])
  );
};

const getSeriesLabelByRiskRank = (rank: number, total: number): string => {
  if (total === 2) {
    return rank === 0 ? "Low Risk" : "High Risk";
  }
  if (total === 3) {
    return ["Low Risk", "Mid Risk", "High Risk"][rank] ?? `Risk ${rank + 1}`;
  }
  return `Risk ${rank + 1}`;
};

const getRiskDescriptorByRank = (rank: number, total: number): string => {
  if (total === 2) {
    return rank === 0 ? "Slow" : "Rapid";
  }
  if (total === 3) {
    return ["Slow", "Moderate", "Rapid"][rank] ?? `Group ${rank + 1}`;
  }
  return `Group ${rank + 1}`;
};

const buildProgressionPanelData = (
  strategyRows: ReportStratificationStrategyItem[],
  fallbackChartData: ErrorBarGroup[],
  fallbackRows: SubgroupLegendRow[],
  fallbackSeriesLabels: string[]
) => {
  if (strategyRows.length === 0) {
    return {
      chartData: fallbackChartData,
      rows: fallbackRows,
      seriesLabels: fallbackSeriesLabels,
    };
  }

  const groupOrder = getGroupOrder(strategyRows);
  const cutoffByGroup = new Map<string, string>();
  strategyRows.forEach((row) => {
    if (!cutoffByGroup.has(row.group)) {
      cutoffByGroup.set(row.group, row.cutoff);
    }
  });

  const riskRankByGroup = getRiskRankByGroup(strategyRows);
  const totalGroups = groupOrder.length;

  const rows: SubgroupLegendRow[] = groupOrder.map((group, index) => {
    const riskRank = riskRankByGroup.get(group) ?? index;
    return {
      subgroupName: `Subgroup No.${index + 1}`,
      riskLabel: getRiskDescriptorByRank(riskRank, totalGroups),
      cutoff: cutoffByGroup.get(group) ?? "-",
    };
  });

  const seriesLabels = groupOrder.map((group, index) => {
    const riskRank = riskRankByGroup.get(group) ?? index;
    return getSeriesLabelByRiskRank(riskRank, totalGroups);
  });

  return {
    chartData: mapStrategyToErrorBarGroup(strategyRows, fallbackChartData),
    rows,
    seriesLabels,
  };
};

type DiseaseProgressionPanelProps = {
  chartData: ErrorBarGroup[];
  rows: SubgroupLegendRow[];
  seriesLabels: string[];
  seriesColors: string[];
};

const buildProgressionYAxis = (chartData: ErrorBarGroup[]) => {
  const defaultRange = { min: -3.5, max: 15.5, interval: 2.5 };
  const points = chartData.flat();
  if (points.length === 0) return defaultRange;

  const minValue = Math.min(...points.map(([, y, error]) => y - error));
  const maxValue = Math.max(...points.map(([, y, error]) => y + error));
  const interval = 2.5;

  return {
    min: Math.floor(Math.min(defaultRange.min, minValue) / interval) * interval,
    max: Math.ceil(Math.max(defaultRange.max, maxValue) / interval) * interval,
    interval,
  };
};

const CHART_21_LEFT_STACK_DATA: VarianceStackChartData = {
  within: 20,
  explained: 10,
  max: 35,
  ticks: [0, 5, 10, 15, 20, 25, 30, 35],
  vrLabel: "VR: 0.348 (95% CI: 0.27-0.44)",
  withinColor: "#9C97D0",
  explainedColor: "#26225B",
};

const CHART_21_RIGHT_BAR_DATA: VarianceBarsChartData = {
  max: 50,
  ticks: [0, 10, 20, 30, 40, 50],
  threshold: 30,
  bars: [
    { label: "High Risk", value: 50, weightLabel: "w=37", color: "#26225B" },
    { label: "Mid Risk", value: 30, weightLabel: "w=198", color: "#7A74AC" },
    { label: "Low Risk", value: 13, weightLabel: "w=203", color: "#A39ED5" },
  ],
};

const CHART_22_LEFT_BAR_DATA: VarianceBarsChartData = {
  max: 50,
  ticks: [0, 10, 20, 30, 40, 50],
  threshold: 30,
  bars: [
    { label: "High Risk", value: 50, weightLabel: "w=37", color: "#4327E6" },
    { label: "Mid Risk", value: 30, weightLabel: "w=198", color: "#EF6A00" },
    { label: "Low Risk", value: 13, weightLabel: "w=203", color: "#26225B" },
  ],
};

const CHART_22_RIGHT_STACK_DATA: VarianceStackChartData = {
  within: 20,
  explained: 10,
  max: 50,
  ticks: [0, 10, 20, 30, 40, 50],
  vrLabel: "VR: 0.348 (95% CI: 0.27-0.44)",
  withinColor: "#B7B7BC",
  explainedColor: "#EF6A00",
};

function DiseaseProgressionPanel({
  chartData,
  rows,
  seriesLabels,
  seriesColors,
}: DiseaseProgressionPanelProps) {
  const yAxisRange = buildProgressionYAxis(chartData);

  return (
    <div className="mt-auto flex h-[656px] w-full flex-shrink-0 flex-col rounded-[16px] border-[3px] border-[#8A47FF] bg-[#ECECF1] p-5">
      <h4 className="text-h3 text-neutral-20 flex-shrink-0">Disease Progression by Subgroup</h4>
      <div className="mt-3 h-px flex-shrink-0 bg-[#B7B6BE]" />

      <div className="mt-3 min-h-0 flex-1">
        <MultiLineWithErrorBar
          dataGroup={chartData}
          seriesLabels={seriesLabels}
          colors={seriesColors}
          height={390}
          xAxis={{
            min: 0,
            max: 24,
            interval: 3,
            splitLine: true,
            splitLineColor: "#CECDD6",
            axisLineColor: "#CECDD6",
            labelColor: "#4A4949",
            fontSize: 11,
            name: "Month",
            nameColor: "#1B1B1B",
            nameFontSize: 16,
            nameGap: 30,
          }}
          yAxis={{
            min: yAxisRange.min,
            max: yAxisRange.max,
            interval: yAxisRange.interval,
            inverse: true,
            splitLine: true,
            splitLineColor: "#CECDD6",
            axisLineColor: "#CECDD6",
            showLabels: true,
            labelColor: "#4A4949",
            fontSize: 11,
            name: "ADAS-Cog",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
          }}
          guideLineX={12}
          guideLineColor="#272354"
          guideLineWidth={2}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-6">
        {seriesLabels.map((label, index) => {
          const color = seriesColors[index] ?? seriesColors[seriesColors.length - 1] ?? "#272354";
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative h-[2px] w-[84px]" style={{ backgroundColor: color }}>
                <span
                  className="absolute top-1/2 left-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="text-body1 text-neutral-40">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-[#B7B6BE]">
        {rows.map((row, index) => (
          <div
            key={row.subgroupName}
            className={`grid h-[44px] grid-cols-[160px_1fr_220px] items-center ${
              index > 0 ? "border-t border-[#D1D0D8]" : ""
            }`}
          >
            <span className="text-body3m text-neutral-50">{row.subgroupName}</span>
            <span className="text-h4 text-neutral-20">{row.riskLabel}</span>
            <div className="flex items-center justify-end gap-2">
              <span className="text-body3m text-neutral-50">Cutoff</span>
              <span className="text-h4 text-neutral-20">{row.cutoff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StratificationComparisonChartMockPanel() {
  return (
    <StratificationComparisonChartPanel
      leftStack={CHART_21_LEFT_STACK_DATA}
      rightBars={CHART_21_RIGHT_BAR_DATA}
    />
  );
}

function StratificationComparisonChartMockPanelAlt() {
  return (
    <StratificationComparisonChartPanelAlt
      leftBars={CHART_22_LEFT_BAR_DATA}
      rightStack={CHART_22_RIGHT_STACK_DATA}
    />
  );
}

type FeatureBasedDiseaseProgressionPanelProps = {
  chartData: ErrorBarGroup[];
  rows: SubgroupLegendRow[];
  seriesLabels: string[];
  seriesColors: string[];
};

function FeatureBasedDiseaseProgressionPanel({
  chartData,
  rows,
  seriesLabels,
  seriesColors,
}: FeatureBasedDiseaseProgressionPanelProps) {
  const yAxisRange = buildProgressionYAxis(chartData);

  return (
    <div className="mt-auto flex h-[656px] w-full flex-shrink-0 flex-col rounded-[16px] bg-[#ECECF1] p-5">
      <h4 className="text-h3 text-neutral-20 flex-shrink-0">Disease Progression by Subgroup</h4>
      <div className="mt-3 h-px flex-shrink-0 bg-[#A9A8B2]" />

      <div className="mt-3 min-h-0 flex-1">
        <MultiLineWithErrorBar
          dataGroup={chartData}
          seriesLabels={seriesLabels}
          colors={seriesColors}
          height={430}
          xAxis={{
            min: 0,
            max: 24,
            interval: 3,
            splitLine: true,
            splitLineColor: "#CBCAD3",
            axisLineColor: "#CBCAD3",
            labelColor: "#4A4949",
            fontSize: 11,
            name: "Month",
            nameColor: "#1B1B1B",
            nameFontSize: 16,
            nameGap: 30,
          }}
          yAxis={{
            min: yAxisRange.min,
            max: yAxisRange.max,
            interval: yAxisRange.interval,
            inverse: true,
            splitLine: true,
            splitLineColor: "#CBCAD3",
            axisLineColor: "#CBCAD3",
            showLabels: true,
            labelColor: "#4A4949",
            fontSize: 11,
            name: "ADAS-Cog",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
          }}
          guideLineX={12}
          guideLineColor="#452CF4"
          guideLineWidth={2}
          guideLineType="dashed"
        />
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-6">
        {seriesLabels.map((label, index) => {
          const color = seriesColors[index] ?? seriesColors[seriesColors.length - 1] ?? "#4327E6";
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative h-[2px] w-[86px]" style={{ backgroundColor: color }}>
                <span
                  className="absolute top-1/2 left-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="text-body1 text-neutral-50">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 border-t border-[#A9A8B2]">
        {rows.map((row, index) => (
          <div
            key={row.subgroupName}
            className={`grid h-[42px] grid-cols-[140px_180px_1fr] items-center ${
              index > 0 ? "border-t border-[#CAC9D1]" : ""
            }`}
          >
            <span className="text-body3m text-neutral-50">{row.subgroupName}</span>
            <span className="text-h4 text-neutral-20">{row.riskLabel}</span>
            <div className="flex items-center gap-4">
              <span className="text-body3m shrink-0 text-neutral-50">Cutoff</span>
              <span className="text-h4 text-neutral-20 whitespace-nowrap">{row.cutoff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RISK_METRICS = [
  { key: "diseaseProgression", label: "Disease progression" },
  { key: "drugResponse", label: "Drug response" },
  { key: "safety", label: "Safety" },
] as const;

const mapRiskMetricKey = (item: ReportRiskResponseAssessmentItem): RiskMetricKey | null => {
  const outcome = item.outcome.toLowerCase();
  if (outcome === "cdr-sb") return "diseaseProgression";
  if (outcome === "rhte") return "drugResponse";
  if (outcome === "safety") return "safety";
  return null;
};

const normalizeToPercent = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || Math.abs(max - min) < 1e-9) {
    return 50;
  }
  const scaled = 8 + ((value - min) / (max - min)) * 84;
  return Math.min(96, Math.max(4, scaled));
};

const mapRiskResponseToSets = (
  rows: ReportRiskResponseAssessmentItem[],
  fallback: RiskResponseSet[]
): RiskResponseSet[] => {
  if (rows.length === 0) return fallback;

  const domains: Record<RiskMetricKey, { min: number; max: number }> = {
    diseaseProgression: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    drugResponse: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    safety: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  };

  rows.forEach((row) => {
    const metricKey = mapRiskMetricKey(row);
    if (!metricKey) return;
    domains[metricKey].min = Math.min(domains[metricKey].min, row.ci_low);
    domains[metricKey].max = Math.max(domains[metricKey].max, row.ci_high);
  });

  const sets = REPORT_SET_TYPES.flatMap((setType) => {
    const setRows = rows.filter((row) => row.type === setType);
    if (setRows.length === 0) return [];

    const groupOrder = getGroupOrder(setRows);
    const palette = REPORT_SET_TYPE_TO_COLORS[setType];

    const mappedRows: RiskResponseRow[] = groupOrder.map((group, rowIndex) => {
      const rowColor = palette[rowIndex] ?? palette[palette.length - 1];
      const metrics = {} as Record<RiskMetricKey, ForestIntervalData>;

      RISK_METRICS.forEach(({ key }) => {
        const source = setRows.find(
          (item) => item.group === group && mapRiskMetricKey(item) === key
        );
        if (!source) {
          metrics[key] = { low: 50, mean: 50, high: 50, color: rowColor };
          return;
        }
        const domain = domains[key];
        metrics[key] = {
          low: normalizeToPercent(source.ci_low, domain.min, domain.max),
          mean: normalizeToPercent(source.mean, domain.min, domain.max),
          high: normalizeToPercent(source.ci_high, domain.min, domain.max),
          color: rowColor,
        };
      });

      return {
        groupLabel: `Group ${rowIndex + 1}`,
        metrics,
      };
    });

    return [
      {
        setName: REPORT_SET_TYPE_TO_NAME[setType],
        rows: mappedRows,
      },
    ];
  });

  return sets.length > 0 ? sets : fallback;
};

function TSIReportPageContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") ?? "";
  const subgroupId = searchParams.get("subgroupId") ?? "";
  const [reportResponse, setReportResponse] = useState<ReportByFeatureResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // TODO: subgroup-explain에서 실제 선택한 feature를 전달받아 사용하도록 교체
  const featureName = "ADAS Cog 11";
  const hasRequiredParams = Boolean(taskId && subgroupId);

  useEffect(() => {
    if (!hasRequiredParams) {
      setReportResponse(null);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    setReportResponse(null);
    setFetchError(null);

    const fetchReport = async () => {
      try {
        const response = await getReportByFeature(taskId, subgroupId, featureName);
        if (cancelled) return;
        setReportResponse(response);
      } catch (error) {
        if (cancelled) return;
        setFetchError(error instanceof Error ? error.message : "Subgroup Report 정보 조회에 실패했습니다.");
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [featureName, hasRequiredParams, subgroupId, taskId]);

  if (!hasRequiredParams) {
    return (
      <AppLayout headerType="tsi">
        <div className="mx-auto w-[1772px] max-w-full py-12">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            Report 조회에 필요한 파라미터가 누락되었습니다. (`taskId`, `subgroupId`)
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!reportResponse && !fetchError) {
    return (
      <AppLayout headerType="tsi">
        <div className="mx-auto w-[1772px] max-w-full py-12">
          <div className="rounded-[24px] border border-[#D9D8E2] bg-[#F6F6FA] p-6 text-[#6A687A]">
            리포트 데이터를 조회 중입니다.
          </div>
        </div>
      </AppLayout>
    );
  }

  if (fetchError) {
    return (
      <AppLayout headerType="tsi">
        <div className="mx-auto w-[1772px] max-w-full py-12">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            {fetchError}
          </div>
        </div>
      </AppLayout>
    );
  }
  const reportJson = reportResponse?.data?.report_json;
  const overviewItems = reportJson?.overview_description ?? [];
  const getOverviewContent = (index: number) => {
    const item = overviewItems[index];
    return {
      title: item?.title?.trim() ? item.title : "",
      description: item?.description?.trim() ? item.description : "",
    };
  };
  const modelOverview = getOverviewContent(0);
  const featureOverview = getOverviewContent(1);
  const comparisonOverview = getOverviewContent(2);
  const riskOverview = getOverviewContent(3);

  const modelBasedPanelData = buildProgressionPanelData(
    reportJson?.model_stratification_strategy ?? [],
    [],
    [],
    []
  );
  const featureBasedPanelData = buildProgressionPanelData(
    reportJson?.feature_stratification_strategy ?? [],
    [],
    [],
    []
  );
  const riskResponseSets = mapRiskResponseToSets(
    reportJson?.risk_response_assessment ?? [],
    []
  );
  const hasModelBasedData = modelBasedPanelData.chartData.length > 0;
  const hasFeatureBasedData = featureBasedPanelData.chartData.length > 0;
  const hasComparisonSectionData = hasModelBasedData && hasFeatureBasedData;
  const hasRiskResponseData = riskResponseSets.length > 0;

  return (
    <AppLayout headerType="tsi">
      <div className="flex w-full min-w-0 flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="mb-[42px] flex w-full max-w-full justify-center">
          <div className="mx-auto w-[1772px] max-w-full flex-shrink-0">
            <div className="flex flex-shrink-0 flex-col items-start gap-1">
              <div className="text-title text-neutral-5 mb-2 text-left">
                Subgroup Analysis Report : {featureName}
              </div>
              <p className="text-body2m text-left text-neutral-50">Analysis Summary</p>
            </div>
          </div>
        </div>

        {/* 리포트 배경 카드 */}
        <div
          className="flex h-[2244px] w-[1772px] max-w-[calc(100vw-100px)] flex-shrink-0 flex-col overflow-hidden rounded-[36px] bg-white px-[12px] py-[26px]"
          style={{
            backgroundImage: "url(/assets/tsi/report-bg.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* 리포트 내용 영역 */}
          <div className="flex flex-1 flex-col">
            {/* 첫 번째 섹션: Stratification Strategy Comparison (150px y부터, 1748px 너비, 962px 높이) */}
            <div className="mx-auto mb-[100px] h-[962px] w-[1748px] max-w-full min-w-0 flex-shrink-0">
              <div className="flex h-full w-full flex-col">
                {/* 섹션 제목 */}
                <h2 className="text-h2 text-primary-15 mb-[40px] ml-[28px] flex-shrink-0">
                  Stratification Strategy Comparison
                </h2>

                {/* 두 개의 파란색 카드 나란히 */}
                <div className="flex w-full flex-shrink-0 flex-row gap-4">
                  {/* 왼쪽 카드: Executive Summary & Stratification Strategy */}
                  <div className="bg-primary-15 flex h-[880px] flex-1 flex-col overflow-hidden rounded-[24px] p-5">
                    {/* Model Based 라벨 */}
                    <div className="mb-4 flex-shrink-0">
                      <span className="text-body5 flex h-[24px] w-[104px] items-center justify-center gap-2 rounded-md bg-orange-500 font-medium text-white">
                        Model Based
                      </span>
                    </div>
                    <h4 className="text-h4 mb-4 flex-shrink-0 text-white">
                      {modelOverview.title}
                    </h4>
                    <p className="text-body3m mt-auto mb-6 flex-shrink-0 whitespace-pre-line text-white/90">
                      {modelOverview.description}
                    </p>
                    {hasModelBasedData ? (
                      <DiseaseProgressionPanel
                        chartData={modelBasedPanelData.chartData}
                        rows={modelBasedPanelData.rows}
                        seriesLabels={modelBasedPanelData.seriesLabels}
                        seriesColors={RISK_SERIES_COLORS}
                      />
                    ) : (
                      <div className="mt-auto flex h-[656px] w-full items-center justify-center rounded-[16px] border-[3px] border-[#8A47FF] bg-[#ECECF1]">
                        <p className="text-body2m text-neutral-50">Model Based 데이터가 없습니다.</p>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 카드: Feature-Based Decision Rules */}
                  <div className="bg-primary-15 flex h-[880px] flex-1 flex-col overflow-hidden rounded-[24px] p-5">
                    {/* Feature Based 라벨 */}
                    <div className="mb-4 flex-shrink-0">
                      <span className="text-body5 flex h-[24px] w-[104px] items-center justify-center gap-2 rounded-md bg-orange-500 font-medium text-white">
                        Feature Based
                      </span>
                    </div>
                    <h4 className="text-h4 mb-4 flex-shrink-0 text-white">
                      {featureOverview.title}
                    </h4>
                    <p className="text-body3m mt-auto mb-6 flex-shrink-0 whitespace-pre-line text-white/90">
                      {featureOverview.description}
                    </p>
                    {hasFeatureBasedData ? (
                      <FeatureBasedDiseaseProgressionPanel
                        chartData={featureBasedPanelData.chartData}
                        rows={featureBasedPanelData.rows}
                        seriesLabels={featureBasedPanelData.seriesLabels}
                        seriesColors={FEATURE_BASED_RISK_SERIES_COLORS}
                      />
                    ) : (
                      <div className="mt-auto flex h-[656px] w-full items-center justify-center rounded-[16px] bg-[#ECECF1]">
                        <p className="text-body2m text-neutral-50">Feature Based 데이터가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 두 번째 섹션: Stratification Strategy Comparison */}
            <div className="mx-auto mb-[100px] w-[1748px] max-w-full min-w-0 flex-shrink-0">
              <div className="flex w-full flex-col">
                {/* 섹션 제목 */}
                <h2 className="text-h2 text-primary-15 mb-[40px] ml-[28px] flex-shrink-0">
                  Stratification Strategy Comparison
                </h2>
                <div className="border-neutral-90 flex h-[562px] w-[1748px] flex-col rounded-[24px] border bg-white p-4">
                  {hasComparisonSectionData ? (
                    <>
                      {/* 텍스트 영역 */}
                      <div className="w-[850px] flex-shrink-0">
                        <h4 className="text-h4 text-neutral-5 mb-4">{comparisonOverview.title}</h4>
                        <p className="text-body3m whitespace-pre-line text-neutral-40">
                          {comparisonOverview.description}
                        </p>
                      </div>

                      {/* 두 개의 차트 섹션 */}
                      <div className="mt-auto flex w-full flex-shrink-0 gap-4">
                        {/* 첫 번째 차트 섹션 */}
                        <div className="flex h-[378px] w-[850px] flex-shrink-0 flex-col items-start gap-[10px] p-[6px]">
                          <div className="w-full flex-1 overflow-hidden rounded-[16px]">
                            <StratificationComparisonChartMockPanel />
                          </div>
                        </div>
                        {/* 두 번째 차트 섹션 */}
                        <div className="flex h-[378px] w-[850px] flex-shrink-0 flex-col items-start gap-[10px] p-[6px]">
                          <div className="w-full flex-1 overflow-hidden rounded-[16px]">
                            <StratificationComparisonChartMockPanelAlt />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <p className="text-body2m text-neutral-50">
                        비교 분석(Validation) 데이터가 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 세 번째 섹션: Risk & Response Assessment */}
            <div className="mx-auto w-[1748px] max-w-full min-w-0 flex-shrink-0">
              <div className="flex w-full flex-col">
                {/* 섹션 제목 */}
                <h2 className="text-h2 text-primary-15 mb-[40px] ml-[28px] flex-shrink-0">
                  Risk & Response Assessment
                </h2>
                <div className="border-neutral-90 flex h-[322px] w-[1748px] gap-4 rounded-[24px] border bg-white p-4">
                  {/* 왼쪽: 타이틀 영역 */}
                  <div className="flex h-[290px] w-[414px] flex-shrink-0 flex-col items-start gap-[28px]">
                    <div className="flex w-full flex-col items-start gap-[24px]">
                      <h3 className="text-h4 text-neutral-5">{riskOverview.title}</h3>
                      <p className="text-body3m whitespace-pre-line text-neutral-40">
                        {riskOverview.description}
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽: 포레스트 플롯 */}
                  <div className="flex min-w-0 flex-1">
                    {hasRiskResponseData ? (
                      <RiskResponseMatrixChartPanel sets={riskResponseSets} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-[16px] border border-[#D9D8E2] bg-[#F6F6FA]">
                        <p className="text-body2m text-neutral-50">
                          Risk & Response Assessment 데이터가 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


export default function TSIReportPage() {
  return (
    <Suspense>
      <TSIReportPageContent />
    </Suspense>
  );
}
