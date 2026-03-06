"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { IdentificationFeatureInfoRow } from "@/services/subgroup-service";

interface RefineCutoffChartEditorProps {
  cumulativeProportion: number;
  additionalSliders: number[];
  onCumulativeProportionChange: (value: number) => void;
  onAdditionalSlidersChange: (values: number[]) => void;
  maxAdditionalSliders?: number;
  rows?: IdentificationFeatureInfoRow[];
  outcomeKey?: string;
  selectedMonth?: number;
}

type CdfPoint = [x: number, y: number];

const GRID_LEFT = 18;
const GRID_RIGHT = 4;
const GRID_TOP = 2;
const GRID_BOTTOM = 20;
const CHART_HEIGHT = 400;
const PLOT_HEIGHT = CHART_HEIGHT - GRID_TOP - GRID_BOTTOM;
const EPSILON = 1e-6;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const parseNumericValue = (value: string | number | null | undefined): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const findInterpolatedXForProportion = (cdfData: CdfPoint[], proportion: number): number => {
  if (cdfData.length === 0) {
    return 0;
  }

  const targetProportion = clamp(proportion, 0, 100);
  const firstPoint = cdfData[0];
  const lastPoint = cdfData[cdfData.length - 1];

  if (targetProportion <= firstPoint[1]) {
    return firstPoint[0];
  }
  if (targetProportion >= lastPoint[1]) {
    return lastPoint[0];
  }

  for (let i = 0; i < cdfData.length - 1; i++) {
    const [x1, y1] = cdfData[i];
    const [x2, y2] = cdfData[i + 1];
    const lowerY = Math.min(y1, y2);
    const upperY = Math.max(y1, y2);

    if (targetProportion < lowerY || targetProportion > upperY) {
      continue;
    }

    const deltaY = y2 - y1;
    if (Math.abs(deltaY) < EPSILON) {
      return x1;
    }

    const t = (targetProportion - y1) / deltaY;
    return x1 + t * (x2 - x1);
  }

  return lastPoint[0];
};

const findInterpolatedYForSafetyScore = (cdfData: CdfPoint[], safetyScore: number): number => {
  if (cdfData.length === 0) {
    return 0;
  }

  const firstPoint = cdfData[0];
  const lastPoint = cdfData[cdfData.length - 1];
  const targetSafetyScore = clamp(safetyScore, firstPoint[0], lastPoint[0]);

  if (targetSafetyScore <= firstPoint[0]) {
    return firstPoint[1];
  }
  if (targetSafetyScore >= lastPoint[0]) {
    return lastPoint[1];
  }

  for (let i = 0; i < cdfData.length - 1; i++) {
    const [x1, y1] = cdfData[i];
    const [x2, y2] = cdfData[i + 1];
    const lowerX = Math.min(x1, x2);
    const upperX = Math.max(x1, x2);

    if (targetSafetyScore < lowerX || targetSafetyScore > upperX) {
      continue;
    }

    const deltaX = x2 - x1;
    if (Math.abs(deltaX) < EPSILON) {
      if (Math.abs(targetSafetyScore - x1) < EPSILON) {
        return y2;
      }
      continue;
    }

    const t = (targetSafetyScore - x1) / deltaX;
    return y1 + t * (y2 - y1);
  }

  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < cdfData.length; i++) {
    const diff = Math.abs(cdfData[i][0] - targetSafetyScore);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return cdfData[closestIndex][1];
};

const dedupeAdjacentCdfPoints = (points: CdfPoint[]): CdfPoint[] => {
  if (points.length === 0) {
    return points;
  }

  const deduped: CdfPoint[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    const [prevX, prevY] = deduped[deduped.length - 1];
    const sameX = Math.abs(x - prevX) < EPSILON;
    const sameY = Math.abs(y - prevY) < EPSILON;

    if (!sameX || !sameY) {
      deduped.push([x, y]);
    }
  }

  return deduped;
};

