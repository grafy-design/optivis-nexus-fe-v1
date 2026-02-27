import { fetcher } from "@/lib/fetcher";

// Report API 공통 항목 타입
export interface ReportOverviewDescriptionItem {
  title: string;
  description: string;
}

export interface ReportStratificationStrategyItem {
  feature_name: string;
  group: string;
  month: number;
  mean: number;
  ci_low: number;
  ci_high: number;
  n: number;
  cutoff: string;
}

export interface ReportVarianceDecompositionItem {
  group: string;
  variance: number;
  number: number;
  vr: number;
  ci: string;
  eta_square: number;
  omega: number;
}

export interface ReportWithinGroupVarianceItem {
  group: string;
  number: number;
  variance: number;
  classification: string; // "low" | "middle" | "high"
  total_var: number;
}

export interface ReportRiskResponseAssessmentItem {
  type: string; // "feature_based" | "model_based"
  outcome: string; // "CDR-SB" | "rHTE" | "Safety"
  group: string;
  mean: number;
  ci_low: number;
  ci_high: number;
  name: string; // "Disease Progression" | "Drug Response" | "Safety"
}

export interface ReportJsonData {
  overview_description?: ReportOverviewDescriptionItem[];
  model_stratification_strategy?: ReportStratificationStrategyItem[];
  feature_stratification_strategy?: ReportStratificationStrategyItem[];
  model_variance_decomposition?: ReportVarianceDecompositionItem[];
  model_within_group_variance_by_subgroup?: ReportWithinGroupVarianceItem[];
  feature_variance_decomposition?: ReportVarianceDecompositionItem[];
  feature_within_group_variance_by_subgroup?: ReportWithinGroupVarianceItem[];
  risk_response_assessment?: ReportRiskResponseAssessmentItem[];
}

export interface ReportByFeatureData {
  subgroup_id: number;
  set_name?: string;
  outcome?: string;
  month?: number;
  report_json?: ReportJsonData;
}

export interface ReportByFeatureResponse {
  status: string;
  status_code: number;
  message: string;
  data: ReportByFeatureData;
}

// Baseline Characteristics 항목 타입
export interface BaselineCharacteristicItem {
  group_name: string;
  full_cohort_n: number;
  full_cohort_pct: number;
  filtered_cohort_n: number;
  filtered_cohort_pct: number;
}

// Baseline Characteristics 카테고리 타입
export interface BaselineCharacteristicCategory {
  category: string;
  category_display: string;
  items: BaselineCharacteristicItem[];
}

// Patient Summary 응답 데이터 타입
export interface PatientSummaryData {
  number_analyzed: number;
  total_count: number;
  conversion_percent: number;
  conversion_label: string;
  full_cohort_n: number;
  filtered_cohort_n: number;
  baseline_characteristics: BaselineCharacteristicCategory[];
}

// API 응답 타입
export interface PatientSummaryResponse {
  status: string;
  status_code: number;
  message: string;
  data: PatientSummaryData;
}

/**
 * Patient Summary 조회 API 호출
 * Full Cohort / Filtered Cohort 인원 수 및 Baseline Characteristics N(%)를 조회합니다.
 *
 * @param taskId - OPMD Nexus 테이블 매핑용 task_id (필수)
 * @returns PatientSummaryResponse
 */
export const getPatientSummary = async (taskId: string): Promise<PatientSummaryResponse> => {
  return await fetcher<PatientSummaryResponse>(
    `api/nexus/subgroup/patient/summary/?task_id=${encodeURIComponent(taskId)}`,
    "GET",
    "Patient Summary 조회에 실패했습니다."
  );
};

// Subgroup Sets Summary 그룹 타입
export interface SubgroupSetGroup {
  group: string; // group1, group2, group3 등
  mean: number;
  ci_low: number;
  ci_high: number;
  name: string; // Disease Progression 등
}

// Subgroup Sets Summary 항목 타입
export interface SubgroupSetSummary {
  set_name: string;
  outcome: string; // FE 표시명 (예: ADAS Cog 11)
  month: number;
  entity_type: string; // 분석 엔티티 유형
  basis_type: string; // 분석 기준 유형
  cutoff_axis_type: string; // Cutoff 해석 축 유형: x_value, y_percent
  groups: SubgroupSetGroup[];
}

// Result Table 항목 타입
export interface ResultTableItem {
  subgroup_id: number;
  no: number;
  set_name: string;
  outcome: string;
  cut_off: string[]; // 배열 형태
  month: number;
  of_group: number;
  variance_benefit: number;
  variance_benefit_label: string; // "(Highest)" 등
  group_balance: string; // "OK(n min=148)" 등
  entity_type: string;
  basis_type: string;
  cutoff_axis_type: string;
  disease_progression_by_subgroup?: Array<{
    group: string;
    month: number;
    mean: number;
    ci_low: number;
    ci_high: number;
  }>;
  number_or_patient?: Array<{
    group: string;
    number: number;
  }>;
  variance_decomposition?: Array<{
    group: string;
    variance: number;
    number: number;
    vr: number;
    ci: string;
    eta_square: number;
    omega: number;
  }>;
  within_group_variance_by_subgroup?: Array<{
    group: string;
    number: number;
    variance: number;
    classification: string; // "low", "middle", "high"
    total_var: number;
  }>;
}

