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
import { TSISaveModal } from "@/components/tsi/TSISaveModal";
import { getReportByFeature } from "@/services/subgroup-service";
import { formatCutoffExpressionForDisplay } from "@/lib/cutoff-display";
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
  strategyRows: ReportStratificationStrategyItem[]
): ErrorBarGroup[] => {
  if (strategyRows.length === 0) return [];

  const groupOrder = getGroupOrder(strategyRows);
  const grouped = new Map<string, ErrorBarPoint[]>();

  strategyRows.forEach((row) => {
    const error = Math.max(0, (row.ci_high - row.ci_low) / 2);
    const points = grouped.get(row.group) ?? [];
    points.push([row.month, row.mean, error]);
    grouped.set(row.group, points);
  });

  const mapped = groupOrder.map((group) => (grouped.get(group) ?? []).sort((a, b) => a[0] - b[0]));

  return mapped.length > 0 ? mapped : [];
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
  defaultYAxisName: string
) => {
  const featureNameFromRows = strategyRows.find((row) => row.feature_name?.trim())?.feature_name;
  const yAxisName = featureNameFromRows?.trim() || defaultYAxisName;

  if (strategyRows.length === 0) {
    return {
      chartData: [],
      rows: [],
      seriesLabels: [],
      yAxisName,
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
      cutoff: cutoffByGroup.get(group) ?? "",
    };
  });

  const seriesLabels = groupOrder.map((group, index) => {
    const riskRank = riskRankByGroup.get(group) ?? index;
    return getSeriesLabelByRiskRank(riskRank, totalGroups);
  });

  return {
    chartData: mapStrategyToErrorBarGroup(strategyRows),
    rows,
    seriesLabels,
    yAxisName,
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

const toFiniteOrNull = (value: unknown): number | null => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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

const getVarianceMetricSourceItem = (
  rows: ReportVarianceDecompositionItem[]
): ReportVarianceDecompositionItem | null => {
  if (rows.length === 0) return null;

  const metricSource = rows.find(
    (row) =>
      toFiniteOrNull(row.ew_vr) !== null ||
      toFiniteOrNull(row.ew_total_variance) !== null ||
      toFiniteOrNull(row.ew_explained_variance) !== null ||
      toFiniteOrNull(row.ew_within_variance) !== null
  );

  return metricSource ?? null;
};

const formatVRLabel = (source: ReportVarianceDecompositionItem | null): string => {
  const vr = toFiniteOrNull(source?.ew_vr);
  if (vr === null) return "";
  const vrText = vr.toFixed(3);
  const ciText = source?.ci?.trim();
  if (ciText) return `VR: ${vrText} (${ciText})`;
  return `VR: ${vrText}`;
};

const mapVarianceDecompositionToStackData = (
  rows: ReportVarianceDecompositionItem[],
  colors: ComparisonColorSet["stack"]
): VarianceStackChartData | null => {
  const metricSource = getVarianceMetricSourceItem(rows);
  if (!metricSource) return null;

  const within = toFiniteOrNull(metricSource.ew_explained_variance);
  const explained = toFiniteOrNull(metricSource.ew_within_variance);
  const totalVariance = toFiniteOrNull(metricSource.ew_total_variance);
  if (within === null || explained === null || totalVariance === null) return null;

  const axisBase = Math.max(totalVariance, within + explained, within, explained, 1);
  const { max, ticks } = buildAxisRange(axisBase * 1.1, 6);

  return {
    within,
    explained,
    max,
    ticks,
    vrLabel: formatVRLabel(metricSource),
    withinColor: colors.within,
    explainedColor: colors.explained,
  };
};

const mapWithinGroupVarianceToBarsData = (
  rows: ReportWithinGroupVarianceItem[],
  colors: ComparisonColorSet["bars"],
  totalVariance: number | null
): VarianceBarsChartData | null => {
  if (rows.length === 0 || totalVariance === null) return null;

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

  const bars = sorted.flatMap((row) => {
    const variance = toFiniteOrNull(row.variance);
    const number = toFiniteOrNull(row.number);
    if (variance === null || number === null) return [];
    return [
      {
        label: toRiskLabel(row.classification, row.group),
        value: variance,
        weightLabel: `w=${Math.round(number)}`,
        color: toRiskColor(row.classification, colors),
      },
    ];
  });
  if (bars.length === 0) return null;

  const axisBase = Math.max(...bars.map((bar) => bar.value), totalVariance, 1);
  const { max, ticks } = buildAxisRange(axisBase * 1.1, 5);

  return {
    max,
    ticks,
    threshold: totalVariance,
    bars,
  };
};

const mapComparisonData = (
  varianceRows: ReportVarianceDecompositionItem[],
  withinRows: ReportWithinGroupVarianceItem[],
  colors: ComparisonColorSet
): ComparisonChartData | null => {
  const metricSource = getVarianceMetricSourceItem(varianceRows);
  const totalVariance = toFiniteOrNull(metricSource?.ew_total_variance);
  const stack = mapVarianceDecompositionToStackData(varianceRows, colors.stack);
  const bars = mapWithinGroupVarianceToBarsData(withinRows, colors.bars, totalVariance);
  if (!stack || !bars) return null;
  return { stack, bars };
};

const mapRiskMetricKey = (item: ReportRiskResponseAssessmentItem): RiskMetricKey | null => {
  const outcome = item.outcome.trim().toLowerCase();
  if (
    outcome === "cdr-sb" ||
    outcome === "adas cog 11" ||
    outcome === "adas-cog 11" ||
    outcome === "adas cog11"
  ) {
    return "diseaseProgression";
  }
  if (outcome === "rhte") return "drugResponse";
  if (outcome === "safety") return "safety";
  return null;
};

const normalizeToPercent = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || Math.abs(max - min) < 1e-9) return 50;
  const scaled = 8 + ((value - min) / (max - min)) * 84;
  return Math.min(96, Math.max(4, scaled));
};

