"use client";

/**
 * Step2BoxplotChart
 * ATS 리포트 Step 2 — Estimated Treatment Effect 박스플롯 차트.
 * 모델 성능(R²) 구간별 치료 효과 분포를 박스플롯으로 시각화하며,
 * fence 밖 이상치는 scatter(채워진 원)로 표시한다.
 *
 * 주요 수정사항:
 * - 툴팁: tooltipAxisShadow(axis 트리거)로 전환 — 같은 x 그룹 호버 시 boxplot+scatter 동시 표시
 * - animationDurationUpdate: 0 — 호버 시 재렌더 애니메이션 방지 (초기 로드만 애니메이션)
 * - x축 onZero: false — x축 라인을 y=0이 아닌 차트 하단에 고정
 * - overallMean markLine 시리즈 삭제 — 평균 기준선 제거
 * - hover 시 per-item 스타일: 선택된 박스는 강조, 나머지는 opacity 0.4로 흐리게
 */

import { useState, useCallback } from "react";
import ReactECharts from "@/components/charts/DynamicECharts";
import {
  CHART_AXIS_LABEL,
  CHART_AXIS_NAME,
  CHART_AXIS_LINE,
  CHART_AXIS_TICK,
  CHART_Y_AXIS_TICK,
  CHART_Y_AXIS_SPLIT_LINE,
} from "./chartStyles";
import { tooltipAxisShadow, tooltipRow, tooltipTitle, tooltipWrap } from "@/lib/chart-styles";
import type { EstimatedTreatmentEffectResult } from "@/services/studyService";

export interface Step2BoxplotChartProps {
  apiData: {
    result_estimatedtreatmenteffect?: EstimatedTreatmentEffectResult[];
  } | null;
}

