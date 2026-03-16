export type TrpSimulationTargetConfig = {
  label: string;
  value: string;
  unit: string;
  months: string;
};

export type TrpSimulationDrugPreset = {
  id: number;
  type: string;
  name: string;
  code: string;
  checks: boolean[];
  pillPositions: Array<{ leftPct: number; widthPct: number } | null>;
};

export type TrpSimulationStrategyPlan = {
  id: "strategy-a" | "strategy-b" | "strategy-c";
  title: string;
  color: string;
  detail: string;
  keepCurrent: boolean;
};

export type TrpSimulationSettingForm = {
  selectedCategory: number;
  selectedDetail: number;
  selectedValue: number;
  targetConfigs: TrpSimulationTargetConfig[];
  followUpMonths: number;
  drugList: TrpSimulationDrugPreset[];
  strategies: TrpSimulationStrategyPlan[];
};

export type TrpSimulationStrategyTone = "violet" | "orange" | "teal";

export const trpSimulationOutcomeOptions = [
  "BMI",
  "SBP",
  "HbA1c",
  "Fasting glucose",
] as const;

export const trpSimulationDrugPresets: readonly TrpSimulationDrugPreset[] = [
  {
    id: 1,
    type: "GLP-1 RA",
    name: "Semaglutide",
    code: "A10AEU4",
    checks: [true, true, true],
    pillPositions: [
      { leftPct: 0, widthPct: 100 },
      { leftPct: 0, widthPct: 100 },
      { leftPct: 0, widthPct: 100 },
    ],
  },
  {
    id: 2,
    type: "SGLT2 inhibitors",
    name: "Empagliflozin",
    code: "A10BK03",
    checks: [true, true, false],
    pillPositions: [{ leftPct: 0, widthPct: 50 }, { leftPct: 0, widthPct: 100 }, null],
  },
  {
    id: 3,
    type: "Biguanide",
    name: "Metformin",
    code: "A10BA02",
    checks: [false, true, true],
    pillPositions: [null, { leftPct: 25, widthPct: 55 }, { leftPct: 62.5, widthPct: 37.5 }],
  },
];

const initialTargetConfigs: readonly TrpSimulationTargetConfig[] = [
  { label: "Increase", value: "", unit: "%", months: "" },
  { label: "Stable", value: "", unit: "%", months: "" },
  { label: "Decrease", value: "", unit: "%", months: "" },
];

const initialDrugList: readonly TrpSimulationDrugPreset[] = [trpSimulationDrugPresets[0]];

const initialStrategies: readonly TrpSimulationStrategyPlan[] = [
  {
    id: "strategy-a",
    title: "Strategy A",
    color: "#3A11D8",
    detail: "Increase : 6 Months",
    keepCurrent: true,
  },
  {
    id: "strategy-b",
    title: "Strategy B",
    color: "#F06600",
    detail: "Stable : 6 Months",
    keepCurrent: true,
  },
  {
    id: "strategy-c",
    title: "Strategy C",
    color: "#24C6C9",
    detail: "Decrease : 3 Months",
    keepCurrent: true,
  },
];

function cloneTargetConfigs(configs: readonly TrpSimulationTargetConfig[]) {
  return configs.map((config) => ({ ...config }));
}

function cloneDrugList(drugList: readonly TrpSimulationDrugPreset[]) {
  return drugList.map((drug) => ({
    ...drug,
    checks: [...drug.checks],
    pillPositions: drug.pillPositions.map((pill) => (pill ? { ...pill } : null)),
  }));
}

function cloneStrategies(strategies: readonly TrpSimulationStrategyPlan[]) {
  return strategies.map((strategy) => ({ ...strategy }));
}

export function createInitialTrpSimulationSettingForm(): TrpSimulationSettingForm {
  return {
    selectedCategory: 0,
    selectedDetail: 1,
    selectedValue: 2,
    targetConfigs: cloneTargetConfigs(initialTargetConfigs),
    followUpMonths: 12,
    drugList: cloneDrugList(initialDrugList),
    strategies: cloneStrategies(initialStrategies),
  };
}

export function cloneTrpSimulationSettingForm(
  form: TrpSimulationSettingForm
): TrpSimulationSettingForm {
  return {
    ...form,
    targetConfigs: cloneTargetConfigs(form.targetConfigs),
    drugList: cloneDrugList(form.drugList),
    strategies: cloneStrategies(form.strategies),
  };
}

export function isSameTrpSimulationSettingForm(
  left: TrpSimulationSettingForm,
  right: TrpSimulationSettingForm
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function getTrpSimulationSelectedOutcomeLabel(selectedValue: number) {
  return trpSimulationOutcomeOptions[selectedValue] ?? trpSimulationOutcomeOptions[2];
}

export function formatTrpSimulationSelectedValue(form: TrpSimulationSettingForm) {
  const summary = form.targetConfigs
    .filter((config) => config.value.trim().length > 0 || config.months.trim().length > 0)
    .map((config) => {
      const valueLabel = config.value.trim().length > 0 ? ` ${config.value}${config.unit}` : "";
      const monthsLabel =
        config.months.trim().length > 0 ? ` (${config.months.trim()}m)` : "";

      return `${config.label}${valueLabel}${monthsLabel}`;
    });

  return summary.length > 0
    ? `${getTrpSimulationSelectedOutcomeLabel(form.selectedValue)}\n${summary.join(" / ")}`
    : getTrpSimulationSelectedOutcomeLabel(form.selectedValue);
}

export function formatTrpSimulationFollowUpWindow(form: TrpSimulationSettingForm) {
  return `${form.followUpMonths} months`;
}

export function buildTrpSimulationStrategySummaries(form: TrpSimulationSettingForm) {
  const regimenItems =
    form.drugList.length > 0
      ? form.drugList.map((drug) => `${drug.type}: ${drug.name}`)
      : ["No regimen selected"];

  return form.strategies.map((strategy, index) => ({
    title: strategy.title,
    tone: (index === 0 ? "violet" : index === 1 ? "orange" : "teal") as TrpSimulationStrategyTone,
    items: [
      strategy.keepCurrent ? "Keep current regimen" : "Adjust current regimen",
      ...regimenItems,
    ],
  }));
}
