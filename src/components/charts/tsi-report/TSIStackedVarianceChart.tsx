"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceStackChartData } from "./types";

const AXIS_LINE_COLOR = "#6F6E76";

export function TSIStackedVarianceChart({
  data,
  yAxisLabel = "CIWidth",
}: {
  data: VarianceStackChartData;
  yAxisLabel?: string;
}) {
  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 54, right: 14, top: 14, bottom: 22 },
    xAxis: {
      type: "category",
      data: [""],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 5,
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
      axisTick: { show: true, length: 4, lineStyle: { color: AXIS_LINE_COLOR } },
      axisLabel: { show: true, color: "#4A4949", fontSize: 12 },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 36,
      nameRotate: 90,
      nameTextStyle: {
        color: "#1B1B1B",
        fontSize: 14,
      },
    },
    graphic: [
      {
        type: "text",
        left: "center",
        top: 10,
        style: {
          text: data.vrLabel,
          fill: "#1B1B1B",
          fontSize: 12,
          fontFamily: "inherit",
        },
      },
    ],
    series: [
      {
        name: "Within",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
        silent: true,
        data: [data.within],
        itemStyle: {
          color: data.withinColor,
          borderRadius: [0, 0, 12, 12],
        },
      },
      {
        name: "Explained",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
        silent: true,
        data: [data.explained],
        itemStyle: {
          color: data.explainedColor,
          borderRadius: [12, 12, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
}
