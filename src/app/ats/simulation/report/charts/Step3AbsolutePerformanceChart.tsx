"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  chartTitle,
  chartGraphicDivider,
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import type { AbsolutePerformanceItem } from "@/services/studyService";

export interface Step3AbsolutePerformanceChartProps {
  apiData: {
    result_absoluteperformancecomparison?: AbsolutePerformanceItem[];
  } | null;
}

const ORDER = [
  "Ideal (0%)",
  "Mild (10%)",
  "Moderate (20%)",
  "Severe (30%)",
] as const;

const CATEGORY_MAP: Record<string, { name: string; color: string }> = {
  "Prognostic ANCOVA (CC)": {
    name: "Proposed (Adj+)",
    color: "#231f52",
  },
  "Standard ANCOVA (CC)": {
    name: "Standard ANCOVA",
    color: "#7571a9",
  },
  "Unadjusted (CC)": {
    name: "Unadjusted",
    color: "#aaa5e1",
  },
};

const CATEGORIES = [
  "Prognostic ANCOVA (CC)",
  "Standard ANCOVA (CC)",
  "Unadjusted (CC)",
] as const;

/** ─── 그룹/갭 조정 (여기서 수정) ─── */
/** 그룹 내 갭: 한 그룹 안에서 시리즈(Proposed, ANCOVA, Unadjusted)가 차지하는 칸 수. 3이면 3칸 연속, 5면 5칸 중 0,2,4 사용해 더 벌어짐 */
const SLOTS_PER_GROUP = 3;
/** 그룹 간 갭: 그룹과 그룹 사이에 넣는 빈 칸 수. 0이면 붙어 있고, 1 이상이면 그만큼 빈 칸 추가 */
const GAP_SLOTS_BETWEEN_GROUPS = 3;
/** 그룹 내에서 시리즈가 놓일 슬롯 인덱스 (0~SLOTS_PER_GROUP-1). [0,1,2]면 3칸 꽉 채움, [0,2,4]면 5칸 중 0,2,4 사용 */
const SLOT_INDICES_IN_GROUP: [number, number, number] = [0, 1, 2];

const X_CATEGORY_INDICES = ORDER.map((_, g) => {
  const base = g * (SLOTS_PER_GROUP + GAP_SLOTS_BETWEEN_GROUPS);
  return [
    base + SLOT_INDICES_IN_GROUP[0],
    base + SLOT_INDICES_IN_GROUP[1],
    base + SLOT_INDICES_IN_GROUP[2],
  ] as [number, number, number];
});
const LABEL_SLOT_INDEX = Math.floor(SLOTS_PER_GROUP / 2);
const X_AXIS_DATA: string[] = [];
for (let g = 0; g < ORDER.length; g++) {
  for (let s = 0; s < SLOTS_PER_GROUP; s++) {
    X_AXIS_DATA.push(s === LABEL_SLOT_INDEX ? ORDER[g] : "");
  }
  if (g < ORDER.length - 1) {
    for (let k = 0; k < GAP_SLOTS_BETWEEN_GROUPS; k++) X_AXIS_DATA.push("");
  }
}
const SYMBOLS = ["circle", "rect", "triangle"] as const;
const CAP_LEN_PX = 12;
const ASSUMED_EFFECT = 2;

