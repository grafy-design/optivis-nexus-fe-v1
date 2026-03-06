"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/common/Loading";
import type { ErrorBarGroup, ErrorBarPoint } from "@/components/charts/MultiLineWithErrorBar";
import {
  TSIDiseaseProgressionPanel,
  TSIForestAxisRow,
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
 *
 * TSI Step 6: Report page showing subgroup stratification results.
 * Displays three sections:
 *  1. Stratification Strategy Comparison (Model Based vs Feature Based)
 *  2. Variance Decomposition Comparison (stacked + bar charts)
 *  3. Risk & Response Assessment (forest plot)
 */

// ── 차트 시리즈 색상 상수 / Chart series color constants ─────────────────────────────

const RISK_SERIES_COLORS = ["#A6A3E3", "#6E6AA7", "#272354"];
const FEATURE_BASED_RISK_SERIES_COLORS = ["#26225B", "#EF6A00", "#4327E6"];

// ── 리포트 세트 타입 / Report set type definitions ───────────────────────────────────

const REPORT_SET_TYPES = ["feature_based", "model_based"] as const;
const REPORT_SET_TYPE_TO_NAME = {
  feature_based: "Set 1",
  model_based: "Set 2",
} as const;
const REPORT_SET_TYPE_TO_COLORS = {
  feature_based: ["#3E26D9", "#EF6A00", "#2C295A"],
  model_based: ["#4E4C84", "#7773AC", "#A5A1D9"],
} as const;

// ── 타입 정의 / Type definitions ─────────────────────────────────────────────────────

/** 비교 차트 데이터 묶음 / Bundled data for comparison charts (stack + bars) */
type ComparisonChartData = {
  stack: VarianceStackChartData;
  bars: VarianceBarsChartData;
};

/** 비교 차트 색상 세트 / Color set for comparison charts */
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

// ── 비교 차트 색상 / Comparison chart color palettes ─────────────────────────────────

/** Model Based 비교 차트 색상 / Color palette for model-based comparison */
const MODEL_COMPARISON_COLORS: ComparisonColorSet = {
  stack: { within: "#9C97D0", explained: "#26225B" },
  bars: { high: "#26225B", middle: "#7A74AC", low: "#A39ED5", default: "#26225B" },
};

/** Feature Based 비교 차트 색상 / Color palette for feature-based comparison */
const FEATURE_COMPARISON_COLORS: ComparisonColorSet = {
  stack: { within: "#B7B7BC", explained: "#EF6A00" },
  bars: { high: "#4327E6", middle: "#EF6A00", low: "#26225B", default: "#26225B" },
};

// ── 리스크 메트릭 목록 / Risk metric definitions ─────────────────────────────────────

const RISK_METRICS = [
  { key: "diseaseProgression", label: "Disease progression" },
  { key: "drugResponse", label: "Drug response" },
  { key: "safety", label: "Safety" },
] as const;

// ── 유틸리티: 그룹 순서 / Utility: group ordering ────────────────────────────────────

/**
 * 그룹명 배열에서 숫자 기준 정렬된 고유 그룹 순서를 반환합니다.
 * Returns a sorted array of unique group names (numeric sort where possible).
 */
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

// ── 유틸리티: 전략 데이터 변환 / Utility: strategy data mapping ──────────────────────

/**
 * API 전략 데이터를 에러바 차트용 그룹 배열로 변환합니다.
 * Maps API stratification strategy rows to ErrorBarGroup format.
 * @param strategyRows - API 응답 전략 행
 * @param fallback - 빈 데이터일 때 사용할 폴백
 */
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

/**
 * 마지막 시점 mean 기준으로 그룹별 리스크 랭킹(0=lowest)을 계산합니다.
 * Computes a risk rank per group based on the final time-point mean (0 = lowest risk).
 */
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

/**
 * 총 그룹 수와 랭크에 따른 시리즈 표시 라벨을 반환합니다.
 * Returns the display label for a series based on its risk rank and total group count.
 */
const getSeriesLabelByRiskRank = (rank: number, total: number): string => {
  if (total === 2) {
    return rank === 0 ? "Low Risk" : "High Risk";
  }
  if (total === 3) {
    return ["Low Risk", "Mid Risk", "High Risk"][rank] ?? `Risk ${rank + 1}`;
  }
  return `Risk ${rank + 1}`;
};

/**
 * 랭크에 따른 리스크 설명 문자열을 반환합니다.
 * Returns the risk descriptor string (Slow / Moderate / Rapid) for a given rank.
 */
const getRiskDescriptorByRank = (rank: number, total: number): string => {
  if (total === 2) {
    return rank === 0 ? "Slow" : "Rapid";
  }
  if (total === 3) {
    return ["Slow", "Moderate", "Rapid"][rank] ?? `Group ${rank + 1}`;
  }
  return `Group ${rank + 1}`;
};

/**
 * 질병 진행 패널에 필요한 차트 데이터·행·시리즈 라벨을 빌드합니다.
 * Builds chartData, legend rows, and series labels for a TSIDiseaseProgressionPanel.
 */
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

// ── 유틸리티: 분류 / Utility: classification helpers ─────────────────────────────────

/**
 * 분류 문자열을 정규화합니다 (high | middle | low | "").
 * Normalizes a classification string to one of: "high" | "middle" | "low" | "".
 */
const normalizeClassification = (classification: string): "high" | "middle" | "low" | "" => {
  const normalized = classification.trim().toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "middle" || normalized === "mid") return "middle";
  if (normalized === "low") return "low";
  return "";
};

