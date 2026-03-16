"use client";

/** LineChartWithHighlight — 두 곡선의 최대 차이 지점을 자동 감지하여 강조하는 비교 꺾은선 차트 */

import React, { useMemo } from "react";
import ReactECharts from "@/components/charts/DynamicECharts";
import {
  tooltipBase,
  CHART_COLORS,
  tooltipDotRow,
  tooltipWrap,
} from "@/lib/chart-styles";

interface LineChartWithHighlightProps {
  optivisData: number[][];
  traditionalData: number[][];
  xAxisName: string;
  yAxisName: string;
  highlightIndex?: number; // 인덱스 기준 (기존 방식)
  highlightXValue?: number; // x축 값 기준 (새로운 방식)
  grid?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    containLabel?: boolean;
  };
  xAxisConfig?: {
    nameGap?: number;
    nameTextStyle?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: number;
      letterSpacing?: number;
      color?: string;
    };
    scale?: boolean;
    axisLabel?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: number;
      color?: string;
      margin?: number;
    };
  };
  yAxisConfig?: {
    nameGap?: number;
    nameTextStyle?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: number;
      letterSpacing?: number;
      color?: string;
    };
    scale?: boolean;
    axisLabel?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: number;
      color?: string;
      margin?: number;
    };
  };
  showGrid?: boolean;
  showAxes?: boolean;
  showTicks?: boolean;
  showTooltip?: boolean;
  optivisColor?: string;
  traditionalColor?: string;
  optivisSymbolSize?: number;
  traditionalSymbolSize?: number;
  optivisLineWidth?: number;
  traditionalLineWidth?: number;
  showAreaStyle?: boolean;
  optivisAreaColor?: string;
  traditionalAreaColor?: string;
  compactTooltip?: boolean;
  onChartClick?: (params: any) => void;
}

/**
 * Y 값으로 곡선 위의 X를 선형 보간하여 구하는 함수
 * data는 Y 기준으로 정렬되어 있지 않을 수 있으므로, 인접 두 점 사이를 보간
 */
const interpolateXAtY = (data: number[][], targetY: number): number | null => {
  if (data.length === 0) return null;
  // Y 기준 정렬된 복사본
  const sorted = [...data].sort((a, b) => a[1] - b[1]);
  // targetY가 범위 밖이면 가장 가까운 점 반환
  if (targetY <= sorted[0][1]) return sorted[0][0];
  if (targetY >= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0];
  // 인접 두 점 사이에서 보간
  for (let i = 0; i < sorted.length - 1; i++) {
    const [x1, y1] = sorted[i];
    const [x2, y2] = sorted[i + 1];
    if (targetY >= y1 && targetY <= y2) {
      const t = (targetY - y1) / (y2 - y1);
      return x1 + t * (x2 - x1);
    }
  }
  return sorted[0][0];
};

/**
 * 두 곡선에서 X값 차이가 가장 큰 Y지점을 찾는 함수
 * 공통 Y 범위에서 샘플링하여 최대 차이 지점을 반환
 */
const findMaxXDiffY = (
  dataA: number[][],
  dataB: number[][],
  samples = 200,
): { y: number; xA: number; xB: number } | null => {
  if (dataA.length < 2 || dataB.length < 2) return null;
  const allYA = dataA.map((d) => d[1]);
  const allYB = dataB.map((d) => d[1]);
  const yMin = Math.max(Math.min(...allYA), Math.min(...allYB));
  const yMax = Math.min(Math.max(...allYA), Math.max(...allYB));
  if (yMin >= yMax) return null;

  let bestY = yMin;
  let bestDiff = 0;
  let bestXA = 0;
  let bestXB = 0;

  for (let i = 0; i <= samples; i++) {
    const y = yMin + ((yMax - yMin) * i) / samples;
    const xA = interpolateXAtY(dataA, y);
    const xB = interpolateXAtY(dataB, y);
    if (xA === null || xB === null) continue;
    const diff = Math.abs(xA - xB);
    if (diff > bestDiff) {
      bestDiff = diff;
      bestY = y;
      bestXA = xA;
      bestXB = xB;
    }
  }

  return { y: bestY, xA: bestXA, xB: bestXB };
};

