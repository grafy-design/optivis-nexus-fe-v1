"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export type HistogramGroupMap = Record<string, number[]>;

export type HistogramData = {
  bins: number[];
  groups: HistogramGroupMap;
};

type BaselineDistributionHistogramProps = {
  histogramData: HistogramData;
  normalize?: boolean;
  height?: number | string;
};

export const BaselineDistributionHistogram = ({
  histogramData,
  normalize = false,
  height = 120,
}: BaselineDistributionHistogramProps) => {
  const getNiceInterval = (maxValue: number): number => {
    if (maxValue <= 0) {
      return 1;
    }
    const rough = maxValue / 5;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const scaled = rough / power;

    if (scaled <= 1) return 1 * power;
    if (scaled <= 2) return 2 * power;
    if (scaled <= 5) return 5 * power;
    return 10 * power;
  };

  const option = useMemo<EChartsOption>(() => {
    const bins = histogramData?.bins ?? [];
    const groups = histogramData?.groups ?? {};
    const bucketCount = Math.max(0, bins.length - 1);

    const xLabels = Array.from({ length: bucketCount }, (_, i) => {
      const left = Number(bins[i] ?? 0);
      const right = Number(bins[i + 1] ?? left);
      const center = (left + right) / 2;
      return Number(center.toFixed(1));
    });

    const normalizedGroups = Object.entries(groups).map(([name, raw]) => {
      const padded = Array.from({ length: bucketCount }, (_, i) => Number(raw?.[i] ?? 0));
      if (!normalize) {
        return { name, values: padded };
      }

      const total = Math.max(
        padded.reduce((acc, value) => acc + value, 0),
        1
      );
      return {
        name,
        values: padded.map((value) => value / total),
      };
    });

    const maxSeriesValue = Math.max(0, ...normalizedGroups.flatMap((group) => group.values));
    const yAxisMaxRaw = normalize
      ? Math.max(1.5, maxSeriesValue * 1.15)
      : Math.max(5, maxSeriesValue * 1.15);
    const yAxisInterval = getNiceInterval(yAxisMaxRaw);
    const yAxisMax = Math.ceil(yAxisMaxRaw / yAxisInterval) * yAxisInterval;
    const palette = [
      "rgba(196, 190, 235, 0.78)",
      "rgba(127, 119, 190, 0.82)",
      "rgba(27, 22, 84, 0.94)",
    ];

    return {
      animation: false,
      grid: { left: 48, right:4, top: 8, bottom:16  },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLine: { show: true, lineStyle: { color: "#484646" } },
        axisTick: { show: false },
        axisLabel: {
          interval: 0,
          margin:4,
          color: "#484646",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          formatter: (value: string) => {
            const num = Number(value);
            const rounded = Math.round(num);
            if (Number.isNaN(num) || rounded % 2 !== 0) {
              return "";
            }
            return String(rounded);
          },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: yAxisMax,
        interval: yAxisInterval,
        name: "CI Width",
        nameLocation: "middle",
        nameGap: 36,
        color: "#484646",
        nameTextStyle: { color: "#484646", fontSize: 9 },
      axisLine: { show: true, lineStyle: { color: "#484646" } },
      axisTick: { show: true, lineStyle: { color: "#484646" } },
        axisLabel: {
          margin:8,
          color: "#484646",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          formatter: (value: number) =>
            normalize ? value.toFixed(2) : Math.round(value).toString(),
        },
        splitLine: { show: false },
      },
      series: [
        ...normalizedGroups.map((group, index) => ({
          name: group.name,
          type: "bar" as const,
          data: group.values,
          barWidth: "62%",
          barGap: "-100%",
          itemStyle: {
            color: palette[index % palette.length],
            borderRadius: [3, 3, 0, 0] as [number, number, number, number],
          },
        })),
      ],
    };
  }, [histogramData, normalize]);

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
