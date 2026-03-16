"use client";

/** ScatterSlopeChart — 그룹별 산점도와 회귀 직선을 함께 표시하는 차트 */

import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  getNiceInterval,
  SCATTER_PALETTE,
  tooltipItem,
  tooltipRow,
  tooltipWrap,
  axisLabelBase,
  axisNameBase,
  axisLineBase,
  axisTickVisible,
  splitLineHidden,
  gridCompact,
  animationDefault,
  focusEmphasis,
} from "@/lib/chart-styles";

type ScatterPoint = { x: number; y: number };
type Regression = { slope: number; intercept: number };
type ScatterGroup = {
  points: ScatterPoint[];
  regression?: Regression;
};

type ScatterSlopeChartProps = {
  data: Record<string, ScatterGroup>;
  height?: number | string;
};

export const ScatterSlopeChart = ({ data, height = 120 }: ScatterSlopeChartProps) => {
  const groups = Object.entries(data ?? {});
  const allPoints = groups.flatMap(([, group]) => group.points ?? []);

  const xValues = allPoints.map((point) => point.x);
  const yValues = allPoints.map((point) => point.y);
  const xMinRaw = xValues.length > 0 ? Math.min(...xValues) : 0;
  const xMaxRaw = xValues.length > 0 ? Math.max(...xValues) : 1;
  const yMinRaw = yValues.length > 0 ? Math.min(...yValues) : 0;
  const yMaxRaw = yValues.length > 0 ? Math.max(...yValues) : 1;

  const xInterval = getNiceInterval(xMaxRaw - xMinRaw);
  const xDecimals = Math.max(0, -Math.floor(Math.log10(xInterval)));
  const xMin = Number((Math.floor(xMinRaw / xInterval) * xInterval).toFixed(xDecimals));
  const xMax = Number((Math.ceil(xMaxRaw / xInterval) * xInterval).toFixed(xDecimals));

  const yInterval = getNiceInterval(yMaxRaw - yMinRaw);
  const yDecimals = Math.max(0, -Math.floor(Math.log10(yInterval)));
  const yMin = Number((Math.floor(yMinRaw / yInterval) * yInterval).toFixed(yDecimals));
  const yMax = Number((Math.ceil(yMaxRaw / yInterval) * yInterval).toFixed(yDecimals));

  const { emphasis: scatterEmphasis, blur: scatterBlur } = focusEmphasis({ scale: 1.4, opacity: 1 });
  const series: any[] = [];

  groups.forEach(([groupName, group], index) => {
    const color = SCATTER_PALETTE.base[index % SCATTER_PALETTE.base.length];
    const emphasisColor = SCATTER_PALETTE.emphasis[index % SCATTER_PALETTE.emphasis.length];

    series.push({
      name: groupName,
      type: "scatter",
      symbolSize: 8,
      data: (group.points ?? []).map((point) => [point.x, point.y]),
      itemStyle: { color },
      emphasis: {
        ...scatterEmphasis,
        itemStyle: { color: emphasisColor, opacity: 1 },
      },
      blur: { itemStyle: { opacity: 0.08 } },
    });

    const regression = group.regression;
    if (regression && Number.isFinite(regression.slope) && Number.isFinite(regression.intercept)) {
      series.push({
        name: groupName,
        type: "line",
        data: [
          [xMinRaw, regression.slope * xMinRaw + regression.intercept],
          [xMaxRaw, regression.slope * xMaxRaw + regression.intercept],
        ],
        showSymbol: false,
        lineStyle: { color, width: 1.2 },
        tooltip: { show: false },
        triggerLineEvent: true,
        emphasis: {
          focus: "series",
          lineStyle: { color: emphasisColor, width: 2.5, opacity: 1 },
        },
        blur: {
          lineStyle: { opacity: 0.08 },
        },
      });
    }
  });

  const option: EChartsOption = {
    ...animationDefault,
    grid: { ...gridCompact, right: 8 },
    tooltip: {
      ...tooltipItem,
      formatter: (p: any) => {
        return tooltipWrap(
          (p.marker ?? "") +
          tooltipRow("", "Slope", Number(p.value[0]).toFixed(1)) +
          tooltipRow("", "C Vision", Number(p.value[1]).toFixed(1))
        );
      },
    },
    xAxis: {
      type: "value",
      min: xMin,
      max: xMax,
      interval: xInterval,
      axisLine: { ...axisLineBase, onZero: false },
      axisTick: { show: false },
      splitLine: splitLineHidden,
      nameTextStyle: axisNameBase,
      axisLabel: { ...axisLabelBase, margin: 4 },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      interval: yInterval,
      name: "Proportion",
      nameLocation: "middle",
      axisLine: axisLineBase,
      axisTick: axisTickVisible,
      nameTextStyle: axisNameBase,
      nameGap: 32,
      axisLabel: { ...axisLabelBase, margin: 8 },
      splitLine: splitLineHidden,
    },
    series,
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
