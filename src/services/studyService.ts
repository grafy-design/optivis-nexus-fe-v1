const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://nexus.oprimed.com";

// API 응답 타입 정의
export interface StudyResult {
  id: number;
  task_id: string;
  designed_method: "OPTIVIS" | "Traditional";
  enrollment: number;
  primary_endpoint_power: number;
  primary_endpoint: string;
  treatment_group_1: number | null;
  treatment_group_2: number | null;
  treatment_group_3: number | null;
  control_group: number;
  total_patient: number;
  n_to_screen: number;
  cost: number;
  secondary_endpoint_power: number | null;
  secondary_endpoint: string | null;
  created_at: string;
  updated_at: string;
}

// Primary Endpoint 데이터 구조
export interface PrimaryEndpointData {
  no: number; // Primary 그룹 번호 (양수, 필수)
  multiplicity?: string; // 유의수준 조정 방법 (Bonferroni, Holm, 기본값: Bonferroni)
  statistical_method?: string; // 통계 방법 (ANCOVA, CMH, 기본값: ANCOVA)
  endpoint_objectives?: string[]; // Primary 타입 배열 (Confirmatory, Exploratory, 기본값: ["Confirmatory"])
  outcome: string[]; // Primary Endpoint 배열 (최대 5개, 필수)
  type: string[]; // Endpoint 변수 타입 배열 (Binary, Continous, 필수)
  effect_size: number[]; // 예상 효과 크기 배열 (필수)
  threshold?: number | null; // Binary 타입 시 임계값 (단일 float). 없으면 null
  alpha?: number; // 유의수준 (0~1 범위, 기본값: 0.05)
  target_power: number[]; // 명목 검정력 배열 (0~1 범위, 필수)
}

// Secondary Endpoint 데이터 구조
export interface SecondaryEndpointData {
  no: number; // Secondary 그룹 번호 (양수, 필수)
  multiplicity?: string; // 유의수준 조정 방법 (Bonferroni, Holm, 기본값: Bonferroni)
  statistical_method?: string; // 통계 방법 (ANCOVA, CMH, 기본값: ANCOVA)
  endpoint_objectives?: string[]; // Secondary 타입 배열 (Confirmatory, Exploratory)
  outcome?: string[]; // Secondary Endpoint 배열 (최대 5개)
  type?: string[]; // Secondary Endpoint 변수 타입 배열 (Binary, Continous)
  effect_size?: number[]; // Secondary 예상 효과 크기 배열
  threshold?: number | null; // Binary 타입 시 임계값 (단일 float). 없으면 null
  alpha?: number; // 유의수준 (0~1 범위, 기본값: 0.05)
  target_power?: number[]; // Secondary 명목 검정력 배열 (0~1 범위)
}

export interface StudyParameters {
  disease_area: string; // 질병 영역 (기본값: Alzheimer)
  treatment_duration: number; // 치료 기간 (단위: 개월, >0, 3의 배수, 기본값: 12)
  treatment_arms: number; // 치료 그룹 수 (1~3 범위, 기본값: 1)
  randomization_ratio: string; // 무작위 배정 비율 (n:m 또는 n:m:p 형식, 기본값: "1:1")
  stratification?: boolean; // 계층화 여부 (기본값: false)
  hypothesis_type?: string; // 가설검정 방법 (Superiority, Non-inferiority, Equivalence, 기본값: Superiority)
  subpopulation?: string; // 하위 집단 (ALL, Mild AD, Moderate AD, 기본값: ALL)
  primary: PrimaryEndpointData[]; // Primary 데이터 배열 (최소 1개 이상 필수)
  secondary?: SecondaryEndpointData[]; // Secondary 데이터 배열 (선택)
}

export interface FormulaResult {
  id: number;
  task_id: string;
  model: string;
  method: string;
  beta: number;
  alpha: number;
  inverse_phi: number;
  sigma: number;
  tau: number;
  formula_svg: string;
  beta_str: string;
  alpha_str: string;
  inverse_phi_str: string;
  sigma_str: string;
  tau_str: string;
  created_at: string;
  updated_at: string;
}

