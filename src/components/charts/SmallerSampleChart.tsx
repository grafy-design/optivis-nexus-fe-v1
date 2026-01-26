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
      grid={compactMode ? { left: 20, right: 5, top: 10, bottom: 20, containLabel: true } : { left: 60, right: 20, top: 20, bottom: 50 }}
      xAxisConfig={compactMode ? {
        nameGap: 5,
        nameTextStyle: { fontSize: 10, fontWeight: 510, letterSpacing: -0.2, color: "#1B1B1B" },
        scale: true,
      } : {
        nameGap: 30,
        nameTextStyle: { fontSize: 12, color: "#666" },
        scale: true,
      }}
      yAxisConfig={compactMode ? {
        nameGap: 5,
        nameTextStyle: { fontSize: 10, fontWeight: 510, letterSpacing: -0.2, color: "#1B1B1B" },
        scale: true,
      } : {
        nameGap: 40,
        nameTextStyle: { fontSize: 12, color: "#666" },
        scale: true,
      }}
      showGrid={compactMode ? false : true}
      showAxes={compactMode ? false : true}
      showTicks={compactMode ? false : true}
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

