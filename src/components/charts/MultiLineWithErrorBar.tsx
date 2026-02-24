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
  name?: string;
  nameColor?: string;
  nameFontSize?: number;
  nameGap?: number;
  nameRotate?: number;
  inverse?: boolean;
  showLabels?: boolean;
}

interface MultiLineWithErrorBarProps {
  dataGroup: ErrorBarGroup[];
  seriesLabels?: string[];
  colors?: string[];
  height?: number;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  guideLineX?: number | null;
  guideLineColor?: string;
  guideLineWidth?: number;
  guideLineType?: "solid" | "dashed" | "dotted";
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
  height = 220,
  xAxis,
  yAxis,
  guideLineX = 12,
  guideLineColor = "#D2D2DA",
  guideLineWidth = 1,
  guideLineType = "dashed",
}: MultiLineWithErrorBarProps) => {
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
        symbolSize: 5,
        itemStyle: { color },
        lineStyle: { width: 1.8, color },
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
                style: api.style({ stroke: color, lineWidth: 1.2 }),
              },
              {
                type: "line",
                shape: {
                  x1: coord[0] - 5,
                  y1: yTop[1],
                  x2: coord[0] + 5,
                  y2: yTop[1],
                },
                style: api.style({ stroke: color, lineWidth: 1.2 }),
              },
              {
                type: "line",
                shape: {
                  x1: coord[0] - 5,
                  y1: yBottom[1],
                  x2: coord[0] + 5,
                  y2: yBottom[1],
                },
                style: api.style({ stroke: color, lineWidth: 1.2 }),
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
    grid: { left: 36, right: 18, top: 10, bottom: 26, containLabel: true },
    xAxis: {
      type: "value",
      min: xAxisMin,
      max: xAxisMax,
      interval: xAxisInterval,
      splitLine: {
        show: xAxis?.splitLine ?? false,
        lineStyle: {
          color: xAxis?.splitLineColor ?? "#D8D7DF",
          width: 1,
        },
      },
      axisLine: { show: true, lineStyle: { color: xAxis?.axisLineColor ?? "#9A9AA3", width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: xAxis?.labelColor ?? "#8A8A94", fontSize: xAxis?.fontSize ?? 9 },
      name: xAxis?.name,
      nameLocation: "middle",
      nameGap: xAxis?.nameGap ?? 24,
      nameTextStyle: {
        color: xAxis?.nameColor ?? "#8A8A94",
        fontSize: xAxis?.nameFontSize ?? 9,
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
          color: yAxis?.splitLineColor ?? "#D8D7DF",
          width: 1,
        },
      },
      axisTick: { show: false },
      axisLabel: {
        show: yAxis?.showLabels ?? false,
        color: yAxis?.labelColor ?? "#8A8A94",
        fontSize: yAxis?.fontSize ?? 9,
      },
      axisLine: { show: true, lineStyle: { color: yAxis?.axisLineColor ?? "#9A9AA3", width: 1 } },
      name: yAxis?.name ?? "change from baseline score mean",
      nameLocation: "middle",
      nameGap: yAxis?.nameGap ?? 28,
      nameRotate: yAxis?.nameRotate ?? 90,
      nameTextStyle: {
        color: yAxis?.nameColor ?? "#8A8A94",
        fontSize: yAxis?.nameFontSize ?? 8,
        align: "center",
      },
    },
    series: [...guideSeries, ...dynamicSeries],
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
