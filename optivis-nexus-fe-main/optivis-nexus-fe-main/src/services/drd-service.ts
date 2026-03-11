import { fetcher } from "@/lib/fetcher";
import type {
  ClearDrdGroupManageFilterRequest,
  ClearDrdMedicalHistoryRequest,
  ClearDrdPatientInfoRequest,
  ClearDrdSimulationConditionRequest,
  ClearDrdSubgroupsRequest,
  DRDGroupManageFilterInfoResponse,
  DRDMedicalHistoryInfoResponse,
  DRDPatientInfoResponse,
  DRDRequestQuery,
  DRDSimulationConditionInfoResponse,
  DRDSubgroupsListResponse,
  DRDTaskSummaryResponse,
  DiseaseDataListResponse,
  DiseaseDrugListResponse,
  DiseaseFeatureListResponse,
  DiseaseListResponse,
  GetDiseaseDataListRequest,
  GetDiseaseDrugListRequest,
  GetDiseaseFeatureListRequest,
  GetDrdGroupManageFilterInfoRequest,
  GetDrdMedicalHistoryInfoRequest,
  GetDrdPatientInfoRequest,
  GetDrdSimulationConditionInfoRequest,
  GetDrdSubgroupsListRequest,
  GetDrdTaskSummaryRequest,
  GetGroupManageInfoRequest,
  GetSmilesListRequest,
  GroupManageInfoResponse,
  SmilesListResponse,
  InsertGroupManageTaskRequest,
  PlayDrdSimulationRequest,
  PlayDrdSimulationResponse,
  SaveDrdGroupManageFilterRequest,
  SaveDrdMedicalHistoryRequest,
  SaveDrdPatientInfoRequest,
  SaveDrdSimulationConditionRequest,
  SaveDrdSubgroupsRequest,
} from "./types/drd-service.types";

type DRDQueryPrimitive = string | number | boolean;
type DRDQueryValue = DRDQueryPrimitive | null | undefined;

export type DRDQuery = DRDRequestQuery;
export type * from "./types/drd-service.types";

const appendQueryValue = (searchParams: URLSearchParams, key: string, value: DRDQueryValue) => {
  if (value === null || value === undefined) return;
  searchParams.append(key, String(value));
};

const withQuery = (basePath: string, query?: DRDRequestQuery): string => {
  if (!query) return basePath;

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, rawValue]) => {
    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => appendQueryValue(searchParams, key, value));
      return;
    }
    appendQueryValue(searchParams, key, rawValue);
  });

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

const withJsonBody = (body: unknown) => ({
  headers: {
    "content-type": "application/json",
  },
  body,
});

// 1) 공통/초기 조회
export const getDiseaseDataList = async ({
  query,
}: GetDiseaseDataListRequest = {}): Promise<DiseaseDataListResponse> => {
  return await fetcher<DiseaseDataListResponse>(
    withQuery("api/nexus/disease/data/list/", query),
    "GET",
    "Disease 원본 데이터 목록 조회에 실패했습니다."
  );
};

export const getGroupManageInfo = async ({
  entity_type,
  task_id,
  disease_id,
  data_id,
  query,
}: GetGroupManageInfoRequest): Promise<GroupManageInfoResponse> => {
  const basePath = task_id
    ? `api/nexus/group-manage/${encodeURIComponent(entity_type)}/info/${encodeURIComponent(task_id)}/`
    : `api/nexus/group-manage/${encodeURIComponent(entity_type)}/info/`;

  const mergedQuery: DRDRequestQuery | undefined =
    query || disease_id !== undefined || data_id !== undefined
      ? {
          ...(query ?? {}),
          ...(disease_id !== undefined ? { disease_id } : {}),
          ...(data_id !== undefined ? { data_id } : {}),
        }
      : undefined;

  return await fetcher<GroupManageInfoResponse>(
    withQuery(basePath, mergedQuery),
    "GET",
    "Group Manage 최근 task 조회에 실패했습니다."
  );
};

export const insertGroupManageTask = async ({
  entity_type,
  body,
}: InsertGroupManageTaskRequest): Promise<unknown> => {
  const url = withQuery(`api/nexus/group-manage/${encodeURIComponent(entity_type)}/insert/`);
  if (body === undefined) {
    return await fetcher<unknown>(url, "POST", "Group Manage task 생성에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "POST",
    "Group Manage task 생성에 실패했습니다.",
    withJsonBody(body)
  );
};

export const getDrdTaskSummary = async ({
  task_id,
}: GetDrdTaskSummaryRequest): Promise<DRDTaskSummaryResponse> => {
  return await fetcher<DRDTaskSummaryResponse>(
    withQuery("api/nexus/drd/task/summary/", { task_id }),
    "GET",
    "DRD Task 요약 조회에 실패했습니다."
  );
};

// 2) DRD 정보 조회 (Load)
export const getDrdPatientInfo = async ({
  task_id,
}: GetDrdPatientInfoRequest): Promise<DRDPatientInfoResponse> => {
  return await fetcher<DRDPatientInfoResponse>(
    withQuery("api/nexus/drd/patient-info/info/", { task_id }),
    "GET",
    "DRD 환자 정보 조회에 실패했습니다."
  );
};

export const getDrdGroupManageFilterInfo = async ({
  task_id,
}: GetDrdGroupManageFilterInfoRequest): Promise<DRDGroupManageFilterInfoResponse> => {
  return await fetcher<DRDGroupManageFilterInfoResponse>(
    withQuery("api/nexus/drd/group-manage-filter/info/", { task_id }),
    "GET",
    "DRD group-manage 필터 조회에 실패했습니다."
  );
};

export const getDrdSubgroupsList = async ({
  task_id,
}: GetDrdSubgroupsListRequest): Promise<DRDSubgroupsListResponse> => {
  return await fetcher<DRDSubgroupsListResponse>(
    withQuery("api/nexus/drd/subgroups/list/", { task_id }),
    "GET",
    "DRD 서브그룹 목록 조회에 실패했습니다."
  );
};

export const getDrdMedicalHistoryInfo = async ({
  task_id,
}: GetDrdMedicalHistoryInfoRequest): Promise<DRDMedicalHistoryInfoResponse> => {
  return await fetcher<DRDMedicalHistoryInfoResponse>(
    withQuery("api/nexus/drd/medical-history/info/", { task_id }),
    "GET",
    "DRD 병력 정보 조회에 실패했습니다."
  );
};

// 3) DRD 비활성화 (Clear)
export const clearDrdPatientInfo = async (
  request: ClearDrdPatientInfoRequest
): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/patient-info/clear/", {
      task_id: request.task_id,
    }),
    "PATCH",
    "DRD 환자 정보 비활성화에 실패했습니다."
  );
};

