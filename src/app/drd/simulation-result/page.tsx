"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import ReactECharts from "@/components/charts/DynamicECharts";

// ── 차트 컴포넌트 (인라인) ────────────────────────────────────────────────────

const _COLOR_A = "#3a11d8";
const _COLOR_B = "#f06600";
const _COLOR_C = "#24c6c9";
const _N10 = "#1c1b1b";
const _N30 = "#484646";
const _N60 = "#929090";

function SpaghettiPlotChart() {
  const months = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const strategyB = [0, -0.3, -0.8, -1.4, -1.8, -2.2, -2.6, -2.7, -2.5];
  const strategyA = [0, -0.1, -0.4, -0.9, -1.5, -2.0, -2.4, -2.6, -2.4];
  const strategyCyan = [0, 0.1, -0.1, -0.6, -1.0, -1.8, -2.2, -2.3, -2.2];
  const option = {
    grid: { left: 72, right: 16, top: 24, bottom: 58 },
    xAxis: {
      type: "category" as const, data: months, boundaryGap: false,
      axisLine: { lineStyle: { color: _N30, width: 1 } }, axisTick: { show: false },
      axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, letterSpacing: -0.27 },
      splitLine: { show: true, lineStyle: { color: _N60, opacity: 0.25, type: "solid" as const, width: 1 } },
      name: "Time since symptom onset (Months)", nameLocation: "middle" as const, nameGap: 28,
      nameTextStyle: { color: "#1c1b1b", fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 },
    },
    yAxis: {
      type: "value" as const, min: -4, max: 0, interval: 2,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, letterSpacing: -0.27, formatter: (v: number) => v.toFixed(1) },
      splitLine: { show: true, lineStyle: { color: _N60, opacity: 0.25, type: "solid" as const, width: 1 } },
      name: "Reduction in HbA1c", nameLocation: "middle" as const, nameGap: 44,
      nameTextStyle: { color: "#1c1b1b", fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 },
    },
    series: [
      { name: "B: Add-on", type: "line" as const, data: strategyB, smooth: true, symbol: "none", lineStyle: { color: _COLOR_A, width: 2.5 }, itemStyle: { color: _COLOR_A }, markLine: { silent: true, symbol: "none", label: { show: true, position: "insideEndTop" as const, formatter: "B: Add-on", color: _COLOR_A, fontFamily: "Inter", fontSize: 9, fontWeight: 500 }, lineStyle: { color: _COLOR_A, type: "dashed" as const, width: 1, opacity: 0.6 }, data: [{ xAxis: 9 }] } },
      { name: "A: Switch", type: "line" as const, data: strategyA, smooth: true, symbol: "none", lineStyle: { color: _COLOR_B, width: 2.5 }, itemStyle: { color: _COLOR_B }, markLine: { silent: true, symbol: "none", label: { show: true, position: "insideEndTop" as const, formatter: "A: Switch", color: _COLOR_B, fontFamily: "Inter", fontSize: 9, fontWeight: 500 }, lineStyle: { color: _COLOR_B, type: "dashed" as const, width: 1, opacity: 0.6 }, data: [{ xAxis: 15 }] } },
      { name: "C", type: "line" as const, data: strategyCyan, smooth: true, symbol: "none", lineStyle: { color: _COLOR_C, width: 2.5 }, itemStyle: { color: _COLOR_C }, markLine: { silent: true, symbol: "none", label: { show: true, position: "insideStartTop" as const, formatter: "Target : -1.0% at Month 12", color: "#AAAAAD", fontFamily: "Inter", fontSize: 9, fontWeight: 500, distance: [0, 4] }, lineStyle: { color: "#AAAAAD", type: "dotted" as const, width: 1.5 }, data: [{ yAxis: -1.0, name: "Target : -1.0% at Month 12" }] } },
    ],
    legend: { show: true, bottom: 0, icon: "roundRect", itemWidth: 24, itemHeight: 3, data: [{ name: "B: Add-on", itemStyle: { color: _COLOR_A }, lineStyle: { color: _COLOR_A } }, { name: "A: Switch", itemStyle: { color: _COLOR_B }, lineStyle: { color: _COLOR_B } }], textStyle: { color: _N30, fontFamily: "Inter", fontSize: 11, fontWeight: 500 } },
    tooltip: { show: false },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

