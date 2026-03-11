import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { ChartSizeVariant } from "./MultiLineWithErrorBar";

const NEUTRAL_30 = "#484646";
const NEUTRAL_95 = "#efeff4";

type DensitySizeStyle = {
  labelFontSize: number;
  labelFontWeight: number;
  numberFontSize: number;
  numberFontWeight?: number;
  axisColor: string;
  numberColor?: string;
  axisLineColor?: string;
  axisWidth: number;
  splitLineColor: string;
  labelDecimalPlaces?: number;
};

const DENSITY_SIZE_STYLES: Record<ChartSizeVariant, DensitySizeStyle> = {
  XS: {
    labelFontSize: 9,
    labelFontWeight: 400,
    numberFontSize: 9,
    axisColor: NEUTRAL_30,
    axisWidth: 1,
    splitLineColor: NEUTRAL_95,
  },
  S: {
    labelFontSize: 10.5,
    labelFontWeight: 600,
    numberFontSize: 10.5,
    numberFontWeight: 600,
    axisColor: "#787776",
    numberColor: "#787776",
    axisLineColor: "#787776",
    axisWidth: 1,
    splitLineColor: NEUTRAL_95,
    labelDecimalPlaces: 0,
  },
  M: {
    labelFontSize: 15,
    labelFontWeight: 600,
    numberFontSize: 9,
    axisColor: NEUTRAL_30,
    axisWidth: 1,
    splitLineColor: NEUTRAL_95,
  },
  L: {
    labelFontSize: 19.5,
    labelFontWeight: 600,
    numberFontSize: 9,
    axisColor: NEUTRAL_30,
    axisWidth: 1,
    splitLineColor: NEUTRAL_95,
  },
};

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
  height?: number | string;
  showTooltip?: boolean;
  sizeVariant?: ChartSizeVariant;
  xAxisName?: string;
  yAxisName?: string;
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

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const buildPiecewiseGradientStops = (
  colors: string[],
  boundaries: number[],
  xMin: number,
  xMax: number,
  alpha?: number
): Array<{ offset: number; color: string }> => {
  const segmentCount = Math.max(boundaries.length + 1, 1);
  const normalizedColors = Array.from({ length: segmentCount }, (_, index) => {
    return colors[index] ?? colors[colors.length - 1] ?? "#4B3DF2";
  });
  const span = Math.max(xMax - xMin, 1e-6);

  const applyAlpha = (color: string): string => {
    if (alpha === undefined) return color;
    return hexToRgba(color, alpha);
  };

  const stops: Array<{ offset: number; color: string }> = [
    { offset: 0, color: applyAlpha(normalizedColors[0]) },
  ];

  boundaries.forEach((boundary, index) => {
    const offset = clamp((boundary - xMin) / span, 0, 1);
    const currentColor = applyAlpha(normalizedColors[index]);
    const nextColor = applyAlpha(normalizedColors[index + 1] ?? normalizedColors[index]);
    stops.push({ offset, color: currentColor });
    stops.push({ offset, color: nextColor });
  });

  stops.push({ offset: 1, color: applyAlpha(normalizedColors[normalizedColors.length - 1]) });
  return stops;
};

const formatTooltipNumber = (value: unknown): string => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toFixed(4).replace(/\.?0+$/, "");
};

const formatAxisNumber = (value: unknown): string => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "";
  return num.toFixed(2).replace(/\.?0+$/, "");
};

type TooltipItem = {
  marker?: string;
  seriesName?: string;
  value?: unknown;
  axisValue?: unknown;
};

const toTooltipItem = (value: unknown): TooltipItem => {
  if (value && typeof value === "object") {
    return value as TooltipItem;
  }
  return {};
};

