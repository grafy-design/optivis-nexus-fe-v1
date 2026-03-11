"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  hexToRgba,
  CHART_COLORS,
  CHART_FONT,
  GROUP_COLORS,
  tooltipBase,
  tooltipTitle,
  axisNameBase,
  splitLineHidden,
  animationWithUpdate,
  buildLineGradient,
  xAxisEdgeLabelRich,
  edgeLabelFormatter,
} from "@/lib/chart-styles";
export { type ChartSizeVariant } from "@/lib/chart-styles";
import { CHART_SIZE_STYLES, type ChartSizeVariant } from "@/lib/chart-styles";

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
  showTick?: boolean;
  alignEdgeLabels?: boolean;
  onZero?: boolean;
  zeroLineColor?: string;
}

interface GridConfig {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  containLabel?: boolean;
}

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
  guideLineType?: "solid" | "dashed" | "dotted" | number[];
  sizeVariant?: ChartSizeVariant;
  grid?: GridConfig;
}

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
  guideLineColor = CHART_COLORS.GUIDE_LINE,
  guideLineWidth = 1,
  guideLineType = "dashed",
  sizeVariant,
  grid,
}: MultiLineWithErrorBarProps) => {
  const sz = sizeVariant ? CHART_SIZE_STYLES[sizeVariant] : null;
  const labelFormatter = sz?.labelDecimalPlaces !== undefined
    ? (value: number | string) => Number(value).toFixed(sz.labelDecimalPlaces)
    : undefined;
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
  const groupColors = colors && colors.length > 0 ? colors : [...GROUP_COLORS];
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
  const [hoveredX, setHoveredX] = useState<number | null>(null);
  const chartRef = useRef<any>(null);
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  // ZRenderer 마우스 좌표 기반 시리즈 감지 (Y 데이터 근접도 → 정확한 그룹 선택)
  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance?.();
    if (!chart) return;

    let prevGroup: number | null = null;
    let prevX: number | null = null;

    const onMove = (e: any) => {
      const ox = e.offsetX ?? e.event?.offsetX ?? 0;
      const oy = e.offsetY ?? e.event?.offsetY ?? 0;
      let point: number[] | null = null;
      try { point = chart.convertFromPixel({ gridIndex: 0 }, [ox, oy]); } catch { return; }
      if (!point) return;
      const [mx, my] = point;
      const cg = groupsRef.current;

      // 가장 가까운 data X 찾기
      const allX = [...new Set(cg.flatMap((g: any) => g.map(([x]: any) => x)))].sort((a: number, b: number) => a - b);
      if (allX.length === 0) return;
      const nearX = allX.reduce((best: number, v: number) => Math.abs(v - mx) < Math.abs(best - mx) ? v : best, allX[0]);

      // 해당 X에서 Y값이 마우스에 가장 가까운 그룹 찾기
      let bestIdx = 0;
      let bestDist = Infinity;
      cg.forEach((group: any, i: number) => {
        const pt = group.find(([gx]: any) => Math.abs(gx - nearX) < 0.001);
        if (pt) {
          const d = Math.abs(pt[1] - my);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
      });

      if (bestIdx !== prevGroup || nearX !== prevX) {
        prevGroup = bestIdx;
        prevX = nearX;
        setHoveredGroup(bestIdx);
        setHoveredX(nearX);
      }
    };

    const onLeave = () => {
      prevGroup = null;
      prevX = null;
      setHoveredGroup(null);
      setHoveredX(null);
    };

    const zr = chart.getZr();
    zr.on("mousemove", onMove);
    zr.on("globalout", onLeave);
    return () => { zr.off("mousemove", onMove); zr.off("globalout", onLeave); };
  }, []);

  // 거리 기반 오퍼시티 계산
  const xRange = Math.max(xAxisMax - xAxisMin, 1);
  const distFactor = (x: number) => {
    if (hoveredX === null) return 1;
    return Math.max(0, 1 - (Math.abs(x - hoveredX) / xRange) * 4);
  };

  const dynamicSeries: NonNullable<EChartsOption["series"]> = groups.flatMap((group, index) => {
    const color = groupColors[index % groupColors.length];
    const groupName = seriesLabels?.[index] ?? `Group ${index + 1}`;
    const isActive = hoveredGroup === null || hoveredGroup === index;

    return [
      {
        name: groupName,
        type: "line",
        data: group.map(([x, y]) => {
          const df = distFactor(x);
          const ptOpacity = hoveredX === null ? 1 : isActive ? 0.4 + 0.6 * df : 0.06 + 0.44 * df;
          return {
            value: [x, y],
            itemStyle: filledSymbol
              ? { color, borderColor: color, borderWidth: 1, opacity: ptOpacity }
              : { color, opacity: ptOpacity },
          };
        }),
        smooth: false,
        showSymbol: true,
        symbol: filledSymbol ? "circle" : "emptyCircle",
        symbolSize,
        itemStyle: filledSymbol ? { color, borderColor: color, borderWidth: 1 } : { color },
        lineStyle: { width: lineWidth, color: buildLineGradient(color, hoveredX, xAxisMin, xAxisMax, isActive) },
        emphasis: {
          focus: "series",
          itemStyle: { opacity: 1, borderWidth: 2, borderColor: color, color },
          lineStyle: { width: lineWidth * 1.5 },
        },
        blur: {
          itemStyle: { opacity: 0.12 },
          lineStyle: { opacity: 0.12 },
        },
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

          const df = distFactor(xValue);
          const errOpacity = hoveredX === null ? 1 : isActive ? 0.35 + 0.65 * df : 0.05 + 0.4 * df;

          return {
            type: "group",
            children: [
              {
                type: "line",
                shape: { x1: coord[0], y1: yTop[1], x2: coord[0], y2: yBottom[1] },
                style: api.style({ stroke: color, lineWidth: errorBarLineWidth, opacity: errOpacity }),
              },
              {
                type: "line",
                shape: { x1: coord[0] - errorBarCapHalfWidth, y1: yTop[1], x2: coord[0] + errorBarCapHalfWidth, y2: yTop[1] },
                style: api.style({ stroke: color, lineWidth: errorBarLineWidth, opacity: errOpacity }),
              },
              {
                type: "line",
                shape: { x1: coord[0] - errorBarCapHalfWidth, y1: yBottom[1], x2: coord[0] + errorBarCapHalfWidth, y2: yBottom[1] },
                style: api.style({ stroke: color, lineWidth: errorBarLineWidth, opacity: errOpacity }),
              },
            ],
          };
        },
        data: group,
        silent: true,
        tooltip: { show: false },
        z: 3,
      },
    ];
  });

  // 각 X 지점별 전체 그룹 Y 평균 꺾은선
  const meanSeries: NonNullable<EChartsOption["series"]> = (() => {
    const xMap = new Map<number, number[]>();
    groups.forEach((group) => {
      group.forEach(([x, y]) => {
        if (!xMap.has(x)) xMap.set(x, []);
        xMap.get(x)!.push(y);
      });
    });
    const meanData = [...xMap.entries()]
      .map(([x, ys]) => [x, ys.reduce((a, b) => a + b, 0) / ys.length] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    if (meanData.length === 0) return [];
    return [{
      name: "Mean",
      type: "line" as const,
      data: meanData,
      smooth: false,
      showSymbol: false,
      lineStyle: { color: CHART_COLORS.NEUTRAL_50, width: lineWidth, type: [4, 2] as number[] },
      symbol: "none" as const,
      silent: true,
      tooltip: { show: false },
      z: 0,
    }];
  })();

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

  // y=0 기준선 (onZero: false일 때 0 위치에 수평선 표시)
  const zeroLineSeries: NonNullable<EChartsOption["series"]> =
    yAxis?.zeroLineColor && yAxisMin < 0
      ? [
          {
            name: "Zero Line",
            type: "line",
            data: [
              [xAxisMin, 0],
              [xAxisMax, 0],
            ],
            lineStyle: { color: yAxis.zeroLineColor, width: 1 },
            symbol: "none",
            silent: true,
            tooltip: { show: false },
            z: 0,
          },
        ]
      : [];

  // y축 edge label 정렬용 변수
  const yLabelColor = yAxis?.labelColor ?? sz?.numberColor ?? sz?.axisColor ?? CHART_COLORS.NEUTRAL_50;
  const yLabelFontSize = yAxis?.fontSize ?? sz?.numberFontSize ?? 9;
  const yLabelFontFamily = yAxis?.fontFamily ?? CHART_FONT.familyShort;
  // inverse=true 이면 min이 상단, max가 하단; inverse=false이면 반대
  const yTopValue = yAxis?.inverse ? yAxisMin : yAxisMax;
  const yBottomValue = yAxis?.inverse ? yAxisMax : yAxisMin;
  const yEdgeFormatter = yAxis?.alignEdgeLabels
    ? (value: number | string) => {
        const num = Number(value);
        const base = labelFormatter ? labelFormatter(num) : String(num);
        if (Math.abs(num - yTopValue) < 0.001) return `\n${base}`;
        if (Math.abs(num - yBottomValue) < 0.001) return `${base}\n`;
        return base;
      }
    : labelFormatter;

  // x축 edge label rich text 설정
  const xLabelColor = xAxis?.labelColor ?? sz?.numberColor ?? sz?.axisColor ?? CHART_COLORS.NEUTRAL_50;
  const xLabelFontSize = xAxis?.fontSize ?? sz?.numberFontSize ?? 9;
  const xLabelFontFamily = xAxis?.fontFamily ?? CHART_FONT.familyShort;
  // x축 hover 시 해당 tick 라벨 컬러만 primary-15로 변경
  const xAxisLabelConfig = (() => {
    const hoverStyle = { color: CHART_COLORS.PRIMARY_15, fontSize: xLabelFontSize, fontWeight: 600, fontFamily: xLabelFontFamily };
    const rich: any = { hover: hoverStyle };

    if (xAxis?.alignEdgeLabels) {
      const edgeBase = { fontSize: xLabelFontSize, fontWeight: sz?.numberFontWeight, fontFamily: xLabelFontFamily, color: xLabelColor };
      rich.lEdge = { width: 20, align: "right" as const, ...edgeBase };
      rich.rEdge = { width: 20, align: "left" as const, ...edgeBase };
      rich.lHover = { ...rich.lEdge, ...hoverStyle };
      rich.rHover = { ...rich.rEdge, ...hoverStyle };
    }

    const formatter = (value: number | string) => {
      const num = Number(value);
      const base = labelFormatter ? labelFormatter(num) : String(num);
      const isHovered = hoveredX !== null && Math.abs(num - hoveredX) < 0.5;

      if (xAxis?.alignEdgeLabels) {
        if (Math.abs(num - xAxisMin) < 0.001) return isHovered ? `{lHover|${base}}` : `{lEdge|${base}}`;
        if (Math.abs(num - xAxisMax) < 0.001) return isHovered ? `{rHover|${base}}` : `{rEdge|${base}}`;
      }

      return isHovered ? `{hover|${base}}` : base;
    };

    return { rich, formatter };
  })();

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis" as const,
      axisPointer: {
        type: "cross" as const,
        lineStyle: { color: CHART_COLORS.NEUTRAL_50, type: "dashed" },
        crossStyle: { color: CHART_COLORS.NEUTRAL_50, type: "dashed" },
        label: {
          show: true,
          backgroundColor: "transparent",
          color: CHART_COLORS.PRIMARY_15,
          fontSize: sz?.numberFontSize ?? 10,
          fontFamily: CHART_FONT.familyShort,
          fontWeight: sz?.numberFontWeight ?? 500,
          formatter: (params: any) => {
            if (params.axisDimension === "x") return "";
            return Number(params.value).toFixed(1);
          },
        },
      },
      ...tooltipBase,
      textStyle: { ...tooltipBase.textStyle, color: CHART_COLORS.NEUTRAL_50 },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return "";
        const month = Number(params[0].value[0]);
        const filtered = params.filter((p: any) => !p.seriesName.endsWith(" Error") && p.seriesName !== "Mean" && p.seriesName !== "Center Guide" && p.seriesName !== "Zero Line");
        let html = tooltipTitle(`${month.toFixed(1)} month`);
        filtered.forEach((p: any) => {
          html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 0"><span style="display:flex;align-items:center;gap:2px">${p.marker}<span style="color:var(--chart-text-axis-value);font-size:9px">${p.seriesName}</span></span><span style="color:var(--chart-text-axis-value);font-size:14px;font-weight:600">${Number(p.value[1]).toFixed(1)}</span></div>`;
        });
        return html;
      },
    },
    legend: { show: false },
    grid: {
      left: grid?.left ?? 12,
      right: grid?.right ?? 12,
      top: grid?.top ?? 0,
      bottom: grid?.bottom ?? 0,
      containLabel: grid?.containLabel ?? true,
    },
    xAxis: {
      type: "value",
      min: xAxisMin,
      max: xAxisMax,
      interval: xAxisInterval,
      splitLine: {
        show: xAxis?.splitLine ?? false,
        lineStyle: {
          color: xAxis?.splitLineColor ?? sz?.splitLineColor ?? CHART_COLORS.SPLIT_LINE_DASHED,
          width: 1,
        },
      },
      axisLine: { show: true, onZero: xAxis?.onZero ?? true, lineStyle: { color: xAxis?.axisLineColor ?? sz?.axisLineColor ?? sz?.axisColor ?? "#9A9AA3", width: sz?.axisWidth ?? 1 } },
      axisTick: { show: false },
      axisLabel: { color: xLabelColor, fontSize: xLabelFontSize, fontWeight: sz?.numberFontWeight, fontFamily: xLabelFontFamily, margin: 4, ...xAxisLabelConfig },
      name: xAxis?.name,
      nameLocation: "middle",
      nameGap: xAxis?.nameGap ?? 24,
      nameTextStyle: {
        color: xAxis?.nameColor ?? sz?.axisColor ?? CHART_COLORS.NEUTRAL_50,
        fontSize: xAxis?.nameFontSize ?? sz?.labelFontSize ?? 9,
        fontWeight: xAxis?.nameFontSize ? undefined : sz?.labelFontWeight,
        fontFamily: xAxis?.fontFamily ?? CHART_FONT.familyShort,
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
          color: yAxis?.splitLineColor ?? sz?.splitLineColor ?? CHART_COLORS.SPLIT_LINE_DASHED,
          width: 1,
        },
      },
      axisTick: { show: yAxis?.showTick ?? false },
      axisLabel: {
        show: yAxis?.showLabels ?? false,
        color: yLabelColor,
        fontSize: yLabelFontSize,
        fontWeight: sz?.numberFontWeight,
        fontFamily: yLabelFontFamily,
        ...(yEdgeFormatter ? { formatter: yEdgeFormatter } : {}),
      },
      axisLine: { show: true, lineStyle: { color: yAxis?.axisLineColor ?? sz?.axisLineColor ?? sz?.axisColor ?? "#9A9AA3", width: sz?.axisWidth ?? 1 } },
      name: yAxis?.name,
      nameLocation: "middle",
      nameGap: yAxis?.nameGap ?? 28,
      nameRotate: yAxis?.nameRotate ?? 90,
      nameTextStyle: {
        color: yAxis?.nameColor ?? sz?.axisColor ?? CHART_COLORS.NEUTRAL_50,
        fontSize: yAxis?.nameFontSize ?? sz?.labelFontSize ?? 8,
        fontWeight: yAxis?.nameFontSize ? undefined : sz?.labelFontWeight,
        fontFamily: yAxis?.fontFamily ?? CHART_FONT.familyShort,
        align: "center",
      },
    },
    ...animationWithUpdate,
    series: [
      ...zeroLineSeries,
      ...guideSeries,
      ...meanSeries,
      ...dynamicSeries,
    ],
  };

  return <ReactECharts ref={chartRef} option={option} style={{ width: "100%", height }} />;
};
