import type {
  TrpDataLoadPatientRecord,
  TrpProxyMode,
} from "@/components/trp/trp-data-load-mock-data";
import { normalizeTrpTreatmentDrugList } from "@/lib/trp-drug-catalog";

export type TrpPatientDiseaseInfoFormData = {
  disease: string;
  age: string;
  sex: string;
  height: string;
  bmi: string;
  weight: string;
  weightTrend: string;
  sbp: string;
  sbpTrend: string;
  hba1cValue: string;
  baselineTrend: string;
  fastingGlucose: string;
  randomGlucose: string;
  egfr: string;
  uacr: string;
  dontKnowUacr: boolean;
  proxyMode: "" | TrpProxyMode;
  albuminuriaLevel: "" | "a1" | "a2" | "a3";
  dipstickLevel: "" | "negative" | "trace" | "1+" | "2+" | "3+" | "4+";
  pcrValue: string;
  medicalHistories: string[];
};

export type TrpTreatmentInfoFormData = {
  hypoglycemicAgentDrugs: string[];
  insulinBasedDrugs: string[];
  treatmentLineSelect: string;
  treatmentLineFlags: string[];
  priorSwitchHistory: string;
  lowBloodSugarSeverity: string;
  dmDuration: "" | "< 5 Years" | "5 ~ 10 Years" | "> 10 Years";
  cvdHistory: string[];
  persistenceProxy: "High" | "Medium" | "Low";
};

export type TrpDataLoadSelectionSummary = {
  id: string;
  patientId: string;
  dataName: string;
  primaryCondition: string;
  relatedDisease: string;
  updatedAt: string;
};

export function mapDataLoadRecordToPatientDiseaseInfo(
  record: TrpDataLoadPatientRecord
): TrpPatientDiseaseInfoFormData {
  const { patientProfile } = record;
  const usesDirectUacr = patientProfile.renalInputMode === "uacr";
  const proxyMode: "" | TrpProxyMode =
    patientProfile.renalInputMode === "albuminuria" ||
    patientProfile.renalInputMode === "dipstick" ||
    patientProfile.renalInputMode === "pcr"
      ? patientProfile.renalInputMode
      : "";

  return {
    disease: patientProfile.disease,
    age: patientProfile.age,
    sex: patientProfile.sex,
    height: patientProfile.height,
    bmi: patientProfile.bmi,
    weight: patientProfile.weight,
    weightTrend: patientProfile.weightTrend,
    sbp: patientProfile.sbpCategory,
    sbpTrend: patientProfile.sbpTrend,
    hba1cValue: patientProfile.hba1cValue,
    baselineTrend: patientProfile.baselineTrend,
    fastingGlucose: patientProfile.fastingGlucose,
    randomGlucose: patientProfile.randomGlucose,
    egfr: patientProfile.egfr,
    uacr: usesDirectUacr ? patientProfile.uacr : "",
    dontKnowUacr: !usesDirectUacr,
    proxyMode,
    albuminuriaLevel:
      patientProfile.renalInputMode === "albuminuria" ? patientProfile.albuminuriaLevel : "",
    dipstickLevel:
      patientProfile.renalInputMode === "dipstick" ? patientProfile.dipstickLevel : "",
    pcrValue: patientProfile.renalInputMode === "pcr" ? patientProfile.pcrValue : "",
    medicalHistories: [...patientProfile.medicalHistories],
  };
}

export function mapDataLoadRecordToTreatmentInfo(
  record: TrpDataLoadPatientRecord
): TrpTreatmentInfoFormData {
  const { treatmentInfo } = record;

  return {
    hypoglycemicAgentDrugs: normalizeTrpTreatmentDrugList(treatmentInfo.hypoglycemicAgentDrugs),
    insulinBasedDrugs: normalizeTrpTreatmentDrugList(treatmentInfo.insulinBasedDrugs),
    treatmentLineSelect: treatmentInfo.treatmentLineSelect,
    treatmentLineFlags: [...treatmentInfo.treatmentLineFlags],
    priorSwitchHistory: treatmentInfo.priorSwitchHistory,
    lowBloodSugarSeverity: treatmentInfo.lowBloodSugarSeverity,
    dmDuration: treatmentInfo.dmDuration,
    cvdHistory: [...treatmentInfo.cvdHistory],
    persistenceProxy: treatmentInfo.persistenceProxy,
  };
}

export function buildDataLoadSelectionSummary(
  record: TrpDataLoadPatientRecord
): TrpDataLoadSelectionSummary {
  return {
    id: record.id,
    patientId: record.patientId,
    dataName: record.dataName,
    primaryCondition: record.primaryCondition,
    relatedDisease: record.relatedDisease,
    updatedAt: record.updatedAt,
  };
}