export function Step3AbsolutePerformanceChart({
  apiData,
}: Step3AbsolutePerformanceChartProps) {
  const absPerf = apiData?.result_absoluteperformancecomparison || [];
  const byCategory: Record<string, { effect: number; margin: number }[]> = {};
  CATEGORIES.forEach((cat) => {
    byCategory[cat] = ORDER.map((lev) => {
      const row = absPerf.find(
        (r) => r.degradation_level === lev && r.category === cat
      );
      return row
        ? {
            effect: row.estimated_treatment_effect,
            margin: row.margin_of_error,
          }
        : { effect: 0, margin: 0 };
    });
  });
  const hasData = absPerf.length > 0;

  const Y_TICK_INTERVAL = 0.5;
  const yRange = (() => {
    if (!hasData) return { min: 0, max: 1, interval: Y_TICK_INTERVAL };
    let lo = Infinity;
    let hi = -Infinity;
    CATEGORIES.forEach((cat) => {
      byCategory[cat].forEach((d) => {
        lo = Math.min(lo, d.effect - d.margin);
        hi = Math.max(hi, d.effect + d.margin);
      });
    });
    lo = Math.min(lo, ASSUMED_EFFECT);
    hi = Math.max(hi, ASSUMED_EFFECT);
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

  const lineSeries = hasData
    ? CATEGORIES.map((cat, seriesIdx) => ({
        name: CATEGORY_MAP[cat].name,
        type: "line" as const,
        data: byCategory[cat].map((d, i) => [
          X_CATEGORY_INDICES[i][seriesIdx],
          d.effect,
        ]),
        itemStyle: { color: CATEGORY_MAP[cat].color },
        symbol: SYMBOLS[seriesIdx],
        symbolSize: 10,
        lineStyle: { width: 2 },
      }))
    : [];

  const errorBarSeries = hasData
    ? CATEGORIES.map((cat, seriesIdx) => {
        const strokeColor = CATEGORY_MAP[cat].color;
        return {
          name: CATEGORY_MAP[cat].name + " (95% CI)",
          type: "custom" as const,
          data: byCategory[cat].map((d, i) => [
            X_CATEGORY_INDICES[i][seriesIdx],
            d.effect,
            d.margin,
          ]),
          renderItem: (
            params: unknown,
            api: {
              value: (i: number) => number;
              coord: (p: number[]) => number[];
              style: (o: object) => object;
            }
          ) => {
            const xVal = api.value(0);
            const effect = api.value(1);
            const margin = api.value(2);
            const low = api.coord([xVal, effect - margin]);
            const high = api.coord([xVal, effect + margin]);
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
        };
      })
    : [];

  const option = {
    title: chartTitle("A. Absolute Performance Comparison (Dodged)"),
    graphic: chartGraphicDivider(320),
    legend: { show: false },
    grid: {
      left: "7%",
      right: "3%",
      top: "60px",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      name: "",
      nameLocation: "middle",
      nameGap: 16,
      ...CHART_AXIS_NAME,
      data: X_AXIS_DATA,
      axisLabel: {
        ...CHART_AXIS_LABEL,
        interval: 0,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "Estimated Treatment Effect (95% CI)",
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
      ...errorBarSeries,
      ...lineSeries,
      ...(hasData
        ? [
            {
              name: "Assumed effect (for simulation)",
              type: "line",
              data: [],
              symbol: "none",
              showSymbol: false,
              markLine: {
                silent: true,
                symbol: "none",
                label: { show: false },
                lineStyle: {
                  color: "#704ef3",
                  type: "dashed",
                  width: 1.5,
                },
                data: [{ yAxis: ASSUMED_EFFECT }],
              },
            },
          ]
        : []),
    ],
  };

  return (
    <div className="flex-1 h-full bg-white rounded-[8px] overflow-hidden relative">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      {hasData && (
        <div
          className="absolute text-small1 text-[#484646]"
          style={{
            left: "50px",
            bottom: "15%",
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
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#231f52",
                }}
              />
            </span>
            <span>Proposed (Adj+)</span>
          </div>
          <div className="flex items-center" style={{ gap: 5, minHeight: 14 }}>
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ width: 16, height: 16 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "#7571a9",
                }}
              />
            </span>
            <span>Standard ANCOVA</span>
          </div>
          <div className="flex items-center" style={{ gap: 5, minHeight: 14 }}>
            <span
              className="shrink-0 flex items-center justify-center text-[12px] leading-none"
              style={{ width: 16, height: 16, color: "#aaa5e1" }}
            >
              ▲
            </span>
            <span>Unadjusted</span>
          </div>
          <div className="flex items-center" style={{ gap: 5, minHeight: 14 }}>
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ width: 16, height: 16 }}
            >
              <span
                className="border-t border-dashed border-[#704ef3]"
                style={{ width: 16, borderWidth: 1.5 }}
              />
            </span>
            <span>Assumed effect (for simulation)</span>
          </div>
        </div>
      )}
    </div>
  );
}
