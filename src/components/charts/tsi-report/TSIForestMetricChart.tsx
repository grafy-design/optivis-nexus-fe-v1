"use client";

import ReactECharts from "echarts-for-react";
import type { CustomSeriesRenderItem, EChartsOption } from "echarts";
import type { RiskMetricKey, RiskResponseRow } from "./types";
import { useMemo } from "react";

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
    animation: true,
    animationDuration: 300,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "item",
      padding: [4, 6],
      borderWidth: 0,
      borderColor: "transparent",
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
      textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600, color: "#787776" },
      formatter: () => {
        const title = metricLabel ?? metricKey;
        let html = `<div style="font-size:12px;font-family:Inter;color:#787776;font-weight:600;margin-bottom:4px">${title}</div>`;
        rows.forEach((row) => {
          const m = row.metrics[metricKey];
          html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 0"><span style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${m.color};flex-shrink:0"></span><span style="color:#787776;font-size:9px">${row.groupLabel}</span></span><span style="color:#787776;font-size:13px;font-weight:600">${m.mean.toFixed(1)} [${m.low.toFixed(1)}, ${m.high.toFixed(1)}]</span></div>`;
        });
        return html;
      },
    },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      splitLine: { show: true, lineStyle: { color: "#e3e1e5", width: 1 } },
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
