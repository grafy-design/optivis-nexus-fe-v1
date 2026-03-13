"use client";

/**
 * Step1TypeISafetyChart
 * ATS 리포트 Step 1 — Type I Safety 검증 차트.
 * P-value 분포를 막대 그래프로 시각화하고,
 * 균등 분포 기대값(markLine)과 기대 영역(markArea)을 오버레이로 표시한다.
 */

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_AXIS_LINE,
  CHART_AXIS_TICK,
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
      left: 12,   // 수정: 0→12 — 라벨이 잘리지 않도록 좌측 여백 확보
      right: 4,
      top: 0,
      bottom: 0,
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
        // 4칸 간격으로 라벨 표시 (0.0, 0.4, 0.8 등), 마지막은 "1.0" 고정
        formatter: (_value: string, index: number) => {
          const len = allXAxisData.length;
          if (len === 0) return "";
          if (index === len - 1) return "1.0";
          const pValue = index * 0.05;
          if (index % 4 === 0) return pValue.toFixed(1);
          return "";
        },
      },
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_AXIS_TICK,
    },
    yAxis: {
      type: "value" as const,
      name: "Count",
      nameLocation: "middle",
      nameGap: 18,  // 수정: 26→18 — y축 이름 간격 축소
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_AXIS_TICK,
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
        // 균등 분포 기대값 점선 — Expected (Uniform) 기준선
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
        // 기대값 이하 영역 그라디언트 강조
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
      // 범례용 더미 라인 시리즈 — "Expected (Uniform)" 항목 표시
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
    <div className="w-full h-full relative flex flex-col p-3">
      {/* 패널 헤더: 차트 제목 + 구분선 */}
      <div className="flex-shrink-0">
        <p className="text-body5 text-neutral-30">P-value distribution under H0</p>
        <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
      </div>

      {/* 차트 영역 */}
      <div className="flex-1 min-h-0 w-full bg-white rounded-[4px] overflow-hidden">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
        {/*
         * 인라인 범례 라벨 — absolute 위치
         * 수정: left "55px"→"3px" — 그리드 좌측 여백 변경에 맞춰 조정
         */}
        <div
          className="absolute text-small2 text-[var(--chart-text-category-title)] gap-1"
          style={{
            left: "3px",
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
