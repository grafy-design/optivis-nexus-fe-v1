"use client";

/** TSIForestMetricChart — 신뢰구간 포레스트 플롯으로 그룹별 위험 지표를 시각화 */

import ReactECharts from "echarts-for-react";
import type { CustomSeriesRenderItem, EChartsOption } from "echarts";
import type { RiskMetricKey, RiskResponseRow } from "./types";
import { useMemo } from "react";
import {
  hexToRgba,
  CHART_COLORS,
  tooltipItem,
  tooltipTitle,
  tooltipDotRow,
  gridFull,
  animationDefault,
  splitLineVisible,
} from "@/lib/chart-styles";

export function TSIForestMetricChart({
  rows,
  metricKey,
  metricLabel,
  hoveredIdx,
  dimAll,
  onHover,
}: {
  rows: RiskResponseRow[];
  metricKey: RiskMetricKey;
  metricLabel?: string;
  hoveredIdx?: number | null;
  dimAll?: boolean;
  onHover?: (idx: number | null) => void;
}) {
  const intervals = rows.map((row) => row.metrics[metricKey]);
  const data = intervals.map((interval, index) => [index, interval.low, interval.mean, interval.high]);

  const renderInterval: CustomSeriesRenderItem = (_params, api) => {
    const idx = Number(api.value(0));
    const interval = intervals[idx];
    if (!interval) return null;

    const left = api.coord([interval.low, idx]);
    const center = api.coord([interval.mean, idx]);
    const right = api.coord([interval.high, idx]);
    const y = center[1];

    const opacity = dimAll ? 0.6 : 1;

    const children: any[] = [
      {
        type: "line",
        shape: { x1: left[0], y1: y, x2: right[0], y2: y },
        style: { stroke: hexToRgba(interval.color, opacity), lineWidth: 3 },
      },
      {
        type: "line",
        shape: { x1: left[0], y1: y - 8, x2: left[0], y2: y + 8 },
        style: { stroke: hexToRgba(interval.color, opacity), lineWidth: 3 },
      },
      {
        type: "line",
        shape: { x1: right[0], y1: y - 8, x2: right[0], y2: y + 8 },
        style: { stroke: hexToRgba(interval.color, opacity), lineWidth: 3 },
      },
      {
        type: "circle",
        shape: { cx: center[0], cy: y, r: 6 },
        style: { fill: hexToRgba(interval.dotColor ?? interval.color, opacity) },
      },
    ];
    return { type: "group", children };
  };

  const option: EChartsOption = {
    ...animationDefault,
    tooltip: {
      ...tooltipItem,
      textStyle: { ...tooltipItem.textStyle, color: CHART_COLORS.NEUTRAL_50 },
      formatter: () => {
        const title = metricLabel ?? metricKey;
        let html = tooltipTitle(title);
        rows.forEach((row) => {
          const m = row.metrics[metricKey];
          html += tooltipDotRow(m.color, row.groupLabel, m.mean.toFixed(1));
        });
        return html;
      },
    },
    grid: gridFull,
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      splitLine: splitLineVisible(CHART_COLORS.SPLIT_LINE),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: "category",
      data: rows.map((_, index) => String(index)),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        type: "custom" as const,
        renderItem: renderInterval,
        data,
      },
    ],
  };

  const onEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.componentType === "series" && params.dataIndex !== undefined) {
        onHover?.(params.dataIndex);
      }
    },
    mouseout: () => onHover?.(null),
    globalout: () => onHover?.(null),
  }), [onHover]);

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "100%" }}
      onEvents={onEvents}
    />
  );
}
