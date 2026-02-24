"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type Props = {
  valuesA: number[]; // 예: 전체
  valuesB: number[]; // 예: subgroup-1
  valuesC: number[]; // 예: subgroup-2
  min?: number;
  max?: number;
  binCount?: number;
};

function toHistogram(values: number[], min: number, max: number, binCount: number) {
  const binSize = (max - min) / binCount;
  const bins = Array(binCount).fill(0);

  values.forEach((v) => {
    if (v < min || v > max) return;
    const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
    bins[idx] += 1;
  });

  // 비율(밀도처럼)로 정규화
  const total = Math.max(values.length, 1);
  return bins.map((c) => c / total);
}

export default function BaselineDistributionHistogram({
  valuesA,
  valuesB,
  valuesC,
  min = 0,
  max = 10,
  binCount = 10,
}: Props) {
  const option = useMemo<EChartsOption>(() => {
    const xLabels = Array.from({ length: binCount }, (_, i) => `${i + 1}`);
    const a = toHistogram(valuesA, min, max, binCount);
    const b = toHistogram(valuesB, min, max, binCount);
    const c = toHistogram(valuesC, min, max, binCount);

    return {
      grid: { left: 56, right: 16, top: 20, bottom: 36 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { lineStyle: { color: "#666" } },
      },
      yAxis: {
        type: "value",
        name: "CI Width",
        axisLine: { lineStyle: { color: "#666" } },
        splitLine: { show: false },
      },
      series: [
        {
          name: "All",
          type: "bar",
          data: a,
          barWidth: "38%",
          barGap: "-100%", // 같은 bin에 겹치기
          itemStyle: { color: "rgba(190,185,235,0.85)", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Group A",
          type: "bar",
          data: b,
          barWidth: "38%",
          barGap: "-100%",
          itemStyle: { color: "rgba(120,112,190,0.85)", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Group B",
          type: "bar",
          data: c,
          barWidth: "38%",
          barGap: "-100%",
          itemStyle: { color: "rgba(28,24,85,0.9)", borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [valuesA, valuesB, valuesC, min, max, binCount]);

  return <ReactECharts option={option} style={{ width: "100%", height: 260 }} />;
}