export const LineChartWithHighlight: React.FC<LineChartWithHighlightProps> = ({
  optivisData,
  traditionalData,
  xAxisName,
  yAxisName,
  highlightIndex: _highlightIndex,
  highlightXValue: _highlightXValue,
  grid = { left: 60, right: 20, top: 20, bottom: 50 },
  xAxisConfig = {},
  yAxisConfig = {},
  showGrid = true,
  showAxes = true,
  showTicks = true,
  showTooltip = true,
  optivisColor = "#f06600",
  traditionalColor = "#231f52",
  optivisSymbolSize = 6,
  traditionalSymbolSize = 6,
  optivisLineWidth = 2,
  traditionalLineWidth = 2,
  showAreaStyle = false,
  optivisAreaColor = "rgba(240, 102, 0, 0.25)",
  traditionalAreaColor = "rgba(35, 31, 82, 0.25)",
  compactTooltip = false,
  onChartClick,
}) => {
  // 두 곡선의 X값 차이가 가장 큰 Y지점 계산
  const maxDiffResult = useMemo(() => {
    if (optivisData.length < 2 || traditionalData.length < 2) return null;
    return findMaxXDiffY(optivisData, traditionalData);
  }, [optivisData, traditionalData]);

  const optivisPoint: number[] | null = maxDiffResult
    ? [maxDiffResult.xA, maxDiffResult.y]
    : null;
  const traditionalPoint: number[] | null = maxDiffResult
    ? [maxDiffResult.xB, maxDiffResult.y]
    : null;

  // x축 데이터 범위 계산 (전체 너비를 채우도록)
  const xRange = useMemo(() => {
    const allX = [...optivisData.map(d => d[0]), ...traditionalData.map(d => d[0])];
    if (allX.length === 0) return { min: undefined, max: undefined };
    return { min: Math.min(...allX), max: Math.max(...allX) };
  }, [optivisData, traditionalData]);

  // y축 데이터 범위 계산 (markLine 60% 길이 계산용)
  const yRange = useMemo(() => {
    const allY = [...optivisData.map(d => d[1]), ...traditionalData.map(d => d[1])];
    if (allY.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...allY), max: Math.max(...allY) };
  }, [optivisData, traditionalData]);

  // ECharts option 객체 메모이제이션
  const chartOption = useMemo(() => {
    const series: any[] = [
      {
        name: "OPTIVIS",
        type: "line",
        data: optivisData,
        lineStyle: { color: optivisColor, width: optivisLineWidth },
        symbol: "circle",
        symbolSize: optivisSymbolSize,
        itemStyle: { color: optivisColor },
        smooth: true,
        z: 3,
        emphasis: { disabled: true },
        markPoint: optivisPoint
          ? {
              data: [
                {
                  coord: optivisPoint,
                  symbol: "circle",
                  symbolSize: 19,
                  itemStyle: { color: optivisColor, opacity: 0.5 },
                },
                {
                  coord: optivisPoint,
                  symbol: "circle",
                  symbolSize: 9,
                  itemStyle: { color: optivisColor, opacity: 0.8 },
                },
              ],
              label: { show: false },
              z: 10,
            }
          : undefined,
        markLine: optivisPoint
          ? {
              symbol: "none",
              data: [
                {
                  yAxis: optivisPoint[1],
                  label: { show: false },
                  lineStyle: {
                    color: "#7654F0",
                    type: [4, 3] as any,
                    width: 1.5,
                    opacity: 0.8,
                  },
                },
                {
                  xAxis: optivisPoint[0],
                  label: { show: false },
                  lineStyle: {
                    color: optivisColor,
                    type: "solid",
                    width: 2,
                    opacity: 0.6,
                  },
                },
              ],
              z: 5,
            }
          : undefined,
        ...(showAreaStyle && {
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: optivisAreaColor },
                { offset: 0.5, color: optivisAreaColor.replace("0.25", "0.12") },
                { offset: 1, color: optivisAreaColor.replace("0.25", "0.03") },
              ],
            },
            origin: 0,
          },
        }),
      },
      {
        name: "Traditional",
        type: "line",
        data: traditionalData,
        lineStyle: { color: traditionalColor, width: traditionalLineWidth },
        symbol: "circle",
        symbolSize: traditionalSymbolSize,
        itemStyle: { color: traditionalColor },
        smooth: true,
        z: 2,
        emphasis: { disabled: true },
        markPoint: traditionalPoint
          ? {
              data: [
                {
                  coord: traditionalPoint,
                  symbol: "circle",
                  symbolSize: 19,
                  itemStyle: { color: traditionalColor, opacity: 0.5 },
                },
                {
                  coord: traditionalPoint,
                  symbol: "circle",
                  symbolSize: 9,
                  itemStyle: { color: traditionalColor, opacity: 0.8 },
                },
              ],
              label: { show: false },
              z: 10,
            }
          : undefined,
        markLine: traditionalPoint
          ? {
              symbol: "none",
              data: [
                {
                  xAxis: traditionalPoint[0],
                  label: { show: false },
                  lineStyle: {
                    color: traditionalColor,
                    type: "solid",
                    width: 2,
                    opacity: 0.6,
                  },
                },
              ],
              z: 5,
            }
          : undefined,
        ...(showAreaStyle && {
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: traditionalAreaColor },
                {
                  offset: 0.5,
                  color: traditionalAreaColor.replace("0.25", "0.12"),
                },
                {
                  offset: 1,
                  color: traditionalAreaColor.replace("0.25", "0.03"),
                },
              ],
            },
            origin: 0,
          },
        }),
      },
    ];

    return {
      grid,
      xAxis: {
        type: "value",
        name: xAxisName,
        nameLocation: "middle",
        nameGap: xAxisConfig.nameGap ?? 30,
        nameTextStyle: xAxisConfig.nameTextStyle ?? {
          fontSize: 12,
          color: "#666",
        },
        min: xRange.min,
        max: xRange.max,
        axisLine: {
          show: showAxes,
          ...(showAxes && { lineStyle: { color: "#787776", width: 1 } }),
        },
        axisTick: { show: false },
        axisLabel: {
          show: showAxes,
          alignMinLabel: "left" as any,
          alignMaxLabel: "right" as any,
          ...(xAxisConfig.axisLabel && {
            fontSize: xAxisConfig.axisLabel.fontSize,
            fontWeight: xAxisConfig.axisLabel.fontWeight,
            color: xAxisConfig.axisLabel.color,
            margin: xAxisConfig.axisLabel.margin,
          }),
        },
        splitLine: {
          show: showGrid,
          lineStyle: { color: "#c7c5c9", type: "dashed" },
        },
        scale: xAxisConfig.scale ?? false,
        axisPointer: {
          lineStyle: { color: "transparent", width: 0 },
          label: { show: false },
        },
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: yAxisConfig.nameGap ?? 40,
        nameTextStyle: yAxisConfig.nameTextStyle ?? {
          fontSize: 12,
          color: "#666",
        },
        axisLine: {
          show: showAxes,
          ...(showAxes && { lineStyle: { color: "#787776", width: 1 } }),
        },
        axisTick: {
          show: showTicks,
          length: 3,
          ...(showTicks && { lineStyle: { color: "#787776" } }),
        },
        axisLabel: {
          show: showAxes,
          showMaxLabel: false,
          verticalAlignMinLabel: "top" as any,
          ...(yAxisConfig.axisLabel && {
            fontSize: yAxisConfig.axisLabel.fontSize,
            fontWeight: yAxisConfig.axisLabel.fontWeight,
            color: yAxisConfig.axisLabel.color,
            margin: yAxisConfig.axisLabel.margin,
          }),
        },
        splitLine: {
          show: showGrid,
          lineStyle: { color: "#c7c5c9", type: "dashed" },
        },
        scale: yAxisConfig.scale ?? false,
        axisPointer: {
          lineStyle: { color: CHART_COLORS.AXIS_LINE, type: "dashed" as const },
          label: {
            show: true,
            formatter: (p: any) => typeof p.value === "number" ? p.value.toFixed(2) : p.value,
            backgroundColor: "transparent",
            color: CHART_COLORS.NEUTRAL_50,
            fontFamily: "Inter",
            fontSize: 10,
            fontWeight: 500,
            borderWidth: 0,
            shadowBlur: 0,
            padding: [4, 6],
          },
        },
      },
      series,
      tooltip: {
        ...tooltipBase,
        trigger: "axis" as const,
        axisPointer: {
          type: "cross" as const,
          snap: false,
        },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const item = items[0];
          if (!item) return "";
          const y = item.data?.[1] as number;
          // 양쪽 곡선 모두 Y값 기준으로 X를 보간
          const optX = interpolateXAtY(optivisData, y);
          const tradX = interpolateXAtY(traditionalData, y);
          if (optX === null || tradX === null) return "";
          const diff = Math.abs(optX - tradX);
          // 차이값 (강조)
          let html = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-family:Inter;color:#484646${compactTooltip ? "" : ";margin-bottom:6px"}"><span style="font-size:9px;font-weight:500">Diff</span><span style="font-size:15px;font-weight:700">${Math.round(diff)}</span></div>`;
          if (!compactTooltip) {
            // 각 그룹의 X값 (dot 없이, 그룹명에 색상 적용)
            html += `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:1px 0"><span style="color:${optivisColor};font-size:9px">OPTIVIS</span><span style="color:#787776;font-size:13px;font-weight:600">${Math.round(optX)}</span></div>`;
            html += `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:1px 0"><span style="color:${traditionalColor};font-size:9px">Traditional</span><span style="color:#787776;font-size:13px;font-weight:600">${Math.round(tradX)}</span></div>`;
          }
          return tooltipWrap(html);
        },
      },
    };
  }, [
    optivisData, traditionalData, optivisPoint, traditionalPoint,
    grid, xAxisName, yAxisName, xAxisConfig, yAxisConfig, xRange, yRange,
    showGrid, showAxes, showTicks, showAreaStyle,
    optivisColor, traditionalColor,
    optivisSymbolSize, traditionalSymbolSize,
    optivisLineWidth, traditionalLineWidth,
    optivisAreaColor, traditionalAreaColor, compactTooltip,
  ]);

  return (
    <div className="relative h-full w-full">
      <ReactECharts
        option={chartOption}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: "100%", width: "100%" }}
        onEvents={
          onChartClick
            ? {
                click: onChartClick,
              }
            : undefined
        }
      />
    </div>
  );
};
