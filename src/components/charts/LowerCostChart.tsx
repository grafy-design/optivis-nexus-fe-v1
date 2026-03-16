"use client";

/** LowerCostChart — 샘플 크기 대비 비용 비교 꺾은선 차트 (OPTIVIS vs Traditional) */

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
      grid={compactMode ? { left: 16, right: 8, top: 15, bottom: 12, containLabel: true } : { left: 20, right: 12, top: 15, bottom: 16, containLabel: true }}
      xAxisConfig={{
        nameGap: compactMode ? 16 : 18,
        nameTextStyle: {
          fontSize: compactMode ? 8 : 10,
          fontWeight: 500,
          fontFamily: "Inter",
          color: "#787776",
        },
        scale: true,
        axisLabel: { fontSize: compactMode ? 8 : 10, fontWeight: 500, fontFamily: "Inter", color: "#787776", margin: 4 },
      }}
      yAxisConfig={{
        nameGap: compactMode ? 18 : 24,
        nameTextStyle: {
          fontSize: compactMode ? 8 : 10,
          fontWeight: 500,
          fontFamily: "Inter",
          color: "#787776",
        },
        scale: true,
        axisLabel: { fontSize: compactMode ? 8 : 10, fontWeight: 500, fontFamily: "Inter", color: "#787776", margin: 4 },
      }}
      showGrid={true}
      showAxes={true}
      showTicks={true}
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
      compactTooltip={compactMode}
    />
  );
};

