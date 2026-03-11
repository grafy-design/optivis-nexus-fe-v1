export interface DRDServiceResponse<TData> {
  status: string;
  status_code: number;
  message: string;
  data: TData;
}

export type DRDConditionValue = string | number | boolean | null;

export interface DRDConditionClause {
  value: DRDConditionValue;
  column: string;
  operator: string;
}

export interface DRDConditionAndGroup {
  and: DRDConditionNode[];
}

export interface DRDConditionOrGroup {
  or: DRDConditionNode[];
}

export type DRDConditionNode = DRDConditionClause | DRDConditionAndGroup | DRDConditionOrGroup;

export type DRDRequestPrimitive = string | number | boolean;
export type DRDRequestValue = DRDRequestPrimitive | null | undefined;
export type DRDRequestQuery = Record<string, DRDRequestValue | DRDRequestValue[]>;
export type DRDRequestBody = Record<string, unknown>;
export type DRDCutoffAxisType = "x_value" | "y_percent";

export interface GetDiseaseDataListRequest {
  query?: DRDRequestQuery;
}

export interface GetGroupManageInfoRequest {
  entity_type: string;
  task_id?: string;
  disease_id?: DRDRequestPrimitive;
  data_id?: DRDRequestPrimitive;
  query?: DRDRequestQuery;
}

export interface InsertGroupManageTaskRequest {
  entity_type: string;
  body: {
    disease_id: number;
    data_id: number;
    label: string;
    condition_raw_version: number;
    condition_raw_json: string;
  };
}

export interface GetDrdTaskSummaryRequest {
  task_id: string;
}

export interface GetDrdPatientInfoRequest {
  task_id: string;
}

export interface GetDrdGroupManageFilterInfoRequest {
  task_id: string;
}

export interface GetDrdSubgroupsListRequest {
  task_id: string;
}

export interface GetDrdMedicalHistoryInfoRequest {
  task_id: string;
}

export interface ClearDrdPatientInfoRequest {
  task_id: string;
}

export interface ClearDrdGroupManageFilterRequest {
  task_id: string;
}

export interface ClearDrdSubgroupsRequest {
  task_id: string;
}

export interface ClearDrdMedicalHistoryRequest {
  task_id: string;
}

export interface SaveDrdPatientInfoRequest {
  task_id: string;
  measurement: string;
  control_variable_type: "Value" | "Trend";
  filter_condition: string;
}

export interface SaveDrdGroupManageFilterRequest {
  task_id: string;
  condition_raw_json: string;
  condition_raw_version: number;
}

export interface SaveDrdSubgroupsRequest {
  task_id: string;
  subgroup_id: number;
  set_name: string;
  outcome: string;
  cutoff_axis_type: DRDCutoffAxisType;
  cutoff_raw_version: number;
  cutoff_raw_json: string[];
  month: number;
}

export interface SaveDrdMedicalHistoryRequest {
  task_id: string;
  filter: string[];
  diagnosis: string[];
  risk_factor: string[];
  comorbidity: string[];
}

export interface GetDiseaseFeatureListRequest {
  disease_id: number;
}

export interface GetDiseaseDrugListRequest {
  disease_id: number;
}

export interface GetSmilesListRequest {
  smiles: string;
  threshold: number;
  max_records: number;
  sort?: "relevance" | "similarity";
}

export interface SmilesListResultItem {
  similarity: number | string;
  drug_name: string;
  smiles?: string;
  SMILES?: string;
  mf?: string;
  MF?: string;
  mw?: string;
  MW?: string;
  smiles_image?: string | null;
  image_url?: string | null;
  iupac_name?: string;
  IUPAC_name?: string;
  compound_cid?: string;
  compound_CID?: string;
  inchi_key?: string;
  InChIKey?: string;
  inchi?: string;
  InChI?: string;
}

export interface SmilesListData {
  query: string;
  threshold: number;
  results: SmilesListResultItem[];
}

export type SmilesListResponse = DRDServiceResponse<SmilesListData>;

export interface DRDSimulationMeta {
  global_seed: number;
  profile_name: string;
  schema_version: string;
  generator_version: string;
  [key: string]: unknown;
}

export interface DRDSimulationDrugIntervention {
  type: "drug";
  drug_name: string;
  dose: number;
  start_month: number;
  end_month: number;
  [key: string]: unknown;
}

export type DRDSimulationIntervention = DRDSimulationDrugIntervention;

