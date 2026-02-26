"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceBarsChartData } from "./types";

const AXIS_LINE_COLOR = "#6F6E76";

export function TSIVarianceByGroupBarChart({ data }: { data: VarianceBarsChartData }) {
  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 44, right: 12, top: 14, bottom: 34 },
    xAxis: {
      type: "category",
      data: data.bars.map((bar) => bar.label),
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: "#1B1B1B",
        fontSize: 13,
        margin: 10,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 10,
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
      axisTick: { show: true, length: 4, lineStyle: { color: AXIS_LINE_COLOR } },
      axisLabel: { show: true, color: "#4A4949", fontSize: 12 },
      splitLine: { show: false },
    },
    series: [
      {
        type: "bar",
        barWidth: 72,
        data: data.bars.map((bar) => ({
          value: bar.value,
          itemStyle: {
            color: bar.color,
            borderRadius: [10, 10, 10, 10],
            borderColor: bar.highlight ? "#8A47FF" : "transparent",
            borderWidth: bar.highlight ? 3 : 0,
          },
          label: {
            show: true,
            position: "insideBottom",
            distance: 10,
            formatter: bar.weightLabel,
            color: "#FFFFFF",
            fontSize: 13,
          },
        })),
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "#2C295A",
            width: 1.5,
            type: "dashed",
          },
          label: { show: false },
          data: [{ yAxis: data.threshold }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
}
