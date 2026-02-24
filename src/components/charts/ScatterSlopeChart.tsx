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
};

export const ScatterSlopeChart = ({ data }: ScatterSlopeChartProps) => {
  const groups = Object.entries(data ?? {});
  const allPoints = groups.flatMap(([, group]) => group.points ?? []);

  const xValues = allPoints.map((point) => point.x);
  const xMin = xValues.length > 0 ? Math.min(...xValues) : 0;
  const xMax = xValues.length > 0 ? Math.max(...xValues) : 1;
  const palette = ["rgba(90, 83, 160, 0.75)", "rgba(166, 160, 220, 0.75)"];
  const series: any[] = [];

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
        lineStyle: { color: "#666", width: 1.2 },
        tooltip: { show: false },
      });
    }
  });

  const option: EChartsOption = {
    animation: false,
    grid: { left: 50, right: 14, top: 24, bottom: 32 },
    tooltip: {
      trigger: "item",
      formatter: (p: any) => `Slope: ${p.value[0]}<br/>C Vision: ${p.value[1]}`,
    },
    xAxis: {
      type: "value",
      name: "ADAS Progression Slope",
      nameLocation: "middle",
      nameGap: 24,
      axisLine: { lineStyle: { color: "#666" } },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: "C Vision",
      nameLocation: "middle",
      nameGap: 34,
      axisLine: { lineStyle: { color: "#666" } },
      splitLine: { show: false },
    },
    series,
  };

  return <ReactECharts option={option} style={{ width: "100%", height: 260 }} />;
};