function HistogramChart() {
  const xLabels = ["-2.0","-1.9","-1.8","-1.7","-1.6","-1.5","-1.4","-1.3","-1.2","-1.1","-1.0","-0.9","-0.8","-0.7","-0.6","-0.5","-0.4","-0.3","-0.2","-0.1","0.0","0.1","0.2","0.3","0.4","0.5","0.6","0.7","0.8","0.9","1.0"];
  const rawA = [0,0,0,0,0,1,1,2,5,9,11,12,14,24,25,19,22,23,30,48,46,22,11,5,0,0,0,0,0,0,0];
  const rawB = [0,0,0,0,3,3,4,5,13,14,18,19,23,31,32,23,28,27,36,48,29,18,12,9,0,0,0,0,0,0,0];
  const rawC = [6,6,7,8,9,10,11,12,13,14,16,17,18,20,21,22,23,24,26,29,35,42,48,43,38,30,22,17,14,11,9];

  const strategies = [
    { name: "Strategy A", color: _COLOR_A, data: rawA },
    { name: "Strategy B", color: _COLOR_B, data: rawB },
    { name: "Strategy C", color: _COLOR_C, data: rawC },
  ];

  // 각 x 위치마다 값 크기 기준 내림차순 rank → slot0=최대, slot1=중간, slot2=최소
  // slot별 데이터: { value: 실제값, itemStyle: { color: 해당전략색 } }
  const n = xLabels.length;
  const slots: { value: number; itemStyle: { color: string; borderRadius: number[] } }[][] = [[], [], []];

  for (let xi = 0; xi < n; xi++) {
    const ranked = [0, 1, 2]
      .map((si) => ({ si, v: strategies[si].data[xi] }))
      .sort((a, b) => b.v - a.v); // 내림차순: 큰 값이 slot0(뒤에 그려짐)
    ranked.forEach((item, rank) => {
      slots[rank].push({
        value: item.v,
        itemStyle: { color: strategies[item.si].color, borderRadius: [2, 2, 0, 0] },
      });
    });
  }

  const option = {
    grid: { left: 72, right: 16, top: 12, bottom: 58 },
    xAxis: { type: "category" as const, data: xLabels, axisLine: { lineStyle: { color: _N60, width: 1 } }, axisTick: { show: false }, axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, interval: 4, formatter: (v: string) => v }, splitLine: { show: false }, name: "Primary Outcome Change (△)", nameLocation: "middle" as const, nameGap: 28, nameTextStyle: { color: "#1c1b1b", fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 } },
    yAxis: { type: "value" as const, min: 0, max: 50, interval: 10, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500 }, splitLine: { show: true, lineStyle: { color: _N60, opacity: 0.2, type: "solid" as const, width: 1 } }, name: "Patient Count", nameLocation: "middle" as const, nameGap: 44, nameTextStyle: { color: "#1c1b1b", fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 } },
    series: slots.map((slotData) => ({
      type: "bar" as const,
      data: slotData,
      barWidth: "100%",
      barGap: "-100%",
      barCategoryGap: "0%",
      emphasis: { disabled: true },
      itemStyle: { opacity: 0.8 },
    })),
    legend: { show: true, bottom: 0, icon: "roundRect", itemWidth: 24, itemHeight: 8, data: [{ name: "Strategy A", itemStyle: { color: _COLOR_A } }, { name: "Strategy B", itemStyle: { color: _COLOR_B } }, { name: "Strategy C", itemStyle: { color: _COLOR_C } }], textStyle: { color: _N30, fontFamily: "Inter", fontSize: 11, fontWeight: 500 } },
    tooltip: { show: false },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

