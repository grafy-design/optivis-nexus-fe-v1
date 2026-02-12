const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://nexus.oprimed.com";

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
export const getPatientSummary = async (
  taskId: string
): Promise<PatientSummaryResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/nexus/subgroup/patient/summary/?task_id=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        // CORS 문제 해결을 위한 옵션
        mode: "cors",
        credentials: "omit",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // API 응답 오류
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // 네트워크 에러 상세 정보
      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        // 네트워크 에러 상세
        throw new Error(
          `네트워크 연결에 실패했습니다. 서버(${API_BASE_URL})에 연결할 수 없습니다. ` +
            `CORS 문제이거나 서버가 응답하지 않을 수 있습니다.`
        );
      }

      // Patient Summary API 호출 실패
      throw error;
    }

    // Patient Summary API 호출 실패
    throw new Error("Patient Summary 조회에 실패했습니다.");
  }
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
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/nexus/subgroup/summary/list/?task_id=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        // CORS 문제 해결을 위한 옵션
        mode: "cors",
        credentials: "omit",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // API 응답 오류
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // 네트워크 에러 상세 정보
      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        // 네트워크 에러 상세
        throw new Error(
          `네트워크 연결에 실패했습니다. 서버(${API_BASE_URL})에 연결할 수 없습니다. ` +
            `CORS 문제이거나 서버가 응답하지 않을 수 있습니다.`
        );
      }

      // Subgroup Summary List API 호출 실패
      throw error;
    }

    // Subgroup Summary List API 호출 실패
    throw new Error("Subgroup Summary List 조회에 실패했습니다.");
  }
};
