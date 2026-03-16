import {
  trpHypoglycemicDrugValues,
  trpInsulinDrugValues,
} from "@/lib/trp-drug-catalog";

export type TrpPrimaryConditionValue = "diabetes";
export type TrpDataLoadSex = "male" | "female";
export type TrpTrendValue = "stable" | "increase" | "decrease";
export type TrpSbpCategory = "normal-lt-120" | "elevated" | "high";
export type TrpProxyMode = "albuminuria" | "dipstick" | "pcr";
export type TrpAlbuminuriaLevel = "a1" | "a2" | "a3";
export type TrpDipstickLevel = "negative" | "trace" | "1+" | "2+" | "3+" | "4+";

export type TrpDataLoadPatientProfile = {
  disease: TrpPrimaryConditionValue;
  age: string;
  sex: TrpDataLoadSex;
  height: string;
  bmi: string;
  weight: string;
  weightTrend: TrpTrendValue;
  sbpCategory: TrpSbpCategory;
  sbpTrend: TrpTrendValue;
  hba1cValue: string;
  baselineTrend: TrpTrendValue;
  fastingGlucose: string;
  randomGlucose: string;
  egfr: string;
  renalInputMode: "uacr" | TrpProxyMode;
  uacr: string;
  albuminuriaLevel: TrpAlbuminuriaLevel;
  dipstickLevel: TrpDipstickLevel;
  pcrValue: string;
  medicalHistories: string[];
};

export type TrpDataLoadTreatmentInfo = {
  hypoglycemicAgentDrugs: string[];
  insulinBasedDrugs: string[];
  treatmentLineSelect: string;
  treatmentLineFlags: string[];
  priorSwitchHistory: "Yes" | "No";
  lowBloodSugarSeverity: "Step 1 (< 70mg/dL)" | "Step 2 (< 54mg/dL)";
  dmDuration: "" | "< 5 Years" | "5 ~ 10 Years" | "> 10 Years";
  cvdHistory: string[];
  persistenceProxy: "High" | "Medium" | "Low";
};

export type TrpDataLoadPatientRecord = {
  id: string;
  patientId: string;
  dataName: string;
  primaryCondition: TrpPrimaryConditionValue;
  relatedDisease: string;
  age: number;
  sex: TrpDataLoadSex;
  bmi: number;
  sbp: number;
  dbp: number;
  durationYears: number;
  updatedAt: string;
  patientProfile: TrpDataLoadPatientProfile;
  treatmentInfo: TrpDataLoadTreatmentInfo;
};

export const trpPrimaryConditionOptions = [
  { label: "Diabetes", value: "diabetes" },
] as const;

export const trpPrimaryConditionDiabetesOnlyOptions = trpPrimaryConditionOptions;

const medicalHistoryPatterns = [
  ["Hypertension"],
  ["Hypertension", "Dyslipidemia/hyperlipidemia"],
  ["Hypertension", "Chronic kidney disease (CKD)"],
  ["Diabetes mellitus", "Coronary artery disease(CAD)"],
  ["Heart failure", "History of stroke"],
  ["Chronic respiratory disease", "History of malignancy"],
  ["Chronic liver disease", "Dyslipidemia/hyperlipidemia"],
  ["Hypertension", "Heart failure", "Chronic kidney disease (CKD)"],
] as const;

const relatedDiseaseOptions = [
  "CKD stage 2",
  "Hypertension",
  "ASCVD",
  "Obesity",
  "Heart failure",
  "Dyslipidemia",
  "Metabolic syndrome",
  "NAFLD",
] as const;

const dataNamePrefixes = [
  "Metabolic Registry",
  "Renal Risk Snapshot",
  "Primary Care Load",
  "Glycemic Cohort",
  "Cardio-Renal Follow-up",
  "Continuity Dataset",
] as const;