function BubbleChart() {
  const option = {
    grid: { left: 56, right: 16, top: 12, bottom: 62 },
    xAxis: { type: "value" as const, min: 0, max: 10, interval: 5, axisLine: { lineStyle: { color: _N60, width: 1 } }, axisTick: { show: false }, axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, letterSpacing: -0.27 }, splitLine: { show: false }, name: "△HbA1c", nameLocation: "middle" as const, nameGap: 20, nameTextStyle: { color: _N10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 } },
    yAxis: { type: "value" as const, min: 0, max: 8, interval: 2, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, letterSpacing: -0.27 }, splitLine: { show: true, lineStyle: { color: _N60, opacity: 0.2, type: "solid" as const, width: 1 } }, name: "AE probability(%)", nameLocation: "middle" as const, nameGap: 40, nameTextStyle: { color: _N10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 } },
    series: [
      { type: "scatter" as const, data: [[2.5,2.8]], symbolSize: 46, itemStyle: { color: _COLOR_C, opacity: 0.85 }, label: { show: true, formatter: "C", color: "#fff", fontFamily: "Inter", fontSize: 11, fontWeight: 700 } },
      { type: "scatter" as const, data: [[3.5,2.2]], symbolSize: 62, itemStyle: { color: _COLOR_A, opacity: 0.88 }, label: { show: true, formatter: "A", color: "#fff", fontFamily: "Inter", fontSize: 11, fontWeight: 700 } },
      { type: "scatter" as const, data: [[8.5,6.0]], symbolSize: 96, itemStyle: { color: _COLOR_B, opacity: 0.9 }, label: { show: true, formatter: "B", color: "#fff", fontFamily: "Inter", fontSize: 13, fontWeight: 700 } },
    ],
    tooltip: { show: false },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

