import { create } from "zustand";

export interface SavedSimulationItem {
  id: string;
  simulationName: string;
  type: "drd";
  population: string;
  outcome: string;
  description: string;
  lastUpdated: string;
}

export type DefaultSettingId =
  | "patient-disease-info"
  | "filter"
  | "high-risk-subgroup"
  | "medical-history";

export interface FilterSubRow {
  logic: string;
  feature: string;
  op: string;
  value: string;
}

export interface FilterSection {
  id: number;
  name: string;
  feature: string;
  op: string;
  value: string;
  subRows?: FilterSubRow[];
}

export interface PatientDiseaseInfoData {
  baselineDemo: string;
  baselineMeasure: string;
  controlMode: string;
  trendSelection: string;
}

export interface HighRiskSubgroupData {
  selectedSubRow: string;
  parentName: string;
  subRowName: string;
  feature: string;
  condition: string;
  month: string;
  slope: string;
  status: string;
}

export interface DefaultSettingState {
  completedItems: Record<DefaultSettingId, boolean>;
  cohortCount: number;
  finalCohortCount: number;
  savedSimulations: SavedSimulationItem[];
  filterData: {
    inclusion: FilterSection[];
    exclusion: FilterSection[];
  };
  medicalHistoryData: Record<string, boolean>;
  patientDiseaseInfoData: PatientDiseaseInfoData | null;
  highRiskSubgroupData: HighRiskSubgroupData | null;
  setCohortCount: (count: number) => void;
  setCompleted: (id: DefaultSettingId, completed: boolean) => void;
  addSavedSimulation: (item: SavedSimulationItem) => void;
  setFilterData: (data: { inclusion: FilterSection[]; exclusion: FilterSection[] }) => void;
  setMedicalHistoryData: (data: Record<string, boolean>) => void;
  setPatientDiseaseInfoData: (data: PatientDiseaseInfoData) => void;
  setHighRiskSubgroupData: (data: HighRiskSubgroupData) => void;
  isAllCompleted: () => boolean;
  isAnyCompleted: () => boolean;
  reset: () => void;
}

const initialCompleted: Record<DefaultSettingId, boolean> = {
  "patient-disease-info": false,
  "filter": false,
  "high-risk-subgroup": false,
  "medical-history": false,
};

export const useDefaultSettingStore = create<DefaultSettingState>((set, get) => ({
  completedItems: { ...initialCompleted },
  cohortCount: 4800,
  finalCohortCount: 4800,
  savedSimulations: [],
  filterData: {
    inclusion: [],
    exclusion: [],
  },
  medicalHistoryData: {},
  patientDiseaseInfoData: null,
  highRiskSubgroupData: null,
  setCohortCount: (count) => set({ cohortCount: count, finalCohortCount: count }),

  addSavedSimulation: (item) =>
    set((state) => ({ savedSimulations: [item, ...state.savedSimulations] })),

  setCompleted: (id, completed) =>
    set((state) => {
      const newCompleted = { ...state.completedItems, [id]: completed };
      const completedCount = Object.values(newCompleted).filter(Boolean).length;
      return {
        completedItems: newCompleted,
        finalCohortCount: state.cohortCount - completedCount * 100,
      };
    }),

  setFilterData: (data) => set({ filterData: data }),

  setMedicalHistoryData: (data) => set({ medicalHistoryData: data }),

  setPatientDiseaseInfoData: (data) => set({ patientDiseaseInfoData: data }),

  setHighRiskSubgroupData: (data) => set({ highRiskSubgroupData: data }),

  isAllCompleted: () =>
    Object.values(get().completedItems).every(Boolean),

  isAnyCompleted: () =>
    Object.values(get().completedItems).some(Boolean),

  reset: () =>
    set((state) => ({
      completedItems: { ...initialCompleted },
      finalCohortCount: state.cohortCount,
      filterData: { inclusion: [], exclusion: [] },
      medicalHistoryData: {},
    })),
}));
