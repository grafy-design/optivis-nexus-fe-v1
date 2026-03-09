"use client";

import { Suspense, useState, Fragment, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import RadioButton from "@/components/ui/radio-button";
import { AppLayout } from "@/components/layout/AppLayout";
import IconButton from "@/components/ui/icon-button";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  getSubgroupSummaryList,
  type SubgroupSetSummary,
  type ResultTableItem,
} from "@/services/subgroup-service";
import ReactECharts from "echarts-for-react";
import { Loading } from "@/components/common/Loading";

/**
 * TSI Step 4: Subgroup Selection
 * 왼쪽: 하위군 세트 요약 카드 (남색 배경 + 에러바 차트)
 * 오른쪽: 세트 목록 테이블 카드 (흰 배경, 펼침 행 포함)
 *
 * Left card: Subgroup Sets Summary (navy background + error-bar charts)
 * Right card: Result table with expandable rows showing detailed charts
 */

// ── 타입 정의 / Type definitions ─────────────────────────────────────────────

/** UI에서 사용하는 Set 데이터 구조 / Set data structure used in the UI */
interface SetData {
  no: string;
  setName: string;
  groups: string[];
  outcome: string;
  cutoff: string;
  month: string;
  numGroups: string;
  varianceBenefit: string;
  groupBalance: string;
}

// ── 왼쪽 요약 차트 상수 / Left summary chart constants ───────────────────────

/** 그룹별 에러바 색상 / Error-bar colors per group */
const GROUP_BAR_COLORS = ["#AAA5E1", "#7571A9", "#231F52"];
const SUMMARY_ERROR_BAR_LINE_HEIGHT_PX = 2;
const SUMMARY_ERROR_BAR_CAP_WIDTH_PX = 2;
const SUMMARY_ERROR_BAR_CAP_HEIGHT_PX = 12;
const SUMMARY_ERROR_BAR_DOT_SIZE_PX = 10;
/** 차트에 표시할 최대 그룹 수 / Maximum number of groups to display */
const MAX_GROUP_DISPLAY_COUNT = 3;

// ── 테이블 셀 스타일 상수 / Table cell style constants ───────────────────────