const weightTrendOptions: TrpTrendValue[] = ["stable", "increase", "decrease"];
const baselineTrendOptions: TrpTrendValue[] = ["stable", "increase", "decrease"];
const hypoglycemicDrugPatterns = [
  [trpHypoglycemicDrugValues[0]],
  [trpHypoglycemicDrugValues[1]],
  [trpHypoglycemicDrugValues[2]],
  [trpHypoglycemicDrugValues[3]],
  [trpHypoglycemicDrugValues[0], trpHypoglycemicDrugValues[3]],
  [trpHypoglycemicDrugValues[0], trpHypoglycemicDrugValues[2]],
] as const;
const insulinDrugPatterns = [
  [],
  [trpInsulinDrugValues[0]],
  [trpInsulinDrugValues[1]],
  [trpInsulinDrugValues[2]],
  [trpInsulinDrugValues[0], trpInsulinDrugValues[1]],
] as const;
const cvdHistoryPatterns = [
  ["ASCVD"],
  ["ASCVD", "HF"],
  ["Stroke"],
  ["HF"],
  ["ASCVD", "Stroke"],
  ["HF", "Stroke"],
  [],
] as const;
const renalModes: TrpDataLoadPatientProfile["renalInputMode"][] = [
  "uacr",
  "albuminuria",
  "dipstick",
  "pcr",
];
const albuminuriaOptions: TrpAlbuminuriaLevel[] = ["a1", "a2", "a3"];
const dipstickOptions: TrpDipstickLevel[] = ["negative", "trace", "1+", "2+", "3+", "4+"];

function formatNumber(value: number, fractionDigits = 0) {
  return value.toFixed(fractionDigits);
}

function resolveSbpCategory(sbp: number): TrpSbpCategory {
  if (sbp < 120) {
    return "normal-lt-120";
  }

  if (sbp < 130) {
    return "elevated";
  }

  return "high";
}

function buildUpdatedAt(index: number) {
  const base = new Date(Date.UTC(2026, 2, 14));
  base.setUTCDate(base.getUTCDate() - index * 3);
  return base.toISOString().slice(0, 10);
}

function resolveDmDuration(durationYears: number): TrpDataLoadTreatmentInfo["dmDuration"] {
  if (durationYears > 10) {
    return "> 10 Years";
  }

  if (durationYears >= 5) {
    return "5 ~ 10 Years";
  }

  return "< 5 Years";
}

function buildTreatmentLineState(
  hypoglycemicDrugs: readonly string[],
  insulinDrugs: readonly string[]
) {
  if (insulinDrugs.length > 0 && hypoglycemicDrugs.length > 0) {
    return {
      treatmentLineSelect: "Advanced Therapy",
      treatmentLineFlags: ["OAD", "Advanced Therapy", "Insulin-based"],
    };
  }

  if (insulinDrugs.length > 0) {
    return {
      treatmentLineSelect: "Insulin-based",
      treatmentLineFlags: ["Insulin-based"],
    };
  }

  if (hypoglycemicDrugs.length > 1) {
    return {
      treatmentLineSelect: "Advanced Therapy",
      treatmentLineFlags: ["OAD", "Advanced Therapy"],
    };
  }

  return {
    treatmentLineSelect: "OAD",
    treatmentLineFlags: ["OAD"],
  };
}