/**
 * 분류별 정렬 우선순위를 반환합니다 (high=0, middle=1, low=2).
 * Returns sort priority for a classification value.
 */
const classificationOrder = (classification: string): number => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return 0;
  if (normalized === "middle") return 1;
  if (normalized === "low") return 2;
  return 99;
};

/**
 * classification 값을 사용자에게 표시할 리스크 라벨로 변환합니다.
 * Converts a classification value to a display risk label (e.g. "High Risk").
 */
const toRiskLabel = (classification: string, group: string): string => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return "High Risk";
  if (normalized === "middle") return "Mid Risk";
  if (normalized === "low") return "Low Risk";
  return group;
};

/**
 * classification 값에 해당하는 차트 색상을 반환합니다.
 * Returns the chart bar color for a given classification.
 */
const toRiskColor = (classification: string, colors: ComparisonColorSet["bars"]): string => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return colors.high;
  if (normalized === "middle") return colors.middle;
  if (normalized === "low") return colors.low;
  return colors.default;
};

// ── 유틸리티: 축 범위 계산 / Utility: axis range calculation ─────────────────────────

/**
 * 유한하지 않은 숫자를 0으로 대체합니다.
 * Replaces non-finite numbers with 0 to prevent NaN in chart calculations.
 */
const toFiniteOrZero = (value: number): number => {
  return Number.isFinite(value) ? value : 0;
};

/**
 * 최대값을 기반으로 "nice" 축 최대값과 눈금 배열을 계산합니다.
 * Computes a nice axis max and tick array for a given data maximum.
 */
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

// ── 유틸리티: 분산 분해 데이터 변환 / Utility: variance decomposition mapping ─────────

/**
 * 분산 분해 행에서 VR 라벨 텍스트를 포맷합니다.
 * Formats the VR label text from variance decomposition rows.
 */
const formatVRLabel = (rows: ReportVarianceDecompositionItem[]): string => {
  const source = rows.find((row) => Number.isFinite(row.vr));
  if (!source) return "VR: -";
  const vrText = source.vr.toFixed(3);
  const ciText = source.ci?.trim();
  if (ciText) return `VR: ${vrText} (95% CI: ${ciText})`;
  return `VR: ${vrText}`;
};

/**
 * 분산 분해 API 데이터를 TSIStackedVarianceChart용 데이터로 변환합니다.
 * Maps variance decomposition API rows to VarianceStackChartData.
 */
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

/**
 * 그룹 내 분산 API 데이터를 TSIVarianceByGroupBarChart용 데이터로 변환합니다.
 * Maps within-group variance API rows to VarianceBarsChartData.
 */
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

/**
 * 분산 분해 + 그룹 내 분산 데이터를 비교 차트 묶음으로 변환합니다.
 * Combines variance decomposition and within-group variance into ComparisonChartData.
 */
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

// ── 유틸리티: 리스크 반응 데이터 변환 / Utility: risk response mapping ─────────────────