export const DensityChart = ({
  data,
  series,
  segmented,
  height = 220,
  showTooltip = true,
  sizeVariant,
  xAxisName,
  yAxisName,
}: DensityChartProps) => {
  const sz = sizeVariant ? DENSITY_SIZE_STYLES[sizeVariant] : null;
  const labelFormatter =
    sz?.labelDecimalPlaces !== undefined
      ? (value: number | string) => Number(value).toFixed(sz.labelDecimalPlaces)
      : undefined;
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
  const isSegmentedMode = segmentedValues.length > 0;
  const segmentedColors = Array.from({ length: Math.max(segmentedBoundaries.length + 1, 1) }, (_, index) => {
    return segmented?.colors[index] ?? segmented?.colors[segmented.colors.length - 1] ?? "#4B3DF2";
  });
  const segmentedLineStops = isSegmentedMode
    ? buildPiecewiseGradientStops(segmentedColors, segmentedBoundaries, xMin, xMax)
    : [];
  const segmentedFillStops = isSegmentedMode
    ? buildPiecewiseGradientStops(segmentedColors, segmentedBoundaries, xMin, xMax, 0.2)
    : [];

  const densityBySeries = normalizedSeries.map((item) => ({
    ...item,
    density: kde(item.values, bandwidth, xValues),
  }));

  const maxY = isSegmentedMode
    ? fullDensity.reduce((pointMax, value) => Math.max(pointMax, Number.isFinite(value) ? value : 0), 0)
    : densityBySeries.reduce((groupMax, item) => {
        const seriesMax = item.density.reduce((pointMax, value) => {
          if (typeof value !== "number" || !Number.isFinite(value)) {
            return pointMax;
          }
          return Math.max(pointMax, value);
        }, 0);
          return Math.max(groupMax, seriesMax);
        }, 0);

  const xLabelColor = sz?.numberColor ?? sz?.axisColor ?? "#6F6F7B";
  const xLabelFontSize = sz?.numberFontSize ?? 10;
  const xRange = xMax - xMin;
  const xEdgeThreshold = xRange * 0.15;
  const xEdgeRich = sz
    ? {
        lEdge: {
          width: 35,
          align: "right" as const,
          fontSize: xLabelFontSize,
          fontWeight: sz.numberFontWeight,
          fontFamily: "Inter",
          color: xLabelColor,
        },
        rEdge: {
          width: 35,
          align: "left" as const,
          fontSize: xLabelFontSize,
          fontWeight: sz.numberFontWeight,
          fontFamily: "Inter",
          color: xLabelColor,
        },
      }
    : undefined;
  const xEdgeFormatter = sz
    ? (value: number | string) => {
        const num = Number(value);
        const base = labelFormatter ? labelFormatter(num) : formatAxisNumber(num);
        if (num - xMin < xEdgeThreshold) return `{lEdge|${base}}`;
        if (xMax - num < xEdgeThreshold) return `{rEdge|${base}}`;
        return base;
      }
    : undefined;
  const yAxisMax = maxY > 0 ? maxY * (sizeVariant ? 1.35 : 1.18) : 1;

  const option: EChartsOption = {
    animation: false,
    tooltip: showTooltip
      ? {
          trigger: "axis",
          formatter: (params: unknown) => {
            const items = (Array.isArray(params) ? params : [params]).map(toTooltipItem);
            if (items.length === 0) return "";

            const axisValue = items[0]?.axisValue;
            const header = formatTooltipNumber(axisValue);
            const lines = items
              .map((item) => {
                const marker = item?.marker ?? "";
                const name = item?.seriesName ?? "";
                const rawValue = Array.isArray(item?.value) ? item.value[1] : item?.value;
                return `${marker}${name}&nbsp;&nbsp;${formatTooltipNumber(rawValue)}`;
              })
              .join("<br/>");

            return `${header}<br/>${lines}`;
          },
        }
      : { show: false, trigger: "none" },
    grid: {
      left: yAxisName ? 24 : 34,
      right: sizeVariant ? 4 : 14,
      top: sizeVariant ? 2 : 10,
      bottom: xAxisName ? 14 : 30,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      min: xMin,
      max: xMax,
      axisLine: {
        show: true,
        onZero: false,
        lineStyle: { color: sz?.axisLineColor ?? sz?.axisColor ?? "#9B9CA6", width: sz?.axisWidth ?? 1 },
      },
      axisTick: { show: false },
      axisLabel: {
        show: !!sz || !!xAxisName,
        color: xLabelColor,
        fontSize: xLabelFontSize,
        fontWeight: sz?.numberFontWeight,
        fontFamily: "Inter",
        margin: 4,
        ...(xEdgeRich ? { rich: xEdgeRich, formatter: xEdgeFormatter } : { formatter: (value: unknown) => formatAxisNumber(value) }),
      },
      name: xAxisName ?? "Slope",
      nameLocation: "middle",
      nameGap: sizeVariant ? 16 : 22,
      nameTextStyle:
        xAxisName || sizeVariant
          ? {
              color: sz?.axisColor ?? "#6F6F7B",
              fontSize: sz?.labelFontSize ?? 10,
              fontWeight: sz?.labelFontWeight,
              fontFamily: "Inter",
            }
          : undefined,
      splitLine: { show: false, lineStyle: { color: sz?.splitLineColor ?? "#D8D7DF", width: 1 } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: yAxisMax,
      axisLine: {
        show: true,
        onZero: false,
        lineStyle: { color: sz?.axisLineColor ?? sz?.axisColor ?? "#9B9CA6", width: sz?.axisWidth ?? 1 },
      },
      axisTick: { show: !!(yAxisName || sz) },
      axisLabel: {
        show: !!sz || !!yAxisName,
        color: sz?.numberColor ?? sz?.axisColor ?? "#6F6F7B",
        fontSize: sz?.numberFontSize ?? 10,
        fontWeight: sz?.numberFontWeight,
        fontFamily: "Inter",
        margin: 8,
        formatter: (value: number | string) => {
          const num = Number(value);
          const base = sizeVariant ? num.toFixed(1) : formatAxisNumber(num);
          if (num === 0) return `${base}\n`;
          if (yAxisMax - num < yAxisMax * 0.15) return `\n${base}`;
          return base;
        },
      },
      splitLine: { show: false, lineStyle: { color: sz?.splitLineColor ?? "#D8D7DF", width: 1 } },
      name: yAxisName,
      nameLocation: "middle",
      nameGap: 36,
      nameRotate: 90,
      nameTextStyle:
        yAxisName || sizeVariant
          ? {
              color: sz?.axisColor ?? "#6F6F7B",
              fontSize: sz?.labelFontSize ?? 10,
              fontWeight: sz?.labelFontWeight,
              fontFamily: "Inter",
            }
          : undefined,
    },
    series: isSegmentedMode
      ? [
          {
            name: "Slope distribution",
            type: "line",
            data: xValues.map((x, index) => [x, fullDensity[index]]),
            smooth: true,
            showSymbol: false,
            lineStyle: {
              width: 1.8,
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: segmentedLineStops,
              },
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: segmentedFillStops,
              },
            },
          },
        ]
      : densityBySeries.map((item) => ({
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
