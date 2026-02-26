export type VarianceStackChartData = {
  within: number;
  explained: number;
  max: number;
  ticks: number[];
  vrLabel: string;
  withinColor: string;
  explainedColor: string;
};

export type VarianceBarsItem = {
  label: string;
  value: number;
  weightLabel: string;
  color: string;
  highlight?: boolean;
};

export type VarianceBarsChartData = {
  max: number;
  ticks: number[];
  threshold: number;
  bars: VarianceBarsItem[];
};

export type RiskMetricKey = "diseaseProgression" | "drugResponse" | "safety";

export type ForestIntervalData = {
  low: number;
  mean: number;
  high: number;
  color: string;
  dotColor?: string;
};

export type RiskResponseRow = {
  groupLabel: string;
  metrics: Record<RiskMetricKey, ForestIntervalData>;
};

export type RiskResponseSet = {
  setName: string;
  rows: RiskResponseRow[];
};

export type TSISubgroupLegendRow = {
  subgroupName: string;
  riskLabel: string;
  cutoff: string;
};