export const clearDrdGroupManageFilter = async (
  request: ClearDrdGroupManageFilterRequest
): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/group-manage-filter/clear/", {
      task_id: request.task_id,
    }),
    "PATCH",
    "DRD group-manage 필터 비활성화에 실패했습니다."
  );
};

export const clearDrdSubgroups = async (request: ClearDrdSubgroupsRequest): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/subgroups/clear/", {
      task_id: request.task_id,
    }),
    "PATCH",
    "DRD 고위험 서브그룹 비활성화에 실패했습니다."
  );
};

export const clearDrdMedicalHistory = async (
  request: ClearDrdMedicalHistoryRequest
): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/medical-history/clear/", {
      task_id: request.task_id,
    }),
    "PATCH",
    "DRD 병력 정보 비활성화에 실패했습니다."
  );
};

// 4) DRD 저장 (Save)
export const saveDrdPatientInfo = async (request: SaveDrdPatientInfoRequest): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/patient-info/save/");
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 환자 정보 저장에 실패했습니다.",
    withJsonBody(request)
  );
};

export const saveDrdGroupManageFilter = async (
  request: SaveDrdGroupManageFilterRequest
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/group-manage-filter/save/");
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD group-manage 필터 저장에 실패했습니다.",
    withJsonBody(request)
  );
};

export const saveDrdSubgroups = async (request: SaveDrdSubgroupsRequest): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/subgroups/save/");
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 고위험 서브그룹 저장에 실패했습니다.",
    withJsonBody(request)
  );
};

export const saveDrdMedicalHistory = async (
  request: SaveDrdMedicalHistoryRequest
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/medical-history/save/");
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 병력 정보 저장에 실패했습니다.",
    withJsonBody(request)
  );
};

// 5) Disease / SMILES / Simulation
export const getDiseaseList = async (): Promise<DiseaseListResponse> => {
  return await fetcher<DiseaseListResponse>(
    withQuery("api/nexus/disease/list/"),
    "GET",
    "Disease 목록 조회에 실패했습니다."
  );
};

export const getDiseaseFeatureList = async ({
  disease_id,
}: GetDiseaseFeatureListRequest): Promise<DiseaseFeatureListResponse> => {
  return await fetcher<DiseaseFeatureListResponse>(
    withQuery("api/nexus/disease/feature/list/", { disease_id }),
    "GET",
    "Disease Feature 목록 조회에 실패했습니다."
  );
};

export const getDiseaseDrugList = async ({
  disease_id,
}: GetDiseaseDrugListRequest): Promise<DiseaseDrugListResponse> => {
  return await fetcher<DiseaseDrugListResponse>(
    withQuery("api/nexus/disease/drug/list/", { disease_id }),
    "GET",
    "Disease 약물 목록 조회에 실패했습니다."
  );
};

export const getSmilesList = async (
  request: GetSmilesListRequest
): Promise<SmilesListResponse> => {
  const url = withQuery("api/nexus/smiles/list/");
  return await fetcher<SmilesListResponse>(
    url,
    "POST",
    "SMILES 유사 화합물 검색 목록 조회에 실패했습니다.",
    withJsonBody(request)
  );
};

export const saveDrdSimulationCondition = async (
  request: SaveDrdSimulationConditionRequest
): Promise<unknown> => {
  const url = withQuery("api/nexus/group-manage/drd/simulation-condition/save/");
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 시뮬레이션 조건 저장에 실패했습니다.",
    withJsonBody(request)
  );
};

export const clearDrdSimulationCondition = async (
  request: ClearDrdSimulationConditionRequest
): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/group-manage/drd/simulation-condition/clear/", {
      entity_type: request.entity_type,
      task_id: request.task_id,
    }),
    "PATCH",
    "DRD 시뮬레이션 조건 비활성화에 실패했습니다."
  );
};

export const getDrdSimulationConditionInfo = async ({
  entity_type,
  task_id,
}: GetDrdSimulationConditionInfoRequest): Promise<DRDSimulationConditionInfoResponse> => {
  return await fetcher<DRDSimulationConditionInfoResponse>(
    withQuery("api/nexus/group-manage/drd/simulation-condition/info/", { entity_type, task_id }),
    "GET",
    "DRD 시뮬레이션 조건 조회에 실패했습니다."
  );
};

export const playDrdSimulation = async (
  request: PlayDrdSimulationRequest
): Promise<PlayDrdSimulationResponse> => {
  const url = withQuery("api/nexus/drd/simulation/play/");
  return await fetcher<PlayDrdSimulationResponse>(
    url,
    "POST",
    "DRD 시뮬레이션 실행에 실패했습니다.",
    withJsonBody(request)
  );
};