const TABLE_CELL_BASE = "h-[52px] border-b align-middle";
const TABLE_HEADER_CELL_BASE = "border-b align-middle py-1";
/** border-l이 없는 헤더 셀 / Header cell without left border */
const TABLE_HEADER_CELL_BASE_NO_BORDER = `${TABLE_HEADER_CELL_BASE} pr-2 border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_NO_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body5 text-neutral-40`;
/** border-l이 있는 헤더 셀 / Header cell with left border */
const TABLE_HEADER_CELL_BASE_WITH_BORDER = `${TABLE_HEADER_CELL_BASE} pr-2 border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_WITH_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body5 text-neutral-40`;
/** 마지막 컬럼 헤더 셀 / Last column header cell */
const TABLE_HEADER_CELL_BASE_LAST = `${TABLE_HEADER_CELL_BASE} border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_LAST = `${TABLE_CELL_BASE} border-neutral-80 text-body5 text-neutral-40`;
/** 내부 div: 세로선 포함, 가운데 정렬 / Inner div with left border, center-aligned */
const TABLE_INNER_DIV_CENTER =
  "w-full h-fit min-h-[28px] flex items-center justify-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_LEFT =
  "w-full h-fit min-h-[28px] flex items-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_CENTER_NO_BORDER =
  "w-full h-fit min-h-[28px] flex items-center justify-center";
const TABLE_INNER_DIV_LEFT_NO_BORDER = "w-full h-fit min-h-[28px] flex items-center";

// ── 유틸리티 함수 / Utility functions ────────────────────────────────────────

/** 분산 분해 데이터에서 CI 텍스트를 생성합니다. / Generates CI summary text. */
const getCiText = (
  varianceDecomposition: ResultTableItem["variance_decomposition"],
) => {
  if (!varianceDecomposition) return "";
  const listItem = varianceDecomposition[varianceDecomposition.length - 1];
  return `N=${listItem.number}, K=${listItem.variance} VR:${listItem.vr} (${listItem.ci}) η²=${listItem.eta_square}, ω²=${listItem.omega}`;
};

/** 표시할 그룹 수를 계산합니다. / Calculates group count, capped at MAX_GROUP_DISPLAY_COUNT. */
const getDisplayGroupCount = (
  requestedCount: number | null | undefined,
  fallbackCount: number,
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

/** 배열을 지정된 그룹 수만큼 잘라냅니다. / Clamps array to calculated display group count. */
const clampGroupArray = <T,>(
  items: T[],
  requestedCount: number | null | undefined,
  fallbackCount: number,
): T[] => {
  const limit = getDisplayGroupCount(requestedCount, fallbackCount);
  if (limit <= 0) return [];
  return items.slice(0, limit);
};

/** 분류 정렬 순서: high → middle → low / Sort order: high → middle → low */
const CLASSIFICATION_ORDER: Record<string, number> = { high: 0, middle: 1, low: 2 };

/** classification 값을 표시 이름으로 변환 / Converts classification key to display name */
const getGroupDisplayName = (classification: string): string => {
  if (classification === "high") return "High Risk";
  if (classification === "middle") return "Middle Risk";
  if (classification === "low") return "Low";
  return classification;
};

/** classification에 따른 그룹 색상 반환 / Returns chart color for a given classification */
const getGroupColor = (classification: string): string => {
  if (classification === "high") return "#231F52";
  if (classification === "middle") return "#7571A9";
  if (classification === "low") return "#AAA5E1";
  return "#231F52";
};

/** hex 색상을 rgba로 변환 / Converts hex color to rgba string */
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** classification 기준으로 배열 정렬 (high > middle > low) / Sorts array by classification */
const sortByClassification = <T extends { classification?: string; group?: string }>(
  items: T[],
  getClassification: (item: T) => string,
): T[] =>
  [...items].sort(
    (a, b) =>
      (CLASSIFICATION_ORDER[getClassification(a)] ?? 99) -
      (CLASSIFICATION_ORDER[getClassification(b)] ?? 99),
  );
// ── 목업 데이터 (API 실패 시 폴백) / Mock data (fallback when API fails) ──────

const MOCK_SUMMARY_DATA: SubgroupSetSummary[] = [
  {
    set_name: "Set 1",
    outcome: "ADAS Cog 11",
    month: 12,
    entity_type: "feature",
    basis_type: "slope",
    cutoff_axis_type: "x_value",
    groups: [
      { group: "group1", mean: -1.2, ci_low: -2.5, ci_high: 0.1, name: "Disease Progression" },
      { group: "group2", mean: 0.8, ci_low: -0.3, ci_high: 1.9, name: "Disease Progression" },
    ],
  },
  {
    set_name: "Set 2",
    outcome: "CDR-SB",
    month: 12,
    entity_type: "feature",
    basis_type: "slope",
    cutoff_axis_type: "x_value",
    groups: [
      { group: "group1", mean: -0.5, ci_low: -1.8, ci_high: 0.8, name: "Disease Progression" },
      { group: "group2", mean: 1.5, ci_low: 0.3, ci_high: 2.7, name: "Disease Progression" },
    ],
  },
  {
    set_name: "Set 3",
    outcome: "ADAS Cog 11",
    month: 12,
    entity_type: "feature",
    basis_type: "slope",
    cutoff_axis_type: "x_value",
    groups: [
      { group: "group1", mean: -2.0, ci_low: -3.5, ci_high: -0.5, name: "Disease Progression" },
      { group: "group2", mean: 0.3, ci_low: -0.8, ci_high: 1.4, name: "Disease Progression" },
      { group: "group3", mean: 2.1, ci_low: 1.0, ci_high: 3.2, name: "Disease Progression" },
    ],
  },
];

const MOCK_RESULT_TABLE_DATA: ResultTableItem[] = [
  {
    subgroup_id: 101,
    no: 1,
    set_name: "Set 1",
    outcome: "ADAS Cog 11",
    cut_off: ["<=1.34"],
    month: 12,
    of_group: 2,
    variance_benefit: 0.18,
    variance_benefit_label: "(Highest)",
    group_balance: "OK(n min=370)",
    entity_type: "feature",
    basis_type: "slope",
    cutoff_axis_type: "x_value",
    disease_progression_by_subgroup: [
      { group: "group1", month: 0, mean: 20.5, ci_low: 19.2, ci_high: 21.8 },
      { group: "group1", month: 3, mean: 19.8, ci_low: 18.5, ci_high: 21.1 },
      { group: "group1", month: 6, mean: 19.0, ci_low: 17.6, ci_high: 20.4 },
      { group: "group1", month: 9, mean: 18.5, ci_low: 17.0, ci_high: 20.0 },
      { group: "group1", month: 12, mean: 18.0, ci_low: 16.4, ci_high: 19.6 },
      { group: "group2", month: 0, mean: 15.0, ci_low: 13.8, ci_high: 16.2 },
      { group: "group2", month: 3, mean: 15.2, ci_low: 14.0, ci_high: 16.4 },
      { group: "group2", month: 6, mean: 15.5, ci_low: 14.2, ci_high: 16.8 },
      { group: "group2", month: 9, mean: 15.8, ci_low: 14.4, ci_high: 17.2 },
      { group: "group2", month: 12, mean: 16.0, ci_low: 14.5, ci_high: 17.5 },
    ],
    number_or_patient: [
      { group: "group1", number: 454 },
      { group: "group2", number: 370 },
    ],
    variance_decomposition: [
      { group: "total", variance: 52.13, number: 824, vr: 0.44, ci: "0.38 - 0.50", eta_square: 0.19, omega: 0.18 },
    ],
    within_group_variance_by_subgroup: [
      { group: "group1", number: 454, variance: 134.49, classification: "high", total_var: 119.5 },
      { group: "group2", number: 370, variance: 52.13, classification: "low", total_var: 119.5 },
    ],
  },
  {
    subgroup_id: 102,
    no: 2,
    set_name: "Set 2",
    outcome: "CDR-SB",
    cut_off: ["<=-0.17"],
    month: 12,
    of_group: 2,
    variance_benefit: 0.06,
    variance_benefit_label: "",
    group_balance: "OK(n min=298)",
    entity_type: "feature",
    basis_type: "slope",
    cutoff_axis_type: "x_value",
    disease_progression_by_subgroup: [
      { group: "group1", month: 0, mean: 3.2, ci_low: 2.8, ci_high: 3.6 },
      { group: "group1", month: 3, mean: 3.5, ci_low: 3.0, ci_high: 4.0 },
      { group: "group1", month: 6, mean: 3.8, ci_low: 3.2, ci_high: 4.4 },
      { group: "group1", month: 9, mean: 4.0, ci_low: 3.3, ci_high: 4.7 },
      { group: "group1", month: 12, mean: 4.3, ci_low: 3.5, ci_high: 5.1 },
      { group: "group2", month: 0, mean: 2.5, ci_low: 2.1, ci_high: 2.9 },
      { group: "group2", month: 3, mean: 2.6, ci_low: 2.2, ci_high: 3.0 },
      { group: "group2", month: 6, mean: 2.7, ci_low: 2.2, ci_high: 3.2 },
      { group: "group2", month: 9, mean: 2.8, ci_low: 2.3, ci_high: 3.3 },
      { group: "group2", month: 12, mean: 2.9, ci_low: 2.3, ci_high: 3.5 },
    ],
    number_or_patient: [
      { group: "group1", number: 526 },
      { group: "group2", number: 298 },
    ],
    variance_decomposition: [
      { group: "total", variance: 3.97, number: 824, vr: 0.61, ci: "0.84 - 1.14", eta_square: 0.06, omega: 0.06 },
    ],
    within_group_variance_by_subgroup: [
      { group: "group1", number: 526, variance: 6.38, classification: "high", total_var: 6.48 },
      { group: "group2", number: 298, variance: 3.97, classification: "low", total_var: 6.48 },
    ],
  },
  {
    subgroup_id: 103,
    no: 3,
    set_name: "Set 3",
    outcome: "ADAS Cog 11",
    cut_off: ["<=33%", "<=66%"],
    month: 12,
    of_group: 3,
    variance_benefit: 0.30,
    variance_benefit_label: "",
    group_balance: "OK(n min=210)",
    entity_type: "feature",
    basis_type: "slope",
    cutoff_axis_type: "x_value",
    disease_progression_by_subgroup: [
      { group: "group1", month: 0, mean: 22.0, ci_low: 20.5, ci_high: 23.5 },
      { group: "group1", month: 6, mean: 20.5, ci_low: 18.8, ci_high: 22.2 },
      { group: "group1", month: 12, mean: 19.0, ci_low: 17.0, ci_high: 21.0 },
      { group: "group2", month: 0, mean: 17.5, ci_low: 16.2, ci_high: 18.8 },
      { group: "group2", month: 6, mean: 17.0, ci_low: 15.6, ci_high: 18.4 },
      { group: "group2", month: 12, mean: 16.5, ci_low: 14.9, ci_high: 18.1 },
      { group: "group3", month: 0, mean: 14.0, ci_low: 12.8, ci_high: 15.2 },
      { group: "group3", month: 6, mean: 14.5, ci_low: 13.2, ci_high: 15.8 },
      { group: "group3", month: 12, mean: 15.0, ci_low: 13.5, ci_high: 16.5 },
    ],
    number_or_patient: [
      { group: "group1", number: 304 },
      { group: "group2", number: 310 },
      { group: "group3", number: 210 },
    ],
    variance_decomposition: [
      { group: "total", variance: 68.5, number: 824, vr: 0.52, ci: "0.45 - 0.59", eta_square: 0.25, omega: 0.24 },
    ],
    within_group_variance_by_subgroup: [
      { group: "group1", number: 304, variance: 95.2, classification: "high", total_var: 85.0 },
      { group: "group2", number: 310, variance: 60.1, classification: "middle", total_var: 85.0 },
      { group: "group3", number: 210, variance: 38.7, classification: "low", total_var: 85.0 },
    ],
  },
];

// ── ECharts 차트 옵션 빌더 / ECharts chart option builders ────────────────────

type EChartsRenderApi = {
  value: (i: number) => number;
  coord: (p: number[]) => number[];
  style: (o: object) => object;
};

/**
 * 하위군별 질병 진행 꺾은선+에러바 차트 옵션을 빌드합니다.
 * Builds the ECharts option for the Disease Progression line chart with error bars.
 */
function buildDiseaseProgressionChartOption(
  filteredProgressionData: NonNullable<ResultTableItem["disease_progression_by_subgroup"]>,
  displayedProgressionGroups: string[],
  withinGroupVariance: ResultTableItem["within_group_variance_by_subgroup"],
  outcome: string,
  isNarrow = false,
) {
  const months = Array.from(
    new Set(filteredProgressionData.map((d) => d.month)),
  ).sort((a, b) => a - b);

  const series = displayedProgressionGroups.map((group) => {
    const groupData = filteredProgressionData.filter((d) => d.group === group);
    const varianceData = withinGroupVariance?.find((v) => v.group === group);
    const classification = varianceData?.classification || "";
    const color = getGroupColor(classification);
    const groupName = getGroupDisplayName(classification);
    return {
      name: groupName,
      type: "line" as const,
      data: months.map((month) => { const dp = groupData.find((d) => d.month === month); return dp ? [month, dp.mean] : null; }).filter((d) => d !== null),
      itemStyle: { color },
      lineStyle: { color, width: 2 },
      symbol: "circle",
      symbolSize: isNarrow ? 6 : 10,
      emphasis: {
        focus: "series" as const,
        itemStyle: { opacity: 1, borderWidth: 2, borderColor: color, color },
        lineStyle: { width: 3 },
      },
      blur: {
        itemStyle: { opacity: 0.6 },
        lineStyle: { opacity: 0.6 },
      },
    };
  });

  const CAP_LEN_PX = isNarrow ? 4 : 10;
  const errorBarSeries = displayedProgressionGroups.map((group) => {
    const groupData = filteredProgressionData.filter((d) => d.group === group);
    const varianceData = withinGroupVariance?.find((v) => v.group === group);
    const classification = varianceData?.classification || "";
    const color = getGroupColor(classification);
    return {
      name: `${group} error`,
      type: "custom" as const,
      data: months.map((month) => { const dp = groupData.find((d) => d.month === month); if (!dp) return null; return [month, dp.mean, dp.mean - dp.ci_low, dp.ci_high - dp.mean]; }).filter((d) => d !== null),
      renderItem: (_params: unknown, api: EChartsRenderApi) => {
        const xVal = api.value(0); const mean = api.value(1); const marginLow = api.value(2); const marginHigh = api.value(3);
        const low = api.coord([xVal, mean - marginLow]); const high = api.coord([xVal, mean + marginHigh]);
        return { type: "group", children: [
          { type: "line", shape: { x1: low[0], y1: low[1], x2: high[0], y2: high[1] }, style: api.style({ stroke: color, lineWidth: 1.5 }) },
          { type: "line", shape: { x1: low[0] - CAP_LEN_PX / 2, y1: low[1], x2: low[0] + CAP_LEN_PX / 2, y2: low[1] }, style: api.style({ stroke: color, lineWidth: 1.5 }) },
          { type: "line", shape: { x1: high[0] - CAP_LEN_PX / 2, y1: high[1], x2: high[0] + CAP_LEN_PX / 2, y2: high[1] }, style: api.style({ stroke: color, lineWidth: 1.5 }) },
        ] };
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

  // X축 edge 레이블 너비 측정 — 텍스트가 축 경계 밖으로 삐져나오지 않도록
  const measureW = (text: string) => {
    if (typeof document === "undefined") return text.length * 6;
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    if (!ctx) return text.length * 6;
    ctx.font = "500 10px Inter";
    return ctx.measureText(text).width;
  };
  const xMinLabelW = measureW("0");
  const xMaxLabelW = measureW(months[months.length - 1].toString());

  return {
    animation: true,
    animationDuration: 500,
    grid: {
      left: "16px",
      right: "6px",
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
      nameTextStyle: { fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776" },
      axisLabel: {
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter",
        color: "#787776",
        margin: 4,
        // rich text로 edge 레이블을 축 경계에 정확히 맞춤
        // lEdge: right-align → 텍스트 왼쪽 끝이 tick 위치에 맞춰짐
        // rEdge: left-align  → 텍스트 오른쪽 끝이 tick 위치에 맞춰짐
        rich: {
          lEdge: {
            width: Math.ceil(xMinLabelW * 2) + 2,
            align: "right",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Inter",
            color: "#787776",
          },
          rEdge: {
            width: Math.ceil(xMaxLabelW * 2) + 2,
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
      nameGap: 28,
      min: yMin - yPadding,
      max: yMax + yPadding,
      nameTextStyle: { fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776" },
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
          // 상단 edge: tick이 yMax 근처 (패딩 영역 내) → 아래로 이동
          if (value > yMax - yPadding) return `\n${base}`;
          return base;
        },
      },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { type: "solid", color: "#e3e1e5", width: 1 } },
    },
    tooltip: {
      show: true,
      trigger: "axis" as const,
      confine: true,
      axisPointer: {
        type: "cross" as const,
        lineStyle: { color: "#D2D2DA" },
        crossStyle: { color: "#D2D2DA" },
        label: {
          show: true,
          backgroundColor: "transparent",
          color: "#787776",
          fontSize: 10,
          fontFamily: "Inter",
          fontWeight: 500,
          margin: 0.8,
          formatter: (params: { axisDimension: string; value: number }) => {
            if (params.axisDimension === "x") return `${params.value.toFixed(1)}`;
            return params.value.toFixed(2);
          },
        },
      },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#D2D2DA",
      borderWidth: 1,
      textStyle: { fontSize: 11, fontFamily: "Inter", color: "#484646" },
      formatter: (params: Array<{ seriesName: string; marker: string; value: [number, number] }>) => {
        if (!Array.isArray(params) || params.length === 0) return "";
        const month = params[0].value[0];
        const filtered = params.filter((p) => !p.seriesName.endsWith(" error"));
        let html = `<div style="font-size:9px;font-family:Inter;color:#484646;font-weight:600;margin-bottom:4px">${month.toFixed(1)} month</div>`;
        filtered.forEach((p) => {
          html += `<div style="display:flex;align-items:center;gap:4px;padding:1px 0">${p.marker}<span style="color:#484646;font-size:9px;flex:1">${p.seriesName}</span><span style="color:#484646;font-size:12px;font-weight:600;text-align:right">${p.value[1].toFixed(2)}</span></div>`;
        });
        return html;
      },
    },
    legend: { show: false },
    series: [...series, ...errorBarSeries],
  };
}

/**
 * 분산 분해(Variance Decomposition) 누적 막대 차트 옵션을 빌드합니다.
 * Builds the ECharts option for the Variance Decomposition stacked bar chart.
 */
function buildVarianceDecompositionChartOption(
  decompositionData: NonNullable<ResultTableItem["variance_decomposition"]>,
  hoveredSeries: number | null = null,
) {
  const totalVarianceValue = decompositionData[0]?.variance || 0;
  const vrRatio = Math.max(0, Math.min(1, decompositionData[0]?.vr ?? 0));
  const explainedTotal = totalVarianceValue * vrRatio;
  const withinPooled = Math.max(0, totalVarianceValue - explainedTotal);
  const varianceMax = Math.max(totalVarianceValue, 0);
  const varianceBarWidth = "82%";
  const ciText = getCiText(decompositionData);

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
      axisLabel: { show: true, fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776", margin: 4 },
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } },
      axisTick: { show: false },
      axisPointer: { label: { show: false } },
    },
    yAxis: {
      type: "value" as const,
      name: "Variance",
      nameLocation: "middle",
      nameGap: 24,
      max: varianceMax * 1.5,
      splitNumber: 5,
      nameTextStyle: { fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776" },
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
      axisPointer: { type: "shadow" as const, z: -1, shadowStyle: { color: "rgba(150,150,150,0.08)" }, label: { show: true, backgroundColor: "transparent", color: "#787776", fontSize: 10, fontFamily: "Inter", fontWeight: 500, margin: 4 } },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#D2D2DA",
      borderWidth: 1,
      textStyle: { fontSize: 11, fontFamily: "Inter", color: "#484646" },
      formatter: (params: Array<{ seriesName: string; marker: string; value: number }>) => {
        if (!Array.isArray(params)) return "";
        return params
          .map((p) => `<div style="display:flex;align-items:center;gap:4px;padding:1px 0">${p.marker}<span style="color:#484646;font-size:9px;flex:1">${p.seriesName}</span><span style="color:#484646;font-size:12px;font-weight:600;text-align:right">${p.value.toFixed(2)}</span></div>`)
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
        itemStyle: { color: hexToRgba("#231F52", withinActive ? 1 : 0.6), borderRadius: [8, 8, 8, 8] },
        barWidth: varianceBarWidth,
      },
      {
        name: "Explained Total Within",
        type: "bar" as const,
        stack: "variance",
        data: [explainedTotal],
        itemStyle: { color: hexToRgba("#AAA5E1", explainedActive ? 1 : 0.6), borderRadius: [8, 8, 8, 8] },
        barWidth: varianceBarWidth,
        label: { show: false },
      },
    ],
  };
}

/**
 * 하위군별 그룹 내 분산(Within-Group Variance) 막대 차트 옵션을 빌드합니다.
 * Builds the ECharts option for the Within-Group Variance bar chart.
 */
function buildWithinGroupVarianceChartOption(
  sortedVariance: NonNullable<ResultTableItem["within_group_variance_by_subgroup"]>,
  isNarrow = false,
  hoveredIdx: number | null = null,
) {
  const maxVar = Math.max(...sortedVariance.map((v) => v.variance));
  const totalVarValue = sortedVariance.length > 0 ? sortedVariance[0].total_var : 0;
  const yAxisMax = Math.max(maxVar, totalVarValue) * 1.2;

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
    xAxis: { type: "category" as const, data: sortedVariance.map((v) => v.classification === "high" ? "High" : v.classification === "middle" ? "Middle" : "Low"), axisLabel: { fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776", margin: 4 }, axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } }, axisTick: { show: false }, axisPointer: { label: { show: false } } },
    yAxis: { type: "value" as const, name: "Variance", nameLocation: "middle", nameGap: 32, max: yAxisMax, splitNumber: 5, nameTextStyle: { fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776" }, axisLabel: { fontSize: 10, fontWeight: 500, fontFamily: "Inter", color: "#787776", margin: 4, formatter: (value: number) => value.toFixed(1) }, axisLine: { show: true, onZero: false, lineStyle: { color: "#787776", width: 1 } }, axisTick: { show: false }, splitLine: { show: true, lineStyle: { color: "#e3e1e5" } } },
    tooltip: {
      show: true,
      trigger: "axis" as const,
      confine: true,
      axisPointer: { type: "shadow" as const, z: -1, shadowStyle: { color: "rgba(150,150,150,0.08)" }, label: { show: true, backgroundColor: "transparent", color: "#787776", fontSize: 10, fontFamily: "Inter", fontWeight: 500, margin: 4 } },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#D2D2DA",
      borderWidth: 1,
      textStyle: { fontSize: 11, fontFamily: "Inter", color: "#484646" },
      formatter: (params: Array<{ marker: string; name: string; data?: { value: number; sampleN?: number | null } }>) => {
        if (!Array.isArray(params)) return "";
        return params.map((p) => {
          const val = p.data?.value?.toFixed(2) ?? "";
          const n = p.data?.sampleN;
          const nText = typeof n === "number" ? ` (n=${n})` : "";
          return `<div style="display:flex;align-items:center;gap:4px;padding:1px 0">${p.marker}<span style="color:#484646;font-size:9px;flex:1">${p.name}</span><span style="color:#484646;font-size:12px;font-weight:600;text-align:right">${val}${nText}</span></div>`;
        }).join("");
      },
    }, legend: { show: false },
    series: [{
      type: "bar" as const,
      data: sortedVariance.map((v, i) => {
        const isActive = hoveredIdx === null || hoveredIdx === i;
        const color = getGroupColor(v.classification);
        return {
          value: v.variance,
          sampleN: typeof v.number === "number" ? Math.round(v.number) : null,
          itemStyle: { color: hexToRgba(color, isActive ? 1 : 0.6), borderRadius: [8, 8, 8, 8] },
          label: {
            color: hoveredIdx === null
              ? (v.variance === maxVar ? color : "#787776")
              : isActive
                ? (v.variance === maxVar ? color : "#787776")
                : hexToRgba("#787776", 0.6),
          },
        };
      }),
      barWidth: "85%",
      z: 3,
      label: { show: true, position: "top", distance: 2, align: "center" as const, formatter: (params: { data?: { sampleN?: number | null } }) => { const sampleN = params.data?.sampleN; return typeof sampleN === "number" ? `n=${sampleN}` : ""; }, color: "#787776", fontFamily: "Inter, sans-serif", fontSize: isNarrow ? 10.5 : 12, fontWeight: 500, lineHeight: isNarrow ? 11.55 : 13.2 },
    },
    {
      type: "line" as const,
      data: [],
      z: 1,
      tooltip: { show: false },
      markLine: { silent: true, symbol: "none", animation: false, label: { show: true, position: "insideEndTop", formatter: `Total var=${totalVarValue.toFixed(2)}`, fontSize: 10.5, fontWeight: 600, fontFamily: "Inter", lineHeight: 11.025, color: "#787776", offset: [0, 2] }, lineStyle: { type: "dashed", color: "#D2D2DA", width: 1 }, data: [{ yAxis: totalVarValue }] },
    }],
  };
}

// ── ExpandedRowContent 컴포넌트 / ExpandedRowContent component ────────────────

/**
 * 테이블 행을 펼쳤을 때 표시되는 상세 내용 컴포넌트.
 * Component displayed when a table row is expanded.
 */
function ExpandedRowContent({ row }: { row: ResultTableItem }) {
  const [hoveredVdSeries, setHoveredVdSeries] = useState<number | null>(null);
  const [hoveredWgIdx, setHoveredWgIdx] = useState<number | null>(null);

  const vdEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.seriesIndex !== undefined) setHoveredVdSeries(params.seriesIndex);
    },
    mouseout: () => setHoveredVdSeries(null),
    globalout: () => setHoveredVdSeries(null),
  }), []);

  const wgEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.dataIndex !== undefined) setHoveredWgIdx(params.dataIndex);
    },
    mouseout: () => setHoveredWgIdx(null),
    globalout: () => setHoveredWgIdx(null),
    updateaxispointer: (params: any) => {
      const axesInfo = params?.axesInfo;
      if (axesInfo && axesInfo.length > 0 && axesInfo[0].value !== undefined) {
        setHoveredWgIdx(axesInfo[0].value);
      }
    },
  }), []);

  const detailGroupLimit = getDisplayGroupCount(
    row.of_group,
    row.number_or_patient?.length ??
      row.within_group_variance_by_subgroup?.length ??
      0,
  );

  const sortedPatients = clampGroupArray(
    row.number_or_patient
      ? sortByClassification(
          [...row.number_or_patient],
          (p) =>
            row.within_group_variance_by_subgroup?.find(
              (v) => v.group === p.group,
            )?.classification || "",
        )
      : [],
    detailGroupLimit,
    0,
  );

  const lowGroupPatient = sortedPatients.find((p) => {
    const varianceData = row.within_group_variance_by_subgroup?.find(
      (v) => v.group === p.group,
    );
    return varianceData?.classification === "low";
  });
  const minPatients = lowGroupPatient?.number || 0;

  const totalVariance = row.variance_decomposition?.[0]?.variance || 0;
  const totalVR = row.variance_decomposition?.[0]?.vr || 0;

  const sortedVariance = clampGroupArray(
    row.within_group_variance_by_subgroup
      ? sortByClassification(
          [...row.within_group_variance_by_subgroup],
          (v) => v.classification,
        )
      : [],
    detailGroupLimit,
    0,
  );

  const variancePercent = (row.variance_benefit * 100).toFixed(1);
  const primaryGroup = sortedVariance.find((v) => v.classification === "low")
    ? "Low Risk"
    : sortedVariance.find((v) => v.classification === "high")
      ? "High Risk"
      : "patient group";

  const progressionGroupSet = row.disease_progression_by_subgroup
    ? new Set(row.disease_progression_by_subgroup.map((d) => d.group))
    : new Set<string>();
  const orderedProgressionGroups = sortedVariance
    .map((v) => v.group)
    .filter((g) => progressionGroupSet.has(g));
  const diseaseProgressionGroups = row.disease_progression_by_subgroup
    ? Array.from(
        new Set(row.disease_progression_by_subgroup.map((d) => d.group).sort()),
      )
    : [];
  const displayedProgressionGroups = clampGroupArray(
    orderedProgressionGroups.length > 0
      ? orderedProgressionGroups
      : diseaseProgressionGroups,
    row.of_group,
    row.disease_progression_by_subgroup?.length ??
      row.number_or_patient?.length ??
      row.within_group_variance_by_subgroup?.length ??
      0,
  );
  const displayedProgressionGroupSet = new Set(displayedProgressionGroups);

  const filteredProgressionData = (
    row.disease_progression_by_subgroup ?? []
  ).filter((d) => displayedProgressionGroupSet.has(d.group));

  return (
    <tr className="bg-[#efeff4]">
      <td colSpan={12} className="border-neutral-80 border-b p-0">
        <div className="bg-[#efeff4] px-4 py-6">
          <div className="flex gap-3 grid grid-cols-[1fr_2fr]">
            {/* Left Column */}
            <div className="flex flex-col gap-3">
              {/* Disease Progression by Subgroup */}
              <div className="flex flex-col flex-1 rounded-[18px] bg-white/60 p-2 gap-4">
                <h3 className="text-body4 flex-shrink-0 text-neutral-30 pl-1 pt-1">
                  Disease Progression by Subgroup
                </h3>
                <div
                  className="relative min-h-0 flex-1 overflow-hidden rounded-[8px] bg-white p-1 w-full pb-[40%] [@media(max-width:1470px)]:pb-[50%]"
                >
                  {filteredProgressionData.length > 0 ? (
                    <div className="absolute inset-0 p-1">
                      <ReactECharts
                        option={buildDiseaseProgressionChartOption(
                          filteredProgressionData,
                          displayedProgressionGroups,
                          row.within_group_variance_by_subgroup,
                          row.outcome,
                          typeof window !== "undefined" && window.innerWidth <= 1470,
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
              {/* Number of patients */}
              <div className="flex flex-1 flex-col rounded-[18px] bg-white/60 p-2 gap-1">
              <div className="pl-1 pt-1">
                <h3 className="text-body4 mb-1 flex-shrink-0 text-neutral-30 ">
                  Number of patients
                </h3>
                <p className="text-small1 mb-0 flex-shrink-0 text-[#605e5e]">
                  At least {minPatients} patients per group are recommended.
                </p></div>
                <div className="mt-auto">
                  <div className="w-full h-wrap space-y-0 overflow-auto rounded-[8px] bg-white p-3 ">
                    <div className="flex items-center gap-2 border-b border-[#adaaaa] pb-1 font-semibold text-[#231f52]">
                      <div className="flex-1">
                        <p className="text-body4 [@media(max-width:1470px)]:text-small1 font-semibold text-[#231F52]">Group</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-body4 text-primary-15 [@media(max-width:1470px)]:text-small1 ">
                          Number of patients
                        </p>
                      </div>
                    </div>
                    {sortedPatients.map((patient, idx) => {
                      const varianceData = row.within_group_variance_by_subgroup?.find(
                        (v) => v.group === patient.group,
                      );
                      const classification = varianceData?.classification || "";
                      const groupName = getGroupDisplayName(classification);
                      const groupColor = getGroupColor(classification);
                      return (
                        <div
                          key={patient.group}
                          className={`flex items-center gap-2 py-1 text-sm  ${
                            idx > 0 ? "border-t border-[#adaaaa]" : ""
                          }`}
                        >
                          <div className="flex flex-1 items-center gap-[6px]">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: groupColor }}
                            />
                            <div>
                              <p className="text-body5m  text-neutral-30 ">
                                {groupName}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-body5m  text-neutral-30">
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
            {/* Right Column */}
            <div className="bg-primary-15 flex flex-col min-w-0 gap-6 rounded-[18px] p-3">
              {/* Variance Reduction Explained */}
              <div className="flex flex-col gap-2">
                <h3 className="text-body3m text-white">
                  Variance Reduction Explained
                </h3>
                <p className="text-body5m leading-relaxed text-white">
                  Subgroup stratification reduced the overall variance by{" "}
                  {variancePercent}%. The observed variance reduction was primarily
                  driven by the {primaryGroup} patient group. Therefore, if cutoff
                  adjustment is required, maintaining the {primaryGroup} group and
                  adjusting the cutoff for the{" "}
                  {primaryGroup === "Low Risk" ? "High Risk" : "Low Risk"} group is a
                  reasonable strategy.
                </p>
              </div>
              {/* Two cards in one row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Variance decomposition */}
                <div className="flex min-w-0 flex-col justify-between rounded-[12px] bg-white p-3 gap-3">
                  <div className="flex justify-between gap-2 h-wrap">
                    <div className="flex-shrink-0 [@media(max-width:1480px)]:flex-[3_1_0]">
                      <h3 className="text-body3 text-neutral-20 [@media(max-width:1470px)]:text-body4 mb-2 tracking-[-0.75px]" style={{lineHeight: "100%"}}>
                        Variance decomposition
                      </h3>
                      <div className="mb-4 flex gap-5">
                        <div>
                          <div className="text-body5  [@media(max-width:1470px)]:text-small1 font-semibold text-secondary-60">
                            Variance
                          </div>
                          <div className="text-h4 [@media(max-width:1470px)]:text-body1 text-secondary-60">
                            {totalVariance.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-body5 [@media(max-width:1470px)]:text-small1 font-semibold text-secondary-60">
                            VR
                          </div>
                          <div className="text-h4 [@media(max-width:1470px)]:text-body1 text-secondary-60">
                            {totalVR.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0 [@media(max-width:1470px)]:gap-1 [@media(max-width:1480px)]:flex-[1_1_0]">
                      <div className="flex flex-col min-[1471px]:flex-row items-start min-[1471px]:items-center gap-0.5 min-[1471px]:gap-1 font-medium">
                        <div className="h-[10px] w-[32px] shrink-0 rounded-2xl bg-[#231F52]" />
                        <div className="min-w-0 min-[1471px]:whitespace-nowrap text-[10.5px] text-left">
                          <p>Within</p>
                          <p className="-mt-0.5 text-[#939090]" style={{ lineHeight: "110%" }}>pooled</p>
                        </div>
                      </div>
                      <div className="flex flex-col min-[1471px]:flex-row items-start min-[1471px]:items-center gap-0.5 min-[1471px]:gap-1 font-medium">
                        <div className="h-[10px] w-[32px] shrink-0 rounded-2xl bg-[#AAA5E1]" />
                        <div className="min-w-0 min-[1471px]:whitespace-nowrap text-[10.5px] text-left">
                          <p>Explained</p>
                          <p className="-mt-0.5 text-[#939090]" style={{ lineHeight: "110%" }}>Total Within</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white">
                    {row.variance_decomposition && row.variance_decomposition.length > 0 ? (
                      <>
                        <div className="relative w-full" style={{ paddingBottom: "60%" }}>
                          <div className="absolute inset-0">
                            <ReactECharts
                              option={buildVarianceDecompositionChartOption(
                                row.variance_decomposition,
                                hoveredVdSeries,
                              )}
                              style={{ height: "100%", width: "100%" }}
                              onEvents={vdEvents}
                            />
                          </div>
                        </div>
                        <p className="mt-1 text-[9px] leading-[1.3] text-neutral-50 break-all">{getCiText(row.variance_decomposition)}</p>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-body4m text-neutral-30">No data available</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Within-group variance by subgroup */}
                <div className="flex min-w-0 flex-col justify-between rounded-[12px] bg-white p-3 gap-4">
                  <div className="flex-shrink-0">
                    <h3 className="mb-2 text-body3 text-neutral-20 [@media(max-width:1470px)]:text-body4" style={{lineHeight: "100%"}}>
                      Within-group variance by subgroup
                    </h3>
                    <div className="mb-2 flex gap-5">
                      {sortedVariance.map((v) => {
                        const displayName =
                          v.classification === "high"
                            ? "High"
                            : v.classification === "middle"
                              ? "Middle"
                              : "Low";
                        return (
                          <div key={v.group}>
                            <div className="text-body5 [@media(max-width:1470px)]:text-small1 font-semibold text-secondary-60">
                              {displayName}
                            </div>
                            <div className="text-h4 [@media(max-width:1470px)]:text-body1 text-secondary-60">
                              {v.variance.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative bg-white" style={{ width: "100%", paddingBottom: "60%" }}>
                    {sortedVariance.length > 0 ? (
                      <div className="absolute inset-0">
                        <ReactECharts
                          option={buildWithinGroupVarianceChartOption(sortedVariance, typeof window !== "undefined" && window.innerWidth <= 1470, hoveredWgIdx)}
                          style={{ height: "100%", width: "100%" }}
                          onEvents={wgEvents}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-body4m text-neutral-30">No data available</span>
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


// ── 메인 페이지 컴포넌트 / Main page component ────────────────────────────────


/**
 * TSI Step 4 실제 페이지 컨텐츠 (useSearchParams 사용 → Suspense 래핑 필요).
 * Actual page content, requires Suspense wrapper due to useSearchParams.
 */
function TSISubgroupSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") ?? "";
  const [titleFontSize, setTitleFontSize] = useState(42);
  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const [selectedSetNo, setSelectedSetNo] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  // 왼쪽 그래프용: subgroup_sets_summary 데이터
  const [summaryData, setSummaryData] = useState<SubgroupSetSummary[]>([]);
  // 오른쪽 테이블용: result_table 데이터
  const [resultTableData, setResultTableData] = useState<ResultTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 포레스트 차트 툴팁 (마우스 추적)
  const [forestTooltip, setForestTooltip] = useState<{ setIndex: number; x: number; y: number } | null>(null);

  // 페이지 마운트 시 API 호출
  useEffect(() => {
    if (!taskId) {
      setSummaryData([]);
      setResultTableData([]);
      setSelectedSetNo("");
      setError(
        "taskId 쿼리 파라미터가 없습니다. 필수 정보가 확인되지 않아 요청을 진행할 수 없습니다. 이전 단계부터 다시 진행해 주세요.",
      );
      setIsLoading(false);
      return;
    }

    const fetchSubgroupSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getSubgroupSummaryList(taskId);

        // 왼쪽 그래프용: subgroup_sets_summary 저장
        setSummaryData(response.data.subgroup_sets_summary);

        // 오른쪽 테이블용: result_table 저장
        setResultTableData(response.data.result_table);

        // 초기 선택 없음 (체크박스 미선택 상태)
      } catch (err) {
        console.error("Subgroup Summary API 호출 실패, 목업 데이터 사용:", err);
        // API 실패 시 목업 데이터로 대체
        setSummaryData(MOCK_SUMMARY_DATA);
        setResultTableData(MOCK_RESULT_TABLE_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubgroupSummary();
  }, [taskId]);

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

    const selected = resultTableData.find(
      (item) => item.no === parseInt(selectedSetNo),
    );

    if (selected) {
      const query = new URLSearchParams({
        subgroupId: String(selected.subgroup_id),
        taskId,
      });
      router.push(`/tsi/subgroup-explain?${query.toString()}`);
    }
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
        {/* ── 1. 페이지 타이틀 / Page title ── */}
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

        {/* ── 2. 메인+버튼 묶음 컨테이너 / Main cards + button wrapper ── */}
        <div className="flex flex-col flex-1 min-h-0" style={{ gap: 0 }}>
          {/* ── 2-A. 상위 배경 카드 2개 나란히 / Two side-by-side background cards ── */}
          <div
            className="flex flex-row flex-nowrap items-stretch gap-0 flex-1 px-0.5 min-h-0"
            style={{ minWidth: 0 }}
          >
            {/* ── 2-A-L. 왼쪽 상위 배경 카드 (glass, 30%) / Left glass card ── */}
            <div
              className="flex min-h-0 flex-[30] min-w-0 flex-col overflow-hidden rounded-[36px] p-0"
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
              {/* ── 2-A-L-1. 남색 카드 (Subgroup Sets Summary) / Navy card ── */}
              <div
                className="bg-primary-15 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px]"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* ── 카드 헤더 / Card header ── */}
                <div className="mb-[48px] flex-shrink-0 px-4 pt-4 pb-3">
                  <h2 className="text-body1 text-white">
                    Subgroup Sets Summary
                  </h2>
                </div>
                {/* ── 흰 패널: Set 목록 + 에러바 차트 / White panel: set list + error-bar chart ── */}
                <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                  <div className="border-neutral-80 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border bg-white px-4 py-2">
                    {/* 하나의 div: Set별로 한 행(왼쪽+오른쪽), 구분선 일치 */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden ">
                      <div className="group/forest flex min-h-0 flex-col overflow-y-auto">
                        {isLoading ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-body3 text-white">
                              Loading...
                            </div>
                          </div>
                        ) : error ? (
                          <div className="flex flex-1 items-center justify-center">
                            <div className="flex flex-col items-center gap-1 text-center">
                              <div className="text-body4 text-red-500">
                                Error: {error.split(". ")[0]}.
                              </div>
                              {error.split(". ").slice(1).join(". ") && (
                                <div className="text-body5m text-neutral-400">
                                  {error.split(". ").slice(1).join(". ")}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : summaryData.length === 0 ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-body3 text-white">
                              No data available
                            </div>
                          </div>
                        ) : (
                          summaryData.map((set, index) => {
                            // result_table에서 해당 set_name과 일치하는 항목 찾아서 no 가져오기
                            const tableItem = resultTableData.find(
                              (t) => t.set_name === set.set_name,
                            );
                            const setNo = tableItem
                              ? String(tableItem.no).padStart(2, "0")
                              : String(index + 1).padStart(2, "0");
                            const summaryLimit = getDisplayGroupCount(
                              tableItem?.of_group,
                              set.groups.length,
                            );
                            const displayGroups = set.groups.slice(
                              0,
                              summaryLimit,
                            );

                            return (
                              <div
                                key={`${set.set_name}_${index}`}
                                className="group/row border-neutral-80 flex min-h-fit border-b last:border-b-0 transition-all duration-200 group-hover/forest:opacity-60 hover:!opacity-100 hover:bg-primary-98"
                              >
                                {/* 왼쪽 셀: Set 버튼 + Groups (한 행 = 하나의 div, 2개 cell 구조) */}
                                <div className="border-neutral-80 flex w-[112px] flex-shrink-0 flex-col border-r px-0 py-2 [@media(max-width:1470px)]:py-1 min-h-fit">
                                  {/* 초록 컨테이너: Set label 영역 (flex-1 = group rows와 동일 높이) */}
                                  <div className="flex flex-1 flex-shrink-0 items-center gap-2 px-1 min-h-[20px]">
                                    <span
                                      className="bg-primary-15 text-body5m box-border flex shrink-0 items-center justify-center gap-1 rounded-full text-white pt-1 pb-0.5 px-4"
                                      style={{
                                      }}
                                    >
                                      {set.set_name}
                                    </span>
                                    {tableItem?.variance_benefit_label && (
                                      <Image
                                        src="/assets/tsi/set-check.svg"
                                        alt=""
                                        width={18}
                                        height={20}
                                        className="flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                  {/* 노랑 컨테이너: Group rows 영역 (flex-1 = Set label과 동일 높이) */}
                                  <div className="flex flex-3 flex-col min-h-fit py-0.5">
                                    {displayGroups.map((g, groupIndex) => {
                                      // group1 -> Group 1 형식으로 변환
                                      const groupNum = g.group.replace(
                                        "group",
                                        "",
                                      );
                                      const groupName = `Group ${groupNum}`;
                                      return (
                                        <div
                                          key={`${set.set_name}-group-${groupIndex}`}
                                          className="text-body5m text-neutral-30 flex min-h-[20px] flex-1 items-center pt-1 pb-0.5 px-2"
                                        >
                                          {groupName}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* 오른쪽 셀: 왼쪽 기준 맞춤 */}
                                <div
                                  className="group/set relative flex min-w-0 flex-1 flex-col min-h-fit py-2 [@media(max-width:1470px)]:py-1 pr-4 pl-2"
                                  onMouseMove={(e) => setForestTooltip({ setIndex: index, x: e.clientX, y: e.clientY })}
                                  onMouseLeave={() => setForestTooltip(null)}
                                >
                                  {/* Set label 영역과 동일: flex-1 스페이서 */}
                                  <div
                                    className="flex-1 flex-shrink-0"
                                    aria-hidden
                                  />
                                  {/* 눈금선: 차트 행 영역에만 표시 (Set 행 spacer 아래부터) */}
                                  <div
                                    className="pointer-events-none absolute right-0 left-0 flex justify-between pr-4 pl-2"
                                    style={{ top: 34, bottom: 8 }}
                                    aria-hidden
                                  >
                                    {Array.from({ length: 9 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className="bg-neutral-90/20 group-hover/row:bg-neutral-90/40 h-full w-px flex-shrink-0 transition-colors duration-200"
                                      />
                                    ))}
                                  </div>
                                  {(() => {
                                    // 현재 Set의 개별 min/max 계산 (각 Set마다 독립적인 스케일)
                                    const setValues = displayGroups.flatMap(
                                      (g) => [g.ci_low, g.ci_high, g.mean],
                                    );
                                    const setMinValue = Math.min(...setValues);
                                    const setMaxValue = Math.max(...setValues);
                                    const setRange = setMaxValue - setMinValue;

                                    // 현재 Set의 개별 min/max 범위로 정규화하는 함수
                                    const normalize = (value: number) => {
                                      if (setRange === 0) return 50; // 범위가 0이면 중앙에 배치
                                      return (
                                        ((value - setMinValue) / setRange) * 100
                                      );
                                    };

                                    return displayGroups.map((g, i) => {
                                      const barColor =
                                        GROUP_BAR_COLORS[
                                          i % GROUP_BAR_COLORS.length
                                        ];

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
                                                height:
                                                  SUMMARY_ERROR_BAR_LINE_HEIGHT_PX,
                                              }}
                                            />
                                            {/* 심볼: mean 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${meanPct}%`,
                                                top: "50%",
                                                transform:
                                                  "translate(-50%, -50%)",
                                                backgroundColor: barColor,
                                                width:
                                                  SUMMARY_ERROR_BAR_DOT_SIZE_PX,
                                                height:
                                                  SUMMARY_ERROR_BAR_DOT_SIZE_PX,
                                              }}
                                            />
                                            {/* 왼쪽 꼬리: ci_low 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${ciLowPct}%`,
                                                top: "50%",
                                                transform:
                                                  "translate(-50%, -50%)",
                                                width:
                                                  SUMMARY_ERROR_BAR_CAP_WIDTH_PX,
                                                height:
                                                  SUMMARY_ERROR_BAR_CAP_HEIGHT_PX,
                                                backgroundColor: barColor,
                                              }}
                                            />
                                            {/* 오른쪽 꼬리: ci_high 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${ciHighPct}%`,
                                                top: "50%",
                                                transform:
                                                  "translate(-50%, -50%)",
                                                width:
                                                  SUMMARY_ERROR_BAR_CAP_WIDTH_PX,
                                                height:
                                                  SUMMARY_ERROR_BAR_CAP_HEIGHT_PX,
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
                      {/* 포레스트 차트 툴팁 (fixed, 마우스 추적) */}
                      {forestTooltip && (() => {
                        const ttSet = summaryData[forestTooltip.setIndex];
                        if (!ttSet) return null;
                        const ttLimit = getDisplayGroupCount(
                          resultTableData.find((r) => r.set_name === ttSet.set_name)?.of_group,
                          ttSet.groups.length,
                        );
                        const ttGroups = ttSet.groups.slice(0, ttLimit);
                        return (
                          <div
                            className="pointer-events-none fixed z-[9999] rounded-[6px] border border-neutral-80 bg-white px-2.5 py-1.5 shadow-[0px_2px_8px_rgba(0,0,0,0.12)]"
                            style={{ left: forestTooltip.x + 12, top: forestTooltip.y - 8, whiteSpace: "nowrap" }}
                          >
                            {ttGroups.map((g, gi) => {
                              const groupNum = g.group.replace("group", "");
                              return (
                                <div key={gi} className="flex items-start gap-[2px] py-0.5">
                                  <span
                                    className="inline-block h-2 w-2 shrink-0 rounded-full mt-[3px]"
                                    style={{ backgroundColor: GROUP_BAR_COLORS[gi % GROUP_BAR_COLORS.length] }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-small2 text-neutral-30">Group {groupNum}</span>
                                    <div className="flex items-baseline text-neutral-50">
                                      <span className="text-small2 flex-shrink-0">Mean</span><span className="text-body5m ml-auto pl-2">{g.mean.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-baseline text-neutral-50">
                                      <span className="text-small2 flex-shrink-0">CIWidth</span><span className="text-body5m ml-auto pl-2">[{g.ci_low.toFixed(2)}, {g.ci_high.toFixed(2)}]</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {/* X축 행: 왼쪽 빈 칸 + 오른쪽에만 Slow/Rapid (위쪽 선은 마지막 Set 행 border-b로만 표시) */}
                      <div
                        className={`flex flex-shrink-0 border-t border-neutral-80 ${error ? "invisible" : ""}`}
                      >
                        <div
                          className="border-neutral-80 w-[112px] flex-shrink-0"
                          aria-hidden
                        />
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
            {/* ── 2-A-R. 오른쪽 상위 배경 카드 (glass, 70%) / Right glass card ── */}
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
                {/* ── 2-A-R-1. 흰색 테이블 카드 / White table card ── */}
                <div
                  className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white pl-3 pr-1 py-2"
                >
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="min-h-0 w-full flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
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
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_NO_BORDER} text-center`}
                              >
                                <div
                                  className={TABLE_INNER_DIV_CENTER_NO_BORDER}
                                >
                                  Detail
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-center`}
                              >
                                <div className={TABLE_INNER_DIV_CENTER}>
                                  Select
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>No</div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Set Name
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Outcome
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Cutoff
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Month
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  #Of Groups
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Variance Benefit
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Group balance
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Refine
                                  <br />
                                  Cutoffs
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_LAST} text-right`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Delete
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  className="h-[200px] text-center"
                                >
                                  <div className="text-body3 text-neutral-50">
                                    Loading...
                                  </div>
                                </td>
                              </tr>
                            ) : error ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  className="h-[200px] text-center align-middle"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="text-body4 text-red-500">
                                      Error: {error.split(". ")[0]}.
                                    </div>
                                    {error.split(". ").slice(1).join(". ") && (
                                      <div className="text-body5m text-neutral-400">
                                        {error.split(". ").slice(1).join(". ")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ) : resultTableData.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  className="h-[200px] text-center"
                                >
                                  <div className="text-body3 text-neutral-50">
                                    No data available
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              resultTableData.map((row) => {
                                const rowNo = String(row.no).padStart(2, "0");
                                const isSelected = selectedSetNo === rowNo;
                                const isExpanded = expandedRows.has(rowNo);
                                return (
                                  <Fragment key={row.subgroup_id}>
                                    <tr
                                      className={`cursor-pointer ${isExpanded ? "bg-[#efeff4]" : ""}`}
                                      onClick={() => {
                                        toggleRowExpansion(rowNo);
                                      }}
                                    >
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_NO_BORDER} text-center align-middle`}
                                      >
                                        <div
                                          className={
                                            TABLE_INNER_DIV_CENTER_NO_BORDER
                                          }
                                        >
                                          <IconButton
                                            aria-label={
                                              isExpanded
                                                ? `Collapse set ${rowNo}`
                                                : `Expand set ${rowNo}`
                                            }
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleRowExpansion(rowNo);
                                            }}
                                            className="px-3 text-neutral-40 hover:text-neutral-30 active:text-neutral-20 inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent transition-colors duration-150"
                                            title={
                                              isExpanded ? "접기" : "펼치기"
                                            }
                                          >
                                            <svg
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                              className={`w-6 h-6 [@media(max-width:1470px)]:w-5 [@media(max-width:1470px)]:h-5 text-neutral-40 transition-transform duration-200 origin-center ${
                                                isExpanded ? "rotate-180" : ""
                                              }`}
                                            >
                                              <path
                                                d="M6 9L12 15L18 9"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
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
                                            onChange={() => {
                                              setSelectedSetNo(
                                                isSelected ? "" : rowNo,
                                              );
                                              if (!isSelected) {
                                                toggleRowExpansion(rowNo);
                                              }
                                            }}
                                            size={17}
                                          />
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {rowNo}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                            <span className="truncate">
                                              {row.set_name}
                                            </span>
                                            {row.variance_benefit_label && (
                                              <TooltipPrimitive.Provider delayDuration={0}>
                                                <TooltipPrimitive.Root defaultOpen>
                                                  <TooltipPrimitive.Trigger asChild>
                                                    <Image
                                                      src="/assets/tsi/set-check.svg"
                                                      alt=""
                                                      width={18}
                                                      height={18}
                                                      className="flex-shrink-0"
                                                    />
                                                  </TooltipPrimitive.Trigger>
                                                  <TooltipPrimitive.Portal>
                                                    <TooltipPrimitive.Content
                                                      side="top"
                                                      sideOffset={6}
                                                      className="z-50 rounded-[8px] bg-white/90 px-[6px] pt-[2px] pb-[6px] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.3)] backdrop-blur-[65px]"
                                                    >
                                                      <span className="text-body5m text-primary-15 tracking-[-0.36px]">
                                                        Recommend
                                                      </span>
                                                      <TooltipPrimitive.Arrow className="fill-white" width={14} height={7} />
                                                    </TooltipPrimitive.Content>
                                                  </TooltipPrimitive.Portal>
                                                </TooltipPrimitive.Root>
                                              </TooltipPrimitive.Provider>
                                            )}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.outcome}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.cut_off.join("  ")}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.month}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.of_group}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        style={{
                                          color: row.variance_benefit_label
                                            ? "#3A11D8"
                                            : "",
                                        }}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {(
                                              row.variance_benefit * 100
                                            ).toFixed(1)}
                                            %
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
                                            className="!w-7 !h-7 text-neutral-40 hover:text-primary-30 active:text-primary-100 shrink-0 cursor-pointer rounded border-0 bg-transparent transition-colors duration-150 hover:bg-primary-95 active:bg-tertiary-30"
                                            title="Refine Cutoffs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const query = new URLSearchParams(
                                                {
                                                  subgroupId: String(
                                                    row.subgroup_id,
                                                  ),
                                                  month: String(row.month),
                                                  setName: row.set_name,
                                                },
                                              );
                                              if (taskId) {
                                                query.set("taskId", taskId);
                                              }
                                              router.push(
                                                `/tsi/refine-cutoffs?${query.toString()}`,
                                              );
                                            }}
                                          >
                                            <svg
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="w-6 h-6 [@media(max-width:1470px)]:w-5 [@media(max-width:1470px)]:h-5"
                                            >
                                              <g
                                                style={{
                                                  mixBlendMode: "plus-darker",
                                                }}
                                              >
                                                <path
                                                  d="M3.57812 20.4219V15.6094L15.6094 3.57812L20.4219 8.39062L8.39062 20.4219H3.57812Z"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                                <path
                                                  d="M12.0156 7.1875L16.8281 12"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              </g>
                                            </svg>
                                          </IconButton>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_LAST} text-center`}
                                      >
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ── 2-B. 하단 버튼 영역 / Bottom button area ── */}
          <div className="flex flex-shrink-0 items-center justify-end pr-3 pb-6 gap-3 ">
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
              disabled={!selectedSetNo}
              onClick={handleSubgroupExplain}
              style={{
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 36,
                background: selectedSetNo ? "#F06600" : "#c6c5c9",
                border: "none",
                cursor: selectedSetNo ? "pointer" : "not-allowed",
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: 600,
                color: selectedSetNo ? "#ffffff" : "#e2e1e5",
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
                <path d="M4 3L13 8L4 13V3Z" fill={selectedSetNo ? "white" : "#e2e1e5"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Suspense 래퍼 / Suspense wrapper (required for useSearchParams)
 */
export default function TSISubgroupSelectionPage() {
  return (
    <Suspense fallback={null}>
      <TSISubgroupSelectionPageContent />
    </Suspense>
  );
}
