"use client";

import ReactECharts from "echarts-for-react";

interface SingleBarChartProps {
  value: number;
  maxValue: number;
  color: "#f06600" | "#231f52";
  height?: string;
  formatter?: (value: number) => string;
}

export function SingleBarChart({
  value,
  maxValue,
  color,
  height = "100%",
  formatter = (val) => String(val),
}: SingleBarChartProps) {
  const commonOption = {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    xAxis: { show: false, type: 'category' as const, data: [''] },
    yAxis: { show: false, type: 'value' as const, max: maxValue * 1.2 },
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
            data: [value],
            itemStyle: { color, borderRadius: [8, 8, 8, 8] },
            barWidth: '100%',
            label: {
              show: true,
              position: 'insideTop' as const,
              formatter: formatter(value),
              color: '#ffffff',
              fontSize: 19.5,
              fontWeight: 590,
              letterSpacing: -0.585,
            },
          },
        ],
      }}
      style={{ height, width: '100%' }}
    />
  );
}

