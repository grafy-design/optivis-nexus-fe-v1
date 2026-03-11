import type {
  DefaultSettingHydrationPayload,
  FilterSection,
  FilterSubRow,
  HighRiskSubgroupData,
  MedicalHistoryRawData,
  PatientDiseaseInfoData,
} from "@/store/defaultSettingStore";
import type {
  DRDConditionAndGroup,
  DRDConditionClause,
  DRDConditionNode,
  DRDConditionOrGroup,
  DRDConditionValue,
  DRDMedicalHistoryInfoData,
  DRDPatientInfoData,
  DRDSubgroupChildItem,
  DRDSubgroupItem,
  DRDTaskSummaryData,
  GroupManageInfoData,
} from "@/services/types/drd-service.types";
import { parseDrdFilterConditionRawJson } from "@/lib/drd-filter-condition";

type FilterBucket = "inclusion" | "exclusion";

type ClauseToken = {
  feature: string;
  op: string;
  value: string;
  bucket: FilterBucket;
};

type SectionToken = {
  main: ClauseToken;
  subRows: ClauseToken[];
  subRowLogic: "And" | "Or";
};

const KNOWN_MEDICAL_KEYS = [
  "ckd",
  "ckd-1",
  "ckd-2",
  "ckd-3",
  "ckd-4",
  "ckd-5",
  "cardiac",
  "vascular",
  "metabolism",
  "renal",
  "nervous",
  "eye",
  "hepato",
  "cvd",
  "ascvd",
  "hf",
  "stroke",
  "lowbs",
  "lowbs-1",
  "lowbs-2",
  "dm",
  "dm-1",
  "dm-2",
  "dm-3",
] as const;

const toNormalized = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isConditionClause = (value: unknown): value is DRDConditionClause =>
  isObject(value) && "column" in value && "operator" in value && "value" in value;

const isAndGroup = (value: unknown): value is DRDConditionAndGroup =>
  isObject(value) && Array.isArray(value.and);

const isOrGroup = (value: unknown): value is DRDConditionOrGroup =>
  isObject(value) && Array.isArray(value.or);

const safeString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const splitLooseStringList = (raw: string): string[] => {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // JSON array string: '["A","B"]'
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const parsed = parseJson(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => safeString(value).trim())
        .filter(Boolean);
    }
  }

  // loose form: "{ A, B }" / "A,B"
  const normalized = trimmed
    .replace(/^[\[{(]+/, "")
    .replace(/[\]})]+$/, "")
    .replace(/^"+|"+$/g, "");
  const parts = normalized
    .split(",")
    .map((part) => part.trim().replace(/^"+|"+$/g, ""))
    .filter(Boolean);

  return parts.length > 0 ? parts : [trimmed];
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => safeString(entry).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return splitLooseStringList(value);
  }
  return [];
};

const formatConditionValue = (value: DRDConditionValue): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const collectClauses = (node: unknown): DRDConditionClause[] => {
  if (isConditionClause(node)) return [node];
  if (isAndGroup(node)) return node.and.flatMap((child) => collectClauses(child));
  if (isOrGroup(node)) return node.or.flatMap((child) => collectClauses(child));
  return [];
};

const deriveDemographic = (
  snapshot: DRDConditionClause | DRDConditionAndGroup | DRDConditionOrGroup
): string => {
  const columns = collectClauses(snapshot).map((clause) => toNormalized(String(clause.column)));
  if (columns.some((column) => column.includes("sex") || column.includes("gender"))) {
    return "Sex";
  }
  if (columns.some((column) => column.includes("age"))) {
    return "Age";
  }
  return "";
};

