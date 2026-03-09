"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceBarsChartData } from "./types";
import { useState, useEffect, useMemo } from "react";

const NEUTRAL_50 = "#787776";

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function TSIVarianceByGroupBarChart({ data, yAxisLabel = "CIWidth" }: { data: VarianceBarsChartData; yAxisLabel?: string }) {
  const [nameFontSize, setNameFontSize] = useState(9);
  const [labelFontSize, setLabelFontSize] = useState(9);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const wide = window.innerWidth > 1470;
      setNameFontSize(wide ? 10.5 : 9);
      setLabelFontSize(wide ? 12 : 9);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxValue = Math.max(...data.bars.map((b) => b.value));

  const option: EChartsOption = {
    animation: true,
    animationDuration: 300,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow", z: -1, shadowStyle: { color: "rgba(150,150,150,0.08)" } },
      padding: [4, 6],
      borderWidth: 0,
      borderColor: "transparent",
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
      textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 },
      confine: true,
      formatter: () => {
        let html = ``;
        data.bars.forEach((bar) => {
          html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 0"><span style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${bar.color};flex-shrink:0"></span><span style="color:#787776;font-size:9px">${bar.label}</span></span><span style="color:#787776;font-size:13px;font-weight:600">${bar.value.toFixed(1)} (${bar.weightLabel})</span></div>`;
        });
        return html;
      },
    },
    grid: { left: 18, right: 6, top: 4, bottom: 0, containLabel: true },
    xAxis: {
      type: "category",
      data: data.bars.map((bar) => bar.label),
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
        margin: 8,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 10,
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
      axisTick: { show: true, length: 4, lineStyle: { color: NEUTRAL_50 } },
      axisLabel: {
        show: true,
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
        formatter: (value: number) => {
          if (value === 0) return `${value}\n`;
          if (Math.abs(value - data.max) < 0.001) return `\n${value}`;
          return value.toString();
        },
      },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 28,
      nameRotate: 90,
      nameTextStyle: {
        color: NEUTRAL_50,
        fontSize: nameFontSize,
        fontFamily: "Inter",
      },
    },
    series: [
      {
        type: "bar",
        barWidth: "60%",
        barCategoryGap: "10%",
        data: data.bars.map((bar, i) => {
          const isActive = hoveredIdx === null || hoveredIdx === i;
          const opacity = isActive ? 1 : 0.6;
          return {
            value: bar.value,
            itemStyle: {
              color: hexToRgba(bar.color, opacity),
              borderRadius: [8, 8, 8, 8],
              borderColor: bar.highlight ? hexToRgba("#8A47FF", opacity) : "transparent",
              borderWidth: bar.highlight ? 3 : 0,
            },
            label: {
              show: true,
              position: "top" as const,
              distance: 2,
              formatter: bar.weightLabel,
              color: hoveredIdx === null
                ? (Math.abs(bar.value - maxValue) < 0.001 ? bar.color : NEUTRAL_50)
                : isActive
                  ? (Math.abs(bar.value - maxValue) < 0.001 ? bar.color : NEUTRAL_50)
                  : hexToRgba(NEUTRAL_50, 0.6),
              fontSize: labelFontSize,
              fontFamily: "Inter",
              fontWeight: 600,
            },
          };
        }),
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "#c7c5c9",
            width: 1.5,
            type: [4, 3],
          },
          label: {
            show: true,
            position: "insideEndTop",
            offset: [6, 0],
            formatter: `Total Var = ${data.threshold.toFixed(2)}`,
            color: NEUTRAL_50,
            fontSize: labelFontSize,
            fontFamily: "Inter",
          },
          data: [{ yAxis: data.threshold }],
        },
      },
    ],
  };

  const onEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.dataIndex !== undefined) {
        setHoveredIdx(params.dataIndex);
      }
    },
    mouseout: () => setHoveredIdx(null),
    globalout: () => setHoveredIdx(null),
    updateaxispointer: (params: any) => {
      const axesInfo = params?.axesInfo;
      if (axesInfo && axesInfo.length > 0 && axesInfo[0].value !== undefined) {
        setHoveredIdx(axesInfo[0].value);
      }
    },
  }), []);

  return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} onEvents={onEvents} />;
}
