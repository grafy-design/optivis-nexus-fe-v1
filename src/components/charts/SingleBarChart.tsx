"use client";

import ReactECharts from "@/components/charts/DynamicECharts";
import {
  BAR_RADIUS,
  tooltipBase,
  tooltipDotRow,
  tooltipWrap,
} from "@/lib/chart-styles";

interface SingleBarChartProps {
  value: number;
  maxValue: number;
  color: string;
  height?: string;
  formatter?: (value: number) => string;
  size?: "s" | "m";
  label?: string;
}

export function SingleBarChart({
  value,
  maxValue,
  color,
  height = "100%",
  formatter = (val) => String(val),
  size = "s",
  label = "",
}: SingleBarChartProps) {
  const fontSize = size === "m" ? 20 : 10;
  const fontWeight = size === "m" ? 600 : 500;
  const labelOffset: [number, number] = size === "m" ? [0, 6] : [0, 4];
  const commonOption = {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    xAxis: { show: false, type: 'category' as const, data: [''] },
    yAxis: { show: false, type: 'value' as const, min: 0, max: maxValue * 1.2, boundaryGap: false },
    tooltip: {
      ...tooltipBase,
      trigger: "item" as const,
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params;
        const val = item?.value ?? value;
        return tooltipWrap(tooltipDotRow(color, label, formatter(Number(val))));
      },
    },
    legend: { show: false },
  };

  return (
    <ReactECharts
      option={{
        ...commonOption,
        series: [
          {
            type: 'bar',
            data: [value],
            itemStyle: { color, borderRadius: BAR_RADIUS.topMedium },
            barWidth: '100%',
            emphasis: {
              itemStyle: {
                color: color === "#f06600" ? "#ff7a1a" : color === "#231f52" ? "#3a2d7a" : color,
                opacity: 1,
              },
            },
            label: {
              show: true,
              position: 'insideTop' as const,
              offset: labelOffset,
              formatter: formatter(value),
              fontFamily: 'Inter, sans-serif',
              color: '#FFFFFF',
              fontSize,
              fontWeight,
            },
          },
        ],
      }}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas', autoResize: true }}
      notMerge={true}
    />
  );
}
