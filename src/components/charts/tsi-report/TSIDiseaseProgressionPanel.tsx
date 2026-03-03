"use client";

import {
  MultiLineWithErrorBar,
  type ErrorBarGroup,
} from "@/components/charts/MultiLineWithErrorBar";
import { buildProgressionYAxis } from "./buildProgressionYAxis";
import type { TSISubgroupLegendRow } from "./types";

export type TSIDiseaseProgressionPanelVariant = "model" | "feature";

export type TSIDiseaseProgressionPanelBaseProps = {
  chartData: ErrorBarGroup[];
  rows: TSISubgroupLegendRow[];
  seriesLabels: string[];
  seriesColors: string[];
};

export type TSIDiseaseProgressionPanelProps = TSIDiseaseProgressionPanelBaseProps & {
  variant: TSIDiseaseProgressionPanelVariant;
};

type VariantStyle = {
  containerClassName: string;
  separatorColor: string;
  chartMinHeightClassName: string;
  axisColor: string;
  lineWidth: number;
  symbolSize: number;
  errorBarLineWidth: number;
  errorBarCapHalfWidth: number;
  guideLineColor: string;
  guideLineType: "solid" | "dashed" | "dotted";
  legendMarginTopClassName: string;
  legendLineWidthClassName: string;
  legendFallbackColor: string;
  tableMarginTopClassName: string;
};

const VARIANT_STYLES: Record<TSIDiseaseProgressionPanelVariant, VariantStyle> = {
  model: {
    containerClassName:
      "flex min-h-[656px] w-full flex-1 flex-shrink-0 flex-col rounded-[16px] bg-[#FFFFFF] p-4",
    separatorColor: "#B7B6BE",
    chartMinHeightClassName: "min-h-[390px]",
    axisColor: "#CECDD6",
    lineWidth: 3,
    symbolSize: 12,
    errorBarLineWidth: 2,
    errorBarCapHalfWidth: 6,
    guideLineColor: "#272354",
    guideLineType: "solid",
    legendMarginTopClassName: "mt-2",
    legendLineWidthClassName: "w-[84px]",
    legendFallbackColor: "#272354",
    tableMarginTopClassName: "mt-3",
  },
  feature: {
    containerClassName:
      "flex min-h-[656px] w-full flex-1 flex-shrink-0 flex-col rounded-[16px] bg-[#FFFFFF] p-4",
    separatorColor: "#A9A8B2",
    chartMinHeightClassName: "min-h-[430px]",
    axisColor: "#CBCAD3",
    lineWidth: 3,
    symbolSize: 12,
    errorBarLineWidth: 2,
    errorBarCapHalfWidth: 6,
    guideLineColor: "#452CF4",
    guideLineType: "dashed",
    legendMarginTopClassName: "mt-1",
    legendLineWidthClassName: "w-[86px]",
    legendFallbackColor: "#4327E6",
    tableMarginTopClassName: "mt-2",
  },
};

export function TSIDiseaseProgressionPanel({
  variant,
  chartData,
  rows,
  seriesLabels,
  seriesColors,
}: TSIDiseaseProgressionPanelProps) {
  const yAxisRange = buildProgressionYAxis(chartData);
  const style = VARIANT_STYLES[variant];

  return (
    <div className={style.containerClassName}>
      <h4 className="text-body2m text-neutral-20 flex-shrink-0">Disease Progression by Subgroup</h4>
      <div className="mt-3 h-px flex-shrink-0" style={{ backgroundColor: style.separatorColor }} />

      <div className={`mt-3 flex-1 ${style.chartMinHeightClassName}`}>
        <MultiLineWithErrorBar
          dataGroup={chartData}
          seriesLabels={seriesLabels}
          colors={seriesColors}
          filledSymbol
          lineWidth={style.lineWidth}
          symbolSize={style.symbolSize}
          errorBarLineWidth={style.errorBarLineWidth}
          errorBarCapHalfWidth={style.errorBarCapHalfWidth}
          height="100%"
          xAxis={{
            min: 0,
            max: 24,
            interval: 3,
            splitLine: true,
            splitLineColor: style.axisColor,
            axisLineColor: style.axisColor,
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
            splitLineColor: style.axisColor,
            axisLineColor: style.axisColor,
            showLabels: true,
            labelColor: "#4A4949",
            fontSize: 11,
            name: "ADAS-Cog",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
          }}
          guideLineX={12}
          guideLineColor={style.guideLineColor}
          guideLineWidth={2}
          guideLineType={style.guideLineType}
        />
      </div>

      <div className={`${style.legendMarginTopClassName} flex flex-wrap items-center gap-6`}>
        {seriesLabels.map((label, index) => {
          const color =
            seriesColors[index] ??
            seriesColors[seriesColors.length - 1] ??
            style.legendFallbackColor;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`relative h-[2px] ${style.legendLineWidthClassName}`}
                style={{ backgroundColor: color }}
              >
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

      <div
        className={`${style.tableMarginTopClassName} border-t`}
        style={{ borderColor: style.separatorColor }}
      >
        {rows.map((row, index) => (
          <div
            key={row.subgroupName}
            className="flex border border-0 border-t"
            style={{
              borderColor: index === 0 ? "#AAAAAD" : "#E2E1E5",
            }}
          >
            <div className="flex h-8 flex-1 items-center">
              <span className="w-[120px] text-xs font-semibold text-[#AAAAAD]">
                {row.subgroupName}
              </span>
              <span className="text-[17px] font-semibold text-[#484646]">{row.riskLabel}</span>
            </div>
            <div className="flex h-8 flex-1 items-center">
              <span className="w-[56px] text-xs font-semibold text-[#AAAAAD]">Cutoff</span>
              <span className="text-[17px] font-semibold text-[#484646]">{row.cutoff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
