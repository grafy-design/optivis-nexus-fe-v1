"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { TopLevelFormatterParams } from "echarts/types/dist/shared";

type ScatterPoint = { x: number; y: number };
type Regression = { slope: number; intercept: number };
type ScatterGroup = {
  points: ScatterPoint[];
  regression?: Regression;
};

type ScatterSlopeChartProps = {
  data: Record<string, ScatterGroup>;
  height?: number | string;
  showTooltip?: boolean;
};

type ScatterSeries = Record<string, unknown>;

export const ScatterSlopeChart = ({
  data,
  height = 120,
  showTooltip = true,
}: ScatterSlopeChartProps) => {
  const groups = Object.entries(data ?? {});
  const allPoints = groups.flatMap(([, group]) => group.points ?? []);

  const xValues = allPoints.map((point) => point.x);
  const xMin = xValues.length > 0 ? Math.min(...xValues) : 0;
  const xMax = xValues.length > 0 ? Math.max(...xValues) : 1;
  const palette = ["rgba(90, 83, 160, 0.75)", "rgba(166, 160, 220, 0.75)"];
  const series: ScatterSeries[] = [];

  groups.forEach(([groupName, group], index) => {
    series.push({
      name: groupName,
      type: "scatter",
      symbolSize: 8,
      data: (group.points ?? []).map((point) => [point.x, point.y]),
      itemStyle: { color: palette[index % palette.length] },
    });

    const regression = group.regression;
    if (regression && Number.isFinite(regression.slope) && Number.isFinite(regression.intercept)) {
      series.push({
        name: `${groupName} regression`,
        type: "line",
        data: [
          [xMin, regression.slope * xMin + regression.intercept],
          [xMax, regression.slope * xMax + regression.intercept],
        ],
        showSymbol: false,
        lineStyle: { color: palette[index % palette.length], width: 1.2 },
        tooltip: { show: false },
      });
    }
  });

  const option: EChartsOption = {
    animation: false,
    grid: { left: 42, right: 4, top: 8, bottom: 16 },
    tooltip: showTooltip
      ? {
          trigger: "item",
          formatter: (params: TopLevelFormatterParams) => {
            const item = Array.isArray(params) ? params[0] : params;
            const value = Array.isArray(item?.value) ? item.value : [];
            return `Slope: ${value[0] ?? ""}<br/>C Vision: ${value[1] ?? ""}`;
          },
        }
      : { show: false, trigger: "none" },
    xAxis: {
      type: "value",
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
    series: series as EChartsOption["series"],
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
