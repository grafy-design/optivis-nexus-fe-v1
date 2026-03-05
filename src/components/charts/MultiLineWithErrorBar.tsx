"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export type ErrorBarPoint = [x: number, y: number, error: number];

export type ErrorBarGroup = ErrorBarPoint[];

interface AxisConfig {
  min?: number;
  max?: number;
  interval?: number;
  splitLine?: boolean;
  splitLineColor?: string;
  axisLineColor?: string;
  labelColor?: string;
  fontSize?: number;
  fontFamily?: string;
  name?: string;
  nameColor?: string;
  nameFontSize?: number;
  nameGap?: number;
  nameRotate?: number;
  inverse?: boolean;
  showLabels?: boolean;
}

export type ChartSizeVariant = "XS" | "S" | "M" | "L";

const NEUTRAL_30 = "#484646";
const NEUTRAL_95 = "#efeff4";

type ChartSizeStyle = {
  labelFontSize: number;
  labelFontWeight: number;
  numberFontSize: number;
  axisColor: string;
  axisWidth: number;
  splitLineColor: string;
};

const CHART_SIZE_STYLES: Record<ChartSizeVariant, ChartSizeStyle> = {
  XS: { labelFontSize: 9, labelFontWeight: 400, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  S:  { labelFontSize: 9, labelFontWeight: 400, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  M:  { labelFontSize: 15, labelFontWeight: 600, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  L:  { labelFontSize: 19.5, labelFontWeight: 600, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
};

interface MultiLineWithErrorBarProps {
  dataGroup: ErrorBarGroup[];
  seriesLabels?: string[];
  colors?: string[];
  filledSymbol?: boolean;
  lineWidth?: number;
  symbolSize?: number;
  errorBarLineWidth?: number;
  errorBarCapHalfWidth?: number;
  height?: number | string;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  guideLineX?: number | null;
  guideLineColor?: string;
  guideLineWidth?: number;
  guideLineType?: "solid" | "dashed" | "dotted";
  sizeVariant?: ChartSizeVariant;
}

const DEFAULT_GROUP_COLORS = [
  "#F07A22",
  "#4B3DF2",
  "#14A38B",
  "#E04A7A",
  "#8C62FF",
  "#2F89FC",
  "#F1B316",
];

export const MultiLineWithErrorBar = ({
  dataGroup,
  seriesLabels,
  colors,
  filledSymbol = false,
  lineWidth = 2,
  symbolSize = 5,
  errorBarLineWidth = 1.2,
  errorBarCapHalfWidth = 5,
  height = 220,
  xAxis,
  yAxis,
  guideLineX = 12,
  guideLineColor = "#D2D2DA",
  guideLineWidth = 1,
  guideLineType = "dashed",
  sizeVariant,
}: MultiLineWithErrorBarProps) => {
  const sz = sizeVariant ? CHART_SIZE_STYLES[sizeVariant] : null;
  const groups = dataGroup ?? [];
  const allPoints = groups.flat();
  const maxYWithError = allPoints.reduce((acc, [, y, error]) => Math.max(acc, y + error), 0);

  const xAxisMin = xAxis?.min ?? 0;
  const xAxisMax = xAxis?.max ?? 24;
  const xAxisInterval = xAxis?.interval ?? 3;

  const yAxisMin = yAxis?.min ?? 0;
  const computedYMax = maxYWithError > 0 ? Math.ceil(maxYWithError * 1.1) : 5;
  const yAxisMax = yAxis?.max ?? computedYMax;
  const yAxisRange = Math.max(1, yAxisMax - yAxisMin);
  const yInterval = yAxis?.interval ?? Math.max(1, Math.ceil(yAxisRange / 4));
  const groupColors = colors && colors.length > 0 ? colors : DEFAULT_GROUP_COLORS;

  const dynamicSeries: NonNullable<EChartsOption["series"]> = groups.flatMap((group, index) => {
    const color = groupColors[index % groupColors.length];
    const groupName = seriesLabels?.[index] ?? `Group ${index + 1}`;

    return [
      {
        name: groupName,
        type: "line",
        data: group.map(([x, y]) => [x, y]),
        smooth: false,
        showSymbol: true,
        symbol: filledSymbol ? "circle" : "emptyCircle",
        symbolSize,
        itemStyle: filledSymbol ? { color, borderColor: color, borderWidth: 1 } : { color },
        lineStyle: { width: lineWidth, color },
      },
      {
        name: `${groupName} Error`,
        type: "custom",
        coordinateSystem: "cartesian2d",
        renderItem: (_params, api) => {
          const xValue = Number(api.value(0));
          const yValue = Number(api.value(1));
          const error = Number(api.value(2));

          const coord = api.coord([xValue, yValue]);
          const yTop = api.coord([xValue, yValue + error]);
          const yBottom = api.coord([xValue, yValue - error]);

          return {
            type: "group",
            children: [
              {
                type: "line",
                shape: {
                  x1: coord[0],
                  y1: yTop[1],
                  x2: coord[0],
                  y2: yBottom[1],
                },
                style: api.style({ stroke: color, lineWidth: errorBarLineWidth }),
              },
              {
                type: "line",
                shape: {
                  x1: coord[0] - errorBarCapHalfWidth,
                  y1: yTop[1],
                  x2: coord[0] + errorBarCapHalfWidth,
                  y2: yTop[1],
                },
                style: api.style({ stroke: color, lineWidth: errorBarLineWidth }),
              },
              {
                type: "line",
                shape: {
                  x1: coord[0] - errorBarCapHalfWidth,
                  y1: yBottom[1],
                  x2: coord[0] + errorBarCapHalfWidth,
                  y2: yBottom[1],
                },
                style: api.style({ stroke: color, lineWidth: errorBarLineWidth }),
              },
            ],
          };
        },
        data: group,
        silent: true,
        z: 3,
      },
    ];
  });

  const guideSeries: NonNullable<EChartsOption["series"]> =
    guideLineX === null
      ? []
      : [
          {
            name: "Center Guide",
            type: "line",
            data: [
              [guideLineX, yAxisMin],
              [guideLineX, yAxisMax],
            ],
            lineStyle: { color: guideLineColor, width: guideLineWidth, type: guideLineType },
            symbol: "none",
            silent: true,
            tooltip: { show: false },
            z: 0,
          },
        ];

  const option: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { show: false },
    grid: { left: 8, right: 8, top: 0, bottom: 0, containLabel: true },
    xAxis: {
      type: "value",
      min: xAxisMin,
      max: xAxisMax,
      interval: xAxisInterval,
      splitLine: {
        show: xAxis?.splitLine ?? false,
        lineStyle: {
          color: xAxis?.splitLineColor ?? sz?.splitLineColor ?? "#D8D7DF",
          width: 1,
        },
      },
      axisLine: { show: true, lineStyle: { color: xAxis?.axisLineColor ?? sz?.axisColor ?? "#9A9AA3", width: sz?.axisWidth ?? 1 } },
      axisTick: { show: false },
      axisLabel: { color: xAxis?.labelColor ?? sz?.axisColor ?? "#8A8A94", fontSize: xAxis?.fontSize ?? sz?.numberFontSize ?? 9, fontFamily: xAxis?.fontFamily ?? "Inter" },
      name: xAxis?.name,
      nameLocation: "middle",
      nameGap: xAxis?.nameGap ?? 24,
      nameTextStyle: {
        color: xAxis?.nameColor ?? sz?.axisColor ?? "#8A8A94",
        fontSize: xAxis?.nameFontSize ?? sz?.labelFontSize ?? 9,
        fontWeight: xAxis?.nameFontSize ? undefined : sz?.labelFontWeight,
        fontFamily: xAxis?.fontFamily ?? "Inter",
      },
    },
    yAxis: {
      type: "value",
      min: yAxisMin,
      max: yAxisMax,
      interval: yInterval,
      inverse: yAxis?.inverse ?? false,
      splitLine: {
        show: yAxis?.splitLine ?? false,
        lineStyle: {
          color: yAxis?.splitLineColor ?? sz?.splitLineColor ?? "#D8D7DF",
          width: 1,
        },
      },
      axisTick: { show: false },
      axisLabel: {
        show: yAxis?.showLabels ?? false,
        color: yAxis?.labelColor ?? sz?.axisColor ?? "#8A8A94",
        fontSize: yAxis?.fontSize ?? sz?.numberFontSize ?? 9,
        fontFamily: yAxis?.fontFamily ?? "Inter",
      },
      axisLine: { show: true, lineStyle: { color: yAxis?.axisLineColor ?? sz?.axisColor ?? "#9A9AA3", width: sz?.axisWidth ?? 1 } },
      name: yAxis?.name,
      nameLocation: "middle",
      nameGap: yAxis?.nameGap ?? 28,
      nameRotate: yAxis?.nameRotate ?? 90,
      nameTextStyle: {
        color: yAxis?.nameColor ?? sz?.axisColor ?? "#8A8A94",
        fontSize: yAxis?.nameFontSize ?? sz?.labelFontSize ?? 8,
        fontWeight: yAxis?.nameFontSize ? undefined : sz?.labelFontWeight,
        fontFamily: yAxis?.fontFamily ?? "Inter",
        align: "center",
      },
    },
    series: [...guideSeries, ...dynamicSeries],
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
