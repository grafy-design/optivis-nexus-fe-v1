/**
 * Simulation Result Page — 시뮬레이션 결과 대시보드 (Step 3)
 *
 * 역할:
 *   counterfactual 시뮬레이션 결과를 전략(A/B/C) 별로 비교·시각화하는 최종 대시보드입니다.
 *   - 왼쪽 패널: 전략 카드 목록(Strategy A/B/C), Primary Outcome 라디오 선택, Population 정보, Edit Condition 버튼
 *   - 오른쪽 패널: Summary 텍스트 + Efficacy / AE Risk 탭 전환
 *
 * Efficacy 탭:
 *   - Primary Outcome 카드 (Mean, 95% CI, Median, NNT 통계 테이블)
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

import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import ReactECharts from "@/components/charts/DynamicECharts";
import {
  EMPTY_DRD_SIMULATION_RESULT_VIEW_MODEL,
  mapDrdSimulationResult,
  type DrdAERiskChartViewModel,
  type DrdAERiskSeriesSetViewModel,
  type DrdCounterfactualChartViewModel,
  type DrdPrimaryOutcomeRowViewModel,
  type DrdResponseProbabilityRowViewModel,
  type DrdSafetyTradeoffChartViewModel,
  type DrdSimulationResultViewModel,
  type DrdTrajectoryChartViewModel,
} from "@/lib/drd-simulation-result-mapper";
import {
  convertDrdSimulationPlayToNonResponderSection,
  EMPTY_DRD_NON_RESPONDER_SECTION,
  type DrdNonResponderFeatureViewModel,
  type DrdNonResponderSectionViewModel,
} from "@/lib/drd-simulation-play-converter";
import {
  DRD_SIMULATION_RESULT_MOCK_NON_RESPONDER_SECTION,
  DRD_SIMULATION_RESULT_MOCK_POPULATION_SUMMARY,
  DRD_SIMULATION_RESULT_MOCK_STRATEGIES,
  DRD_SIMULATION_RESULT_MOCK_SUMMARY_TEXT,
  DRD_SIMULATION_RESULT_MOCK_VIEW_MODEL,
  DRD_SIMULATION_RESULT_USE_MOCK,
} from "@/services/drd-simulation-result-mock-data";
import type { PlayDrdSimulationData } from "@/services/types/drd-service.types";
import { useSimulationStore } from "@/store/simulationStore";
import {
  CHART_COLORS,
  CHART_FONT,
  DRD_COLORS,
  axisLabelBase,
  axisNameBase,
  axisLineWithWidth,
  axisTickHidden,
  axisTickVisible,
  tooltipBase,
  splitLineHidden,
  splitLineVisible,
  tooltipAxisCross,
  tooltipAxisShadow,
  tooltipItem,
} from "@/lib/chart-styles";

// ── 차트 컴포넌트 (인라인) ────────────────────────────────────────────────────

/**
 * SpaghettiPlotChart — 전략별 HbA1c 감소 궤적을 보여주는 스파게티 플롯
 * - X축: 증상 발생 후 경과 개월 (0~24개월)
 * - Y축: HbA1c 감소량 (0~-4)
 * - 전략 A(파랑)/B(주황)/C(청록) 3개 라인 + 점선 마커
 */
