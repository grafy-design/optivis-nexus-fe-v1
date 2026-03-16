"use client";

/**
 * Step3AbsolutePerformanceChart
 * ATS 리포트 Step 3 — Absolute Performance Comparison (Dodged) 차트.
 * 데이터 손상 시나리오(Ideal/Mild/Moderate/Severe) × 3가지 방법론
 * (Proposed/Standard ANCOVA/Unadjusted)의 치료 효과 추정값(95% CI)을
 * custom error bar + line 시리즈로 그룹화하여 시각화한다.
 *
 * 주요 수정사항:
 * - 툴팁: axis 트리거로 전환 — 같은 그룹(시나리오) 호버 시 3개 시리즈 동시 표시
 * - markLine 라벨: "Assumed effect (for simulation)" 텍스트를 차트 위에 직접 표시, 범례에서 제거
 * - 레전드: 절대 배치 오버레이 → 하단 flex 컨테이너로 이동 (text-small2, -mb-1)
 * - 그룹 간격: GAP_SLOTS_BETWEEN_GROUPS=1로 그룹 사이 빈 칸 1개
 * - y축 이름: 괄호 앞 줄바꿈 ("Estimated Treatment Effect\n(95% CI)")
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
import { ATS_REPORT_COLORS, tooltipItem, tooltipDotRow, tooltipTitle, tooltipWrap } from "@/lib/chart-styles";
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
    color: ATS_REPORT_COLORS.proposed,
  },
  "Standard ANCOVA (CC)": {
    name: "Standard ANCOVA",
    color: ATS_REPORT_COLORS.standard,
  },
  "Unadjusted (CC)": {
    name: "Unadjusted",
    color: ATS_REPORT_COLORS.unadjusted,
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
const GAP_SLOTS_BETWEEN_GROUPS = 1;
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
    tooltip: {
      ...tooltipItem,
      trigger: "axis" as const,
      appendToBody: true,
      axisPointer: {
        type: "shadow" as const,
        shadowStyle: { color: "rgba(150,150,150,0.08)" },
      },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        if (items.length === 0) return "";
        const dataIndex = items[0]?.dataIndex;
        if (dataIndex === undefined) return "";
        const slotsPerUnit = SLOTS_PER_GROUP + GAP_SLOTS_BETWEEN_GROUPS;
        const groupIdx = Math.floor(dataIndex / slotsPerUnit);
        const posInGroup = dataIndex % slotsPerUnit;
        if (posInGroup >= SLOTS_PER_GROUP || groupIdx >= ORDER.length) return "";
        const groupName = ORDER[groupIdx];
        let rows = "";
        CATEGORIES.forEach((cat) => {
          const d = byCategory[cat][groupIdx];
          const { color, name } = CATEGORY_MAP[cat];
          rows += tooltipDotRow(color, name, d.effect.toFixed(4));
        });
        return tooltipWrap(tooltipTitle(groupName) + rows);
      },
    },
    legend: { show: false },
    grid: {
      left: 24,
      right: 4,
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
      data: X_AXIS_DATA,
      axisLabel: {
        ...CHART_AXIS_LABEL,
        interval: 0,
      },
      axisLine: CHART_AXIS_LINE,
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "Estimated Treatment Effect\n(95% CI)",
      nameLocation: "middle",
      nameGap: 22,
      min: yRange.min,
      max: yRange.max,
      interval: yRange.interval,
      ...CHART_AXIS_NAME,
      nameTextStyle: CHART_AXIS_NAME.nameTextStyle,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_Y_AXIS_TICK,
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
              data: X_AXIS_DATA.map(() => null),
              symbol: "none",
              showSymbol: false,
              markLine: {
                silent: false,
                symbol: "none",
                label: {
                  show: true,
                  position: "insideEndTop",
                  formatter: "Assumed effect (for simulation)",
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
                data: [{ yAxis: ASSUMED_EFFECT }],
              },
            },
          ]
        : []),
    ],
  };

  return (
    <div className="p-3 flex-1 h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 bg-white rounded-[4px] overflow-hidden">
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      </div>
      {hasData && (
        <div
          className="shrink-0 flex items-center gap-x-2.5 text-small2 font-[Inter] text-text-secondary pl-6 pr-1 pt-0.5 -mb-1"
        >
          <div className="flex items-center gap-[5px]" style={{ minHeight: 14 }}>
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ width: 16, height: 16 }}
            >
              <span
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: ATS_REPORT_COLORS.proposed,
                }}
              />
            </span>
            <span>Proposed (Adj+)</span>
          </div>
          <div className="flex items-center gap-[5px]" style={{ minHeight: 14 }}>
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ width: 16, height: 16 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: ATS_REPORT_COLORS.standard,
                }}
              />
            </span>
            <span>Standard ANCOVA</span>
          </div>
          <div className="flex items-center gap-[5px]" style={{ minHeight: 14 }}>
            <span
              className="shrink-0 flex items-center justify-center text-[12px] leading-none"
              style={{ width: 16, height: 16, color: ATS_REPORT_COLORS.unadjusted }}
            >
              ▲
            </span>
            <span>Unadjusted</span>
          </div>
        </div>
      )}
    </div>
  );
}