export interface ResultOverviewItem {
  id: number;
  task_id: string;
  designed_method: "OPTIVIS" | "TRADITIONAL";
  sample_size: number;
  sample_size_reduction: number;
  enrollment: number;
  enrollment_reduction: number;
  cost: number;
  cost_reduction: number;
  power: number;
  power_reduction: number;
  sample_size_text: string;
  enrollment_text: string;
  cost_text: string;
  power_text: string;
  sample_size_evaluation?: {
    title: string;
    content: string;
    language: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ResultOverview {
  TRADITIONAL: ResultOverviewItem[];
  OPTIVIS: ResultOverviewItem[];
}

export interface SampleSizeEvaluation {
  title: string;
  content: string;
  language: string;
}

export interface TrialDesignConditionsSummary {
  id: number;
  task_id: string;
  hypothesis_type: string;
  treatment_duration: number;
  treatment_arms: number;
  randomization_ratio: string;
  alpha: number;
  nominal_power: number;
  primary_endpoint: string;
  primary_effect_size: string;
  secondary_endpoint: string;
  secondary_effect_size: string;
  created_at: string;
  updated_at: string;
}

export interface TypeSafetyResult {
  id: number;
  task_id: string;
  p_value: number;
  count: number;
  expected_under_uniform: number;
  created_at: string;
  updated_at: string;
}

export interface DecisionStabilityResult {
  id: number;
  task_id: string;
  scenario: string;
  probability_of_go_decision: string; // JSON string array
  estimated_treatment_effect: number;
  created_at: string;
  updated_at: string;
}

/** Step 2-1 Variance Decline: model_performance (R²) vs variance */
export interface VarianceDeclineResult {
  id: number;
  task_id: string;
  model_performance: number;
  variance: string; // JSON array string of variance values
  created_at: string;
  updated_at: string;
}

/** Step 3-1 Absolute Performance Comparison: category × degradation_level, estimated_treatment_effect ± margin_of_error */
export interface AbsolutePerformanceItem {
  id: number;
  task_id: string;
  category: string;
  degradation_level: string;
  estimated_treatment_effect: number;
  margin_of_error: number;
  created_at: string;
  updated_at: string;
}

/** Step 3-2 Robustness Proof: difference_in_estimate ± margin_of_error */
export interface RobustnessProofResult {
  id: number;
  task_id: string;
  category: string;
  degradation_level: string;
  difference_in_estimate: number;
  margin_of_error: number;
  created_at: string;
  updated_at: string;
}

/** Step 2-2 Estimated treatment effect: model_performance (R²) vs estimated_treatment_effect (JSON array) */
export interface EstimatedTreatmentEffectResult {
  id: number;
  task_id: string;
  model_performance: number;
  estimated_treatment_effect: string; // JSON array string
  created_at: string;
  updated_at: string;
}

export interface GraphAccModel {
  id: number;
  task_id: string;
  endpoint: string;
  model: string;
  model_svg: string; // base64 encoded SVG
  created_at: string;
  updated_at: string;
}

export interface ResultPrecModelTableHead {
  [key: string]: {
    display_value: string;
    description: string;
  };
}

export interface ResultPrecModelData {
  id: number;
  task_id: string;
  endpoint: string;
  model: string;
  n_used: number;
  r_square: number;
  mse: number;
  rmse: number;
  ratio: number;
  created_at: string;
  updated_at: string;
}

export interface ResultPrecModel {
  table_head: ResultPrecModelTableHead;
  data: ResultPrecModelData[];
}

export interface Appendix {
  title: string;
  content: string;
}

export interface PlayAPIResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    task_id: string;
    table_results: {
      manage_result: {
        OPTIVIS: StudyResult[];
        TRADITIONAL: StudyResult[];
      };
      result_formula?: {
        OPTIVIS?: FormulaResult[];
        TRADITIONAL?: FormulaResult[];
      };
      result_resultsoverview?: ResultOverview;
      result_trialdesignconditionsummary?: TrialDesignConditionsSummary;
      sample_size_evaluation?: SampleSizeEvaluation;
      result_type_safety?: TypeSafetyResult[];
      result_variancedecline?: VarianceDeclineResult[];
      result_estimatedtreatmenteffect?: EstimatedTreatmentEffectResult[];
      result_absoluteperformancecomparison?: AbsolutePerformanceItem[];
      result_robustnessproof?: RobustnessProofResult[];
      result_decisionstability?: DecisionStabilityResult[];
      graph_acc_model?: GraphAccModel[];
      result_prec_model?: ResultPrecModel;
      appendix?: Appendix;
    };
  };
}

// Play API 호출
export const callMLStudyDesign = async (
  parameters: StudyParameters
): Promise<PlayAPIResponse> => {
  // 타임아웃 설정 (10분 = 600초, 큰 응답 처리용)
  const timeout = 600000; // 10분
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const isClient = typeof window !== "undefined";
    const url = isClient
      ? "/api/proxy/study-play"
      : `${BACKEND_URL}/api/nexus/learning/study/play/`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(parameters),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      // API 응답 오류
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    // 큰 응답을 위한 스트리밍 처리
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // API 호출 타임아웃
        throw new Error(
          "요청 시간이 초과되었습니다. 응답이 너무 큽니다. 잠시 후 다시 시도해주세요."
        );
      }

      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        throw new Error(
          `네트워크 연결에 실패했습니다. 서버에 연결할 수 없습니다.`
        );
      }

      throw error;
    }

    throw new Error("API 호출에 실패했습니다.");
  }
};

// 파일 다운로드 API 호출
export const downloadReportFile = async (taskId: string): Promise<Blob> => {
  try {
    const isClient = typeof window !== "undefined";
    const url = isClient
      ? `/api/proxy/download/${taskId}`
      : `${BACKEND_URL}/api/nexus/files/download/${taskId}/`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        throw new Error(
          `네트워크 연결에 실패했습니다. 서버에 연결할 수 없습니다.`
        );
      }

      throw error;
    }

    throw new Error("파일 다운로드에 실패했습니다.");
  }
};
