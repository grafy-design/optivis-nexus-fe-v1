"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import { ATS_REPORT_COLORS, BAR_RADIUS, tooltipAxisShadow } from "@/lib/chart-styles";
import type { TypeSafetyResult } from "@/services/studyService";

export interface Step1TypeISafetyChartProps {
  apiData: { result_type_safety?: TypeSafetyResult[] } | null;
}

export function Step1TypeISafetyChart({ apiData }: Step1TypeISafetyChartProps) {
  const typeSafetyData = apiData?.result_type_safety || [];
  const allXAxisData = typeSafetyData.map((item) => item.p_value.toFixed(2));
  const barData = typeSafetyData.map((item) => item.count);
  const expectedValue =
    typeSafetyData.length > 0 ? typeSafetyData[0].expected_under_uniform : 0.5;

  const option = {
    tooltip: { ...tooltipAxisShadow },
    legend: { show: false },
    grid: {
      left: "4%",
      right: "3%",
      top: "8%",
      bottom: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      name: "P-value",
      nameLocation: "middle",
      nameGap: 16,
      ...CHART_AXIS_NAME,
      data: allXAxisData,
      axisLabel: {
        ...CHART_AXIS_LABEL,
        formatter: (_value: string, index: number) => {
          const len = allXAxisData.length;
          if (len === 0) return "";
          if (index === len - 1) return "1.0";
          const pValue = index * 0.05;
          if (index % 4 === 0) return pValue.toFixed(1);
          return "";
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "Count",
      nameLocation: "middle",
      nameGap: 26,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: { show: false },
      axisTick: { show: true },
      splitLine: CHART_Y_AXIS_SPLIT_LINE,
      
    },
    series: [
      {
        type: "bar",
        data: barData,
        itemStyle: {
          color: ATS_REPORT_COLORS.unadjusted,
          borderRadius: BAR_RADIUS.allSmall,
        },
        barWidth: "90%",
        barGap: "10%",
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: ATS_REPORT_COLORS.markLine,
            type: "dashed",
            width: 1.5,
          },
          data: [{ yAxis: expectedValue }],
        },
        markArea: {
          silent: true,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: ATS_REPORT_COLORS.gradientTop },
                { offset: 1, color: "rgba(255, 255, 255, 0.0)" },
              ],
            },
          },
          data: [[{ yAxis: 0 }, { yAxis: expectedValue }]],
        },
      },
      {
        name: "Expected (Uniform)",
        type: "line",
        data: [],
        lineStyle: {
          color: ATS_REPORT_COLORS.markLine,
          type: "dashed",
          width: 1,
        },
        symbol: "none",
        symbolSize: 0,
        showSymbol: false,
      },
    ],
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="px-4 pt-2 pb-1 flex-shrink-0">
        <p className="text-small1 text-neutral-30">P-value distribution under H0</p>
        <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
      </div>
      <div className="flex-1 min-h-0 w-full bg-white rounded-[4px] overflow-hidden">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
        <div
          className="absolute text-small1 text-[var(--chart-text-category-title)] gap-1"
          style={{
            left: "55px",
            bottom: "15%",
            display: "inline-flex",
            padding: "4px 8px",
            alignItems: "center",
            border: "1px solid var(--chart-legend-border)",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <span
            className="inline-block shrink-0 border-t border-dashed border-[var(--chart-ats-markline)]"
            style={{ width: 20, borderWidth: 1 }}
          />
          <span>Expected (Uniform)</span>
        </div>
      </div>
    </div>
  );
}