export interface DRDSimulationScenario {
  scenario_id: string;
  scenario_version: string;
  description: string;
  interventions: DRDSimulationIntervention[];
  [key: string]: unknown;
}

export interface SaveDrdSimulationConditionRequest {
  task_id: string;
  fe_snapshot: Record<string, unknown>;
  ml_payload: DRDSimulationConditionMLPayload;
}

export interface ClearDrdSimulationConditionRequest {
  entity_type: string;
  task_id: string;
}

export interface GetDrdSimulationConditionInfoRequest {
  entity_type: string;
  task_id: string;
}

export type PlayDrdSimulationIntervention = DRDSimulationIntervention;
export type PlayDrdSimulationScenario = DRDSimulationScenario;

export interface PlayDrdSimulationRequest {
  company_id: number;
  task_id: string;
}

export type PlayDrdSimulationSeriesRow = Record<string, unknown>;

export interface PlayDrdSimulationTrajectoryTargetLine {
  value: number;
  label: string;
  [key: string]: unknown;
}

export interface PlayDrdSimulationTrajectoryVerticalEvent {
  month: number;
  label: string;
  [key: string]: unknown;
}

export interface PlayDrdSimulationTrajectoryMeta {
  x_label: string;
  y_label: string;
  target_line?: PlayDrdSimulationTrajectoryTargetLine | null;
  vertical_events?: PlayDrdSimulationTrajectoryVerticalEvent[];
  [key: string]: unknown;
}

export interface PlayDrdSimulationTrajectoryPoint {
  month: number;
  strategy: string;
  y: number;
  [key: string]: unknown;
}

export interface PlayDrdSimulationNonResponderMeta {
  title: string;
  description: string;
}

export interface PlayDrdSimulationNonResponderFeature {
  rank: number;
  feature_condition: string;
  impact_score: number;
}

export interface PlayDrdSimulationNonResponderStrategy {
  strategy: string;
  data: PlayDrdSimulationNonResponderFeature[];
}

export interface PlayDrdSimulationNonResponderIdentificationData {
  meta: PlayDrdSimulationNonResponderMeta;
  strategies: PlayDrdSimulationNonResponderStrategy[];
}

export interface PlayDrdSimulationData {
  meta?: PlayDrdSimulationTrajectoryMeta | null;
  trajectory?: PlayDrdSimulationTrajectoryPoint[] | null;
  strategy_output: PlayDrdSimulationSeriesRow[];
  primary_outcome_summary: PlayDrdSimulationSeriesRow[];
  simulated_trajectory: PlayDrdSimulationSeriesRow[];
  simulated_trajectory_stats: PlayDrdSimulationSeriesRow[];
  counterfactual_comparison: PlayDrdSimulationSeriesRow[];
  safety_tradeoff: PlayDrdSimulationSeriesRow[];
  ae_risk: PlayDrdSimulationSeriesRow[];
  safety_tradeoff_ranking:
    | PlayDrdSimulationSeriesRow[]
    | PlayDrdSimulationNonResponderIdentificationData
    | null;
  non_responder_identification?: PlayDrdSimulationNonResponderIdentificationData | null;
}

export type PlayDrdSimulationResponse = DRDServiceResponse<PlayDrdSimulationData>;

export interface DiseaseDataSourceItem {
  data_id: number;
  disease_id: number;
  data_name: string;
  schema_name: string;
  table_name: string;
  patient_count: number;
  update_date: string;
}

export interface DiseaseDataListData {
  disease_id: number;
  results: DiseaseDataSourceItem[];
}

export type DiseaseDataListResponse = DRDServiceResponse<DiseaseDataListData>;

export interface GroupManageInfoData {
  id: number;
  company_id: number;
  disease_id: number;
  data_id: number;
  task_id: string;
  owner: string;
  entity_type: string;
  current_step: number;
  current_status: string;
  condition_raw_version: number;
  condition_raw_json: string;
  condition_snapshot_json: DRDConditionAndGroup | DRDConditionOrGroup;
  label: string;
  fail_message: string | null;
  created_at: string;
  updated_at: string;
}

export type GroupManageInfoResponse = DRDServiceResponse<GroupManageInfoData>;

