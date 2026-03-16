"use client";

/**
 * Step4DecisionStabilityChart
 * ATS 리포트 Step 4 — Decision Stability 검증 차트.
 * 각 시나리오별 "Go" 결정 확률을 Proposed/Standard 두 그룹 막대로 비교하며,
 * 안정성 임계값(80%) markLine과 그라디언트 markArea를 오버레이로 표시한다.
 *
 * 주요 수정사항:
 * - 툴팁: tooltipAxisShadow(axis 트리거) + tooltipDotRow/tooltipTitle/tooltipWrap 헬퍼로 TSI 리포트와 통일
 * - markLine 라벨: "Target Stability Threshold (80%)" 텍스트를 차트 위에 직접 표시
 * - 레전드: 절대 배치 → 하단 flex 컨테이너로 이동 (bar 아이콘, text-small2, -mb-1)
 * - 안정성 메시지: absolute 오버레이로 "Proposed design remains STABLE" 표시
 * - y축 이름: 괄호 앞 줄바꿈 ('Probability of "Go" Decision\n(Power)')
 * - 그리드: left 24, nameGap 22
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
import type { DecisionStabilityResult } from "@/services/studyService";

export interface Step4DecisionStabilityChartProps {
  apiData: {
    result_decisionstability?: DecisionStabilityResult[];
  } | null;
}

/** 안정성 기준선 — 80% 이상이면 "Stable" */
const STABILITY_THRESHOLD = 0.8;

export function Step4DecisionStabilityChart({
  apiData,
}: Step4DecisionStabilityChartProps) {
  const decisionStabilityData = apiData?.result_decisionstability || [];
  const xAxisData = decisionStabilityData.map((item) => item.scenario);

  // probability_of_go_decision 배열의 [0]: Proposed, [1]: Standard
  const series1Data = decisionStabilityData.map((item) => {
    try {
      const probArray = JSON.parse(item.probability_of_go_decision);
      return probArray[0] || 0;
    } catch {
      return 0;
    }
  });
  const series2Data = decisionStabilityData.map((item) => {
    try {
      const probArray = JSON.parse(item.probability_of_go_decision);
      return probArray[1] || 0;
    } catch {
      return 0;
    }
  });

  const option = {
    tooltip: {
      ...tooltipAxisShadow,
      appendToBody: true,
      axisPointer: {
        ...tooltipAxisShadow.axisPointer,
        label: { show: false },
      },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const scenario = items[0]?.axisValueLabel ?? "";
        const rows = items
          .map((item: any) =>
            tooltipDotRow(item.color, item.seriesName, Number(item.value ?? 0).toFixed(4))
          )
          .join("");
        return tooltipWrap(tooltipTitle(scenario) + rows);
      },
    },
    legend: { show: false },
    grid: {
      left: 24,
      right: 0,
      top: 4,
      bottom: 16,
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      name: "",
      nameLocation: "middle",
      nameGap: 16,
      ...CHART_AXIS_NAME,
      data: xAxisData,
      axisLabel: CHART_AXIS_LABEL,
      // 수정: axisLine/axisTick을 인라인 객체 대신 chartStyles 상수로 통일
      axisLine: CHART_AXIS_LINE,
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: 'Probability of "Go" Decision\n(Power)',
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
        name: "Proposed Design",
        type: "bar",
        data: series1Data,
        itemStyle: {
          color: ATS_REPORT_COLORS.proposed,
          borderRadius: BAR_RADIUS.allSmall,
        },
        barWidth: "25%",
        barGap: "20%",
        // 안정성 임계값(80%) 점선 기준선
        markLine: {
          silent: false,
          symbol: "none",
          label: {
            show: true,
            position: "insideEndTop",
            formatter: "Target Stability Threshold (80%)",
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
          data: [{ yAxis: STABILITY_THRESHOLD }],
        },
      },
      // 임계값 이하 영역 그라디언트 — 별도 시리즈로 축/막대 뒤에 배치
      {
        type: "bar",
        data: xAxisData.map(() => null),
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
          data: [[{ yAxis: 0 }, { yAxis: STABILITY_THRESHOLD }]],
        },
      },
      {
        name: "Standard Design",
        type: "bar",
        data: series2Data,
        itemStyle: {
          color: ATS_REPORT_COLORS.standardBar,
          borderRadius: BAR_RADIUS.allSmall,
        },
        barWidth: "25%",
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
        {/* 안정성 상태 메시지 라벨 */}
        <div
          className="absolute text-small2 text-[var(--chart-text-category-title)] gap-0.5 rounded-[4px]"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "45%",
            display: "inline-flex",
            flexDirection: "column",
            padding: "4px 8px",
            alignItems: "center",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <span className="text-[var(--text-header)]">Proposed design remains STABLE</span>
          <span className="text-[var(--text-header)]">(above 80% threshold)</span>
        </div>
      </div>

      {/* 하단 레전드 컨테이너 */}
      <div
        className="shrink-0 flex items-center gap-x-2.5 text-small2 font-[Inter] text-text-secondary pl-6 pr-1 pt-0.5 -mb-1"
      >
        <div className="flex items-center gap-1">
          <span
            className="shrink-0 w-5 h-3 rounded-sm"
            style={{ backgroundColor: ATS_REPORT_COLORS.proposed }}
          />
          <span>Proposed Design</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="shrink-0 w-5 h-3 rounded-sm"
            style={{ backgroundColor: ATS_REPORT_COLORS.standardBar }}
          />
          <span>Standard Design</span>
        </div>
      </div>
    </div>
  );
}
