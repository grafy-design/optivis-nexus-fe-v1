"use client";

import ReactECharts from "echarts-for-react";
import type { CustomSeriesRenderItem, EChartsOption } from "echarts";

export type VarianceStackChartData = {
  within: number;
  explained: number;
  max: number;
  ticks: number[];
  vrLabel: string;
  withinColor: string;
  explainedColor: string;
};

export type VarianceBarsItem = {
  label: string;
  value: number;
  weightLabel: string;
  color: string;
  highlight?: boolean;
};

export type VarianceBarsChartData = {
  max: number;
  ticks: number[];
  threshold: number;
  bars: VarianceBarsItem[];
};

export type RiskMetricKey = "diseaseProgression" | "drugResponse" | "safety";

export type ForestIntervalData = {
  low: number;
  mean: number;
  high: number;
  color: string;
  dotColor?: string;
};

export type RiskResponseRow = {
  groupLabel: string;
  metrics: Record<RiskMetricKey, ForestIntervalData>;
};

export type RiskResponseSet = {
  setName: string;
  rows: RiskResponseRow[];
};

const AXIS_LINE_COLOR = "#6F6E76";

function StackedVarianceChart({
  data,
  yAxisLabel = "CIWidth",
}: {
  data: VarianceStackChartData;
  yAxisLabel?: string;
}) {
  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 54, right: 14, top: 14, bottom: 22 },
    xAxis: {
      type: "category",
      data: [""],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 5,
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
      axisTick: { show: true, length: 4, lineStyle: { color: AXIS_LINE_COLOR } },
      axisLabel: { show: true, color: "#4A4949", fontSize: 12 },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 36,
      nameRotate: 90,
      nameTextStyle: {
        color: "#1B1B1B",
        fontSize: 14,
      },
    },
    graphic: [
      {
        type: "text",
        left: "center",
        top: 10,
        style: {
          text: data.vrLabel,
          fill: "#1B1B1B",
          fontSize: 12,
          fontFamily: "inherit",
        },
      },
    ],
    series: [
      {
        name: "Within",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
        silent: true,
        data: [data.within],
        itemStyle: {
          color: data.withinColor,
          borderRadius: [0, 0, 12, 12],
        },
      },
      {
        name: "Explained",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
        silent: true,
        data: [data.explained],
        itemStyle: {
          color: data.explainedColor,
          borderRadius: [12, 12, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
}

function VarianceByGroupBarChart({ data }: { data: VarianceBarsChartData }) {
  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 44, right: 12, top: 14, bottom: 34 },
    xAxis: {
      type: "category",
      data: data.bars.map((bar) => bar.label),
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: "#1B1B1B",
        fontSize: 13,
        margin: 10,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 10,
      axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1.5 } },
      axisTick: { show: true, length: 4, lineStyle: { color: AXIS_LINE_COLOR } },
      axisLabel: { show: true, color: "#4A4949", fontSize: 12 },
      splitLine: { show: false },
    },
    series: [
      {
        type: "bar",
        barWidth: 72,
        data: data.bars.map((bar) => ({
          value: bar.value,
          itemStyle: {
            color: bar.color,
            borderRadius: [10, 10, 10, 10],
            borderColor: bar.highlight ? "#8A47FF" : "transparent",
            borderWidth: bar.highlight ? 3 : 0,
          },
          label: {
            show: true,
            position: "insideBottom",
            distance: 10,
            formatter: bar.weightLabel,
            color: "#FFFFFF",
            fontSize: 13,
          },
        })),
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "#2C295A",
            width: 1.5,
            type: "dashed",
          },
          label: { show: false },
          data: [{ yAxis: data.threshold }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
}

export function StratificationComparisonChartPanel({
  leftStack,
  rightBars,
}: {
  leftStack: VarianceStackChartData;
  rightBars: VarianceBarsChartData;
}) {
  return (
    <div className="w-full h-full bg-[#ECECF1] rounded-[16px] p-4 flex flex-col">
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <h4 className="text-h3 text-neutral-20">Variance decomposition</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />
          <div className="flex-1 mt-2 min-h-0">
            <StackedVarianceChart data={leftStack} />
          </div>
          <div className="mt-1 flex items-center justify-center gap-8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-[48px] h-[14px] rounded-[5px]" style={{ backgroundColor: leftStack.withinColor }} />
              <span className="text-body2m text-neutral-20">Within</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-[48px] h-[14px] rounded-[5px]"
                style={{ backgroundColor: leftStack.explainedColor }}
              />
              <span className="text-body2m text-neutral-20">Explained</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <h4 className="text-h3 text-neutral-20">Within-group variance</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />
          <div className="flex-1 mt-2 min-h-0">
            <VarianceByGroupBarChart data={rightBars} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StratificationComparisonChartPanelAlt({
  leftBars,
  rightStack,
}: {
  leftBars: VarianceBarsChartData;
  rightStack: VarianceStackChartData;
}) {
  return (
    <div className="w-full h-full bg-[#ECECF1] rounded-[16px] p-4 flex flex-col">
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="text-body2m text-neutral-30">Separation evidence</div>
          <h4 className="text-h3 text-neutral-20">Variance decomposition</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />
          <div className="flex-1 mt-2 min-h-0">
            <VarianceByGroupBarChart data={leftBars} />
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="text-body2m text-neutral-30">Separation evidence</div>
          <h4 className="text-h3 text-neutral-20">Within-group variance by subgroup</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />
          <div className="flex-1 mt-2 min-h-0">
            <StackedVarianceChart data={rightStack} />
          </div>
          <div className="mt-1 flex items-center justify-center gap-8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-[48px] h-[14px] rounded-[5px]" style={{ backgroundColor: rightStack.withinColor }} />
              <span className="text-body2m text-neutral-20">Within</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-[48px] h-[14px] rounded-[5px]"
                style={{ backgroundColor: rightStack.explainedColor }}
              />
              <span className="text-body2m text-neutral-20">Explained</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const RISK_METRICS: Array<{ key: RiskMetricKey; label: string }> = [
  { key: "diseaseProgression", label: "Disease progression" },
  { key: "drugResponse", label: "Drug response" },
  { key: "safety", label: "Safety" },
];

function ForestMetricChart({
  rows,
  metricKey,
  metricLabel,
  showAxis,
}: {
  rows: RiskResponseRow[];
  metricKey: RiskMetricKey;
  metricLabel: string;
  showAxis: boolean;
}) {
  const intervals = rows.map((row) => row.metrics[metricKey]);
  const data = intervals.map((interval, index) => [index, interval.low, interval.mean, interval.high]);

  const renderInterval: CustomSeriesRenderItem = (_params, api) => {
    const idx = Number(api.value(0));
    const interval = intervals[idx];
    if (!interval) return null;

    const left = api.coord([interval.low, idx]);
    const center = api.coord([interval.mean, idx]);
    const right = api.coord([interval.high, idx]);
    const y = center[1];

    return {
      type: "group",
      children: [
        {
          type: "line",
          shape: { x1: left[0], y1: y, x2: right[0], y2: y },
          style: { stroke: interval.color, lineWidth: 3 },
        },
        {
          type: "line",
          shape: { x1: left[0], y1: y - 8, x2: left[0], y2: y + 8 },
          style: { stroke: interval.color, lineWidth: 3 },
        },
        {
          type: "line",
          shape: { x1: right[0], y1: y - 8, x2: right[0], y2: y + 8 },
          style: { stroke: interval.color, lineWidth: 3 },
        },
        {
          type: "circle",
          shape: { cx: center[0], cy: y, r: 6 },
          style: { fill: interval.dotColor ?? interval.color },
        },
      ],
    };
  };

  const option: EChartsOption = {
    animation: false,
    tooltip: { show: false },
    grid: { left: 4, right: 10, top: 2, bottom: showAxis ? 28 : 2 },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      splitLine: { show: false },
      axisLine: {
        show: showAxis,
        lineStyle: { color: "#9A98A3", width: 1 },
      },
      axisTick: {
        show: showAxis,
        length: 6,
        lineStyle: { color: "#9A98A3", width: 1 },
      },
      axisLabel: { show: false },
      name: showAxis ? metricLabel : "",
      nameLocation: "middle",
      nameGap: 14,
      nameTextStyle: {
        color: "#4A4949",
        fontSize: 11,
      },
    },
    yAxis: {
      type: "category",
      data: rows.map((_, index) => String(index)),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        type: "custom" as const,
        renderItem: renderInterval,
        data,
        silent: true,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: showAxis ? 116 : 88 }}
    />
  );
}

export function RiskResponseMatrixChartPanel({ sets }: { sets: RiskResponseSet[] }) {
  return (
    <div className="flex-1 min-w-0 rounded-[16px] bg-[#ECECF1] border border-[#E5E4EA] p-3">
      <div className="w-full h-full flex flex-col min-h-0">
        {sets.map((setData, setIdx) => (
          <div
            key={setData.setName}
            className={`grid grid-cols-[120px_1fr_1fr_1fr] ${
              setIdx === 0 ? "border-b border-[#BAB9C2]" : ""
            }`}
          >
            <div className="py-1 pr-3 border-r border-[#BAB9C2]">
              <div className="h-[24px] mb-1 flex items-center">
                <span className="w-[86px] h-[24px] rounded-full flex items-center justify-center text-white text-body5m bg-[#292561]">
                  {setData.setName}
                </span>
              </div>
              {setData.rows.map((row) => (
                <div
                  key={`${setData.setName}-${row.groupLabel}`}
                  className="h-7 flex items-center text-body1 text-neutral-20"
                >
                  {row.groupLabel}
                </div>
              ))}
            </div>

            {RISK_METRICS.map((metric, metricIdx) => (
              <div
                key={`${setData.setName}-${metric.key}`}
                className={`py-1 px-3 ${metricIdx < 2 ? "border-r border-[#BAB9C2]" : ""}`}
              >
                <div className="h-[24px] mb-1" aria-hidden />
                <ForestMetricChart
                  rows={setData.rows}
                  metricKey={metric.key}
                  metricLabel={metric.label}
                  showAxis={setIdx === sets.length - 1}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
