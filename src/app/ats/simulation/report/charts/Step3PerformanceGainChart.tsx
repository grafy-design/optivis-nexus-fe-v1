"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  chartTitle,
  chartGraphicDivider,
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import type { RobustnessProofResult } from "@/services/studyService";

export interface Step3PerformanceGainChartProps {
  apiData: {
    result_robustnessproof?: RobustnessProofResult[];
  } | null;
}

const ORDER = [
  "Ideal (0%)",
  "Mild (10%)",
  "Moderate (20%)",
  "Severe (30%)",
] as const;

const CAP_LEN_PX = 12;

export function Step3PerformanceGainChart({
  apiData,
}: Step3PerformanceGainChartProps) {
  const robustness = apiData?.result_robustnessproof || [];
  const xAxisData = ORDER.map((o) => o.replace("Ideal", "ideal"));
  const diffData = ORDER.map((lev) => {
    const row = robustness.find((r) => r.degradation_level === lev);
    return row ? [row.difference_in_estimate, row.margin_of_error] : [0, 0];
  });
  const hasData = robustness.length > 0;
  const lineData = diffData.map((d) => Number(d[0]));
  const errorBarData = diffData.map((d, i) => [i, d[0], d[1]]);

  const Y_TICK_INTERVAL = 0.1;
  const yRange = (() => {
    const nsZoneLo = -0.05;
    const nsZoneHi = 0.05;
    if (!hasData)
      return {
        min: -0.1,
        max: 0.1,
        interval: Y_TICK_INTERVAL,
      };
    let lo = nsZoneLo;
    let hi = nsZoneHi;
    diffData.forEach((d) => {
      const e = Number(d[0]);
      const m = Number(d[1]);
      lo = Math.min(lo, e - m);
      hi = Math.max(hi, e + m);
    });
    const pad = Math.max((hi - lo) * 0.05, 0.02);
    const minVal = lo - pad;
    const maxVal = hi + pad;
    const snappedMin = Math.floor(minVal / Y_TICK_INTERVAL) * Y_TICK_INTERVAL;
    const snappedMax = Math.ceil(maxVal / Y_TICK_INTERVAL) * Y_TICK_INTERVAL;
    return {
      min: parseFloat(snappedMin.toFixed(1)),
      max: parseFloat(snappedMax.toFixed(1)),
      interval: Y_TICK_INTERVAL,
    };
  })();

  const option = {
    title: chartTitle("B. Robustness Proof: Performance Gain over Unadjusted"),
    graphic: chartGraphicDivider(320),
    legend: { show: false },
    grid: {
      left: "6%",
      right: "3%",
      top: "60px",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      name: "Deteriorating Scenarios (e.g., Missing Data Rate)",
      nameLocation: "middle",
      nameGap: 24,
      ...CHART_AXIS_NAME,
      data: xAxisData,
      axisLabel: {
        ...CHART_AXIS_LABEL,
        interval: 0,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "Difference in Estimate (Δ)",
      nameLocation: "middle",
      nameGap: 28,
      min: yRange.min,
      max: yRange.max,
      interval: yRange.interval,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: CHART_Y_AXIS_SPLIT_LINE,
    },
    series: [
      ...(hasData
        ? [
            {
              name: "Performance Gain (Proposed - Unadjusted)",
              type: "custom" as const,
              data: errorBarData,
              renderItem: (
                params: unknown,
                api: {
                  value: (i: number) => number;
                  coord: (p: number[]) => number[];
                  style: (o: object) => object;
                }
              ) => {
                const xIndex = api.value(0);
                const effect = api.value(1);
                const margin = api.value(2);
                const strokeColor = "#231f52";
                const low = api.coord([xIndex, effect - margin]);
                const high = api.coord([xIndex, effect + margin]);
                return {
                  type: "group",
                  children: [
                    {
                      type: "line",
                      shape: {
                        x1: low[0],
                        y1: low[1],
                        x2: high[0],
                        y2: high[1],
                      },
                      style: api.style({
                        stroke: strokeColor,
                        lineWidth: 1.5,
                      }),
                    },
                    {
                      type: "line",
                      shape: {
                        x1: low[0] - CAP_LEN_PX / 2,
                        y1: low[1],
                        x2: low[0] + CAP_LEN_PX / 2,
                        y2: low[1],
                      },
                      style: api.style({
                        stroke: strokeColor,
                        lineWidth: 1.5,
                      }),
                    },
                    {
                      type: "line",
                      shape: {
                        x1: high[0] - CAP_LEN_PX / 2,
                        y1: high[1],
                        x2: high[0] + CAP_LEN_PX / 2,
                        y2: high[1],
                      },
                      style: api.style({
                        stroke: strokeColor,
                        lineWidth: 1.5,
                      }),
                    },
                  ],
                };
              },
              z: 1,
              showInLegend: false,
            },
          ]
        : []),
      {
        name: "Performance Gain (Proposed - Unadjusted)",
        type: "line",
        data: hasData ? lineData : [],
        itemStyle: { color: "#231f52" },
        symbol: "diamond",
        symbolSize: 12,
        lineStyle: { width: 2 },
        markArea: {
          silent: true,
          itemStyle: { color: "rgba(0,0,0,0.06)" },
          data: [[{ yAxis: -0.05 }, { yAxis: 0.05 }]],
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: "#999",
            type: "dashed",
            width: 1,
          },
          data: [{ yAxis: -0.05 }, { yAxis: 0.05 }],
        },
      },
    ],
  };

  return (
    <div className="flex-1 h-full bg-white rounded-[8px] overflow-hidden relative">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      <div
        className="absolute text-small1 text-[#484646]"
        style={{
          left: "50px",
          bottom: "17%",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1,
          padding: "3px 6px",
          border: "1px solid var(--M3-ref-neutral-neutral70, #AEA9B1)",
          background: "var(--surface-60, rgba(255, 255, 255, 0.60))",
        }}
      >
        <div className="flex items-center" style={{ gap: 5, minHeight: 14 }}>
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ width: 16, height: 16 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                backgroundColor: "#231f52",
                transform: "rotate(45deg)",
                borderRadius: "1px",
              }}
            />
          </span>
          <span>Performance Gain (Proposed - Unadjusted)</span>
        </div>
        <div className="flex items-center" style={{ gap: 5, minHeight: 14 }}>
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ width: 16, height: 16 }}
          >
            <span
              style={{
                width: 16,
                height: 10,
                backgroundColor: "rgba(0,0,0,0.06)",
                borderRadius: 2,
              }}
            />
          </span>
          <span>Non-significant Zone</span>
        </div>
      </div>
    </div>
  );
}