// Subgroup Summary List 응답 데이터 타입
export interface SubgroupSummaryListData {
  subgroup_sets_summary: SubgroupSetSummary[];
  result_table: ResultTableItem[];
}

// API 응답 타입
export interface SubgroupSummaryListResponse {
  status: string;
  status_code: number;
  message: string;
  data: SubgroupSummaryListData;
}

/**
 * Subgroup Sets Summary 목록 조회 API 호출
 * nexus_subgroup_set_summary 테이블을 조회하여 subgroup_sets_summary와 result_table을 반환합니다.
 *
 * @param taskId - nexus_group_manage의 task_id (필수)
 * @returns SubgroupSummaryListResponse
 */
export const getSubgroupSummaryList = async (
  taskId: string
): Promise<SubgroupSummaryListResponse> => {
  return await fetcher<SubgroupSummaryListResponse>(
    `api/nexus/subgroup/summary/list/?task_id=${encodeURIComponent(taskId)}`,
    "GET",
    "Subgroup Summary List 조회에 실패했습니다."
  );
};

export interface ExplainOverviewDescriptionItem {
  no: number;
  title: string;
  description: string;
  feature?: string;
}

export type ExplainOverviewDescription = {
  baseline_driver_top10_msg: ExplainOverviewDescriptionItem[];
} & Record<string, ExplainOverviewDescriptionItem[]>;

export interface ExplainExpectedTherapeuticGainItem {
  rank: number;
  variance_reduction: number;
  relative_contribution: number;
  cutoff: number[];
  risk_type: string;
  feature_name: string;
}

export interface ExplainBaselineDriverItem {
  rank: number;
  shap_value: string[];
  color_value: string[];
  feature_name: string;
}

export interface ExplainStratificationStrategyItem {
  feature: string;
  group: string;
  month: number;
  mean: number;
  ci_low: number;
  ci_high: number;
  n: number;
}

export interface ExplainScenarioCutoffItem {
  group: string;
  cutoff: string;
}

export interface ExplainScenarioMeta {
  feature: string;
  month: number;
  axis_type: IdentificationAxisType;
  n_groups: number;
  defined_groups: string[];
  cutoffs: ExplainScenarioCutoffItem[];
}

export interface ExplainHistogramFeatureData {
  bins: number[];
  groups: Record<string, number[]>;
}

export interface ExplainScatterPoint {
  x: number;
  y: number;
}

export interface ExplainScatterRegression {
  slope: number;
  intercept: number;
}

export interface ExplainScatterGroupData {
  points: ExplainScatterPoint[];
  regression?: ExplainScatterRegression;
}

export type ExplainBinRatioItem = {
  range: [number, number];
} & Record<string, number | [number, number]>;

export interface ExplainJsonData {
  overview_description: ExplainOverviewDescription;
  expected_therapeutic_gain: ExplainExpectedTherapeuticGainItem[];
  baseline_driver: ExplainBaselineDriverItem[];
  stratification_strategy: ExplainStratificationStrategyItem[];
  scenario_meta: ExplainScenarioMeta;
  explain_histogram: Record<string, ExplainHistogramFeatureData>;
  explain_scatter: Record<string, Record<string, ExplainScatterGroupData>>;
  explain_bin_ratio: Record<string, ExplainBinRatioItem[]>;
}

export interface ExplainListData {
  subgroup_id: number;
  set_name: string;
  outcome: string;
  month: number;
  explain_json: ExplainJsonData;
}

export interface ExplainListResponse {
  status: string;
  status_code: number;
  message: string;
  data: ExplainListData;
}

export const getExplainList = async (
  taskId: string,
  subgroupId: string
): Promise<ExplainListResponse> => {
  return await fetcher<ExplainListResponse>(
    `api/nexus/subgroup/explain/list/?task_id=${encodeURIComponent(taskId)}&subgroup_id=${encodeURIComponent(subgroupId)}`,
    "GET",
    "Subgroup Explain List 조회에 실패했습니다."
  );
};

export const getFeatureList = async (diseaseId: string, schemaName: string, tableName: string) => {
  return await fetcher(
    `api/nexus/subgroup/feature/list/?disease_id=${encodeURIComponent(diseaseId)}&schema_name=${encodeURIComponent(schemaName)}&table_name=${encodeURIComponent(tableName)}`,
    "GET",
    "Subgroup Feature List 조회에 실패했습니다."
  );
};

