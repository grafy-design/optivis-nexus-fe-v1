"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/common/Loading";
import type { ErrorBarGroup, ErrorBarPoint } from "@/components/charts/MultiLineWithErrorBar";
import {
  TSIDiseaseProgressionPanel,
  TSIForestMetricChart,
  TSIStackedVarianceChart,
  TSIVarianceByGroupBarChart,
  type ForestIntervalData,
  type RiskMetricKey,
  type RiskResponseRow,
  type RiskResponseSet,
  type TSISubgroupLegendRow,
  type VarianceBarsChartData,
  type VarianceStackChartData,
} from "@/components/charts/tsi-report";
import { getReportByFeature } from "@/services/subgroup-service";
import type {
  ReportByFeatureResponse,
  ReportRiskResponseAssessmentItem,
  ReportStratificationStrategyItem,
  ReportVarianceDecompositionItem,
  ReportWithinGroupVarianceItem,
} from "@/services/subgroup-service";

/**
 * TSI (Target Subgroup Identification) Report 페이지.
 * Step 6: 리포트 페이지
 */

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

type ComparisonChartData = {
  stack: VarianceStackChartData;
  bars: VarianceBarsChartData;
};

type ComparisonColorSet = {
  stack: {
    within: string;
    explained: string;
  };
  bars: {
    high: string;
    middle: string;
    low: string;
    default: string;
  };
};

const MODEL_COMPARISON_COLORS: ComparisonColorSet = {
  stack: { within: "#9C97D0", explained: "#26225B" },
  bars: { high: "#26225B", middle: "#7A74AC", low: "#A39ED5", default: "#26225B" },
};

const FEATURE_COMPARISON_COLORS: ComparisonColorSet = {
  stack: { within: "#B7B7BC", explained: "#EF6A00" },
  bars: { high: "#4327E6", middle: "#EF6A00", low: "#26225B", default: "#26225B" },
};

const RISK_METRICS = [
  { key: "diseaseProgression", label: "Disease progression" },
  { key: "drugResponse", label: "Drug response" },
  { key: "safety", label: "Safety" },
] as const;

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

const getRiskRankByGroup = (
  strategyRows: ReportStratificationStrategyItem[]
): Map<string, number> => {
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
  fallbackRows: TSISubgroupLegendRow[],
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

  const rows: TSISubgroupLegendRow[] = groupOrder.map((group, index) => {
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

const normalizeClassification = (classification: string): "high" | "middle" | "low" | "" => {
  const normalized = classification.trim().toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "middle" || normalized === "mid") return "middle";
  if (normalized === "low") return "low";
  return "";
};

const classificationOrder = (classification: string): number => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return 0;
  if (normalized === "middle") return 1;
  if (normalized === "low") return 2;
  return 99;
};

const toRiskLabel = (classification: string, group: string): string => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return "High Risk";
  if (normalized === "middle") return "Mid Risk";
  if (normalized === "low") return "Low Risk";
  return group;
};

const toRiskColor = (classification: string, colors: ComparisonColorSet["bars"]): string => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return colors.high;
  if (normalized === "middle") return colors.middle;
  if (normalized === "low") return colors.low;
  return colors.default;
};

const toFiniteOrZero = (value: number): number => {
  return Number.isFinite(value) ? value : 0;
};

const buildAxisRange = (baseMax: number, targetSteps = 5) => {
  const safeMax = Math.max(baseMax, 1e-6);
  const roughStep = safeMax / Math.max(targetSteps, 1);
  const exponent = Math.floor(Math.log10(roughStep));
  const magnitude = 10 ** exponent;
  const residual = roughStep / magnitude;

  let niceResidual = 1;
  if (residual > 5) {
    niceResidual = 10;
  } else if (residual > 2) {
    niceResidual = 5;
  } else if (residual > 1) {
    niceResidual = 2;
  }

  const step = niceResidual * magnitude;
  const max = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }

  return { max, ticks };
};

const formatVRLabel = (rows: ReportVarianceDecompositionItem[]): string => {
  const source = rows.find((row) => Number.isFinite(row.vr));
  if (!source) return "VR: -";
  const vrText = source.vr.toFixed(3);
  const ciText = source.ci?.trim();
  if (ciText) return `VR: ${vrText} (95% CI: ${ciText})`;
  return `VR: ${vrText}`;
};

