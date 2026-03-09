"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type ScatterPoint = { x: number; y: number };
type Regression = { slope: number; intercept: number };
type ScatterGroup = {
  points: ScatterPoint[];
  regression?: Regression;
};

type ScatterSlopeChartProps = {
  data: Record<string, ScatterGroup>;
  height?: number | string;
};

export const ScatterSlopeChart = ({ data, height = 120 }: ScatterSlopeChartProps) => {
  const groups = Object.entries(data ?? {});
  const allPoints = groups.flatMap(([, group]) => group.points ?? []);

  const xValues = allPoints.map((point) => point.x);
  const yValues = allPoints.map((point) => point.y);
  const xMinRaw = xValues.length > 0 ? Math.min(...xValues) : 0;
  const xMaxRaw = xValues.length > 0 ? Math.max(...xValues) : 1;
  const yMinRaw = yValues.length > 0 ? Math.min(...yValues) : 0;
  const yMaxRaw = yValues.length > 0 ? Math.max(...yValues) : 1;

  const getNiceInterval = (range: number): number => {
    if (range <= 0) return 1;
    const rough = range / 5;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const scaled = rough / power;
    if (scaled <= 1) return 1 * power;
    if (scaled <= 2) return 2 * power;
    if (scaled <= 5) return 5 * power;
    return 10 * power;
  };

  const xInterval = getNiceInterval(xMaxRaw - xMinRaw);
  const xDecimals = Math.max(0, -Math.floor(Math.log10(xInterval)));
  const xMin = Number((Math.floor(xMinRaw / xInterval) * xInterval).toFixed(xDecimals));
  const xMax = Number((Math.ceil(xMaxRaw / xInterval) * xInterval).toFixed(xDecimals));

  const yInterval = getNiceInterval(yMaxRaw - yMinRaw);
  const yDecimals = Math.max(0, -Math.floor(Math.log10(yInterval)));
  const yMin = Number((Math.floor(yMinRaw / yInterval) * yInterval).toFixed(yDecimals));
  const yMax = Number((Math.ceil(yMaxRaw / yInterval) * yInterval).toFixed(yDecimals));

  const palette = ["rgba(90, 83, 160, 0.6)", "rgba(166, 160, 220, 0.6)"];
  const emphasisPalette = ["rgba(90, 83, 160, 1)", "rgba(166, 160, 220, 1)"];
  const series: any[] = [];

  groups.forEach(([groupName, group], index) => {
    const color = palette[index % palette.length];
    const emphasisColor = emphasisPalette[index % emphasisPalette.length];

    series.push({
      name: groupName,
      type: "scatter",
      symbolSize: 8,
      data: (group.points ?? []).map((point) => [point.x, point.y]),
      itemStyle: { color },
      emphasis: {
        focus: "series",
        itemStyle: { color: emphasisColor, opacity: 1 },
        scale: 1.4,
      },
      blur: {
        itemStyle: { opacity: 0.08 },
      },
    });

    const regression = group.regression;
    if (regression && Number.isFinite(regression.slope) && Number.isFinite(regression.intercept)) {
      series.push({
        name: groupName,
        type: "line",
        data: [
          [xMinRaw, regression.slope * xMinRaw + regression.intercept],
          [xMaxRaw, regression.slope * xMaxRaw + regression.intercept],
        ],
        showSymbol: false,
        lineStyle: { color, width: 1.2 },
        tooltip: { show: false },
        triggerLineEvent: true,
        emphasis: {
          focus: "series",
          lineStyle: { color: emphasisColor, width: 2.5, opacity: 1 },
        },
        blur: {
          lineStyle: { opacity: 0.08 },
        },
      });
    }
  });

  const option: EChartsOption = {
    animation: true,
    animationDuration: 300,
    animationEasing: "cubicOut",
    grid: { left: 42, right: 8, top: 8, bottom: 16 },
    tooltip: {
      trigger: "item",
      padding: [4, 6],
      borderWidth: 0,
      borderColor: "transparent",
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
      textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 },
      formatter: (p: any) => {
        const row = (label: string, val: string) =>
          `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-size:9px;font-weight:500">${label}</span><span style="font-size:13px;font-weight:600">${val}</span></div>`;
        return `<div style="font-family:Inter,sans-serif">${p.marker ?? ""}${row("Slope", Number(p.value[0]).toFixed(1))}${row("C Vision", Number(p.value[1]).toFixed(1))}</div>`;
      },
    },
    xAxis: {
      type: "value",
      min: xMin,
      max: xMax,
      interval: xInterval,
      axisLine: { show: true, onZero: false, lineStyle: { color: "#787776" } },
      axisTick: { show: false },
      splitLine: { show: false },
      nameTextStyle: {
        color: "#787776",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
      },
      axisLabel: {
        margin: 4,
        color: "#787776",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
      },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      interval: yInterval,
      name: "Proportion",
      nameLocation: "middle",
      axisLine: { show: true, lineStyle: { color: "#787776" } },
      axisTick: { show: true, lineStyle: { color: "#787776" } },
      nameTextStyle: {
        color: "#787776",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
      },
      nameGap: 32,
      axisLabel: {
        margin: 8,
        color: "#787776",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
      },
      splitLine: { show: false },
    },
    series,
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
