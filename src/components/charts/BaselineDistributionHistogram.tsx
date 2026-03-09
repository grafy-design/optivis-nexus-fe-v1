"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

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

  const getNiceInterval = (maxValue: number): number => {
    if (maxValue <= 0) {
      return 1;
    }
    const rough = maxValue / 5;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const scaled = rough / power;

    if (scaled <= 1) return 1 * power;
    if (scaled <= 2) return 2 * power;
    if (scaled <= 5) return 5 * power;
    return 10 * power;
  };

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
    const palette = [
      "rgba(203, 198, 232, 0.9)",
      "rgba(176, 170, 220, 0.9)",
      "rgba(150, 143, 200, 0.9)",
      "rgba(124, 116, 180, 0.9)",
      "rgba(58, 52, 110, 0.95)",
      "rgba(40, 37, 86, 0.95)",
    ];

    return {
      baseOption: {
        animation: false,
        grid: { left: 42, right: 4, top: 8, bottom: 16 },
        tooltip: {
          trigger: "axis" as const,
          axisPointer: { type: "shadow" as const, triggerEmphasis: false, z: -1 },
          padding: [4, 6],
          borderWidth: 0,
          borderColor: "transparent",
          extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
          textStyle: { fontFamily: "Inter", fontSize: 12, fontWeight: 600 },
          formatter: (params: any) => {
            const items = Array.isArray(params) ? params : [params];
            const row = (marker: string, label: string, val: string) =>
              `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-size:9px;font-weight:500">${marker}${label}</span><span style="font-size:13px;font-weight:600">${val}</span></div>`;
            const title = items[0]?.axisValueLabel ?? "";
            return `<div style="font-family:Inter,sans-serif">${title ? `<div style="font-size:9px;font-weight:500;margin-bottom:4px">${title}</div>` : ""}${items.map((item: any) => row(item.marker ?? "", item.seriesName ?? "", String(item.value ?? 0))).join("")}</div>`;
          },
        },
        xAxis: {
          type: "category" as const,
          data: xLabels,
          axisLine: { show: true, lineStyle: { color: "#787776" } },
          axisTick: { show: false, alignWithLabel: true },
          axisLabel: {
            interval: 0,
            margin: 4,
            color: "#787776",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
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
          nameTextStyle: {
            color: "#787776",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
          },
          axisLine: { show: true, lineStyle: { color: "#787776" } },
          axisTick: { show: true, lineStyle: { color: "#787776" } },
          axisLabel: {
            margin: 8,
            color: "#787776",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            formatter: (value: number) => {
              const label = normalize ? value.toFixed(2) : Math.round(value).toString();
              if (value === yAxisMax) return `\n${label}`;
              if (value === 0) return `${label}\n`;
              return label;
            },
          },
          splitLine: { show: false },
        },
        normalizedGroups,
        palette,
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
        borderRadius: [3, 3, 0, 0] as [number, number, number, number],
      },
      emphasis: { disabled: true },
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