const mapRiskResponseToSets = (rows: ReportRiskResponseAssessmentItem[]): RiskResponseSet[] => {
  if (rows.length === 0) return [];

  const domains: Record<RiskMetricKey, { min: number; max: number }> = {
    diseaseProgression: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    drugResponse: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    safety: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
  };

  rows.forEach((row) => {
    const metricKey = mapRiskMetricKey(row);
    if (!metricKey) return;
    const ciLow = toFiniteOrNull(row.ci_low);
    const ciHigh = toFiniteOrNull(row.ci_high);
    if (ciLow === null || ciHigh === null) return;
    domains[metricKey].min = Math.min(domains[metricKey].min, ciLow);
    domains[metricKey].max = Math.max(domains[metricKey].max, ciHigh);
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

        const ciLow = toFiniteOrNull(source.ci_low);
        const mean = toFiniteOrNull(source.mean);
        const ciHigh = toFiniteOrNull(source.ci_high);
        const domain = domains[key];

        if (ciLow === null || mean === null || ciHigh === null) {
          metrics[key] = { low: 50, mean: 50, high: 50, color: rowColor };
          return;
        }

        metrics[key] = {
          low: normalizeToPercent(ciLow, domain.min, domain.max),
          mean: normalizeToPercent(mean, domain.min, domain.max),
          high: normalizeToPercent(ciHigh, domain.min, domain.max),
          color: rowColor,
        };
      });

      return {
        groupLabel: `Group ${rowIndex + 1}`,
        metrics,
      };
    });

    if (mappedRows.length === 0) return [];

    return [
      {
        setName: REPORT_SET_TYPE_TO_NAME[setType],
        rows: mappedRows,
      },
    ];
  });

  return sets;
};

