"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export type SHAPSummaryFeature = {
  rank: number;
  feature_name: string;
  shap_value: Array<number | string>;
  color_value: Array<number | string>;
};

interface SHAPSummaryPlotChartProps {
  data?: SHAPSummaryFeature[];
  height?: number;
  title?: string;
}

const jitterFromIndex = (i: number): number => {
  const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const fractional = seed - Math.floor(seed);
  return (fractional - 0.5) * 0.48;
};

export const SHAPSummaryPlotChart = ({
  data = [],
  height = 360,
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

    const chartData = points
      .filter((d) => featureOrder.includes(d.feature))
      .map((d, i) => {
        const idx = featureOrder.indexOf(d.feature);
        const y = idx + jitterFromIndex(i);
        return [d.shap, y, d.colorValue, d.feature] as [number, number, number, string];
      });

    const maxAbsShap = chartData.reduce((acc, [x]) => Math.max(acc, Math.abs(x)), 0.1);
    const xLimit = Math.ceil(maxAbsShap * 10) / 10;
    const colorValues = chartData.map(([, , value]) => value);
    const colorMin = colorValues.length > 0 ? Math.min(...colorValues) : 0;
    const colorMax = colorValues.length > 0 ? Math.max(...colorValues) : 1;
    const visualMax = colorMax === colorMin ? colorMin + 1 : colorMax;

    const baseOption: EChartsOption = {
      animation: false,
      title: {
        text: title,
        left: 0,
        top: 0,
        textStyle: {
          fontSize: 18,
          fontWeight: 700,
          color: "#231f52",
        },
      },
      grid: {
        top: 52,
        left: 110,
        right: 56,
        bottom: 24,
      },
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          if (!item || !("value" in item)) {
            return "";
          }
          const value = Array.isArray(item.value) ? item.value : [];
          const shap = Number(value[0] ?? 0);
          const cv = Number(value[2] ?? 0);
          const name = String(value[3] ?? "");
          return `${name}<br/>SHAP: ${shap.toFixed(3)}<br/>Color value: ${cv.toFixed(3)}`;
        },
      },
      xAxis: {
        type: "value",
        min: -xLimit,
        max: xLimit,
        splitLine: { show: true, lineStyle: { color: "#E6E6ED" } },
        axisLine: { lineStyle: { color: "#B4B4BE" } },
        axisTick: { show: false },
        axisLabel: { color: "#77788A", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        min: -0.5,
        max: featureOrder.length - 0.5,
        interval: 1,
        splitLine: { show: true, lineStyle: { color: "#ECECF2" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#5F6072",
          fontSize: 11,
          formatter: (value) => {
            const idx = Math.round(Number(value));
            return featureOrder[idx] ?? "";
          },
        },
        inverse: true,
      },
      visualMap: {
        min: colorMin,
        max: visualMax,
        dimension: 2,
        orient: "vertical",
        right: 0,
        top: "middle",
        text: ["High", "Low"],
        calculable: false,
        itemHeight: 140,
        textStyle: { color: "#5F6072", fontSize: 11 },
        inRange: {
          color: ["#D8D3FF", "#231F52"],
        },
      },
      series: [
        {
          type: "scatter",
          data: chartData,
          symbolSize: 7,
          itemStyle: { opacity: 0.9 },
          emphasis: { scale: 1.05 },
        },
      ],
    };

    return { option: baseOption };
  }, [data, title]);

  return <ReactECharts option={option} style={{ width: "100%", height }} />;
};
