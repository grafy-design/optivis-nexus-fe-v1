"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceBarsChartData } from "./types";

const NEUTRAL_50 = "#787776";

export function TSIVarianceByGroupBarChart({ data, yAxisLabel = "CIWidth" }: { data: VarianceBarsChartData; yAxisLabel?: string }) {
  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 18, right: 6, top: 4, bottom: 0, containLabel: true },
    xAxis: {
      type: "category",
      data: data.bars.map((bar) => bar.label),
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
        margin: 8,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 10,
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
      axisTick: { show: true, length: 4, lineStyle: { color: NEUTRAL_50 } },
      axisLabel: {
        show: true,
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
        formatter: (value: number) => {
          // 하단 edge(0): 위로 이동
          if (value === 0) return `${value}\n`;
          // 상단 edge(max): 아래로 이동
          if (Math.abs(value - data.max) < 0.001) return `\n${value}`;
          return value.toString();
        },
      },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      nameRotate: 90,
      nameTextStyle: {
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
      },
    },
    series: [
      {
        type: "bar",
        barWidth: 72,
        data: data.bars.map((bar) => ({
          value: bar.value,
          itemStyle: {
            color: bar.color,
            borderRadius: [8, 8, 8, 8],
            borderColor: bar.highlight ? "#8A47FF" : "transparent",
            borderWidth: bar.highlight ? 3 : 0,
          },
          label: {
            show: true,
            position: "insideBottom",
            distance: 8,
            formatter: bar.weightLabel,
            color: "#FFFFFF",
            fontSize: 9,
            fontFamily: "Inter",
            fontWeight: 600,
          },
        })),
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "#2C295A",
            width: 1,
            type: [4, 3],
          },
          label: { show: false },
          data: [{ yAxis: data.threshold }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
}
