/**
 * Simulation Result Page — 시뮬레이션 결과 대시보드 (Step 3)
 *
 * 역할:
 *   counterfactual 시뮬레이션 결과를 전략(A/B/C) 별로 비교·시각화하는 최종 대시보드입니다.
 *   - 왼쪽 패널: 전략 카드 목록(Strategy A/B/C), Primary Outcome 라디오 선택, Population 정보, Edit Condition 버튼
 *   - 오른쪽 패널: Summary 텍스트 + Efficacy / AE Risk 탭 전환
 *
 * Efficacy 탭:
 *   - Primary Outcome 카드 (Mean, 95% CI, Response Rate 통계 테이블)
 *   - Response Probability 카드 (Strong/Partial/Non/Deteriorator 반응군 분류)
 *   - Simulated Trajectory 카드 (스파게티 플롯 — HbA1c 시계열)
 *   - Counterfactual Comparison 카드 (히스토그램 — Primary Outcome 분포)
 *
 * AE Risk 탭:
 *   - Safety Trade-off 카드 (버블 차트 — △HbA1c vs AE 확률)
 *   - AE Risk 카드 (계단 꺾은선 차트 — AE 유형 선택 가능)
 *   - Non-responder Identification (전략별 비반응자 특성 피처 테이블)
 *
 * 저장:
 *   Save Simulation 버튼 → 글래스모피즘 모달 → 이름·설명 입력 → Save
 */
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import ReactECharts from "@/components/charts/DynamicECharts";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import type {
  DrdNonResponderFeatureViewModel,
  DrdNonResponderSectionViewModel,
} from "@/lib/drd-simulation-play-converter";
import {
  buildMockStrategyTooltipData,
  type TrpAERiskChartViewModel,
  type TrpAERiskSeriesSetViewModel,
  type TrpCounterfactualChartViewModel,
  type TrpDashboardStrategyCard,
  type TrpDashboardOutcomeOption,
  type TrpDashboardTooltipData,
  type TrpPrimaryOutcomeRowViewModel,
  type TrpResponseProbabilityRowViewModel,
  type TrpSafetyTradeoffChartViewModel,
  type TrpSimulationResultViewModel,
  type TrpTrajectoryChartViewModel,
} from "@/services/trp-dashboard-mock-data";
import { useTrpSetupStore } from "@/store/trp-setup-store";

// ── 차트 컴포넌트 (인라인) ────────────────────────────────────────────────────

function highlightResponseProbabilityRowsByStrategy(
  rows: TrpResponseProbabilityRowViewModel[]
): TrpResponseProbabilityRowViewModel[] {
  const maxStrategyA = Math.max(
    ...rows.map((row) => row.strategyA.rawValue ?? Number.NEGATIVE_INFINITY),
    Number.NEGATIVE_INFINITY
  );
  const maxStrategyB = Math.max(
    ...rows.map((row) => row.strategyB.rawValue ?? Number.NEGATIVE_INFINITY),
    Number.NEGATIVE_INFINITY
  );
  const maxStrategyC = Math.max(
    ...rows.map((row) => row.strategyC.rawValue ?? Number.NEGATIVE_INFINITY),
    Number.NEGATIVE_INFINITY
  );

  return rows.map((row) => ({
    ...row,
    strategyA: {
      ...row.strategyA,
      color: "#3a11d8",
      highlight: row.strategyA.rawValue !== null && row.strategyA.rawValue === maxStrategyA,
    },
    strategyB: {
      ...row.strategyB,
      color: "#f06600",
      highlight: row.strategyB.rawValue !== null && row.strategyB.rawValue === maxStrategyB,
    },
    strategyC: {
      ...row.strategyC,
      color: "#24c6c9",
      highlight: row.strategyC.rawValue !== null && row.strategyC.rawValue === maxStrategyC,
    },
  }));
}

/**
 * SpaghettiPlotChart — 전략별 HbA1c 감소 궤적을 보여주는 스파게티 플롯
 * - X축: 증상 발생 후 경과 개월 (0~24개월)
 * - Y축: HbA1c 감소량 (0~-4)
 * - 전략 A(파랑)/B(주황)/C(청록) 3개 라인 + 점선 마커
 */
