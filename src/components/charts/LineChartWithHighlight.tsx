"use client";

import React, { useState, useMemo } from "react";
import ReactECharts from "@/components/charts/DynamicECharts";

interface LineChartWithHighlightProps {
  optivisData: number[][];
  traditionalData: number[][];
  xAxisName: string;
  yAxisName: string;
  highlightIndex?: number; // 인덱스 기준 (기존 방식)
  highlightXValue?: number; // x축 값 기준 (새로운 방식)
  grid?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    containLabel?: boolean;
  };
  xAxisConfig?: {
    nameGap?: number;
    nameTextStyle?: {
      fontSize?: number;
      fontWeight?: number;
      letterSpacing?: number;
      color?: string;
    };
    scale?: boolean;
    axisLabel?: {
      fontSize?: number;
      fontWeight?: number;
      color?: string;
    };
  };
  yAxisConfig?: {
    nameGap?: number;
    nameTextStyle?: {
      fontSize?: number;
      fontWeight?: number;
      letterSpacing?: number;
      color?: string;
    };
    scale?: boolean;
    axisLabel?: {
      fontSize?: number;
      fontWeight?: number;
      color?: string;
    };
  };
  showGrid?: boolean;
  showAxes?: boolean;
  showTicks?: boolean;
  showTooltip?: boolean;
  optivisColor?: string;
  traditionalColor?: string;
  optivisSymbolSize?: number;
  traditionalSymbolSize?: number;
  optivisLineWidth?: number;
  traditionalLineWidth?: number;
  showAreaStyle?: boolean;
  optivisAreaColor?: string;
  traditionalAreaColor?: string;
  onChartClick?: (params: any) => void;
}

// y축 값에 가장 가까운 포인트 인덱스를 찾는 함수
const findClosestIndexByY = (data: number[][], yValue: number) => {
  if (data.length === 0) return -1;

  let closestIndex = 0;
  let minDiff = Math.abs(data[0][1] - yValue);

  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i][1] - yValue);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

// x축 값에 가장 가까운 포인트 인덱스를 찾는 함수
const findClosestIndexByX = (data: number[][], xValue: number) => {
  if (data.length === 0) return -1;

  let closestIndex = 0;
  let minDiff = Math.abs(data[0][0] - xValue);

  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i][0] - xValue);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

