"use client";

import {
  MultiLineWithErrorBar,
  type ErrorBarGroup,
} from "@/components/charts/MultiLineWithErrorBar";
import { buildProgressionYAxis } from "./buildProgressionYAxis";
import type { TSISubgroupLegendRow } from "./types";

type Props = {
  chartData: ErrorBarGroup[];
  rows: TSISubgroupLegendRow[];
  seriesLabels: string[];
  seriesColors: string[];
};

export function TSIModelDiseaseProgressionPanel({
  chartData,
  rows,
  seriesLabels,
  seriesColors,
}: Props) {
  const yAxisRange = buildProgressionYAxis(chartData);

  return (
    <div className="flex min-h-[656px] w-full flex-1 flex-shrink-0 flex-col rounded-[16px] border-[3px] border-[#8A47FF] bg-[#ECECF1] p-4">
      <h4 className="text-h3 text-neutral-20 flex-shrink-0">Disease Progression by Subgroup</h4>
      <div className="mt-3 h-px flex-shrink-0 bg-[#B7B6BE]" />

      <div className="mt-3 min-h-[390px] flex-1">
        <MultiLineWithErrorBar
          dataGroup={chartData}
          seriesLabels={seriesLabels}
          colors={seriesColors}
          height="100%"
          xAxis={{
            min: 0,
            max: 24,
            interval: 3,
            splitLine: true,
            splitLineColor: "#CECDD6",
            axisLineColor: "#CECDD6",
            labelColor: "#4A4949",
            fontSize: 11,
            name: "Month",
            nameColor: "#1B1B1B",
            nameFontSize: 16,
            nameGap: 30,
          }}
          yAxis={{
            min: yAxisRange.min,
            max: yAxisRange.max,
            interval: yAxisRange.interval,
            inverse: true,
            splitLine: true,
            splitLineColor: "#CECDD6",
            axisLineColor: "#CECDD6",
            showLabels: true,
            labelColor: "#4A4949",
            fontSize: 11,
            name: "ADAS-Cog",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
          }}
          guideLineX={12}
          guideLineColor="#272354"
          guideLineWidth={2}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-6">
        {seriesLabels.map((label, index) => {
          const color = seriesColors[index] ?? seriesColors[seriesColors.length - 1] ?? "#272354";
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative h-[2px] w-[84px]" style={{ backgroundColor: color }}>
                <span
                  className="absolute top-1/2 left-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="text-neutral-10 text-[10.5px] font-medium">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-[#B7B6BE]">
        {rows.map((row, index) => (
          <div
            key={row.subgroupName}
            className={`grid h-[44px] grid-cols-[160px_1fr_220px] items-center ${
              index > 0 ? "border-t border-[#D1D0D8]" : ""
            }`}
          >
            <span className="text-body3m text-neutral-50">{row.subgroupName}</span>
            <span className="text-h4 text-neutral-20">{row.riskLabel}</span>
            <div className="flex items-center justify-end gap-2">
              <span className="text-body3m text-neutral-50">Cutoff</span>
              <span className="text-h4 text-neutral-20">{row.cutoff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
