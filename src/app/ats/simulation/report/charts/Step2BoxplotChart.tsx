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
import type { EstimatedTreatmentEffectResult } from "@/services/studyService";

export interface Step2BoxplotChartProps {
  apiData: {
    result_estimatedtreatmenteffect?: EstimatedTreatmentEffectResult[];
  } | null;
}

export function Step2BoxplotChart({ apiData }: Step2BoxplotChartProps) {
  const boxplotSource = apiData?.result_estimatedtreatmenteffect || [];
  const hasBoxplot = Array.isArray(boxplotSource) && boxplotSource.length > 0;
  const xAxisDataBox = hasBoxplot
    ? boxplotSource.map((r) => String(r.model_performance))
    : [];

  const option = {
    tooltip: { ...tooltipItem },
    grid: {
      left: 0,
      right: 4,
      top: 0,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      name: "R²",
      nameLocation: "middle",
      nameGap: 20,
      ...CHART_AXIS_NAME,
      data: hasBoxplot ? xAxisDataBox : [],
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_AXIS_TICK,
    },
    yAxis: {
      type: "value" as const,
      name: "β",
      nameLocation: "middle",
      nameGap: 28,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_AXIS_TICK,
      splitLine: CHART_Y_AXIS_SPLIT_LINE,
    },
    series: hasBoxplot
      ? (() => {
          const boxplotData: number[][] = [];
          const outlierData: (number | string)[][] = [];
          const allValues: number[] = []; // 전체 데이터 mean 계산용

          boxplotSource.forEach((r, idx) => {
            try {
              const raw = r.estimated_treatment_effect;
              const arr =
                typeof raw === "string"
                  ? JSON.parse(raw)
                  : Array.isArray(raw)
                  ? raw
                  : [];
              const nums = Array.isArray(arr)
                ? arr.map(Number).filter((n) => !Number.isNaN(n))
                : [];

              // 전체 데이터 수집
              allValues.push(...nums);

              if (nums.length >= 5) {
                const sorted = [...nums].sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const median = sorted[Math.floor(sorted.length * 0.5)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                const lowerFence = q1 - 1.5 * iqr;
                const upperFence = q3 + 1.5 * iqr;

                // 아웃라이어: fence 밖의 값들
                const outliers = nums.filter(
                  (n) => n < lowerFence || n > upperFence
                );
                outliers.forEach((outlier) => {
                  outlierData.push([idx, outlier]);
                });

                // Boxplot: [min, q1, median, q3, max] (fence 내 값만)
                const inRange = sorted.filter(
                  (n) => n >= lowerFence && n <= upperFence
                );
                const min = inRange.length > 0 ? inRange[0] : sorted[0];
                const max =
                  inRange.length > 0
                    ? inRange[inRange.length - 1]
                    : sorted[sorted.length - 1];
                boxplotData.push([min, q1, median, q3, max]);
              } else {
                boxplotData.push([0, 0, 0, 0, 0]);
              }
            } catch {
              boxplotData.push([0, 0, 0, 0, 0]);
            }
          });

          // 전체 데이터의 mean
          const overallMean =
            allValues.length > 0
              ? allValues.reduce((a, b) => a + b, 0) / allValues.length
              : null;

          return [
            {
              name: "Boxplot",
              type: "boxplot",
              data: boxplotData,
              itemStyle: {
                color: "#231f52", // 진한 인디고/보라색 박스
                borderColor: "#AAAAAD",
                borderWidth: 1,
              },
              boxWidth: [10, 24],
            },
            {
              name: "Outliers",
              type: "scatter",
              data: outlierData,
              itemStyle: {
                color: "transparent", // 채우기 투명
                borderColor: "#aaa5e1", // 연한 라벤더/보라색 테두리
                borderWidth: 1,
              },
              symbolSize: 6,
            },
            // 전체 데이터 mean 점선 (연한 라벤더/보라색)
            ...(overallMean != null
              ? [
                  {
                    type: "line" as const,
                    data: [],
                    markLine: {
                      silent: true,
                      symbol: "none",
                      label: { show: false },
                      lineStyle: {
                        color: "#aaa5e1", // 다른 차트와 동일한 보라색
                        type: "dashed",
                        width: 1.5,
                      },
                      data: [{ yAxis: overallMean }],
                    },
                  },
                ]
              : []),
          ];
        })()
      : [],
  };

  return (
    <div className="p-3 flex-1 h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <p className="text-body5 text-neutral-30">Estimated treatment effect</p>
        <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
      </div>
      <div className="flex-1 min-h-0 bg-white rounded-[4px] overflow-hidden">
        <ReactECharts
          notMerge={true}
          lazyUpdate={true}
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
