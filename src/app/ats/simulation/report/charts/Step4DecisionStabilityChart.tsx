"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import { ATS_REPORT_COLORS, BAR_RADIUS, tooltipAxisShadow } from "@/lib/chart-styles";
import type { DecisionStabilityResult } from "@/services/studyService";

export interface Step4DecisionStabilityChartProps {
  apiData: {
    result_decisionstability?: DecisionStabilityResult[];
  } | null;
}

const STABILITY_THRESHOLD = 0.8;

export function Step4DecisionStabilityChart({
  apiData,
}: Step4DecisionStabilityChartProps) {
  const decisionStabilityData = apiData?.result_decisionstability || [];
  const xAxisData = decisionStabilityData.map((item) => item.scenario);
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
    tooltip: { ...tooltipAxisShadow },
    legend: { show: false },
    grid: {
      left: "5%",
      right: "3%",
      top: "8%",
      bottom: "3%",
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
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: 'Probability of "Go" Decision (Power)',
      nameLocation: "middle",
      nameGap: 28,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: { show: false },
      axisTick: { show: false },
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
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: ATS_REPORT_COLORS.markLine,
            type: "dashed",
            width: 1.5,
          },
          data: [{ yAxis: STABILITY_THRESHOLD }],
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
      <div className=" flex-shrink-0">
        <p className="text-body5 text-neutral-30">Decision Stability across Perturbations</p>
        <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
      </div>
      <div className="flex-1 min-h-0 w-full bg-white rounded-[4px] overflow-hidden">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
        <div
          className="absolute text-small1 text-[var(--chart-text-category-title)] gap-1.5"
          style={{
            left: "50px",
            bottom: "10%",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "4px 8px",
            border: "1px solid var(--chart-legend-border)",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <div className="flex items-center gap-1">
            <span
              className="shrink-0 border-t border-dashed border-[var(--chart-ats-markline)]"
              style={{ width: 20, borderWidth: 1.5 }}
            />
            <span>Target Stability Threshold (80%)</span>
          </div>
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
        <div
          className="absolute text-small2 text-[var(--chart-text-category-title)] gap-0.5"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "45%",
            display: "inline-flex",
            flexDirection: "column",
            padding: "4px 8px",
            alignItems: "center",
            border: "1px solid var(--chart-legend-border)",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <span className="text-[var(--text-header)]">Proposed design remains STABLE</span>
          <span className="text-[var(--text-header)]">(above 80% threshold)</span>
        </div>
      </div>
    </div>
  );
}
