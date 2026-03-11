import { fetcher } from "@/lib/fetcher";
import type {
  ExplainListResponse,
  IdentificationAxisType,
  IdentificationFeatureInfoResponse,
  IdentificationSetInfoResponse,
  PatientSummaryResponse,
  ReportByFeatureResponse,
  SubgroupSummaryListResponse,
} from "./types/subgroup-service.types";

export type * from "./types/subgroup-service.types";

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
  axisType: IdentificationAxisType,
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
  subgroupId: number,
  cutoffAxisType: IdentificationAxisType,
  cutoffRawVersion: number,
  cutoffX: string[],
  cutoffY: string[],
  month: number
) => {
  return await fetcher(
    `api/nexus/subgroup/identification/save/`,
    "PUT",
    "Subgroup Identification Cutoff 저장에 실패했습니다.",
    {
      headers: {
        "content-type": "application/json",
      },
      body: {
        subgroup_id: subgroupId,
        cutoff_axis_type: cutoffAxisType,
        cutoff_raw_version: cutoffRawVersion,
        cutoff_x: cutoffX,
        cutoff_y: cutoffY,
        month,
      },
    }
  );
};