function SpaghettiPlotChart({ chart }: { chart: TrpTrajectoryChartViewModel }) {
  const yValues = chart.series.flatMap((series) =>
    series.data.filter((value): value is number => value !== null)
  );
  const minValue = yValues.length > 0 ? Math.min(...yValues) : 0;
  const maxValue = yValues.length > 0 ? Math.max(...yValues, 0) : 0;
  const valueRange = Math.max(Math.abs(maxValue - minValue), 1);
  const yMin = Math.floor((minValue - valueRange * 0.15) * 2) / 2;
  const yMax = Math.ceil((maxValue + valueRange * 0.15) * 2) / 2;
  const interval = valueRange <= 2 ? 0.5 : 1;
  const markLineData = [
    ...(chart.targetLine
      ? [
          {
            yAxis: chart.targetLine.value,
            label: { formatter: chart.targetLine.label },
            lineStyle: {
              color: "#7a7793",
              type: "dashed" as const,
              width: 1.5,
            },
          },
        ]
      : []),
    ...chart.verticalEvents.map((event) => ({
      xAxis: event.month,
      label: { formatter: event.label },
      lineStyle: {
        color: "#929090",
        type: "dashed" as const,
        width: 1,
      },
    })),
  ];
  const option = {
    grid: { left: 72, right: 16, top: 24, bottom: 58 },
    xAxis: {
      type: "category" as const,
      data: chart.xAxisValues,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#484646", width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: -0.27,
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#929090", opacity: 0.25, type: "solid" as const, width: 1 },
      },
      name: chart.xAxisName,
      nameLocation: "middle" as const,
      nameGap: 28,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    yAxis: {
      type: "value" as const,
      min: yMin,
      max: yMax,
      interval,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: -0.27,
        formatter: (v: number) => v.toFixed(1),
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#929090", opacity: 0.25, type: "solid" as const, width: 1 },
      },
      name: chart.yAxisName,
      nameLocation: "middle" as const,
      nameGap: 44,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    series: chart.series.map((series, index) => ({
      name: series.strategyLabel,
      type: "line" as const,
      data: series.data,
      smooth: true,
      symbol: "none",
      connectNulls: false,
      lineStyle: { color: series.color, width: 2.5 },
      itemStyle: { color: series.color },
      markLine:
        index === 0 && markLineData.length > 0
          ? {
              silent: true,
              symbol: "none",
              animation: false,
              label: {
                color: "#484646",
                fontFamily: "Inter",
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: "rgba(255,255,255,0.86)",
                padding: [2, 6],
                borderRadius: 4,
              },
              data: markLineData,
            }
          : undefined,
    })),
    legend: {
      show: chart.series.length > 0,
      bottom: 0,
      icon: "roundRect",
      itemWidth: 24,
      itemHeight: 3,
      data: chart.series.map((series) => ({
        name: series.strategyLabel,
        itemStyle: { color: series.color },
        lineStyle: { color: series.color },
      })),
      textStyle: { color: "#484646", fontFamily: "Inter", fontSize: 11, fontWeight: 500 },
    },
    tooltip: { trigger: "axis" as const },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

/**
 * HistogramChart — Primary Outcome(HbA1c 변화량) 분포를 전략별로 겹쳐서 보여주는 히스토그램
 * - X축: Primary Outcome Change(△HbA1c), Y축: 환자 수
 * - 전략 A/B/C 3개 시리즈를 반투명 막대로 겹쳐 표현
 */
function HistogramChart({ chart }: { chart: TrpCounterfactualChartViewModel }) {
  const minStep = chart.bins.reduce((smallest, bin, index, bins) => {
    if (index === 0) return smallest;
    const step = Math.abs(bin - bins[index - 1]);
    if (step <= Number.EPSILON) return smallest;
    return Math.min(smallest, step);
  }, Number.POSITIVE_INFINITY);
  const labelPrecision = !Number.isFinite(minStep) || minStep >= 0.1 ? 1 : minStep >= 0.01 ? 2 : 3;
  const xLabels = chart.bins.map((bin) => bin.toFixed(labelPrecision));
  const strategies = chart.series.map((series) => ({
    name: series.strategyLabel,
    color: series.color,
    data: series.counts,
  }));

  const maxCount = Math.max(...chart.series.flatMap((series) => series.counts), 1);
  const option = {
    grid: { left: 72, right: 16, top: 12, bottom: 58 },
    xAxis: {
      type: "category" as const,
      data: xLabels,
      axisLine: { lineStyle: { color: "#929090", width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        interval: 4,
        formatter: (v: string) => v,
      },
      splitLine: { show: false },
      name: "Primary Outcome Change (△)",
      nameLocation: "middle" as const,
      nameGap: 28,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    yAxis: {
      type: "value" as const,
      min: 0,
      max: Math.ceil(maxCount * 1.15),
      interval: Math.max(1, Math.ceil(maxCount / 5)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#484646", fontFamily: "Inter", fontSize: 9, fontWeight: 500 },
      splitLine: {
        show: true,
        lineStyle: { color: "#929090", opacity: 0.2, type: "solid" as const, width: 1 },
      },
      name: "Patient Count",
      nameLocation: "middle" as const,
      nameGap: 44,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    series: strategies.map((strategy) => ({
      name: strategy.name,
      type: "bar" as const,
      data: strategy.data,
      barWidth: "100%",
      barGap: "-100%",
      barCategoryGap: "0%",
      emphasis: { disabled: true },
      itemStyle: {
        color: strategy.color,
        opacity: 0.72,
        borderRadius: [2, 2, 0, 0],
      },
    })),
    legend: {
      show: strategies.length > 0,
      bottom: 0,
      icon: "roundRect",
      itemWidth: 24,
      itemHeight: 8,
      data: strategies.map((strategy) => ({
        name: strategy.name,
        itemStyle: { color: strategy.color },
      })),
      textStyle: { color: "#484646", fontFamily: "Inter", fontSize: 11, fontWeight: 500 },
    },
    tooltip: { trigger: "axis" as const },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

/**
 * BubbleChart — Safety Trade-off 버블 차트
 * - X축: △HbA1c (효능), Y축: AE 확률(%)
 * - 버블 크기: 상대적 빈도/위험 규모를 시각적으로 표현
 * - A(파랑)/B(주황)/C(청록) 세 전략을 각각 원 하나로 표현
 */
function BubbleChart({ chart }: { chart: TrpSafetyTradeoffChartViewModel }) {
  const xValues = chart.points.map((point) => point.xValue);
  const yValues = chart.points.map((point) => point.yValue);
  const maxX = Math.max(...xValues, 1);
  const minX = Math.min(...xValues, 0);
  const maxY = Math.max(...yValues, 1);
  const option = {
    grid: { left: 56, right: 16, top: 12, bottom: 62 },
    xAxis: {
      type: "value" as const,
      min: Math.floor(minX),
      max: Math.ceil(maxX * 1.1),
      interval: Math.max(1, Math.ceil((maxX - minX || 1) / 3)),
      axisLine: { lineStyle: { color: "#929090", width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: -0.27,
      },
      splitLine: { show: false },
      name: chart.xAxisName,
      nameLocation: "middle" as const,
      nameGap: 20,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    yAxis: {
      type: "value" as const,
      min: 0,
      max: Math.ceil(maxY * 1.15),
      interval: Math.max(1, Math.ceil(maxY / 4)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: -0.27,
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#929090", opacity: 0.2, type: "solid" as const, width: 1 },
      },
      name: chart.yAxisName,
      nameLocation: "middle" as const,
      nameGap: 40,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    series: chart.points.map((point) => ({
      name: point.strategyLabel,
      type: "scatter" as const,
      data: [[point.xValue, point.yValue]],
      symbolSize: point.symbolSize,
      itemStyle: { color: point.color, opacity: 0.88 },
      label: {
        show: true,
        formatter: point.strategyLabel.replace("Strategy ", ""),
        color: "#fff",
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: 700,
      },
    })),
    tooltip: { trigger: "item" as const },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

/**
 * StepLineChart — AE 발생 확률의 계단 꺾은선(step line) 차트
 * - X축: 치료 시작 후 연수, Y축: AE 확률(%)
 * - 아래쪽에 그라데이션 면적(areaStyle) 적용
 * - AE Risk 탭의 "AE Risk" 카드 내부에 표시됨
 */
function StepLineChart({
  seriesSet,
  yAxisName,
}: {
  seriesSet: TrpAERiskSeriesSetViewModel;
  yAxisName: string;
}) {
  const maxY = Math.max(
    ...seriesSet.series.flatMap((series) =>
      series.data.filter((value): value is number => value !== null)
    ),
    1
  );
  const option = {
    grid: { left: 56, right: 16, top: 12, bottom: 62 },
    xAxis: {
      type: "category" as const,
      data: seriesSet.xAxisValues,
      axisLine: { lineStyle: { color: "#929090", width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: -0.27,
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#929090", opacity: 0.15, type: "solid" as const, width: 1 },
      },
      name: "Years since treatment start",
      nameLocation: "middle" as const,
      nameGap: 20,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    yAxis: {
      type: "value" as const,
      min: 0,
      max: Math.ceil(maxY * 1.15),
      interval: Math.max(1, Math.ceil(maxY / 4)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#484646",
        fontFamily: "Inter",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: -0.27,
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#929090", opacity: 0.2, type: "solid" as const, width: 1 },
      },
      name: yAxisName,
      nameLocation: "middle" as const,
      nameGap: 40,
      nameTextStyle: {
        color: "#1c1b1b",
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: -0.55,
      },
    },
    series: seriesSet.series.map((series) => ({
      name: series.strategyLabel,
      type: "line" as const,
      step: "end" as const,
      data: series.data,
      symbol: "none",
      lineStyle: { color: series.color, width: 2 },
      areaStyle: {
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${series.color}50` },
            { offset: 1, color: `${series.color}08` },
          ],
        },
      },
      itemStyle: { color: series.color },
    })),
    legend: {
      show: seriesSet.series.length > 0,
      bottom: 0,
      icon: "roundRect",
      itemWidth: 24,
      itemHeight: 3,
      padding: [0, 0, 2, 0],
      data: seriesSet.series.map((series) => ({
        name: series.strategyLabel,
        itemStyle: { color: series.color },
      })),
      textStyle: { color: "#484646", fontFamily: "Inter", fontSize: 9, fontWeight: 500 },
    },
    tooltip: { trigger: "axis" as const },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

function EmptyCardState({ message }: { message: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        borderRadius: "10px",
        border: "1px solid rgba(38,34,85,0.12)",
        background: "rgba(255,255,255,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "Inter",
          fontWeight: 500,
          fontSize: "13px",
          color: "#484646",
          letterSpacing: "-0.36px",
          textAlign: "center",
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ── 전략 카드 툴팁 ────────────────────────────────────────────────────────────

/**
 * StrategyInfoTooltip — 전략 카드 info 아이콘 호버 시 나타나는 포탈 기반 툴팁
 * - 약물 그룹(GLP-1 RA, SGLT2 inhibitors 등)별로 막대 바 레이아웃으로 표시
 * - anchorRect: info 아이콘의 DOMRect — 툴팁 위치 계산에 사용 (anchorRect.right + 12)
 * - createPortal로 document.body에 렌더링하여 overflow:hidden 클리핑 방지
 */
function StrategyInfoTooltip({
  data,
  anchorRect,
}: {
  data: TrpDashboardTooltipData;
  anchorRect: DOMRect;
}) {
  const top = anchorRect.top + anchorRect.height / 2;
  const left = anchorRect.right + 12;
  const axisLabels = data.axisLabels.length > 0 ? data.axisLabels : ["0", "3", "6", "9", "12"];
  const footerMetrics =
    Array.isArray(data.footerMetrics) && data.footerMetrics.length > 0
      ? data.footerMetrics
      : [
          { label: "Model confidence", value: "★★★★★", kind: "rating" as const },
          { label: "Data completeness", value: "92%", kind: "text" as const },
          { label: "Median follow-up", value: "14.8months", kind: "text" as const },
        ];

  const LEFT_W = 112;
  const BAR_AREA_TOP = 30;

  const rows:
    | { type: "label"; text: string }
    | {
        groupLabel: string;
        type: "item";
        text: string;
        color: string;
        widthFraction: number;
        offsetFraction: number;
      } extends infer R
    ? R[]
    : never = [];

  data.groups.forEach((group) => {
    rows.push({ type: "label", text: group.label } as const);
    group.items.forEach((item) => {
      rows.push({
        groupLabel: group.label,
        type: "item",
        text: item.label,
        color: item.color,
        widthFraction: item.widthFraction,
        offsetFraction: item.offsetFraction,
      } as const);
    });
  });

  const resolveTooltipBarColor = (groupLabel: string, fallbackColor: string) => {
    if (groupLabel === "GLP-1 RA") return "#F06600";
    if (
      groupLabel === "Biguanide" ||
      groupLabel === "SGLT2 inhibitors" ||
      groupLabel === "Insulin-based"
    ) {
      return "#C5C0FE";
    }
    return fallbackColor;
  };

  const content = (
    <div
      style={{
        position: "fixed",
        left,
        top,
        transform: "translateY(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        width: 378,
        maxWidth: 380,
        maxHeight: 240,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 18px 38px rgba(16, 10, 60, 0.28)",
        background:
          "linear-gradient(180deg, rgba(46,40,103,0.98) 0%, rgba(39,33,89,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.16)",
        padding: "12px 14px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          marginLeft: LEFT_W,
          marginBottom: 4,
          justifyContent: "space-between",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 11,
          color: "rgba(255,255,255,0.78)",
          letterSpacing: "-0.33px",
          paddingRight: 2,
        }}
      >
        {axisLabels.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            position: "absolute",
            top: BAR_AREA_TOP,
            bottom: 54,
            left: LEFT_W,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          {axisLabels.map((label) => (
            <div
              key={label}
              style={{
                width: 1,
                height: "100%",
                background:
                  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.54) 0 3px, transparent 3px 6px)",
              }}
            />
          ))}
        </div>

        {rows.map((row, i) =>
          row.type === "label" ? (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                height: 16,
                marginTop: i === 0 ? 2 : 10,
              }}
            >
              <span
                style={{
                  width: LEFT_W,
                  flexShrink: 0,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.62)",
                  letterSpacing: "-0.22px",
                  lineHeight: 1.1,
                }}
              >
                {row.text}
              </span>
            </div>
          ) : (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", minHeight: 24, marginTop: 2 }}
            >
              <span
                style={{
                  width: LEFT_W,
                  flexShrink: 0,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#ffffff",
                  letterSpacing: "-0.33px",
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  paddingRight: 8,
                }}
              >
                {row.text}
              </span>
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  height: 14,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${row.offsetFraction * 100}%`,
                    height: 14,
                    borderRadius: 999,
                    background: resolveTooltipBarColor(row.groupLabel, row.color),
                    width: `${row.widthFraction * 100}%`,
                    boxShadow: `0 2px 8px ${resolveTooltipBarColor(row.groupLabel, row.color)}33`,
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.16)",
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          columnGap: 8,
        }}
      >
        {footerMetrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 10,
                lineHeight: 1.2,
                letterSpacing: "-0.2px",
                color: "rgba(255,255,255,0.76)",
                whiteSpace: "nowrap",
              }}
            >
              {metric.label}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: metric.kind === "rating" ? 700 : 600,
                fontSize: metric.kind === "rating" ? 13 : 18,
                lineHeight: 1.1,
                letterSpacing: metric.kind === "rating" ? "0.08em" : "-0.28px",
                color: "#ffffff",
              }}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

/** StrategyCard 컴포넌트 props 타입 */
type StrategyCardProps = TrpDashboardStrategyCard & {
  tooltipData: TrpDashboardTooltipData;
};

/**
 * StrategyCard — 왼쪽 패널에 표시되는 전략 요약 카드
 * - 헤더: 전략명 + info 아이콘 (hover 시 StrategyInfoTooltip 표시)
 * - 콘텐츠: 목표 이미지 기준 클래스 목록만 표시
 */
function StrategyCard({
  name,
  nameColor,
  summary,
  drugs,
  lineColor,
  tooltipData,
}: StrategyCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const iconRef = useRef<HTMLImageElement>(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      setAnchorRect(iconRef.current.getBoundingClientRect());
      setShowTooltip(true);
    }
  };
  const handleMouseLeave = () => setShowTooltip(false);

  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        borderRadius: "16px",
        flexShrink: 0,
        minHeight: "168px",
        width: "100%",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px 8px",
          borderBottom: `2px solid ${lineColor}`,
          margin: 0,
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 17,
            color: nameColor,
            letterSpacing: "-0.66px",
            lineHeight: 1.2,
          }}
        >
          {name}
        </span>
        {/* info icon */}
        <img
          ref={iconRef}
          src="/icons/basics/info.svg"
          alt="info"
          width={16}
          height={16}
          style={{ flexShrink: 0, cursor: "pointer" }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        {showTooltip && anchorRect && (
          <StrategyInfoTooltip data={tooltipData} anchorRect={anchorRect} />
        )}
      </div>
      {/* 콘텐츠 */}
      <div
        style={{
          padding: "12px 16px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {summary ? (
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: "clamp(10px, 1vw, 14px)",
                color: "#1c1b1b",
                letterSpacing: "-0.42px",
                lineHeight: 1.25,
                margin: 0,
                paddingLeft: "4px",
              }}
            >
              {summary}
            </p>
          ) : null}
          {drugs.map((drug, i) => (
            <p
              key={i}
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "clamp(10px, 1vw, 15px)",
                color: "#5f5e5e",
                letterSpacing: "-0.42px",
                lineHeight: 1.25,
                margin: 0,
                paddingLeft: "4px",
                minHeight: "1.4em",
                display: "flex",
                alignItems: "center",
              }}
            >
              {i + 1}. {drug}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PrimaryOutcomeTable — Primary Outcome 통계 테이블
 * - 열: Strategy / Mean / 95% CI / Response Rate
 * - 행: 전략 A / B / C 각각의 HbA1c 변화량 통계
 */
function PrimaryOutcomeTable({
  rows,
  headers,
}: {
  rows: TrpPrimaryOutcomeRowViewModel[];
  headers?: string[];
}) {
  const resolvedHeaders =
    headers && (headers.length === 4 || headers.length === 6)
      ? headers
      : ["Strategy", "Mean", "95% CI", "Response Rate"];
  const hasExtendedColumns = resolvedHeaders.length === 6;
  const colWidths = hasExtendedColumns
    ? ["14%", "14%", "20%", "12%", "12%", "28%"]
    : ["18%", "18%", "24%", "40%"];
  const allRows = [
    { cells: resolvedHeaders, isHeader: true },
    ...rows.map((row) => ({
      cells: hasExtendedColumns
        ? [
            row.strategyKey,
            row.meanText,
            row.ciText,
            row.medianText,
            row.nntText,
            row.nntWeek24Text,
          ]
        : [row.strategyKey, row.meanText, row.ciText, row.nntWeek24Text],
      isHeader: false,
      isLast: false,
    })),
  ];
  // mark last data row
  (allRows[allRows.length - 1] as { isLast?: boolean }).isLast = true;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "8px",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        display: "grid",
        gridTemplateRows: `repeat(${Math.max(allRows.length, 1)}, 1fr)`,
        fontFamily: "Inter",
      }}
    >
      {allRows.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: "grid",
            gridTemplateColumns: colWidths.join(" "),
            alignItems: "center",
            borderBottom:
              ri < allRows.length - 1 ? `1px solid ${ri === 0 ? "#929090" : "#c6c5c9"}` : "none",
          }}
        >
          {row.cells.map((cell, ci) => (
            <div
              key={ci}
              style={{
                fontWeight: row.isHeader ? 700 : ci === 0 ? 600 : 400,
                fontSize: row.isHeader ? "clamp(7px, 0.8vw, 13px)" : "clamp(7px, 0.8vw, 11px)",
                color: row.isHeader ? "#262255" : "#787776",
                padding:
                  ci === 0
                    ? "0 6px 0 12px"
                    : ci === row.cells.length - 1
                      ? "0 12px 0 6px"
                      : "0 6px",
                letterSpacing: row.isHeader ? "-0.42px" : "-0.39px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * ResponseProbabilityTable — 반응군 분류 확률 테이블
 * - 행: Strong responder / Partial responder / Non responder / Deteriorator
 * - 열: Category / 전략 A / 전략 B / 전략 C
 * - 각 Strategy 열에서 가장 높은 확률 값은 굵은 텍스트 + 전략 색상으로 강조
 */
function ResponseProbabilityTable({ rows }: { rows: TrpResponseProbabilityRowViewModel[] }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "8px",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "Inter",
          tableLayout: "fixed",
          height: "100%",
        }}
      >
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: `1px solid ${"#929090"}`, height: "25%" }}>
            <th
              style={{
                padding: "8px 6px 8px 12px",
                textAlign: "left",
                fontWeight: 700,
                fontSize: "clamp(7px, 0.8vw, 13px)",
                color: "#262255",
                letterSpacing: "-0.42px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Category
            </th>
            {[
              { label: "Strategy A", color: "#3a11d8" },
              { label: "Strategy B", color: "#f06600" },
              { label: "Strategy C", color: "#24c6c9" },
            ].map(({ label, color }, hi) => (
              <th
                key={label}
                style={{
                  padding: hi === 2 ? "8px 12px 8px 6px" : "8px 6px",
                  textAlign: "left",
                  fontWeight: 700,
                  fontSize: "clamp(7px, 0.8vw, 13px)",
                  color,
                  letterSpacing: "-0.42px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.category} style={{ borderTop: idx > 0 ? "1px solid #c6c5c9" : "none" }}>
              <td
                style={{
                  padding: "0 6px 0 12px",
                  fontWeight: 700,
                  fontSize: "clamp(7px, 0.8vw, 12px)",
                  color: "#262255",
                  letterSpacing: "-0.42px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.category}
              </td>
              {[row.strategyA, row.strategyB, row.strategyC].map(
                ({ text, highlight, color }, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: ci === 2 ? "0 12px 0 6px" : "0 6px",
                      fontWeight: highlight ? 700 : 400,
                      fontSize: "clamp(7px, 0.8vw, 11px)",
                      color: highlight ? color : "#787776",
                      letterSpacing: "-0.39px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {text}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * NonResponderTableProps — NonResponderTable 컴포넌트의 props 타입
 */
interface NonResponderTableProps {
  strategyName: string;
  nameColor: string;
  lineColor: string;
  features: DrdNonResponderFeatureViewModel[];
}

function NonResponderTable({
  strategyName,
  nameColor,
  lineColor,
  features,
}: NonResponderTableProps) {
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        flex: "1 1 0",
        minWidth: 0,
        minHeight: "112px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 헤더 */}
      <div style={{ padding: "8px 0 0 0" }}>
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 17,
            color: nameColor,
            letterSpacing: "-0.6px",
            lineHeight: 1.2,
            paddingLeft: "16px",
            display: "block",
          }}
        >
          {strategyName}
        </span>
      </div>
      {/* 구분선 */}
      <div style={{ height: "1px", background: lineColor, margin: "8px 0 0" }} />
      {/* 테이블 */}
      <div
        style={{
          padding: "0",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "Inter",
            height: "100%",
            tableLayout: "fixed",
          }}
        >
          <thead style={{ height: `${100 / (features.length + 1)}%` }}>
            <tr style={{ height: "100%" }}>
              {["Rank", "Feature condition", "Impact score"].map((h, hi) => (
                <th
                  key={h}
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(9px, 0.8vw, 13px)",
                    color: "#262255",
                    textAlign: "left",
                    paddingLeft: hi === 0 ? "16px" : "4px",
                    paddingRight: hi === 2 ? "16px" : "4px",
                    paddingTop: 0,
                    paddingBottom: 0,
                    letterSpacing: "-0.39px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ height: "100%" }}>
            {features.map((f, i) => (
              <tr
                key={i}
                style={{
                  borderTop: "1px solid #d4d3d6",
                  height: `${100 / (features.length + 1)}%`,
                }}
              >
                {[f.rank, f.condition, f.score].map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      fontWeight: 400,
                      fontSize: "clamp(9px, 0.8vw, 12px)",
                      color: "#484646",
                      padding: "0 4px",
                      paddingLeft: ci === 0 ? "16px" : "4px",
                      paddingRight: ci === 2 ? "16px" : "4px",
                      letterSpacing: "-0.36px",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * EfficacyContent — Efficacy 탭에서 렌더링되는 전체 콘텐츠
 * - 상단: Primary Outcome 카드 + Response Probability 카드
 * - 하단: Simulated Trajectory 스파게티 플롯 + Counterfactual Comparison 히스토그램
 */
function EfficacyContent({ resultViewModel }: { resultViewModel: TrpSimulationResultViewModel }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(10px, 1.2vw, 16px)",
        width: "100%",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* 상단 행: Primary Outcome 카드 + Response Probability 카드 / Top Row: Primary Outcome Card + Response Probability Card */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "stretch",
          flex: 2.25,
          minHeight: 0,
        }}
      >
        {/* Primary Outcome 카드 (평균/CI/NNT 통계 테이블) / Primary Outcome Card (Mean/CI/NNT Table) */}
        <div
          style={{
            flex: 1,
            background: "#262255",
            borderRadius: "22px",
            padding: "8px 16px 16px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-start", paddingTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                style={{
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: "clamp(13px, 1.4vw, 22px)",
                  color: "#fff",
                  letterSpacing: "-0.66px",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Primary Outcome
              </h3>
              <img
                src="/icons/basics/info.svg"
                alt="info"
                width={16}
                height={16}
                style={{ flexShrink: 0, filter: "brightness(0) invert(1) opacity(0.6)" }}
              />
            </div>
          </div>
          {/* 하단 4/4: NNT 텍스트 + 테이블 */}
          <div
            style={{ flex: 4, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0 }}
          >
            {resultViewModel.primaryOutcomeFootnote ? (
              <p
                style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "clamp(10px, 0.9vw, 13px)",
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "-0.33px",
                  lineHeight: 1.2,
                  margin: 0,
                  textAlign: "right",
                  flexShrink: 0,
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {resultViewModel.primaryOutcomeFootnote}
              </p>
            ) : (
              <div style={{ flexShrink: 0, height: "20px" }} />
            )}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {resultViewModel.primaryOutcomeRows.length > 0 ? (
                <PrimaryOutcomeTable
                  rows={resultViewModel.primaryOutcomeRows}
                  headers={resultViewModel.primaryOutcomeHeaders}
                />
              ) : (
                <EmptyCardState message={resultViewModel.primaryOutcomeEmptyMessage} />
              )}
            </div>
          </div>
        </div>

        {/* Response Probability 카드 (반응군 분류 확률 테이블) / Response Probability Card (Responder Classification Table) */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.6)",
            borderRadius: "22px",
            padding: "8px 16px 16px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-start", paddingTop: "4px" }}>
            <h3
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: "clamp(13px, 1.4vw, 22px)",
                color: "#262255",
                letterSpacing: "-0.66px",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Response Probability
            </h3>
          </div>
          {/* 하단 4/4: legend + 테이블 */}
          <div
            style={{ flex: 4, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0 }}
          >
            {/* legend: 오른쪽 정렬, 원형 3개 묶음 + "High Score" 텍스트 */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
                height: "20px",
              }}
            >
              {/* 원형 컨테이너 3개 묶음 */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#3a11d8",
                  }}
                />
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#f06600",
                  }}
                />
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#24c6c9",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "Inter",
                  fontSize: "clamp(10px, 0.9vw, 13px)",
                  color: "#1c1b1b",
                }}
              >
                High Score
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {resultViewModel.responseProbabilityRows.length > 0 ? (
                <ResponseProbabilityTable rows={resultViewModel.responseProbabilityRows} />
              ) : (
                <EmptyCardState message={resultViewModel.responseProbabilityEmptyMessage} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 행: Simulated Trajectory + Counterfactual Comparison / Bottom Row: Trajectory Chart + Histogram Chart */}
      <div
        style={{
          background: "#262255",
          borderRadius: "24px",
          padding: "16px",
          display: "flex",
          gap: "clamp(10px, 1vw, 16px)",
          alignItems: "stretch",
          flex: 3,
          minHeight: 0,
        }}
      >
        {/* 시뮬레이션 궤적 차트 카드 (스파게티 플롯) / Simulated Trajectory Chart Card (Spaghetti Plot) */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-start" }}>
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.2vw, 20px)",
                color: "#262255",
                letterSpacing: "-0.6px",
                margin: 0,
              }}
            >
              Simulated Trajectory
            </h4>
          </div>
          {/* 하단 4/4: 차트 영역 */}
          <div style={{ flex: 4, minHeight: 0 }}>
            {resultViewModel.trajectoryChart.series.length > 0 ? (
              <SpaghettiPlotChart chart={resultViewModel.trajectoryChart} />
            ) : (
              <EmptyCardState message={resultViewModel.trajectoryChart.emptyMessage} />
            )}
          </div>
        </div>

        {/* 반사실 비교 차트 카드 (히스토그램) / Counterfactual Comparison Chart Card (Histogram) */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
          >
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.2vw, 20px)",
                color: "#262255",
                letterSpacing: "-0.6px",
                margin: 0,
              }}
            >
              Counterfactual Comparison
            </h4>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "clamp(9px, 0.9vw, 13px)",
                color: "#1c1b1b",
                margin: 0,
              }}
            >
              Primary Outcome Distribution by Treatment Strategy
            </p>
          </div>
          {/* 하단 4/4: 차트 영역 */}
          <div style={{ flex: 4, minHeight: 0 }}>
            {resultViewModel.counterfactualChart.series.length > 0 ? (
              <HistogramChart chart={resultViewModel.counterfactualChart} />
            ) : (
              <EmptyCardState message={resultViewModel.counterfactualChart.emptyMessage} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getNonResponderStrategyColor(index: number): string {
  return ["#3a11d8", "#f06600", "#24c6c9"][index % 3];
}

function hasNonResponderStrategies(section: DrdNonResponderSectionViewModel): boolean {
  return section.strategies.length > 0;
}

function AERiskContent({
  nonResponderSection,
  aeRiskChart,
  safetyTradeoffChart,
}: {
  nonResponderSection: DrdNonResponderSectionViewModel;
  aeRiskChart: TrpAERiskChartViewModel;
  safetyTradeoffChart: TrpSafetyTradeoffChartViewModel;
}) {
  const [selectedAE, setSelectedAE] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const aeOptions =
    aeRiskChart.aeOptions.length > 0 ? aeRiskChart.aeOptions : safetyTradeoffChart.aeOptions;
  const selectedAESeries =
    selectedAE && aeRiskChart.seriesByAe[selectedAE] ? aeRiskChart.seriesByAe[selectedAE] : null;
  const selectedSafetyTradeoffChart =
    selectedAE && safetyTradeoffChart.pointsByAe[selectedAE]
      ? {
          ...safetyTradeoffChart,
          points: safetyTradeoffChart.pointsByAe[selectedAE],
          emptyMessage:
            safetyTradeoffChart.pointsByAe[selectedAE].length > 0
              ? ""
              : safetyTradeoffChart.emptyMessage,
        }
      : safetyTradeoffChart;

  useEffect(() => {
    if (aeOptions.length === 0) {
      if (selectedAE) setSelectedAE("");
      return;
    }
    if (!aeOptions.includes(selectedAE)) {
      setSelectedAE(aeOptions[0]);
    }
  }, [aeOptions, selectedAE]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* 상단 행: Safety Trade-off 버블차트 + AE Risk 계단 꺾은선 차트 / Top Row: Safety Trade-off Bubble Chart + AE Risk Step Line Chart */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "stretch",
          flex: 3,
          minHeight: 0,
        }}
      >
        {/* Safety Trade-off 카드 (버블 차트: HbA1c 감소 vs AE 확률) / Safety Trade-off Card (Bubble Chart: △HbA1c vs AE Probability) */}
        <div
          style={{
            flex: "1 1 48%",
            background: "#262255",
            borderRadius: "22px",
            padding: "8px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          <h3
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: "clamp(13px, 1.4vw, 22px)",
              color: "#fff",
              letterSpacing: "-0.66px",
              lineHeight: 1.2,
              margin: 0,
              flex: 1,
              minHeight: 0,
              padding: "4px",
            }}
          >
            Safety Trade-off
          </h3>
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              flex: 4,
              minHeight: 0,
              overflow: "hidden",
              padding: "16px 16px 4px",
            }}
          >
            {selectedSafetyTradeoffChart.points.length > 0 ? (
              <BubbleChart chart={selectedSafetyTradeoffChart} />
            ) : (
              <EmptyCardState message={selectedSafetyTradeoffChart.emptyMessage} />
            )}
          </div>
        </div>

        {/* AE Risk 카드 (계단 꺾은선 차트 + 유형 드롭다운) / AE Risk Card (Step Line Chart + AE Type Dropdown) */}
        <div
          style={{
            flex: "1 1 48%",
            background: "#262255",
            borderRadius: "22px",
            padding: "8px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "4px",
            }}
          >
            <h3
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: "clamp(13px, 1.4vw, 22px)",
                color: "#fff",
                letterSpacing: "-0.66px",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              AE Risk
            </h3>
            {/* Dropdown */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => {
                  if (aeOptions.length > 0) {
                    setDropdownOpen((value) => !value);
                  }
                }}
                style={{
                  background: "#efeff4",
                  borderRadius: "8px",
                  padding: "4px 6px 4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  cursor: "pointer",
                  userSelect: "none",
                  minWidth: "120px",
                  height: "28px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: "12px",
                    color: "#484646",
                    letterSpacing: "-0.48px",
                    flex: 1,
                  }}
                >
                  {selectedAE || "Unavailable"}
                </span>
                <img
                  src={
                    dropdownOpen
                      ? "/icons/disclosure/Property%201%3DOpen%2C%20Size%3D18.svg"
                      : "/icons/disclosure/Property%201%3DClose%2C%20Size%3D18.svg"
                  }
                  alt="toggle"
                  width={18}
                  height={18}
                  style={{ flexShrink: 0 }}
                />
              </div>
              {dropdownOpen && aeOptions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 100,
                    minWidth: "120px",
                  }}
                >
                  {aeOptions.map((opt, idx) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setSelectedAE(opt);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        fontFamily: "Inter",
                        fontWeight: opt === selectedAE ? 700 : 500,
                        fontSize: "12px",
                        color: opt === selectedAE ? "#484646" : "#5f5e5e",
                        background: "#fff",
                        cursor: "pointer",
                        letterSpacing: "-0.48px",
                        whiteSpace: "nowrap",
                        borderBottom: idx < aeOptions.length - 1 ? "1px solid #c6c5c9" : "none",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "#f7f7fa";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "#fff";
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              flex: 4,
              minHeight: 0,
              overflow: "hidden",
              padding: "16px 16px 4px",
            }}
          >
            {selectedAESeries && selectedAESeries.series.length > 0 ? (
              <StepLineChart seriesSet={selectedAESeries} yAxisName={aeRiskChart.yAxisName} />
            ) : (
              <EmptyCardState message={aeRiskChart.emptyMessage} />
            )}
          </div>
        </div>
      </div>

      {/* 하단 행: Non responder Identification (전략별 비반응자 특성 피처 테이블) / Bottom Row: Non-responder Identification Feature Tables per Strategy */}
      <div
        style={{
          background: "rgba(255,255,255,0.6)",
          borderRadius: "22px",
          padding: "8px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flex: 2.25,
          minHeight: 0,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: "clamp(13px, 1.5vw, 24px)",
              color: "#262255",
              letterSpacing: "-0.72px",
              lineHeight: 1,
              margin: "0 0 4px",
            }}
          >
            {nonResponderSection.title}
          </h3>
          {nonResponderSection.description ? (
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "clamp(7px, 0.85vw, 11px)",
                color: "#313032",
                letterSpacing: "-0.39px",
                margin: 0,
              }}
            >
              {nonResponderSection.description}
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
          {hasNonResponderStrategies(nonResponderSection) ? (
            nonResponderSection.strategies.map((strategy, index) => {
              const color = getNonResponderStrategyColor(index);

              return (
                <NonResponderTable
                  key={strategy.strategyName}
                  strategyName={strategy.strategyName}
                  nameColor={color}
                  lineColor={color}
                  features={strategy.features}
                />
              );
            })
          ) : (
            <div
              style={{
                flex: 1,
                borderRadius: "16px",
                border: "1px solid rgba(38,34,85,0.12)",
                background: "rgba(255,255,255,0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                minHeight: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: "13px",
                  color: "#484646",
                  letterSpacing: "-0.36px",
                  textAlign: "center",
                }}
              >
                Non-responder identification data is unavailable.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({
  height,
  width = "100%",
  borderRadius = 10,
  style,
}: {
  height: number | string;
  width?: number | string;
  borderRadius?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        background: "#ffffff",
        ...style,
      }}
    />
  );
}

function SimulationResultSkeleton({
  activeTab,
  onTabChange,
  onEditCondition,
}: {
  activeTab: "efficacy" | "ae-risk";
  onTabChange: (tab: "efficacy" | "ae-risk") => void;
  onEditCondition: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flex: 1,
        minHeight: 0,
        gap: "0px",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "stretch",
          gap: "4px",
          minHeight: 0,
        }}
      >
        <div className="figma-nine-slice figma-home-panel-left flex w-[380px] flex-shrink-0 flex-col gap-[28px] overflow-hidden rounded-[36px]">
          <div
            style={{
              borderRadius: "18px",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              position: "relative",
              padding: "6px 4px",
            }}
          >
            <span
              style={{
                position: "relative",
                zIndex: 1,
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 24,
                color: "#262255",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              Simulation strategies
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              padding: "0px",
              overflowY: "auto",
              overflowX: "hidden",
              minHeight: 0,
            }}
          >
            {[0, 1, 2].map((index) => (
              <SkeletonBlock
                key={index}
                height={96}
                borderRadius={16}
                style={{ background: "rgba(255,255,255,0.78)", flexShrink: 0 }}
              />
            ))}

            <SkeletonBlock
              height={172}
              borderRadius={16}
              style={{ background: "#ffffff", flexShrink: 0 }}
            />
            <SkeletonBlock
              height={72}
              borderRadius={16}
              style={{ background: "#ffffff", flexShrink: 0 }}
            />
          </div>

          <div style={{ flexShrink: 0, display: "flex", justifyContent: "right" }}>
            <button
              type="button"
              onClick={onEditCondition}
              style={{
                position: "relative",
                width: "200px",
                height: "40px",
                borderRadius: "36px",
                border: "none",
                cursor: "pointer",
                fontFamily: "Inter",
                fontSize: "clamp(10px, 1.05vw, 18px)",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.6px",
                overflow: "hidden",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "36px",
                  background: "#f06600",
                }}
              />
              <span style={{ position: "relative" }}>Edit Condition</span>
            </button>
          </div>
        </div>

        <div className="figma-nine-slice figma-home-panel-right drd-left-panel flex min-h-0 min-w-[280px] flex-1 flex-col gap-6 overflow-hidden rounded-[36px]">
          <div
            style={{ flexShrink: 0, padding: 6, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 24,
                color: "#262255",
                letterSpacing: "-0.9px",
                lineHeight: 1,
                margin: 0,
              }}
            >
              Summary
            </h2>
            <SkeletonBlock
              height={44}
              borderRadius={14}
              style={{ background: "rgba(255,255,255,0.72)" }}
            />
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "36px",
                padding: "4px",
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                alignSelf: "flex-start",
              }}
            >
              {(["efficacy", "ae-risk"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === "efficacy" ? "Efficacy" : "AE risk";
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => onTabChange(tab)}
                    style={{
                      position: "relative",
                      height: "36px",
                      padding: "0 clamp(14px, 1.6vw, 24px)",
                      borderRadius: "36px",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Inter",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "clamp(11px, 1vw, 16px)",
                      color: isActive ? "#fff" : "#484646",
                      letterSpacing: isActive ? "-0.48px" : "-0.36px",
                      background: "transparent",
                      overflow: "hidden",
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "36px",
                          background: "#262255",
                        }}
                      />
                    )}
                    <span style={{ position: "relative" }}>{label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === "efficacy" ? (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "stretch",
                    flex: 2.25,
                    minHeight: 0,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      background: "#262255",
                      borderRadius: "22px",
                      padding: "8px 16px 16px",
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: "clamp(13px, 1.4vw, 22px)",
                        color: "#fff",
                        letterSpacing: "-0.66px",
                        lineHeight: 1.2,
                        margin: "4px 0 0",
                      }}
                    >
                      Primary Outcome
                    </h3>
                    <SkeletonBlock
                      height="100%"
                      borderRadius={10}
                      style={{ flex: 1, marginTop: 8 }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.6)",
                      borderRadius: "22px",
                      padding: "8px 16px 16px",
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: "clamp(13px, 1.4vw, 22px)",
                        color: "#262255",
                        letterSpacing: "-0.66px",
                        lineHeight: 1.2,
                        margin: "4px 0 0",
                      }}
                    >
                      Response Probability
                    </h3>
                    <SkeletonBlock
                      height="100%"
                      borderRadius={10}
                      style={{ flex: 1, marginTop: 8, background: "#ffffff" }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: "#262255",
                    borderRadius: "24px",
                    padding: "16px",
                    display: "flex",
                    gap: "clamp(10px, 1vw, 16px)",
                    alignItems: "stretch",
                    flex: 3,
                    minHeight: 0,
                  }}
                >
                  {["Simulated Trajectory", "Counterfactual Comparison"].map((title) => (
                    <div
                      key={title}
                      style={{
                        flex: 1,
                        background: "#fff",
                        borderRadius: "10px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        overflow: "hidden",
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "Inter",
                          fontWeight: 700,
                          fontSize: "clamp(12px, 1.2vw, 20px)",
                          color: "#262255",
                          letterSpacing: "-0.6px",
                          margin: 0,
                        }}
                      >
                        {title}
                      </h4>
                      <SkeletonBlock
                        height="100%"
                        borderRadius={8}
                        style={{ flex: 1, marginTop: 10, background: "rgba(38,34,85,0.04)" }}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "stretch",
                    flex: 3,
                    minHeight: 0,
                  }}
                >
                  {["Safety Trade-off", "AE Risk"].map((title) => (
                    <div
                      key={title}
                      style={{
                        flex: "1 1 48%",
                        background: "#262255",
                        borderRadius: "22px",
                        padding: "8px 12px 12px",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "Inter",
                          fontWeight: 700,
                          fontSize: "clamp(13px, 1.4vw, 22px)",
                          color: "#fff",
                          letterSpacing: "-0.66px",
                          lineHeight: 1.2,
                          margin: "4px 4px 0",
                        }}
                      >
                        {title}
                      </h3>
                      <SkeletonBlock
                        height="100%"
                        borderRadius={10}
                        style={{ flex: 1, marginTop: 16 }}
                      />
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "22px",
                    padding: "8px 12px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    flex: 2.25,
                    minHeight: 0,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: "clamp(13px, 1.5vw, 24px)",
                        color: "#262255",
                        letterSpacing: "-0.72px",
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      Non-responder Identification
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "stretch",
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    {[0, 1, 2].map((index) => (
                      <SkeletonBlock
                        key={index}
                        height="100%"
                        borderRadius={16}
                        style={{ flex: 1, background: "#ffffff" }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SimulationResultPage — 시뮬레이션 결과 메인 페이지 컴포넌트
 *
 * 주요 상태:
 *   activeTab — 현재 탭 ("efficacy" | "ae-risk")
 *   showSaveModal — Save Simulation 모달 표시 여부
 *   simName / simDesc — 저장 이름·설명 입력값
 *   selectedOutcome — Primary Outcome 라디오 선택값
 *   strategies — 전략 카드 데이터 배열 (향후 API 매핑 예정)
 */
export default function SimulationResultPage() {
  const router = useRouter();
  const hasHydrated = useTrpSetupStore((state) => state.hasHydrated);
  const analysisResponse = useTrpSetupStore((state) => state.analysisResponse);
  const analysisStatus = useTrpSetupStore((state) => state.analysisStatus);
  const analysisError = useTrpSetupStore((state) => state.analysisError);
  const [activeTab, setActiveTab] = useState<"efficacy" | "ae-risk">("efficacy");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simDesc, setSimDesc] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<TrpDashboardOutcomeOption>("HbA1c");
  const [isOutcomePanelOpen, setIsOutcomePanelOpen] = useState(true);

  const outcomeOptions = analysisResponse?.outcomeOptions ?? [];
  const resolvedOutcome = useMemo<TrpDashboardOutcomeOption | null>(() => {
    if (!analysisResponse) {
      return null;
    }

    return analysisResponse.outcomeOptions.includes(selectedOutcome)
      ? selectedOutcome
      : analysisResponse.defaultOutcome;
  }, [analysisResponse, selectedOutcome]);
  const hasDisplayData = true;
  const displayResultViewModel = useMemo(
    () => {
      const resultViewModel =
        analysisResponse && resolvedOutcome
          ? analysisResponse.resultViewModelByOutcome[resolvedOutcome]
          : null;

      if (!resultViewModel) {
        return null;
      }

      return {
        ...resultViewModel,
        responseProbabilityRows: highlightResponseProbabilityRowsByStrategy(
          resultViewModel.responseProbabilityRows
        ),
      } satisfies TrpSimulationResultViewModel;
    },
    [analysisResponse, resolvedOutcome]
  );
  const displayNonResponderSection: DrdNonResponderSectionViewModel | null = useMemo(
    () =>
      analysisResponse && resolvedOutcome
        ? analysisResponse.nonResponderSectionByOutcome[resolvedOutcome]
        : null,
    [analysisResponse, resolvedOutcome]
  );
  const strategies: StrategyCardProps[] = useMemo(
    () =>
      analysisResponse && resolvedOutcome
        ? analysisResponse.strategyCardsByOutcome[resolvedOutcome].map((strategy, index) => ({
            ...strategy,
            tooltipData: buildMockStrategyTooltipData(index),
          }))
        : [],
    [analysisResponse, resolvedOutcome]
  );
  const summaryText = useMemo(
    () => {
      if (analysisResponse && resolvedOutcome) {
        return analysisResponse.summaryByOutcome[resolvedOutcome];
      }

      return analysisStatus === "failed"
        ? analysisError || "Mock analysis result is unavailable."
        : "Mock analysis result is unavailable.";
    },
    [analysisError, analysisResponse, analysisStatus, resolvedOutcome]
  );
  const populationSummary = useMemo(
    () => analysisResponse?.populationSummary ?? [],
    [analysisResponse]
  );

  useEffect(() => {
    if (!hasHydrated || analysisResponse) {
      return;
    }

    router.replace("/trp/view-summary");
  }, [analysisResponse, hasHydrated, router]);

  useEffect(() => {
    if (!analysisResponse) {
      return;
    }

    setSelectedOutcome(analysisResponse.defaultOutcome);
  }, [analysisResponse]);

  if (!hasHydrated || !analysisResponse || !displayResultViewModel || !displayNonResponderSection) {
    return null;
  }

  return (
    <AppLayout headerType="trp" >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 24px)",
          height: "100%",
          gap: 0,
          overflow: "hidden",
          marginLeft: "8px",
          marginRight: "8px",
        }}
      >
        {/* 전체 페이지 래퍼 / Full Page Wrapper */}
        {/* 콘텐츠 영역 전체 컨테이너 (제목 + 좌우 패널) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            gap: "24px",
          }}
        >
          {/* 페이지 제목 / Page Title */}
          <div style={{ flexShrink: 0, padding: "0 12px" }}>
            <h1
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 42,
                fontWeight: 600,
                color: "rgb(17,17,17)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Drug Response Prediction Dashboard
            </h1>
          </div>
          {hasDisplayData ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                flex: 1,
                minHeight: 0,
                gap: "0px",
              }}
            >
              {/* 좌우 패널 전체 래퍼 / Left-Right Panel Wrapper */}
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "stretch",
                  gap: "4px",
                  minHeight: 0,
                }}
              >
                {/* 왼쪽 패널: 시뮬레이션 전략 목록 / Left Panel: Simulation Strategies */}
                <div className="figma-nine-slice figma-home-panel-left flex w-[380px] flex-shrink-0 flex-col gap-[28px] overflow-hidden rounded-[36px]">
                  {/* 전략 목록 헤더 타이틀 / Strategies Section Title */}
                  <div
                    style={{
                      borderRadius: "18px",
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      position: "relative",
                      padding: "6px 4px",
                    }}
                  >
                    <span
                      style={{
                        position: "relative",
                        zIndex: 1,
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 24,
                        color: "#262255",
                        letterSpacing: "-1px",
                        lineHeight: 1,
                      }}
                    >
                      Simulation strategies
                    </span>
                  </div>

                  {/* 전략 카드 목록 (Strategy A/B/C 카드 + Primary Outcome + Population) / Strategy Cards List */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      padding: "0px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      minHeight: 0,
                    }}
                  >
                    {strategies.length > 0 ? (
                      strategies.map((strategy) => (
                        <StrategyCard key={strategy.name} {...strategy} />
                      ))
                    ) : (
                      <div
                        style={{
                          minHeight: "168px",
                          flexShrink: 0,
                        }}
                      >
                        <EmptyCardState message="Simulation strategy data is unavailable." />
                      </div>
                    )}

                    {/* 시안 기준 MMSE 헤더 + Outcome 선택 라디오 + Population/Follow-up 정보 / MMSE Header + Outcome Radio Selector + Population Info */}
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: isOutcomePanelOpen ? "8px 16px 12px" : "8px 16px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <button
                        type="button"
                        aria-expanded={isOutcomePanelOpen}
                        onClick={() => setIsOutcomePanelOpen((prev) => !prev)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: isOutcomePanelOpen ? "8px" : "0",
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                          style={{
                            flexShrink: 0,
                            transform: isOutcomePanelOpen ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 0.15s ease",
                          }}
                        >
                          <path
                            d="M3.33337 6L8.00004 10.6667L12.6667 6"
                            stroke="#484646"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p
                          style={{
                            fontFamily: "Inter",
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "#484646",
                            margin: 0,
                            lineHeight: 1,
                          }}
                        >
                          MMSE
                        </p>
                      </button>
                      {isOutcomePanelOpen ? (
                        <>
                          <div style={{ height: "1px", background: "#e5e4e8", marginBottom: "0px" }} />
                          {outcomeOptions.map((label, idx) => {
                            const selected = selectedOutcome === label;
                            return (
                              <div
                                key={label}
                                onClick={() => setSelectedOutcome(label)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 0",
                                  borderTop: idx > 0 ? "1px solid #e5e4e8" : "none",
                                  cursor: "pointer",
                                }}
                              >
                                <div
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    border: `2px solid ${selected ? "#3a11d8" : "#c6c5c9"}`,
                                    background: selected ? "#3a11d8" : "transparent",
                                    flexShrink: 0,
                                  }}
                                >
                                  {selected && (
                                    <div
                                      style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        background: "#fff",
                                        margin: "2px",
                                      }}
                                    />
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontFamily: "Inter",
                                    fontWeight: 400,
                                    fontSize: "13px",
                                    color: "#1c1b1b",
                                  }}
                                >
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </>
                      ) : null}
                    </div>

                    {/* 환자 집단 및 추적 관찰 기간 정보 / Population & Follow-up Info */}
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "8px 16px 12px",
                        gap: "4px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {populationSummary.map(({ label, value }) => (
                        <p
                          key={label}
                          style={{
                            fontFamily: "Inter",
                            fontWeight: 500,
                            fontSize: "13px",
                            color: "#1c1b1b",
                            margin: "0 0 0px",
                            lineHeight: 1.1,
                          }}
                        >
                          {label} : {value}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* 조건 편집 이동 버튼 / Edit Condition Navigation Button */}
                  <div style={{ flexShrink: 0, display: "flex", justifyContent: "right" }}>
                    <button
                      type="button"
                      onClick={() => router.push("/trp/view-summary")}
                      style={{
                        position: "relative",
                        width: "200px",
                        height: "40px",
                        borderRadius: "36px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Inter",
                        fontSize: "clamp(10px, 1.05vw, 18px)",
                        fontWeight: 600,
                        color: "#fff",
                        letterSpacing: "-0.6px",
                        overflow: "hidden",
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "36px",
                          background: "#f06600",
                        }}
                      />
                      <span style={{ position: "relative" }}>Edit Condition</span>
                    </button>
                  </div>
                </div>

                {/* 오른쪽 패널: 요약 및 차트 영역 / Right Panel: Summary & Charts */}
                <div className="figma-nine-slice figma-home-panel-right drd-left-panel flex min-h-0 min-w-[280px] flex-1 flex-col gap-6 overflow-hidden rounded-[36px]">
                  {/* 요약 텍스트 영역 / Summary Text Area */}
                  <div
                    style={{
                      flexShrink: 0,
                      padding: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 24,
                        color: "#262255",
                        letterSpacing: "-0.9px",
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      Summary
                    </h2>
                    <p
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 500,
                        fontSize: "clamp(7px, 0.85vw, 11px)",
                        color: "#484646",
                        letterSpacing: "-0.39px",
                        lineHeight: 1.3,
                        margin: 0,
                      }}
                    >
                      {summaryText}
                    </p>
                  </div>

                  {/* 탭 + 탭 콘텐츠 영역 (Efficacy / AE risk) / Tab + Tab Content Area */}
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Efficacy / AE risk 탭 전환 버튼 / Tab Switch Buttons */}
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: "36px",
                        padding: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        flexShrink: 0,
                        alignSelf: "flex-start",
                      }}
                    >
                      {(["efficacy", "ae-risk"] as const).map((tab) => {
                        const isActive = activeTab === tab;
                        const label = tab === "efficacy" ? "Efficacy" : "AE risk";
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            style={{
                              position: "relative",
                              height: "36px",
                              padding: "0 clamp(14px, 1.6vw, 24px)",
                              borderRadius: "36px",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "Inter",
                              fontWeight: isActive ? 700 : 500,
                              fontSize: "clamp(11px, 1vw, 16px)",
                              color: isActive ? "#fff" : "#484646",
                              letterSpacing: isActive ? "-0.48px" : "-0.36px",
                              background: "transparent",
                              overflow: "hidden",
                              transition: "color 0.15s",
                            }}
                          >
                            {isActive && (
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  borderRadius: "36px",
                                  background: "#262255",
                                }}
                              />
                            )}
                            <span style={{ position: "relative" }}>{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 선택된 탭의 콘텐츠 (EfficacyContent / AERiskContent) / Selected Tab Content */}
                    {activeTab === "efficacy" ? (
                      <EfficacyContent resultViewModel={displayResultViewModel} />
                    ) : (
                      <AERiskContent
                        nonResponderSection={displayNonResponderSection}
                        aeRiskChart={displayResultViewModel.aeRiskChart}
                        safetyTradeoffChart={displayResultViewModel.safetyTradeoffChart}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <SimulationResultSkeleton
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEditCondition={() => router.push("/trp/view-summary")}
            />
          )}
        </div>

        {/* 시뮬레이션 저장 버튼 영역 / Save Simulation Button Area */}
        {hasDisplayData ? (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "24px",
            }}
          >
            <TrpCtaButton
              variant="secondary"
              className="h-[34px] px-5 text-[13px] shadow-none"
              onClick={() => setShowSaveModal(true)}
            >
              Save Simulation
            </TrpCtaButton>
          </div>
        ) : null}

        {/* Save Simulation 모달 / Save Simulation Modal */}
        {hasDisplayData && showSaveModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowSaveModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                width: "380px",
                borderRadius: "20px",
                padding: "24px 20px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              {/* 유리 배경 레이어 / Glassmorphism Background Layer */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "20px",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.6)",
                    mixBlendMode: "color-dodge",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.88)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "20px",
                    background: "rgba(0,0,0,0.04)",
                    mixBlendMode: "hard-light",
                  }}
                />
              </div>

              {/* 모달 콘텐츠 영역 / Modal Content Area */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* 모달 제목 / Modal Title */}
                <p
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "18px",
                    color: "#484646",
                    letterSpacing: "-0.54px",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  Save Simulation
                </p>

                {/* 시뮬레이션 이름 및 설명 입력 필드 / Simulation Name & Description Input Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Simulation Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "#484646",
                        letterSpacing: "-0.39px",
                        lineHeight: 1.2,
                        margin: 0,
                      }}
                    >
                      Simulation Name *
                    </p>
                    <input
                      type="text"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="Write a title"
                      style={{
                        height: "40px",
                        borderRadius: "12px",
                        border: "none",
                        background: "#e2e1e5",
                        padding: "0 14px",
                        fontFamily: "Inter",
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "#484646",
                        letterSpacing: "-0.39px",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {/* Description */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "#484646",
                        letterSpacing: "-0.39px",
                        lineHeight: 1.2,
                        margin: 0,
                      }}
                    >
                      Description
                    </p>
                    <input
                      type="text"
                      value={simDesc}
                      onChange={(e) => setSimDesc(e.target.value.slice(0, 30))}
                      placeholder="Enter a Description (max 30 characters)"
                      style={{
                        height: "40px",
                        borderRadius: "12px",
                        border: "none",
                        background: "#e2e1e5",
                        padding: "0 14px",
                        fontFamily: "Inter",
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "#484646",
                        letterSpacing: "-0.39px",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 모달 하단 버튼 영역 / Modal Bottom Button Area */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {/* 닫기 버튼 / Close Button */}
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    width: "112px",
                    height: "44px",
                    borderRadius: "36px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "#262255",
                    letterSpacing: "-0.45px",
                    background: "rgba(255,255,255,0.92)",
                    boxShadow:
                      "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Close
                </button>

                {/* 저장 버튼 / Save Button */}
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    width: "112px",
                    height: "44px",
                    borderRadius: "36px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "#262255",
                    letterSpacing: "-0.45px",
                    background: "rgba(255,255,255,0.92)",
                    boxShadow:
                      "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
