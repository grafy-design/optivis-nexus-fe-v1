"use client";

/** TSIVarianceByGroupBarChart — 그룹별 분산을 개별 막대로 비교하고 총분산 기준선을 표시하는 차트 */

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { VarianceBarsChartData } from "./types";
import { useState, useEffect, useMemo } from "react";
import {
  hexToRgba,
  CHART_COLORS,
  CHART_FONT,
  tooltipAxisShadowLight,
  tooltipDotRow,
  axisLineWithWidth,
  axisTickWithLength,
  splitLineHidden,
  gridVarianceByGroup,
  animationDefault,
  BAR_RADIUS,
  edgeLabelFormatter,
} from "@/lib/chart-styles";

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
    ...animationDefault,
    tooltip: {
      ...tooltipAxisShadowLight,
      formatter: () => {
        return data.bars.map((bar) =>
          tooltipDotRow(bar.color, bar.label, `${bar.value.toFixed(1)} (${bar.weightLabel})`)
        ).join("");
      },
    },
    grid: gridVarianceByGroup,
    xAxis: {
      type: "category",
      data: data.bars.map((bar) => bar.label),
      axisLine: axisLineWithWidth,
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: CHART_COLORS.NEUTRAL_50,
        fontSize: 9,
        fontFamily: CHART_FONT.familyShort,
        margin: 8,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: data.max,
      interval: data.ticks.length > 1 ? data.ticks[1] - data.ticks[0] : 10,
      axisLine: axisLineWithWidth,
      axisTick: axisTickWithLength(4),
      axisLabel: {
        show: true,
        color: CHART_COLORS.NEUTRAL_50,
        fontSize: 9,
        fontFamily: CHART_FONT.familyShort,
        formatter: edgeLabelFormatter(data.max, 0, (v) => v.toString()),
      },
      splitLine: splitLineHidden,
      name: yAxisLabel,
      nameLocation: "middle",
      nameGap: 28,
      nameRotate: 90,
      nameTextStyle: {
        color: CHART_COLORS.NEUTRAL_50,
        fontSize: nameFontSize,
        fontFamily: CHART_FONT.familyShort,
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
              borderRadius: BAR_RADIUS.allMedium,
              borderColor: bar.highlight ? hexToRgba("#8A47FF", opacity) : "transparent",
              borderWidth: bar.highlight ? 3 : 0,
            },
            label: {
              show: true,
              position: "top" as const,
              distance: 2,
              formatter: bar.weightLabel,
              color: hoveredIdx === null
                ? (Math.abs(bar.value - maxValue) < 0.001 ? bar.color : CHART_COLORS.NEUTRAL_50)
                : isActive
                  ? (Math.abs(bar.value - maxValue) < 0.001 ? bar.color : CHART_COLORS.NEUTRAL_50)
                  : hexToRgba(CHART_COLORS.NEUTRAL_50, 0.6),
              fontSize: labelFontSize,
              fontFamily: CHART_FONT.familyShort,
              fontWeight: 600,
            },
          };
        }),
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: CHART_COLORS.GUIDE_LINE_ALT,
            width: 1.5,
            type: [4, 3],
          },
          label: {
            show: true,
            position: "insideEndTop",
            offset: [6, 0],
            formatter: `Total Var = ${data.threshold.toFixed(2)}`,
            color: CHART_COLORS.NEUTRAL_50,
            fontSize: labelFontSize,
            fontFamily: CHART_FONT.familyShort,
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