const decodeFeature = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function WhiteLoadingPanel({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-[16px] border border-[#ECEBF2] bg-white ${className}`.trim()}
    />
  );
}

function LoadingStrategyCard() {
  return (
    <div className="bg-primary-15 flex min-h-[880px] flex-1 overflow-hidden rounded-[24px] p-4">
      <WhiteLoadingPanel className="min-h-[760px] w-full flex-1" />
    </div>
  );
}

function LoadingComparisonCard() {
  return (
    <WhiteLoadingPanel className="min-h-[378px] min-w-0 flex-1" />
  );
}

function ReportLoadingSkeleton({ featureName }: { featureName: string }) {
  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <Loading isLoading />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          marginLeft: "14px",
          marginRight: "14px",
          overflowY: "auto",
        }}
      >
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
          <div className="flex flex-shrink-0 flex-col items-start gap-1">
            <div className="text-title text-left text-neutral-5">Subgroup Analysis Report</div>
            <p className="text-body2m text-left text-neutral-50">{featureName}</p>
          </div>
          <WhiteLoadingPanel className="h-[42px] w-[166px] rounded-[100px]" />
        </div>

        <div
          className="flex flex-shrink-0 flex-col gap-8 rounded-[36px]"
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
          <div className="mx-auto mb-[24px] w-full max-w-full min-w-0 flex-shrink-0">
            <h2
              className="text-h4 text-primary-15 mb-3 ml-[4px] flex w-full flex-shrink-0"
              style={{ paddingTop: "4px", paddingLeft: "4px" }}
            >
              Stratification Strategy Comparison
            </h2>
            <div className="flex w-full flex-shrink-0 flex-row gap-4">
              <LoadingStrategyCard />
              <LoadingStrategyCard />
            </div>
          </div>

          <div className="mx-auto mb-[24px] w-full max-w-full min-w-0 flex-shrink-0">
            <div className="flex w-full flex-col">
              <h2 className="text-h4 text-primary-15 mb-4 ml-[4px] flex-shrink-0">
                Stratification Strategy Comparison
              </h2>
              <div className="flex h-fit w-full flex-col gap-4 overflow-visible rounded-[24px] bg-white/60 p-3">
                <WhiteLoadingPanel className="h-[84px] w-[850px] max-w-full" />
                <div className="flex w-full flex-shrink-0 gap-2">
                  <LoadingComparisonCard />
                  <LoadingComparisonCard />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-full min-w-0 flex-shrink-0">
            <div className="flex w-full flex-col">
              <h2 className="text-h4 text-primary-15 mb-4 ml-[4px] flex-shrink-0">
                Risk &amp; Response Assessment
              </h2>
              <div className="flex w-full gap-4 rounded-[24px] bg-white/60 p-3">
                <WhiteLoadingPanel className="min-h-[290px] w-[414px] flex-shrink-0" />
                <WhiteLoadingPanel className="min-h-[290px] min-w-0 flex-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end px-[12px] pb-[24px]">
          <div className="flex gap-4">
            <WhiteLoadingPanel className="h-[48px] w-[178px] rounded-[100px]" />
            <WhiteLoadingPanel className="h-[48px] w-[150px] rounded-[100px]" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

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
  const [forestAspect, setForestAspect] = useState("5 / 1");

  useEffect(() => {
    const updateTitleFontSize = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    updateTitleFontSize();
    window.addEventListener("resize", updateTitleFontSize);
    return () => window.removeEventListener("resize", updateTitleFontSize);
  }, []);

  useEffect(() => {
    const updateForestAspect = () => setForestAspect(window.innerWidth > 1470 ? "5 / 1" : "4 / 1");
    updateForestAspect();
    window.addEventListener("resize", updateForestAspect);
    return () => window.removeEventListener("resize", updateForestAspect);
  }, []);

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
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (!hasRequiredParams) {
      setReportResponse(null);
      setFetchError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
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
        if (!cancelled) {
          setIsLoading(false);
        }
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
      description: item?.description?.trim()
        ? formatCutoffExpressionForDisplay(item.description)
        : "",
    };
  };
  const modelOverview = getOverviewContent(0);
  const featureOverview = getOverviewContent(1);
  const comparisonOverview = getOverviewContent(2);
  const riskOverview = getOverviewContent(3);
  const defaultProgressionYAxisName = reportResponse?.data?.outcome?.trim() ?? "";

  const modelBasedPanelData = buildProgressionPanelData(
    reportJson?.model_stratification_strategy ?? [],
    defaultProgressionYAxisName
  );
  const featureBasedPanelData = buildProgressionPanelData(
    reportJson?.feature_stratification_strategy ?? [],
    defaultProgressionYAxisName
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
  const riskResponseSets = mapRiskResponseToSets(reportJson?.risk_response_assessment ?? []);
  const hasModelBasedData = modelBasedPanelData.chartData.length > 0;
  const hasFeatureBasedData = featureBasedPanelData.chartData.length > 0;
  const hasRiskResponseData = riskResponseSets.length > 0;

  if (!hasRequiredParams) {
    return (
      <AppLayout headerType="tsi" scaleMode="width">
        <div className="mx-auto w-[1772px] max-w-full py-12">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
            Report 조회에 필요한 파라미터가 누락되었습니다. (`feature`, `taskId`, `subgroupId`)
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return <ReportLoadingSkeleton featureName={featureName} />;
  }

  if (fetchError) {
    return (
      <AppLayout headerType="tsi" scaleMode="width">
        <div className="mx-auto w-[1772px] max-w-full py-12">
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
          marginLeft: "14px",
          marginRight: "14px",
          overflowY: "auto",
        }}
      >
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
          <div className="flex flex-shrink-0 flex-col items-start gap-1">
            <div className="text-title text-left text-neutral-5" style={{ fontSize: titleFontSize }}>
              Subgroup Analysis Report
            </div>
            <p className="text-body2m text-left text-neutral-50">{currentDate}</p>
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
              <path
                d="M3 13H13M8 3V11M5 8L8 11L11 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          className="flex flex-shrink-0 flex-col gap-8 rounded-[36px]"
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
          <div className="mx-auto mb-[24px] w-full max-w-full min-w-0 flex-shrink-0">
            <h2
              className="text-h4 text-primary-15 mb-3 ml-[4px] flex w-full flex-shrink-0"
              style={{ paddingTop: "4px", paddingLeft: "4px" }}
            >
              Stratification Strategy Comparison
            </h2>
            <div className="flex w-full flex-shrink-0 flex-row gap-4">
              <div className="bg-primary-15 flex h-wrap w-[calc(50%-8px)] flex-shrink-0 flex-col gap-4 overflow-hidden rounded-[24px] p-4">
                <div className="flex">
                  <span className="text-body5m rounded-[25px] bg-orange-500 px-4 py-1.5 text-white">
                    Model Based
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-body2m flex-shrink-0 text-white">{modelOverview.title}</h4>
                  <p
                    className="text-body5m mb-6 min-h-[90px] flex-shrink-0 whitespace-pre-line text-white/90"
                    style={{ lineHeight: "120%" }}
                  >
                    {modelOverview.description}
                  </p>
                </div>
                {hasModelBasedData ? (
                  <TSIDiseaseProgressionPanel
                    variant="model"
                    chartData={modelBasedPanelData.chartData}
                    rows={modelBasedPanelData.rows}
                    seriesLabels={modelBasedPanelData.seriesLabels}
                    seriesColors={RISK_SERIES_COLORS}
                  />
                ) : (
                  <div className="flex w-full flex-1 items-center justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                    <p className="text-body2m text-neutral-50">Model Based 데이터가 없습니다.</p>
                  </div>
                )}
              </div>

              <div className="bg-primary-15 flex h-wrap w-[calc(50%-8px)] flex-shrink-0 flex-col gap-4 overflow-hidden rounded-[24px] p-4">
                <div className="flex">
                  <span className="text-body5m rounded-[24px] bg-orange-500 px-4 py-1.5 font-medium text-white">
                    Feature Based
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-body2m flex-shrink-0 text-white">{featureOverview.title}</h4>
                  <p
                    className="text-body5m mb-6 min-h-[90px] flex-shrink-0 whitespace-pre-line text-white/90"
                    style={{ lineHeight: "120%" }}
                  >
                    {featureOverview.description}
                  </p>
                </div>
                {hasFeatureBasedData ? (
                  <TSIDiseaseProgressionPanel
                    variant="feature"
                    chartData={featureBasedPanelData.chartData}
                    rows={featureBasedPanelData.rows}
                    seriesLabels={featureBasedPanelData.seriesLabels}
                    seriesColors={FEATURE_BASED_RISK_SERIES_COLORS}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[16px] bg-[#FFFFFF] p-4">
                    <p className="text-body2m text-neutral-50">Feature Based 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto mb-[24px] w-full max-w-full min-w-0 flex-shrink-0">
            <div className="flex w-full flex-col">
              <h2 className="text-h4 text-primary-15 mb-4 ml-[4px] flex-shrink-0">
                Stratification Strategy Comparison
              </h2>
              <div className="flex h-fit w-full flex-col gap-10 overflow-visible rounded-[24px] bg-white/60 p-3">
                {modelComparisonData && featureComparisonData ? (
                  <>
                    <div className="w-[850px] flex-shrink-0 pl-1 pt-1">
                      <h4 className="text-body2 text-neutral-30 mb-3">
                        {comparisonOverview.title}
                      </h4>
                      <p
                        className="text-body5m whitespace-pre-line text-neutral-50"
                        style={{ lineHeight: "120%" }}
                      >
                        {comparisonOverview.description}
                      </p>
                    </div>

                    <div className="flex w-full flex-shrink-0 gap-2">
                      <div className="flex w-full flex-col overflow-visible rounded-[16px] bg-[#FFFFFF] p-3">
                        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-visible">
                          <div className="flex min-h-0 flex-col justify-between overflow-visible">
                            <div className="flex flex-col gap-1 border-b border-[#A9A8B2] pb-1.5">
                              <h4
                                className="m-0 text-body2 font-semibold text-[#484646]"
                                style={{ lineHeight: "100%" }}
                              >
                                Variance decomposition
                              </h4>
                            </div>
                            <div
                              className="overflow-visible"
                              style={{ aspectRatio: "4 / 3", marginTop: -2, marginBottom: -6 }}
                            >
                              <TSIStackedVarianceChart data={modelComparisonData.stack} />
                            </div>
                          </div>

                          <div className="flex min-h-0 flex-col justify-between overflow-visible">
                            <div className="flex flex-col gap-1 border-b border-[#A9A8B2] pb-1.5">
                              <h4
                                className="m-0 text-body2 font-semibold text-[#484646]"
                                style={{ lineHeight: "100%" }}
                              >
                                Within-group variance
                              </h4>
                            </div>
                            <div className="w-full overflow-visible" style={{ aspectRatio: "4 / 3" }}>
                              <TSIVarianceByGroupBarChart data={modelComparisonData.bars} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col overflow-visible rounded-[16px] bg-[#FFFFFF] p-3">
                        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-visible">
                          <div className="flex min-h-0 flex-col gap-3 overflow-visible">
                            <div className="flex flex-col gap-0.75 border-b border-[#A9A8B2] pb-1.5">
                              <div className="text-small1 font-medium text-neutral-50">
                                Separation evidence
                              </div>
                              <h4
                                className="text-body2 font-semibold text-[#484646]"
                                style={{ lineHeight: "100%" }}
                              >
                                Variance decomposition
                              </h4>
                            </div>
                            <div
                              className="overflow-visible"
                              style={{ aspectRatio: "4 / 3", marginTop: -2, marginBottom: -6 }}
                            >
                              <TSIStackedVarianceChart data={featureComparisonData.stack} />
                            </div>
                          </div>

                          <div className="flex min-h-0 flex-col gap-3 overflow-visible">
                            <div className="flex flex-col gap-0.75 border-b border-[#A9A8B2] pb-1.5">
                              <div className="text-small1 font-medium text-neutral-50">
                                Separation evidence
                              </div>
                              <h4
                                className="m-0 text-body2 font-semibold text-[#484646]"
                                style={{ lineHeight: "100%" }}
                              >
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
                    <p className="text-body2m text-neutral-50">비교 분석(Validation) 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-full min-w-0 flex-shrink-0">
            <div className="flex w-full flex-col">
              <h2 className="text-h4 text-primary-15 mb-4 ml-[4px] flex-shrink-0">
                Risk &amp; Response Assessment
              </h2>
              <div className="flex w-full gap-4 rounded-[24px] bg-white/60 p-3">
                <div className="flex h-fit min-w-0 flex-1 flex-col items-start gap-[28px] pl-1 pt-1">
                  <div className="flex w-full flex-col items-start gap-4">
                    <h3 className="text-body2 text-neutral-30">{riskOverview.title}</h3>
                    <p
                      className="text-body5m whitespace-pre-line text-neutral-50"
                      style={{ lineHeight: "120%" }}
                    >
                      {riskOverview.description}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 flex-[3] items-start">
                  {hasRiskResponseData ? (
                    <div className="min-w-0 w-full rounded-[16px] bg-[#FFFFFF] p-3">
                      <div className="flex min-h-0 w-full flex-col">
                        {riskResponseSets.map((setData, setIdx) => (
                          <div
                            key={setData.setName}
                            className={`grid grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] ${
                              setIdx === 0 ? "border-b border-[#BAB9C2]" : ""
                            }`}
                          >
                            <div className="border-r border-[#BAB9C2] pr-2">
                              <div className="flex h-7 items-center">
                                <span className="text-body5m h-wrap w-wrap flex items-center justify-center rounded-full bg-[#292561] px-4 py-1 text-white">
                                  {setData.setName}
                                </span>
                              </div>
                              {setData.rows.map((row) => (
                                <div
                                  key={`${setData.setName}-${row.groupLabel}`}
                                  className="text-neutral-30 text-body4m flex h-7 items-center"
                                >
                                  {row.groupLabel}
                                </div>
                              ))}
                            </div>

                            {RISK_METRICS.map((metric, metricIdx) => (
                              <div
                                key={`${setData.setName}-${metric.key}`}
                                className={`px-2 ${metricIdx < 2 ? "border-r border-[#BAB9C2]" : ""}`}
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

                        <div className="grid grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-[#BAB9C2]">
                          <div className="-mt-2 border-r border-[#BAB9C2]" />
                          {RISK_METRICS.map((metric, metricIdx) => (
                            <div
                              key={`axis-${metric.key}`}
                              className={`mt-[-7px] px-2 ${metricIdx < 2 ? "border-r border-[#BAB9C2]" : ""}`}
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

        <div className="flex flex-shrink-0 items-center justify-end px-[12px] pb-[24px]">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="btn-tsi btn-tsi-secondary"
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
                <path
                  d="M2.33594 8.33594H14.3359"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.33594 2.33594V14.3359"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <TSISaveModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={() => setShowSaveModal(false)}
        />
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
