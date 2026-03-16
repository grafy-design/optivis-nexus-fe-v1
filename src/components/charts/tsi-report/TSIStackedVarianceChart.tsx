"use client";

/** TSIStackedVarianceChart — Within/Explained 분산을 스택형 막대로 시각화하는 차트 */

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceStackChartData } from "./types";
import { useState, useEffect, useMemo } from "react";
import {
  hexToRgba,
  CHART_COLORS,
  CHART_FONT,
  tooltipAxisShadowLight,
  tooltipDotRow,
  tooltipTotalRow,
  axisLineWithWidth,
  axisTickWithLength,
  splitLineHidden,
  gridStackedVariance,
  animationDefault,
  legendBottom,
  BAR_RADIUS,
  edgeLabelFormatter,
} from "@/lib/chart-styles";

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
    ...animationDefault,
    tooltip: {
      ...tooltipAxisShadowLight,
      formatter: () => {
        const total = data.within + data.explained;
        return tooltipDotRow(data.withinColor, "Within", data.within.toFixed(1)) +
          tooltipDotRow(data.explainedColor, "Explained", data.explained.toFixed(1)) +
          tooltipTotalRow("Total", total.toFixed(1));
      },
    },
    legend: legendBottom,
    grid: gridStackedVariance,
    xAxis: {
      type: "category",
      data: [""],
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: splitLineHidden,
      axisLine: axisLineWithWidth,
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 5,
      axisLine: axisLineWithWidth,
      axisTick: axisTickWithLength(4),
      axisLabel: {
        show: true,
        color: CHART_COLORS.NEUTRAL_50,
        fontSize: 9,
        fontFamily: CHART_FONT.familyShort,
        formatter: edgeLabelFormatter(data.max, 0, (v) => v.toFixed(1)),
      },
      splitLine: splitLineHidden,
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 32,
      nameRotate: 90,
      nameTextStyle: {
        color: CHART_COLORS.NEUTRAL_50,
        fontSize: nameFontSize,
        fontFamily: CHART_FONT.familyShort,
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
          borderRadius: BAR_RADIUS.allLarge,
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
          borderRadius: BAR_RADIUS.allLarge,
        },
        label: {
          show: true,
          position: "top",
          formatter: () => data.vrLabel,
          color: CHART_COLORS.NEUTRAL_50,
          fontSize: labelFontSize,
          fontFamily: CHART_FONT.familyShort,
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
