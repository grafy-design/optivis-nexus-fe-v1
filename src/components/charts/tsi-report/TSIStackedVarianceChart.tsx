"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceStackChartData } from "./types";

const NEUTRAL_30 = "#484646";

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
    legend: {
      show: true,
      bottom: 0,
      itemWidth: 48,
      itemHeight: 14,
      itemGap: 24,
      icon: "roundRect",
      textStyle: {
        color: NEUTRAL_30,
        fontSize: 9,
        fontFamily: "Inter",
      },
    },
    grid: { left: 16, right: 6, top: 18, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: [""],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: true, lineStyle: { color: NEUTRAL_30, width: 1 } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 5,
      axisLine: { show: true, lineStyle: { color: NEUTRAL_30, width: 1 } },
      axisTick: { show: true, length: 4, lineStyle: { color: NEUTRAL_30 } },
      axisLabel: { show: true, color: NEUTRAL_30, fontSize: 9, fontFamily: "Inter" },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 28,
      nameRotate: 90,
      nameTextStyle: {
        color: NEUTRAL_30,
        fontSize: 9,
        fontFamily: "Inter",
      },
    },
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
        label: {
          show: true,
          position: "top",
          formatter: () => data.vrLabel,
          color: NEUTRAL_30,
          fontSize: 9,
          fontFamily: "Inter",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "calc(100% + 8px)" }} />;
}
