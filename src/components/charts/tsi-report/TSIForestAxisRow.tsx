"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export function TSIForestAxisRow({ metricLabel }: { metricLabel: string }) {
  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 0, right: 2, top: 0, bottom: 22 },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      splitLine: { show: false },
      axisLine: {
        show: true,
        lineStyle: { color: "#9A98A3", width: 1 },
      },
      axisTick: {
        show: true,
        length: 6,
        lineStyle: { color: "#9A98A3", width: 1 },
      },
      axisLabel: { show: false },
      name: metricLabel,
      nameLocation: "middle",
      nameGap: 12,
      nameTextStyle: {
        color: "#484646",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
      },
    },
    yAxis: {
      type: "category",
      data: [],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    series: [],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: 28 }}
    />
  );
}
