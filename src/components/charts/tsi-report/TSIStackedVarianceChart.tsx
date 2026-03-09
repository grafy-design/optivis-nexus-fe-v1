"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceStackChartData } from "./types";
import { useState, useEffect, useMemo } from "react";

const NEUTRAL_50 = "#787776";

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function TSIStackedVarianceChart({
  data,
  yAxisLabel = "CIWidth",
}: {
  data: VarianceStackChartData;
  yAxisLabel?: string;
}) {
  const [nameFontSize, setNameFontSize] = useState(9);
  const [labelFontSize, setLabelFontSize] = useState(9);
  const [hoveredSeries, setHoveredSeries] = useState<number | null>(null);

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

  const withinActive = hoveredSeries === null || hoveredSeries === 0;
  const explainedActive = hoveredSeries === null || hoveredSeries === 1;

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
        const total = data.within + data.explained;
        const row = (dot: string, label: string, val: string) =>
          `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 0"><span style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0"></span><span style="color:#787776;font-size:9px">${label}</span></span><span style="color:#787776;font-size:13px;font-weight:600">${val}</span></div>`;
        return row(data.withinColor, "Within", data.within.toFixed(1)) +
          row(data.explainedColor, "Explained", data.explained.toFixed(1)) +
          `<div style="display:flex;justify-content:space-between;padding:1px 0;border-top:1px solid #e3e1e5;margin-top:2px;padding-top:3px"><span style="color:#787776;font-size:9px">Total</span><span style="color:#787776;font-size:13px;font-weight:600">${total.toFixed(1)}</span></div>`;
      },
    },
    legend: {
      show: true,
      bottom: 0,
      itemWidth: 48,
      itemHeight: 14,
      itemGap: 24,
      icon: "roundRect",
      textStyle: {
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
      },
    },
    grid: { left: 16, right: 6, top: 10, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: [""],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 5,
      axisLine: { show: true, lineStyle: { color: NEUTRAL_50, width: 1 } },
      axisTick: { show: true, length: 4, lineStyle: { color: NEUTRAL_50 } },
      axisLabel: {
        show: true,
        color: NEUTRAL_50,
        fontSize: 9,
        fontFamily: "Inter",
        formatter: (value: number) => {
          if (value === 0) return `${value.toFixed(1)}\n`;
          if (Math.abs(value - data.max) < 0.001) return `\n${value.toFixed(1)}`;
          return value.toFixed(1);
        },
      },
      splitLine: { show: false },
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      nameRotate: 90,
      nameTextStyle: {
        color: NEUTRAL_50,
        fontSize: nameFontSize,
        fontFamily: "Inter",
      },
    },
    series: [
      {
        name: "Within",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
        data: [data.within],
        itemStyle: {
          color: hexToRgba(data.withinColor, withinActive ? 1 : 0.6),
          borderRadius: [12, 12, 12, 12],
        },
      },
      {
        name: "Explained",
        type: "bar",
        stack: "variance",
        barWidth: "90%",
        data: [data.explained],
        itemStyle: {
          color: hexToRgba(data.explainedColor, explainedActive ? 1 : 0.6),
          borderRadius: [12, 12, 12, 12],
        },
        label: {
          show: true,
          position: "top",
          formatter: () => data.vrLabel,
          color: NEUTRAL_50,
          fontSize: labelFontSize,
          fontFamily: "Inter",
          fontWeight: hoveredSeries !== null ? 700 : 500,
        },
      },
    ],
  };

  const onEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.seriesIndex !== undefined) {
        setHoveredSeries(params.seriesIndex);
      }
    },
    mouseout: () => setHoveredSeries(null),
    globalout: () => setHoveredSeries(null),
  }), []);

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "calc(100% + 8px)" }}
      onEvents={onEvents}
    />
  );
}
