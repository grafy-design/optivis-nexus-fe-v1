"use client";

/**
 * Step3PerformanceGainChart
 * ATS 리포트 Step 3 — Robustness Proof: Performance Gain over Unadjusted 차트.
 * 데이터 손상 시나리오별로 Proposed 방법론이 Unadjusted 대비 얼마나
 * 우수한지(Difference in Estimate Δ)를 diamond 라인 + error bar로 시각화하며,
 * ±0.05 Non-significant Zone을 markArea로 강조한다.
 *
 * 주요 수정사항:
 * - 툴팁: axis 트리거로 전환 — 같은 x 카테고리 호버 시 Δ Effect + ± Margin 동시 표시
 * - Non-significant Zone: 범례에서 제거, 차트 내부에 HTML 오버레이 라벨로 표시 (nsHovered 시 강조)
 * - x축 onZero: false — x축 라인을 y=0이 아닌 차트 하단에 고정
 * - y=0 참조선: neutral-80(#c7c5c9) 실선 markLine으로 별도 추가
 * - 레전드: 절대 배치 → 하단 flex 컨테이너로 이동 (diamond 아이콘, text-small2)
 * - y축 이름: 괄호 앞 줄바꿈 ("Difference in Estimate\n(Δ)")
 * - 그리드: left 24, nameGap 26
 */

import { useState, useCallback, useRef, useEffect } from "react";
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

/** Non-significant Zone 호버 색상 (primary-90) */
const NS_ZONE_HOVER = "rgba(197, 192, 254, 0.35)";
const NS_LABEL_HOVER = "#444075"; // primary-30

export function Step3PerformanceGainChart({
  apiData,
}: Step3PerformanceGainChartProps) {
  const [nsHovered, setNsHovered] = useState(false);
  const [nsLabelPos, setNsLabelPos] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<any>(null);

  /** 차트 인스턴스에서 NS zone 중앙(x: 플롯 중앙, y: 0) 픽셀 좌표 계산 */
  const updateNsPosition = useCallback(() => {
    const instance = chartRef.current;
    if (!instance) return;
    try {
      // 첫 번째 카테고리(x=0)와 마지막 카테고리(x=3)의 픽셀 좌표로 플롯 영역 중앙 x 계산
      const pxFirst = instance.convertToPixel({ gridIndex: 0 }, [0, 0]);
      const pxLast = instance.convertToPixel({ gridIndex: 0 }, [3, 0]);
      if (pxFirst && pxLast) {
        setNsLabelPos({ x: (pxFirst[0] + pxLast[0]) / 2, y: pxFirst[1] });
      }
    } catch { /* 차트 미준비 시 무시 */ }
  }, []);

  const handleChartReady = useCallback((instance: any) => {
    chartRef.current = instance;
    updateNsPosition();
  }, [updateNsPosition]);

  const onEvents = {
    mouseover: useCallback((params: any) => {
      if (params.componentType === "markArea") setNsHovered(true);
    }, []),
    mouseout: useCallback((params: any) => {
      if (params.componentType === "markArea") setNsHovered(false);
    }, []),
    finished: updateNsPosition,
  };

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

  /** yRange 변경 시 위치 재계산 */
  useEffect(() => {
    const timer = setTimeout(updateNsPosition, 50);
    return () => clearTimeout(timer);
  }, [yRange.min, yRange.max, updateNsPosition]);

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
        const lineItem = items.find((p: any) => p.seriesType === "line");
        const idx = lineItem?.dataIndex ?? items[0]?.dataIndex ?? 0;
        const scenario = xAxisData[idx] ?? "";
        const effect = diffData[idx]?.[0] ?? 0;
        const margin = diffData[idx]?.[1] ?? 0;
        return tooltipWrap(
          tooltipTitle(scenario) +
          tooltipDotRow(ATS_REPORT_COLORS.proposed, "Δ Effect", Number(effect).toFixed(4)) +
          tooltipDotRow(ATS_REPORT_COLORS.proposed, "± Margin", Number(margin).toFixed(4))
        );
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
      name: "Deteriorating Scenarios (e.g., Missing Data Rate)",
      nameLocation: "middle",
      nameGap: 18,
      ...CHART_AXIS_NAME,
      data: xAxisData,
      axisLabel: {
        ...CHART_AXIS_LABEL,
        interval: 0,
      },
      axisLine: { ...CHART_AXIS_LINE, onZero: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "Difference in Estimate\n(Δ)",
      nameLocation: "middle",
      nameGap: 26,
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
      // y=0 참조선 — markArea 아래에 렌더링되도록 z: 0
      {
        type: "line" as const,
        data: xAxisData.map(() => null),
        z: 0,
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: { color: "#c7c5c9", type: "solid", width: 1 },
          data: [{ yAxis: 0 }],
        },
      },
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
                const strokeColor = ATS_REPORT_COLORS.proposed;
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
              zlevel: 1,
              z: 2,
              showInLegend: false,
            },
          ]
        : []),
      {
        name: "Performance Gain (Proposed - Unadjusted)",
        type: "line",
        data: hasData ? lineData : xAxisData.map(() => null),
        zlevel: 1,
        z: 2,
        itemStyle: { color: ATS_REPORT_COLORS.proposed },
        symbol: "diamond",
        symbolSize: 12,
        lineStyle: { width: 2 },
        emphasis: { disabled: true },
        markArea: {
          silent: false,
          itemStyle: { color: nsHovered ? NS_ZONE_HOVER : ATS_REPORT_COLORS.nsZone },
          label: { show: false },
          data: [[{ yAxis: -0.05 }, { yAxis: 0.05 }]],
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: {
            color: ATS_REPORT_COLORS.guideDashed,
            type: "dashed",
            width: 1,
          },
          data: [
            { yAxis: -0.05 },
            { yAxis: 0.05 },
          ],
        },
      },
    ],
  };

  return (
    <div className="p-3 flex-1 h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 bg-white rounded-[4px] overflow-hidden relative">
        <ReactECharts
          option={option}
          onEvents={onEvents}
          onChartReady={handleChartReady}
          style={{ height: "100%", width: "100%" }}
        />
        {/* NS zone 라벨 — 플롯 영역 중앙(x,y) 정확히 위치, 항상 최상위 */}
        <span
          className="absolute pointer-events-none"
          style={{
            left: nsLabelPos ? nsLabelPos.x : "50%",
            top: nsLabelPos ? nsLabelPos.y : "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 10,
            fontFamily: "Inter",
            fontWeight: nsHovered ? 600 : 400,
            color: nsHovered ? NS_LABEL_HOVER : "#484646",
          }}
        >
          Non-significant Zone
        </span>
      </div>
      <div
        className="shrink-0 flex items-center gap-x-2.5 text-small2 font-[Inter] text-text-secondary pl-6 pr-1 pt-0.5 -mb-1"
      >
        <div className="flex items-center gap-[5px]" style={{ minHeight: 14 }}>
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ width: 16, height: 16 }}
          >
            <span
              className="rounded-[1px]"
              style={{
                width: 6,
                height: 6,
                backgroundColor: ATS_REPORT_COLORS.proposed,
                transform: "rotate(45deg)",
              }}
            />
          </span>
          <span>Performance Gain (Proposed - Unadjusted)</span>
        </div>
      </div>
    </div>
  );
}
