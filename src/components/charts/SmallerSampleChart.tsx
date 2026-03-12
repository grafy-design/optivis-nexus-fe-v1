"use client";

import React from "react";
import { LineChartWithHighlight } from "./LineChartWithHighlight";

interface SmallerSampleChartProps {
  optivisData: number[][];
  traditionalData: number[][];
  highlightIndex?: number;
  highlightXValue?: number;
  compactMode?: boolean; // Reduction View 모드
}

export const SmallerSampleChart: React.FC<SmallerSampleChartProps> = ({
  optivisData,
  traditionalData,
  highlightIndex,
  highlightXValue,
  compactMode = false,
}) => {
  return (
    <LineChartWithHighlight
      optivisData={optivisData}
      traditionalData={traditionalData}
      xAxisName="Sample Size"
      yAxisName="CI Width"
      highlightIndex={highlightIndex}
      highlightXValue={highlightXValue}
      grid={compactMode ? { left: 12, right: -8, top: 18, bottom: 0, containLabel: true } : { left: 16, right: 4, top: 12, bottom: 16, containLabel: true }}
      xAxisConfig={compactMode ? {
        nameGap: 3,
        nameTextStyle: { fontSize: 10, fontWeight: 500, color: "#787776" },
        scale: true,
        axisLabel: { fontSize: 10, fontWeight: 500, color: "#787776" },
      } : {
        nameGap: 18,
        nameTextStyle: { fontSize: 10, fontWeight: 500, color: "#787776" },
        scale: true,
        axisLabel: { fontSize: 10, fontWeight: 500, color: "#787776", margin: 4 },
      }}
      yAxisConfig={compactMode ? {
        nameGap: 24,
        nameTextStyle: { fontSize: 10, fontWeight: 500, color: "#787776" },
        scale: true,
        axisLabel: { fontSize: 10, fontWeight: 500, color: "#787776", margin: 4 },
      } : {
        nameGap: 26,
        nameTextStyle: { fontSize: 10, fontWeight: 500, color: "#787776" },
        scale: true,
        axisLabel: { fontSize: 10, fontWeight: 500, color: "#787776", margin: 4 },
      }}
      showGrid={true}
      showAxes={true}
      showTicks={true}
      showTooltip={true}
      optivisColor="#f06600"
      traditionalColor="#231f52"
      optivisSymbolSize={6}
      traditionalSymbolSize={6}
      optivisLineWidth={2}
      traditionalLineWidth={2}
      showAreaStyle={true}
      optivisAreaColor="rgba(240, 102, 0, 0.25)"
      traditionalAreaColor="rgba(35, 31, 82, 0.25)"
    />
  );
};

