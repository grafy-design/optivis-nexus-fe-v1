"use client";

import React from "react";
import { LineChartWithHighlight } from "./LineChartWithHighlight";

interface LowerCostChartProps {
  optivisData: number[][];
  traditionalData: number[][];
  highlightIndex?: number;
  highlightXValue?: number;
  compactMode?: boolean; // Reduction View 모드
}

export const LowerCostChart: React.FC<LowerCostChartProps> = ({
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
      yAxisName="Cost"
      highlightIndex={highlightIndex}
      highlightXValue={highlightXValue}
      grid={compactMode ? { left: 20, right: 5, top: 10, bottom: 20, containLabel: true } : { left: 20, right: 5, top: 10, bottom: 20, containLabel: true }}
      xAxisConfig={{
        nameGap: compactMode ? 3 : 5,
        nameTextStyle: {
          fontSize: compactMode ? 8 : 10,
          fontWeight: 510,
          letterSpacing: -0.2,
          color: "#1B1B1B",
        },
        scale: true,
      }}
      yAxisConfig={{
        nameGap: compactMode ? 3 : 5,
        nameTextStyle: {
          fontSize: compactMode ? 8 : 10,
          fontWeight: 510,
          letterSpacing: -0.2,
          color: "#1B1B1B",
        },
        scale: true,
      }}
      showGrid={compactMode ? false : false}
      showAxes={compactMode ? false : false}
      showTicks={compactMode ? false : false}
      showTooltip={false}
      optivisColor="#f06600"
      traditionalColor="#231f52"
      optivisSymbolSize={4}
      traditionalSymbolSize={4}
      optivisLineWidth={2}
      traditionalLineWidth={2}
      showAreaStyle={true}
      optivisAreaColor="rgba(240, 102, 0, 0.25)"
      traditionalAreaColor="rgba(35, 31, 82, 0.25)"
    />
  );
};