const mapMeasurement = (rawMeasurement: string): string => {
  const trimmedMeasurement = rawMeasurement.trim();
  if (!trimmedMeasurement) return "";

  const normalized = toNormalized(rawMeasurement);
  if (normalized.includes("sex") || normalized.includes("gender")) return "Sex";
  if (normalized.includes("age")) return "Age";
  if (normalized.includes("bmi")) return "BMI";
  if (normalized.includes("sbp") || normalized.includes("systolic")) return "SBP";
  if (normalized.includes("hba1c")) return "HbA1c";
  if (normalized.includes("glucose")) return "Glucose";
  if (normalized.includes("egfr")) return "eGFR";
  if (normalized.includes("uacr")) return "UACR";
  return trimmedMeasurement;
};

const mapTrendSelection = (rawFilterCondition: string): string => {
  const normalized = toNormalized(rawFilterCondition);
  if (normalized.includes("decrease") || normalized.includes("decline") || normalized.includes("down")) {
    return "Decrease";
  }
  if (normalized.includes("stable")) return "Stable";
  if (normalized.includes("increase") || normalized.includes("rise") || normalized.includes("up")) {
    return "Increase";
  }

  // numeric conditions fallback (e.g. ">=1.0%", ">=1.0", "1.0%", "<=-1.0")
  const compact = rawFilterCondition
    .toLowerCase()
    .replace(/\/\s*year/g, "")
    .replace(/\s+/g, "");
  if (!compact) return "";

  const operatorMatch = compact.match(/^(<=|>=|=|<|>)/);
  const operator = operatorMatch?.[1] ?? "";
  const numericMatch = compact.match(/-?\d+(\.\d+)?/);
  const numericValue = numericMatch ? Number(numericMatch[0]) : NaN;
  if (Number.isNaN(numericValue)) return "";

  if (operator.includes("<") || numericValue < 0) return "Decrease";
  if (operator.includes(">")) return "Increase";
  return "Stable";
};

const mapControlMode = (rawControlVariableType: string): string => {
  const normalized = toNormalized(rawControlVariableType);
  if (normalized.includes("trend")) return "trend";
  if (normalized.includes("value")) return "value";
  return "";
};

const mapPatientDiseaseInfo = (
  patientInfo: DRDPatientInfoData | null
): PatientDiseaseInfoData | null => {
  if (!patientInfo) return null;

  const controlMode = mapControlMode(patientInfo.control_variable_type);
  const trendSelection = mapTrendSelection(patientInfo.filter_condition);
  const mappedMeasurement = mapMeasurement(patientInfo.measurement);
  const mappedDemoFromSnapshot = deriveDemographic(patientInfo.snapshot_json);

  let baselineDemo = "";
  let baselineMeasure = "";

  if (mappedMeasurement === "Age" || mappedMeasurement === "Sex") {
    baselineDemo = mappedMeasurement;
  } else if (mappedMeasurement) {
    baselineMeasure = mappedMeasurement;
  } else if (mappedDemoFromSnapshot) {
    baselineDemo = mappedDemoFromSnapshot;
  }

  const hasMappedField = Boolean(
    controlMode || trendSelection || baselineDemo || baselineMeasure
  );

  if (!hasMappedField) {
    return null;
  }

  return {
    baselineDemo,
    baselineMeasure,
    controlMode,
    trendSelection,
  };
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const pickRawField = (record: Record<string, unknown>, key: string): unknown => {
  const exact = record[key];
  if (exact !== undefined) return exact;
  const lowerKey = key.toLowerCase();
  const matched = Object.keys(record).find((entry) => entry.toLowerCase() === lowerKey);
  return matched ? record[matched] : undefined;
};

const parseRawSubRows = (raw: unknown): FilterSubRow[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => isObject(row))
    .map((row) => ({
      logic: safeString(pickRawField(row, "logic")) || "And",
      feature: safeString(pickRawField(row, "feature")),
      op: safeString(pickRawField(row, "op")),
      value: safeString(pickRawField(row, "value")),
    }));
};

