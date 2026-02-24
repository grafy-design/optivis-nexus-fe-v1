import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const gaussianKernel = (x: number): number => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

const kde = (data: number[], bandwidth: number, xValues: number[]): number[] => {
  const effectiveBandwidth = bandwidth > 0 ? bandwidth : 1;

  if (data.length === 0) {
    return Array.from({ length: xValues.length }, () => 0);
  }

  return xValues.map((x) => {
    const sum = data.reduce((acc, val) => acc + gaussianKernel((x - val) / effectiveBandwidth), 0);
    const density = sum / (data.length * effectiveBandwidth);
    return Number.isFinite(density) ? density : 0;
  });
};

interface DensityChartProps {
  data: {
    orangeGroup: number[];
    blueGroup: number[];
  };
}

export const DensityChart = ({ data }: DensityChartProps) => {
  const xValues: number[] = [];
  for (let i = 0; i <= 2.8; i += 0.02) {
    xValues.push(i);
  }

  const yOrangeRaw = kde(data.orangeGroup, 0.16, xValues);
  const yBlueRaw = kde(data.blueGroup, 0.16, xValues);

  const densityThreshold = 0.02;
  const orangeEndIndex = yOrangeRaw.reduce(
    (last, y, index) => (y > densityThreshold ? index : last),
    -1
  );
  const blueStartIndex = yBlueRaw.findIndex((y) => y > densityThreshold);

  const orangeEndX =
    orangeEndIndex >= 0 ? xValues[orangeEndIndex] : xValues[Math.floor(xValues.length / 2)];
  const blueStartRawX = blueStartIndex >= 0 ? xValues[blueStartIndex] : xValues[0];
  const blueShiftX = orangeEndX - blueStartRawX;

  const orangeData = xValues.map((x, i) => [x, x <= orangeEndX ? yOrangeRaw[i] : 0]);
  const blueData = xValues.map((x, i) => {
    const shiftedX = x + blueShiftX;
    return [shiftedX, shiftedX >= orangeEndX ? yBlueRaw[i] : 0];
  });

  const maxY = Math.max(...yOrangeRaw, ...yBlueRaw);
  const xAxisMax = Math.max(2.8, blueData[blueData.length - 1][0]);

  const option: EChartsOption = {
    animation: false,
    tooltip: { trigger: "axis" },
    grid: {
      left: 12,
      right: 12,
      top: 8,
      bottom: 14,
      containLabel: false,
    },
    xAxis: {
      type: "value",
      min: 0,
      max: xAxisMax,
      axisLine: { show: true, lineStyle: { color: "#9B9CA6", width: 1 } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: maxY * 1.35,
      axisLine: { show: true, lineStyle: { color: "#9B9CA6", width: 1 } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        name: "Orange",
        type: "line",
        data: orangeData,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#F07A22" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(240, 122, 34, 0.35)" },
              { offset: 1, color: "rgba(240, 122, 34, 0.02)" },
            ],
          },
        },
      },
      {
        name: "Blue",
        type: "line",
        data: blueData,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.4, color: "#4B3DF2" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(75, 61, 242, 0.35)" },
              { offset: 1, color: "rgba(75, 61, 242, 0.02)" },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: 220 }} />;
};