const buildCdfSegmentData = (cdfData: CdfPoint[], startX: number, endX: number): CdfPoint[] => {
  if (cdfData.length === 0) {
    return [];
  }

  const minDataX = cdfData[0][0];
  const maxDataX = cdfData[cdfData.length - 1][0];
  const clampedStart = clamp(startX, minDataX, maxDataX);
  const clampedEnd = clamp(endX, minDataX, maxDataX);

  if (clampedStart > clampedEnd) {
    return [];
  }

  const startPoint: CdfPoint = [clampedStart, findInterpolatedYForSafetyScore(cdfData, clampedStart)];
  const endPoint: CdfPoint = [clampedEnd, findInterpolatedYForSafetyScore(cdfData, clampedEnd)];
  const innerPoints = cdfData.filter((point) => point[0] > clampedStart && point[0] < clampedEnd);

  return dedupeAdjacentCdfPoints([startPoint, ...innerPoints, endPoint]);
};

const applyNonCrossingConstraint = (
  next: number,
  current: number,
  otherPositions: number[]
): number => {
  const lower = Math.max(...otherPositions.filter((value) => value < current), -Infinity);
  const upper = Math.min(...otherPositions.filter((value) => value > current), Infinity);

  let constrained = next;
  if (lower !== -Infinity && constrained <= lower) {
    constrained = lower + 1;
  }
  if (upper !== Infinity && constrained >= upper) {
    constrained = upper - 1;
  }

  return clamp(Math.round(constrained), 0, 100);
};