const parseRawSections = (raw: unknown): FilterSection[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((section): section is Record<string, unknown> => isObject(section))
    .map((section, index) => ({
      id: Number(pickRawField(section, "id")) || index + 1,
      name: safeString(pickRawField(section, "name")) || `Section ${index + 1}`,
      feature: safeString(pickRawField(section, "feature")),
      op: safeString(pickRawField(section, "op")),
      value: safeString(pickRawField(section, "value")),
      subRows: parseRawSubRows(
        pickRawField(section, "subRows") ?? pickRawField(section, "sub_rows")
      ),
    }));
};

const isExclusionOperator = (op: string): boolean => {
  const normalized = toNormalized(op);
  return (
    normalized.includes("not") ||
    normalized === "!=" ||
    normalized === "<>" ||
    normalized === "not in"
  );
};

const toClauseToken = (clause: DRDConditionClause): ClauseToken => {
  const feature = safeString(clause.column);
  const op = safeString(clause.operator);
  return {
    feature,
    op,
    value: formatConditionValue(clause.value),
    bucket: isExclusionOperator(op) ? "exclusion" : "inclusion",
  };
};

const extractSectionTokens = (node: DRDConditionNode | DRDConditionAndGroup | DRDConditionOrGroup): SectionToken[] => {
  if (isConditionClause(node)) {
    return [{ main: toClauseToken(node), subRows: [], subRowLogic: "And" }];
  }

  if (isOrGroup(node)) {
    const clauses = node.or.flatMap((entry) => collectClauses(entry));
    if (clauses.length === 0) return [];
    const [first, ...rest] = clauses.map(toClauseToken);
    return [{ main: first, subRows: rest, subRowLogic: "Or" }];
  }

  if (isAndGroup(node)) {
    return node.and.flatMap((entry) => {
      if (isOrGroup(entry)) {
        const clauses = entry.or.flatMap((child) => collectClauses(child));
        if (clauses.length === 0) return [];
        const [first, ...rest] = clauses.map(toClauseToken);
        return [{ main: first, subRows: rest, subRowLogic: "Or" }];
      }
      return extractSectionTokens(entry);
    });
  }

  return [];
};

const toFilterSections = (tokens: SectionToken[]): { inclusion: FilterSection[]; exclusion: FilterSection[] } => {
  const inclusionTokens: SectionToken[] = [];
  const exclusionTokens: SectionToken[] = [];

  tokens.forEach((token) => {
    if (token.main.bucket === "exclusion") {
      exclusionTokens.push(token);
      return;
    }
    inclusionTokens.push(token);
  });

  const toSectionArray = (sectionTokens: SectionToken[]): FilterSection[] =>
    sectionTokens.map((token, index) => ({
      id: index + 1,
      name: `Section ${index + 1}`,
      feature: token.main.feature,
      op: token.main.op,
      value: token.main.value,
      subRows: token.subRows.map((subRow) => ({
        logic: token.subRowLogic,
        feature: subRow.feature,
        op: subRow.op,
        value: subRow.value,
      })),
    }));

  return {
    inclusion: toSectionArray(inclusionTokens),
    exclusion: toSectionArray(exclusionTokens),
  };
};

const hasFilterSectionData = (sections: FilterSection[]): boolean =>
  sections.some(
    (section) =>
      Boolean(section.feature || section.op || section.value) ||
      (section.subRows ?? []).some((row) => Boolean(row.feature || row.op || row.value))
  );

