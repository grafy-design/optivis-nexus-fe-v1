"use client";

/**
 * Step1TypeISafetyChart
 * ATS 리포트 Step 1 — Type I Safety 검증 차트.
 * P-value 분포를 막대 그래프로 시각화하고,
 * 균등 분포 기대값(markLine)과 기대 영역(markArea)을 오버레이로 표시한다.
 *
 * 주요 수정사항:
 * - 툴팁: tooltipAxisShadow 기반 axis 트리거 + tooltipDotRow/tooltipTitle/tooltipWrap 헬퍼로 TSI 리포트와 통일
 * - markLine 라벨: "Expected (Uniform)" 텍스트를 차트 위에 직접 표시 (Inter, neutral-30 색상)
 * - 그리드/축 스타일: chartStyles.ts 공통 상수(CHART_AXIS_LABEL, CHART_AXIS_LINE 등) 적용
 */

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_AXIS_LINE,
  CHART_AXIS_TICK,
  CHART_Y_AXIS_TICK,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import { ATS_REPORT_COLORS, BAR_RADIUS, tooltipAxisShadow, tooltipDotRow, tooltipTitle, tooltipWrap } from "@/lib/chart-styles";
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
    tooltip: {
      ...tooltipAxisShadow,
      appendToBody: true,
      axisPointer: {
        ...tooltipAxisShadow.axisPointer,
        label: {
          ...tooltipAxisShadow.axisPointer.label,
          margin: 4,
          padding: [0, 0],
        },
      },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const pValue = items[0]?.axisValueLabel ?? "";
        const rows = items
          .filter((item: any) => item.seriesType === "bar")
          .map((item: any) =>
            tooltipDotRow(item.color, "Count", String(item.value ?? 0))
          )
          .join("");
        return tooltipWrap(tooltipTitle(`P-value: ${pValue}`) + rows);
      },
    },
    legend: { show: false },
    grid: {
      left: 16,
      right: 0,
      top: 4,
      bottom: 12,
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
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "Count",
      nameLocation: "middle",
      nameGap: 22,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_Y_AXIS_TICK,
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
          silent: false,
          symbol: "none",
          label: {
            show: true,
            position: "insideEndTop",
            formatter: "Expected (Uniform)",
            fontSize: 9,
            fontFamily: "Inter",
            color: "#484646",
            padding: [1, 0, 0, 0],
          },
          emphasis: {
            label: {
              color: "#262255",
            },
            lineStyle: {
              color: ATS_REPORT_COLORS.markLine,
              type: [4, 4],
              width: 2,
            },
          },
          lineStyle: {
            color: ATS_REPORT_COLORS.markLine,
            type: [4, 4],
            width: 1.5,
          },
          data: [{ yAxis: expectedValue }],
        },
      },
      // 기대값 이하 영역 그라디언트 — 별도 시리즈로 축/막대 뒤에 배치
      {
        type: "bar",
        data: allXAxisData.map(() => null),
        z: -1,
        zlevel: -1,
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
        data: allXAxisData.map(() => null),
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
      {/* 차트 영역 */}
      <div className="flex-1 min-h-0 w-full bg-white rounded-[4px] overflow-hidden">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
