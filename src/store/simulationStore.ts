import { create } from "zustand";
import type { StudyResult, StudyParameters, FormulaResult } from "@/services/studyService";

export interface SimulationState {
  // UI 상태
  activeTab: "compare" | "reduction";
  isApplied: boolean;
  sampleSizeControl: number;

  // Simulation Setting states
  disease: string;
  primaryEndpoint: string;
  primaryEffectSize: number;
  secondaryEndpoint: string;
  secondaryEffectSize: number;
  nominalPower: number;
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
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveTab: (tab: "compare" | "reduction") => void;
  setIsApplied: (applied: boolean) => void;
  setSampleSizeControl: (value: number) => void;
  setDisease: (disease: string) => void;
  setPrimaryEndpoint: (endpoint: string) => void;
  setPrimaryEffectSize: (size: number) => void;
  setSecondaryEndpoint: (endpoint: string) => void;
  setSecondaryEffectSize: (size: number) => void;
  setNominalPower: (power: number) => void;
  setTreatmentDuration: (duration: string) => void;
  setHypothesisType: (type: string) => void;
  setTreatmentArms: (arms: string) => void;
  setRandomizationRatio: (ratio: string) => void;
  setSubpopulation: (subpopulation: string) => void;
  setActiveData: (data: string) => void;
  setApiData: (data: {
    OPTIVIS: StudyResult[];
    Traditional: StudyResult[];
    result_formula?: {
      OPTIVIS?: FormulaResult[];
      TRADITIONAL?: FormulaResult[];
    };
  } | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  activeTab: "compare" as const,
  isApplied: false,
  sampleSizeControl: 0.51,
  disease: "Alzheimer's disease",
  primaryEndpoint: "ADAS Cog 11",
  primaryEffectSize: 3,
  secondaryEndpoint: "",
  secondaryEffectSize: 3,
  nominalPower: 0.8,
  treatmentDuration: "12 months",
  hypothesisType: "Superiority",
  treatmentArms: "1",
  randomizationRatio: "1:1",
  subpopulation: "ALL",
  activeData: "Oprimed data",
  apiData: null,
  isLoading: false,
  error: null,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsApplied: (applied) => set({ isApplied: applied }),
  setSampleSizeControl: (value) => set({ sampleSizeControl: value }),
  setDisease: (disease) => set({ disease }),
  setPrimaryEndpoint: (endpoint) => set({ primaryEndpoint: endpoint }),
  setPrimaryEffectSize: (size) => set({ primaryEffectSize: size }),
  setSecondaryEndpoint: (endpoint) => set({ secondaryEndpoint: endpoint }),
  setSecondaryEffectSize: (size) => set({ secondaryEffectSize: size }),
  setNominalPower: (power) => set({ nominalPower: power }),
  setTreatmentDuration: (duration) => set({ treatmentDuration: duration }),
  setHypothesisType: (type) => set({ hypothesisType: type }),
  setTreatmentArms: (arms) => set({ treatmentArms: arms }),
  setRandomizationRatio: (ratio) => set({ randomizationRatio: ratio }),
  setSubpopulation: (subpopulation) => set({ subpopulation }),
  setActiveData: (data) => set({ activeData: data }),
  setApiData: (data) => set({ apiData: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