const mapFilterData = (
  groupManageInfo: GroupManageInfoData | null,
  appliedFilterSnapshot: DRDConditionAndGroup | DRDConditionOrGroup | null,
  appliedFilterMerged: DRDConditionAndGroup | DRDConditionOrGroup | null
): { inclusion: FilterSection[]; exclusion: FilterSection[] } => {
  const empty = { inclusion: [], exclusion: [] };
  if (!groupManageInfo && !appliedFilterSnapshot && !appliedFilterMerged) return empty;

  const rawParsed =
    groupManageInfo && groupManageInfo.condition_raw_json
      ? parseJson(groupManageInfo.condition_raw_json)
      : null;
  if (isObject(rawParsed)) {
    const inclusion = parseRawSections(pickRawField(rawParsed, "inclusion"));
    const exclusion = parseRawSections(pickRawField(rawParsed, "exclusion"));
    if (inclusion.length > 0 || exclusion.length > 0) {
      return { inclusion, exclusion };
    }
  }

  const rawFilterExpression =
    groupManageInfo?.condition_raw_json &&
    typeof groupManageInfo.condition_raw_json === "string"
      ? parseDrdFilterConditionRawJson(groupManageInfo.condition_raw_json)
      : null;
  if (
    rawFilterExpression &&
    (rawFilterExpression.inclusion.length > 0 ||
      rawFilterExpression.exclusion.length > 0)
  ) {
    return rawFilterExpression;
  }

  const sourceTree =
    groupManageInfo?.condition_snapshot_json ?? appliedFilterSnapshot ?? appliedFilterMerged;
  if (!sourceTree) return empty;

  const tokens = extractSectionTokens(sourceTree);
  return toFilterSections(tokens);
};

const toMedicalKey = (token: string): (typeof KNOWN_MEDICAL_KEYS)[number] | null => {
  const normalized = toNormalized(token);

  if (normalized === "ckd" || normalized.includes("ckd stage")) return "ckd";
  if (normalized.includes("stage 1") || normalized.includes("egfr >=90")) return "ckd-1";
  if (normalized.includes("stage 2") || normalized.includes("egfr >=60")) return "ckd-2";
  if (normalized.includes("stage 3") || normalized.includes("egfr >=30")) return "ckd-3";
  if (normalized.includes("stage 4") || normalized.includes("egfr >=15")) return "ckd-4";
  if (normalized.includes("stage 5") || normalized.includes("egfr <=90")) return "ckd-5";
  if (normalized.includes("cardiac")) return "cardiac";
  if (normalized.includes("vascular")) return "vascular";
  if (normalized.includes("metabolism")) return "metabolism";
  if (normalized.includes("renal")) return "renal";
  if (normalized.includes("nervous")) return "nervous";
  if (normalized.includes("eye")) return "eye";
  if (normalized.includes("hepato")) return "hepato";
  if (normalized === "cvd" || normalized.includes("cvd history")) return "cvd";
  if (normalized === "ascvd") return "ascvd";
  if (normalized === "hf" || normalized.includes("heart failure")) return "hf";
  if (normalized.includes("stroke")) return "stroke";
  if (normalized.includes("low blood sugar") || normalized.includes("hypoglycemia")) return "lowbs";
  if (normalized.includes("< 70") || normalized.includes("step 1")) return "lowbs-1";
  if (normalized.includes("< 54") || normalized.includes("step 2")) return "lowbs-2";
  if (normalized === "dm" || normalized.includes("dm duration") || normalized.includes("diabetes duration")) {
    return "dm";
  }
  if (normalized.includes("early") && normalized.includes("year")) return "dm-1";
  if (normalized.includes("short") && normalized.includes("10")) return "dm-2";
  if (normalized.includes("long") && normalized.includes("10")) return "dm-3";

  const direct = KNOWN_MEDICAL_KEYS.find(
    (entry) => toNormalized(entry) === normalized
  );
  return direct ?? null;
};

const mapMedicalHistoryData = (
  medicalHistoryInfo: DRDMedicalHistoryInfoData | null
): Record<string, boolean> => {
  if (!medicalHistoryInfo) return {};

  const next: Record<string, boolean> = {};
  const tokens = [
    ...toStringArray((medicalHistoryInfo as unknown as Record<string, unknown>).filter),
    ...toStringArray((medicalHistoryInfo as unknown as Record<string, unknown>).diagnosis),
    ...toStringArray((medicalHistoryInfo as unknown as Record<string, unknown>).risk_factor),
    ...toStringArray((medicalHistoryInfo as unknown as Record<string, unknown>).comorbidity),
  ];

  tokens.forEach((token) => {
    const key = toMedicalKey(token);
    if (key) next[key] = true;
  });

  if (next["ckd-1"] || next["ckd-2"] || next["ckd-3"] || next["ckd-4"] || next["ckd-5"]) {
    next.ckd = true;
  }
  if (next.ascvd || next.hf || next.stroke) next.cvd = true;
  if (next["lowbs-1"] || next["lowbs-2"]) next.lowbs = true;
  if (next["dm-1"] || next["dm-2"] || next["dm-3"]) next.dm = true;

  return next;
};