/**
 * API 아이템의 outcome 필드를 내부 RiskMetricKey로 매핑합니다.
 * Maps an API risk response item's outcome to the internal RiskMetricKey.
 */
const mapRiskMetricKey = (item: ReportRiskResponseAssessmentItem): RiskMetricKey | null => {
  const outcome = item.outcome.toLowerCase();
  if (outcome === "cdr-sb") return "diseaseProgression";
  if (outcome === "rhte") return "drugResponse";
  if (outcome === "safety") return "safety";
  return null;
};

/**
 * 도메인 [min, max] 기준으로 값을 4~96% 범위의 퍼센트로 정규화합니다.
 * Normalizes a value to 4–96% within the given domain for forest plot positioning.
 */
const normalizeToPercent = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || Math.abs(max - min) < 1e-9) {
    return 50;
  }
  const scaled = 8 + ((value - min) / (max - min)) * 84;
  return Math.min(96, Math.max(4, scaled));
};

/**
 * API 리스크 반응 행 배열을 포레스트 플롯용 RiskResponseSet 배열로 변환합니다.
 * Maps API risk response rows into RiskResponseSet arrays for the forest plot.
 */
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

/**
 * URL의 feature 파라미터를 URI 디코딩합니다.
 * Decodes the URI-encoded feature route parameter.
 */
const decodeFeature = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// ── 메인 페이지 컴포넌트 / Main page component ───────────────────────────────────────

