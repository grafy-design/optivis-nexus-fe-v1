"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceBarsChartData } from "./types";
import { useState, useEffect } from "react";

const NEUTRAL_50 = "#787776";

export function TSIVarianceByGroupBarChart({ data, yAxisLabel = "CIWidth" }: { data: VarianceBarsChartData; yAxisLabel?: string }) {
  const [nameFontSize, setNameFontSize] = useState(9);
  const [labelFontSize, setLabelFontSize] = useState(9);
  useEffect(() => {
    const update = () => {
      const wide = window.innerWidth > 1470;
      setNameFontSize(wide ? 10.5 : 9);
      setLabelFontSize(wide ? 12 : 9);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const option: EChartsOption = {
    animation: true,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, padding: [4, 6], textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 } },
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
        fontSize: nameFontSize,
        fontFamily: "Inter",
      },
    },
    series: [
      {
        type: "bar",
        barWidth: "60%",
        barCategoryGap: "10%",
        data: (() => {
          const maxValue = Math.max(...data.bars.map((b) => b.value));
          return data.bars.map((bar) => ({
            value: bar.value,
            itemStyle: {
              color: bar.color,
              borderRadius: [8, 8, 8, 8],
              borderColor: bar.highlight ? "#8A47FF" : "transparent",
              borderWidth: bar.highlight ? 3 : 0,
            },
            label: {
              show: true,
              position: "top" as const,
              distance: 2,
              formatter: bar.weightLabel,
              color: Math.abs(bar.value - maxValue) < 0.001 ? bar.color : NEUTRAL_50,
              fontSize: labelFontSize,
              fontFamily: "Inter",
              fontWeight: 600,
            },
          }));
        })(),
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "#2C295A",
            width: 1,
            type: [4, 3],
          },
          label: {
            show: true,
            position: "insideEndTop",
            offset: [6, 0],
            formatter: `Total Var = ${data.threshold.toFixed(2)}`,
            color: NEUTRAL_50,
            fontSize: 9,
            fontFamily: "Inter",
          },
          data: [{ yAxis: data.threshold }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
}