const mapMedicalHistoryRawData = (
  medicalHistoryInfo: DRDMedicalHistoryInfoData | null
): MedicalHistoryRawData | null => {
  if (!medicalHistoryInfo) return null;

  const source = medicalHistoryInfo as unknown as Record<string, unknown>;

  return {
    filter: toStringArray(source.filter),
    diagnosis: toStringArray(source.diagnosis),
    riskFactor: toStringArray(source.risk_factor),
    comorbidity: toStringArray(source.comorbidity),
  };
};

const toDisplayFeature = (rawFeature: string): string => {
  const trimmedFeature = rawFeature.trim();
  if (!trimmedFeature) return "";

  const normalized = toNormalized(rawFeature);
  if (normalized.includes("egfr")) return "eGFR";
  if (normalized.includes("hba1c")) return "HbA1c";
  return trimmedFeature;
};

const toKnownSubRowId = (
  parentName: string,
  subRowName: string,
  parentId: number
): string => {
  const parent = toNormalized(parentName);
  const sub = toNormalized(subRowName);
  const suffix = sub.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "option";

  if (parent.includes("ckd 1")) return `ckd1-${suffix}`;
  if (parent.includes("ckd 2")) return `ckd2-${suffix}`;
  if (parent.includes("set 1")) return `set1-${suffix}`;
  if (parent.includes("set 4")) return `set4-${suffix}`;

  return `group-${parentId}-${suffix}`;
};

const buildCutoffCondition = (
  child: DRDSubgroupChildItem,
  parent: DRDSubgroupItem
): { condition: string; slope: string } => {
  const cutoffConditions = child.cutoff_snapshot_json?.conditions ?? [];
  if (cutoffConditions.length > 0) {
    const [main, slope] = cutoffConditions;
    const condition = `${safeString(main.condition)} ${safeString(main.value)}`.trim();
    return {
      condition,
      slope: slope ? safeString(slope.value) : "",
    };
  }

  return {
    condition: safeString(child.cut_off_display || child.cut_off) || parent.cut_off.join(", "),
    slope: "",
  };
};

const mapHighRiskSubgroupData = (
  subgroups: DRDSubgroupItem[]
): HighRiskSubgroupData | null => {
  const selectedPair = subgroups
    .flatMap((group) =>
      group.children
        .filter((child) => child.is_selected)
        .map((child) => ({ parent: group, child }))
    )
    .at(0);

  if (!selectedPair) return null;

  const { parent, child } = selectedPair;
  const parentName = parent.set_name;
  const subRowName = child.classification || child.set_name || "";
  const { condition, slope } = buildCutoffCondition(child, parent);
  const month = String(child.month ?? parent.month ?? "");
  const status =
    child.group_balance ||
    parent.group_balance ||
    (typeof parent.of_group === "number" ? `n=${parent.of_group.toLocaleString()}` : "");

  return {
    selectedSubRow: toKnownSubRowId(parentName, subRowName, parent.id),
    parentName,
    subRowName,
    feature: toDisplayFeature(child.outcome || parent.outcome),
    condition,
    month,
    slope,
    status,
  };
};

const hasMedicalHistoryData = (value: Record<string, boolean>): boolean =>
  Object.values(value).some(Boolean);

const hasMedicalHistoryRawData = (value: MedicalHistoryRawData | null): boolean => {
  if (!value) return false;
  return (
    value.filter.length > 0 ||
    value.diagnosis.length > 0 ||
    value.riskFactor.length > 0 ||
    value.comorbidity.length > 0
  );
};

