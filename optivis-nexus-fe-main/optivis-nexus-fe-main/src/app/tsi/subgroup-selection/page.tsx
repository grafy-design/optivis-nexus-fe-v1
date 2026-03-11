"use client";

import { Suspense, useState, Fragment, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import IconButton from "@/components/ui/icon-button";
import RadioButton from "@/components/ui/radio-button";
import {
  getSubgroupSummaryList,
  type SubgroupSetSummary,
  type ResultTableItem,
} from "@/services/subgroup-service";
import ReactECharts from "echarts-for-react";
import { Loading } from "@/components/common/Loading";
import { formatCutoffListForDisplay } from "@/lib/cutoff-display";

/**
 * TSI Step 4: Subgroup Selection
 * 구조: 상위 배경 카드 2개 나란히
 * - 왼쪽 상위: selection-left.png → 안에 남색 카드 (Subgroup Sets Summary)
 * - 오른쪽 상위: selection-bg.png → 안에 흰색 테이블 카드
 */

/** 그룹별 에러바 색상 (Group 1, 2, 3 각각 구분) */
const GROUP_BAR_COLORS = ["#AAA5E1", "#7571A9", "#231F52"];
const SUMMARY_ERROR_BAR_LINE_HEIGHT_PX = 2;
const SUMMARY_ERROR_BAR_CAP_WIDTH_PX = 2;
const SUMMARY_ERROR_BAR_CAP_HEIGHT_PX = 12;
const SUMMARY_ERROR_BAR_DOT_SIZE_PX = 10;
const MAX_GROUP_DISPLAY_COUNT = 3;
const VARIANCE_AXIS_PADDING_RATIO = 1.2;

/** 테이블 공통 스타일: 높이 52px */
const TABLE_CELL_BASE = "h-[52px] border-b align-middle";
const TABLE_HEADER_CELL_BASE = "border-b align-middle py-1";
/** border-l이 없는 셀: 오른쪽 padding만 8px */
const TABLE_HEADER_CELL_BASE_NO_BORDER = `${TABLE_HEADER_CELL_BASE} pr-2 border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_NO_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body5 text-neutral-40`;
/** border-l이 있는 셀: 오른쪽 padding만 8px, 왼쪽은 margin으로 처리 */
const TABLE_HEADER_CELL_BASE_WITH_BORDER = `${TABLE_HEADER_CELL_BASE} pr-2 border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_WITH_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body5 text-neutral-40`;
/** 마지막 컬럼: border-l은 있지만 padding 없음 */
const TABLE_HEADER_CELL_BASE_LAST = `${TABLE_HEADER_CELL_BASE} border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_LAST = `${TABLE_CELL_BASE} border-neutral-80 text-body5 text-neutral-40`;

/** 내부 div: 셀과 같은 너비, 더 작은 높이(36px), 세로선 포함 */
const TABLE_INNER_DIV_CENTER =
  "w-full h-fit min-h-[28px] flex items-center justify-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_LEFT =
  "w-full h-fit min-h-[28px] flex items-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_CENTER_NO_BORDER =
  "w-full h-fit min-h-[28px] flex items-center justify-center";

type VarianceDecompositionItem = NonNullable<ResultTableItem["variance_decomposition"]>[number];

const EXPLAINED_GROUP_KEYS = new Set(["group2", "explained", "explained total within"]);
const CLASSIFICATION_ORDER = {
  high: 0,
  middle: 1,
  low: 2,
} as const;

type NormalizedClassification = keyof typeof CLASSIFICATION_ORDER;

const normalizeGroupKey = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const normalizeSetNo = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return String(parsed).padStart(2, "0");
};

const normalizeClassification = (
  classification: string | null | undefined
): NormalizedClassification | null => {
  const normalized = normalizeGroupKey(classification);
  if (normalized === "high" || normalized === "middle" || normalized === "low") {
    return normalized;
  }
  return null;
};

const getGroupDisplayName = (
  classification: string | null | undefined,
  mode: "long" | "short" = "long"
): string => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return mode === "long" ? "High Risk" : "High";
  if (normalized === "middle") return mode === "long" ? "Middle Risk" : "Middle";
  if (normalized === "low") return mode === "long" ? "Low Risk" : "Low";
  return (classification ?? "").trim();
};

const getGroupColor = (classification: string | null | undefined): string => {
  const normalized = normalizeClassification(classification);
  if (normalized === "high") return "#231F52";
  if (normalized === "middle") return "#7571A9";
  if (normalized === "low") return "#AAA5E1";
  return "#787776";
};

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const isExplainedGroupKey = (value: string | null | undefined): boolean => {
  const normalized = normalizeGroupKey(value);
  if (!normalized) return false;

  for (const key of EXPLAINED_GROUP_KEYS) {
    if (normalized === key || normalized.includes(key)) {
      return true;
    }
  }
  return false;
};

const getExplainedVarianceItem = (
  varianceDecomposition: ResultTableItem["variance_decomposition"]
): VarianceDecompositionItem | null => {
  if (!varianceDecomposition || varianceDecomposition.length === 0) return null;

  const explainedItem = varianceDecomposition.find((item) => isExplainedGroupKey(item.group));

  return explainedItem ?? null;
};

const getVarianceMetricSourceItem = (
  varianceDecomposition: ResultTableItem["variance_decomposition"]
): VarianceDecompositionItem | null => {
  if (!varianceDecomposition || varianceDecomposition.length === 0) return null;

  const metricSourceItem = varianceDecomposition.find(
    (item) =>
      toFiniteNumber(item.eta_square) !== null ||
      toFiniteNumber(item.ew_vr) !== null ||
      toFiniteNumber(item.ew_total_variance) !== null ||
      toFiniteNumber(item.ew_explained_variance) !== null ||
      toFiniteNumber(item.ew_within_variance) !== null
  );

  return metricSourceItem ?? varianceDecomposition[0] ?? null;
};

const getCiText = (item: VarianceDecompositionItem | null): string => {
  if (!item) return "";
  return `N=${item.number}, K=${item.variance} VR:${item.vr} (${item.ci})\nη²=${item.eta_square}, ω²=${item.omega}`;
};

const getDisplayGroupCount = (
  requestedCount: number | null | undefined,
  fallbackCount: number
): number => {
  const requested =
    typeof requestedCount === "number" && Number.isFinite(requestedCount)
      ? Math.floor(requestedCount)
      : 0;
  const fallback = Math.max(Math.floor(fallbackCount), 0);

  if (requested > 0) {
    return Math.min(requested, MAX_GROUP_DISPLAY_COUNT);
  }

  return Math.min(fallback, MAX_GROUP_DISPLAY_COUNT);
};

const clampGroupArray = <T,>(
  items: T[],
  requestedCount: number | null | undefined,
  fallbackCount: number
): T[] => {
  const limit = getDisplayGroupCount(requestedCount, fallbackCount);
  if (limit <= 0) return [];
  return items.slice(0, limit);
};

const sortByClassification = <T,>(
  items: T[],
  getClassification: (item: T) => string | null | undefined
): T[] =>
  [...items].sort((a, b) => {
    const aClass = normalizeClassification(getClassification(a));
    const bClass = normalizeClassification(getClassification(b));
    const aOrder = aClass !== null ? CLASSIFICATION_ORDER[aClass] : 99;
    const bOrder = bClass !== null ? CLASSIFICATION_ORDER[bClass] : 99;
    return aOrder - bOrder;
  });

type EChartsRenderApi = {
  value: (i: number) => number;
  coord: (p: number[]) => number[];
  style: (o: object) => object;
};

function buildDiseaseProgressionChartOption(
  filteredProgressionData: NonNullable<ResultTableItem["disease_progression_by_subgroup"]>,
  displayedProgressionGroups: string[],
  withinGroupVariance: ResultTableItem["within_group_variance_by_subgroup"],
  outcome: string,
  isNarrow = false
) {
  const months = Array.from(new Set(filteredProgressionData.map((d) => d.month))).sort(
    (a, b) => a - b
  );

  const series = displayedProgressionGroups.map((group) => {
    const groupData = filteredProgressionData.filter((d) => d.group === group);
    const varianceData = withinGroupVariance?.find((v) => v.group === group);
    const classification = varianceData?.classification ?? "";
    const color = getGroupColor(classification);
    const groupName = getGroupDisplayName(
      normalizeClassification(classification) === "low" ? "low" : classification
    );

    return {
      name: groupName,
      type: "line" as const,
      data: months
        .map((month) => {
          const dataPoint = groupData.find((d) => d.month === month);
          return dataPoint ? [month, dataPoint.mean] : null;
        })
        .filter((value) => value !== null),
      itemStyle: { color },
      lineStyle: { color, width: 2 },
      symbol: "circle",
      symbolSize: isNarrow ? 6 : 10,
    };
  });

  const capLengthPx = isNarrow ? 4 : 10;
  const errorBarSeries = displayedProgressionGroups.map((group) => {
    const groupData = filteredProgressionData.filter((d) => d.group === group);
    const varianceData = withinGroupVariance?.find((v) => v.group === group);
    const classification = varianceData?.classification ?? "";
    const color = getGroupColor(classification);

    return {
      name: `${group} error`,
      type: "custom" as const,
      data: months
        .map((month) => {
          const dataPoint = groupData.find((d) => d.month === month);
          if (!dataPoint) return null;
          return [
            month,
            dataPoint.mean,
            dataPoint.mean - dataPoint.ci_low,
            dataPoint.ci_high - dataPoint.mean,
          ];
        })
        .filter((value) => value !== null),
      renderItem: (_params: unknown, api: EChartsRenderApi) => {
        const xValue = api.value(0);
        const mean = api.value(1);
        const lowMargin = api.value(2);
        const highMargin = api.value(3);
        const low = api.coord([xValue, mean - lowMargin]);
        const high = api.coord([xValue, mean + highMargin]);

        return {
          type: "group",
          children: [
            {
              type: "line",
              shape: { x1: low[0], y1: low[1], x2: high[0], y2: high[1] },
              style: api.style({ stroke: color, lineWidth: 1.5 }),
            },
            {
              type: "line",
              shape: {
                x1: low[0] - capLengthPx / 2,
                y1: low[1],
                x2: low[0] + capLengthPx / 2,
                y2: low[1],
              },
              style: api.style({ stroke: color, lineWidth: 1.5 }),
            },
            {
              type: "line",
              shape: {
                x1: high[0] - capLengthPx / 2,
                y1: high[1],
                x2: high[0] + capLengthPx / 2,
                y2: high[1],
              },
              style: api.style({ stroke: color, lineWidth: 1.5 }),
            },
          ],
        };
      },
      z: 1,
      showInLegend: false,
    };
  });

  const allMeans = filteredProgressionData.map((d) => d.mean);
  const allCis = filteredProgressionData.flatMap((d) => [d.ci_low, d.ci_high]);
  const yMin = Math.min(...allMeans, ...allCis);
  const yMax = Math.max(...allMeans, ...allCis);
  const yRange = yMax - yMin;
  const yPadding = yRange * 0.15;

  const measureWidth = (text: string) => {
    if (typeof document === "undefined") return text.length * 6;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return text.length * 6;
    context.font = "500 10px Inter";
    return context.measureText(text).width;
  };

  const xMinLabelWidth = measureWidth("0");
  const xMaxLabelWidth = measureWidth(months[months.length - 1].toString());

  return {
    animation: false,
    grid: {
      left: "16px",
      right: "4px",
      top: "1px",
      bottom: "14px",
      containLabel: true,
    },
    xAxis: {
      type: "value" as const,
      name: "Month",
      nameLocation: "middle",
      nameGap: 18,
      min: 0,
      max: months[months.length - 1],
      nameTextStyle: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
      },
      axisLabel: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
        rich: {
          lEdge: {
            width: Math.ceil(xMinLabelWidth * 2) + 2,
            align: "right",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Inter",
            color: "#787776",
          },
          rEdge: {
            width: Math.ceil(xMaxLabelWidth * 2) + 2,
            align: "left",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Inter",
            color: "#787776",
          },
        },
        formatter: (value: number) => {
          const xMax = months[months.length - 1];
          if (value === 0) return "{lEdge|0}";
          if (value === xMax) return `{rEdge|${value}}`;
          return value.toString();
        },
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { type: "solid", color: "#e3e1e5", width: 1 } },
    },
    yAxis: {
      type: "value" as const,
      name: `Δ ${outcome}`,
      nameLocation: "middle",
      nameGap: 25,
      min: yMin - yPadding,
      max: yMax + yPadding,
      nameTextStyle: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
      },
      axisLabel: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
        showMinLabel: false,
        showMaxLabel: false,
        formatter: (value: number) => {
          const base = value.toFixed(1);
          if (value > yMax - yPadding) return `\n${base}`;
          return base;
        },
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { type: "solid", color: "#e3e1e5", width: 1 } },
    },
    tooltip: { show: false, trigger: "none" as const, axisPointer: { show: false } },
    legend: { show: false },
    series: [...series, ...errorBarSeries],
  };
}

function buildVarianceDecompositionChartOption(
  withinPooled: number,
  explainedTotalWithin: number,
  labelText = "",
  hoveredSeries: number | null = null
) {
  const varianceMax = Math.max(
    withinPooled + explainedTotalWithin,
    withinPooled,
    explainedTotalWithin,
    0
  );
  const withinActive = hoveredSeries === null || hoveredSeries === 0;
  const explainedActive = hoveredSeries === null || hoveredSeries === 1;

  return {
    animation: true,
    animationDuration: 300,
    animationEasing: "cubicOut",
    grid: {
      left: "18px",
      right: "0",
      top: "5px",
      bottom: "0px",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: ["Total"],
      axisLabel: {
        show: true,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      axisPointer: { label: { show: false } },
    },
    yAxis: {
      type: "value" as const,
      name: "Variance",
      nameLocation: "middle",
      nameGap: 24,
      max: Math.max(1, varianceMax * 1.5),
      splitNumber: 5,
      nameTextStyle: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
      },
      axisLabel: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
        formatter: (value: number) => value.toFixed(1),
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: "#e3e1e5" } },
    },
    tooltip: {
      show: true,
      trigger: "axis" as const,
      confine: true,
      axisPointer: {
        type: "shadow" as const,
        z: -1,
        shadowStyle: { color: "rgba(150,150,150,0.08)" },
        label: {
          show: true,
          backgroundColor: "transparent",
          color: "#787776",
          fontSize: 10,
          fontFamily: "Inter",
          fontWeight: 500,
          margin: 4,
        },
      },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#D2D2DA",
      borderWidth: 1,
      textStyle: { fontSize: 11, fontFamily: "Inter", color: "#484646" },
      formatter: (params: Array<{ seriesName: string; marker: string; value: number }>) => {
        if (!Array.isArray(params)) return "";
        return params
          .map(
            (param) =>
              `<div style="display:flex;align-items:center;gap:4px;padding:1px 0">${param.marker}<span style="color:#484646;font-size:9px;flex:1">${param.seriesName}</span><span style="color:#484646;font-size:12px;font-weight:600;text-align:right">${param.value.toFixed(2)}</span></div>`
          )
          .join("");
      },
    },
    legend: { show: false },
    series: [
      {
        name: "Within pooled",
        type: "bar" as const,
        stack: "variance",
        data: [withinPooled],
        itemStyle: {
          color: hexToRgba("#231F52", withinActive ? 1 : 0.6),
          borderRadius: [8, 8, 8, 8],
        },
        barWidth: "82%",
        emphasis: { disabled: true },
      },
      {
        name: "Explained Total Within",
        type: "bar" as const,
        stack: "variance",
        data: [explainedTotalWithin],
        itemStyle: {
          color: hexToRgba("#AAA5E1", explainedActive ? 1 : 0.6),
          borderRadius: [8, 8, 8, 8],
        },
        barWidth: "82%",
        emphasis: { disabled: true },
        label: {
          show: Boolean(labelText),
          position: "top" as const,
          formatter: () => labelText,
          color: "#787776",
          fontSize: 9,
          fontFamily: "Inter",
          fontWeight: 500,
          align: "center" as const,
          lineHeight: 11.55,
        },
      },
    ],
  };
}

function buildWithinGroupVarianceChartOption(
  sortedVariance: NonNullable<ResultTableItem["within_group_variance_by_subgroup"]>,
  totalVarValue: number | null,
  isNarrow = false,
  hoveredIdx: number | null = null
) {
  const maxVar = Math.max(...sortedVariance.map((v) => v.variance));
  const yAxisMax = Math.max(maxVar, totalVarValue ?? 0) * VARIANCE_AXIS_PADDING_RATIO;

  return {
    animation: true,
    animationDuration: 300,
    animationEasing: "cubicOut",
    grid: {
      left: "24px",
      right: "0",
      top: "5px",
      bottom: "0px",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: sortedVariance.map((v) => getGroupDisplayName(v.classification, "short")),
      axisLabel: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      axisPointer: { label: { show: false } },
    },
    yAxis: {
      type: "value" as const,
      name: "Variance",
      nameLocation: "middle",
      nameGap: 32,
      max: yAxisMax,
      splitNumber: 5,
      nameTextStyle: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
      },
      axisLabel: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
        formatter: (value: number) => value.toFixed(1),
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: "#e3e1e5" } },
    },
    tooltip: {
      show: true,
      trigger: "axis" as const,
      confine: true,
      axisPointer: {
        type: "shadow" as const,
        z: -1,
        shadowStyle: { color: "rgba(150,150,150,0.08)" },
        label: {
          show: true,
          backgroundColor: "transparent",
          color: "#787776",
          fontSize: 10,
          fontFamily: "Inter",
          fontWeight: 500,
          margin: 4,
        },
      },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#D2D2DA",
      borderWidth: 1,
      textStyle: { fontSize: 11, fontFamily: "Inter", color: "#484646" },
      formatter: (
        params: Array<{
          marker: string;
          name: string;
          data?: { value: number; sampleN?: number | null };
        }>
      ) => {
        if (!Array.isArray(params)) return "";
        return params
          .map((param) => {
            const value = param.data?.value?.toFixed(2) ?? "";
            const sampleN = param.data?.sampleN;
            const nText = typeof sampleN === "number" ? ` (n=${sampleN})` : "";
            return `<div style="display:flex;align-items:center;gap:4px;padding:1px 0">${param.marker}<span style="color:#484646;font-size:9px;flex:1">${param.name}</span><span style="color:#484646;font-size:12px;font-weight:600;text-align:right">${value}${nText}</span></div>`;
          })
          .join("");
      },
    },
    legend: { show: false },
    series: [
      {
        type: "bar" as const,
        data: sortedVariance.map((v, index) => {
          const isActive = hoveredIdx === null || hoveredIdx === index;
          const color = getGroupColor(v.classification);
          return {
            value: v.variance,
            sampleN: typeof v.number === "number" ? Math.round(v.number) : null,
            itemStyle: {
              color: hexToRgba(color, isActive ? 1 : 0.6),
              borderRadius: [8, 8, 8, 8],
            },
            label: {
              color:
                hoveredIdx === null
                  ? v.variance === maxVar
                    ? color
                    : "#787776"
                  : isActive
                    ? v.variance === maxVar
                      ? color
                      : "#787776"
                    : hexToRgba("#787776", 0.6),
            },
          };
        }),
        barWidth: "85%",
        z: 3,
        label: {
          show: true,
          position: "top",
          distance: 2,
          align: "center" as const,
          formatter: (params: { data?: { sampleN?: number | null } }) => {
            const sampleN = params.data?.sampleN;
            return typeof sampleN === "number" ? `n=${sampleN}` : "";
          },
          color: "#787776",
          fontFamily: "Inter, sans-serif",
          fontSize: isNarrow ? 10.5 : 12,
          fontWeight: 500,
          lineHeight: isNarrow ? 11.55 : 13.2,
        },
      },
      ...(totalVarValue !== null
        ? [
            {
              type: "line" as const,
              data: [],
              z: 1,
              tooltip: { show: false },
              markLine: {
                silent: true,
                symbol: "none",
                animation: false,
                label: {
                  show: true,
                  position: "insideEndTop",
                  formatter: `Total var=${totalVarValue.toFixed(2)}`,
                  fontSize: 10.5,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  lineHeight: 11.025,
                  color: "#787776",
                  offset: [0, 2],
                },
                lineStyle: { type: "dashed", color: "#D2D2DA", width: 1 },
                data: [{ yAxis: totalVarValue }],
              },
            },
          ]
        : []),
    ],
  };
}

function ExpandedRowContent({ row }: { row: ResultTableItem }) {
  const [hoveredVdSeries, setHoveredVdSeries] = useState<number | null>(null);
  const [hoveredWgIdx, setHoveredWgIdx] = useState<number | null>(null);

  const vdEvents = useMemo(
    () => ({
      mouseover: (params: { seriesIndex?: number }) => {
        if (params.seriesIndex !== undefined) setHoveredVdSeries(params.seriesIndex);
      },
      mouseout: () => setHoveredVdSeries(null),
      globalout: () => setHoveredVdSeries(null),
    }),
    []
  );

  const wgEvents = useMemo(
    () => ({
      mouseover: (params: { dataIndex?: number }) => {
        if (params.dataIndex !== undefined) setHoveredWgIdx(params.dataIndex);
      },
      mouseout: () => setHoveredWgIdx(null),
      globalout: () => setHoveredWgIdx(null),
      updateaxispointer: (params: { axesInfo?: Array<{ value?: number }> }) => {
        const axesInfo = params?.axesInfo;
        if (axesInfo && axesInfo.length > 0 && axesInfo[0].value !== undefined) {
          setHoveredWgIdx(axesInfo[0].value);
        }
      },
    }),
    []
  );

  const detailGroupLimit = getDisplayGroupCount(
    row.of_group,
    row.number_or_patient?.length ?? row.within_group_variance_by_subgroup?.length ?? 0
  );
  const isNarrow = typeof window !== "undefined" && window.innerWidth <= 1470;

  const sortedPatients = clampGroupArray(
    row.number_or_patient
      ? sortByClassification(
          [...row.number_or_patient],
          (patient) =>
            row.within_group_variance_by_subgroup?.find(
              (variance) => variance.group === patient.group
            )?.classification
        )
      : [],
    detailGroupLimit,
    0
  );

  const lowGroupPatient = sortedPatients.find((patient) => {
    const varianceData = row.within_group_variance_by_subgroup?.find(
      (variance) => variance.group === patient.group
    );
    return normalizeClassification(varianceData?.classification) === "low";
  });
  const minPatients = toFiniteNumber(lowGroupPatient?.number);

  const explainedVarianceItem = getExplainedVarianceItem(row.variance_decomposition);
  const varianceMetricSourceItem =
    getVarianceMetricSourceItem(row.variance_decomposition) ?? explainedVarianceItem;
  const totalVariance = toFiniteNumber(varianceMetricSourceItem?.eta_square);
  const totalVR = toFiniteNumber(varianceMetricSourceItem?.ew_vr);

  const sortedVariance = clampGroupArray(
    row.within_group_variance_by_subgroup
      ? sortByClassification(
          [...row.within_group_variance_by_subgroup],
          (variance) => variance.classification
        )
      : [],
    detailGroupLimit,
    0
  );

  const totalVarValue = toFiniteNumber(varianceMetricSourceItem?.ew_total_variance);
  const ewExplainedVariance = toFiniteNumber(varianceMetricSourceItem?.ew_explained_variance);
  const ewWithinVariance = toFiniteNumber(varianceMetricSourceItem?.ew_within_variance);

  const variancePercent = (row.variance_benefit * 100).toFixed(1);
  const primaryGroup = sortedVariance.find(
    (variance) => normalizeClassification(variance.classification) === "low"
  )
    ? "Low Risk"
    : sortedVariance.find((variance) => normalizeClassification(variance.classification) === "high")
      ? "High Risk"
      : "patient group";
  const counterpartGroup =
    primaryGroup === "Low Risk" ? "High Risk" : primaryGroup === "High Risk" ? "Low Risk" : null;

  const progressionGroupSet = row.disease_progression_by_subgroup
    ? new Set(row.disease_progression_by_subgroup.map((item) => item.group))
    : new Set<string>();
  const orderedProgressionGroups = sortedVariance
    .map((variance) => variance.group)
    .filter((group) => progressionGroupSet.has(group));
  const diseaseProgressionGroups = row.disease_progression_by_subgroup
    ? Array.from(new Set(row.disease_progression_by_subgroup.map((item) => item.group).sort()))
    : [];
  const displayedProgressionGroups = clampGroupArray(
    orderedProgressionGroups.length > 0 ? orderedProgressionGroups : diseaseProgressionGroups,
    row.of_group,
    row.disease_progression_by_subgroup?.length ??
      row.number_or_patient?.length ??
      row.within_group_variance_by_subgroup?.length ??
      0
  );
  const displayedProgressionGroupSet = new Set(displayedProgressionGroups);
  const filteredProgressionData = (row.disease_progression_by_subgroup ?? []).filter((item) =>
    displayedProgressionGroupSet.has(item.group)
  );
  const varianceLabelText = getCiText(explainedVarianceItem);
  const withinPooledValue = ewExplainedVariance;
  const explainedTotalWithinValue = ewWithinVariance;

  return (
    <tr className="bg-[#efeff4]">
      <td colSpan={12} className="border-neutral-80 border-b p-0">
        <div className="bg-[#efeff4] px-4 py-6">
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-1 flex-col gap-4 rounded-[18px] bg-white/60 p-2">
                <h3 className="text-body4 text-neutral-30 flex-shrink-0 pt-1 pl-1">
                  Disease Progression by Subgroup
                </h3>
                <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[8px] bg-white p-1 pb-[40%] [@media(max-width:1470px)]:pb-[50%]">
                  {filteredProgressionData.length > 0 ? (
                    <div className="absolute inset-0 p-1">
                      <ReactECharts
                        option={buildDiseaseProgressionChartOption(
                          filteredProgressionData,
                          displayedProgressionGroups,
                          row.within_group_variance_by_subgroup,
                          row.outcome,
                          isNarrow
                        )}
                        style={{ height: "100%", width: "100%" }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-sm text-[#484646]">No data available</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1 rounded-[18px] bg-white/60 p-2">
                <div className="pt-1 pl-1">
                  <h3 className="text-body4 text-neutral-30 mb-1 flex-shrink-0">
                    Number of patients
                  </h3>
                  <p className="text-small1 mb-0 flex-shrink-0 text-[#605e5e]">
                    {minPatients !== null
                      ? `At least ${minPatients} patients per group are recommended.`
                      : "Minimum patient count is unavailable in API response."}
                  </p>
                </div>
                <div className="mt-auto">
                  <div className="h-wrap w-full space-y-0 overflow-auto rounded-[8px] bg-white p-3">
                    <div className="flex items-center gap-2 border-b border-[#adaaaa] pb-1 font-semibold text-[#231f52]">
                      <div className="flex-1">
                        <p className="text-body5 [@media(max-width:1470px)]:text-small1 font-semibold text-[#231F52]">
                          Group
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-body5 text-primary-15 [@media(max-width:1470px)]:text-small1">
                          Number of patients
                        </p>
                      </div>
                    </div>
                    {sortedPatients.map((patient, index) => {
                      const varianceData = row.within_group_variance_by_subgroup?.find(
                        (variance) => variance.group === patient.group
                      );
                      const classification = varianceData?.classification ?? "";
                      const normalizedClassification = normalizeClassification(classification);
                      const groupName =
                        normalizedClassification === "low"
                          ? "Low"
                          : getGroupDisplayName(classification);
                      const groupColor = getGroupColor(classification);

                      return (
                        <div
                          key={patient.group}
                          className={`flex items-center gap-2 py-1 text-sm ${
                            index > 0 ? "border-t border-[#adaaaa]" : ""
                          }`}
                        >
                          <div className="flex flex-1 items-center gap-[6px]">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: groupColor }}
                            />
                            <div>
                              <p className="text-body4m text-neutral-30">{groupName}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-body4m text-neutral-30">
                              {patient.number.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary-15 flex min-w-0 flex-col gap-6 rounded-[18px] p-3">
              <div className="flex flex-col gap-2">
                <h3 className="text-body3m text-white">Variance Reduction Explained</h3>
                <p className="text-body5m leading-relaxed text-white">
                  Subgroup stratification reduced the overall variance by {variancePercent}%. The
                  observed variance reduction was primarily driven by the {primaryGroup} patient
                  group. Therefore, if cutoff adjustment is required, maintaining the {primaryGroup}{" "}
                  group
                  {counterpartGroup
                    ? ` and adjusting the cutoff for the ${counterpartGroup} group`
                    : ""}{" "}
                  is a reasonable strategy.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-w-0 flex-col justify-between gap-3 rounded-[12px] bg-white p-3">
                  <div className="h-wrap flex justify-between gap-2">
                    <div className="flex-shrink-0 [@media(max-width:1480px)]:flex-[3_1_0]">
                      <h3
                        className="text-body3 text-neutral-20 [@media(max-width:1470px)]:text-body4 mb-2 tracking-[-0.75px]"
                        style={{ lineHeight: "100%" }}
                      >
                        Variance decomposition
                      </h3>
                      <div className="mb-4 flex gap-5">
                        <div>
                          <div className="text-body5 [@media(max-width:1470px)]:text-small1 text-secondary-60 font-semibold">
                            Variance
                          </div>
                          <div className="text-h4 [@media(max-width:1470px)]:text-body1 text-secondary-60">
                            {totalVariance !== null ? totalVariance.toFixed(2) : ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-body5 [@media(max-width:1470px)]:text-small1 text-secondary-60 font-semibold">
                            VR
                          </div>
                          <div className="text-h4 [@media(max-width:1470px)]:text-body1 text-secondary-60">
                            {totalVR !== null ? totalVR.toFixed(3) : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0 [@media(max-width:1470px)]:gap-1 [@media(max-width:1480px)]:flex-[1_1_0]">
                      <div className="flex flex-col items-start gap-0.5 font-medium min-[1471px]:flex-row min-[1471px]:items-center min-[1471px]:gap-1">
                        <div className="h-[10px] w-[32px] shrink-0 rounded-2xl bg-[#231F52]" />
                        <div className="min-w-0 text-left text-[10.5px] min-[1471px]:whitespace-nowrap">
                          <p>Within</p>
                          <p className="-mt-0.5 text-[#939090]" style={{ lineHeight: "110%" }}>
                            pooled
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-0.5 font-medium min-[1471px]:flex-row min-[1471px]:items-center min-[1471px]:gap-1">
                        <div className="h-[10px] w-[32px] shrink-0 rounded-2xl bg-[#AAA5E1]" />
                        <div className="min-w-0 text-left text-[10.5px] min-[1471px]:whitespace-nowrap">
                          <p>Explained</p>
                          <p className="-mt-0.5 text-[#939090]" style={{ lineHeight: "110%" }}>
                            Total Within
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white">
                    {withinPooledValue !== null && explainedTotalWithinValue !== null ? (
                      <div className="relative w-full" style={{ paddingBottom: "60%" }}>
                        <div className="absolute inset-0">
                          <ReactECharts
                            option={buildVarianceDecompositionChartOption(
                              withinPooledValue,
                              explainedTotalWithinValue,
                              varianceLabelText,
                              hoveredVdSeries
                            )}
                            style={{ height: "100%", width: "100%" }}
                            onEvents={vdEvents}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-sm text-[#484646]">No data available</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col justify-between gap-4 rounded-[12px] bg-white p-3">
                  <div className="flex-shrink-0">
                    <h3
                      className="text-body3 text-neutral-20 [@media(max-width:1470px)]:text-body4 mb-2"
                      style={{ lineHeight: "100%" }}
                    >
                      Within-group variance by subgroup
                    </h3>
                    <div className="mb-2 flex gap-5">
                      {sortedVariance.map((variance) => (
                        <div key={variance.group}>
                          <div className="text-body5 [@media(max-width:1470px)]:text-small1 font-semibold text-[#f06600]">
                            {getGroupDisplayName(variance.classification, "short")}
                          </div>
                          <div className="text-h4 [@media(max-width:1470px)]:text-body1 text-[#f06600]">
                            {variance.variance.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className="relative bg-white"
                    style={{ width: "100%", paddingBottom: "60%" }}
                  >
                    {sortedVariance.length > 0 ? (
                      <div className="absolute inset-0">
                        <ReactECharts
                          option={buildWithinGroupVarianceChartOption(
                            sortedVariance,
                            totalVarValue,
                            isNarrow,
                            hoveredWgIdx
                          )}
                          style={{ height: "100%", width: "100%" }}
                          onEvents={wgEvents}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-sm text-[#484646]">No data available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

function TSISubgroupSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") ?? "";
  const querySetNo = normalizeSetNo(searchParams.get("setNo"));
  const [titleFontSize, setTitleFontSize] = useState(42);
  const [selectedSetNo, setSelectedSetNo] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  // 왼쪽 그래프용: subgroup_sets_summary 데이터
  const [summaryData, setSummaryData] = useState<SubgroupSetSummary[]>([]);
  // 오른쪽 테이블용: result_table 데이터
  const [resultTableData, setResultTableData] = useState<ResultTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const displaySummaryData = isLoading ? [] : summaryData;
  const displayResultTableData = isLoading ? [] : resultTableData;

  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 페이지 마운트 시 API 호출
  useEffect(() => {
    if (!taskId) {
      setSummaryData([]);
      setResultTableData([]);
      setSelectedSetNo("");
      setError("taskId 쿼리 파라미터가 없습니다.");
      setIsLoading(false);
      return;
    }

    const fetchSubgroupSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSummaryData([]);
        setResultTableData([]);
        setSelectedSetNo("");
        setExpandedRows(new Set());
        const response = await getSubgroupSummaryList(taskId);

        // 왼쪽 그래프용: subgroup_sets_summary 저장
        setSummaryData(response.data.subgroup_sets_summary);

        // 오른쪽 테이블용: result_table 저장
        setResultTableData(response.data.result_table);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Subgroup Summary 조회에 실패했습니다.");
        console.error("Subgroup Summary API 호출 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubgroupSummary();
  }, [taskId]);

  useEffect(() => {
    if (!taskId || resultTableData.length === 0) return;

    const availableSetNos = resultTableData.map((item) => String(item.no).padStart(2, "0"));
    const fallbackSetNo = availableSetNos[0];
    const nextSetNo =
      querySetNo && availableSetNos.includes(querySetNo) ? querySetNo : fallbackSetNo;

    if (selectedSetNo !== nextSetNo) {
      setSelectedSetNo(nextSetNo);
    }

    if (querySetNo !== nextSetNo) {
      const query = new URLSearchParams(searchParams.toString());
      query.set("taskId", taskId);
      query.set("setNo", nextSetNo);
      router.replace(`/tsi/subgroup-selection?${query.toString()}`);
    }
  }, [querySetNo, resultTableData, router, searchParams, selectedSetNo, taskId]);

  const toggleRowExpansion = (rowNo: string) => {
    setExpandedRows((prev) => {
      // 이미 펼쳐진 행이면 닫기
      if (prev.has(rowNo)) {
        return new Set();
      } else {
        // 새로운 행을 펼치고, 기존에 펼쳐진 행은 모두 닫기 (하나만 펼치기)
        return new Set([rowNo]);
      }
    });
  };

  const handleSubgroupExplain = () => {
    if (!taskId) {
      return;
    }

    const selected = resultTableData.find((item) => item.no === parseInt(selectedSetNo));

    if (selected) {
      const query = new URLSearchParams({
        subgroupId: String(selected.subgroup_id),
        taskId,
      });
      if (selectedSetNo) {
        query.set("setNo", selectedSetNo);
      }
      router.push(`/tsi/subgroup-explain?${query.toString()}`);
    }
  };

  const handleSelectedSetNoChange = (value: string) => {
    const normalized = normalizeSetNo(value);
    if (!normalized) return;

    setSelectedSetNo(normalized);

    if (querySetNo === normalized) return;

    const query = new URLSearchParams(searchParams.toString());
    query.set("taskId", taskId);
    query.set("setNo", normalized);
    router.replace(`/tsi/subgroup-selection?${query.toString()}`);
  };

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
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
        }}
      >
        {/* Title */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
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
            Subgroup Selection
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col" style={{ gap: 0 }}>
          {/* 메인: 상위 배경 카드 2개 나란히 (좌 selection-left, 우 selection-bg) */}
          <div
            className="flex min-h-0 flex-1 flex-row flex-nowrap items-stretch gap-0 px-0.5"
            style={{ minWidth: 0 }}
          >
            {/* 왼쪽 상위 배경 카드: selection-left.png (Figma 536x614, radius 36) */}
            <div
              className="flex min-h-0 min-w-0 flex-[30] flex-col overflow-hidden rounded-[36px] p-0"
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
              {/* 남색 카드: Figma Frame 1618872954 512x590, radius 24, set 추가 시 스크롤 */}
              <div
                className="bg-primary-15 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px]"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 헤더: Figma 16,16 → 480x32, 카드와 간격 100px */}
                <div className="mb-[48px] flex-shrink-0 px-4 pt-4 pb-3">
                  <h2 className="text-body1 text-white">Subgroup Sets Summary</h2>
                </div>
                {/* 흰 패널: Set 목록 + 구간 차트 + Disease Progression 축 */}
                <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                  <div className="border-neutral-80 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border bg-white px-4 py-2">
                    {/* 하나의 div: Set별로 한 행(왼쪽+오른쪽), 구분선 일치 */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <div className="flex min-h-0 flex-col overflow-y-auto">
                        {error ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-body2 text-red-300">Error: {error}</div>
                          </div>
                        ) : !isLoading && displaySummaryData.length === 0 ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-body2 text-white">No data available</div>
                          </div>
                        ) : (
                          displaySummaryData.map((set, index) => {
                            // result_table에서 해당 set_name과 일치하는 항목 찾아서 no 가져오기
                            const tableItem = displayResultTableData.find(
                              (t) => t.set_name === set.set_name
                            );
                            const setNo = tableItem
                              ? String(tableItem.no).padStart(2, "0")
                              : String(index + 1).padStart(2, "0");
                            const isSelected = selectedSetNo === setNo;
                            const summaryLimit = getDisplayGroupCount(
                              tableItem?.of_group,
                              set.groups.length
                            );
                            const displayGroups = set.groups.slice(0, summaryLimit);

                            return (
                              <div
                                key={`${set.set_name}_${index}`}
                                className="border-neutral-80 flex min-h-fit border-b last:border-b-0"
                              >
                                {/* 왼쪽 셀: Set 버튼 + Groups (한 행 = 하나의 div, 2개 cell 구조) */}
                                <div className="border-neutral-80 flex min-h-fit w-[112px] flex-shrink-0 flex-col border-r px-0 py-2 [@media(max-width:1470px)]:py-1">
                                  <div className="flex min-h-[20px] flex-1 flex-shrink-0 items-center gap-2 px-1">
                                    <span className="bg-primary-15 text-body5m box-border flex shrink-0 items-center justify-center gap-1 rounded-full px-4 pt-1 pb-0.5 text-white">
                                      {set.set_name}
                                    </span>
                                    {isSelected && (
                                      <Image
                                        src="/assets/tsi/set-check.svg"
                                        alt=""
                                        width={18}
                                        height={20}
                                        className="flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                  <div className="flex min-h-fit flex-3 flex-col py-0.5">
                                    {displayGroups.map((g, groupIndex) => {
                                      const groupNum = g.group.replace("group", "");
                                      const groupName = `Group ${groupNum}`;
                                      return (
                                        <div
                                          key={`${set.set_name}-group-${groupIndex}`}
                                          className="text-body5m text-neutral-30 flex min-h-[20px] flex-1 items-center px-2 pt-1 pb-0.5"
                                        >
                                          {groupName}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* 오른쪽 셀: 왼쪽 기준 맞춤 (스페이서=Set행, 행높이=그룹 h-7) */}
                                <div className="relative flex min-h-fit min-w-0 flex-1 flex-col py-2 pr-4 pl-2 [@media(max-width:1470px)]:py-1">
                                  <div className="flex-1 flex-shrink-0" aria-hidden />
                                  {/* 눈금선: 차트 행 영역에만 표시 (Set 행 spacer 아래부터) */}
                                  <div
                                    className="pointer-events-none absolute right-0 left-0 flex justify-between pr-4 pl-2"
                                    style={{ top: 34, bottom: 8 }}
                                    aria-hidden
                                  >
                                    {Array.from({ length: 9 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className="bg-neutral-90/20 h-full w-px flex-shrink-0"
                                      />
                                    ))}
                                  </div>
                                  {(() => {
                                    // 현재 Set의 개별 min/max 계산 (각 Set마다 독립적인 스케일)
                                    const setValues = displayGroups.flatMap((g) => [
                                      g.ci_low,
                                      g.ci_high,
                                      g.mean,
                                    ]);
                                    const setMinValue = Math.min(...setValues);
                                    const setMaxValue = Math.max(...setValues);
                                    const setRange = setMaxValue - setMinValue;

                                    // 현재 Set의 개별 min/max 범위로 정규화하는 함수
                                    const normalize = (value: number) => {
                                      if (setRange === 0) return 50; // 범위가 0이면 중앙에 배치
                                      return ((value - setMinValue) / setRange) * 100;
                                    };

                                    return displayGroups.map((g, i) => {
                                      const barColor =
                                        GROUP_BAR_COLORS[i % GROUP_BAR_COLORS.length];

                                      // 각 Set의 개별 min/max 범위로 정규화 (독립적인 스케일)
                                      const meanPct = normalize(g.mean);
                                      const ciLowPct = normalize(g.ci_low);
                                      const ciHighPct = normalize(g.ci_high);

                                      return (
                                        <div
                                          key={`${set.set_name}-chart-${i}`}
                                          className="relative z-[1] flex min-h-[20px] flex-1 items-center"
                                        >
                                          <div
                                            className="relative flex h-3 w-full items-center"
                                            style={{ minHeight: 12 }}
                                          >
                                            {/* 가로선: ci_low ~ ci_high 범위 */}
                                            <div
                                              className="absolute rounded-full"
                                              style={{
                                                left: `${ciLowPct}%`,
                                                right: `${100 - ciHighPct}%`,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                backgroundColor: barColor,
                                                height: SUMMARY_ERROR_BAR_LINE_HEIGHT_PX,
                                              }}
                                            />
                                            {/* 심볼: mean 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${meanPct}%`,
                                                top: "50%",
                                                transform: "translate(-50%, -50%)",
                                                backgroundColor: barColor,
                                                width: SUMMARY_ERROR_BAR_DOT_SIZE_PX,
                                                height: SUMMARY_ERROR_BAR_DOT_SIZE_PX,
                                              }}
                                            />
                                            {/* 왼쪽 꼬리: ci_low 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${ciLowPct}%`,
                                                top: "50%",
                                                transform: "translate(-50%, -50%)",
                                                width: SUMMARY_ERROR_BAR_CAP_WIDTH_PX,
                                                height: SUMMARY_ERROR_BAR_CAP_HEIGHT_PX,
                                                backgroundColor: barColor,
                                              }}
                                            />
                                            {/* 오른쪽 꼬리: ci_high 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${ciHighPct}%`,
                                                top: "50%",
                                                transform: "translate(-50%, -50%)",
                                                width: SUMMARY_ERROR_BAR_CAP_WIDTH_PX,
                                                height: SUMMARY_ERROR_BAR_CAP_HEIGHT_PX,
                                                backgroundColor: barColor,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      {/* X축 행: 왼쪽 빈 칸 + 오른쪽에만 Slow/Rapid (위쪽 선은 마지막 Set 행 border-b로만 표시) */}
                      <div
                        className={`border-neutral-80 flex flex-shrink-0 border-t ${
                          error || isLoading || displaySummaryData.length === 0 ? "invisible" : ""
                        }`}
                      >
                        <div className="border-neutral-80 w-[112px] flex-shrink-0" aria-hidden />
                        <div className="flex min-w-0 flex-1 flex-col pt-0 pb-1 pl-2">
                          {/* 1) 축선 + 짧은 눈금(아래로) */}
                          <div className="flex w-full min-w-0 flex-col px-2">
                            <div
                              className="w-full border-b-[1.5px] border-neutral-50"
                              aria-hidden
                            />
                            <div className="mt-0 flex w-full justify-between px-0">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="bg-neutral-40 h-1 w-px shrink-0"
                                  aria-hidden
                                />
                              ))}
                            </div>
                          </div>
                          {/* 2) 그 아래 줄: Slow / Rapid */}
                          <div className="text-body5 text-neutral-30 mt-0.5 flex w-full items-center justify-between gap-2 px-2">
                            <span className="shrink-0">Slow</span>
                            <span className="flex-1 shrink-0" aria-hidden />
                            <span className="shrink-0">Rapid</span>
                          </div>
                          {/* 3) Disease Progression */}
                          <div className="text-body5m text-neutral-30 mt-0.5 w-full text-center">
                            Disease Progression
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
            <div
              className="flex min-h-0 min-w-0 flex-[70] flex-col overflow-hidden rounded-[24px] p-0"
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
              <div className="relative flex min-h-0 flex-1 flex-col p-0">
                {/* 안에 테이블 카드 (흰색) */}
                <div
                  className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white py-2 pr-1 pl-3"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="min-h-0 w-full flex-1 overflow-auto">
                      {isLoading ? (
                        <div className="h-full w-full rounded-[12px] bg-white" />
                      ) : (
                        <>
                          {/* 전통적인 HTML 테이블: 좌우 padding 8px 고정, 헤더 컬럼 auto */}
                          <table className="w-full table-fixed border-collapse">
                            <colgroup>
                              <col style={{ width: "5%" }} />
                              <col style={{ width: "6%" }} />
                              <col style={{ width: "5%" }} />
                              <col style={{ width: "13%" }} />
                              <col style={{ width: "10%" }} />
                              <col style={{ width: "8%" }} />
                              <col style={{ width: "7%" }} />
                              <col style={{ width: "8%" }} />
                              <col style={{ width: "12%" }} />
                              <col style={{ width: "10%" }} />
                              <col style={{ width: "8%" }} />
                              <col style={{ width: "8%" }} />
                            </colgroup>
                            <thead>
                              <tr className="border-neutral-30 border-b">
                                <th className={`${TABLE_HEADER_CELL_BASE_NO_BORDER} text-center`}>
                                  <div className={TABLE_INNER_DIV_CENTER_NO_BORDER}>Detail</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-center`}>
                                  <div className={TABLE_INNER_DIV_CENTER}>Select</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>No</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Set Name</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Outcome</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Cutoff</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Month</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>#Of Groups</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Variance Benefit</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Group balance</div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>
                                    Refine
                                    <br />
                                    Cutoffs
                                  </div>
                                </th>
                                <th className={`${TABLE_HEADER_CELL_BASE_LAST} text-right`}>
                                  <div className={TABLE_INNER_DIV_LEFT}>Delete</div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {error ? (
                                <tr>
                                  <td colSpan={12} className="h-[200px] text-center">
                                    <div className="text-body2 text-red-500">Error: {error}</div>
                                  </td>
                                </tr>
                              ) : displayResultTableData.length === 0 ? (
                                <tr>
                                  <td colSpan={12} className="h-[200px] text-center">
                                    <div className="text-body2 text-neutral-50">
                                      No data available
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                displayResultTableData.map((row) => {
                                  const rowNo = String(row.no).padStart(2, "0");
                                  const isSelected = selectedSetNo === rowNo;
                                  const isExpanded = expandedRows.has(rowNo);
                                  return (
                                    <Fragment key={row.subgroup_id}>
                                      <tr className={isExpanded ? "bg-[#efeff4]" : ""}>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_NO_BORDER} text-center`}
                                        >
                                          <div className={TABLE_INNER_DIV_CENTER_NO_BORDER}>
                                            <IconButton
                                              aria-label={
                                                isExpanded
                                                  ? `Collapse set ${rowNo}`
                                                  : `Expand set ${rowNo}`
                                              }
                                              type="button"
                                              onClick={() => toggleRowExpansion(rowNo)}
                                              className="text-neutral-40 hover:text-neutral-30 active:text-neutral-20 inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent transition-colors duration-150"
                                              title={isExpanded ? "접기" : "펼치기"}
                                            >
                                              <svg
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`text-neutral-40 h-6 w-6 transition-transform duration-200 [@media(max-width:1470px)]:h-5 [@media(max-width:1470px)]:w-5 ${
                                                  isExpanded ? "rotate-180" : ""
                                                }`}
                                              >
                                                <path
                                                  d="M12.0078 16C11.6866 16 11.394 15.8735 11.1299 15.6205L5.31077 9.79886C5.20718 9.6926 5.12949 9.57875 5.07769 9.45731C5.0259 9.33586 5 9.2043 5 9.06262C5 8.86528 5.04661 8.68564 5.13984 8.52372C5.23825 8.3618 5.36774 8.23529 5.5283 8.14421C5.69404 8.04807 5.87532 8 6.07214 8C6.37255 8 6.6367 8.10879 6.86459 8.32638L12.3496 13.8368L11.6659 13.8368L17.1354 8.32638C17.3633 8.10879 17.6274 8 17.9279 8C18.1247 8 18.3034 8.04807 18.4639 8.14421C18.6297 8.2353 18.7592 8.3618 18.8524 8.52372C18.9508 8.68564 19 8.86528 19 9.06262C19 9.34599 18.8964 9.58887 18.6892 9.79127L12.8701 15.6205C12.7458 15.747 12.6112 15.8406 12.4661 15.9013C12.3263 15.9621 12.1735 15.9949 12.0078 16Z"
                                                  fill="currentColor"
                                                />
                                              </svg>
                                            </IconButton>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                        >
                                          <div
                                            className={TABLE_INNER_DIV_CENTER}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <RadioButton
                                              checked={isSelected}
                                              name="subgroup-selection-set"
                                              onChange={() => handleSelectedSetNoChange(rowNo)}
                                              size={17}
                                            />
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">{rowNo}</span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                              <span className="truncate">{row.set_name}</span>
                                              {isSelected && (
                                                <Image
                                                  src="/assets/tsi/set-check.svg"
                                                  alt=""
                                                  width={18}
                                                  height={20}
                                                  className="flex-shrink-0"
                                                />
                                              )}
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">{row.outcome}</span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">
                                              {formatCutoffListForDisplay(row.cut_off).join("  ")}
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">{row.month}</span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">{row.of_group}</span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                          style={{
                                            color: row.variance_benefit_label ? "#3A11D8" : "",
                                          }}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">
                                              {(row.variance_benefit * 100).toFixed(1)}%
                                              {row.variance_benefit_label
                                                ? ` ${row.variance_benefit_label}`
                                                : ""}
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        >
                                          <div className={TABLE_INNER_DIV_LEFT}>
                                            <span className="block truncate">
                                              {row.group_balance}
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                        >
                                          <div className={TABLE_INNER_DIV_CENTER}>
                                            <IconButton
                                              aria-label={`Refine cutoffs for set ${rowNo}`}
                                              type="button"
                                              size="sm"
                                              className="text-neutral-40 hover:bg-tertiary-95 hover:text-tertiary-30 active:bg-tertiary-90 active:text-tertiary-20 !h-7 !w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent transition-colors duration-150"
                                              title="Refine Cutoffs"
                                              onClick={() => {
                                                const query = new URLSearchParams({
                                                  subgroupId: String(row.subgroup_id),
                                                  month: String(row.month),
                                                  setName: row.set_name,
                                                  setNo: rowNo,
                                                });
                                                if (taskId) {
                                                  query.set("taskId", taskId);
                                                }
                                                router.push(
                                                  `/tsi/refine-cutoffs?${query.toString()}`
                                                );
                                              }}
                                            >
                                              <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6 [@media(max-width:1470px)]:h-5 [@media(max-width:1470px)]:w-5"
                                              >
                                                <g
                                                  style={{
                                                    mixBlendMode: "plus-darker",
                                                  }}
                                                >
                                                  <path
                                                    d="M3.57812 20.4219V15.6094L15.6094 3.57812L20.4219 8.39062L8.39062 20.4219H3.57812Z"
                                                    stroke="#787776"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                  <path
                                                    d="M12.0156 7.1875L16.8281 12"
                                                    stroke="#787776"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                </g>
                                              </svg>
                                            </IconButton>
                                          </div>
                                        </td>
                                        <td className={`${TABLE_BODY_CELL_BASE_LAST} text-center`}>
                                          <div className={TABLE_INNER_DIV_CENTER}>
                                            {/* TODO(ui): Re-enable Delete action icon when policy is finalized. */}
                                          </div>
                                        </td>
                                      </tr>
                                      {isExpanded && <ExpandedRowContent row={row} />}
                                    </Fragment>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 버튼: 카드 밖 아래 */}
          <div className="flex flex-shrink-0 items-center justify-end gap-4 pr-3 pb-6">
            <button
              type="button"
              style={{
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 36,
                background: "#787776",
                border: "none",
                cursor: "pointer",
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Save Progress
            </button>
            <button
              type="button"
              onClick={handleSubgroupExplain}
              style={{
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 36,
                background: "#F06600",
                border: "none",
                cursor: "pointer",
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Subgroup Explain
              <svg
                width="16"
                height="16"
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
      </div>
    </AppLayout>
  );
}

export default function TSISubgroupSelectionPage() {
  return (
    <Suspense fallback={null}>
      <TSISubgroupSelectionPageContent />
    </Suspense>
  );
}
