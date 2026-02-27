"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  chartTitle,
  chartGraphicDivider,
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
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
    title: chartTitle("P-value distribution under H0"),
    graphic: chartGraphicDivider(720),
    legend: { show: false },
    grid: {
      left: "4%",
      right: "3%",
      top: "60px",
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
      axisTick: { show: false },
      splitLine: CHART_Y_AXIS_SPLIT_LINE,
    },
    series: [
      {
        type: "bar",
        data: barData,
        itemStyle: {
          color: "#aaa5e1",
          borderRadius: [6, 6, 6, 6],
        },
        barWidth: "90%",
        barGap: "10%",
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: "#704ef3",
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
                { offset: 0, color: "#E9DDFF" },
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
          color: "#704ef3",
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
    <div className="w-full h-full relative">
      <div className="h-full w-full bg-white rounded-[8px] overflow-hidden">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
        <div
          className="absolute text-small1 text-[#484646]"
          style={{
            left: "55px",
            bottom: "15%",
            display: "inline-flex",
            padding: "4px 8px",
            alignItems: "center",
            gap: 4,
            border: "1px solid var(--M3-ref-neutral-neutral70, #AEA9B1)",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <span
            className="inline-block shrink-0 border-t border-dashed border-[#704ef3]"
            style={{ width: 20, borderWidth: 1 }}
          />
          <span>Expected (Uniform)</span>
        </div>
      </div>
    </div>
  );
}