export const LineChartWithHighlight: React.FC<LineChartWithHighlightProps> = ({
  optivisData,
  traditionalData,
  xAxisName,
  yAxisName,
  highlightIndex,
  highlightXValue,
  grid = { left: 60, right: 20, top: 20, bottom: 50 },
  xAxisConfig = {},
  yAxisConfig = {},
  showGrid = true,
  showAxes = true,
  showTicks = true,
  showTooltip = true,
  optivisColor = "#f06600",
  traditionalColor = "#231f52",
  optivisSymbolSize = 6,
  traditionalSymbolSize = 6,
  optivisLineWidth = 2,
  traditionalLineWidth = 2,
  showAreaStyle = false,
  optivisAreaColor = "rgba(240, 102, 0, 0.25)",
  traditionalAreaColor = "rgba(35, 31, 82, 0.25)",
  onChartClick,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 하이라이트 포인트 계산 메모이제이션
  const { optivisPoint, traditionalPoint } = useMemo(() => {
    let optivisHighlightIndex: number;
    if (highlightXValue !== undefined) {
      optivisHighlightIndex = findClosestIndexByX(optivisData, highlightXValue);
    } else if (highlightIndex !== undefined) {
      optivisHighlightIndex = Math.min(
        Math.max(0, highlightIndex),
        optivisData.length - 1,
      );
    } else {
      optivisHighlightIndex = -1;
    }

    const optivisY =
      optivisHighlightIndex >= 0 && optivisHighlightIndex < optivisData.length
        ? optivisData[optivisHighlightIndex][1]
        : null;

    const traditionalHighlightIndex =
      optivisY !== null ? findClosestIndexByY(traditionalData, optivisY) : -1;

    const oPoint =
      optivisHighlightIndex >= 0 && optivisHighlightIndex < optivisData.length
        ? optivisData[optivisHighlightIndex]
        : null;
    const tPoint =
      traditionalHighlightIndex >= 0 &&
      traditionalHighlightIndex < traditionalData.length
        ? traditionalData[traditionalHighlightIndex]
        : null;

    return { optivisPoint: oPoint, traditionalPoint: tPoint };
  }, [optivisData, traditionalData, highlightIndex, highlightXValue]);

  // ECharts option 객체 메모이제이션
  const chartOption = useMemo(() => {
    const series: any[] = [
      {
        name: "OPTIVIS",
        type: "line",
        data: optivisData,
        lineStyle: { color: optivisColor, width: optivisLineWidth },
        symbol: "circle",
        symbolSize: optivisSymbolSize,
        itemStyle: { color: optivisColor },
        smooth: true,
        z: 3,
        markPoint: optivisPoint
          ? {
              data: [
                {
                  coord: optivisPoint,
                  symbol: "circle",
                  symbolSize: 19,
                  itemStyle: { color: optivisColor, opacity: 0.5 },
                },
                {
                  coord: optivisPoint,
                  symbol: "circle",
                  symbolSize: 9,
                  itemStyle: { color: optivisColor, opacity: 0.8 },
                },
              ],
              label: { show: false },
              z: 10,
            }
          : undefined,
        markLine: optivisPoint
          ? {
              symbol: "none",
              lineStyle: {
                type: "dashed",
                width: 1,
                opacity: 1,
              },
              data: [
                {
                  xAxis: optivisPoint[0],
                  label: { show: false },
                  lineStyle: {
                    color: optivisColor,
                    type: "solid",
                    width: 2,
                    opacity: 1,
                  },
                },
                {
                  yAxis: optivisPoint[1],
                  label: { show: false },
                  lineStyle: {
                    color: "#7654F0",
                    type: [4, 3] as any,
                    width: 1.5,
                    opacity: 0.8,
                  },
                },
              ],
              z: 5,
            }
          : undefined,
        ...(showAreaStyle && {
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: optivisAreaColor },
                { offset: 0.5, color: optivisAreaColor.replace("0.25", "0.12") },
                { offset: 1, color: optivisAreaColor.replace("0.25", "0.03") },
              ],
            },
            origin: "start",
          },
        }),
      },
      {
        name: "Traditional",
        type: "line",
        data: traditionalData,
        lineStyle: { color: traditionalColor, width: traditionalLineWidth },
        symbol: "circle",
        symbolSize: traditionalSymbolSize,
        itemStyle: { color: traditionalColor },
        smooth: true,
        z: 2,
        markPoint: traditionalPoint
          ? {
              data: [
                {
                  coord: traditionalPoint,
                  symbol: "circle",
                  symbolSize: 19,
                  itemStyle: { color: traditionalColor, opacity: 0.5 },
                },
                {
                  coord: traditionalPoint,
                  symbol: "circle",
                  symbolSize: 9,
                  itemStyle: { color: traditionalColor, opacity: 0.8 },
                },
              ],
              label: { show: false },
              z: 10,
            }
          : undefined,
        markLine: traditionalPoint
          ? {
              symbol: "none",
              lineStyle: {
                type: "dashed",
                width: 1,
                opacity: 1,
              },
              data: [
                {
                  xAxis: traditionalPoint[0],
                  label: { show: false },
                  lineStyle: {
                    color: traditionalColor,
                    type: "solid",
                    width: 2,
                    opacity: 1,
                  },
                },
              ],
              z: 5,
            }
          : undefined,
        ...(showAreaStyle && {
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: traditionalAreaColor },
                {
                  offset: 0.5,
                  color: traditionalAreaColor.replace("0.25", "0.12"),
                },
                {
                  offset: 1,
                  color: traditionalAreaColor.replace("0.25", "0.03"),
                },
              ],
            },
            origin: "start",
          },
        }),
      },
    ];

    return {
      grid,
      xAxis: {
        type: "value",
        name: xAxisName,
        nameLocation: "middle",
        nameGap: xAxisConfig.nameGap ?? 30,
        nameTextStyle: xAxisConfig.nameTextStyle ?? {
          fontSize: 12,
          color: "#666",
        },
        axisLine: {
          show: showAxes,
          ...(showAxes && { lineStyle: { color: "#999" } }),
        },
        axisTick: { show: showTicks },
        axisLabel: {
          show: showTicks,
          ...(xAxisConfig.axisLabel && {
            fontSize: xAxisConfig.axisLabel.fontSize,
            fontWeight: xAxisConfig.axisLabel.fontWeight,
            color: xAxisConfig.axisLabel.color,
          }),
        },
        splitLine: {
          show: showGrid,
          lineStyle: { color: "#e0e0e0", type: "dashed" },
        },
        scale: xAxisConfig.scale ?? false,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: yAxisConfig.nameGap ?? 40,
        nameTextStyle: yAxisConfig.nameTextStyle ?? {
          fontSize: 12,
          color: "#666",
        },
        axisLine: {
          show: showAxes,
          ...(showAxes && { lineStyle: { color: "#999" } }),
        },
        axisTick: { show: showTicks },
        axisLabel: {
          show: showTicks,
          ...(yAxisConfig.axisLabel && {
            fontSize: yAxisConfig.axisLabel.fontSize,
            fontWeight: yAxisConfig.axisLabel.fontWeight,
            color: yAxisConfig.axisLabel.color,
          }),
        },
        splitLine: {
          show: showGrid,
          lineStyle: { color: "#e0e0e0", type: "dashed" },
        },
        scale: yAxisConfig.scale ?? false,
      },
      series,
      tooltip: { show: false },
    };
  }, [
    optivisData, traditionalData, optivisPoint, traditionalPoint,
    grid, xAxisName, yAxisName, xAxisConfig, yAxisConfig,
    showGrid, showAxes, showTicks, showAreaStyle,
    optivisColor, traditionalColor,
    optivisSymbolSize, traditionalSymbolSize,
    optivisLineWidth, traditionalLineWidth,
    optivisAreaColor, traditionalAreaColor,
  ]);

  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showTooltip || (!optivisPoint && !traditionalPoint)) return;

    // 클릭 위치 가져오기
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 아무 곳이나 클릭하면 토글
    if (tooltipVisible) {
      setTooltipVisible(false);
    } else {
      setTooltipPosition({ x, y });
      setTooltipVisible(true);
    }
  };

  return (
    <div
      style={{ position: "relative", height: "100%", width: "100%" }}
      onClick={handleChartClick}
    >
      <ReactECharts
        option={chartOption}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: "100%", width: "100%" }}
        onEvents={
          onChartClick
            ? {
                click: onChartClick,
              }
            : undefined
        }
      />
      {/* 클릭 위치에 표시되는 툴팁 */}
      {showTooltip && tooltipVisible && (optivisPoint || traditionalPoint) && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: "5.67px",
            padding: "8px 12px",
            minWidth: "87px",
            zIndex: 10,
            transform: "translate(-50%, -100%)",
            marginTop: "-8px",
          }}
        >
          {/* OPTIVIS 섹션 */}
          {optivisPoint && (
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: optivisColor,
                    marginRight: "8px",
                    flexShrink: 0,
                  }}
                />
                <span className="text-body4 text-white">OPTIVIS</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span className="text-body4 text-neutral-98">
                  {Math.round(optivisPoint[0])} , {optivisPoint[1].toFixed(2)}
                </span>
              </div>
            </div>
          )}
          {/* Traditional 섹션 */}
          {traditionalPoint && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: traditionalColor,
                    marginRight: "8px",
                    flexShrink: 0,
                  }}
                />
                <span className="text-body4 text-white">Traditional</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span className="text-body4 text-neutral-98">
                  {Math.round(traditionalPoint[0])} ,{" "}
                  {traditionalPoint[1].toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