function createPatientRecord(index: number): TrpDataLoadPatientRecord {
  const recordIndex = index + 1;
  const primaryCondition: TrpPrimaryConditionValue = "diabetes";
  const sex: TrpDataLoadSex = recordIndex % 2 === 0 ? "female" : "male";
  const age = 29 + ((recordIndex * 3) % 43);
  const heightCm = 154 + ((recordIndex * 3) % 29);
  const bmi = Number((21.1 + ((recordIndex * 7) % 91) / 10).toFixed(1));
  const weightKg = Number((bmi * Math.pow(heightCm / 100, 2)).toFixed(1));
  const sbp = 112 + ((recordIndex * 5) % 36);
  const dbp = 68 + ((recordIndex * 4) % 20);
  const durationYears = 1 + ((recordIndex * 2) % 18);
  const hba1cValue = Number((6.4 + ((recordIndex * 3) % 22) / 10).toFixed(1));
  const fastingGlucose = 104 + ((recordIndex * 4) % 58);
  const randomGlucose = 148 + ((recordIndex * 6) % 85);
  const egfr = 64 + ((recordIndex * 3) % 38);
  const renalInputMode = renalModes[recordIndex % renalModes.length];
  const albuminuriaLevel = albuminuriaOptions[recordIndex % albuminuriaOptions.length];
  const dipstickLevel = dipstickOptions[recordIndex % dipstickOptions.length];
  const pcrValue = formatNumber(148 + ((recordIndex * 13) % 210));
  const uacr = formatNumber(24 + ((recordIndex * 17) % 160));
  const hypoglycemicAgentDrugs = [
    ...hypoglycemicDrugPatterns[recordIndex % hypoglycemicDrugPatterns.length],
  ];
  const insulinBasedDrugs = [...insulinDrugPatterns[recordIndex % insulinDrugPatterns.length]];
  const { treatmentLineSelect, treatmentLineFlags } = buildTreatmentLineState(
    hypoglycemicAgentDrugs,
    insulinBasedDrugs
  );
  const cvdHistory = [...cvdHistoryPatterns[recordIndex % cvdHistoryPatterns.length]];
  const relatedDisease = relatedDiseaseOptions[recordIndex % relatedDiseaseOptions.length];
  const patientIdPrefix = "DM";
  const dataNamePrefix = dataNamePrefixes[recordIndex % dataNamePrefixes.length];

  return {
    id: `trp-data-load-${recordIndex}`,
    patientId: `TRP-${patientIdPrefix}-${String(2400 + recordIndex).padStart(4, "0")}`,
    dataName: `${dataNamePrefix} ${String(recordIndex).padStart(3, "0")}`,
    primaryCondition,
    relatedDisease,
    age,
    sex,
    bmi,
    sbp,
    dbp,
    durationYears,
    updatedAt: buildUpdatedAt(recordIndex),
    patientProfile: {
      disease: primaryCondition,
      age: formatNumber(age),
      sex,
      height: formatNumber(heightCm),
      bmi: formatNumber(bmi, 1),
      weight: formatNumber(weightKg, 1),
      weightTrend: weightTrendOptions[recordIndex % weightTrendOptions.length],
      sbpCategory: resolveSbpCategory(sbp),
      sbpTrend: weightTrendOptions[(recordIndex + 1) % weightTrendOptions.length],
      hba1cValue: formatNumber(hba1cValue, 1),
      baselineTrend: baselineTrendOptions[(recordIndex + 2) % baselineTrendOptions.length],
      fastingGlucose: formatNumber(fastingGlucose),
      randomGlucose: formatNumber(randomGlucose),
      egfr: formatNumber(egfr),
      renalInputMode,
      uacr: renalInputMode === "uacr" ? uacr : "",
      albuminuriaLevel,
      dipstickLevel,
      pcrValue: renalInputMode === "pcr" ? pcrValue : "",
      medicalHistories: [...medicalHistoryPatterns[recordIndex % medicalHistoryPatterns.length]],
    },
    treatmentInfo: {
      hypoglycemicAgentDrugs,
      insulinBasedDrugs,
      treatmentLineSelect,
      treatmentLineFlags,
      priorSwitchHistory: recordIndex % 4 === 0 ? "Yes" : "No",
      lowBloodSugarSeverity: recordIndex % 5 === 0 ? "Step 2 (< 54mg/dL)" : "Step 1 (< 70mg/dL)",
      dmDuration: resolveDmDuration(durationYears),
      cvdHistory,
      persistenceProxy: "High",
    },
  };
}

export const trpDataLoadMockPatients: TrpDataLoadPatientRecord[] = Array.from(
  { length: 96 },
  (_, index) => createPatientRecord(index)
);

export function getTrpPrimaryConditionLabel(value: TrpPrimaryConditionValue) {
  return trpPrimaryConditionOptions.find((option) => option.value === value)?.label ?? value;
}
