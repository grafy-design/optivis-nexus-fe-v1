"use client";

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

export function MultiRankingBarChart({ data, height = "100%", label }: MultiRankingBarChartProps) {
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
      option={{
        ...commonOption,
        series: normalizedData.map((item, index) => ({
          type: "bar",
          data: [item.value],
          itemStyle: { color: index < 3 ? "#f06600" : "#AAAAAD", borderRadius: [8, 8, 8, 8] },
          barWidth: barWidth,
          barGap,
          label: {
            show: true,
            formatter: item.label,
            position: "insideBottom",
            color: "#ffffff",
            fontSize: 19.5,
            fontWeight: 590,
            letterSpacing: -0.585,
          },
        })),
      }}
      style={{ height, width: "100%" }}
    />
  );
}
