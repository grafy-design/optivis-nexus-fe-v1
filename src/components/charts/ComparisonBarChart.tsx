"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import { COMPARISON_COLORS, BAR_RADIUS } from "@/lib/chart-styles";

interface ComparisonBarChartProps {
  optivisValue: number;
  traditionalValue: number;
  height?: string;
  formatter?: (value: number, label?: string) => string;
  label?: string;
}

export function ComparisonBarChart({
  optivisValue,
  traditionalValue,
  height = "100%",
  formatter = (val, label) => label === 'Cost' ? `${val}M` : String(val),
  label,
}: ComparisonBarChartProps) {
  const maxValue = Math.max(optivisValue, traditionalValue);

  const commonOption = {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    xAxis: {
      show: false,
      type: 'category' as const,
      data: ['']
    },
    yAxis: {
      show: false,
      type: 'value' as const,
      min: 0,
      max: maxValue * 1.2,
      boundaryGap: false
    },
    tooltip: { show: false },
    legend: { show: false },
  };

  return (
    <ReactECharts
      option={{
        ...commonOption,
        series: [
          {
            type: 'bar',
            data: [optivisValue],
            itemStyle: { color: COMPARISON_COLORS.optivis, borderRadius: BAR_RADIUS.topMedium },
            barWidth: '45%',
            barGap: '10%',
            label: {
              show: true,
              position: 'insideTop' as const,
              formatter: formatter(optivisValue, label),
              color: COMPARISON_COLORS.label,
              fontSize: 19.5,
              fontWeight: 590,
              letterSpacing: -0.585,
            },
          },
          {
            type: 'bar',
            data: [traditionalValue],
            itemStyle: { color: COMPARISON_COLORS.traditional, borderRadius: BAR_RADIUS.topMedium },
            barWidth: '45%',
            label: {
              show: true,
              position: 'insideTop' as const,
              formatter: formatter(traditionalValue, label),
              color: COMPARISON_COLORS.label,
              fontSize: 19.5,
              fontWeight: 590,
              letterSpacing: -0.585,
            },
          },
        ],
      }}
      notMerge={true}
      lazyUpdate={true}
      style={{ height, width: '100%' }}
    />
  );
}
