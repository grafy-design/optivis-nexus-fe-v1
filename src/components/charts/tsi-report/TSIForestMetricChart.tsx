"use client";

import ReactECharts from "echarts-for-react";
import type { CustomSeriesRenderItem, EChartsOption } from "echarts";
import type { RiskMetricKey, RiskResponseRow } from "./types";

export function TSIForestMetricChart({
  rows,
  metricKey,
}: {
  rows: RiskResponseRow[];
  metricKey: RiskMetricKey;
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

    return {
      type: "group",
      children: [
        {
          type: "line",
          shape: { x1: left[0], y1: y, x2: right[0], y2: y },
          style: { stroke: interval.color, lineWidth: 3 },
        },
        {
          type: "line",
          shape: { x1: left[0], y1: y - 8, x2: left[0], y2: y + 8 },
          style: { stroke: interval.color, lineWidth: 3 },
        },
        {
          type: "line",
          shape: { x1: right[0], y1: y - 8, x2: right[0], y2: y + 8 },
          style: { stroke: interval.color, lineWidth: 3 },
        },
        {
          type: "circle",
          shape: { cx: center[0], cy: y, r: 6 },
          style: { fill: interval.dotColor ?? interval.color },
        },
      ],
    };
  };

  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      splitLine: { show: false },
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
        silent: true,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
