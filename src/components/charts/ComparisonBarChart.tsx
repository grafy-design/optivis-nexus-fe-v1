"use client";

/** ComparisonBarChart — OPTIVIS와 Traditional 두 값을 나란히 비교하는 막대 차트 */

import { useState } from "react";
import ReactECharts from "@/components/charts/DynamicECharts";
import {
  COMPARISON_COLORS,
  BAR_RADIUS,
} from "@/lib/chart-styles";

interface ComparisonBarChartProps {
  optivisValue: number;
  traditionalValue: number;
  height?: string;
  formatter?: (value: number, label?: string) => string;
  label?: string;
  size?: "s" | "m";
}

export function ComparisonBarChart({
  optivisValue,
  traditionalValue,
  height = "100%",
  formatter = (val, label) => label === 'Cost' ? `${val}M` : String(val),
  label,
  size = "s",
}: ComparisonBarChartProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isCompact = size === "s";
  const fontSize = isCompact ? 10 : 20;
  const fontWeight = isCompact ? 600 : 700;
  const labelOffset: [number, number] = isCompact ? [0, 4] : [0, 6];
  const gridPad = isCompact ? 4 : 16;
  const maxValue = Math.max(optivisValue, traditionalValue);
  const reduction = Math.abs(traditionalValue - optivisValue);

  // 호버 시 가로선 + 차이값 커스텀 시리즈
  const reductionSeries =
    isHovered
      ? [
          {
            type: "custom" as const,
            renderItem: (params: any, api: any) => {
              if (params.dataIndex !== 0) return null;

              const higherValue = Math.max(optivisValue, traditionalValue);

              const higherY = api.coord([0, higherValue])[1];
              const optivisY = api.coord([0, optivisValue])[1];

              const { x: gridX, width: gridWidth } = params.coordSys;

              // OPTIVIS 바 중심 X 계산 (barWidth 45%, barGap 10%)
              const barUnit = gridWidth / (0.45 * 2 + 0.45 * 0.1);
              const barW = barUnit * 0.45;
              const gapW = barW * 0.1;
              const optivisCenterX = gridX + barW / 2;
              const barsLeft = gridX;
              const barsWidth = 2 * barW + gapW;

              // 그라디언트 영역 높이 (같은 값일 때도 최소 높이 확보)
              const bottomY = api.coord([0, 0])[1];
              const gradientHeight = Math.max(optivisY - higherY, (bottomY - higherY) * 0.4);

              return {
                type: "group",
                children: [
                  // 점선 하단 연보라 그라디언트
                  {
                    type: "rect",
                    shape: {
                      x: barsLeft,
                      y: higherY,
                      width: barsWidth,
                      height: gradientHeight,
                    },
                    style: {
                      fill: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: "rgba(68, 64, 117, 0.125)" },
                          { offset: 1, color: "rgba(68, 64, 117, 0)" },
                        ],
                      },
                    },
                    silent: true,
                  },
                  // 가로 점선 (높은 바 최상단 기준)
                  {
                    type: "line",
                    shape: {
                      x1: barsLeft,
                      y1: higherY,
                      x2: barsLeft + barsWidth,
                      y2: higherY,
                    },
                    style: {
                      stroke: "#262255",
                      lineWidth: 1,
                      lineDash: [3, 2],
                    },
                    silent: true,
                  },
                  // 차이값 텍스트 (OPTIVIS 바 상단)
                  ...(reduction > 0 ? [{
                    type: "text",
                    position: [
                      optivisCenterX + (isCompact ? 4 : 6),
                      higherY + (isCompact ? 4 : 8),
                    ],
                    style: {
                      text: reduction.toFixed(2),
                      fill: "#262255",
                      fontSize: isCompact ? 9 : 14,
                      fontWeight: 600,
                      textAlign: "center",
                      textVerticalAlign: "top",
                      fontFamily: "Inter",
                    },
                    silent: true,
                  }] : []),
                ],
              };
            },
            data: [0],
            z: 10,
          },
        ]
      : [];

  return (
    <div
      className="w-full"
      style={{ height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ReactECharts
        option={{
          grid: { left: gridPad, right: gridPad, top: 0, bottom: 0, containLabel: false },
          xAxis: { show: false, type: 'category' as const, data: [''] },
          yAxis: { show: false, type: 'value' as const, min: 0, max: maxValue * 1.2, boundaryGap: false },
          tooltip: { show: false },
          legend: { show: false },
          series: [
            {
              name: 'OPTIVIS',
              type: 'bar',
              data: [optivisValue],
              itemStyle: { color: COMPARISON_COLORS.optivis, borderRadius: BAR_RADIUS.topMedium },
              barWidth: '45%',
              barGap: '10%',
              emphasis: { disabled: true },
              label: {
                show: true,
                position: 'insideTop' as const,
                offset: labelOffset,
                formatter: formatter(optivisValue, label),
                color: COMPARISON_COLORS.label,
                fontSize,
                fontWeight,
                fontFamily: 'Inter',
              },
            },
            {
              name: 'Traditional',
              type: 'bar',
              data: [traditionalValue],
              itemStyle: { color: COMPARISON_COLORS.traditional, borderRadius: BAR_RADIUS.topMedium },
              barWidth: '45%',
              emphasis: { disabled: true },
              label: {
                show: true,
                position: 'insideTop' as const,
                offset: labelOffset,
                formatter: formatter(traditionalValue, label),
                color: COMPARISON_COLORS.label,
                fontSize,
                fontWeight,
                fontFamily: 'Inter',
              },
            },
            ...reductionSeries,
          ],
        }}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
