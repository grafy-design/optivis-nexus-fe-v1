import { fetcher } from "@/lib/fetcher";

type DRDQueryPrimitive = string | number | boolean;
type DRDQueryValue = DRDQueryPrimitive | null | undefined;

export type DRDQuery = Record<string, DRDQueryValue | DRDQueryValue[]>;

const appendQueryValue = (searchParams: URLSearchParams, key: string, value: DRDQueryValue) => {
  if (value === null || value === undefined) return;
  searchParams.append(key, String(value));
};

const withQuery = (basePath: string, query?: DRDQuery): string => {
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
export const getDiseaseDataList = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/disease/data/list/", query),
    "GET",
    "Disease 원본 데이터 목록 조회에 실패했습니다."
  );
};

export const getGroupManageInfo = async (
  entityType: string,
  query?: DRDQuery
): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery(`api/nexus/group-manage/${encodeURIComponent(entityType)}/info/`, query),
    "GET",
    "Group Manage 최근 task 조회에 실패했습니다."
  );
};

export const insertGroupManageTask = async (
  entityType: string,
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery(`api/nexus/group-manage/${encodeURIComponent(entityType)}/insert/`, query);
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

export const getDrdTaskSummary = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/task/summary/", query),
    "GET",
    "DRD Task 요약 조회에 실패했습니다."
  );
};

// 2) DRD 정보 조회 (Load)
export const getDrdPatientInfo = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/patient-info/info/", query),
    "GET",
    "DRD 환자 정보 조회에 실패했습니다."
  );
};

export const getDrdGroupManageFilterInfo = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/group-manage-filter/info/", query),
    "GET",
    "DRD group-manage 필터 조회에 실패했습니다."
  );
};

export const getDrdSubgroupsList = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/subgroups/list/", query),
    "GET",
    "DRD 서브그룹 목록 조회에 실패했습니다."
  );
};

export const getDrdMedicalHistoryInfo = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/drd/medical-history/info/", query),
    "GET",
    "DRD 병력 정보 조회에 실패했습니다."
  );
};

// 3) DRD 비활성화 (Clear)
export const clearDrdPatientInfo = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/patient-info/clear/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PATCH", "DRD 환자 정보 비활성화에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PATCH",
    "DRD 환자 정보 비활성화에 실패했습니다.",
    withJsonBody(body)
  );
};

export const clearDrdGroupManageFilter = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/group-manage-filter/clear/", query);
  if (body === undefined) {
    return await fetcher<unknown>(
      url,
      "PATCH",
      "DRD group-manage 필터 비활성화에 실패했습니다."
    );
  }
  return await fetcher<unknown>(
    url,
    "PATCH",
    "DRD group-manage 필터 비활성화에 실패했습니다.",
    withJsonBody(body)
  );
};

export const clearDrdSubgroups = async (body?: unknown, query?: DRDQuery): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/subgroups/clear/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PATCH", "DRD 고위험 서브그룹 비활성화에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PATCH",
    "DRD 고위험 서브그룹 비활성화에 실패했습니다.",
    withJsonBody(body)
  );
};

export const clearDrdMedicalHistory = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/medical-history/clear/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PATCH", "DRD 병력 정보 비활성화에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PATCH",
    "DRD 병력 정보 비활성화에 실패했습니다.",
    withJsonBody(body)
  );
};

// 4) DRD 저장 (Save)
export const saveDrdPatientInfo = async (body?: unknown, query?: DRDQuery): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/patient-info/save/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PUT", "DRD 환자 정보 저장에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 환자 정보 저장에 실패했습니다.",
    withJsonBody(body)
  );
};

export const saveDrdGroupManageFilter = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/group-manage-filter/save/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PUT", "DRD group-manage 필터 저장에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD group-manage 필터 저장에 실패했습니다.",
    withJsonBody(body)
  );
};

export const saveDrdSubgroups = async (body?: unknown, query?: DRDQuery): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/subgroups/save/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PUT", "DRD 고위험 서브그룹 저장에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 고위험 서브그룹 저장에 실패했습니다.",
    withJsonBody(body)
  );
};

export const saveDrdMedicalHistory = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/medical-history/save/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PUT", "DRD 병력 정보 저장에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 병력 정보 저장에 실패했습니다.",
    withJsonBody(body)
  );
};

// 5) Disease / SMILES / Simulation
export const getDiseaseList = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/disease/list/", query),
    "GET",
    "Disease 목록 조회에 실패했습니다."
  );
};

export const getDiseaseFeatureList = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/disease/feature/list/", query),
    "GET",
    "Disease Feature 목록 조회에 실패했습니다."
  );
};

export const getDiseaseDrugList = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/disease/drug/list/", query),
    "GET",
    "Disease 약물 목록 조회에 실패했습니다."
  );
};

export const getSmilesList = async (body?: unknown, query?: DRDQuery): Promise<unknown> => {
  const url = withQuery("api/nexus/smiles/list/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "POST", "SMILES 유사 화합물 검색 목록 조회에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "POST",
    "SMILES 유사 화합물 검색 목록 조회에 실패했습니다.",
    withJsonBody(body)
  );
};

export const saveDrdSimulationCondition = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/group-manage/drd/simulation-condition/save/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PUT", "DRD 시뮬레이션 조건 저장에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PUT",
    "DRD 시뮬레이션 조건 저장에 실패했습니다.",
    withJsonBody(body)
  );
};

export const clearDrdSimulationCondition = async (
  body?: unknown,
  query?: DRDQuery
): Promise<unknown> => {
  const url = withQuery("api/nexus/group-manage/drd/simulation-condition/clear/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "PATCH", "DRD 시뮬레이션 조건 비활성화에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "PATCH",
    "DRD 시뮬레이션 조건 비활성화에 실패했습니다.",
    withJsonBody(body)
  );
};

export const getDrdSimulationConditionInfo = async (query?: DRDQuery): Promise<unknown> => {
  return await fetcher<unknown>(
    withQuery("api/nexus/group-manage/drd/simulation-condition/info/", query),
    "GET",
    "DRD 시뮬레이션 조건 조회에 실패했습니다."
  );
};

export const playDrdSimulation = async (body?: unknown, query?: DRDQuery): Promise<unknown> => {
  const url = withQuery("api/nexus/drd/simulation/play/", query);
  if (body === undefined) {
    return await fetcher<unknown>(url, "POST", "DRD 시뮬레이션 실행에 실패했습니다.");
  }
  return await fetcher<unknown>(
    url,
    "POST",
    "DRD 시뮬레이션 실행에 실패했습니다.",
    withJsonBody(body)
  );
};