function StepLineChart() {
  const xData = [0,1,2,3,4,5,6,7,8,9,10];
  const dataA = [0,0.2,0.6,1.2,2.0,3.0,6.0,6.4,6.8,7.2,7.8];
  const dataB = [0,0.3,0.9,1.8,3.0,4.5,6.0,6.5,7.0,7.5,8.0];
  const dataC = [0,0.1,0.3,0.7,1.2,2.0,2.8,3.6,4.2,4.8,5.2];
  const option = {
    grid: { left: 56, right: 16, top: 12, bottom: 62 },
    xAxis: { type: "category" as const, data: xData, axisLine: { lineStyle: { color: _N60, width: 1 } }, axisTick: { show: false }, axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, letterSpacing: -0.27 }, splitLine: { show: true, lineStyle: { color: _N60, opacity: 0.15, type: "solid" as const, width: 1 } }, name: "Years since treatment start", nameLocation: "middle" as const, nameGap: 20, nameTextStyle: { color: _N10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 } },
    yAxis: { type: "value" as const, min: 0, max: 8, interval: 2, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500, letterSpacing: -0.27 }, splitLine: { show: true, lineStyle: { color: _N60, opacity: 0.2, type: "solid" as const, width: 1 } }, name: "AE probability(%)", nameLocation: "middle" as const, nameGap: 40, nameTextStyle: { color: _N10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: -0.55 } },
    series: [
      { name: "Strategy A", type: "line" as const, step: "end" as const, data: dataA, symbol: "none", lineStyle: { color: _COLOR_A, width: 2 }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${_COLOR_A}50` }, { offset: 1, color: `${_COLOR_A}08` }] } }, itemStyle: { color: _COLOR_A } },
      { name: "Strategy B", type: "line" as const, step: "end" as const, data: dataB, symbol: "none", lineStyle: { color: _COLOR_B, width: 2 }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${_COLOR_B}50` }, { offset: 1, color: `${_COLOR_B}08` }] } }, itemStyle: { color: _COLOR_B } },
      { name: "Strategy C", type: "line" as const, step: "end" as const, data: dataC, symbol: "none", lineStyle: { color: _COLOR_C, width: 2 }, areaStyle: { color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${_COLOR_C}50` }, { offset: 1, color: `${_COLOR_C}08` }] } }, itemStyle: { color: _COLOR_C } },
    ],
    legend: { show: true, bottom: 0, icon: "roundRect", itemWidth: 24, itemHeight: 3, padding: [0, 0, 2, 0], data: [{ name: "Strategy A", itemStyle: { color: _COLOR_A } }, { name: "Strategy B", itemStyle: { color: _COLOR_B } }, { name: "Strategy C", itemStyle: { color: _COLOR_C } }], textStyle: { color: _N30, fontFamily: "Inter", fontSize: 9, fontWeight: 500 } },
    tooltip: { show: false },
  };
  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />;
}

// ?? ?대?吏 ?먯뀑 寃쎈줈 ??????????????????????????????????????????????????????????
const imgFrame1618873826 = "/figma-assets/159570a2cd4a5962c7b68be950ef1ec97d5cd2e1.svg";

// ?? ?됱긽 ?곸닔 ????????????????????????????????????????????????????????????????
const COLOR_STRATEGY_A = "#3a11d8";  // chart-set06-group01
const COLOR_STRATEGY_B = "#f06600";  // chart-set06-group02 / secondary-60
const COLOR_STRATEGY_C = "#24c6c9";  // chart-set06-group03
const COLOR_PRIMARY    = "#262255";  // primary-15
const COLOR_NEUTRAL_10 = "#1c1b1b";
const COLOR_NEUTRAL_30 = "#484646";
const COLOR_NEUTRAL_40 = "#5f5e5e";
const COLOR_NEUTRAL_60 = "#929090";
const COLOR_TABLE_BODY = "#787776";

// ?? ?ы띁: ?꾨왂 移대뱶 ??????????????????????????????????????????????????????????
// ── 전략 카드 툴팁 ────────────────────────────────────────────────────────────

interface StrategyTooltipData {
  groups: { label: string; items: string[]; color: string }[];
}

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
      style={{
        position: "fixed",
        left,
        top,
        transform: "translateY(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        width: 378,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        background: "white",
        padding: `${PADDING - 8}px ${PADDING}px ${PADDING}px`,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* X축 레이블 */}
      <div
        style={{
          display: "flex",
          marginLeft: LEFT_W,
          marginBottom: 6,
          justifyContent: "space-between",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 11,
          color: "#929090",
          letterSpacing: "-0.44px",
        }}
      >
        {["0", "3", "6", "9", "12"].map((v) => <span key={v}>{v}</span>)}
      </div>

      {/* 행 목록: 좌측 텍스트 + 우측 바 */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
        {/* 수직 그리드 라인 (바 영역 위에 오버레이) */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: LEFT_W, right: 0, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 1, background: "rgba(0,0,0,0.10)", height: "100%" }} />
          ))}
        </div>

        {rows.map((row, i) =>
          row.type === "label" ? (
            <div key={i} style={{ display: "flex", alignItems: "center", height: 22, marginTop: i === 0 ? 0 : 10 }}>
              <span style={{
                width: LEFT_W,
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 11,
                color: "#929090",
                letterSpacing: "-0.44px",
                lineHeight: 1.1,
              }}>
                {row.text}
              </span>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", alignItems: "center", height: 24, marginTop: 4 }}>
              {/* 좌측: 아이템 이름 */}
              <span style={{
                width: LEFT_W,
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: "#1c1b1b",
                letterSpacing: "-0.52px",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {(row as { text: string }).text}
              </span>
              {/* 우측: 바 */}
              <div style={{ flex: 1, position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
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

interface StrategyCardProps {
  name: string;
  nameColor: string;
  target: string;
  drugs: string[];
  extraDrug?: string;
  lineColor: string;
  tooltipData: StrategyTooltipData;
}

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
      style={{
        position: "relative",
        background: "#ffffff",
        borderRadius: "16px",
        flexShrink: 0,
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
      <div style={{ padding: "12px 16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <p
          style={{
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: "clamp(7px, 0.85vw, 13px)",
            color: COLOR_NEUTRAL_10,
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {target}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          {drugs.map((drug, i) => (
            <p
              key={i}
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "clamp(7px, 0.8vw, 11px)",
                color: COLOR_NEUTRAL_40,
                letterSpacing: "-0.42px",
                lineHeight: 1.1,
                margin: 0,
                paddingLeft: "16px",
                height: "1.4em",
                display: "flex",
                alignItems: "center",
              }}
            >
              {i + 1}. {drug}
            </p>
          ))}
          {extraDrug && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "16px", height: "1.4em" }}>
              <img src={imgFrame1618873826} alt="" style={{ height: "11px", objectFit: "contain" }} />
              <p
                style={{
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: "clamp(7px, 0.8vw, 11px)",
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

// ?? ?ы띁: Primary Outcome ?뚯씠釉?(Efficacy ?? ???????????????????????????????
function PrimaryOutcomeTable() {
  const headers = ["Strategy", "Mean", "95% CI", "Median", "NNT*", "NNT at Week 24"];
  const colWidths = ["16%", "13%", "19%", "13%", "12%", "27%"];
  const rows = [
    { strategy: "A", mean: "-1.1%", ci: "(-0.9, -1.3)", median: "-1.0", nnt: "6.2", nntW24: "48% (CI 44~52%)" },
    { strategy: "B", mean: "-0.6%", ci: "(-0.9, -1.3)", median: "-0.5", nnt: "11.4", nntW24: "26% (CI 22~30%)" },
    { strategy: "C", mean: "-0.6%", ci: "(-0.9, -1.3)", median: "-0.5", nnt: "11.4", nntW24: "26% (CI 22~30%)" },
  ];
  const allRows = [
    { cells: headers, isHeader: true },
    ...rows.map((r) => ({ cells: [r.strategy, r.mean, r.ci, r.median, r.nnt, r.nntW24], isHeader: false, isLast: false })),
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
        gridTemplateRows: "repeat(4, 1fr)",
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
            borderBottom: ri < allRows.length - 1
              ? `1px solid ${ri === 0 ? COLOR_NEUTRAL_60 : "#c6c5c9"}`
              : "none",
          }}
        >
          {row.cells.map((cell, ci) => (
            <div
              key={ci}
              style={{
                fontWeight: row.isHeader ? 700 : ci === 0 ? 600 : 400,
                fontSize: row.isHeader ? "clamp(7px, 0.8vw, 13px)" : "clamp(7px, 0.8vw, 11px)",
                color: row.isHeader ? COLOR_PRIMARY : COLOR_TABLE_BODY,
                padding: ci === 0 ? "0 6px 0 12px" : ci === 5 ? "0 12px 0 6px" : "0 6px",
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

// ?? ?ы띁: Response Probability ?뚯씠釉?(Efficacy ?? ??????????????????????????
function ResponseProbabilityTable() {
  const rows = [
    {
      label: "Strong responder",
      a: { val: "32%(399)", bold: true, color: COLOR_STRATEGY_A },
      b: { val: "25%(275)", bold: false, color: COLOR_TABLE_BODY },
      c: { val: "25%(275)", bold: false, color: COLOR_TABLE_BODY },
    },
    {
      label: "Partial responder",
      a: { val: "21%(262)", bold: false, color: COLOR_TABLE_BODY },
      b: { val: "28%(298)", bold: false, color: COLOR_TABLE_BODY },
      c: { val: "28%(298)", bold: false, color: COLOR_TABLE_BODY },
    },
    {
      label: "Non responder",
      a: { val: "18%(225)", bold: false, color: COLOR_TABLE_BODY },
      b: { val: "37%(420)", bold: true, color: COLOR_STRATEGY_B },
      c: { val: "37%(420)", bold: true, color: COLOR_STRATEGY_C },
    },
    {
      label: "Deteriorator",
      a: { val: "6%(75)", bold: false, color: COLOR_TABLE_BODY },
      b: { val: "10%(88)", bold: false, color: COLOR_TABLE_BODY },
      c: { val: "10%(88)", bold: false, color: COLOR_TABLE_BODY },
    },
  ];

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
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter", tableLayout: "fixed", height: "100%" }}>
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLOR_NEUTRAL_60}`, height: "25%" }}>
            <th style={{ padding: "8px 6px 8px 12px", textAlign: "left", fontWeight: 700, fontSize: "clamp(7px, 0.8vw, 13px)", color: COLOR_PRIMARY, letterSpacing: "-0.42px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            <tr
              key={row.label}
              style={{ borderTop: idx > 0 ? "1px solid #c6c5c9" : "none" }}
            >
              <td style={{ padding: "0 6px 0 12px", fontWeight: 700, fontSize: "clamp(7px, 0.8vw, 12px)", color: "#787776", letterSpacing: "-0.42px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.label}
              </td>
              {[row.a, row.b, row.c].map(({ val, bold, color }, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: ci === 2 ? "0 12px 0 6px" : "0 6px",
                    fontWeight: bold ? 700 : 400,
                    fontSize: "clamp(7px, 0.8vw, 11px)",
                    color,
                    letterSpacing: "-0.39px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ?? ?ы띁: Non-responder ?뚯씠釉?(AE risk ?? ?????????????????????????????????
interface NonResponderTableProps {
  strategyName: string;
  nameColor: string;
  lineColor: string;
}

function NonResponderTable({ strategyName, nameColor, lineColor }: NonResponderTableProps) {
  const features = [
    { rank: "1", condition: "DM duration > 7y", score: "0.32" },
    { rank: "2", condition: "Age > 70", score: "0.31" },
    { rank: "3", condition: "CKD stage ??3", score: "0.18" },
  ];
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
      <div style={{ padding: "0", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter", height: "100%", tableLayout: "fixed" }}>
          <thead style={{ height: `${100 / (features.length + 1)}%` }}>
            <tr style={{ height: "100%" }}>
              {["Rank", "Feature condition", "Impact score"].map((h, hi) => (
                <th
                  key={h}
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(9px, 0.8vw, 13px)",
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
          <tbody style={{ height: "100%" }}>
            {features.map((f, i) => (
              <tr key={i} style={{ borderTop: "1px solid #d4d3d6", height: `${100 / (features.length + 1)}%` }}>
                {[f.rank, f.condition, f.score].map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      fontWeight: 400,
                      fontSize: "clamp(9px, 0.8vw, 12px)",
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

// ?? Efficacy ??而⑦뀗痢????????????????????????????????????????????????????????
function EfficacyContent() {
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
            background: COLOR_PRIMARY,
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
          <div style={{ flex: 4, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0 }}>
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
              *NNT to achieve HbA1c &lt; 7.0%
            </p>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <PrimaryOutcomeTable />
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
          <div style={{ flex: 4, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0 }}>
            {/* legend: 오른쪽 정렬, 원형 3개 묶음 + "High Score" 텍스트 */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px", flexShrink: 0, height: "20px" }}>
              {/* 원형 컨테이너 3개 묶음 */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR_STRATEGY_A }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR_STRATEGY_B }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLOR_STRATEGY_C }} />
              </div>
              <span style={{ fontFamily: "Inter", fontSize: "clamp(10px, 0.9vw, 13px)", color: COLOR_NEUTRAL_10 }}>High Score</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <ResponseProbabilityTable />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 행: Simulated Trajectory + Counterfactual Comparison / Bottom Row: Trajectory Chart + Histogram Chart */}
      <div
        style={{
          background: COLOR_PRIMARY,
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
                color: COLOR_PRIMARY,
                letterSpacing: "-0.6px",
                margin: 0,
              }}
            >
              Simulated Trajectory
            </h4>
          </div>
          {/* 하단 4/4: 차트 영역 */}
          <div style={{ flex: 4, minHeight: 0 }}>
            <SpaghettiPlotChart />
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.2vw, 20px)",
                color: COLOR_PRIMARY,
                letterSpacing: "-0.6px",
                margin: 0,
              }}
            >
              Counterfactual Comparison
            </h4>
            <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "clamp(9px, 0.9vw, 13px)", color: COLOR_NEUTRAL_10, margin: 0 }}>
              Primary Outcome Distribution by Treatment Strategy
            </p>
          </div>
          {/* 하단 4/4: 차트 영역 */}
          <div style={{ flex: 4, minHeight: 0 }}>
            <HistogramChart />
          </div>
        </div>
      </div>
    </div>
  );
}

// ?? AE risk ??而⑦뀗痢?????????????????????????????????????????????????????????
const AE_OPTIONS = ["Stroke", "Hypoglycemia", "Weight gain", "Heart failure"];

function AERiskContent() {
  const [selectedAE, setSelectedAE] = useState("Stroke");
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
            background: COLOR_PRIMARY,
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
            <BubbleChart />
          </div>
        </div>

        {/* AE Risk 카드 (계단 꺾은선 차트 + 유형 드롭다운) / AE Risk Card (Step Line Chart + AE Type Dropdown) */}
        <div
          style={{
            flex: "1 1 48%",
            background: COLOR_PRIMARY,
            borderRadius: "22px",
            padding: "8px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "4px" }}>
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
                onClick={() => setDropdownOpen((v) => !v)}
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
                <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "12px", color: "#484646", letterSpacing: "-0.48px", flex: 1 }}>
                  {selectedAE}
                </span>
                <img
                  src={dropdownOpen ? "/icons/disclosure/Property 1=Open, Size=18.svg" : "/icons/disclosure/Property 1=Close, Size=18.svg"}
                  alt="toggle"
                  width={18}
                  height={18}
                  style={{ flexShrink: 0 }}
                />
              </div>
              {dropdownOpen && (
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
                  {AE_OPTIONS.map((opt, idx) => (
                    <div
                      key={opt}
                      onClick={() => { setSelectedAE(opt); setDropdownOpen(false); }}
                      style={{
                        padding: "8px 12px",
                        fontFamily: "Inter",
                        fontWeight: opt === selectedAE ? 700 : 500,
                        fontSize: "12px",
                        color: opt === selectedAE ? COLOR_NEUTRAL_30 : COLOR_NEUTRAL_40,
                        background: "#fff",
                        cursor: "pointer",
                        letterSpacing: "-0.48px",
                        whiteSpace: "nowrap",
                        borderBottom: idx < AE_OPTIONS.length - 1 ? "1px solid #c6c5c9" : "none",
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
            style={{
              background: "#fff",
              borderRadius: "10px",
              flex: 4,
              minHeight: 0,
              overflow: "hidden",
              padding: "16px 16px 4px",
            }}
          >
            <StepLineChart />
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
              color: COLOR_PRIMARY,
              letterSpacing: "-0.72px",
              lineHeight: 1,
              margin: "0 0 4px",
            }}
          >
            Non responder Identification
          </h3>
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
            Top contributing factors ranked by impact score, where higher scores indicate stronger contribution to non-response.
          </p>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
          <NonResponderTable
            strategyName="Strategy A"
            nameColor={COLOR_STRATEGY_A}
            lineColor={COLOR_STRATEGY_A}
          />
          <NonResponderTable
            strategyName="Strategy B"
            nameColor={COLOR_STRATEGY_B}
            lineColor={COLOR_STRATEGY_B}
          />
          <NonResponderTable
            strategyName="Strategy C"
            nameColor={COLOR_STRATEGY_C}
            lineColor={COLOR_STRATEGY_C}
          />
        </div>
      </div>
    </div>
  );
}

// ?? 硫붿씤 而댄룷?뚰듃 ????????????????????????????????????????????????????????????
export default function SimulationResultPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"efficacy" | "ae-risk">("efficacy");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simDesc, setSimDesc] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("HbA1c");

  const strategies = [
    {
      name: "Strategy A",
      nameColor: COLOR_STRATEGY_A,
      target: "HbA1c / Increase 10% / 3 Months",
      drugs: ["Basal insulin", "SGLT2 inhibitors"],
      extraDrug: "Dapagliflozin, Empagliflozin",
      lineColor: COLOR_STRATEGY_A,
      tooltipData: {
        groups: [
          { label: "GLP-1 RA", items: ["Semaglutide", "Exenatide"], color: COLOR_STRATEGY_B },
          { label: "SGLT2 inhibitors", items: ["Glipizide"], color: "#c5c0fe" },
        ],
      },
    },
    {
      name: "Strategy B",
      nameColor: COLOR_STRATEGY_B,
      target: "HbA1c / Stable 0% / 6 Months",
      drugs: ["Basal insulin", "Metformin"],
      lineColor: COLOR_STRATEGY_B,
      tooltipData: {
        groups: [
          { label: "GLP-1 RA", items: ["Semaglutide"], color: COLOR_STRATEGY_B },
          { label: "Biguanide", items: ["Metformin"], color: "#c5c0fe" },
        ],
      },
    },
    {
      name: "Strategy C",
      nameColor: COLOR_STRATEGY_C,
      target: "HbA1c / Decrease -10% / 6 Months",
      drugs: ["Basal insulin", "SGLT2 inhibitors"],
      extraDrug: "Dapagliflozin",
      lineColor: COLOR_STRATEGY_C,
      tooltipData: {
        groups: [
          { label: "GLP-1 RA", items: ["Semaglutide", "Exenatide"], color: COLOR_STRATEGY_B },
          { label: "SGLT2 inhibitors", items: ["Dapagliflozin"], color: "#c5c0fe" },
        ],
      },
    },
  ];

  return (
    <AppLayout headerType="drd" drdStep={3} scaleMode="none">
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 0, overflow: "hidden", marginLeft: "8px", marginRight: "8px" }}>
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
          <h1 onClick={() => router.push("/drd/simulation-result")} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
            Drug Response Prediction Dashboard
          </h1>
        </div>
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
            gap: "0px",
            minHeight: 0,
          }}
        >
          {/* 왼쪽 패널: 시뮬레이션 전략 목록 / Left Panel: Simulation Strategies */}
          <div
            className="w-[380px] flex-shrink-0 rounded-[36px] gap-[28px] overflow-hidden flex flex-col"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",

            paddingBottom: "4px"
            }}
          >
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
              {strategies.map((s) => (
                <StrategyCard key={s.name} {...s} />
              ))}

              {/* Primary Outcome 선택 라디오 + Population/Follow-up 정보 / Primary Outcome Radio Selector + Population Info */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "8px 16px 12px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "13px", color: COLOR_NEUTRAL_30, margin: "0 0 8px" }}>
                  Primary Outcome
                </p>
                <div style={{ height: "1px", background: "#e5e4e8", marginBottom: "0px" }} />
                {["HbA1c", "eGFR", "Weight", "Complication (ex : eGFR slope)"].map((label, idx) => {
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
                        border: `2px solid ${selected ? COLOR_STRATEGY_A : "#c6c5c9"}`,
                        background: selected ? COLOR_STRATEGY_A : "transparent",
                        flexShrink: 0,
                      }}
                    >
                      {selected && (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", margin: "2px" }} />
                      )}
                    </div>
                    <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "13px", color: COLOR_NEUTRAL_10 }}>{label}</span>
                  </div>
                  );
                })}
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
                {["Population : N=440", "Follow-up : 12months"].map((t) => (
                  <p key={t} style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "13px", color: COLOR_NEUTRAL_10, margin: "0 0 0px", lineHeight: 1.1 }}>
                    {t}
                  </p>
                ))}
              </div>
            </div>

            {/* 조건 편집 이동 버튼 / Edit Condition Navigation Button */}
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "right" }}>
              <button
                type="button"
                onClick={() => router.push("/drd/default-setting")}
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
                <div style={{ position: "absolute", inset: 0, borderRadius: "36px", background: "#f06600" }} />
                <span style={{ position: "relative" }}>Edit Condition</span>
              </button>
            </div>
          </div>

           {/* 오른쪽 패널: 요약 및 차트 영역 / Right Panel: Summary & Charts */}
           <div
            className="drd-left-panel flex-1 min-w-[280px] min-h-0 flex flex-col"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-left.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
              gap: "24px",
              marginLeft: "-6px",
            }}
          >
            {/* 요약 텍스트 영역 / Summary Text Area */}
            <div style={{ flexShrink: 0, padding: 6, display: "flex", flexDirection: "column", gap: 24 }}>
              <h2
                style={{
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: 24,
                  color: COLOR_PRIMARY,
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
                  color: COLOR_NEUTRAL_30,
                  letterSpacing: "-0.39px",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                Based on counterfactual simulation adjusted for baseline severity, Strategy A demonstrates greater HbA1c reduction and
                <br />
                faster response, at the cost of increased hypoglycemia risk. Key drivers include longer DM duration and adherence level.
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
                        color: isActive ? "#fff" : COLOR_NEUTRAL_30,
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
                            background: COLOR_PRIMARY,
                          }}
                        />
                      )}
                      <span style={{ position: "relative" }}>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 탭의 콘텐츠 (EfficacyContent / AERiskContent) / Selected Tab Content */}
              {activeTab === "efficacy" ? <EfficacyContent /> : <AERiskContent />}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 시뮬레이션 저장 버튼 영역 / Save Simulation Button Area */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", paddingBottom: "24px" }}>
        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          style={{
            position: "relative",
            height: "40px",
            padding: "0 clamp(18px, 2vw, 32px)",
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
            marginRight: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: "36px", background: "#f06600" }} />
          <span style={{ position: "relative" }}>Save Simulation</span>
        </button>
      </div>

      {/* Save Simulation 모달 / Save Simulation Modal */}
      {showSaveModal && (
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
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "20px", pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "20px", background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "20px", background: "rgba(255,255,255,0.88)" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "20px", background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
            </div>

            {/* 모달 콘텐츠 영역 / Modal Content Area */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 모달 제목 / Modal Title */}
              <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "18px", color: "#484646", letterSpacing: "-0.54px", lineHeight: 1.2, margin: 0 }}>
                Save Simulation
              </p>

              {/* 시뮬레이션 이름 및 설명 입력 필드 / Simulation Name & Description Input Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Simulation Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "13px", color: "#484646", letterSpacing: "-0.39px", lineHeight: 1.2, margin: 0 }}>
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
                  <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "13px", color: "#484646", letterSpacing: "-0.39px", lineHeight: 1.2, margin: 0 }}>
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
            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "8px", justifyContent: "center"}}>
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