export const getReportByFeature = async (
  taskId: string,
  subgroupId: string,
  featureName: string
): Promise<ReportByFeatureResponse> => {
  const query = new URLSearchParams({
    task_id: taskId,
    subgroup_id: subgroupId,
    feature_name: featureName,
  });

  return await fetcher<ReportByFeatureResponse>(
    `api/nexus/subgroup/report/info/?${query.toString()}`,
    "GET",
    "Subgroup Report 정보 조회에 실패했습니다.",
    {
      cache: "no-store",
    }
  );
};

export const deleteSubgroupIdentification = async (taskId: string, subgroupId: string) => {
  return await fetcher(
    `api/nexus/subgroup/identification/delete/?task_id=${encodeURIComponent(taskId)}&subgroup_id=${encodeURIComponent(subgroupId)}`,
    "DELETE",
    "Subgroup Identification Cutoff 삭제에 실패했습니다."
  );
};

export interface IdentificationFeatureInfoRow {
  rid: string;
  month: number;
  [key: string]: string | number | null;
}

export type IdentificationAxisType = "x_value" | "y_percent";

type IdentificationAxisTagged<T extends IdentificationAxisType> =
  | {
      cutoff_axis_type: T;
      axis_type?: T;
    }
  | {
      axis_type: T;
      cutoff_axis_type?: T;
    }
  | {
      cutoff_axis_type: T;
      axis_type: T;
    };

interface IdentificationFeatureInfoDataBase {
  outcome: string;
  entity_type: string;
  basis_type: string;
  month: number;
  month_min: number;
  month_max: number;
  cutoff_raw_json: string[];
  cutoff_x: Array<string | number>;
  cutoff_y: Array<string | number>;
  rows: IdentificationFeatureInfoRow[];
  subgroup_id: number | string;
}

export type IdentificationFeatureInfoData =
  | (IdentificationFeatureInfoDataBase & IdentificationAxisTagged<"x_value">)
  | (IdentificationFeatureInfoDataBase & IdentificationAxisTagged<"y_percent">);

export interface IdentificationFeatureInfoResponse {
  status: string;
  status_code: number;
  message: string;
  data: IdentificationFeatureInfoData;
}

export interface IdentificationSetInfoDiseaseProgressionItem {
  group: string;
  month: number;
  mean: number;
  ci_low: number;
  ci_high: number;
  classification: string;
}

export interface IdentificationSetInfoSlopeDistributionItem {
  group: string;
  slope: number[];
}

export interface IdentificationSetInfoResultTableItem {
  no: number;
  group: string;
  patient_number: number;
  delta_outcome: string;
  cumulative_proportion: string;
}

export interface IdentificationSetInfoData {
  axis_type: IdentificationAxisType;
  cutoff_x: string[];
  cutoff_y: string[];
  disease_progression: IdentificationSetInfoDiseaseProgressionItem[];
  month: number;
  outcome: string;
  result_table: IdentificationSetInfoResultTableItem[];
  slope_distribution: IdentificationSetInfoSlopeDistributionItem[];
}

export interface IdentificationSetInfoResponse {
  status: string;
  status_code: number;
  message: string;
  data: IdentificationSetInfoData;
}

export const getIdentificationFeatureInfo = async (
  taskId: string,
  subgroupId: string,
  month: string
): Promise<IdentificationFeatureInfoResponse> => {
  const query = new URLSearchParams({
    task_id: taskId,
    subgroup_id: subgroupId,
    month: month,
  });

  return await fetcher<IdentificationFeatureInfoResponse>(
    `api/nexus/subgroup/identification/feature/info/?${query.toString()}`,
    "GET",
    "Subgroup Identification Feature Info 조회에 실패했습니다."
  );
};

export const getIdentificationSetInfo = async (
  taskId: string,
  subgroupId: string,
  month: string,
  axisType: "x_value" | "y_percent",
  cutoffX: string[],
  cutoffY: string[]
): Promise<IdentificationSetInfoResponse> => {
  const query = new URLSearchParams({
    task_id: taskId,
    subgroup_id: subgroupId,
    month,
    axis_type: axisType,
    cutoff_x: JSON.stringify(cutoffX),
    cutoff_y: JSON.stringify(cutoffY),
  });

  return await fetcher<IdentificationSetInfoResponse>(
    `api/nexus/subgroup/identification/set/info/?${query.toString()}`,
    "GET",
    "Subgroup Identification Set Info 조회에 실패했습니다."
  );
};

export const saveSubgroupIdentification = async (
  subgroupId: string,
  cutoffAxisType: "x_value" | "y_percent",
  cutoffRawVersion: string,
  cutoffX: string[],
  cutoffY: string[]
) => {
  return await fetcher(
    `api/nexus/subgroup/identification/save`,
    "PUT",
    "Subgroup Identification Cutoff 저장에 실패했습니다.",
    {
      body: {
        subgroup_id: subgroupId,
        cutoff_axis_type: cutoffAxisType,
        cutoffRawVersion: cutoffRawVersion,
        cutoffX: cutoffX.toString(),
        cutoffY: cutoffY.toString(),
      },
    }
  );
};
