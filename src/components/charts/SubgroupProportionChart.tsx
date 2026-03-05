"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type BinRatioItem = {
  range: number[];
  [groupKey: string]: number[] | number | undefined;
};

type SubgroupProportionChartProps = {
  data: BinRatioItem[];
  height?: number | string;
};

export const SubgroupProportionChart = ({ data, height = 120 }: SubgroupProportionChartProps) => {
  const xLabels = data.map((item) => {
    const left = Number(item.range?.[0] ?? 0);
    const right = Number(item.range?.[1] ?? left);
    return Number(((left + right) / 2).toFixed(1));
  });

  const groupKeys = Array.from(
    new Set(
      data.flatMap((item) =>
        Object.keys(item).filter((key) => key !== "range" && typeof item[key] === "number")
      )
    )
  );
  const rawSeriesByGroup = groupKeys.map((groupKey) => ({
    groupKey,
    values: data.map((item) => Number(item[groupKey] ?? 0)),
  }));
  const usesPercentScale = rawSeriesByGroup.some((group) =>
    group.values.some((value) => value > 1)
  );
  const seriesByGroup = rawSeriesByGroup.map((group) => ({
    groupKey: group.groupKey,
    values: group.values.map((value) => {
      const normalized = usesPercentScale ? value / 100 : value;
      return Math.max(0, Math.min(1, Number(normalized.toFixed(4))));
    }),
  }));
  const palette = [
    "rgba(176,170,220,0.9)",
    "rgba(124,116,180,0.9)",
    "rgba(58,52,110,0.95)",
    "rgba(40,37,86,0.95)",
  ];

  const option: EChartsOption = {
    animation: false,
    grid: { left: 48, right: 0, top: 8, bottom: 16 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) => `${(Number(value) * 100).toFixed(1)}%`,
    },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLine: { show: true, lineStyle: { color: "#484646" } },
      axisTick: { show: false },
      nameGap: 12,
      nameTextStyle: {
        color: "#484646",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
      },
      axisLabel: {
          margin:4,
          color: "#484646",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif"
        },
      
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      interval: 0.2,
      name: "Proportion",
      nameLocation: "middle",
      nameGap: 36,
      axisLine: { show: true, lineStyle: { color: "#484646" } },
      axisTick: { show: true, lineStyle: { color: "#484646" }  },
      splitLine: { show: false },
      nameTextStyle: {color: "#484646",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",},
      axisLabel: {
          margin: 8,
          color: "#484646",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif"}
    },
    series: seriesByGroup.map((group, index) => ({
      name: group.groupKey,
      type: "bar" as const,
      stack: "total",
      data: group.values,
      barWidth: "88%",
      itemStyle: { color: palette[index % palette.length], borderRadius: [6, 6, 6, 6] },
       
    })),
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
