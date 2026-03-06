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
    chartMinHeightClassName: "",
    axisColor: "#CECDD6",
    lineWidth: 3,
    symbolSize: 12,
    errorBarLineWidth: 2,
    errorBarCapHalfWidth: 6,
    guideLineColor: "#272354",
    guideLineType: "solid",
    legendMarginTopClassName: "mt-3",
    legendLineWidthClassName: "w-[84px]",
    legendFallbackColor: "#272354",
    tableMarginTopClassName: "mt-3",
  },
  feature: {
    containerClassName:
      "flex w-full flex-shrink-0 flex-col rounded-[16px] bg-[#FFFFFF] p-4",
    separatorColor: "#A9A8B2",
    chartMinHeightClassName: "",
    axisColor: "#CBCAD3",
    lineWidth: 3,
    symbolSize: 12,
    errorBarLineWidth: 2,
    errorBarCapHalfWidth: 6,
    guideLineColor: "#452CF4",
    guideLineType: "dashed",
    legendMarginTopClassName: "mt-3",
    legendLineWidthClassName: "w-[86px]",
    legendFallbackColor: "#4327E6",
    tableMarginTopClassName: "mt-3",
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
        className="text-body3 text-neutral-30 flex-shrink-0 pb-2 border-b border-neutral-80"
      >
        Disease Progression by Subgroup
      </h4>

      <div className="mt-3 flex-shrink-0 w-full" style={{ aspectRatio: "5 / 3" }}>
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
          grid={{ left: 0, right: 6, top: 4, bottom: 0, containLabel: true }}
          xAxis={{
            min: 0,
            max: 24,
            interval: 3,
            splitLine: true,
            splitLineColor: "#e3e1e5",
            axisLineColor: "#e3e1e5",
            labelColor: "#484646",
            fontSize: 10,
            fontFamily: "Inter",
            showLabels: true,
          }}
          yAxis={{
            min: yAxisRange.min,
            max: yAxisRange.max,
            interval: yAxisRange.interval,
            inverse: true,
            splitLine: true,
            splitLineColor: "#e3e1e5",
            axisLineColor: "#e3e1e5",
            labelColor: "#484646",
            fontSize: 10,
            fontFamily: "Inter",
            showLabels: true,
            alignEdgeLabels: true,
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
              <span className="text-body5 text-neutral-50">{label}</span>
            </div>
          );
        })}
      </div>

      {rows && rows.length > 0 && (
        <div className={`${style.tableMarginTopClassName} flex-shrink-0`}>
          <div className="h-px w-full" style={{ backgroundColor: style.separatorColor}} />
          <div className="mt-2 flex flex-col">
            {rows.map((row, index) => {
              const color = seriesColors[index] ?? seriesColors[seriesColors.length - 1] ?? style.legendFallbackColor;
              return (
                <div key={row.subgroupName} className={`grid grid-cols-[2fr_4fr_1fr_4fr] items-center gap-2 text-[11px] py-1${index > 0 ? " border-t border-[#CECDD6]" : ""}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-body5m text-neutral-70 font-medium">{row.subgroupName}</span>
                  </div>
                  <span className="text-body4m text-neutral-30">{row.riskLabel}</span>
                  <span className="text-body5m text-neutral-70">cutoff</span>
                  <span className="text-body4m text-neutral-30 truncate">{row.cutoff}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
