"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_AXIS_LINE,
  CHART_AXIS_TICK,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import { tooltipItem } from "@/lib/chart-styles";
import type { VarianceDeclineResult } from "@/services/studyService";

export interface Step2VarianceDeclineChartProps {
  apiData: { result_variancedecline?: VarianceDeclineResult[] } | null;
}

export function Step2VarianceDeclineChart({
  apiData,
}: Step2VarianceDeclineChartProps) {
  const varianceDecline = apiData?.result_variancedecline || [];
  /** x축 수치: R² 값 (0.1, 0.2, 0.3, ...) */
  const xValues =
    varianceDecline.length > 0
      ? varianceDecline.map((r) => Number(r.model_performance))
      : [];
  /** variance 배열에서 median 구해서 y값으로 사용 */
  const lineData =
    varianceDecline.length > 0
      ? varianceDecline.map((r) => {
          try {
            const arr = JSON.parse(r.variance);
            const nums = Array.isArray(arr) ? arr : [];
            if (nums.length === 0) return 0;
            const sorted = [...nums].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median =
              sorted.length % 2 === 1
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
            return Number(Number(median).toFixed(6));
          } catch {
            return 0;
          }
        })
      : [];

  /** 라인 데이터: [x, y] 쌍 (0.1일 때 y, 0.2일 때 y, ...) */
  const linePoints =
    xValues.length === lineData.length
      ? xValues.map((x, i) => [x, lineData[i]] as [number, number])
      : [];

  /** 점선 y값 = 데이터 첫 번째 인덱스의 y값 */
  const MARK_LINE_Y = lineData.length > 0 ? lineData[0] : null;
  const xMin = 0;
  const xMax = 1;

  const option = {
    tooltip: { ...tooltipItem },
    animation: false,
    grid: {
      left: 0,
      right: 4,
      top: 0,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
      type: "value" as const,
      name: "R²",
      nameLocation: "middle",
      nameGap: 20,
      min: 0,
      max: 1,
      interval: 0.1,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_AXIS_TICK,
    },
    yAxis: {
      ...CHART_AXIS_NAME,
      type: "value" as const,
      name: "Variance",
      nameLocation: "middle",
      nameGap: 36,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_AXIS_TICK,
      splitLine: CHART_Y_AXIS_SPLIT_LINE,
    },
    series: [
      {
        name: "Variance",
        type: "line",
        data: linePoints,
        itemStyle: { color: "#231f52" },
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(35, 31, 82, 0.25)" },
              { offset: 1, color: "rgba(35, 31, 82, 0.02)" },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: "#704ef3",
            type: "dashed",
            width: 1.5,
          },
          data:
            MARK_LINE_Y != null
              ? [
                  [
                    { coord: [xMin, Number(MARK_LINE_Y)] },
                    { coord: [xMax, Number(MARK_LINE_Y)] },
                  ],
                ]
              : [],
        },
      },
    ],
  };

  console.log("yAxis.type", option.yAxis.type);

  return (
    <div className="p-3 flex-1 h-full flex flex-col overflow-hidden">
      <div className=" flex-shrink-0">
        <p className="text-body5 text-neutral-30">Variance Decline</p>
        <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
      </div>
      <div className="flex-1 min-h-0 bg-white rounded-[4px] overflow-hidden">
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
