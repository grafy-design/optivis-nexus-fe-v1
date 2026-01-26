const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://210.181.94.200:8002";

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
    // 요청 본문 로깅 (디버깅용)
    console.log("API 요청 URL:", `${API_BASE_URL}/api/nexus/learning/study/play/`);
    console.log("API 요청 본문:", JSON.stringify(parameters, null, 2));
    
    const response = await fetch(
      `${API_BASE_URL}/api/nexus/learning/study/play/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify(parameters),
        signal: controller.signal,
        // CORS 문제 해결을 위한 옵션
        mode: "cors",
        credentials: "omit",
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 응답 오류:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // 큰 응답을 위한 스트리밍 처리
    const data = await response.json();
    console.log("API 응답 성공, 데이터 크기:", JSON.stringify(data).length, "bytes");
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("API 호출 타임아웃:", error);
        throw new Error("요청 시간이 초과되었습니다. 응답이 너무 큽니다. 잠시 후 다시 시도해주세요.");
      }
      
      // 네트워크 에러 상세 정보
      if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
        console.error("네트워크 에러 상세:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
          url: `${API_BASE_URL}/api/nexus/learning/study/play/`,
        });
        throw new Error(
          `네트워크 연결에 실패했습니다. 서버(${API_BASE_URL})에 연결할 수 없습니다. ` +
          `CORS 문제이거나 서버가 응답하지 않을 수 있습니다.`
        );
      }
      
      console.error("ML Study Design API 호출 실패:", error);
      throw error;
    }
    
    console.error("ML Study Design API 호출 실패:", error);
    throw new Error("API 호출에 실패했습니다.");
  }
};

