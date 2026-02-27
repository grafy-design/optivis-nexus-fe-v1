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

export interface DensitySeries {
  name: string;
  values: number[];
  color: string;
  lineWidth?: number;
}

export interface DensitySegmentedConfig {
  values: number[];
  boundaries: number[];
  colors: string[];
  labels?: string[];
}

interface DensityChartProps {
  data?: {
    orangeGroup: number[];
    blueGroup: number[];
    grayGroup?: number[];
  };
  series?: DensitySeries[];
  segmented?: DensitySegmentedConfig;
  height?: number;
}

const hexToRgba = (hexColor: string, alpha: number): string => {
  if (hexColor.startsWith("rgba(") || hexColor.startsWith("rgb(")) {
    return hexColor;
  }

  const hex = hexColor.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((c) => `${c}${c}`).join("") : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return `rgba(120,120,120,${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildLegacySeries = (data?: DensityChartProps["data"]): DensitySeries[] => {
  if (!data) return [];

  const series: DensitySeries[] = [
    {
      name: "Group 1",
      values: data.orangeGroup ?? [],
      color: "#F07A22",
    },
  ];

  if (Array.isArray(data.grayGroup)) {
    series.push({
      name: "Group 2",
      values: data.grayGroup,
      color: "#919092",
    });
    series.push({
      name: "Group 3",
      values: data.blueGroup ?? [],
      color: "#4B3DF2",
    });
    return series;
  }

  series.push({
    name: "Group 2",
    values: data.blueGroup ?? [],
    color: "#4B3DF2",
  });
  return series;
};

const calculateBandwidth = (values: number[], minX: number, maxX: number): number => {
  const span = Math.max(maxX - minX, 1e-6);
  if (values.length <= 1) {
    return Math.max(span * 0.2, 0.05);
  }

  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(Math.max(variance, 0));
  const silverman = 1.06 * stdDev * values.length ** (-1 / 5);

  if (!Number.isFinite(silverman) || silverman <= 0) {
    return Math.max(span * 0.1, 0.05);
  }

  return Math.max(silverman, span * 0.02, 0.02);
};

export const DensityChart = ({ data, series, segmented, height = 220 }: DensityChartProps) => {
  const baseSeries =
    segmented && segmented.values.length > 0
      ? []
      : series && series.length > 0
        ? series
        : buildLegacySeries(data);

  const segmentedValues = (segmented?.values ?? []).filter((value) => Number.isFinite(value));
  const normalizedSeries = baseSeries.map((item) => ({
    ...item,
    values: (item.values ?? []).filter((value) => Number.isFinite(value)),
  }));

  const allValues =
    segmentedValues.length > 0 ? segmentedValues : normalizedSeries.flatMap((item) => item.values);
  const hasData = allValues.length > 0;
  const rawMinX = hasData ? Math.min(...allValues) : -1;
  const rawMaxX = hasData ? Math.max(...allValues) : 1;
  const span = Math.max(rawMaxX - rawMinX, 1e-6);
  const padding = span * 0.15;
  const xMin = rawMinX - padding;
  const xMax = rawMaxX + padding;
  const xSteps = 220;

  const xValues: number[] = [];
  for (let i = 0; i <= xSteps; i++) {
    xValues.push(xMin + ((xMax - xMin) * i) / xSteps);
  }

  const bandwidth = calculateBandwidth(allValues, xMin, xMax);
  const segmentedBoundaries = [...(segmented?.boundaries ?? [])]
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const fullDensity = segmentedValues.length > 0 ? kde(segmentedValues, bandwidth, xValues) : [];

  const densityBySeries =
    segmentedValues.length > 0
      ? (() => {
          const ranges: Array<{ lower: number; upper: number }> = [];
          if (segmentedBoundaries.length === 0) {
            ranges.push({ lower: Number.NEGATIVE_INFINITY, upper: Number.POSITIVE_INFINITY });
          } else if (segmentedBoundaries.length === 1) {
            ranges.push(
              { lower: Number.NEGATIVE_INFINITY, upper: segmentedBoundaries[0] },
              { lower: segmentedBoundaries[0], upper: Number.POSITIVE_INFINITY }
            );
          } else {
            ranges.push(
              { lower: Number.NEGATIVE_INFINITY, upper: segmentedBoundaries[0] },
              { lower: segmentedBoundaries[0], upper: segmentedBoundaries[1] },
              { lower: segmentedBoundaries[1], upper: Number.POSITIVE_INFINITY }
            );
          }

          return ranges.map((range, index) => {
            const color = segmented?.colors[index] ?? segmented?.colors[segmented.colors.length - 1] ?? "#4B3DF2";
            const label = segmented?.labels?.[index] ?? `Group ${index + 1}`;
            const density = xValues.map((x, densityIndex) => {
              const isInside = x >= range.lower && x <= range.upper;
              return isInside ? fullDensity[densityIndex] : 0;
            });

            return {
              name: label,
              color,
              lineWidth: 1.8,
              density,
            };
          });
        })()
      : normalizedSeries.map((item) => ({
          ...item,
          density: kde(item.values, bandwidth, xValues),
        }));

  const maxY = Math.max(0, ...densityBySeries.flatMap((item) => item.density));

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
      min: xMin,
      max: xMax,
      axisLine: { show: true, lineStyle: { color: "#9B9CA6", width: 1 } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: maxY > 0 ? maxY * 1.35 : 1,
      axisLine: { show: true, lineStyle: { color: "#9B9CA6", width: 1 } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: densityBySeries.map((item) => ({
      name: item.name,
      type: "line",
      data: xValues.map((x, index) => [x, item.density[index]]),
      smooth: true,
      showSymbol: false,
      lineStyle: { width: item.lineWidth ?? 1.8, color: item.color },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(item.color, 0.35) },
            { offset: 1, color: hexToRgba(item.color, 0.02) },
          ],
        },
      },
    })),
  };

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