const mapVarianceDecompositionToStackData = (
  rows: ReportVarianceDecompositionItem[],
  colors: ComparisonColorSet["stack"]
): VarianceStackChartData | null => {
  if (rows.length === 0) return null;

  const withinCandidates = rows.filter((row) => /within/i.test(row.group));
  const explainedCandidates = rows.filter((row) => /explained|between/i.test(row.group));

  const within =
    withinCandidates.length > 0
      ? withinCandidates.reduce((sum, row) => sum + toFiniteOrZero(row.variance), 0)
      : toFiniteOrZero(rows[0]?.variance ?? 0);
  const explained =
    explainedCandidates.length > 0
      ? explainedCandidates.reduce((sum, row) => sum + toFiniteOrZero(row.variance), 0)
      : rows.slice(1).reduce((sum, row) => sum + toFiniteOrZero(row.variance), 0);

  const axisBase = Math.max(within + explained, within, explained, 1);
  const { max, ticks } = buildAxisRange(axisBase * 1.1, 6);

  return {
    within,
    explained,
    max,
    ticks,
    vrLabel: formatVRLabel(rows),
    withinColor: colors.within,
    explainedColor: colors.explained,
  };
};

const mapWithinGroupVarianceToBarsData = (
  rows: ReportWithinGroupVarianceItem[],
  colors: ComparisonColorSet["bars"]
): VarianceBarsChartData | null => {
  if (rows.length === 0) return null;

  const groupOrder = getGroupOrder(rows);
  const groupRank = new Map(groupOrder.map((group, index) => [group, index]));
  const sorted = [...rows].sort((a, b) => {
    const orderDiff = classificationOrder(a.classification) - classificationOrder(b.classification);
    if (orderDiff !== 0) return orderDiff;
    return (
      (groupRank.get(a.group) ?? Number.MAX_SAFE_INTEGER) -
      (groupRank.get(b.group) ?? Number.MAX_SAFE_INTEGER)
    );
  });

  const bars = sorted.map((row) => ({
    label: toRiskLabel(row.classification, row.group),
    value: toFiniteOrZero(row.variance),
    weightLabel: `w=${Math.round(toFiniteOrZero(row.number))}`,
    color: toRiskColor(row.classification, colors),
  }));

  const thresholdFromData = sorted.find((row) => Number.isFinite(row.total_var))?.total_var;
  const threshold =
    typeof thresholdFromData === "number" && thresholdFromData > 0
      ? thresholdFromData
      : Math.max(...bars.map((bar) => bar.value), 0);
  const axisBase = Math.max(...bars.map((bar) => bar.value), threshold, 1);
  const { max, ticks } = buildAxisRange(axisBase * 1.1, 5);

  return {
    max,
    ticks,
    threshold,
    bars,
  };
};

const mapComparisonData = (
  varianceRows: ReportVarianceDecompositionItem[],
  withinRows: ReportWithinGroupVarianceItem[],
  colors: ComparisonColorSet
): ComparisonChartData | null => {
  const stack = mapVarianceDecompositionToStackData(varianceRows, colors.stack);
  const bars = mapWithinGroupVarianceToBarsData(withinRows, colors.bars);
  if (!stack || !bars) return null;
  return { stack, bars };
};

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

