import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { ChartSizeVariant } from "./MultiLineWithErrorBar";

const NEUTRAL_30 = "#484646";
const NEUTRAL_90 = "#e3e1e5";
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
  XS: { labelFontSize: 9,    labelFontWeight: 400, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  S:  { labelFontSize: 10.5, labelFontWeight: 600, numberFontSize: 10.5, numberFontWeight: 600, axisColor: "#787776", numberColor: "#787776", axisLineColor: "#787776", axisWidth: 1, splitLineColor: NEUTRAL_95, labelDecimalPlaces: 0 },
  M:  { labelFontSize: 15,   labelFontWeight: 600, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  L:  { labelFontSize: 19.5, labelFontWeight: 600, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
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

export const DensityChart = ({ data, series, segmented, height = 220, sizeVariant, xAxisName, yAxisName }: DensityChartProps) => {
  const [gapHovered, setGapHovered] = useState(false);
  const chartRef = useRef<ReactECharts>(null);
  const peakRangeRef = useRef<{ leftX: number; rightX: number } | null>(null);

  // 피크 면적 호버 감지 (차트 초기화 후 바인딩)
  const onChartReady = useCallback((instance: any) => {
    if (!instance) return;
    const zr = instance.getZr();
    const onMove = (e: any) => {
      const range = peakRangeRef.current;
      if (!range) return;
      const ox = e.offsetX ?? e.event?.offsetX ?? 0;
      const oy = e.offsetY ?? e.event?.offsetY ?? 0;
      let point: number[] | null = null;
      try { point = instance.convertFromPixel({ gridIndex: 0 }, [ox, oy]); } catch { return; }
      if (!point) return;
      const [mx] = point;
      const inside = mx >= range.leftX && mx <= range.rightX;
      setGapHovered((prev) => prev !== inside ? inside : prev);
    };
    const onLeave = () => setGapHovered(false);
    zr.on("mousemove", onMove);
    zr.on("globalout", onLeave);
  }, []);
  const sz = sizeVariant ? DENSITY_SIZE_STYLES[sizeVariant] : null;
  const labelFormatter = sz?.labelDecimalPlaces !== undefined
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

  // x축 edge label rich text (동적 float 축 범위 대응 — 15% 임계값으로 좌우 끝 tick 감지)
  // X-axis edge label rich text (threshold-based detection for dynamic float axis bounds)
  const xLabelColor = sz?.numberColor ?? sz?.axisColor ?? "#8A8A94";
  const xLabelFontSize = sz?.numberFontSize ?? 9;
  const xRange = xMax - xMin;
  const xEdgeThreshold = xRange * 0.15;
  const xEdgeRich = sz ? {
    lEdge: { width: 35, align: "right" as const, fontSize: xLabelFontSize, fontWeight: sz?.numberFontWeight, fontFamily: "Inter", color: xLabelColor },
    rEdge: { width: 35, align: "left"  as const, fontSize: xLabelFontSize, fontWeight: sz?.numberFontWeight, fontFamily: "Inter", color: xLabelColor },
  } : undefined;
  const xEdgeFormatter = sz
    ? (value: number | string) => {
        const num = Number(value);
        const base = labelFormatter ? labelFormatter(num) : String(num);
        if (num - xMin < xEdgeThreshold) return `{lEdge|${base}}`;
        if (xMax - num < xEdgeThreshold) return `{rEdge|${base}}`;
        return base;
      }
    : undefined;

  const option: EChartsOption = {
    animation: true,
    animationDuration: 300,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        lineStyle: { color: "#8f8ac4", type: "dashed" },
        label: { show: false },
      },
      padding: [4, 6], borderWidth: 0, borderColor: "transparent",
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
      textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const rows = items
          .filter((p: any) => p.seriesName !== "Peak Gap" && !p.seriesName?.includes("Peak"))
          .map((p: any) => {
            const val = Number(p.value?.[1] ?? 0).toFixed(1);
            return `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="display:flex;align-items:center;gap:2px">${p.marker ?? ""}<span style="font-size:9px;font-weight:500">${p.seriesName}</span></span><span style="font-size:14px;font-weight:600">${val}</span></div>`;
          })
          .join("");
        return `<div style="font-family:Inter,sans-serif;min-width:100px">${rows}</div>`;
      },
    },
    grid: {
      left: yAxisName ? 24 : 0,
      right: 4,
      top: 2,
      bottom: xAxisName ? 14 : 0,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      min: xMin,
      max: xMax,
      axisLine: { show: true, onZero: false, lineStyle: { color: sz?.axisLineColor ?? sz?.axisColor ?? "#9B9CA6", width: sz?.axisWidth ?? 1 } },
      axisTick: { show: false },
      axisLabel: {
        show: !!sz,
        color: xLabelColor,
        fontSize: xLabelFontSize,
        fontWeight: sz?.numberFontWeight,
        fontFamily: "Inter",
        margin: 4,
        ...(xEdgeRich ? { rich: xEdgeRich, formatter: xEdgeFormatter } : labelFormatter ? { formatter: labelFormatter } : {}),
      },
      splitLine: { show: false, lineStyle: { color: sz?.splitLineColor ?? "#D8D7DF", width: 1 } },
      name: xAxisName,
      nameLocation: "middle",
      nameGap: 16,
      nameTextStyle: xAxisName ? {
        color: sz?.axisColor ?? "#484646",
        fontSize: sz?.labelFontSize ?? 9,
        fontWeight: sz?.labelFontWeight ?? 400,
        fontFamily: "Inter",
      } : undefined,
    },
    yAxis: {
      type: "value",
      min: 0,
      max: maxY > 0 ? maxY * 1.35 : 1,
      axisLine: { show: true, onZero: false, lineStyle: { color: sz?.axisLineColor ?? sz?.axisColor ?? "#9B9CA6", width: sz?.axisWidth ?? 1 } },
      axisTick: { show: !!(yAxisName || sz) },
      axisLabel: {
        show: !!sz,
        color: sz?.numberColor ?? sz?.axisColor ?? "#8A8A94",
        fontSize: sz?.numberFontSize ?? 9,
        fontWeight: sz?.numberFontWeight,
        fontFamily: "Inter",
        margin: 8,
        formatter: (value: number | string) => {
          const num = Number(value);
          const base = num.toFixed(1);
          const yAxisMax = maxY > 0 ? maxY * 1.35 : 1;
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
      nameTextStyle: yAxisName ? {
        color: sz?.axisColor ?? "#484646",
        fontSize: sz?.labelFontSize ?? 9,
        fontWeight: sz?.labelFontWeight ?? 400,
        fontFamily: "Inter",
      } : undefined,
    },
    series: [
      // 각 시리즈 peak 세로선 + 두 peak 사이 가로선 + 간격 라벨
      ...(() => {
        const yTop = maxY > 0 ? maxY * 1.35 : 1;
        const peaks = densityBySeries.map((item) => {
          let peakX = 0;
          let peakY = 0;
          item.density.forEach((d, i) => {
            if (d > peakY) { peakY = d; peakX = xValues[i]; }
          });
          return { x: peakX, y: peakY, color: item.color, name: item.name };
        });

        // 세로 peak 라인 (면적 호버 시 진해짐)
        const peakLines = peaks.map((p) => ({
          name: `${p.name} Peak`,
          type: "line" as const,
          data: [[p.x, 0], [p.x, yTop]] as [number, number][],
          lineStyle: {
            color: hexToRgba(p.color, gapHovered ? 1 : 0.75),
            width: gapHovered ? 2.5 : 1.5,
          },
          symbol: "none" as const,
          silent: true,
          tooltip: { show: false },
          z: 1,
        }));

        // 두 peak 사이 면적 채우기 + 간격 라벨 (네이티브 emphasis)
        const gapArea: any[] = [];
        if (peaks.length >= 2) {
          const sorted = [...peaks].sort((a, b) => a.x - b.x);
          const left = sorted[0];
          const right = sorted[sorted.length - 1];
          const gap = Math.abs(right.x - left.x);
          peakRangeRef.current = { leftX: left.x, rightX: right.x };
          gapArea.push({
            name: "Peak Gap",
            type: "line" as const,
            data: [[left.x, 0], [right.x, 0]] as [number, number][],
            lineStyle: { width: 0 },
            symbol: "none" as const,
            silent: false,
            tooltip: { show: false },
            markArea: {
              silent: true,
              itemStyle: {
                color: gapHovered ? "rgba(90, 83, 160, 0.18)" : "rgba(200, 198, 202, 0.12)",
              },
              label: {
                show: true,
                position: "insideTop",
                offset: [0, 4],
                formatter: () => gap.toFixed(1),
                color: gapHovered ? "#262255" : "#787776",
                fontSize: 12,
                fontWeight: gapHovered ? 800 : 600,
                fontFamily: "Inter",
              },
              data: [[
                { xAxis: left.x },
                { xAxis: right.x },
              ]],
            },
            z: 1,
          });
        }

        return [...peakLines, ...gapArea];
      })() as any[],
      ...densityBySeries.map((item) => ({
      name: item.name,
      type: "line" as const,
      data: xValues.map((x, index) => [x, item.density[index]]),
      smooth: true,
      showSymbol: false,
      itemStyle: { color: item.color },
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
    ],
  };

  return <ReactECharts ref={chartRef} option={option} notMerge={true} style={{ width: "100%", height }} onChartReady={onChartReady} />;
};