export function Step2BoxplotChart({ apiData }: Step2BoxplotChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const onEvents = {
    mouseover: useCallback((params: any) => {
      if (params.dataIndex !== undefined && params.componentType === "series") {
        setHoveredIdx(params.dataIndex);
      }
    }, []),
    globalout: useCallback(() => {
      setHoveredIdx(null);
    }, []),
  };

  const boxplotSource = apiData?.result_estimatedtreatmenteffect || [];
  const hasBoxplot = Array.isArray(boxplotSource) && boxplotSource.length > 0;
  const xAxisDataBox = hasBoxplot
    ? boxplotSource.map((r) => String(r.model_performance))
    : [];

  // 데이터 계산 — hover 스타일 적용을 위해 option 밖에서 수행
  const boxplotData: number[][] = [];
  const outlierData: (number | string)[][] = [];
  const allValues: number[] = [];

  if (hasBoxplot) {
    boxplotSource.forEach((r, idx) => {
      try {
        const raw = r.estimated_treatment_effect;
        const arr =
          typeof raw === "string"
            ? JSON.parse(raw)
            : Array.isArray(raw)
            ? raw
            : [];
        const nums = Array.isArray(arr)
          ? arr.map(Number).filter((n) => !Number.isNaN(n))
          : [];

        allValues.push(...nums);

        if (nums.length >= 5) {
          const sorted = [...nums].sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const median = sorted[Math.floor(sorted.length * 0.5)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const lowerFence = q1 - 1.5 * iqr;
          const upperFence = q3 + 1.5 * iqr;

          nums
            .filter((n) => n < lowerFence || n > upperFence)
            .forEach((outlier) => outlierData.push([idx, outlier]));

          const inRange = sorted.filter(
            (n) => n >= lowerFence && n <= upperFence
          );
          const min = inRange.length > 0 ? inRange[0] : sorted[0];
          const max =
            inRange.length > 0
              ? inRange[inRange.length - 1]
              : sorted[sorted.length - 1];
          boxplotData.push([min, q1, median, q3, max]);
        } else {
          boxplotData.push([0, 0, 0, 0, 0]);
        }
      } catch {
        boxplotData.push([0, 0, 0, 0, 0]);
      }
    });
  }

  const overallMean =
    allValues.length > 0
      ? allValues.reduce((a, b) => a + b, 0) / allValues.length
      : null;

  // hover 시 per-item 스타일 적용
  const styledBoxplotData = boxplotData.map((d, i) => {
    if (hoveredIdx === null) return d;
    if (i === hoveredIdx)
      return {
        value: d,
        itemStyle: { color: "#231f52", borderColor: "#231f52", borderWidth: 1.5 },
      };
    return { value: d, itemStyle: { opacity: 0.4 } };
  });

  const styledOutlierData = outlierData.map((d) => {
    if (hoveredIdx === null) return d;
    if (d[0] === hoveredIdx) return d;
    return { value: d, itemStyle: { opacity: 0.4 } };
  });

  const option = {
    animationDurationUpdate: 0,
    tooltip: {
      ...tooltipAxisShadow,
      appendToBody: true,
      axisPointer: {
        ...tooltipAxisShadow.axisPointer,
        label: { show: false },
      },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const boxItem = items.find((p: any) => p.seriesType === "boxplot");
        const scatterItems = items.filter((p: any) => p.seriesType === "scatter");
        if (!boxItem && scatterItems.length === 0) return "";
        const name = boxItem?.name ?? scatterItems[0]?.name ?? "";
        let html = tooltipTitle(`R² = ${name}`);
        if (boxItem) {
          const d = boxItem.data ?? boxItem.value;
          html += tooltipRow("", "Max", (d[5]?.toFixed(4) ?? d[4]?.toFixed(4)));
          html += tooltipRow("", "Q3", (d[4]?.toFixed(4) ?? d[3]?.toFixed(4)));
          html += tooltipRow("", "Median", (d[3]?.toFixed(4) ?? d[2]?.toFixed(4)));
          html += tooltipRow("", "Q1", (d[2]?.toFixed(4) ?? d[1]?.toFixed(4)));
          html += tooltipRow("", "Min", (d[1]?.toFixed(4) ?? d[0]?.toFixed(4)));
        }
        scatterItems.forEach((s: any) => {
          html += tooltipRow("", "Outlier", s.value?.[1]?.toFixed(4));
        });
        return tooltipWrap(html);
      },
    },
    grid: {
      left: 16,
      right: 0,
      top: 4,
      bottom: 16,
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      name: "R²",
      nameLocation: "middle",
      nameGap: 20,
      ...CHART_AXIS_NAME,
      data: hasBoxplot ? xAxisDataBox : [],
      axisLabel: CHART_AXIS_LABEL,
      axisLine: { ...CHART_AXIS_LINE, onZero: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value" as const,
      name: "β",
      nameLocation: "middle",
      nameGap: 28,
      ...CHART_AXIS_NAME,
      axisLabel: CHART_AXIS_LABEL,
      axisLine: CHART_AXIS_LINE,
      axisTick: CHART_Y_AXIS_TICK,
      splitLine: CHART_Y_AXIS_SPLIT_LINE,
    },
    series: hasBoxplot
      ? [
          {
            name: "Boxplot",
            type: "boxplot",
            data: styledBoxplotData,
            itemStyle: {
              color: "#231f52",
              borderColor: "#231f52",
              borderWidth: 1,
            },
            emphasis: { disabled: true },
            boxWidth: [10, 24],
          },
          ...(styledOutlierData.length > 0
            ? [
                {
                  name: "Outliers",
                  type: "scatter",
                  data: styledOutlierData,
                  itemStyle: {
                    color: "#231f52",
                  },
                  emphasis: { disabled: true },
                  symbolSize: 6,
                },
              ]
            : []),
        ]
      : [],
  };

  return (
    <div className="p-3 flex-1 h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 bg-white rounded-[4px] overflow-hidden">
        <ReactECharts
          notMerge={true}
          lazyUpdate={true}
          option={option}
          onEvents={onEvents}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
