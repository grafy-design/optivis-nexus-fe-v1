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

export interface MedicalHistoryRawData {
  filter: string[];
  diagnosis: string[];
  riskFactor: string[];
  comorbidity: string[];
}

export interface DefaultSettingHydrationPayload {
  taskId?: string | null;
  completedItems?: Partial<Record<DefaultSettingId, boolean>>;
  cohortCount?: number;
  finalCohortCount?: number;
  filterData?: {
    inclusion: FilterSection[];
    exclusion: FilterSection[];
  };
  medicalHistoryData?: Record<string, boolean>;
  medicalHistoryRawData?: MedicalHistoryRawData | null;
  patientDiseaseInfoData?: PatientDiseaseInfoData | null;
  highRiskSubgroupData?: HighRiskSubgroupData | null;
}

export interface DefaultSettingState {
  hasHydrated: boolean;
  hydratedTaskId: string | null;
  needsSync: boolean;
  completedItems: Record<DefaultSettingId, boolean>;
  cohortCount: number;
  finalCohortCount: number;
  savedSimulations: SavedSimulationItem[];
  filterData: {
    inclusion: FilterSection[];
    exclusion: FilterSection[];
  };
  medicalHistoryData: Record<string, boolean>;
  medicalHistoryRawData: MedicalHistoryRawData | null;
  patientDiseaseInfoData: PatientDiseaseInfoData | null;
  highRiskSubgroupData: HighRiskSubgroupData | null;
  setCohortCount: (count: number) => void;
  setCompleted: (id: DefaultSettingId, completed: boolean) => void;
  addSavedSimulation: (item: SavedSimulationItem) => void;
  setFilterData: (data: { inclusion: FilterSection[]; exclusion: FilterSection[] }) => void;
  setMedicalHistoryData: (data: Record<string, boolean>) => void;
  setPatientDiseaseInfoData: (data: PatientDiseaseInfoData) => void;
  setHighRiskSubgroupData: (data: HighRiskSubgroupData) => void;
  markNeedsSync: () => void;
  hydrateFromApi: (payload: DefaultSettingHydrationPayload) => void;
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
  hasHydrated: false,
  hydratedTaskId: null,
  needsSync: false,
  completedItems: { ...initialCompleted },
  cohortCount: 4800,
  finalCohortCount: 4800,
  savedSimulations: [],
  filterData: {
    inclusion: [],
    exclusion: [],
  },
  medicalHistoryData: {},
  medicalHistoryRawData: null,
  patientDiseaseInfoData: null,
  highRiskSubgroupData: null,
  setCohortCount: (count) => set({ cohortCount: count, finalCohortCount: count }),

  addSavedSimulation: (item) =>
    set((state) => ({ savedSimulations: [item, ...state.savedSimulations] })),

  setCompleted: (id, completed) =>
    set((state) => ({
      completedItems: { ...state.completedItems, [id]: completed },
    })),

  setFilterData: (data) => set({ filterData: data }),

  setMedicalHistoryData: (data) =>
    set({
      medicalHistoryData: data,
      medicalHistoryRawData: null,
    }),

  setPatientDiseaseInfoData: (data) => set({ patientDiseaseInfoData: data }),

  setHighRiskSubgroupData: (data) => set({ highRiskSubgroupData: data }),

  markNeedsSync: () => set({ needsSync: true }),

  hydrateFromApi: (payload) =>
    set((state) => {
      const next: Partial<DefaultSettingState> = {};

      next.hasHydrated = true;
      next.needsSync = false;

      if (Object.prototype.hasOwnProperty.call(payload, "taskId")) {
        next.hydratedTaskId = payload.taskId ?? null;
      }
      if (payload.completedItems) {
        next.completedItems = {
          ...state.completedItems,
          ...payload.completedItems,
        };
      }
      if (payload.cohortCount !== undefined) {
        next.cohortCount = payload.cohortCount;
      }
      if (payload.finalCohortCount !== undefined) {
        next.finalCohortCount = payload.finalCohortCount;
      }
      if (payload.filterData) {
        next.filterData = payload.filterData;
      }
      if (
        Object.prototype.hasOwnProperty.call(payload, "medicalHistoryData")
      ) {
        next.medicalHistoryData = payload.medicalHistoryData ?? {};
      }
      if (
        Object.prototype.hasOwnProperty.call(payload, "medicalHistoryRawData")
      ) {
        next.medicalHistoryRawData = payload.medicalHistoryRawData ?? null;
      }
      if (
        Object.prototype.hasOwnProperty.call(payload, "patientDiseaseInfoData")
      ) {
        next.patientDiseaseInfoData = payload.patientDiseaseInfoData ?? null;
      }
      if (
        Object.prototype.hasOwnProperty.call(payload, "highRiskSubgroupData")
      ) {
        next.highRiskSubgroupData = payload.highRiskSubgroupData ?? null;
      }

      return next;
    }),

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
      medicalHistoryRawData: null,
    })),
}));
