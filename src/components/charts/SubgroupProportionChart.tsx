"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  SUBGROUP_PALETTE,
  tooltipAxisShadow,
  tooltipRow,
  tooltipWrap,
  tooltipSubTitle,
  axisLabelBase,
  axisNameBase,
  axisLineBase,
  axisTickVisible,
  splitLineHidden,
  animationNone,
  barEmphasisDisabled,
  BAR_RADIUS,
  edgeLabelFormatter,
  xAxisEdgeLabelRich,
} from "@/lib/chart-styles";

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

  const { rich, edgeFormatter } = xAxisEdgeLabelRich();

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
    ...animationNone,
    grid: { left: 42, right: 0, top: 8, bottom: 16 },
    tooltip: {
      ...tooltipAxisShadow,
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const title = items[0]?.axisValueLabel ?? "";
        return tooltipWrap(
          (title ? tooltipSubTitle(title) : "") +
          items.map((item: any) => tooltipRow(item.marker ?? "", item.seriesName ?? "", `${(Number(item.value) * 100).toFixed(1)}%`)).join("")
        );
      },
    },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLine: axisLineBase,
      axisTick: { show: false },
      nameGap: 12,
      nameTextStyle: axisNameBase,
      axisLabel: {
        ...axisLabelBase,
        margin: 4,
        rich,
        formatter: (value: string, index: number) => edgeFormatter(value, index, xLabels.length),
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
      axisLine: axisLineBase,
      axisTick: axisTickVisible,
      splitLine: splitLineHidden,
      nameTextStyle: axisNameBase,
      axisLabel: {
        ...axisLabelBase,
        margin: 8,
        formatter: edgeLabelFormatter(1, 0, (v) => v.toFixed(1)),
      },
    },
    series: seriesByGroup.map((group, index) => ({
      name: group.groupKey,
      type: "bar" as const,
      stack: "total",
      barWidth: "88%",
      itemStyle: { color: SUBGROUP_PALETTE.base[index % SUBGROUP_PALETTE.base.length], borderRadius: BAR_RADIUS.allSmall },
      ...barEmphasisDisabled,
      data: group.values.map((v, di) => {
        if (hoveredIdx === null) return v;
        if (di !== hoveredIdx) return { value: v, itemStyle: { opacity: 0.6 } };
        if (hoveredSeriesIdx === index) {
          return { value: v, itemStyle: { color: SUBGROUP_PALETTE.emphasis[index % SUBGROUP_PALETTE.emphasis.length] } };
        }
        return v;
      }),
    })),
  };

  return <ReactECharts ref={chartRef} option={option} onEvents={onEvents} style={{ width: "100%", height }} />;
};