export const mapDrdTaskSummaryToDefaultSettingHydration = (
  summary: DRDTaskSummaryData,
  options?: { taskId?: string | null }
): DefaultSettingHydrationPayload => {
  const patientDiseaseInfoData = mapPatientDiseaseInfo(summary.patient_info);
  const filterData = mapFilterData(
    summary.group_manage_info,
    summary.applied_filter_snapshot,
    summary.applied_filter_merged_json
  );
  const highRiskSubgroupData = mapHighRiskSubgroupData(summary.subgroups);
  const medicalHistoryData = mapMedicalHistoryData(summary.medical_history_info);
  const medicalHistoryRawData = mapMedicalHistoryRawData(summary.medical_history_info);

  const completedItems: DefaultSettingHydrationPayload["completedItems"] = {
    "patient-disease-info": Boolean(
      summary.patient_info?.is_selected ?? patientDiseaseInfoData
    ),
    filter: hasFilterSectionData(filterData.inclusion) || hasFilterSectionData(filterData.exclusion),
    "high-risk-subgroup": Boolean(highRiskSubgroupData),
    "medical-history": Boolean(
      summary.medical_history_info?.is_selected ??
        (hasMedicalHistoryRawData(medicalHistoryRawData) ||
          hasMedicalHistoryData(medicalHistoryData))
    ),
  };

  return {
    taskId: options?.taskId,
    completedItems,
    cohortCount:
      typeof summary.total_patient_count === "number"
        ? summary.total_patient_count
        : undefined,
    finalCohortCount:
      typeof summary.filtered_patient_count === "number"
        ? summary.filtered_patient_count
        : undefined,
    filterData,
    medicalHistoryData,
    medicalHistoryRawData,
    patientDiseaseInfoData,
    highRiskSubgroupData,
  };
};

export interface DrdInfoApisHydrationInput {
  taskId?: string | null;
  totalPatientCount?: number;
  filteredPatientCount?: number;
  patientInfo: DRDPatientInfoData | null;
  groupManageFilterInfo: GroupManageInfoData | null;
  subgroups: DRDSubgroupItem[];
  medicalHistoryInfo: DRDMedicalHistoryInfoData | null;
}

export const mapDrdInfoApisToDefaultSettingHydration = ({
  taskId,
  totalPatientCount,
  filteredPatientCount,
  patientInfo,
  groupManageFilterInfo,
  subgroups,
  medicalHistoryInfo,
}: DrdInfoApisHydrationInput): DefaultSettingHydrationPayload => {
  const patientDiseaseInfoData = mapPatientDiseaseInfo(patientInfo);
  const filterData = mapFilterData(groupManageFilterInfo, null, null);
  const highRiskSubgroupData = mapHighRiskSubgroupData(subgroups ?? []);
  const medicalHistoryData = mapMedicalHistoryData(medicalHistoryInfo);
  const medicalHistoryRawData = mapMedicalHistoryRawData(medicalHistoryInfo);

  const completedItems: DefaultSettingHydrationPayload["completedItems"] = {
    "patient-disease-info": Boolean(
      patientInfo?.is_selected ?? patientDiseaseInfoData
    ),
    filter:
      hasFilterSectionData(filterData.inclusion) ||
      hasFilterSectionData(filterData.exclusion),
    "high-risk-subgroup": Boolean(highRiskSubgroupData),
    "medical-history": Boolean(
      medicalHistoryInfo?.is_selected ??
        (hasMedicalHistoryRawData(medicalHistoryRawData) ||
          hasMedicalHistoryData(medicalHistoryData))
    ),
  };

  return {
    taskId,
    completedItems,
    cohortCount:
      typeof totalPatientCount === "number" ? totalPatientCount : undefined,
    finalCohortCount:
      typeof filteredPatientCount === "number" ? filteredPatientCount : undefined,
    filterData,
    medicalHistoryData,
    medicalHistoryRawData,
    patientDiseaseInfoData,
    highRiskSubgroupData,
  };
};
