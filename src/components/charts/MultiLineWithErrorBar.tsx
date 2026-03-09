"use client";

import React, { useState, useRef, useEffect } from "react";
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
  showTick?: boolean;
  alignEdgeLabels?: boolean;
  onZero?: boolean;
  zeroLineColor?: string;
}

export type ChartSizeVariant = "XS" | "S" | "M" | "L";

const NEUTRAL_30 = "#484646";
const NEUTRAL_95 = "#efeff4";

type ChartSizeStyle = {
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

const CHART_SIZE_STYLES: Record<ChartSizeVariant, ChartSizeStyle> = {
  XS: { labelFontSize: 9, labelFontWeight: 400, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  S:  { labelFontSize: 10.5, labelFontWeight: 600, numberFontSize: 10.5, numberFontWeight: 600, axisColor: "#787776", numberColor: "#787776", axisLineColor: "#787776", axisWidth: 1, splitLineColor: NEUTRAL_95, labelDecimalPlaces: 0 },
  M:  { labelFontSize: 15, labelFontWeight: 600, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
  L:  { labelFontSize: 19.5, labelFontWeight: 600, numberFontSize: 9, axisColor: NEUTRAL_30, axisWidth: 1, splitLineColor: NEUTRAL_95 },
};

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

const DEFAULT_GROUP_COLORS = [
  "#F07A22",
  "#4B3DF2",
  "#262255",
  "#E04A7A",
  "#8C62FF",
  "#2F89FC",
  "#F1B316",
];

const hexToRgba = (hex: string, alpha: number): string => {
  if (hex.startsWith("rgba(") || hex.startsWith("rgb(")) return hex;
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => `${c}${c}`).join("") : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return `rgba(120,120,120,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
};

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
  const groupColors = colors && colors.length > 0 ? colors : DEFAULT_GROUP_COLORS;
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

  // 라인 그라디언트 생성 — 호버 그래프는 넓은 범위, 비호버는 좁은 범위
  const buildLineGradient = (color: string, isActive: boolean): any => {
    if (hoveredX === null) return color;
    const center = (hoveredX - xAxisMin) / xRange;
    const spread = isActive ? 0.38 : 0.18;
    const peakA = isActive ? 1 : 0.45;
    const baseA = isActive ? 0.4 : 0.06;
    const fs = Math.max(0, center - spread);
    const fe = Math.min(1, center + spread);
    const stops: { offset: number; color: string }[] = [];
    if (fs > 0.001) stops.push({ offset: 0, color: hexToRgba(color, baseA) });
    stops.push({ offset: fs, color: hexToRgba(color, baseA) });
    stops.push({ offset: center, color: hexToRgba(color, peakA) });
    stops.push({ offset: fe, color: hexToRgba(color, baseA) });
    if (fe < 0.999) stops.push({ offset: 1, color: hexToRgba(color, baseA) });
    return { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: stops };
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
        lineStyle: { width: lineWidth, color: buildLineGradient(color, isActive) },
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
      lineStyle: { color: "#787776", width: lineWidth, type: [4, 2] as number[] },
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

  // y축 edge label 정렬용 변수 / Y-axis edge label variables
  const yLabelColor = yAxis?.labelColor ?? sz?.numberColor ?? sz?.axisColor ?? "#787776";
  const yLabelFontSize = yAxis?.fontSize ?? sz?.numberFontSize ?? 9;
  const yLabelFontFamily = yAxis?.fontFamily ?? "Inter";
  // inverse=true 이면 min이 상단, max가 하단; inverse=false이면 반대
  const yTopValue = yAxis?.inverse ? yAxisMin : yAxisMax;
  const yBottomValue = yAxis?.inverse ? yAxisMax : yAxisMin;
  const yEdgeFormatter = yAxis?.alignEdgeLabels
    ? (value: number | string) => {
        const num = Number(value);
        const base = labelFormatter ? labelFormatter(num) : String(num);
        // 상단 레이블: 빈 줄 추가 → 텍스트 블록 전체가 tick 기준 아래로 이동
        if (Math.abs(num - yTopValue) < 0.001) return `\n${base}`;
        // 하단 레이블: 뒤에 빈 줄 추가 → 텍스트 블록 전체가 tick 기준 위로 이동
        if (Math.abs(num - yBottomValue) < 0.001) return `${base}\n`;
        return base;
      }
    : labelFormatter;

  // x축 edge label rich text 설정 / X-axis edge label rich text config
  const xLabelColor = xAxis?.labelColor ?? sz?.numberColor ?? sz?.axisColor ?? "#787776";
  const xLabelFontSize = xAxis?.fontSize ?? sz?.numberFontSize ?? 9;
  const xLabelFontFamily = xAxis?.fontFamily ?? "Inter";
  // x축 hover 시 해당 tick 라벨 컬러만 primary-15로 변경
  const xAxisLabelConfig = (() => {
    const hoverStyle = { color: "#262255", fontSize: xLabelFontSize, fontWeight: 600, fontFamily: xLabelFontFamily };
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
        lineStyle: { color: "#787776", type: "dashed" },
        crossStyle: { color: "#787776", type: "dashed" },
        label: {
          show: true,
          backgroundColor: "transparent",
          color: "#262255",
          fontSize: sz?.numberFontSize ?? 10,
          fontFamily: "Inter",
          fontWeight: sz?.numberFontWeight ?? 500,
          formatter: (params: any) => {
            if (params.axisDimension === "x") return "";
            return Number(params.value).toFixed(1);
          },
        },
      },
      padding: [4, 6],
      borderWidth: 0,
      borderColor: "transparent",
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
      textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600, color: "#787776" },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return "";
        const month = Number(params[0].value[0]);
        const filtered = params.filter((p: any) => !p.seriesName.endsWith(" Error") && p.seriesName !== "Mean" && p.seriesName !== "Center Guide" && p.seriesName !== "Zero Line");
        let html = `<div style="font-size:12px;font-family:Inter;color:#787776;font-weight:600;margin-bottom:4px">${month.toFixed(1)} month</div>`;
        filtered.forEach((p: any) => {
          html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 0"><span style="display:flex;align-items:center;gap:2px">${p.marker}<span style="color:#787776;font-size:9px">${p.seriesName}</span></span><span style="color:#787776;font-size:14px;font-weight:600">${Number(p.value[1]).toFixed(1)}</span></div>`;
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
          color: xAxis?.splitLineColor ?? sz?.splitLineColor ?? "#D8D7DF",
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
        color: xAxis?.nameColor ?? sz?.axisColor ?? "#787776",
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
        color: yAxis?.nameColor ?? sz?.axisColor ?? "#787776",
        fontSize: yAxis?.nameFontSize ?? sz?.labelFontSize ?? 8,
        fontWeight: yAxis?.nameFontSize ? undefined : sz?.labelFontWeight,
        fontFamily: yAxis?.fontFamily ?? "Inter",
        align: "center",
      },
    },
    animationDuration: 300,
    animationDurationUpdate: 150,
    animationEasing: "cubicOut",
    series: [
      ...zeroLineSeries,
      ...guideSeries,
      ...meanSeries,
      ...dynamicSeries,
    ],
  };

  return <ReactECharts ref={chartRef} option={option} style={{ width: "100%", height }} />;
};
