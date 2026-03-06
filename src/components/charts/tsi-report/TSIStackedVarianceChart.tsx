"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceStackChartData } from "./types";
import { useState, useEffect } from "react";

const NEUTRAL_50 = "#787776";

export function TSIStackedVarianceChart({
  data,
  yAxisLabel = "CIWidth",
}: {
  data: VarianceStackChartData;
  yAxisLabel?: string;
}) {
  const [nameFontSize, setNameFontSize] = useState(9);
  useEffect(() => {
    const update = () => setNameFontSize(window.innerWidth > 1470 ? 10.5 : 9);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const option: EChartsOption = {
    animation: true,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, padding: [4, 6], textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 } },
    legend: {
      show: true,
      bottom: 0,
      itemWidth: 48,
      itemHeight: 14,
      itemGap: 24,
      icon: "roundRect",
      textStyle: {
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
      },
    },
    grid: { left: 16, right: 6, top: 10, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: [""],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 5,
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
      axisTick: { show: true, length: 4, lineStyle: { color: NEUTRAL_50 } },
      axisLabel: {
        show: true,
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
        formatter: (value: number) => {
          if (value === 0) return `${value.toFixed(1)}\n`;
          if (Math.abs(value - data.max) < 0.001) return `\n${value.toFixed(1)}`;
          return value.toFixed(1);
        },
      },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 36,
      nameRotate: 90,
      nameTextStyle: {
        color: NEUTRAL_50,
        fontSize: nameFontSize,
        fontFamily: "Inter",
      },
    },
    series: [
      {
        name: "Within",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
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
        data: [data.explained],
        itemStyle: {
          color: data.explainedColor,
          borderRadius: [12, 12, 0, 0],
        },
        label: {
          show: true,
          position: "top",
          formatter: () => data.vrLabel,
          color: NEUTRAL_50,
          fontSize: 9,
          fontFamily: "Inter",
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "calc(100% + 8px)" }}
    />
  );
}
