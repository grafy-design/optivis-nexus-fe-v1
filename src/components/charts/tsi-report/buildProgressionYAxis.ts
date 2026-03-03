import type { ErrorBarGroup } from "@/components/charts/MultiLineWithErrorBar";

export const buildProgressionYAxis = (chartData: ErrorBarGroup[]) => {
  const defaultRange = { min: -3.5, max: 15.5, interval: 2.5 };
  const points = chartData.flat();
  if (points.length === 0) return defaultRange;

  const minValue = Math.min(...points.map(([, y, error]) => y - error));
  const maxValue = Math.max(...points.map(([, y, error]) => y + error));
  const interval = 2.5;

  return {
    min: Math.floor(Math.min(defaultRange.min, minValue) / interval) * interval,
    max: Math.ceil(Math.max(defaultRange.max, maxValue) / interval) * interval,
    interval,
  };
};