function SpaghettiPlotChart({
  chart,
}: {
  chart: DrdTrajectoryChartViewModel;
}) {
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
              color: DRD_COLORS.markLine,
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
        color: CHART_COLORS.NEUTRAL_50,
        type: "dashed" as const,
        width: 1,
      },
    })),
  ];
  const option = {
    grid: { left: 42, right: 8, top: 8, bottom: 56 },
    xAxis: {
      type: "category" as const,
      data: chart.xAxisValues,
      boundaryGap: false,
      axisLine: axisLineWithWidth, axisTick: axisTickHidden,
      axisLabel: { ...axisLabelBase, margin: 4 },
      splitLine: splitLineVisible(),
      name: chart.xAxisName, nameLocation: "middle" as const, nameGap: 24,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
    },
    yAxis: {
      type: "value" as const, min: yMin, max: yMax, interval,
      axisLine: axisLineWithWidth, axisTick: axisTickVisible,
      axisLabel: { ...axisLabelBase, margin: 6, formatter: (v: number) => v.toFixed(1) },
      splitLine: splitLineVisible(),
      name: chart.yAxisName, nameLocation: "middle" as const, nameGap: 28,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
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
                color: CHART_COLORS.NEUTRAL_30,
                fontFamily: CHART_FONT.family,
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
      textStyle: { color: CHART_COLORS.NEUTRAL_50, fontFamily: CHART_FONT.family, fontSize: 11, fontWeight: 500 },
    },
    tooltip: {
      ...tooltipAxisCross,
      backgroundColor: "rgba(255,255,255,0.96)",
      textStyle: { ...tooltipBase.textStyle, color: CHART_COLORS.NEUTRAL_50 },
    },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

/**
 * HistogramChart — Primary Outcome(HbA1c 변화량) 분포를 전략별로 겹쳐서 보여주는 히스토그램
 * - X축: Primary Outcome Change(△HbA1c), Y축: 환자 수
 * - 각 x 위치에서 전략별 값을 크기 기준 내림차순 slot으로 레이어링해 중첩 막대 표현
 */
function HistogramChart({
  chart,
}: {
  chart: DrdCounterfactualChartViewModel;
}) {
  const xLabels = chart.bins.map((bin) => bin.toFixed(1));
  const strategies = chart.series.map((series) => ({
    name: series.strategyLabel,
    color: series.color,
    data: series.counts,
  }));

  // 각 x 위치마다 값 크기 기준 내림차순 rank → slot0=최대, slot1=중간, slot2=최소
  // slot별 데이터: { value: 실제값, itemStyle: { color: 해당전략색 } }
  const n = xLabels.length;
  const slots: { value: number; itemStyle: { color: string; borderRadius: number[] } }[][] =
    strategies.map(() => []);

  for (let xi = 0; xi < n; xi++) {
    const ranked = strategies
      .map((strategy, index) => ({ index, v: strategy.data[xi] }))
      .sort((a, b) => b.v - a.v); // 내림차순: 큰 값이 slot0(뒤에 그려짐)
    ranked.forEach((item, rank) => {
      slots[rank].push({
        value: item.v,
        itemStyle: { color: strategies[item.index].color, borderRadius: [2, 2, 0, 0] },
      });
    });
  }

  const maxCount = Math.max(
    ...chart.series.flatMap((series) => series.counts),
    1
  );
  const option = {
    grid: { left: 40, right: 4, top: 8, bottom: 54 },
    xAxis: {
      type: "category" as const, data: xLabels,
      axisLine: axisLineWithWidth, axisTick: axisTickHidden,
      axisLabel: { ...axisLabelBase, interval: 4, margin: 4 },
      splitLine: splitLineHidden,
      name: "Primary Outcome Change (△)", nameLocation: "middle" as const, nameGap: 24,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
    },
    yAxis: {
      type: "value" as const, min: 0, max: Math.ceil(maxCount * 1.15), interval: Math.max(1, Math.ceil(maxCount / 5)),
      axisLine: axisLineWithWidth, axisTick: axisTickVisible,
      axisLabel: { ...axisLabelBase, margin: 6 },
      splitLine: splitLineVisible(),
      name: "Patient Count", nameLocation: "middle" as const, nameGap: 28,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
    },
    series: slots.map((slotData) => ({
      type: "bar" as const,
      data: slotData,
      barWidth: "100%",
      barGap: "-100%",
      barCategoryGap: "0%",
      emphasis: { disabled: true },
      itemStyle: { opacity: 0.8 },
    })),
    legend: { show: strategies.length > 0, bottom: 0, icon: "roundRect", itemWidth: 24, itemHeight: 8, data: strategies.map((strategy) => ({ name: strategy.name, itemStyle: { color: strategy.color } })), textStyle: { color: CHART_COLORS.NEUTRAL_50, fontFamily: CHART_FONT.family, fontSize: 11, fontWeight: 500 } },
    tooltip: {
      ...tooltipAxisShadow,
      backgroundColor: "rgba(255,255,255,0.96)",
      textStyle: { ...tooltipBase.textStyle, color: CHART_COLORS.NEUTRAL_50 },
    },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

/**
 * BubbleChart — Safety Trade-off 버블 차트
 * - X축: △HbA1c (효능), Y축: AE 확률(%)
 * - 버블 크기: 상대적 빈도/위험 규모를 시각적으로 표현
 * - A(파랑)/B(주황)/C(청록) 세 전략을 각각 원 하나로 표현
 */
function BubbleChart({
  chart,
}: {
  chart: DrdSafetyTradeoffChartViewModel;
}) {
  const xValues = chart.points.map((point) => point.xValue);
  const yValues = chart.points.map((point) => point.yValue);
  const maxX = Math.max(...xValues, 1);
  const minX = Math.min(...xValues, 0);
  const maxY = Math.max(...yValues, 1);
  const option = {
    grid: { left: 36, right: 8, top: 4, bottom: 40 },
    xAxis: {
      type: "value" as const, min: Math.floor(minX), max: Math.ceil(maxX * 1.1), interval: Math.max(1, Math.ceil((maxX - minX || 1) / 3)),
      axisLine: axisLineWithWidth, axisTick: axisTickHidden,
      axisLabel: { ...axisLabelBase, margin: 4 },
      splitLine: splitLineHidden,
      name: chart.xAxisName, nameLocation: "middle" as const, nameGap: 16,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
    },
    yAxis: {
      type: "value" as const, min: 0, max: Math.ceil(maxY * 1.15), interval: Math.max(1, Math.ceil(maxY / 4)),
      axisLine: axisLineWithWidth, axisTick: axisTickVisible,
      axisLabel: { ...axisLabelBase, margin: 6 },
      splitLine: splitLineVisible(),
      name: chart.yAxisName, nameLocation: "middle" as const, nameGap: 24,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
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
        fontFamily: CHART_FONT.family,
        fontSize: 11,
        fontWeight: 700,
      },
    })),
    tooltip: {
      ...tooltipItem,
      backgroundColor: "rgba(255,255,255,0.96)",
      textStyle: { ...tooltipBase.textStyle, color: CHART_COLORS.NEUTRAL_50 },
    },
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
  seriesSet: DrdAERiskSeriesSetViewModel;
  yAxisName: string;
}) {
  const maxY = Math.max(
    ...seriesSet.series.flatMap((series) =>
      series.data.filter((value): value is number => value !== null)
    ),
    1
  );
  const option = {
    grid: { left: 40, right: 8, top: 4, bottom: 40 },
    xAxis: {
      type: "category" as const, data: seriesSet.xAxisValues,
      axisLine: axisLineWithWidth, axisTick: axisTickHidden,
      axisLabel: { ...axisLabelBase, margin: 4 },
      splitLine: splitLineVisible(),
      name: "Years since treatment start", nameLocation: "middle" as const, nameGap: 16,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
    },
    yAxis: {
      type: "value" as const, min: 0, max: Math.ceil(maxY * 1.15), interval: Math.max(1, Math.ceil(maxY / 4)),
      axisLine: axisLineWithWidth, axisTick: axisTickVisible,
      axisLabel: { ...axisLabelBase, margin: 6 },
      splitLine: splitLineVisible(),
      name: yAxisName, nameLocation: "middle" as const, nameGap: 28,
      nameTextStyle: { ...axisNameBase, fontWeight: 600 },
    },
    series: seriesSet.series.map((series) => ({
      name: series.strategyLabel,
      type: "line" as const,
      step: "end" as const,
      data: series.data,
      symbol: "none",
      lineStyle: { color: series.color, width: 2 },
      areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${series.color}50` }, { offset: 1, color: `${series.color}08` }] } },
      itemStyle: { color: series.color },
    })),
    legend: { show: seriesSet.series.length > 0, bottom: 0, icon: "roundRect", itemWidth: 24, itemHeight: 3, padding: [0, 0, 2, 0], data: seriesSet.series.map((series) => ({ name: series.strategyLabel, itemStyle: { color: series.color } })), textStyle: { color: CHART_COLORS.NEUTRAL_50, fontFamily: CHART_FONT.family, fontSize: 9, fontWeight: 500 } },
    tooltip: {
      ...tooltipAxisCross,
      backgroundColor: "rgba(255,255,255,0.96)",
      textStyle: { ...tooltipBase.textStyle, color: CHART_COLORS.NEUTRAL_50 },
    },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

function EmptyCardState({ message }: { message: string }) {
  return (
    <div
      className="w-full h-full min-h-0 flex items-center justify-center box-border"
      style={{
        borderRadius: "10px",
        border: "1px solid rgba(38,34,85,0.12)",
        background: "rgba(255,255,255,0.72)",
        padding: "24px",
      }}
    >
      <p
        className="text-captionm"
        style={{
          margin: 0,
          color: COLOR_NEUTRAL_30,
          textAlign: "center",
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ── 이미지 경로 ───────────────────────────────────────────────────────────────
const imgFrame1618873826 = "/figma-assets/159570a2cd4a5962c7b68be950ef1ec97d5cd2e1.svg";


// ── 전역 색상 상수 ────────────────────────────────────────────────────────────
const COLOR_STRATEGY_A = "var(--chart-set06-group01)";  // 전략 A (파랑)
const COLOR_STRATEGY_B = "var(--chart-set06-group02)";  // 전략 B (주황)
const COLOR_STRATEGY_C = "var(--chart-set06-group03)";  // 전략 C (청록)
const COLOR_PRIMARY    = "var(--chart-set00-traditional)";  // 메인 브랜드 컬러
const COLOR_NEUTRAL_10 = "var(--chart-text-strong)";     // 중립 10단계
const COLOR_NEUTRAL_30 = "var(--chart-text-category-title)"; // 중립 30단계
const COLOR_NEUTRAL_40 = "var(--chart-axis-subtle)";     // 중립 40단계
const COLOR_NEUTRAL_60 = "var(--chart-axis-muted)";      // 중립 60단계
const COLOR_TABLE_BODY = "var(--chart-text-axis-value)";  // 테이블 본문 텍스트

// ── 전략 카드 툴팁 ────────────────────────────────────────────────────────────

/**
 * StrategyTooltipData — 전략 카드 info 아이콘 호버 시 표시할 툴팁 데이터 타입
 * - groups: 약물 그룹 목록 (그룹명, 약물 이름 배열, 컬러)
 */
interface StrategyTooltipData {
  groups: { label: string; items: string[]; color: string }[];
}

/**
 * StrategyInfoTooltip — 전략 카드 info 아이콘 호버 시 나타나는 포탈 기반 툴팁
 * - 약물 그룹(GLP-1 RA, SGLT2 inhibitors 등)별로 막대 바 레이아웃으로 표시
 * - anchorRect: info 아이콘의 DOMRect — 툴팁 위치 계산에 사용 (anchorRect.right + 12)
 * - createPortal로 document.body에 렌더링하여 overflow:hidden 클리핑 방지
 */
function StrategyInfoTooltip({ data, anchorRect }: { data: StrategyTooltipData; anchorRect: DOMRect }) {
  const top = anchorRect.top + anchorRect.height / 2;
  const left = anchorRect.right + 12;

  // 좌측 텍스트 영역 너비
  const LEFT_W = 112;
  const PADDING = 16;

  // 그룹별로 아이템 행 생성 (레이블 행 + 아이템 행들)
  const rows: { type: "label"; text: string } | { type: "item"; text: string; color: string; widthFraction: number } extends infer R
    ? R[]
    : never = [];

  data.groups.forEach((group, gi) => {
    rows.push({ type: "label", text: group.label } as const);
    group.items.forEach((item, ii) => {
      const widths = [0.58, 0.42, 0.72, 0.35];
      rows.push({ type: "item", text: item, color: group.color, widthFraction: widths[(gi * 2 + ii) % widths.length] } as const);
    });
  });

  const content = (
    <div
      className="fixed pointer-events-none overflow-hidden flex flex-col"
      style={{
        left,
        top,
        transform: "translateY(-50%)",
        zIndex: 9999,
        width: 378,
        borderRadius: 24,
        boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        background: "white",
        padding: `${PADDING - 8}px ${PADDING}px ${PADDING}px`,
        gap: 0,
      }}
    >
      {/* X축 레이블 */}
      <div
        className="flex justify-between"
        style={{
          marginLeft: LEFT_W,
          marginBottom: 6,
          fontWeight: 500,
          fontSize: 11,
          color: "var(--chart-axis-muted)",
          letterSpacing: "-0.44px",
        }}
      >
        {["0", "3", "6", "9", "12"].map((v) => <span key={v}>{v}</span>)}
      </div>

      {/* 행 목록: 좌측 텍스트 + 우측 바 */}
      <div className="relative flex flex-col" style={{ gap: 0 }}>
        {/* 수직 그리드 라인 (바 영역 위에 오버레이) */}
        <div className="absolute flex justify-between pointer-events-none" style={{ top: 0, bottom: 0, left: LEFT_W, right: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-full" style={{ width: 1, background: "rgba(0,0,0,0.10)" }} />
          ))}
        </div>

        {rows.map((row, i) =>
          row.type === "label" ? (
            <div key={i} className="flex items-center" style={{ height: 22, marginTop: i === 0 ? 0 : 10 }}>
              <span className="shrink-0" style={{
                width: LEFT_W,
                fontWeight: 500,
                fontSize: 11,
                color: "var(--chart-axis-muted)",
                letterSpacing: "-0.44px",
                lineHeight: 1.1,
              }}>
                {row.text}
              </span>
            </div>
          ) : (
            <div key={i} className="flex items-center" style={{ height: 24, marginTop: 4 }}>
              {/* 좌측: 아이템 이름 */}
              <span className="shrink-0 overflow-hidden text-caption" style={{
                width: LEFT_W,
                color: "var(--chart-text-strong)",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}>
                {(row as { text: string }).text}
              </span>
              {/* 우측: 바 */}
              <div className="flex-1 relative h-full flex items-center">
                <div style={{
                  height: 8,
                  borderRadius: 4,
                  background: (row as { color: string }).color,
                  width: `${(row as { widthFraction: number }).widthFraction * 100}%`,
                }} />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

/** StrategyCard 컴포넌트 props 타입 */
interface StrategyCardProps {
  name: string;          // 전략명 (예: "Strategy A")
  nameColor: string;     // 전략명 텍스트 색상
  target: string;        // 목표 설명 (예: "HbA1c / Increase 10% / 3 Months")
  drugs: string[];       // 주요 약물 목록
  extraDrug?: string;    // 추가 약물 이름 (아이콘과 함께 표시)
  lineColor: string;     // 헤더 하단 구분선 색상
  tooltipData: StrategyTooltipData; // info 아이콘 호버 툴팁 데이터
}

/**
 * StrategyCard — 왼쪽 패널에 표시되는 전략 요약 카드
 * - 헤더: 전략명 + info 아이콘 (hover 시 StrategyInfoTooltip 표시)
 * - 콘텐츠: 목표 텍스트 + 약물 번호 목록 + extraDrug(선택)
 */
function StrategyCard({ name, nameColor, target, drugs, extraDrug, lineColor, tooltipData }: StrategyCardProps) {
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
      className="relative shrink-0 w-full"
      style={{
        background: "#ffffff",
        borderRadius: "16px",
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center"
        style={{
          gap: "8px",
          padding: "8px 16px 8px",
          borderBottom: `2px solid ${lineColor}`,
          margin: 0,
        }}
      >
        <span
          className="text-body3"
          style={{
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
          className="shrink-0 cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        {showTooltip && anchorRect && (
          <StrategyInfoTooltip data={tooltipData} anchorRect={anchorRect} />
        )}
      </div>
      {/* 콘텐츠 */}
      <div className="flex flex-col" style={{ padding: "12px 16px 12px", gap: "4px" }}>
        <p
          className="text-captionm"
          style={{
            color: COLOR_NEUTRAL_10,
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {target}
        </p>
        <div className="flex flex-col" style={{ gap: "0px" }}>
          {drugs.map((drug, i) => (
            <p
              key={i}
              className="flex items-center text-body5m"
              style={{
                color: COLOR_NEUTRAL_40,
                letterSpacing: "-0.42px",
                lineHeight: 1.1,
                margin: 0,
                paddingLeft: "16px",
                height: "1.4em",
              }}
            >
              {i + 1}. {drug}
            </p>
          ))}
          {extraDrug && (
            <div className="flex items-center" style={{ gap: "4px", paddingLeft: "16px", height: "1.4em" }}>
              <img src={imgFrame1618873826} alt="" style={{ height: "11px", objectFit: "contain" }} />
              <p
                className="text-body5m"
                style={{
                  color: COLOR_NEUTRAL_40,
                  letterSpacing: "-0.42px",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {extraDrug}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PrimaryOutcomeTable — Primary Outcome 통계 테이블
 * - 열: Strategy / Mean / 95% CI / Median / NNT* / NNT at Week 24
 * - 행: 전략 A / B / C 각각의 HbA1c 변화량 통계
 */
function PrimaryOutcomeTable({
  rows,
}: {
  rows: DrdPrimaryOutcomeRowViewModel[];
}) {
  const headers = ["Strategy", "Mean", "95% CI", "Median", "NNT*", "NNT at Week 24"];
  const colWidths = ["16%", "13%", "19%", "13%", "12%", "27%"];
  const allRows = [
    { cells: headers, isHeader: true },
    ...rows.map((row) => ({
      cells: [
        row.strategyKey,
        row.meanText,
        row.ciText,
        row.medianText,
        row.nntText,
        row.nntWeek24Text,
      ],
      isHeader: false,
      isLast: false,
    })),
  ];
  // mark last data row
  (allRows[allRows.length - 1] as { isLast?: boolean }).isLast = true;

  return (
    <div
      className="overflow-y-auto overflow-x-hidden h-full"
      style={{
        background: "#fff",
        borderRadius: "8px",
        display: "grid",
        gridTemplateRows: `repeat(${Math.max(allRows.length, 1)}, 1fr)`,
      }}
    >
      {allRows.map((row, ri) => (
        <div
          key={ri}
          className="items-center"
          style={{
            display: "grid",
            gridTemplateColumns: colWidths.join(" "),
            borderBottom: ri < allRows.length - 1
              ? `1px solid ${ri === 0 ? COLOR_NEUTRAL_60 : "var(--neutral-80)"}`
              : "none",
          }}
        >
          {row.cells.map((cell, ci) => (
            <div
              key={ci}
              className={`overflow-hidden ${row.isHeader ? "text-caption" : "text-body5m"}`}
              style={{
                fontWeight: row.isHeader ? 700 : ci === 0 ? 600 : 500,
                color: row.isHeader ? COLOR_PRIMARY : COLOR_TABLE_BODY,
                padding: ci === 0 ? "0 6px 0 12px" : ci === 5 ? "0 12px 0 6px" : "0 6px",
                letterSpacing: row.isHeader ? "-0.42px" : "-0.39px",
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
 * - 가장 높은 확률의 전략은 굵은 텍스트 + 전략 색상으로 강조
 */
function ResponseProbabilityTable({
  rows,
}: {
  rows: DrdResponseProbabilityRowViewModel[];
}) {
  return (
    <div
      className="overflow-y-auto overflow-x-hidden h-full flex flex-col"
      style={{
        background: "#fff",
        borderRadius: "8px",
      }}
    >
      <table className="w-full h-full" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLOR_NEUTRAL_60}`, height: "25%" }}>
            <th className="overflow-hidden text-caption" style={{ padding: "8px 6px 8px 12px", textAlign: "left", fontWeight: 700, color: COLOR_PRIMARY, letterSpacing: "-0.42px", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Category
            </th>
            {[
              { label: "Strategy A", color: COLOR_STRATEGY_A },
              { label: "Strategy B", color: COLOR_STRATEGY_B },
              { label: "Strategy C", color: COLOR_STRATEGY_C },
            ].map(({ label, color }, hi) => (
              <th
                key={label}
                style={{
                  padding: hi === 2 ? "8px 12px 8px 6px" : "8px 6px",
                  textAlign: "left",
                  fontWeight: 700,
                  color,
                  letterSpacing: "-0.42px",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                className="overflow-hidden text-caption"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.category}
              style={{ borderTop: idx > 0 ? "1px solid var(--neutral-80)" : "none" }}
            >
              <td className="overflow-hidden text-body5" style={{ padding: "0 6px 0 12px", fontWeight: 700, color: "var(--chart-text-axis-value)", letterSpacing: "-0.42px", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.category}
              </td>
              {[row.strategyA, row.strategyB, row.strategyC].map(
                ({ text, highlight, color }, ci) => (
                <td
                  key={ci}
                  className="overflow-hidden text-body5m"
                  style={{
                    padding: ci === 2 ? "0 12px 0 6px" : "0 6px",
                    fontWeight: highlight ? 700 : 500,
                    color: highlight ? color : COLOR_TABLE_BODY,
                    letterSpacing: "-0.39px",
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
      className="relative overflow-hidden flex-1 min-w-0 flex flex-col"
      style={{
        background: "#fff",
        borderRadius: "12px",
        minHeight: "112px",
      }}
    >
      {/* 헤더 */}
      <div style={{ padding: "8px 0 0 0" }}>
        <span
          className="text-body3"
          style={{
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
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto" style={{ padding: "0" }}>
        <table className="w-full h-full" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead style={{ height: `${100 / (features.length + 1)}%` }}>
            <tr className="h-full">
              {["Rank", "Feature condition", "Impact score"].map((h, hi) => (
                <th
                  key={h}
                  className="text-caption"
                  style={{
                    fontWeight: 700,
                    color: COLOR_PRIMARY,
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
          <tbody className="h-full">
            {features.map((f, i) => (
              <tr key={i} style={{ borderTop: "1px solid #d4d3d6", height: `${100 / (features.length + 1)}%` }}>
                {[f.rank, f.condition, f.score].map((cell, ci) => (
                  <td
                    key={ci}
                    className="text-body5m"
                    style={{
                      color: COLOR_NEUTRAL_30,
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
function EfficacyContent({
  resultViewModel,
}: {
  resultViewModel: DrdSimulationResultViewModel;
}) {
  return (
    <div
      className="flex flex-col w-full flex-1 min-h-0 overflow-hidden"
      style={{
        gap: "clamp(10px, 1.2vw, 16px)",
      }}
    >
      {/* 상단 행: Primary Outcome 카드 + Response Probability 카드 / Top Row: Primary Outcome Card + Response Probability Card */}
      <div
        className="flex items-stretch min-h-0"
        style={{
          gap: 12,
          flex: 2.25,
        }}
      >
        {/* Primary Outcome 카드 (평균/CI/NNT 통계 테이블) / Primary Outcome Card (Mean/CI/NNT Table) */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{
            background: COLOR_PRIMARY,
            borderRadius: "22px",
            padding: "8px 16px 16px",
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div className="flex-1 flex items-start" style={{ paddingTop: "4px" }}>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <h3
                className="text-body2"
                style={{
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
                className="shrink-0"
                style={{ filter: "brightness(0) invert(1) opacity(0.6)" }}
              />
            </div>
          </div>
          {/* 하단 4/4: NNT 텍스트 + 테이블 */}
          <div className="flex flex-col min-h-0" style={{ flex: 4, gap: "6px" }}>
            <p
              className="shrink-0 flex items-center justify-end text-captionm"
              style={{
                fontWeight: 400,
                color: "rgba(255,255,255,0.75)",
                letterSpacing: "-0.33px",
                lineHeight: 1.2,
                margin: 0,
                textAlign: "right",
                height: "20px",
              }}
            >
              *NNT at Week 24
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {resultViewModel.primaryOutcomeRows.length > 0 ? (
                <PrimaryOutcomeTable rows={resultViewModel.primaryOutcomeRows} />
              ) : (
                <EmptyCardState
                  message={resultViewModel.primaryOutcomeEmptyMessage}
                />
              )}
            </div>
          </div>
        </div>

        {/* Response Probability 카드 (반응군 분류 확률 테이블) / Response Probability Card (Responder Classification Table) */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{
            background: "rgba(255,255,255,0.6)",
            borderRadius: "22px",
            padding: "8px 16px 16px",
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div className="flex-1 flex items-start" style={{ paddingTop: "4px" }}>
            <h3
              className="text-body2"
              style={{
                color: COLOR_PRIMARY,
                letterSpacing: "-0.66px",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Response Probability
            </h3>
          </div>
          {/* 하단 4/4: legend + 테이블 */}
          <div className="flex flex-col min-h-0" style={{ flex: 4, gap: "6px" }}>
            {/* legend: 오른쪽 정렬, 원형 3개 묶음 + "High Score" 텍스트 */}
            <div className="flex justify-end items-center shrink-0" style={{ gap: "6px", height: "20px" }}>
              {/* 원형 컨테이너 3개 묶음 */}
              <div className="flex items-center" style={{ gap: "4px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR_STRATEGY_A }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR_STRATEGY_B }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR_STRATEGY_C }} />
              </div>
              <span className="text-body5 text-[var(--chart-legend-text)]">High Score</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {resultViewModel.responseProbabilityRows.length > 0 ? (
                <ResponseProbabilityTable
                  rows={resultViewModel.responseProbabilityRows}
                />
              ) : (
                <EmptyCardState
                  message={resultViewModel.responseProbabilityEmptyMessage}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 행: Simulated Trajectory + Counterfactual Comparison / Bottom Row: Trajectory Chart + Histogram Chart */}
      <div
        className="flex items-stretch min-h-0"
        style={{
          background: COLOR_PRIMARY,
          borderRadius: "24px",
          padding: "16px",
          gap: "clamp(10px, 1vw, 16px)",
          flex: 3,
        }}
      >
        {/* 시뮬레이션 궤적 차트 카드 (스파게티 플롯) / Simulated Trajectory Chart Card (Spaghetti Plot) */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden p-4"
          style={{
            background: "#fff",
            borderRadius: "10px",
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div className="flex-1 flex items-start">
            <h4 className="text-body3" style={{ color: COLOR_PRIMARY }}>
              Simulated Trajectory
            </h4>
          </div>
          {/* 하단 4/4: 차트 영역 */}
          <div className="min-h-0 mb-[-12px]" style={{ flex: 4 }}>
            {resultViewModel.trajectoryChart.series.length > 0 ? (
              <SpaghettiPlotChart chart={resultViewModel.trajectoryChart} />
            ) : (
              <EmptyCardState message={resultViewModel.trajectoryChart.emptyMessage} />
            )}
          </div>
        </div>

        {/* 반사실 비교 차트 카드 (히스토그램) / Counterfactual Comparison Chart Card (Histogram) */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden p-4"
          style={{
            background: "#fff",
            borderRadius: "10px",
          }}
        >
          {/* 상단 1/4: 헤더 영역 */}
          <div className="flex-1 flex flex-col justify-start">
            <h4
              className="text-body3"
              style={{
                color: COLOR_PRIMARY,
                letterSpacing: "-0.6px",
                margin: 0,
              }}
            >
              Counterfactual Comparison
            </h4>
            <p className="text-body5 text-text-secondary">
              Primary Outcome Distribution by Treatment Strategy
            </p>
          </div>
          {/* 하단 4/4: 차트 영역 */}
          <div className="min-h-0 mb-[-12px]" style={{ flex: 4 }}>
            {resultViewModel.counterfactualChart.series.length > 0 ? (
              <HistogramChart chart={resultViewModel.counterfactualChart} />
            ) : (
              <EmptyCardState
                message={resultViewModel.counterfactualChart.emptyMessage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const NON_RESPONDER_STRATEGY_COLORS = [COLOR_STRATEGY_A, COLOR_STRATEGY_B, COLOR_STRATEGY_C];

const getNonResponderStrategyColor = (index: number): string =>
  NON_RESPONDER_STRATEGY_COLORS[index % NON_RESPONDER_STRATEGY_COLORS.length];

const hasNonResponderStrategies = (
  section: DrdNonResponderSectionViewModel
): boolean => section.strategies.length > 0;

type SimulationResultRecord = Record<string, unknown>;

const isSimulationResultRecord = (
  value: unknown
): value is SimulationResultRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyResultArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length > 0;

const hasNonResponderPayload = (value: unknown): boolean => {
  if (isNonEmptyResultArray(value)) return true;
  if (!isSimulationResultRecord(value)) return false;
  return Array.isArray(value.strategies) && value.strategies.length > 0;
};

const RESULT_ARRAY_KEYS: Array<keyof PlayDrdSimulationData> = [
  "trajectory",
  "strategy_output",
  "primary_outcome_summary",
  "simulated_trajectory",
  "simulated_trajectory_stats",
  "counterfactual_comparison",
  "safety_tradeoff",
  "ae_risk",
];

const hasPlayableSimulationResult = (value: unknown): boolean => {
  if (!isSimulationResultRecord(value)) return false;

  const payload = isSimulationResultRecord(value.data) ? value.data : value;

  if (RESULT_ARRAY_KEYS.some((key) => isNonEmptyResultArray(payload[key]))) {
    return true;
  }

  return (
    hasNonResponderPayload(payload.safety_tradeoff_ranking) ||
    hasNonResponderPayload(payload.non_responder_identification)
  );
};

function AERiskContent({
  nonResponderSection,
  aeRiskChart,
  safetyTradeoffChart,
}: {
  nonResponderSection: DrdNonResponderSectionViewModel;
  aeRiskChart: DrdAERiskChartViewModel;
  safetyTradeoffChart: DrdSafetyTradeoffChartViewModel;
}) {
  const [selectedAE, setSelectedAE] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const aeOptions = aeRiskChart.aeOptions;
  const selectedAESeries =
    selectedAE && aeRiskChart.seriesByAe[selectedAE]
      ? aeRiskChart.seriesByAe[selectedAE]
      : null;

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
      className="flex flex-col w-full flex-1 min-h-0 overflow-hidden"
      style={{ gap: "16px" }}
    >
      {/* 상단 행: Safety Trade-off 버블차트 + AE Risk 계단 꺾은선 차트 / Top Row: Safety Trade-off Bubble Chart + AE Risk Step Line Chart */}
      <div
        className="flex items-stretch min-h-0"
        style={{ gap: "16px", flex: 3 }}
      >
        {/* Safety Trade-off 카드 (버블 차트: HbA1c 감소 vs AE 확률) / Safety Trade-off Card (Bubble Chart: △HbA1c vs AE Probability) */}
        <div
          className="flex flex-col min-w-0"
          style={{
            flex: "1 1 48%",
            background: COLOR_PRIMARY,
            borderRadius: "22px",
            padding: "8px 12px 12px",
            gap: "16px",
          }}
        >
          <h3
            className="flex-1 min-h-0 text-body2"
            style={{
              color: "#fff",
              letterSpacing: "-0.66px",
              lineHeight: 1.2,
              margin: 0,
              padding: "4px",
            }}
          >
            Safety Trade-off
          </h3>
          <div
            className="min-h-0 overflow-hidden"
            style={{
              background: "#fff",
              borderRadius: "10px",
              flex: 4,
              padding: "16px 16px 4px",
            }}
          >
            {safetyTradeoffChart.points.length > 0 ? (
              <BubbleChart chart={safetyTradeoffChart} />
            ) : (
              <EmptyCardState message={safetyTradeoffChart.emptyMessage} />
            )}
          </div>
        </div>

        {/* AE Risk 카드 (계단 꺾은선 차트 + 유형 드롭다운) / AE Risk Card (Step Line Chart + AE Type Dropdown) */}
        <div
          className="flex flex-col min-w-0 p-3"
          style={{
            flex: "1 1 48%",
            background: COLOR_PRIMARY,
            borderRadius: "22px",
            gap: "16px",
          }}
        >
          <div className="flex-1 min-h-0 flex items-start justify-between" style={{ padding: "4px" }}>
            <h3
              className="text-body2"
              style={{
                color: "#fff",
                letterSpacing: "-0.66px",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              AE Risk
            </h3>
            {/* Dropdown */}
            <div className="relative">
              <div
                onClick={() => {
                  if (aeOptions.length > 0) {
                    setDropdownOpen((value) => !value);
                  }
                }}
                className="flex items-center cursor-pointer select-none"
                style={{
                  background: "var(--neutral-95)",
                  borderRadius: "8px",
                  padding: "4px 6px 4px 8px",
                  gap: "2px",
                  minWidth: "120px",
                  height: "28px",
                }}
              >
                <span className="flex-1 text-body5m" style={{ color: "var(--neutral-30)" }}>
                  {selectedAE || "Unavailable"}
                </span>
                <img
                  src={dropdownOpen ? "/icons/disclosure/open-18.svg" : "/icons/disclosure/close-18.svg"}
                  alt="toggle"
                  width={18}
                  height={18}
                  className="shrink-0"
                />
              </div>
              {dropdownOpen && aeOptions.length > 0 && (
                <div
                  className="absolute overflow-hidden"
                  style={{
                    top: "calc(100% + 4px)",
                    right: 0,
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    zIndex: 100,
                    minWidth: "120px",
                  }}
                >
                  {aeOptions.map((opt, idx) => (
                    <div
                      key={opt}
                      onClick={() => { setSelectedAE(opt); setDropdownOpen(false); }}
                      className="cursor-pointer text-caption"
                      style={{
                        padding: "8px 12px",
                        fontWeight: opt === selectedAE ? 700 : 500,
                        color: opt === selectedAE ? COLOR_NEUTRAL_30 : COLOR_NEUTRAL_40,
                        background: "#fff",
                        whiteSpace: "nowrap",
                        borderBottom: idx < aeOptions.length - 1 ? "1px solid var(--neutral-80)" : "none",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#f7f7fa"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#fff"; }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            className="min-h-0 overflow-hidden"
            style={{
              background: "#fff",
              borderRadius: "10px",
              flex: 4,
              padding: "16px 16px 4px",
            }}
          >
            {selectedAESeries && selectedAESeries.series.length > 0 ? (
              <StepLineChart
                seriesSet={selectedAESeries}
                yAxisName={aeRiskChart.yAxisName}
              />
            ) : (
              <EmptyCardState message={aeRiskChart.emptyMessage} />
            )}
          </div>
        </div>
      </div>

      {/* 하단 행: Non responder Identification (전략별 비반응자 특성 피처 테이블) / Bottom Row: Non-responder Identification Feature Tables per Strategy */}
      <div
        className="flex flex-col min-h-0 p-4"
        style={{
          background: "rgba(255,255,255,0.6)",
          borderRadius: "22px",
          gap: "24px",
          flex: 2.25,
        }}
      >
        <div>
          <h3
            className="text-body2"
            style={{
              color: COLOR_PRIMARY,
              letterSpacing: "-0.72px",
              lineHeight: 1,
              margin: "0 0 4px",
            }}
          >
            {nonResponderSection.title}
          </h3>
          {nonResponderSection.description ? (
            <p
              className="text-body5m"
              style={{
                color: "#313032",
                letterSpacing: "-0.39px",
                margin: 0,
              }}
            >
              {nonResponderSection.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-stretch flex-1 min-h-0" style={{ gap: "16px" }}>
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
              className="flex-1 flex items-center justify-center min-h-0"
              style={{
                borderRadius: "16px",
                border: "1px solid rgba(38,34,85,0.12)",
                background: "rgba(255,255,255,0.72)",
                padding: "24px",
              }}
            >
              <p
                className="text-captionm"
                style={{
                  margin: 0,
                  color: COLOR_NEUTRAL_30,
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
  className,
}: {
  height: number | string;
  width?: number | string;
  borderRadius?: number | string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
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
      className="flex flex-col w-full flex-1 min-h-0"
      style={{ gap: "0px" }}
    >
      <div
        className="flex flex-1 items-stretch min-h-0"
        style={{ gap: "0px" }}
      >
        <div
          className="drd-left-panel flex-shrink-0 rounded-[36px] gap-[28px] overflow-hidden flex flex-col"
          style={{
            borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
            borderStyle: "solid",
            borderTopWidth: "20px",
            borderBottomWidth: "28px",
            borderLeftWidth: "24px",
            borderRightWidth: "24px",
            borderColor: "transparent",
            paddingBottom: "4px",
          }}
        >
          <div
            className="overflow-hidden shrink-0 flex flex-col justify-center items-start relative"
            style={{
              borderRadius: "18px",
              padding: "6px 4px",
            }}
          >
            <span
              className="relative text-body1"
              style={{
                zIndex: 1,
                color: "#262255",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              Simulation strategies
            </span>
          </div>

            <div
              className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0"
              style={{
              gap: "14px",
              padding: "0px",
              }}
            >
              {[0, 1, 2].map((index) => (
                <SkeletonBlock
                  key={index}
                  height={96}
                  borderRadius={16}
                  className="shrink-0"
                  style={{ background: "rgba(255,255,255,0.78)" }}
                />
              ))}

              <SkeletonBlock height={172} borderRadius={16} className="shrink-0" />
              <SkeletonBlock height={72} borderRadius={16} className="shrink-0" />
            </div>

            <div className="shrink-0 flex justify-end">
              <button
                type="button"
              onClick={onEditCondition}
              className="btn-tsi btn-tsi-primary"
              style={{ width: "200px" }}
            >
              Edit Condition
            </button>
          </div>
        </div>

        <div
          className="figma-nine-slice figma-home-panel-right flex-1 min-w-[280px] min-h-0 flex flex-col"
          style={{
          }}
        >
          <div className="shrink-0 flex flex-col gap-02" style={{ padding: 6 }}>
            <h2
              className="text-body1"
              style={{
                color: COLOR_PRIMARY,
                letterSpacing: "-0.9px",
                lineHeight: 1,
                margin: 0,
              }}
            >
              Summary
            </h2>
            <SkeletonBlock height={44} borderRadius={14} style={{ background: "rgba(255,255,255,0.72)" }} />
          </div>

          <div
            className="flex-1 min-h-0 flex flex-col"
            style={{ gap: "12px" }}
          >
            <div
              className="inline-flex items-center shrink-0 self-start"
              style={{
                background: "#fff",
                borderRadius: "36px",
                padding: "4px",
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
                    className="relative border-none cursor-pointer overflow-hidden text-body4"
                    style={{
                      height: "36px",
                      padding: "0 clamp(14px, 1.6vw, 24px)",
                      borderRadius: "36px",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#fff" : COLOR_NEUTRAL_30,
                      letterSpacing: isActive ? "-0.48px" : "-0.36px",
                      background: "transparent",
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute inset-0"
                        style={{
                          borderRadius: "36px",
                          background: COLOR_PRIMARY,
                        }}
                      />
                    )}
                    <span className="relative">{label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === "efficacy" ? (
              <>
                <div
                  className="flex items-stretch min-h-0"
                  style={{
                    gap: 12,
                    flex: 2.25,
                  }}
                >
                    <div
                      className="flex-1 flex flex-col min-w-0"
                      style={{
                        background: COLOR_PRIMARY,
                        borderRadius: "22px",
                        padding: "8px 16px 16px",
                      }}
                    >
                      <h3 className="text-body1" style={{ color: "#fff", letterSpacing: "-0.66px", lineHeight: 1.2, margin: "4px 0 0" }}>
                        Primary Outcome
                      </h3>
                      <SkeletonBlock height="100%" borderRadius={10} className="flex-1" style={{ marginTop: 8 }} />
                    </div>
                    <div
                      className="flex-1 flex flex-col min-w-0"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        borderRadius: "22px",
                        padding: "8px 16px 16px",
                      }}
                    >
                      <h3 className="text-body1" style={{ color: COLOR_PRIMARY, letterSpacing: "-0.66px", lineHeight: 1.2, margin: "4px 0 0" }}>
                        Response Probability
                      </h3>
                      <SkeletonBlock height="100%" borderRadius={10} className="flex-1" style={{ marginTop: 8, background: "#ffffff" }} />
                    </div>
                </div>

                <div
                  className="flex items-stretch min-h-0"
                  style={{
                    background: COLOR_PRIMARY,
                    borderRadius: "24px",
                    padding: "16px",
                    gap: "clamp(10px, 1vw, 16px)",
                    flex: 3,
                  }}
                >
                  {["Simulated Trajectory", "Counterfactual Comparison"].map((title) => (
                    <div
                      key={title}
                      className="flex-1 flex flex-col min-w-0 overflow-hidden"
                      style={{
                        background: "#fff",
                        borderRadius: "10px",
                        padding: "16px",
                      }}
                    >
                      <h4 className="text-body2" style={{ color: COLOR_PRIMARY, letterSpacing: "-0.6px", margin: 0 }}>
                        {title}
                      </h4>
                      <SkeletonBlock height="100%" borderRadius={8} className="flex-1" style={{ marginTop: 10, background: "rgba(38,34,85,0.04)" }} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div
                  className="flex items-stretch min-h-0"
                  style={{ gap: "16px", flex: 3 }}
                >
                  {["Safety Trade-off", "AE Risk"].map((title) => (
                    <div
                      key={title}
                      className="flex flex-col min-w-0"
                      style={{
                        flex: "1 1 48%",
                        background: COLOR_PRIMARY,
                        borderRadius: "22px",
                        padding: "8px 12px 12px",
                      }}
                    >
                      <h3 className="text-body1" style={{ color: "#fff", letterSpacing: "-0.66px", lineHeight: 1.2, margin: "4px 4px 0" }}>
                        {title}
                      </h3>
                      <SkeletonBlock height="100%" borderRadius={10} className="flex-1" style={{ marginTop: 16 }} />
                    </div>
                  ))}
                </div>

                <div
                  className="flex flex-col min-h-0"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "22px",
                    padding: "8px 12px 12px",
                    gap: "16px",
                    flex: 2.25,
                  }}
                >
                  <div>
                    <h3 className="text-body1" style={{ color: COLOR_PRIMARY, letterSpacing: "-0.72px", lineHeight: 1, margin: 0 }}>
                      Non-responder Identification
                    </h3>
                  </div>
                  <div className="flex items-stretch flex-1 min-h-0" style={{ gap: "16px" }}>
                    {[0, 1, 2].map((index) => (
                      <SkeletonBlock key={index} height="100%" borderRadius={16} className="flex-1" style={{ background: "#ffffff" }} />
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
function SimulationResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationTaskId = useSimulationStore((s) => s.taskId);
  const [activeTab, setActiveTab] = useState<"efficacy" | "ae-risk">("efficacy");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simDesc, setSimDesc] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("HbA1c");
  const [hasSimulationData, setHasSimulationData] = useState(false);
  const [simulationResultPayload, setSimulationResultPayload] = useState<unknown>(null);
  const [nonResponderSection, setNonResponderSection] = useState<DrdNonResponderSectionViewModel>(
    EMPTY_DRD_NON_RESPONDER_SECTION
  );

  const queryTaskId =
    searchParams.get("task_id") ?? searchParams.get("taskId") ?? searchParams.get("test_id");
  const resolvedTaskId = queryTaskId?.trim() || simulationTaskId?.trim() || null;
  const resultViewModel = useMemo(
    () =>
      simulationResultPayload
        ? mapDrdSimulationResult(simulationResultPayload, selectedOutcome)
        : EMPTY_DRD_SIMULATION_RESULT_VIEW_MODEL,
    [selectedOutcome, simulationResultPayload]
  );
  const shouldUseMockResult = DRD_SIMULATION_RESULT_USE_MOCK;
  const hasDisplayData = hasSimulationData || shouldUseMockResult;
  const displayResultViewModel = shouldUseMockResult
    ? DRD_SIMULATION_RESULT_MOCK_VIEW_MODEL
    : resultViewModel;
  const displayNonResponderSection = shouldUseMockResult
    ? DRD_SIMULATION_RESULT_MOCK_NON_RESPONDER_SECTION
    : nonResponderSection;

  const resolveTaskId = (): string | null => {
    return resolvedTaskId;
  };

  const buildDrdPathWithContext = (pathname: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    const taskId = resolveTaskId();

    if (taskId) {
      params.delete("taskId");
      params.delete("test_id");
      params.set("task_id", taskId);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!resolvedTaskId) {
      setHasSimulationData(false);
      setSimulationResultPayload(null);
      setNonResponderSection(EMPTY_DRD_NON_RESPONDER_SECTION);
      return;
    }

    const storedResponse = window.localStorage.getItem(`drd_simulation_play_${resolvedTaskId}`);
    if (!storedResponse) {
      setHasSimulationData(false);
      setSimulationResultPayload(null);
      setNonResponderSection(EMPTY_DRD_NON_RESPONDER_SECTION);
      return;
    }

    try {
      const parsed = JSON.parse(storedResponse) as unknown;
      const playable = hasPlayableSimulationResult(parsed);
      setHasSimulationData(playable);
      setSimulationResultPayload(playable ? parsed : null);
      setNonResponderSection(
        playable
          ? convertDrdSimulationPlayToNonResponderSection(parsed)
          : EMPTY_DRD_NON_RESPONDER_SECTION
      );
    } catch {
      setHasSimulationData(false);
      setSimulationResultPayload(null);
      setNonResponderSection(EMPTY_DRD_NON_RESPONDER_SECTION);
    }
  }, [resolvedTaskId]);

  const strategies: StrategyCardProps[] = shouldUseMockResult
    ? DRD_SIMULATION_RESULT_MOCK_STRATEGIES
    : [];
  const summaryText = shouldUseMockResult
    ? DRD_SIMULATION_RESULT_MOCK_SUMMARY_TEXT
    : "";
  const populationSummary = shouldUseMockResult
    ? DRD_SIMULATION_RESULT_MOCK_POPULATION_SUMMARY
    : [
        { label: "Population", value: "-" },
        { label: "Follow-up", value: "-" },
      ];

  return (
    <AppLayout headerType="drd" drdStep={3} scaleMode="none">
        <div className="flex flex-col h-full w-full">
        {/* 전체 페이지 래퍼 / Full Page Wrapper */}
      {/* 콘텐츠 영역 전체 컨테이너 (제목 + 좌우 패널) */}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden gap-6"
      >
        {/* 페이지 제목 / Page Title */}
        <div className="shrink-0 px-1">
          <h1 onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-result"))} className="cursor-pointer text-page-title">
            Simulation Results Dashboard
          </h1>
        </div>
      {hasDisplayData ? (
        <div
          className="flex flex-col w-full flex-1 min-h-0"
          style={{ gap: "0px" }}
        >
          {/* 좌우 패널 전체 래퍼 / Left-Right Panel Wrapper */}
          <div className="gap-1 flex flex-1 items-stretch min-h-0">

            {/* 왼쪽 패널: 시뮬레이션 전략 목록 / Left Panel: Simulation Strategies */}
            <div
              className="figma-nine-slice figma-home-panel-left flex-shrink-0 rounded-[36px] gap-8 overflow-hidden flex flex-col w-[360px]"
            >
              {/* 전략 목록 헤더 타이틀 / Strategies Section Title */}
              <div
                className="overflow-hidden shrink-0 flex flex-col justify-center items-start relative"
                style={{
                  borderRadius: "18px",
                  padding: "6px 4px",
                }}
              >
                <span
                  className="relative text-body1 text-[var(--text-header)]"
                  style={{
                    zIndex: 1,
                    letterSpacing: "-1px",
                    lineHeight: 1,
                  }}
                >
                  Simulation strategies
                </span>
              </div>

              {/* 전략 카드 목록 (Strategy A/B/C 카드 + Primary Outcome + Population) / Strategy Cards List */}
              <div className="flex-1 gap-2 flex flex-col overflow-y-auto overflow-x-hidden min-h-0"
                style={{ padding: "0px" }}
              >
                {strategies.length > 0 ? (
                  strategies.map((strategy) => (
                    <StrategyCard key={strategy.name} {...strategy} />
                  ))
                ) : (
                  <div
                    className="shrink-0"
                    style={{ minHeight: "168px" }}
                  >
                    <EmptyCardState message="Simulation strategy data is unavailable." />
                  </div>
                )}

                {/* Primary Outcome 선택 라디오 + Population/Follow-up 정보 / Primary Outcome Radio Selector + Population Info */}
                <div
                  className="flex flex-col"
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "8px 16px 12px",
                  }}
                >
                  <p className="text-caption pt-1 pb-2" style={{ color: COLOR_NEUTRAL_30 }}>
                    Primary Outcome
                  </p>
                  <div style={{ height: "1px", background: "#e5e4e8", marginBottom: "0px" }} />
                  {["HbA1c", "eGFR", "Weight", "Complication (ex : eGFR slope)"].map((label, idx) => {
                    const selected = selectedOutcome === label;
                    return (
                    <div
                      key={label}
                      onClick={() => setSelectedOutcome(label)}
                      className="flex items-center cursor-pointer"
                      style={{
                        gap: "8px",
                        padding: "10px 0",
                        borderTop: idx > 0 ? "1px solid #e5e4e8" : "none",
                      }}
                    >
                      <div
                        className="shrink-0"
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          border: `2px solid ${selected ? COLOR_STRATEGY_A : "var(--neutral-80)"}`,
                          background: selected ? COLOR_STRATEGY_A : "transparent",
                        }}
                      >
                        {selected && (
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", margin: "2px" }} />
                        )}
                      </div>
                      <span className="text-captionm" style={{ color: COLOR_NEUTRAL_10 }}>{label}</span>
                    </div>
                    );
                  })}
                </div>

                {/* 환자 집단 및 추적 관찰 기간 정보 / Population & Follow-up Info */}
                <div
                  className="flex flex-col"
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "8px 16px 12px",
                    gap: "4px",
                  }}
                >
                  {populationSummary.map(({ label, value }) => (
                    <p key={label} className="text-captionm" style={{ color: COLOR_NEUTRAL_10, margin: "0 0 0px" }}>
                      {label} : {value}
                    </p>
                  ))}
                </div>
              </div>

              {/* 조건 편집 이동 버튼 / Edit Condition Navigation Button */}
              <div className="shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    router.push(buildDrdPathWithContext("/drd/default-setting"))
                  }
                  className="btn-tsi btn-tsi-primary"
                  style={{ width: "200px" }}
                >
                  Edit Condition
                </button>
              </div>
            </div>

             {/* 오른쪽 패널: 요약 및 차트 영역 / Right Panel: Summary & Charts */}
             <div
              className="figma-nine-slice figma-home-panel-left flex-1 min-w-[280px] min-h-0 flex flex-col gap-3"
            >
              {/* 요약 텍스트 영역 / Summary Text Area */}
              <div className="flex flex-col gap-1 shrink-0 text-body1 text-[var(--text-header)]"
                style={{ padding: 6 }}>
                <h2
                  style={{
                    letterSpacing: "-0.9px",
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  Summary
                </h2>
                <p className="text-body5m text-text-secondary"
                  style={{
                    margin: 0,
                  }}
                >
                  {summaryText || "Summary is unavailable."}
                </p>
              </div>

              {/* 탭 + 탭 콘텐츠 영역 (Efficacy / AE risk) / Tab + Tab Content Area */}
              <div
                className="flex-1 min-h-0 flex flex-col"
                style={{ gap: "12px" }}
              >
                {/* Efficacy / AE risk 탭 전환 버튼 / Tab Switch Buttons */}
                <div
                  className="inline-flex items-center shrink-0 self-start"
                  style={{
                    background: "#fff",
                    borderRadius: "36px",
                    padding: "4px",
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
                        className="relative border-none cursor-pointer overflow-hidden text-body4"
                        style={{
                          height: "36px",
                          padding: "0 clamp(14px, 1.6vw, 24px)",
                          borderRadius: "36px",
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#fff" : COLOR_NEUTRAL_30,
                          letterSpacing: isActive ? "-0.48px" : "-0.36px",
                          background: "transparent",
                          transition: "color 0.15s",
                        }}
                      >
                        {isActive && (
                          <div
                            className="absolute inset-0"
                            style={{
                              borderRadius: "36px",
                              background: COLOR_PRIMARY,
                            }}
                          />
                        )}
                        <span className="relative">{label}</span>
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
          onEditCondition={() => router.push(buildDrdPathWithContext("/drd/default-setting"))}
        />
      )}
      </div>

      {/* 시뮬레이션 저장 버튼 영역 / Save Simulation Button Area */}
      {hasDisplayData ? (
        <div className="shrink-0 flex justify-end pr-1" >
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="btn-tsi btn-tsi-primary"
          >
            Save Simulation
          </button>
        </div>
      ) : null}

      {/* Save Simulation 모달 / Save Simulation Modal */}
      {hasDisplayData && showSaveModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col overflow-hidden"
            style={{
              width: "380px",
              borderRadius: "20px",
              padding: "24px 20px 20px",
              gap: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* 유리 배경 레이어 / Glassmorphism Background Layer */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ borderRadius: "20px" }}>
              <div className="absolute inset-0" style={{ borderRadius: "20px", background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
              <div className="absolute inset-0" style={{ borderRadius: "20px", background: "rgba(255,255,255,0.88)" }} />
              <div className="absolute inset-0" style={{ borderRadius: "20px", background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
            </div>

            {/* 모달 콘텐츠 영역 / Modal Content Area */}
            <div className="relative flex flex-col" style={{ zIndex: 1, gap: "20px" }}>
              {/* 모달 제목 / Modal Title */}
              <p className="text-body3" style={{ color: "#484646", letterSpacing: "-0.54px", lineHeight: 1.2, margin: 0 }}>
                Save Simulation
              </p>

              {/* 시뮬레이션 이름 및 설명 입력 필드 / Simulation Name & Description Input Fields */}
              <div className="flex flex-col" style={{ gap: "10px" }}>
                {/* Simulation Name */}
                <div className="flex flex-col" style={{ gap: "6px" }}>
                  <p className="text-captionm" style={{ color: "#484646", margin: 0 }}>
                    Simulation Name *
                  </p>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Write a title"
                    className="border-none w-full box-border text-captionm"
                    style={{
                      height: "40px",
                      borderRadius: "12px",
                      background: "#e2e1e5",
                      padding: "0 14px",
                      color: "#484646",
                      outline: "none",
                    }}
                  />
                </div>
                {/* Description */}
                <div className="flex flex-col" style={{ gap: "6px" }}>
                  <p className="text-captionm" style={{ color: "#484646", margin: 0 }}>
                    Description
                  </p>
                  <input
                    type="text"
                    value={simDesc}
                    onChange={(e) => setSimDesc(e.target.value.slice(0, 30))}
                    placeholder="Enter a Description (max 30 characters)"
                    className="border-none w-full box-border text-captionm"
                    style={{
                      height: "40px",
                      borderRadius: "12px",
                      background: "#e2e1e5",
                      padding: "0 14px",
                      color: "#484646",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 영역 / Modal Bottom Button Area */}
            <div className="relative flex justify-center" style={{ zIndex: 1, gap: "8px" }}>
              {/* 닫기 버튼 / Close Button */}
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="border-none cursor-pointer text-body4"
                style={{
                  width: "112px",
                  height: "44px",
                  borderRadius: "36px",
                  color: "#262255",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Close
              </button>

              {/* 저장 버튼 / Save Button */}
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="border-none cursor-pointer text-body4"
                style={{
                  width: "112px",
                  height: "44px",
                  borderRadius: "36px",
                  color: "#262255",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}</div>
    </AppLayout>
  );
}

/**
 * Suspense 래퍼 (useSearchParams 사용으로 인해 필요)
 */
export default function SimulationResultPage() {
  return (
    <Suspense fallback={null}>
      <SimulationResultPageContent />
    </Suspense>
  );
}
