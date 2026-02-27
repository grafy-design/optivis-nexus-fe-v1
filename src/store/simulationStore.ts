import { create } from "zustand";
import type {
  StudyResult,
  FormulaResult,
  ResultOverview,
  SampleSizeEvaluation,
  TrialDesignConditionsSummary,
  TypeSafetyResult,
  VarianceDeclineResult,
  EstimatedTreatmentEffectResult,
  AbsolutePerformanceItem,
  RobustnessProofResult,
  DecisionStabilityResult,
  GraphAccModel,
  ResultPrecModel,
  Appendix,
} from "@/services/studyService";

/** Primary/Secondary 엔드포인트 1개 (최대 5개, Setting 루프용) */
export interface EndpointItem {
  name: string;
  effectSize: number;
  /** Endpoint 변수 타입 (Continuous, Binary). API는 Continous/Binary */
  type?: string;
  /** Binary 타입 시 임계값 (없으면 null) */
  threshold?: number | null;
}

export interface SimulationState {
  // UI 상태
  activeTab: "compare" | "reduction";
  isApplied: boolean;
  simCondCompleted: boolean;
  simSmilesCompleted: boolean;
  sampleSizeControl: number;

  // Simulation Setting states
  disease: string;
  /** 다중 Primary (최대 5개). Setting에서 #1 #2 ... 루프 표시 */
  primaryEndpoints: EndpointItem[];
  /** 다중 Secondary (Primary+Secondary 합계 최대 5개). Add Endpoints에서 추가 시 표시 */
  secondaryEndpoints: EndpointItem[];
  /** 하위 호환 / API 첫 번째 값 */
  primaryEndpoint: string;
  primaryEffectSize: number;
  secondaryEndpoint: string;
  secondaryEffectSize: number;
  nominalPower: number;
  alpha: number;
  /** 유의수준 조정 방법 (Bonferroni, Holm, Hochberg). Add Endpoints에서 설정 */
  multiplicity: string;
  treatmentDuration: string;
  hypothesisType: string;
  treatmentArms: string;
  randomizationRatio: string;
  subpopulation: string;
  activeData: string;

  // API 데이터 상태
  apiData: {
    OPTIVIS: StudyResult[];
    Traditional: StudyResult[];
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
  } | null;
  taskId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveTab: (tab: "compare" | "reduction") => void;
  setIsApplied: (applied: boolean) => void;
  setSimCondCompleted: (completed: boolean) => void;
  setSimSmilesCompleted: (completed: boolean) => void;
  setSampleSizeControl: (value: number) => void;
  setDisease: (disease: string) => void;
  setPrimaryEndpoints: (
    endpoints: EndpointItem[] | ((prev: EndpointItem[]) => EndpointItem[])
  ) => void;
  setSecondaryEndpoints: (
    endpoints: EndpointItem[] | ((prev: EndpointItem[]) => EndpointItem[])
  ) => void;
  setPrimaryEndpoint: (endpoint: string) => void;
  setPrimaryEffectSize: (size: number) => void;
  setSecondaryEndpoint: (endpoint: string) => void;
  setSecondaryEffectSize: (size: number) => void;
  setNominalPower: (power: number) => void;
  setAlpha: (alpha: number) => void;
  setMultiplicity: (multiplicity: string) => void;
  setTreatmentDuration: (duration: string) => void;
  setHypothesisType: (type: string) => void;
  setTreatmentArms: (arms: string) => void;
  setRandomizationRatio: (ratio: string) => void;
  setSubpopulation: (subpopulation: string) => void;
  setActiveData: (data: string) => void;
  setApiData: (
    data: {
      OPTIVIS: StudyResult[];
      Traditional: StudyResult[];
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
    } | null
  ) => void;
  setTaskId: (taskId: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  activeTab: "compare" as const,
  isApplied: false,
  simCondCompleted: false,
  simSmilesCompleted: false,
  sampleSizeControl: 0.8, // power 값 (0.6~0.95, 차트 하이라이트용)
  disease: "Alzheimer's disease",
  primaryEndpoints: [{ name: "ADAS Cog 11", effectSize: 3 }] as EndpointItem[],
  secondaryEndpoints: [] as EndpointItem[],
  primaryEndpoint: "ADAS Cog 11",
  primaryEffectSize: 3,
  secondaryEndpoint: "",
  secondaryEffectSize: 3,
  nominalPower: 0.8,
  alpha: 0.05,
  multiplicity: "Bonferroni",
  treatmentDuration: "12 months",
  hypothesisType: "Superiority",
  treatmentArms: "1",
  randomizationRatio: "1:1",
  subpopulation: "ALL",
  activeData: "Oprimed data",
  apiData: null,
  taskId: null,
  isLoading: false,
  error: null,
};

export const useSimulationStore = create<SimulationState>()((set) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsApplied: (applied) => set({ isApplied: applied }),
  setSimCondCompleted: (completed) => set({ simCondCompleted: completed }),
  setSimSmilesCompleted: (completed) => set({ simSmilesCompleted: completed }),
  setSampleSizeControl: (value) => set({ sampleSizeControl: value }),
  setDisease: (disease) => set({ disease }),
  setPrimaryEndpoints: (arg) =>
    set((state) => {
      const next =
        typeof arg === "function" ? arg(state.primaryEndpoints) : arg;
      return {
        primaryEndpoints: next,
        primaryEndpoint: next[0]?.name ?? state.primaryEndpoint,
        primaryEffectSize: next[0]?.effectSize ?? state.primaryEffectSize,
      };
    }),
  setSecondaryEndpoints: (arg) =>
    set((state) => {
      const next =
        typeof arg === "function" ? arg(state.secondaryEndpoints) : arg;
      return {
        secondaryEndpoints: next,
        secondaryEndpoint: next[0]?.name ?? state.secondaryEndpoint,
        secondaryEffectSize: next[0]?.effectSize ?? state.secondaryEffectSize,
      };
    }),
  setPrimaryEndpoint: (endpoint) => set({ primaryEndpoint: endpoint }),
  setPrimaryEffectSize: (size) => set({ primaryEffectSize: size }),
  setSecondaryEndpoint: (endpoint) => set({ secondaryEndpoint: endpoint }),
  setSecondaryEffectSize: (size) => set({ secondaryEffectSize: size }),
  setNominalPower: (power) => set({ nominalPower: power }),
  setAlpha: (alpha) => set({ alpha }),
  setMultiplicity: (multiplicity) => set({ multiplicity }),
  setTreatmentDuration: (duration) => set({ treatmentDuration: duration }),
  setHypothesisType: (type) => set({ hypothesisType: type }),
  setTreatmentArms: (arms) => set({ treatmentArms: arms }),
  setRandomizationRatio: (ratio) => set({ randomizationRatio: ratio }),
  setSubpopulation: (subpopulation) => set({ subpopulation }),
  setActiveData: (data) => set({ activeData: data }),
  setApiData: (data) => set({ apiData: data }),
  setTaskId: (taskId) => set({ taskId }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
