"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";

export interface MultiRankingBarItem {
  label: string;
  value: number;
  rank?: number;
  id?: string;
}

interface ExplainGainLikeItem {
  rank: number;
  variance_reduction: number;
  relative_contribution?: number;
  feature_name?: string;
}

type MultiRankingBarInputItem = MultiRankingBarItem | ExplainGainLikeItem;

interface MultiRankingBarChartProps {
  data: MultiRankingBarInputItem[];
  height?: string;
  label?: string;
}

const getColor = (index: number) => (index < 3 ? "#f06600" : index >= 7 ? "#C8C8CB" : "#AAAAAD");
const getEmphasisColor = (index: number) => (index < 3 ? "#ff7a1a" : getColor(index));

export function MultiRankingBarChart({ data, height = "100%", label }: MultiRankingBarChartProps) {
  const chartRef = useRef<any>(null);
  const [hoveredSeriesIdx, setHoveredSeriesIdx] = useState<number | null>(null);
  const isNarrow = typeof window !== "undefined" && window.innerWidth < 1470;

  const normalizedData: MultiRankingBarItem[] = data.map((item) => {
    if ("value" in item && "label" in item) {
      return item;
    }

    const value = Number(item.variance_reduction);
    return {
      label: `#${item.rank}`,
      value: Number.isFinite(value) ? value : 0,
      rank: item.rank,
    };
  });

  const maxValue = normalizedData.length > 0 ? Math.max(...normalizedData.map((item) => item.value)) : 0;
  const yAxisMax = maxValue > 0 ? maxValue * 1.2 : 1;

  const onEvents = {
    mouseover: useCallback((params: any) => {
      if (params.seriesIndex !== undefined && params.componentType === "series") {
        setHoveredSeriesIdx(params.seriesIndex);
      }
    }, []),
    globalout: useCallback(() => {
      setHoveredSeriesIdx(null);
    }, []),
  };

  const commonOption = {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    xAxis: {
      show: false,
      type: "category" as const,
      data: [""],
    },
    yAxis: {
      show: false,
      type: "value" as const,
      max: yAxisMax,
    },
    tooltip: { show: false },
    legend: { show: false },
  };

  const barCount = Math.max(normalizedData.length, 1);
  const gapRatio = barCount <= 3 ? 0.35 : barCount <= 5 ? 0.25 : 0.18;
  const barWidthPercent = 100 / (barCount + gapRatio * (barCount - 1));
  const barWidth = `${barWidthPercent.toFixed(2)}%`;
  const barGap = `${(gapRatio * 100).toFixed(0)}%`;

  return (
    <ReactECharts
      ref={chartRef}
      option={{
        ...commonOption,
        series: normalizedData.map((item, index) => {
          const isHovered = hoveredSeriesIdx === index;
          const isDimmed = hoveredSeriesIdx !== null && !isHovered;
          const color = isHovered ? getEmphasisColor(index) : getColor(index);

          return {
            type: "bar",
            data: [item.value],
            itemStyle: {
              color,
              opacity: isDimmed ? 0.4 : 1,
              borderRadius: [6, 6, 6, 6],
            },
            emphasis: { disabled: true },
            barWidth,
            barGap,
            label: {
              show: true,
              formatter: item.label,
              position: "insideBottom",
              color: "#ffffff",
              fontSize: isNarrow ? 11 : 13,
              font: "inter, Sanserif",
              fontWeight: 500,
              letterSpacing: -0.45,
              opacity: isDimmed ? 0.4 : 1,
            },
          };
        }),
      }}
      onEvents={onEvents}
      style={{ height, width: "100%" }}
    />
  );
}
