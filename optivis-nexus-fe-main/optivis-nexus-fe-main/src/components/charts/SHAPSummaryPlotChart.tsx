"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { CallbackDataParams, TopLevelFormatterParams } from "echarts/types/dist/shared";

export type SHAPSummaryFeature = {
  rank: number;
  feature_name: string;
  shap_value: Array<number | string>;
  color_value: Array<number | string>;
};

interface SHAPSummaryPlotChartProps {
  data?: SHAPSummaryFeature[];
  showTooltip?: boolean;
}

const jitterFromIndex = (i: number): number => {
  const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const fractional = seed - Math.floor(seed);
  return (fractional - 0.5) * 0.48;
};

export const SHAPSummaryPlotChart = ({
  data = [],
  showTooltip = true,
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

    const featureSet = Array.from(new Set(points.map((item) => item.feature)));

    const featureOrder = featureSet
      .map((feature) => {
        const featurePoints = points.filter((item) => item.feature === feature);
        const avgAbs =
          featurePoints.reduce((acc, item) => acc + Math.abs(item.shap), 0) /
          Math.max(featurePoints.length, 1);
        return { feature, avgAbs };
      })
      .sort((left, right) => right.avgAbs - left.avgAbs)
      .map((item) => item.feature)
      .slice(0, 10);

    const chartData = points
      .filter((item) => featureOrder.includes(item.feature))
      .map((item, index) => {
        const featureIndex = featureOrder.indexOf(item.feature);
        const y = featureIndex + jitterFromIndex(index);
        return [item.shap, y, item.colorValue, item.feature] as [number, number, number, string];
      });

    const maxAbsShap = chartData.reduce((acc, [x]) => Math.max(acc, Math.abs(x)), 0.1);
    const xLimit = Math.ceil(maxAbsShap * 10) / 10;
    const colorValues = chartData.map(([, , value]) => value);
    const colorMin = colorValues.length > 0 ? Math.min(...colorValues) : 0;
    const colorMax = colorValues.length > 0 ? Math.max(...colorValues) : 1;
    const colorRange = colorMax === colorMin ? 1 : colorMax - colorMin;

    const interpolateColor = (t: number) => {
      const r = Math.round(0xd8 + (0x23 - 0xd8) * t);
      const g = Math.round(0xd3 + (0x1f - 0xd3) * t);
      const b = Math.round(0xff + (0x52 - 0xff) * t);
      return `rgb(${r},${g},${b})`;
    };

    const option: EChartsOption = {
      animation: true,
      grid: {
        top: 0,
        left: 12,
        right: 6,
        bottom: 0,
        containLabel: true,
      },
      tooltip: showTooltip
        ? {
            trigger: "item",
            padding: [4, 6],
            textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 },
            formatter: (params: TopLevelFormatterParams) => {
              const item = Array.isArray(params) ? params[0] : params;
              if (!item || !("value" in item)) {
                return "";
              }

              const value = Array.isArray(item.value) ? item.value : [];
              const shap = Number(value[0] ?? 0);
              const colorValue = Number(value[2] ?? 0);
              const name = String(value[3] ?? "");
              return `${name}<br/>SHAP: ${shap.toFixed(3)}<br/>Color value: ${colorValue.toFixed(3)}`;
            },
          }
        : { show: false, trigger: "none" },
      xAxis: {
        type: "value",
        min: -xLimit,
        max: xLimit,
        splitLine: { show: true, lineStyle: { color: "#efeff4", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "value",
        min: -1,
        max: featureOrder.length - 0.5,
        interval: 1,
        splitLine: { show: true, lineStyle: { color: "#E2E1E5" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#787776",
          fontSize: 10,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          formatter: (value) => {
            const index = Math.round(Number(value));
            return featureOrder[index] ?? "";
          },
        },
        inverse: true,
      },
      visualMap: {
        show: false,
        min: colorMin,
        max: colorMax === colorMin ? colorMin + 1 : colorMax,
        dimension: 2,
        inRange: {
          color: ["#D8D3FF", "#231F52"],
        },
      },
      series: [
        {
          type: "scatter",
          data: chartData,
          symbolSize: 7,
          itemStyle: {
            opacity: 0.9,
            color: (params: CallbackDataParams) => {
              const value = Array.isArray(params.value) ? params.value : [];
              const currentColorValue = Number(value[2] ?? 0);
              const t = (currentColorValue - colorMin) / colorRange;
              return interpolateColor(Math.max(0, Math.min(1, t)));
            },
          },
          emphasis: { scale: 1.05 },
        },
      ],
    };

    return { option };
  }, [data, showTooltip]);

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
};
