"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  getNiceInterval,
  HISTOGRAM_PALETTE,
  tooltipAxisShadow,
  tooltipRow,
  tooltipWrap,
  tooltipSubTitle,
  axisLabelBase,
  axisNameBase,
  axisLineBase,
  axisTickVisible,
  splitLineHidden,
  gridCompact,
  animationNone,
  barEmphasisDisabled,
  BAR_RADIUS,
  edgeLabelFormatter,
} from "@/lib/chart-styles";

export type HistogramGroupMap = Record<string, number[]>;

export type HistogramData = {
  bins: number[];
  groups: HistogramGroupMap;
};

type BaselineDistributionHistogramProps = {
  histogramData: HistogramData;
  normalize?: boolean;
  height?: number | string;
};

export const BaselineDistributionHistogram = ({
  histogramData,
  normalize = false,
  height = 120,
}: BaselineDistributionHistogramProps) => {
  const chartRef = useRef<any>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const onEvents = {
    mouseover: useCallback((params: any) => {
      if (params.dataIndex !== undefined && params.componentType === "series") {
        setHoveredIdx(params.dataIndex);
      }
    }, []),
    globalout: useCallback(() => {
      setHoveredIdx(null);
    }, []),
  };

  const { baseOption, groupCount } = useMemo(() => {
    const bins = histogramData?.bins ?? [];
    const groups = histogramData?.groups ?? {};
    const bucketCount = Math.max(0, bins.length - 1);

    const xLabels = Array.from({ length: bucketCount }, (_, i) => {
      const left = Number(bins[i] ?? 0);
      const right = Number(bins[i + 1] ?? left);
      const center = (left + right) / 2;
      return Number(center.toFixed(1));
    });

    const normalizedGroups = Object.entries(groups).map(([name, raw]) => {
      const padded = Array.from({ length: bucketCount }, (_, i) => Number(raw?.[i] ?? 0));
      if (!normalize) {
        return { name, values: padded };
      }

      const total = Math.max(
        padded.reduce((acc, value) => acc + value, 0),
        1
      );
      return {
        name,
        values: padded.map((value) => value / total),
      };
    });

    const maxSeriesValue = Math.max(0, ...normalizedGroups.flatMap((group) => group.values));
    const yAxisMaxRaw = normalize
      ? Math.max(1.5, maxSeriesValue * 1.15)
      : Math.max(5, maxSeriesValue * 1.15);
    const yAxisInterval = getNiceInterval(yAxisMaxRaw);
    const yAxisMax = Math.ceil(yAxisMaxRaw / yAxisInterval) * yAxisInterval;

    return {
      baseOption: {
        ...animationNone,
        grid: gridCompact,
        tooltip: {
          ...tooltipAxisShadow,
          formatter: (params: any) => {
            const items = Array.isArray(params) ? params : [params];
            const title = items[0]?.axisValueLabel ?? "";
            return tooltipWrap(
              (title ? tooltipSubTitle(title) : "") +
              items.map((item: any) => tooltipRow(item.marker ?? "", item.seriesName ?? "", String(item.value ?? 0))).join("")
            );
          },
        },
        xAxis: {
          type: "category" as const,
          data: xLabels,
          axisLine: axisLineBase,
          axisTick: { show: false, alignWithLabel: true },
          axisLabel: {
            ...axisLabelBase,
            interval: 0,
            margin: 4,
            formatter: (value: string) => {
              const num = Number(value);
              if (Number.isNaN(num)) return "";
              return num.toFixed(1);
            },
          },
        },
        yAxis: {
          type: "value" as const,
          min: 0,
          max: yAxisMax,
          interval: yAxisInterval,
          name: "CI Width",
          nameLocation: "middle" as const,
          nameGap: 32,
          nameTextStyle: axisNameBase,
          axisLine: axisLineBase,
          axisTick: axisTickVisible,
          axisLabel: {
            ...axisLabelBase,
            margin: 8,
            formatter: edgeLabelFormatter(
              yAxisMax,
              0,
              normalize ? (v) => v.toFixed(2) : (v) => Math.round(v).toString(),
            ),
          },
          splitLine: splitLineHidden,
        },
        normalizedGroups,
        palette: HISTOGRAM_PALETTE,
        bucketCount,
      },
      groupCount: normalizedGroups.length,
    };
  }, [histogramData, normalize]);

  const { normalizedGroups, palette, bucketCount: bc, ...optionBase } = baseOption;

  const numGroups = normalizedGroups.length;
  const layers = Array.from({ length: numGroups }, () =>
    [] as { value: number; color: string; name: string }[]
  );
  for (let di = 0; di < bc; di++) {
    const items = normalizedGroups.map((group: { name: string; values: number[] }, gi: number) => ({
      value: group.values[di],
      color: palette[gi % palette.length],
      name: group.name,
    }));
    items.sort((a, b) => b.value - a.value);
    items.forEach((item, li) => {
      layers[li][di] = item;
    });
  }

  const option: EChartsOption = {
    ...optionBase,
    series: layers.map((layer, layerIdx) => ({
      name: `layer-${layerIdx}`,
      type: "bar" as const,
      barGap: "-100%",
      barCategoryGap: 2,
      itemStyle: {
        borderRadius: BAR_RADIUS.topSmall,
      },
      ...barEmphasisDisabled,
      data: layer.map((item, di) => {
        const base = { value: item.value, itemStyle: { color: item.color } };
        if (hoveredIdx === null) return base;
        if (di !== hoveredIdx) return { ...base, itemStyle: { ...base.itemStyle, opacity: 0.6 } };
        return base;
      }),
    })),
  };

  return <ReactECharts ref={chartRef} option={option} onEvents={onEvents} style={{ width: "100%", height }} />;
};
