type PatientInfoLike = {
  disease: string;
  age: string;
  sex: string;
  height: string;
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
  proxyMode: "" | "albuminuria" | "dipstick" | "pcr";
  albuminuriaLevel: "" | "a1" | "a2" | "a3";
  dipstickLevel: "" | "negative" | "trace" | "1+" | "2+" | "3+" | "4+";
  pcrValue: string;
};

type TreatmentInfoLike = {
  hypoglycemicAgentDrugs: readonly string[];
  insulinBasedDrugs: readonly string[];
  treatmentLineSelect: string;
  dmDuration: string;
};

export type TrpPatientDiseaseValidationField =
  | "disease"
  | "age"
  | "sex"
  | "height"
  | "weight"
  | "weightTrend"
  | "sbp"
  | "sbpTrend"
  | "hba1cValue"
  | "baselineTrend"
  | "fastingGlucose"
  | "randomGlucose"
  | "egfr"
  | "uacr"
  | "proxyMode"
  | "albuminuriaLevel"
  | "dipstickLevel"
  | "pcrValue";

export type TrpTreatmentValidationField =
  | "treatmentDrugs"
  | "treatmentLineSelect"
  | "dmDuration";

const requiredPatientFields = [
  "disease",
  "age",
  "sex",
  "height",
  "weight",
  "weightTrend",
  "sbp",
  "sbpTrend",
  "hba1cValue",
  "baselineTrend",
  "fastingGlucose",
  "randomGlucose",
  "egfr",
] as const satisfies readonly TrpPatientDiseaseValidationField[];

function isBlankValue(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

export function getTrpPatientDiseaseInvalidFields(values: PatientInfoLike | null) {
  const next = new Set<TrpPatientDiseaseValidationField>();

  if (!values) {
    requiredPatientFields.forEach((field) => next.add(field));
    next.add("uacr");
    return next;
  }

  requiredPatientFields.forEach((field) => {
    if (isBlankValue(values[field])) {
      next.add(field);
    }
  });

  if (!values.dontKnowUacr) {
    if (isBlankValue(values.uacr)) {
      next.add("uacr");
    }

    return next;
  }

  if (!values.proxyMode) {
    next.add("proxyMode");
    return next;
  }

  if (values.proxyMode === "albuminuria" && !values.albuminuriaLevel) {
    next.add("albuminuriaLevel");
  }

  if (values.proxyMode === "dipstick" && !values.dipstickLevel) {
    next.add("dipstickLevel");
  }

  if (values.proxyMode === "pcr" && isBlankValue(values.pcrValue)) {
    next.add("pcrValue");
  }

  return next;
}

export function isTrpPatientDiseaseInfoComplete(values: PatientInfoLike | null) {
  return getTrpPatientDiseaseInvalidFields(values).size === 0;
}

export function getTrpTreatmentInvalidFields(form: TreatmentInfoLike | null) {
  const next = new Set<TrpTreatmentValidationField>();

  if (!form) {
    next.add("treatmentDrugs");
    next.add("treatmentLineSelect");
    next.add("dmDuration");
    return next;
  }

  if (form.hypoglycemicAgentDrugs.length + form.insulinBasedDrugs.length === 0) {
    next.add("treatmentDrugs");
  }

  if (!form.treatmentLineSelect) {
    next.add("treatmentLineSelect");
  }

  if (!form.dmDuration) {
    next.add("dmDuration");
  }

  return next;
}

export function isTrpTreatmentInfoComplete(form: TreatmentInfoLike | null) {
  return getTrpTreatmentInvalidFields(form).size === 0;
}