export function RefineCutoffChartEditor({
  cumulativeProportion,
  additionalSliders,
  onCumulativeProportionChange,
  onAdditionalSlidersChange,
  maxAdditionalSliders = 1,
  rows,
  outcomeKey,
  selectedMonth,
}: RefineCutoffChartEditorProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const yInputRef = useRef<HTMLInputElement>(null);
  const additionalSliderInputRef = useRef<HTMLInputElement>(null);

  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(400);
  const [wrapperHeight, setWrapperHeight] = useState(400);
  const [safetyScoreCutoff, setSafetyScoreCutoff] = useState(1.3);
  const [showAddButton, setShowAddButton] = useState(false);
  const [addButtonPosition, setAddButtonPosition] = useState<{
    x: number;
    y: number;
    proportion: number;
  } | null>(null);
  const [isEditingY, setIsEditingY] = useState(false);
  const [yInputValue, setYInputValue] = useState("");
  const [editingAdditionalSliderIndex, setEditingAdditionalSliderIndex] = useState<number | null>(
    null
  );
  const [additionalSliderInputValue, setAdditionalSliderInputValue] = useState("");
  const [plotArea, setPlotArea] = useState<{ top: number; bottom: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ECharts 인스턴스에서 실제 플롯 영역의 pixel 좌표를 가져옴
  const updatePlotArea = () => {
    const instance = echartsRef.current?.getEchartsInstance?.();
    if (!instance) return;
    try {
      const topPx = instance.convertToPixel({ gridIndex: 0 }, [0, 100]);
      const bottomPx = instance.convertToPixel({ gridIndex: 0 }, [0, 0]);
      if (topPx && bottomPx) {
        setPlotArea({ top: topPx[1], bottom: bottomPx[1] });
      }
    } catch {
      // 차트가 아직 준비 안 된 경우 무시
    }
  };

  // proportion(0~100) → chartContainerRef 내부 pixel top 좌표
  const proportionToPixelY = (proportion: number): number => {
    if (plotArea) {
      const range = plotArea.bottom - plotArea.top;
      return plotArea.top + ((100 - proportion) / 100) * range;
    }
    // fallback
    return GRID_TOP + ((100 - proportion) / 100) * (chartHeight - GRID_TOP - GRID_BOTTOM);
  };

  // chartContainerRef 내부 pixel Y → proportion(0~100)
  const pixelYToProportion = (pixelY: number): number => {
    if (plotArea) {
      const range = plotArea.bottom - plotArea.top;
      return 100 - ((pixelY - plotArea.top) / range) * 100;
    }
    return 100 - ((pixelY - GRID_TOP) / (chartHeight - GRID_TOP - GRID_BOTTOM)) * 100;
  };

  const { cdfData, chartFeatureKey } = useMemo(() => {
    const sourceRows = rows ?? [];
    const monthFilteredRows =
      typeof selectedMonth === "number"
        ? sourceRows.filter((row) => row.month === selectedMonth)
        : sourceRows;
    const rowsForCdf = monthFilteredRows.length > 0 ? monthFilteredRows : sourceRows;

    if (rowsForCdf.length === 0) {
      return {
        cdfData: [],
        chartFeatureKey: outcomeKey || "Safety Score",
      };
    }

    const firstRow = rowsForCdf[0] ?? {};
    const allKeys = Object.keys(firstRow);
    const deltaFeatureKey = allKeys.find((key) => key.toLowerCase().includes("delta_"));
    const defaultFeatureKey = allKeys.find((key) => key !== "rid" && key !== "month");
    const effectiveFeatureKey =
      deltaFeatureKey || (outcomeKey && outcomeKey in firstRow ? outcomeKey : defaultFeatureKey);

    if (!effectiveFeatureKey) {
      return {
        cdfData: [],
        chartFeatureKey: outcomeKey || "Safety Score",
      };
    }

    const sortedValues = rowsForCdf
      .map((row) => parseNumericValue(row[effectiveFeatureKey]))
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    if (sortedValues.length === 0) {
      return {
        cdfData: [],
        chartFeatureKey: effectiveFeatureKey,
      };
    }

    return {
      cdfData: sortedValues.map(
        (x, index): CdfPoint => [x, ((index + 1) / sortedValues.length) * 100]
      ),
      chartFeatureKey: effectiveFeatureKey,
    };
  }, [outcomeKey, rows, selectedMonth]);

  const xAxisBounds = useMemo(() => {
    const xValues = cdfData.map((point) => point[0]);
    let min = Math.min(...xValues);
    let max = Math.max(...xValues);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: -5, max: 5 };
    }

    if (min === max) {
      min -= 1;
      max += 1;
    } else {
      const padding = (max - min) * 0.05;
      min -= padding;
      max += padding;
    }

    return { min, max };
  }, [cdfData]);

  const sortedSliders = useMemo(() => {
    const limitedAdditional = additionalSliders.slice(0, maxAdditionalSliders);
    return [cumulativeProportion, ...limitedAdditional].sort((a, b) => a - b);
  }, [additionalSliders, cumulativeProportion, maxAdditionalSliders]);

  const cutoffScores = useMemo(
    () => sortedSliders.map((proportion) => findInterpolatedXForProportion(cdfData, proportion)),
    [cdfData, sortedSliders]
  );

  useEffect(() => {
    if (additionalSliders.length > maxAdditionalSliders) {
      onAdditionalSlidersChange(additionalSliders.slice(0, maxAdditionalSliders));
    }
  }, [additionalSliders, maxAdditionalSliders, onAdditionalSlidersChange]);

  useEffect(() => {
    setSafetyScoreCutoff(findInterpolatedXForProportion(cdfData, cumulativeProportion));
  }, [cdfData, cumulativeProportion]);

  // chartOption 변경 후 ECharts 렌더 완료 시 plotArea 갱신
  useEffect(() => {
    const timer = setTimeout(updatePlotArea, 50);
    return () => clearTimeout(timer);
  }, [chartHeight, chartWidth]);

  useEffect(() => {
    const updateChartSize = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
        setChartHeight(chartContainerRef.current.offsetHeight);
      }
      updatePlotArea();
    };

    updateChartSize();
    const ro = new ResizeObserver(updateChartSize);
    if (chartContainerRef.current) ro.observe(chartContainerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setWrapperHeight(h);
    });
    ro.observe(el);
    setWrapperHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAddButton &&
        chartContainerRef.current &&
        !chartContainerRef.current.contains(event.target as Node)
      ) {
        setShowAddButton(false);
        setAddButtonPosition(null);
      }
    };

    if (showAddButton) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddButton]);

  const segmentColors = [
    { line: "#f06600", area: "rgba(240, 102, 0, 0.3)" },
    { line: "#919092", area: "rgba(145, 144, 146, 0.28)" },
    { line: "#3A11D8", area: "rgba(58, 17, 216, 0.3)" },
  ];

  const chartOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      animation: false,
      textStyle: { color: "#787776", fontFamily: "Inter" },
      grid: {
        left: `${GRID_LEFT}px`,
        right: `${GRID_RIGHT}px`,
        top: `${GRID_TOP}px`,
        bottom: `${GRID_BOTTOM}px`,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: chartFeatureKey || outcomeKey || "Safety Score",
        nameLocation: "middle",
        nameGap: 24,
        min: xAxisBounds.min,
        max: xAxisBounds.max,
        splitNumber: 6,
        splitLine: { show: false },
        axisLine: { show: true, lineStyle: { color: "#787776" } },
        axisTick: { show: false },
        minorTick: { show: false },
        axisLabel: {
          color: "#787776",
          fontSize: 10.5,
          fontWeight: 600,
          showMinLabel: true,
          showMaxLabel: true,
          fontFamily: "Inter",
          margin: 6,
          // edge 라벨 overflow 방지: rich 박스 중심을 tick에 맞추고
          // min → 오른쪽 정렬(텍스트가 tick 우측), max → 왼쪽 정렬(텍스트가 tick 좌측)
          rich: {
            lEdge: { width: 35, align: "right", fontSize: 10.5, fontWeight: 600, fontFamily: "Inter", color: "#787776" },
            rEdge: { width: 35, align: "left",  fontSize: 10.5, fontWeight: 600, fontFamily: "Inter", color: "#787776" },
          },
          formatter: (value: number) => {
            if (Math.abs(value - xAxisBounds.min) < EPSILON) return `{lEdge|${value.toFixed(0)}}`;
            if (Math.abs(value - xAxisBounds.max) < EPSILON) return `{rEdge|${value.toFixed(0)}}`;
            return value.toFixed(0);
          },
        },
        nameTextStyle: {
          color: "#787776",
          fontSize: 10.5,
          fontWeight: 600,
          fontFamily: "Inter",
        },
      },
      yAxis: {
        type: "value",
        name: "cumulative proportion",
        nameLocation: "middle",
        nameGap: 32,
        nameRotate: 90,
        min: 0,
        max: 100,
        interval: 10,
        splitLine: { show: false },
        axisTick: { show: true, lineStyle: { color: "#787776" } },
        axisLine: {
          show: true,
          onZero: false,
          lineStyle: { color: "#787776" },
          symbol: ["none", "arrow"],
          symbolSize: [0, 8],
        },
        axisLabel: {
          color: "#787776",
          fontSize: 10.5,
          fontWeight: 600,
          fontFamily: "Inter",
          // edge 라벨 overflow 방지: \n으로 텍스트를 축 내부 방향으로 이동
          formatter: (value: number) => {
            if (value === 0) return `0\n`;
            if (value === 100) return `\n100`;
            return value.toFixed(0);
          },
        },
        nameTextStyle: {
          color: "#787776",
          fontSize: 10.5,
          fontWeight: 600,
          fontFamily: "Inter",
        },
      },
      series: (() => {
        const series: any[] = [];
        const minDataX = cdfData[0]?.[0] ?? xAxisBounds.min;
        const maxDataX = cdfData[cdfData.length - 1]?.[0] ?? xAxisBounds.max;

        if (sortedSliders.length === 1) {
          const cutoffScore = cutoffScores[0] ?? minDataX;
          series.push(
            {
              name: "CDF Orange",
              type: "line",
              data: buildCdfSegmentData(cdfData, minDataX, cutoffScore),
              smooth: true,
              lineStyle: { width: 2, color: segmentColors[0].line },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[0].area },
                    { offset: 1, color: "rgba(240, 102, 0, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "CDF Blue",
              type: "line",
              data: buildCdfSegmentData(cdfData, cutoffScore, maxDataX),
              smooth: true,
              lineStyle: { width: 2, color: segmentColors[2].line },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[2].area },
                    { offset: 1, color: "rgba(58, 17, 216, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "Cutoff Point",
              type: "scatter",
              data: [[cutoffScore, sortedSliders[0]]],
              symbolSize: 10,
              itemStyle: { color: segmentColors[2].line },
              z: 10,
            }
          );
        } else if (sortedSliders.length >= 2) {
          const score1 = cutoffScores[0] ?? minDataX;
          const score2 = cutoffScores[1] ?? maxDataX;

          series.push(
            {
              name: "CDF Segment 1",
              type: "line",
              data: buildCdfSegmentData(cdfData, minDataX, score1),
              smooth: true,
              lineStyle: { width: 2, color: segmentColors[0].line },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[0].area },
                    { offset: 1, color: "rgba(240, 102, 0, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "CDF Segment 2",
              type: "line",
              data: buildCdfSegmentData(cdfData, score1, score2),
              smooth: true,
              lineStyle: { width: 2, color: segmentColors[1].line },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[1].area },
                    { offset: 1, color: "rgba(145, 144, 146, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "CDF Segment 3",
              type: "line",
              data: buildCdfSegmentData(cdfData, score2, maxDataX),
              smooth: true,
              lineStyle: { width: 2, color: segmentColors[2].line },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[2].area },
                    { offset: 1, color: "rgba(58, 17, 216, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "Cutoff Points",
              type: "scatter",
              data: sortedSliders.map((prop, index) => [cutoffScores[index] ?? minDataX, prop]),
              symbolSize: 10,
              itemStyle: { color: segmentColors[2].line },
              z: 10,
            }
          );
        }

        series.push({
          name: "X Axis Line",
          type: "line",
          data: [
            [xAxisBounds.min, 0],
            [xAxisBounds.max, 0],
          ],
          lineStyle: { color: "#787776", width: 1 },
          symbol: ["none", "arrow"],
          symbolSize: [0, 8],
          z: 5,
        });

        const guideColor = isDragging ? "#8f8ac4" : "#787776";
        const guideWidth = isDragging ? 2 : 1;

        sortedSliders.forEach((proportion, index) => {
          const score = cutoffScores[index] ?? xAxisBounds.min;
          series.push(
            {
              name: `Vertical Line ${index}`,
              type: "line",
              data: [
                [score, 0],
                [score, 100],
              ],
              lineStyle: { type: [5, 5], color: guideColor, width: guideWidth },
              symbol: "none",
              z: 8,
            },
            {
              name: `Horizontal Line ${index}`,
              type: "line",
              data: [
                [xAxisBounds.min, proportion],
                [xAxisBounds.max, proportion],
              ],
              lineStyle: { type: [5, 5], color: guideColor, width: guideWidth },
              symbol: "none",
              z: 8,
            }
          );
        });

        return series;
      })(),
      tooltip: { trigger: "none" },
    }),
    [cdfData, chartFeatureKey, cutoffScores, isDragging, outcomeKey, sortedSliders, xAxisBounds.max, xAxisBounds.min]
  );

  const addSliderIfValid = (proportion: number) => {
    if (additionalSliders.length >= maxAdditionalSliders) {
      return;
    }

    const isOverlapping = [cumulativeProportion, ...additionalSliders].some(
      (value) => Math.abs(value - proportion) < 5
    );

    if (!isOverlapping) {
      onAdditionalSlidersChange([...additionalSliders, proportion]);
    }

    setShowAddButton(false);
    setAddButtonPosition(null);
  };

  return (
    <div
      ref={wrapperRef}
      className="w-full rounded-[24px] p-[8px]"
      style={{ backgroundColor: "#ffffff", aspectRatio: "1 / 1" }}
    >
      <div
        className="flex h-full flex-col"
      >
        <div
          ref={chartContainerRef}
          className="relative min-h-0 flex-1 overflow-visible"
          onMouseMove={(event) => {
            if (additionalSliders.length >= maxAdditionalSliders) {
              setShowAddButton(false);
              setAddButtonPosition(null);
              return;
            }

            if (cdfData.length === 0) {
              setShowAddButton(false);
              setAddButtonPosition(null);
              return;
            }

            const rect = chartContainerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const gridWidth = rect.width - GRID_LEFT - GRID_RIGHT;
            const gridHeight = rect.height - GRID_TOP - GRID_BOTTOM;

            if (
              mouseY < GRID_TOP ||
              mouseY > GRID_TOP + gridHeight ||
              mouseX < GRID_LEFT ||
              mouseX > GRID_LEFT + gridWidth
            ) {
              setShowAddButton(false);
              setAddButtonPosition(null);
              return;
            }

            const relativeX = mouseX - GRID_LEFT;
            const xRange = xAxisBounds.max - xAxisBounds.min;
            const safetyScore =
              xAxisBounds.min + (relativeX / gridWidth) * (xRange === 0 ? 1 : xRange);
            const curveY = findInterpolatedYForSafetyScore(cdfData, safetyScore);
            const clickProportion = 100 - ((mouseY - GRID_TOP) / gridHeight) * 100;

            if (Math.abs(clickProportion - curveY) > 5) {
              setShowAddButton(false);
              setAddButtonPosition(null);
              return;
            }

            const clampedProportion = clamp(Math.round(clickProportion), 0, 100);
            const isOverlapping = [cumulativeProportion, ...additionalSliders].some(
              (value) => Math.abs(value - clampedProportion) < 5
            );

            if (isOverlapping) {
              setShowAddButton(false);
              setAddButtonPosition(null);
              return;
            }

            setAddButtonPosition({ x: mouseX, y: mouseY, proportion: clampedProportion });
            setShowAddButton(true);
          }}
          onMouseLeave={() => {
            setShowAddButton(false);
            setAddButtonPosition(null);
          }}
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest(".slider-handle") || target.closest(".add-button")) {
              return;
            }

            if (showAddButton && addButtonPosition) {
              addSliderIfValid(addButtonPosition.proportion);
            }
          }}
        >
          <ReactECharts
            ref={echartsRef}
            option={chartOption}
            style={{ width: "100%", height: "100%" }}
            opts={{ renderer: "canvas" }}
            onChartReady={updatePlotArea}
            onEvents={{ finished: updatePlotArea }}
          />

          <div ref={sliderRef} className="pointer-events-none absolute inset-0 z-10" style={{ left: 72, width: 28 }}>
              {/* Primary slider handle */}
              <div
                className="slider-handle pointer-events-auto absolute z-100 flex h-7 w-7 cursor-grab items-center justify-center rounded-full border border-[#e2e1e5] bg-[#fcf8f8] shadow-[0px_0.5px_4px_0px_rgba(0,0,0,0.12),0px_6px_13px_0px_rgba(0,0,0,0.12)] transition-colors duration-150 hover:bg-[#f9f8fc] active:cursor-grabbing active:bg-[#efeff4]"
                style={{
                  top: `${proportionToPixelY(cumulativeProportion)}px`,
                  left: 0,
                  transform: "translateY(-50%)",
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(true);
                  const container = chartContainerRef.current;
                  if (!container) return;

                  const preventSelect = (e: Event) => { e.preventDefault(); return false; };

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    moveEvent.preventDefault();
                    const rect = container.getBoundingClientRect();
                    const mouseY = moveEvent.clientY - rect.top;
                    const next = clamp(Math.round(pixelYToProportion(mouseY)), 0, 100);
                    const constrained = applyNonCrossingConstraint(next, cumulativeProportion, additionalSliders);
                    onCumulativeProportionChange(constrained);
                  };

                  const handleMouseUp = () => {
                    setIsDragging(false);
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                    document.removeEventListener("selectstart", preventSelect);
                    const bodyStyle = document.body.style as any;
                    bodyStyle.userSelect = "";
                    bodyStyle.webkitUserSelect = "";
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                  document.addEventListener("selectstart", preventSelect);
                  const bodyStyle = document.body.style as any;
                  bodyStyle.userSelect = "none";
                  bodyStyle.webkitUserSelect = "none";
                }}
              >
                <img src="/assets/icons/chevron-select.svg" width={12} height={12} alt="" style={{ flexShrink: 0 }} />
              </div>
              {/* Additional slider handles */}
              {additionalSliders.slice(0, maxAdditionalSliders).map((proportion, index) => (
                <div
                  key={`additional-slider-${proportion}-${index}`}
                  className="slider-handle pointer-events-auto absolute z-100 flex h-7 w-7 cursor-grab items-center justify-center rounded-full border border-[#e2e1e5] bg-[#fcf8f8] shadow-[0px_0.5px_4px_0px_rgba(0,0,0,0.12),0px_6px_13px_0px_rgba(0,0,0,0.12)] transition-colors duration-150 hover:bg-[#f9f8fc] active:cursor-grabbing active:bg-[#efeff4]"
                  style={{
                    top: `${proportionToPixelY(proportion)}px`,
                    left: 0,
                    transform: "translateY(-50%)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                    const container = chartContainerRef.current;
                    if (!container) return;
                    const currentIndex = index;

                    const preventSelect = (eventSelect: Event) => { eventSelect.preventDefault(); return false; };

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      moveEvent.preventDefault();
                      const rect = container.getBoundingClientRect();
                      const mouseY = moveEvent.clientY - rect.top;
                      const next = clamp(Math.round(pixelYToProportion(mouseY)), 0, 100);
                      const current = additionalSliders[currentIndex];
                      const otherPositions = [cumulativeProportion, ...additionalSliders.filter((_, i) => i !== currentIndex)];
                      const constrained = applyNonCrossingConstraint(next, current, otherPositions);
                      const updated = [...additionalSliders];
                      updated[currentIndex] = constrained;
                      onAdditionalSlidersChange(updated);
                    };

                    const handleMouseUp = () => {
                      setIsDragging(false);
                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                      document.removeEventListener("selectstart", preventSelect);
                      const bodyStyle = document.body.style as any;
                      bodyStyle.userSelect = "";
                      bodyStyle.webkitUserSelect = "";
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                    document.addEventListener("selectstart", preventSelect);
                    const bodyStyle = document.body.style as any;
                    bodyStyle.userSelect = "none";
                    bodyStyle.webkitUserSelect = "none";
                  }}
                >
                  <img src="/assets/icons/chevron-select.svg" width={12} height={12} alt="" style={{ flexShrink: 0 }} />
                </div>
              ))}
          </div>

          {(() => {
            const hLineY = proportionToPixelY(cumulativeProportion);
            const hLineRight = GRID_RIGHT + 4;

            if (isEditingY) {
              return (
                <div
                  className="absolute z-10"
                  style={{
                    right: `${hLineRight}px`,
                    top: `${hLineY - 25}px`,
                  }}
                >
                  <input
                    ref={yInputRef}
                    type="number"
                    min="0"
                    max="100"
                    value={yInputValue}
                    onChange={(event) => setYInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setIsEditingY(false);
                        setYInputValue("");
                        return;
                      }
                      if (event.key !== "Enter") {
                        return;
                      }

                      const value = parseInt(yInputValue, 10);
                      if (!Number.isNaN(value) && value >= 0 && value <= 100) {
                        onCumulativeProportionChange(value);
                        setIsEditingY(false);
                      }
                    }}
                    onBlur={() => {
                      const value = parseInt(yInputValue, 10);
                      if (!Number.isNaN(value) && value >= 0 && value <= 100) {
                        onCumulativeProportionChange(value);
                      }
                      setIsEditingY(false);
                      setYInputValue("");
                    }}
                    className="text-body5m rounded border border-gray-300 bg-white px-1 py-0 text-center text-[#929090]"
                    style={{ width: "40px", height: "21px" }}
                    autoFocus
                  />
                </div>
              );
            }

            return (
              <div
                className="absolute z-10 cursor-pointer select-none transition-all duration-150 hover:opacity-70"
                style={{
                  right: `${hLineRight}px`,
                  top: `${hLineY - 12}px`,
                  transform: "translateY(-100%)",
                  color: isDragging ? "#262255" : "#929090",
                  fontWeight: isDragging ? 600 : 500,
                  fontSize: 11,
                  fontFamily: "Inter",
                }}
                onClick={() => {
                  setIsEditingY(true);
                  setYInputValue(cumulativeProportion.toString());
                  setTimeout(() => yInputRef.current?.focus(), 0);
                }}
              >
                Y={cumulativeProportion}%
              </div>
            );
          })()}

          {(() => {
            const gridWidth = chartWidth > 0 ? chartWidth - (GRID_LEFT + GRID_RIGHT) : 400;
            const chartContainerWidth = chartWidth > 0 ? chartWidth : 400;
            const xRange = xAxisBounds.max - xAxisBounds.min;
            const normalizedX =
              xRange === 0 ? 0.5 : clamp((safetyScoreCutoff - xAxisBounds.min) / xRange, 0, 1);
            const pointX = GRID_LEFT + normalizedX * gridWidth;
            const pointY = proportionToPixelY(cumulativeProportion);
            const labelWidth = 60;
            const labelX = pointX + 28;
            const willOverflow = labelX + labelWidth > chartContainerWidth - GRID_RIGHT;

            return (
              <div
                className="absolute z-10 select-none transition-all duration-150"
                style={{
                  ...(willOverflow
                    ? { right: `${chartContainerWidth - pointX + 28}px` }
                    : { left: `${pointX + 28}px` }),
                  top: `${pointY + 4}px`,
                  color: isDragging ? "#262255" : "#929090",
                  fontWeight: isDragging ? 600 : 500,
                  fontSize: 11,
                  fontFamily: "Inter",
                }}
              >
                X={safetyScoreCutoff.toFixed(2)}
              </div>
            );
          })()}

          {showAddButton && addButtonPosition && (
            <div
              className="add-button absolute z-20 cursor-pointer"
              style={{
                left: `${addButtonPosition.x}px`,
                top: `${addButtonPosition.y}px`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={(event) => {
                event.stopPropagation();
                addSliderIfValid(addButtonPosition.proportion);
              }}
            >
              <div className="add-button flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50">
                <span className="text-sm text-gray-700">+</span>
              </div>
            </div>
          )}

          {additionalSliders.slice(0, maxAdditionalSliders).map((proportion, index) => {
            const additionalSliderSafetyScore = findInterpolatedXForProportion(cdfData, proportion);
            const gridWidth = chartWidth > 0 ? chartWidth - (GRID_LEFT + GRID_RIGHT) : 400;
            const chartContainerWidth = chartWidth > 0 ? chartWidth : 400;
            const xRange = xAxisBounds.max - xAxisBounds.min;
            const normalizedX =
              xRange === 0
                ? 0.5
                : clamp((additionalSliderSafetyScore - xAxisBounds.min) / xRange, 0, 1);
            const pointX = GRID_LEFT + normalizedX * gridWidth;
            const pointY = proportionToPixelY(proportion);
            const labelWidth = 60;
            const labelX = pointX + 28;
            const willOverflow = labelX + labelWidth > chartContainerWidth - GRID_RIGHT;

            const addHLineY = proportionToPixelY(proportion);
            const addHLineRight = GRID_RIGHT + 4;

            return (
              <div key={`additional-slider-labels-${proportion}-${index}`}>
                {editingAdditionalSliderIndex === index ? (
                  <div
                    className="absolute z-10"
                    style={{
                      right: `${addHLineRight}px`,
                      top: `${addHLineY - 25}px`,
                    }}
                  >
                    <input
                      ref={additionalSliderInputRef}
                      type="number"
                      min="0"
                      max="100"
                      value={additionalSliderInputValue}
                      onChange={(event) => setAdditionalSliderInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setEditingAdditionalSliderIndex(null);
                          setAdditionalSliderInputValue("");
                          return;
                        }
                        if (event.key !== "Enter") {
                          return;
                        }

                        const value = parseInt(additionalSliderInputValue, 10);
                        if (Number.isNaN(value) || value < 0 || value > 100) {
                          return;
                        }

                        const others = [
                          cumulativeProportion,
                          ...additionalSliders.filter((_, i) => i !== index),
                        ];
                        const isOverlapping = others.some((item) => Math.abs(item - value) < 5);
                        if (!isOverlapping) {
                          const updated = [...additionalSliders];
                          updated[index] = value;
                          onAdditionalSlidersChange(updated);
                          setEditingAdditionalSliderIndex(null);
                        }
                      }}
                      onBlur={() => {
                        const value = parseInt(additionalSliderInputValue, 10);
                        if (!Number.isNaN(value) && value >= 0 && value <= 100) {
                          const others = [
                            cumulativeProportion,
                            ...additionalSliders.filter((_, i) => i !== index),
                          ];
                          const isOverlapping = others.some((item) => Math.abs(item - value) < 5);
                          if (!isOverlapping) {
                            const updated = [...additionalSliders];
                            updated[index] = value;
                            onAdditionalSlidersChange(updated);
                          }
                        }
                        setEditingAdditionalSliderIndex(null);
                        setAdditionalSliderInputValue("");
                      }}
                      className="text-body5m rounded border border-gray-300 bg-white px-1 py-0 text-center text-[#929090]"
                      style={{ width: "40px", height: "21px" }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    className="absolute z-10 cursor-pointer select-none transition-all duration-150 hover:opacity-70"
                    style={{
                      right: `${addHLineRight}px`,
                      top: `${addHLineY - 12}px`,
                      transform: "translateY(-100%)",
                      color: isDragging ? "#262255" : "#929090",
                      fontWeight: isDragging ? 600 : 500,
                      fontSize: 11,
                      fontFamily: "Inter",
                    }}
                    onClick={() => {
                      setEditingAdditionalSliderIndex(index);
                      setAdditionalSliderInputValue(proportion.toString());
                      setTimeout(() => additionalSliderInputRef.current?.focus(), 0);
                    }}
                  >
                    Y={proportion}%
                  </div>
                )}
                <div
                  className="absolute z-10 select-none transition-all duration-150"
                  style={{
                    ...(willOverflow
                      ? { right: `${chartContainerWidth - pointX + 28}px` }
                      : { left: `${pointX + 28}px` }),
                    top: `${pointY + 4}px`,
                    color: isDragging ? "#262255" : "#929090",
                    fontWeight: isDragging ? 600 : 500,
                    fontSize: 11,
                    fontFamily: "Inter",
                  }}
                >
                  X={additionalSliderSafetyScore.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