const decodeFeature = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function TSIReportPageContent() {
  const routeParams = useParams<{ feature?: string }>();
  const featureParam = routeParams?.feature;
  const featureName = decodeFeature(featureParam ?? "").trim();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") ?? "";
  const subgroupId = searchParams.get("subgroupId") ?? "";
  const [reportResponse, setReportResponse] = useState<ReportByFeatureResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasRequiredParams = Boolean(taskId && subgroupId && featureName);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}. ${month}. ${day} ${hours}:${minutes}:${seconds}`;
  })();

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
        setFetchError(
          error instanceof Error ? error.message : "Subgroup Report 정보 조회에 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [featureName, hasRequiredParams, subgroupId, taskId]);

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
  const modelComparisonData = mapComparisonData(
    reportJson?.model_variance_decomposition ?? [],
    reportJson?.model_within_group_variance_by_subgroup ?? [],
    MODEL_COMPARISON_COLORS
  );
  const featureComparisonData = mapComparisonData(
    reportJson?.feature_variance_decomposition ?? [],
    reportJson?.feature_within_group_variance_by_subgroup ?? [],
    FEATURE_COMPARISON_COLORS
  );
  const riskResponseSets = mapRiskResponseToSets(reportJson?.risk_response_assessment ?? [], []);
  const hasModelBasedData = modelBasedPanelData.chartData.length > 0;
  const hasFeatureBasedData = featureBasedPanelData.chartData.length > 0;
  const hasRiskResponseData = riskResponseSets.length > 0;

  if (!hasRequiredParams) {
    return (
      <AppLayout headerType="tsi" scaleMode="none">
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            Report 조회에 필요한 파라미터가 누락되었습니다. (`feature`, `taskId`, `subgroupId`)
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout headerType="tsi" scaleMode="none">
        <Loading isLoading />
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
          <div className="rounded-[24px] border border-[#D9D8E2] bg-[#F6F6FA] p-6 text-[#6A687A]">
            리포트 데이터를 조회 중입니다.
          </div>
        </div>
      </AppLayout>
    );
  }

  if (fetchError) {
    return (
      <AppLayout headerType="tsi" scaleMode="none">
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            {fetchError}
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout headerType="tsi" scaleMode="none">
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, marginLeft: "8px", marginRight: "8px", overflowY: "auto" }}>
        {/* Title */}
        <div style={{ flexShrink: 0, padding: "0 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div className="flex flex-col gap-1 flex-shrink-0 items-start">
            <div className="text-title text-neutral-5 text-left">
              Target Subgroup Identification
            </div>
            <p className="text-body2m text-neutral-50 text-left">
              {currentDate}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              console.log("[TSI][Report] Save as PDF clicked");
            }}
            style={{
              height: 40, paddingLeft: 24, paddingRight: 24, borderRadius: 36, border: "none",
              background: "#787776", cursor: "pointer", fontFamily: "Inter", fontSize: 15,
              fontWeight: 600, color: "#ffffff", letterSpacing: "-0.45px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Save as PDF
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M3 13H13M8 3V11M5 8L8 11L11 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* 리포트 배경 카드 */}
        <div
          className="flex h-auto min-h-[2244px] flex-shrink-0 flex-col overflow-hidden rounded-[36px] p-0"
         style={{borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent"}}
        >
          {/* 리포트 내용 영역 */}
          <div className="flex flex-1 flex-col">
            {/* 첫 번째 섹션: Stratification Strategy Comparison (150px y부터, 1748px 너비, 962px 높이) */}
            <div className="mx-auto mb-[100px] min-h-[962px] w-full max-w-full min-w-0 flex-shrink-0">
              <div className="flex h-full w-full flex-col">
                {/* 섹션 제목 */}
                <h2 className="flex w-full text-h4 text-[#2d1067] mb-[40px]  flex-shrink-0" style={{ paddingTop: "4px", paddingLeft: "4px" }}>
                  Stratification Strategy Comparison
                </h2>

                {/* 두 개의 파란색 카드 나란히 */}
                <div className="flex w-full flex-shrink-0 flex-row gap-4">
                  {/* 왼쪽 카드: Executive Summary & Stratification Strategy */}
                  <div className="bg-primary-15 flex min-h-[880px] flex-1 flex-col overflow-hidden rounded-[24px] p-5">
                    {/* Model Based 라벨 */}
                    <div className="mb-4 flex-shrink-0">
                      <span className="text-body5 flex h-[24px] w-[104px] items-center justify-center gap-2 rounded-md bg-orange-500 font-medium text-white">
                        Model Based
                      </span>
                    </div>
                    <h4 className="text-body2m mb-6 flex-shrink-0 text-white">{modelOverview.title}</h4>
                    <p className="text-body5 mt-auto mb-6 min-h-[130px] flex-shrink-0 whitespace-pre-line leading-[125%] text-white/90">
                      {modelOverview.description}
                    </p>
                    {hasModelBasedData ? (
                      <TSIDiseaseProgressionPanel
                        variant="model"
                        chartData={modelBasedPanelData.chartData}
                        rows={modelBasedPanelData.rows}
                        seriesLabels={modelBasedPanelData.seriesLabels}
                        seriesColors={RISK_SERIES_COLORS}
                      />
                    ) : (
                      <div className="flex min-h-[656px] w-full flex-1 items-center justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                        <p className="text-body2m text-neutral-50">
                          Model Based 데이터가 없습니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 카드: Feature-Based Decision Rules */}
                  <div className="bg-primary-15 flex min-h-[880px] flex-1 flex-col overflow-hidden rounded-[24px] p-5">
                    {/* Feature Based 라벨 */}
                    <div className="mb-4 flex-shrink-0">
                      <span className="text-body5 flex h-[24px] w-[104px] items-center justify-center gap-2 rounded-md bg-orange-500 font-medium text-white">
                        Feature Based
                      </span>
                    </div>
                    <h4 className="text-body2m mb-6 flex-shrink-0 text-white">
                      {featureOverview.title}
                    </h4>
                    <p className="text-body5 mt-auto mb-6 min-h-[130px] flex-shrink-0 whitespace-pre-line leading-[125%] text-white/90">
                      {featureOverview.description}
                    </p>
                    {hasFeatureBasedData ? (
                      <TSIDiseaseProgressionPanel
                        variant="feature"
                        chartData={featureBasedPanelData.chartData}
                        rows={featureBasedPanelData.rows}
                        seriesLabels={featureBasedPanelData.seriesLabels}
                        seriesColors={FEATURE_BASED_RISK_SERIES_COLORS}
                      />
                    ) : (
                      <div className="flex min-h-[656px] w-full flex-1 items-center justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                        <p className="text-body2m text-neutral-50">
                          Feature Based 데이터가 없습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 두 번째 섹션: Stratification Strategy Comparison */}
            <div className="mx-auto mb-[100px]  w-full max-w-full min-w-0 flex-shrink-0">
              <div className="flex w-full flex-col">
                {/* 섹션 제목 */}
                <h2 className="text-h4 text-[#2d1067] mb-[40px] ml-[4px] flex-shrink-0">
                  Stratification Strategy Comparison
                </h2>
                <div className="border-neutral-90 flex h-[562px] w-full flex-col rounded-[24px] border bg-white/60 p-4">
                  {modelComparisonData && featureComparisonData ? (
                    <>
                      {/* 텍스트 영역 */}
                      <div className="w-[850px] flex-shrink-0">
                        <h4 className="text-body2 text-neutral-5 mb-4">{comparisonOverview.title}</h4>
                        <p className="text-body5 text-neutral-50 whitespace-pre-line">
                          {comparisonOverview.description}
                        </p>
                      </div>

                      {/* 두 개의 차트 섹션 */}
                      <div className="mt-auto flex w-full flex-shrink-0 gap-0">
                        {/* 첫 번째 차트 섹션 */}
                        <div className="flex h-[378px] flex-1 min-w-0 flex-col items-start gap-[10px] p-[6px]">
                          <div className="flex h-full w-full flex-col rounded-[16px] bg-[#FFFFFF] p-4">
                            <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
                              <div className="flex min-h-0 flex-col">
                                <h4 className="text-xl font-semibold text-[#484646]">
                                  Variance decomposition
                                </h4>
                                <div className="mt-2 h-px flex-shrink-0 bg-[#A9A8B2]" />
                                <div className="mt-2 min-h-0 flex-1">
                                  <TSIStackedVarianceChart data={modelComparisonData.stack} />
                                </div>
                                <div className="mt-1 flex flex-shrink-0 items-center justify-center gap-8">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-[14px] w-[48px] rounded-[5px]"
                                      style={{
                                        backgroundColor: modelComparisonData.stack.withinColor,
                                      }}
                                    />
                                    <span className="text-small1 text-[#1C1B1C]">Within</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-[14px] w-[48px] rounded-[5px]"
                                      style={{
                                        backgroundColor: modelComparisonData.stack.explainedColor,
                                      }}
                                    />
                                    <span className="text-small1 text-[#1C1B1C]">Explained</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex min-h-0 flex-col">
                                <h4 className="text-xl font-semibold text-[#484646]">
                                  Within-group variance
                                </h4>

                                <div className="mt-2 h-px flex-shrink-0 bg-[#A9A8B2]" />
                                <div className="mt-2 min-h-0 flex-1">
                                  <TSIVarianceByGroupBarChart data={modelComparisonData.bars} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* 두 번째 차트 섹션 */}
                        <div className="flex h-[378px] flex-1 min-w-0 flex-col items-start gap-[10px] p-[6px]">
                          <div className="flex h-full w-full flex-col rounded-[16px] bg-[#FFFFFF] p-4">
                            <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
                              <div className="flex min-h-0 flex-col">
                                <div className="text-[10px] font-medium text-[#484646]">
                                  Separation evidence
                                </div>
                                <h4 className="text-xl font-semibold text-[#484646]">
                                  Variance decomposition
                                </h4>

                                <div className="mt-2 h-px flex-shrink-0 bg-[#A9A8B2]" />
                                <div className="mt-2 min-h-0 flex-1">
                                  <TSIVarianceByGroupBarChart data={featureComparisonData.bars} />
                                </div>
                              </div>

                              <div className="flex min-h-0 flex-col">
                                <div className="text-[10px] font-medium text-[#484646]">
                                  Separation evidence
                                </div>
                                <h4 className="text-xl font-semibold text-[#484646]">
                                  Within-group variance by subgroup
                                </h4>
                                <div className="mt-2 h-px flex-shrink-0 bg-[#A9A8B2]" />
                                <div className="mt-2 min-h-0 flex-1">
                                  <TSIStackedVarianceChart data={featureComparisonData.stack} />
                                </div>
                                <div className="mt-1 flex flex-shrink-0 items-center justify-center gap-8">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-[14px] w-[48px] rounded-[5px]"
                                      style={{
                                        backgroundColor: featureComparisonData.stack.withinColor,
                                      }}
                                    />
                                    <span className="text-small1 text-[#1C1B1C]">Within</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-[14px] w-[48px] rounded-[5px]"
                                      style={{
                                        backgroundColor: featureComparisonData.stack.explainedColor,
                                      }}
                                    />
                                    <span className="text-small1 text-[#1C1B1C]">Explained</span>
                                  </div>
                                </div>
                              </div>
                            </div>
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
            <div className="mx-auto w-full max-w-full min-w-0 flex-shrink-0">
              <div className="flex w-full flex-col">
                {/* 섹션 제목 */}
                <h2 className="text-h4 text-[#2d1067] mb-[40px] ml-[4px] flex-shrink-0">
                  Risk & Response Assessment
                </h2>
                <div className="border-neutral-90 flex min-h-[322px] w-[1748px] gap-4 rounded-[24px] border bg-white/60 p-4">
                  {/* 왼쪽: 타이틀 영역 */}
                  <div className="flex min-h-[290px] w-[414px] flex-shrink-0 flex-col items-start gap-[28px]">
                    <div className="flex w-full flex-col items-start gap-[24px]">
                      <h3 className="text-body2m text-neutral-5">{riskOverview.title}</h3>
                      <p className="text-body5 text-neutral-40 whitespace-pre-line">
                        {riskOverview.description}
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽: 포레스트 플롯 */}
                  <div className="flex min-w-0 flex-1">
                    {hasRiskResponseData ? (
                      <div className="min-w-0 flex-1 rounded-[16px] border border-[#E5E4EA] bg-[#FFFFFF] p-4">
                        <div className="flex min-h-0 w-full flex-col">
                          {riskResponseSets.map((setData, setIdx) => (
                            <div
                              key={setData.setName}
                              className={`grid grid-cols-[120px_1fr_1fr_1fr] ${
                                setIdx === 0 ? "border-b border-[#BAB9C2]" : ""
                              }`}
                            >
                              <div className="border-r border-[#BAB9C2] py-1 pr-3">
                                <div className="mb-1 flex h-[24px] items-center">
                                  <span className="text-body5m flex h-[24px] w-[86px] items-center justify-center rounded-full bg-[#292561] text-white">
                                    {setData.setName}
                                  </span>
                                </div>
                                {setData.rows.map((row) => (
                                  <div
                                    key={`${setData.setName}-${row.groupLabel}`}
                                    className="text-neutral-30 flex h-7 items-center text-[13px] font-medium"
                                  >
                                    {row.groupLabel}
                                  </div>
                                ))}
                              </div>

                              {RISK_METRICS.map((metric, metricIdx) => (
                                <div
                                  key={`${setData.setName}-${metric.key}`}
                                  className={`px-3 py-1 ${
                                    metricIdx < 2 ? "border-r border-[#BAB9C2]" : ""
                                  }`}
                                >
                                  <div className="mb-1 h-[24px]" aria-hidden />
                                  <TSIForestMetricChart
                                    rows={setData.rows}
                                    metricKey={metric.key}
                                    metricLabel={metric.label}
                                    showAxis={setIdx === riskResponseSets.length - 1}
                                    minHeight={setIdx === riskResponseSets.length - 1 ? 116 : 88}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-0 w-full flex-1 items-center justify-center rounded-[16px] border border-[#D9D8E2] bg-[#FFFFFF] p-4">
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

        {/* 하단 우측 CTA */}
        <div className="flex items-center justify-end py-6 flex-shrink-0 pr-[38px]">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                console.log("[TSI][Report] Save Progress clicked");
              }}
              className="px-5 py-2.5 bg-[#aaaaad] text-white rounded-[100px] text-body3 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
            >
              Save Progress
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("[TSI][Report] Add Basis clicked");
              }}
              style={{
                height: 40, paddingLeft: 24, paddingRight: 24, borderRadius: 36, border: "none",
                background: "#F06600", cursor: "pointer", fontFamily: "Inter", fontSize: 15,
                fontWeight: 600, color: "#ffffff", letterSpacing: "-0.45px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Add Basis
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M3 8L13 8M10 4L14 8L10 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function TSIReportPage() {
  return (
    <Suspense fallback={null}>
      <TSIReportPageContent />
    </Suspense>
  );
}
