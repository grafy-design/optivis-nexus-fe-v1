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
  seriesLabels: string[];
  seriesColors: string[];
  rows?: TSISubgroupLegendRow[];
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
      "flex w-full flex-shrink-0 flex-col rounded-[16px] bg-[#FFFFFF] p-4",
    separatorColor: "#B7B6BE",
    chartMinHeightClassName: "h-[360px] [@media(max-width:1470px)]:h-[250px]",
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
      "flex w-full flex-shrink-0 flex-col rounded-[16px] bg-[#FFFFFF] p-4",
    separatorColor: "#A9A8B2",
    chartMinHeightClassName: "h-[360px] [@media(max-width:1470px)]:h-[250px]",
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
  seriesLabels,
  seriesColors,
  rows,
}: TSIDiseaseProgressionPanelProps) {
  const yAxisRange = buildProgressionYAxis(chartData);
  const style = VARIANT_STYLES[variant];

  return (
    <div className={style.containerClassName}>
      <h4
        className="text-body2m text-neutral-20 flex-shrink-0 pb-3 border-b"
        style={{ borderColor: style.separatorColor }}
      >
        Disease Progression by Subgroup
      </h4>

      <div className={`mt-3 flex-shrink-0 ${style.chartMinHeightClassName}`}>
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
          sizeVariant="M"
          xAxis={{
            min: 0,
            max: 24,
            interval: 3,
            splitLine: true,
            splitLineColor: style.axisColor,
            axisLineColor: style.axisColor,
            showLabels: true,
            name: "Month",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
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

      {rows && rows.length > 0 && (
        <div className={`${style.tableMarginTopClassName} flex-shrink-0`}>
          <div className="h-px w-full" style={{ backgroundColor: style.separatorColor }} />
          <div className="mt-2 flex flex-col gap-1">
            {rows.map((row, index) => {
              const color = seriesColors[index] ?? seriesColors[seriesColors.length - 1] ?? style.legendFallbackColor;
              return (
                <div key={row.subgroupName} className="grid grid-cols-[140px_80px_1fr] items-center gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-neutral-20 font-medium">{row.subgroupName}</span>
                  </div>
                  <span className="text-neutral-40">{row.riskLabel}</span>
                  <span className="text-neutral-40 truncate">{row.cutoff}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
