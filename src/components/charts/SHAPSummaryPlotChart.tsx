"use client";

/** SHAPSummaryPlotChart — SHAP 값 기반 피처 중요도 요약 산점도 (색상으로 피처값 표현) */

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  SHAP_COLORS,
  CHART_COLORS,
  tooltipItem,
  tooltipTitle,
  tooltipRow,
  tooltipWrap,
  axisLabelBase,
  animationDefault,
} from "@/lib/chart-styles";

export type SHAPSummaryFeature = {
  rank: number;
  feature_name: string;
  shap_value: Array<number | string>;
  color_value: Array<number | string>;
};

interface SHAPSummaryPlotChartProps {
  data?: SHAPSummaryFeature[];
  title?: string;
}

const jitterFromIndex = (i: number): number => {
  const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const fractional = seed - Math.floor(seed);
  return (fractional - 0.5) * 0.48;
};

export const SHAPSummaryPlotChart = ({
  data = [],
  title = "Baseline driver Top 10",
}: SHAPSummaryPlotChartProps) => {
  const { option } = useMemo(() => {
    const points = data.flatMap((item) => {
      const size = Math.min(item.shap_value.length, item.color_value.length);

      return Array.from({ length: size }, (_, index) => {
        const shap = Number(item.shap_value[index]);
        const colorValue = Number(item.color_value[index]);

        return {
          feature: item.feature_name,
          shap,
          colorValue,
        };
      }).filter((point) => Number.isFinite(point.shap) && Number.isFinite(point.colorValue));
    });

    const featureSet = Array.from(new Set(points.map((d) => d.feature)));

    const featureOrder = featureSet
      .map((feature) => {
        const featurePoints = points.filter((d) => d.feature === feature);
        const avgAbs =
          featurePoints.reduce((acc, p) => acc + Math.abs(p.shap), 0) /
          Math.max(featurePoints.length, 1);
        return { feature, avgAbs };
      })
      .sort((a, b) => b.avgAbs - a.avgAbs)
      .map((item) => item.feature)
      .slice(0, 10);

    const filteredPoints = points.filter((d) => featureOrder.includes(d.feature));

    const chartData = filteredPoints
      .map((d, i) => {
        const idx = featureOrder.indexOf(d.feature);
        const y = idx + jitterFromIndex(i);
        return [d.shap, y, d.colorValue, d.feature] as [number, number, number, string];
      });

    // 피처별 시리즈 데이터 분리 (행 단위 강조용)
    const seriesByFeature = featureOrder.map((feature) =>
      chartData.filter(([, , , f]) => f === feature)
    );

    const maxAbsShap = chartData.reduce((acc, [x]) => Math.max(acc, Math.abs(x)), 0.1);
    const xLimit = Math.ceil(maxAbsShap * 10) / 10;

    const colorValues = chartData.map(([, , v]) => v);
    const colorMin = colorValues.length > 0 ? Math.min(...colorValues) : 0;
    const colorMax = colorValues.length > 0 ? Math.max(...colorValues) : 1;
    const colorRange = colorMax === colorMin ? 1 : colorMax - colorMin;
    const interpolateColor = (t: number) => {
      const r = Math.round(0xD8 + (0x23 - 0xD8) * t);
      const g = Math.round(0xD3 + (0x1F - 0xD3) * t);
      const b = Math.round(0xFF + (0x52 - 0xFF) * t);
      return `rgb(${r},${g},${b})`;
    };
    const interpolateEmphasisColor = (t: number) => {
      const r = Math.round(0xBF + (0x23 - 0xBF) * t);
      const g = Math.round(0xB0 + (0x13 - 0xB0) * t);
      const b = Math.round(0xF8 + (0x68 - 0xF8) * t);
      return `rgb(${r},${g},${b})`;
    };

    const baseOption: EChartsOption = {
      ...animationDefault,
      title: {
        text: "",
        left: 0,
        top: 0,
        textStyle: {
          fontSize: 24,
          fontWeight: 600,
          color: "#231f52",
          fontFamily: "Inter, sans-serif",
          // @ts-ignore
          letterSpacing: -0.72,
        },
      },
      grid: {
        top: 0,
        left: 12,
        right: 6,
        bottom: 0,
        containLabel: true,
      },
      tooltip: {
        ...tooltipItem,
        axisPointer: { type: "shadow", axis: "y" },
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          if (!item || !("value" in item)) {
            return "";
          }
          const value = Array.isArray(item.value) ? item.value : [];
          const shap = Number(value[0] ?? 0);
          const cv = Number(value[2] ?? 0);
          const name = String(value[3] ?? "");
          return tooltipWrap(
            tooltipTitle(name) +
            tooltipRow("", "SHAP", shap.toFixed(3)) +
            tooltipRow("", "Color value", cv.toFixed(3))
          );
        },
      },
      xAxis: {
        type: "value",
        min: -xLimit ,
        max: xLimit,
        splitLine: { show: true, lineStyle: { color: CHART_COLORS.NEUTRAL_95, type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "value",
        min: - 1,
        max: featureOrder.length - 0.5,
        interval: 1,
        splitLine: { show: true, lineStyle: { color: CHART_COLORS.SPLIT_LINE_ALT } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...axisLabelBase,
          formatter: (value) => {
            const idx = Math.round(Number(value));
            return featureOrder[idx] ?? "";
          },
        },
        inverse: true,
        axisPointer: {
          show: true,
          type: "shadow",
          shadowStyle: { color: "rgba(216, 211, 255, 0.22)" },
          label: { show: false },
          snap: true,
        },
      },
      visualMap: {
        show: false,
        min: colorMin,
        max: colorMax === colorMin ? colorMin + 1 : colorMax,
        dimension: 2,
        seriesIndex: featureOrder.map((_, i) => i),
        inRange: {
          color: [SHAP_COLORS.low, SHAP_COLORS.high],
        },
      },
      series: seriesByFeature.map((featureData, i) => ({
        type: "scatter" as const,
        name: featureOrder[i],
        data: featureData,
        symbolSize: 7,
        itemStyle: {
          opacity: 0.7,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (params: any) => {
            const v = Number(Array.isArray(params.value) ? params.value[2] : 0);
            const t = (v - colorMin) / colorRange;
            return interpolateColor(Math.max(0, Math.min(1, t)));
          },
        },
        emphasis: {
          focus: "series",
          itemStyle: {
            opacity: 1,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: ((params: any) => {
              const v = Number(Array.isArray(params.value) ? params.value[2] : 0);
              const t = (v - colorMin) / colorRange;
              return interpolateEmphasisColor(Math.max(0, Math.min(1, t)));
            }) as any,
          },
          scale: 1.1,
        },
        blur: {
          itemStyle: { opacity: 0.6 },
        },
      })),
    };

    return { option: baseOption };
  }, [data, title]);

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
};