export interface DRDPatientInfoData {
  id: number;
  company_id: number;
  task_id: string;
  owner: string;
  measurement: string;
  control_variable_type: string;
  filter_condition: string;
  snapshot_json: DRDConditionClause | DRDConditionAndGroup | DRDConditionOrGroup;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

export type DRDPatientInfoResponse = DRDServiceResponse<DRDPatientInfoData>;

export type DRDGroupManageFilterInfoData = GroupManageInfoData;
export type DRDGroupManageFilterInfoResponse = DRDServiceResponse<DRDGroupManageFilterInfoData>;

export interface DRDSubgroupCutoffCondition {
  value: string | number;
  condition: string;
}

export interface DRDSubgroupCutoffSnapshot {
  conditions: DRDSubgroupCutoffCondition[];
}

export interface DRDSubgroupChildItem {
  set_name: string;
  classification: string;
  cut_off: string;
  cut_off_display: string;
  group_balance: string;
  is_selected: boolean;
  outcome: string;
  month: number;
  id?: number;
  owner?: string;
  cutoff_snapshot_json?: DRDSubgroupCutoffSnapshot | null;
  cutoff_axis_type: DRDCutoffAxisType;
  created_at?: string;
  updated_at?: string;
}

export interface DRDSubgroupItem {
  id: number;
  set_name: string;
  outcome: string;
  cut_off: string[];
  month: number;
  of_group: number;
  group_balance: string;
  updated_at: string;
  children: DRDSubgroupChildItem[];
}

export type DRDSubgroupsListResponse = DRDServiceResponse<DRDSubgroupItem[]>;

export interface DRDMedicalHistoryInfoData {
  id: number;
  company_id: number;
  task_id: string;
  owner: string;
  cutoff_axis_type: "x_value" | "y_percent";
  filter: string[];
  diagnosis: string[];
  risk_factor: string[];
  comorbidity: string[];
  snapshot_json: DRDConditionAndGroup | DRDConditionOrGroup;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

export type DRDMedicalHistoryInfoResponse = DRDServiceResponse<DRDMedicalHistoryInfoData>;

export interface DRDTaskSummaryData {
  total_patient_count: number;
  filtered_patient_count: number;
  ratio: number;
  ratio_percent: number;
  medical_history_info: DRDMedicalHistoryInfoData | null;
  patient_info: DRDPatientInfoData | null;
  group_manage_info: GroupManageInfoData | null;
  subgroups: DRDSubgroupItem[];
  filter_skipped_columns: string[];
  applied_filter_merged_json: DRDConditionAndGroup | DRDConditionOrGroup | null;
  applied_filter_snapshot: DRDConditionAndGroup | DRDConditionOrGroup | null;
  applied_filter_sql: string | null;
  applied_filter_params: DRDConditionValue[];
  applied_filter_sql_inlined: string | null;
}

export type DRDTaskSummaryResponse = DRDServiceResponse<DRDTaskSummaryData>;

export interface DiseaseListItem {
  id: number;
  disease: string;
  display_value: string;
  is_default: boolean;
  order: number;
}

export type DiseaseListResponse = DRDServiceResponse<DiseaseListItem[]>;

export interface DiseaseFeatureItem {
  id: number;
  disease_id: number;
  major_category: string;
  sub_category: string;
  item_name: string;
  column_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type DiseaseFeatureSubCategoryMap = Record<string, DiseaseFeatureItem[]>;
export type DiseaseFeatureCategoryMap = Record<string, DiseaseFeatureSubCategoryMap>;

export interface DiseaseFeatureListData {
  disease_id: number;
  features: DiseaseFeatureCategoryMap;
}

export type DiseaseFeatureListResponse = DRDServiceResponse<DiseaseFeatureListData>;

export interface DiseaseDrugItem {
  id: number;
  disease_id: number;
  drug_name: string;
  atc_code: string;
  atc_lv5_description: string;
  column_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiseaseDrugListData {
  disease_id: number;
  results: DiseaseDrugItem[];
}

export type DiseaseDrugListResponse = DRDServiceResponse<DiseaseDrugListData>;

export interface DRDSimulationConditionMLPayload {
  meta: DRDSimulationMeta;
  scenarios: DRDSimulationScenario[];
  [key: string]: unknown;
}

export interface DRDSimulationConditionInfoData {
  id: number;
  company_id: number;
  task_id: string;
  owner: string;
  entity_type: string;
  is_selected: boolean;
  scenario_count: number;
  fe_snapshot_text: Record<string, unknown>;
  final_condition_json: DRDConditionAndGroup | DRDConditionOrGroup;
  ml_payload_json: DRDSimulationConditionMLPayload;
  created_at: string;
  updated_at: string;
}

export type DRDSimulationConditionInfoResponse = DRDServiceResponse<DRDSimulationConditionInfoData>;
