"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type ErrorBarPoint = [x: number, y: number, error: number];

type GroupType = ErrorBarPoint[];

interface MultiLineWithErrorBarProps {
  dataGroup: GroupType[];
}

const MultiLineWithErrorBar = ({ dataGroup }: MultiLineWithErrorBarProps) => {
  const groups = dataGroup ?? [];
  const allPoints = groups.flat();
  const maxYWithError = allPoints.reduce((acc, [, y, error]) => Math.max(acc, y + error), 0);
  const yAxisMax = maxYWithError > 0 ? Math.ceil(maxYWithError * 1.1) : 5;
  const yInterval = Math.max(1, Math.ceil(yAxisMax / 4));
  const groupColors = [
    "#F07A22",
    "#4B3DF2",
    "#14A38B",
    "#E04A7A",
    "#8C62FF",
    "#2F89FC",
    "#F1B316",
  ];

  const dynamicSeries: NonNullable<EChartsOption["series"]> = groups.flatMap((group, index) => {
    const color = groupColors[index % groupColors.length];
    const groupName = `Group ${index + 1}`;

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

  const option: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { show: false },
    grid: { left: 36, right: 18, top: 10, bottom: 26, containLabel: true },
    xAxis: {
      type: "value",
      min: 0,
      max: 24,
      interval: 3,
      splitLine: { show: false },
      axisLine: { show: true, lineStyle: { color: "#9A9AA3", width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: "#8A8A94", fontSize: 9 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: yAxisMax,
      interval: yInterval,
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      axisLine: { show: true, lineStyle: { color: "#9A9AA3", width: 1 } },
      name: "change from baseline score mean",
      nameLocation: "middle",
      nameGap: 28,
      nameRotate: 90,
      nameTextStyle: { color: "#8A8A94", fontSize: 8, align: "center" },
    },
    series: [
      {
        name: "Center Guide",
        type: "line",
        data: [
          [12, 0],
          [12, yAxisMax],
        ],
        lineStyle: { color: "#D2D2DA", width: 1, type: "dashed" },
        symbol: "none",
        silent: true,
        tooltip: { show: false },
        z: 0,
      },
      ...dynamicSeries,
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: 220 }} />;
};

export default MultiLineWithErrorBar;
