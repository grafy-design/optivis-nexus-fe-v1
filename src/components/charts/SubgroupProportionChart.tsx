"use client";

import React, { useCallback, useRef, useState } from "react";
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
  const chartRef = useRef<any>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredSeriesIdx, setHoveredSeriesIdx] = useState<number | null>(null);

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
  const emphasisPalette = [
    "#a18af4",
    "#7654f0",
    "#3609a1",
    "#231368",
  ];

  const onEvents = {
    mouseover: useCallback((params: any) => {
      if (params.dataIndex !== undefined && params.componentType === "series") {
        setHoveredIdx(params.dataIndex);
        setHoveredSeriesIdx(params.seriesIndex ?? null);
      }
    }, []),
    globalout: useCallback(() => {
      setHoveredIdx(null);
      setHoveredSeriesIdx(null);
    }, []),
  };

  const option: EChartsOption = {
    animation: false,
    grid: { left: 42, right: 0, top: 8, bottom: 16 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow", triggerEmphasis: false, z: -1 },
      padding: [4, 6],
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const row = (marker: string, label: string, val: string) =>
          `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-size:9px;font-weight:500">${marker}${label}</span><span style="font-size:13px;font-weight:600">${val}</span></div>`;
        const title = items[0]?.axisValueLabel ?? "";
        return `<div style="font-family:Inter,sans-serif">${title ? `<div style="font-size:9px;font-weight:500;margin-bottom:4px">${title}</div>` : ""}${items.map((item: any) => row(item.marker ?? "", item.seriesName ?? "", `${(Number(item.value) * 100).toFixed(1)}%`)).join("")}</div>`;
      },
      borderWidth: 0,
      borderColor: "transparent",
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
      textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 },
    },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLine: { show: true, lineStyle: { color: "#787776" } },
      axisTick: { show: false },
      nameGap: 12,
      nameTextStyle: {
        color: "#787776",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
      },
      axisLabel: {
          margin:4,
          color: "#787776",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          rich: {
            lEdge: { width: 20, align: "right" as const, fontSize: 10, fontWeight: 500, fontFamily: "Inter, sans-serif", color: "#787776" },
            rEdge: { width: 20, align: "left" as const, fontSize: 10, fontWeight: 500, fontFamily: "Inter, sans-serif", color: "#787776" },
          },
          formatter: (value: string, index: number) => {
            if (index === 0) return `{lEdge|${value}}`;
            if (index === xLabels.length - 1) return `{rEdge|${value}}`;
            return String(value);
          },
        },

    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      interval: 0.2,
      name: "Proportion",
      nameLocation: "middle",
      nameGap: 32,
      axisLine: { show: true, lineStyle: { color: "#787776" } },
      axisTick: { show: true, lineStyle: { color: "#787776" }  },
      splitLine: { show: false },
      nameTextStyle: {color: "#787776",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",},
      axisLabel: {
          margin: 8,
          color: "#787776",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          formatter: (value: number) => {
            const label = value.toFixed(1);
            if (value === 1) return `\n${label}`;
            if (value === 0) return `${label}\n`;
            return label;
          },
        }
    },
    series: seriesByGroup.map((group, index) => ({
      name: group.groupKey,
      type: "bar" as const,
      stack: "total",
      barWidth: "88%",
      itemStyle: { color: palette[index % palette.length], borderRadius: [6, 6, 6, 6] },
      emphasis: { disabled: true },
      data: group.values.map((v, di) => {
        if (hoveredIdx === null) return v;
        if (di !== hoveredIdx) return { value: v, itemStyle: { opacity: 0.6 } };
        if (hoveredSeriesIdx === index) {
          return { value: v, itemStyle: { color: emphasisPalette[index % emphasisPalette.length] } };
        }
        return v;
      }),
    })),
  };

  return <ReactECharts ref={chartRef} option={option} onEvents={onEvents} style={{ width: "100%", height }} />;
};
