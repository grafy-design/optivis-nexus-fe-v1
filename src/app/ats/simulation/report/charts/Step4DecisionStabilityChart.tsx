"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  chartTitle,
  chartGraphicDivider,
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import type { DecisionStabilityResult } from "@/services/studyService";

export interface Step4DecisionStabilityChartProps {
  apiData: {
    result_decisionstability?: DecisionStabilityResult[];
  } | null;
}

const STABILITY_THRESHOLD = 0.8;
/** M3/ref/primary/primary15 */
const PRIMARY_15 = "#262255";

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
    title: chartTitle("Decision Stability across Perturbations"),
    graphic: chartGraphicDivider(720),
    legend: { show: false },
    grid: {
      left: "3%",
      right: "3%",
      top: "60px",
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
          color: PRIMARY_15,
          borderRadius: [6, 6, 6, 6],
        },
        barWidth: "25%",
        barGap: "20%",
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: "#7452f4",
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
                { offset: 0, color: "#E9DDFF" },
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
          color: "#A692D6",
          borderRadius: [6, 6, 6, 6],
        },
        barWidth: "25%",
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
            left: "50px",
            bottom: "10%",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
            padding: "4px 8px",
            border: "1px solid var(--M3-ref-neutral-neutral70, #AEA9B1)",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <div className="flex items-center gap-1.5" style={{ gap: 4 }}>
            <span
              className="shrink-0 border-t border-dashed border-[#7452f4]"
              style={{ width: 20, borderWidth: 1.5 }}
            />
            <span>Target Stability Threshold (80%)</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ gap: 4 }}>
            <span
              className="shrink-0 w-5 h-3 rounded-sm"
              style={{ backgroundColor: PRIMARY_15 }}
            />
            <span>Proposed Design</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ gap: 4 }}>
            <span className="shrink-0 w-5 h-3 rounded-sm bg-[#A692D6]" />
            <span>Standard Design</span>
          </div>
        </div>
        <div
          className="absolute text-small2 text-[#484646]"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "45%",
            display: "inline-flex",
            flexDirection: "column",
            padding: "4px 8px",
            alignItems: "center",
            gap: 2,
            border: "1px solid var(--M3-ref-neutral-neutral70, #AEA9B1)",
            background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
          }}
        >
          <span className="text-[#262255]">Proposed design remains STABLE</span>
          <span className="text-[#262255]">(above 80% threshold)</span>
        </div>
      </div>
    </div>
  );
}