/**
 * TSI 리포트 페이지 실제 컨텐츠 (useSearchParams/useParams 사용 → Suspense 래핑 필요).
 * Actual TSI report page content. Must be wrapped in Suspense due to useParams/useSearchParams.
 */
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

  const [titleFontSize, setTitleFontSize] = useState(42);
  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [forestAspect, setForestAspect] = useState("5 / 1");
  useEffect(() => {
    const update = () => setForestAspect(window.innerWidth > 1470 ? "5 / 1" : "4 / 1");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /** 현재 날짜·시간 문자열 (YYYY. MM. DD HH:mm:ss) / Current timestamp for display */
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

  /** API 호출: feature, taskId, subgroupId 변경 시 리포트 재조회 / Fetches report when params change */
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

  // ── API 응답 데이터 파싱 / Parse API response data ──────────────────────────────────

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

  // ── 차트 데이터 변환 / Transform chart data ─────────────────────────────────────────

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

  // ── 에러/로딩 상태 렌더링 / Error and loading state renders ─────────────────────────

  if (!hasRequiredParams) {
    return (
      <AppLayout headerType="tsi" scaleMode="fit">
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
          {/* ── 필수 파라미터 누락 에러 / Missing required params error ── */}
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            Report 조회에 필요한 파라미터가 누락되었습니다. (`feature`, `taskId`, `subgroupId`)
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout headerType="tsi" scaleMode="fit">
        <Loading isLoading />
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
          {/* ── 로딩 중 메시지 / Loading message ── */}
          <div className="rounded-[24px] border border-[#D9D8E2] bg-[#F6F6FA] p-6 text-[#6A687A]">
            리포트 데이터를 조회 중입니다.
          </div>
        </div>
      </AppLayout>
    );
  }

  if (fetchError) {
    return (
      <AppLayout headerType="tsi" scaleMode="fit">
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
          {/* ── API 조회 에러 메시지 / API fetch error message ── */}
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            {fetchError}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "wrap-content",
          marginLeft: "14px",
          marginRight: "14px",
          overflowY: "auto",
        }}
      >

        {/* ── 1. 페이지 타이틀 + PDF 저장 버튼 / Page title + Save as PDF button ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "0 12px 4px 12px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div className="flex flex-col gap-1 flex-shrink-0 items-start">
            <div className="text-title text-neutral-5 text-left" style={{ fontSize: titleFontSize }}>
              Target Subgroup Identification
            </div>
            <p className="text-body2m text-neutral-50 text-left">
              {currentDate}
            </p>
          </div>
          <button
            type="button"
            className="btn-tsi btn-tsi-secondary"
            onClick={() => {
              console.log("[TSI][Report] Save as PDF clicked");
            }}
          >
            Save as PDF
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path d="M3 13H13M8 3V11M5 8L8 11L11 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── 2. 리포트 배경 카드 (glass) / Report glass background card ── */}
        <div
          className="flex h-wrap flex-shrink-0 flex-col rounded-[36px] gap-8"
          style={{
            borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
            borderStyle: "solid",
            borderTopWidth: "20px",
            borderBottomWidth: "28px",
            borderLeftWidth: "24px",
            borderRightWidth: "24px",
            borderColor: "transparent",
          }}
        >

          {/* ── 2-1. 전략 비교 섹션 / Section 1: Stratification Strategy Comparison ── */}
          <div className="mx-auto mb-[24px] w-full max-w-full min-w-0 flex-shrink-0">
            {/* 섹션 제목 / Section title */}
            <h2
              className="flex w-full text-h4 text-primary-15 mb-3 ml-[4px] flex-shrink-0"
              style={{ paddingTop: "4px", paddingLeft: "4px" }}
            >
              Stratification Strategy Comparison
            </h2>

            {/* 두 개의 파란색 카드 나란히 / Two blue cards side by side */}
            <div className="flex w-full flex-shrink-0 flex-row gap-4">

              {/* ── 2-1-L. Model Based 카드 / Model Based card ── */}
              <div className="bg-primary-15 flex h-wrap w-[calc(50%-8px)] flex-shrink-0 flex-col overflow-hidden rounded-[24px] p-4 gap-4">
                {/* Model Based 라벨 / Model Based badge */}
                <div className=" flex">
                  <span className="text-body5m px-4 py-1.5 items-center justify-center rounded-[25px] bg-orange-500 text-white">
                    Model Based
                  </span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <h4 className="text-body2m flex-shrink-0 text-white">{modelOverview.title}</h4>
                <p className="text-body5m mb-6 min-h-[90px] flex-shrink-0 whitespace-pre-line text-white/90" style={{ lineHeight: "120%"}}>
                  {modelOverview.description}
                </p></div>
                {hasModelBasedData ? (
                  <TSIDiseaseProgressionPanel
                    variant="model"
                    chartData={modelBasedPanelData.chartData}
                    seriesLabels={modelBasedPanelData.seriesLabels}
                    seriesColors={RISK_SERIES_COLORS}
                    rows={modelBasedPanelData.rows}
                  />
                ) : (
                  <div className="flex w-full flex-1 items-center justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                    <p className="text-body2m text-neutral-50">
                      Model Based 데이터가 없습니다.
                    </p></div>
                )}
              </div> 

              {/* ── 2-1-R. Feature Based 카드 / Feature Based card ── */}
              <div className="bg-primary-15 flex h-wrap w-[calc(50%-8px)] flex-shrink-0 flex-col overflow-hidden rounded-[24px] p-4 gap-4">
                {/* Feature Based 라벨 / Feature Based badge */}
                <div className="flex">
                  <span className="text-body5m px-4 py-1.5 items-center justify-center gap-2 rounded-[24px] bg-orange-500 font-medium text-white">
                    Feature Based
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                <h4 className="text-body2m flex-shrink-0 text-white">
                  {featureOverview.title}
                </h4>
                <p className="text-body5m mt-auto mb-6 min-h-[90px] flex-shrink-0 whitespace-pre-line text-white/90" style={{lineHeight: "120%"}}>
                  {featureOverview.description}
                </p></div>
                {hasFeatureBasedData ? (
                  <TSIDiseaseProgressionPanel
                    variant="feature"
                    chartData={featureBasedPanelData.chartData}
                    seriesLabels={featureBasedPanelData.seriesLabels}
                    seriesColors={FEATURE_BASED_RISK_SERIES_COLORS}
                    rows={featureBasedPanelData.rows}
                  />
                ) : (
                  <div className="flex w-full h-full items-center justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                    <p className="text-body2m text-neutral-50">
                      Feature Based 데이터가 없습니다.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── 2-2. 분산 분석 비교 섹션 / Section 2: Variance Analysis Comparison ── */}
          <div className="mx-auto mb-[24px] w-full max-w-full min-w-0 flex-shrink-0">
            <div className="flex w-full flex-col  ">
              {/* 섹션 제목 / Section title */}
              <h2 className="text-h4 text-primary-15 mb-4 ml-[4px] flex-shrink-0 ">
                Stratification Strategy Comparison
              </h2>
              <div className="flex h-fit w-full flex-col overflow-visible rounded-[24px] bg-white/60 p-3 gap-10">
                {modelComparisonData && featureComparisonData ? (
                  <>
                    {/* 텍스트 영역 / Description text area */}
                    <div className="w-[850px] flex-shrink-0 pt-1 pl-1">
                      <h4 className="text-body2 text-neutral-30 mb-3">{comparisonOverview.title}</h4>
                      <p className="text-body5m text-neutral-50 whitespace-pre-line" style={{ lineHeight: "120%" }}>
                        {comparisonOverview.description}
                      </p>
                    </div>

                    {/* 두 개의 차트 섹션 / Two comparison chart panels */}
                    <div className="flex w-full flex-shrink-0 gap-2">

                      {/* Model Based 차트 패널 (분산 분해 + 그룹 내 분산) / Model Based: variance decomp + within-group variance */}
                        <div className="flex w-full flex-col overflow-visible rounded-[16px] bg-[#FFFFFF] p-3">
                          <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-visible">
                            <div className="flex min-h-0 flex-col justify-between overflow-visible">
                              <div className="flex flex-col gap-1 border-b border-[#A9A8B2] pb-1.5">
                                <h4 className="m-0 text-body2 font-semibold text-[#484646]" style={{ lineHeight: "100%" }}>
                                  Variance decomposition
                                </h4>
                              </div>
                              <div className="overflow-visible" style={{ aspectRatio: "4 / 3", marginTop: -2, marginBottom: -6 }}>
                                <TSIStackedVarianceChart data={modelComparisonData.stack} />
                              </div>
                            </div>

                            <div className="flex min-h-0 flex-col justify-between overflow-visible">
                              <div className="flex flex-col gap-1 border-b border-[#A9A8B2] pb-1.5">
                                <h4 className="m-0 text-body2 font-semibold text-[#484646]" style={{ lineHeight: "100%" }}>
                                  Within-group variance
                                </h4>
                              </div>
                              <div className="w-full overflow-visible" style={{ aspectRatio: "4 / 3" }}>
                                <TSIVarianceByGroupBarChart data={modelComparisonData.bars} />
                              </div>
                            </div>
                          </div>
                        </div>

                      {/* Feature Based 차트 패널 / Feature Based: variance decomp + within-group variance */}
                     
                        <div className="flex w-full flex-col overflow-visible rounded-[16px] bg-[#FFFFFF] p-3">
                          <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-visible">
                            <div className="flex min-h-0 flex-col overflow-visible gap-3">
                              <div className="flex flex-col gap-0.75 border-b border-[#A9A8B2] pb-1.5 ">
                                <div className="text-small1 font-medium text-neutral-50">
                                  Separation evidence
                                </div>
                                <h4 className=" text-body2 font-semibold text-[#484646]" style={{ lineHeight: "100%" }}>
                                  Variance decomposition
                                </h4>
                              </div>
                              <div className="overflow-visible" style={{ aspectRatio: "4 / 3", marginTop: -2, marginBottom: -6 }}>
                                <TSIStackedVarianceChart data={featureComparisonData.stack} />
                              </div>
                            </div>

                            <div className="flex min-h-0 flex-col overflow-visible gap-3">
                              <div className="flex flex-col gap-0.75 border-b border-[#A9A8B2] pb-1.5">
                                <div className="text-small1 font-medium text-neutral-50">
                                  Separation evidence
                                </div>
                                <h4 className="m-0 text-body2 font-semibold text-[#484646]" style={{ lineHeight: "100%" }}>
                                  Within-group variance by subgroup
                                </h4>
                              </div>
                              <div className="w-full overflow-visible" style={{ aspectRatio: "4 / 3" }}>
                                <TSIVarianceByGroupBarChart data={featureComparisonData.bars} />
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

          {/* ── 2-3. 리스크 & 반응 평가 섹션 / Section 3: Risk & Response Assessment ── */}
          <div className="w-full max-w-full min-w-0 flex-shrink-0">
            <div className="flex w-full flex-col">
              {/* 섹션 제목 / Section title */}
              <h2 className="text-h4 text-primary-15 mb-4 ml-[4px] flex-shrink-0">
                Risk &amp; Response Assessment
              </h2>
              <div className="flex w-full gap-4 rounded-[24px] bg-white/60 p-3">

                {/* 왼쪽: 타이틀·설명 영역 (1:3 비율) / Left: description area (1:3 ratio) */}
                <div className="flex h-fit min-w-0 flex-1 flex-col items-start gap-[28px] pl-1 pt-1">
                  <div className="flex w-full flex-col items-start gap-4">
                    <h3 className="text-body2 text-neutral-30">{riskOverview.title}</h3>
                    <p className="text-body5m text-neutral-50 whitespace-pre-line" style={{ lineHeight: "120%" }}>
                      {riskOverview.description}
                    </p>
                  </div>
                </div>

                {/* 오른쪽: 포레스트 플롯 / Right: forest plot */}
                <div className="flex min-w-0 flex-[3] items-start">
                  {hasRiskResponseData ? (
                    <div className="min-w-0 w-full rounded-[16px] bg-[#FFFFFF] p-3" >
                      <div className="flex min-h-0 w-full flex-col">
                        {riskResponseSets.map((setData, setIdx) => (
                          <div
                            key={setData.setName}
                            className={`grid grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] ${
                              setIdx === 0 ? "border-b border-[#BAB9C2]" : ""
                            }`}
                          >
                            {/* 세트명 + 그룹 라벨 열 / Set name + group label column */}
                            <div className="border-r border-[#BAB9C2] pr-2">
                              <div className="flex h-7 items-center">
                                <span className="text-body5m flex h-wrap w-wrap items-center justify-center px-4 py-1 rounded-full bg-[#292561] text-white">
                                  {setData.setName}
                                </span>
                              </div>
                              {setData.rows.map((row) => (
                                <div
                                  key={`${setData.setName}-${row.groupLabel}`}
                                  className="text-neutral-30 flex h-7 items-center text-body4m"
                                >
                                  {row.groupLabel}
                                </div>
                              ))}
                            </div>

                            {/* 메트릭별 포레스트 차트 열 / Forest chart columns per metric */}
                            {RISK_METRICS.map((metric, metricIdx) => (
                              <div
                                key={`${setData.setName}-${metric.key}`}
                                className={`px-2 ${
                                  metricIdx < 2 ? "border-r border-[#BAB9C2]" : ""
                                }`}
                              >
                                <div className="h-7" aria-hidden />
                                <div style={{ aspectRatio: forestAspect }}>
                                  <TSIForestMetricChart
                                    rows={setData.rows}
                                    metricKey={metric.key}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* X축 + 라벨 행 / X-axis row with metric labels */}
                        <div className=" grid grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-[#BAB9C2]">
                          <div className=" -mt-2 border-r border-[#BAB9C2]" />
                          {RISK_METRICS.map((metric, metricIdx) => (
                            <div
                              key={`axis-${metric.key}`}
                              className={`px-2 mt-[-7px] ${metricIdx < 2 ? "border-r border-[#BAB9C2]" : ""}`}
                            >
                              <TSIForestAxisRow metricLabel={metric.label} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-0 w-full flex-1 items-center justify-center rounded-[16px] border border-[#D9D8E2] bg-[#FFFFFF] p-4">
                      <p className="text-body2m text-neutral-50">
                        Risk &amp; Response Assessment 데이터가 없습니다.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>
        {/* ── 2 닫기 / End report glass card ── */}

        {/* ── 3. 하단 CTA 버튼 / Bottom CTA buttons ── */}
        <div className="flex items-center justify-end flex-shrink-0 pr-[12px] pb-[24px]">
          <div className="flex gap-4">
            <button
              type="button"
              className="btn-tsi btn-tsi-secondary"
              onClick={() => {
                console.log("[TSI][Report] Save Progress clicked");
              }}
            >
              Save Progress
            </button>
            <button
              type="button"
              className="btn-tsi btn-tsi-primary"
              onClick={() => {
                console.log("[TSI][Report] Add Basis clicked");
              }}
            >
              Add Basis
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path d="M2.33594 8.33594H14.3359" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.33594 2.33594V14.3359" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

/**
 * Suspense 래퍼 / Suspense wrapper (required for useParams and useSearchParams)
 */
export default function TSIReportPage() {
  return (
    <Suspense fallback={null}>
      <TSIReportPageContent />
    </Suspense>
  );
}
