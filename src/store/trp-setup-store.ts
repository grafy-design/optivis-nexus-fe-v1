import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TrpDataLoadPatientRecord } from "@/components/trp/trp-data-load-mock-data";
import {
  buildDataLoadSelectionSummary,
  mapDataLoadRecordToPatientDiseaseInfo,
  type TrpDataLoadSelectionSummary,
  type TrpPatientDiseaseInfoFormData,
} from "@/lib/trp-data-load-mappers";
import {
  cloneTrpSimulationSettingForm,
  createInitialTrpSimulationSettingForm,
  getTrpSimulationSelectedOutcomeLabel,
  type TrpSimulationSettingForm,
} from "@/lib/trp-simulation-setting";
import type { TrpAnalysisResponse } from "@/services/trp-analysis-mock-service";

const SIMULATION_TIMELINE_MAX_MONTHS = 24;
const SIMULATION_TIMELINE_MIN_DURATION = 3;

export type TrpProgressStepKey =
  | "patient-disease-info"
  | "treatment-info"
  | "simulation-setting";

export type TrpTreatmentInfoForm = {
  hypoglycemicAgentDrugs: string[];
  insulinBasedDrugs: string[];
  treatmentLineSelect: string;
  treatmentLineFlags: string[];
  priorSwitchHistory: "Yes" | "No";
  lowBloodSugarSeverity: "Step 1 (< 70mg/dL)" | "Step 2 (< 54mg/dL)";
  dmDuration: "" | "< 5 Years" | "5 ~ 10 Years" | "> 10 Years";
  cvdHistory: string[];
  persistenceProxy: "High" | "Medium" | "Low";
};

export type TrpCompletedSteps = Record<TrpProgressStepKey, boolean>;

export type TrpTimelineSlot = {
  startMonth: number;
  endMonth: number;
};

export type TrpSimulationDrug = {
  id: number;
  type: string;
  name: string;
  code: string;
  checks: boolean[];
  timelineSlots: Array<TrpTimelineSlot | null>;
};

export type TrpSimulationStrategyId = "strategy-a" | "strategy-b" | "strategy-c";

export type TrpSimulationStrategy = {
  id: TrpSimulationStrategyId;
  title: string;
  color: string;
  keepCurrent: boolean;
};

export type TrpSimulationTargetConfig = {
  label: string;
  value: string;
  unit: string;
  months: string;
};

export type TrpSimulationSettingData = {
  selectedCategory: number | null;
  selectedDetail: number | null;
  selectedValue: number | null;
  followUpMonths: number;
  targetConfigs: TrpSimulationTargetConfig[];
  drugList: TrpSimulationDrug[];
  strategies: TrpSimulationStrategy[];
};

export type TrpSavedSimulationSnapshot = {
  completedSteps: Partial<TrpCompletedSteps>;
  selectedPatient: TrpDataLoadSelectionSummary | null;
  patientDiseaseInfo: TrpPatientDiseaseInfoFormData | null;
  treatmentInfo: TrpTreatmentInfoForm;
  treatmentSaved?: TrpTreatmentInfoForm;
  simulationSetting: TrpSimulationSettingData | null;
  simulationSaved?: TrpSimulationSettingForm;
};

export type TrpSavedSimulationRecord = {
  id: string;
  simulationName: string;
  description: string;
  disease: string;
  targetOutcome: string;
  treatment: string;
  lastUpdated: string;
  snapshot: TrpSavedSimulationSnapshot;
};

export type TrpAnalysisRequest = {
  requestedAt: string;
  selectedPatient: TrpDataLoadSelectionSummary | null;
  patientDiseaseInfo: TrpPatientDiseaseInfoFormData;
  treatmentInfo: TrpTreatmentInfoForm;
  simulationSetting: TrpSimulationSettingData;
};

export type TrpAnalysisStatus = "idle" | "running" | "succeeded" | "failed";

type TrpSetupStoreState = {
  hasHydrated: boolean;
  completedSteps: TrpCompletedSteps;
  selectedPatient: TrpDataLoadSelectionSummary | null;
  patientDiseaseInfo: TrpPatientDiseaseInfoFormData | null;
  treatmentDraft: TrpTreatmentInfoForm;
  treatmentSaved: TrpTreatmentInfoForm;
  simulationSaved: TrpSimulationSettingForm;
  simulationSetting: TrpSimulationSettingData | null;
  analysisRequest: TrpAnalysisRequest | null;
  analysisResponse: TrpAnalysisResponse | null;
  analysisStatus: TrpAnalysisStatus;
  analysisError: string | null;
  savedSimulations: TrpSavedSimulationRecord[];
  setHasHydrated: (hydrated: boolean) => void;
  setStepCompleted: (step: TrpProgressStepKey, completed: boolean) => void;
  resetStepProgressFrom: (step: TrpProgressStepKey) => void;
  setSelectedPatient: (selectedPatient: TrpDataLoadSelectionSummary | null) => void;
  setPatientDiseaseInfo: (patientDiseaseInfo: TrpPatientDiseaseInfoFormData | null) => void;
  applyDataLoadRecord: (record: TrpDataLoadPatientRecord) => void;
  loadSavedSimulation: (snapshot: TrpSavedSimulationSnapshot) => void;
  setTreatmentDraft: (form: TrpTreatmentInfoForm) => void;
  patchTreatmentDraft: (patch: Partial<TrpTreatmentInfoForm>) => void;
  setTreatmentSaved: (form: TrpTreatmentInfoForm) => void;
  setSimulationSaved: (form: TrpSimulationSettingForm) => void;
  restoreTreatmentDraft: () => void;
  setSimulationSetting: (setting: TrpSimulationSettingData) => void;
  clearSimulationSetting: () => void;
  prepareAnalysisRequest: () => TrpAnalysisRequest | null;
  setAnalysisPending: (request: TrpAnalysisRequest) => void;
  setAnalysisResult: (payload: {
    request: TrpAnalysisRequest;
    response: TrpAnalysisResponse;
  }) => void;
  setAnalysisFailure: (payload: { request: TrpAnalysisRequest | null; error: string }) => void;
  clearAnalysisState: () => void;
  saveCurrentSimulation: (payload: {
    simulationName: string;
    description: string;
  }) => TrpSavedSimulationRecord;
  restoreSavedSimulation: (snapshot: TrpSavedSimulationSnapshot) => void;
  resetTreatmentFlow: () => void;
};

const progressOrder: readonly TrpProgressStepKey[] = [
  "patient-disease-info",
  "treatment-info",
  "simulation-setting",
];

export function createInitialTrpTreatmentInfoForm(): TrpTreatmentInfoForm {
  return {
    hypoglycemicAgentDrugs: [],
    insulinBasedDrugs: [],
    treatmentLineSelect: "",
    treatmentLineFlags: [],
    priorSwitchHistory: "No",
    lowBloodSugarSeverity: "Step 1 (< 70mg/dL)",
    dmDuration: "",
    cvdHistory: [],
    persistenceProxy: "High",
  };
}

const initialTreatmentForm = createInitialTrpTreatmentInfoForm();
const initialSimulationSettingForm = createInitialTrpSimulationSettingForm();

const initialCompletedSteps: TrpCompletedSteps = {
  "patient-disease-info": false,
  "treatment-info": false,
  "simulation-setting": false,
};

export function isSameTreatmentInfoForm(
  left: TrpTreatmentInfoForm,
  right: TrpTreatmentInfoForm
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function cloneTreatmentInfoForm(form: TrpTreatmentInfoForm): TrpTreatmentInfoForm {
  return {
    ...form,
    hypoglycemicAgentDrugs: [...form.hypoglycemicAgentDrugs],
    insulinBasedDrugs: [...form.insulinBasedDrugs],
    treatmentLineFlags: [...form.treatmentLineFlags],
    cvdHistory: [...form.cvdHistory],
  };
}

export function clonePatientDiseaseInfoFormData(
  form: TrpPatientDiseaseInfoFormData
): TrpPatientDiseaseInfoFormData {
  return {
    ...form,
    medicalHistories: [...form.medicalHistories],
  };
}

function clonePatientDiseaseInfo(
  patientDiseaseInfo: TrpPatientDiseaseInfoFormData | null
): TrpPatientDiseaseInfoFormData | null {
  return patientDiseaseInfo ? clonePatientDiseaseInfoFormData(patientDiseaseInfo) : null;
}

export function getTreatmentCombinationStatus(form: TrpTreatmentInfoForm) {
  const selectedDrugCount =
    form.hypoglycemicAgentDrugs.length + form.insulinBasedDrugs.length;

  if (selectedDrugCount === 0) {
    return "";
  }

  return selectedDrugCount > 1 ? "Combo" : "Solo";
}

export function formatTreatmentRegimen(form: TrpTreatmentInfoForm) {
  const selected = [...form.hypoglycemicAgentDrugs, ...form.insulinBasedDrugs];
  return selected.length > 0 ? selected.join(", ") : "-";
}

function cloneCompletedSteps(completedSteps: Partial<TrpCompletedSteps>): TrpCompletedSteps {
  return {
    "patient-disease-info": !!completedSteps["patient-disease-info"],
    "treatment-info": !!completedSteps["treatment-info"],
    "simulation-setting": !!completedSteps["simulation-setting"],
  };
}

function formatLocalTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function clampTimelineMonth(value: number) {
  return Math.max(0, Math.min(SIMULATION_TIMELINE_MAX_MONTHS, Math.round(value / 3) * 3));
}

function normalizeTimelineSlot(slot: TrpTimelineSlot): TrpTimelineSlot {
  const startMonth = clampTimelineMonth(slot.startMonth);
  const normalizedEndMonth = clampTimelineMonth(slot.endMonth);
  const endMonth =
    normalizedEndMonth > startMonth
      ? normalizedEndMonth
      : Math.min(SIMULATION_TIMELINE_MAX_MONTHS, startMonth + SIMULATION_TIMELINE_MIN_DURATION);

  return {
    startMonth,
    endMonth,
  };
}

export function cloneSimulationSettingData(
  setting: TrpSimulationSettingData
): TrpSimulationSettingData {
  return {
    ...setting,
    targetConfigs: setting.targetConfigs.map((config) => ({ ...config })),
    drugList: setting.drugList.map((drug) => ({
      ...drug,
      checks: [...drug.checks],
      timelineSlots: drug.timelineSlots.map((slot) => (slot ? { ...slot } : null)),
    })),
    strategies: setting.strategies.map((strategy) => ({ ...strategy })),
  };
}

export function convertSimulationSavedToSettingData(
  form: TrpSimulationSettingForm
): TrpSimulationSettingData {
  return {
    selectedCategory: form.selectedCategory,
    selectedDetail: form.selectedDetail,
    selectedValue: form.selectedValue,
    followUpMonths: form.followUpMonths,
    targetConfigs: form.targetConfigs.map((config) => ({ ...config })),
    drugList: form.drugList.map((drug) => ({
      id: drug.id,
      type: drug.type,
      name: drug.name,
      code: drug.code,
      checks: [...drug.checks],
      timelineSlots: drug.pillPositions.map((pill) => {
        if (!pill) {
          return null;
        }

        return normalizeTimelineSlot({
          startMonth: (pill.leftPct / 100) * SIMULATION_TIMELINE_MAX_MONTHS,
          endMonth:
            ((pill.leftPct + pill.widthPct) / 100) * SIMULATION_TIMELINE_MAX_MONTHS,
        });
      }),
    })),
    strategies: form.strategies.map((strategy) => ({
      id: strategy.id,
      title: strategy.title,
      color: strategy.color,
      keepCurrent: strategy.keepCurrent,
    })),
  };
}

export function convertSimulationSettingToSavedForm(
  setting: TrpSimulationSettingData
): TrpSimulationSettingForm {
  return {
    selectedCategory: setting.selectedCategory ?? 0,
    selectedDetail: setting.selectedDetail ?? 0,
    selectedValue: setting.selectedValue ?? 0,
    followUpMonths: setting.followUpMonths,
    targetConfigs: setting.targetConfigs.map((config) => ({ ...config })),
    drugList: setting.drugList.map((drug) => ({
      id: drug.id,
      type: drug.type,
      name: drug.name,
      code: drug.code,
      checks: [...drug.checks],
      pillPositions: drug.timelineSlots.map((slot) =>
        slot
          ? {
              leftPct: (slot.startMonth / SIMULATION_TIMELINE_MAX_MONTHS) * 100,
              widthPct:
                ((slot.endMonth - slot.startMonth) / SIMULATION_TIMELINE_MAX_MONTHS) * 100,
            }
          : null
      ),
    })),
    strategies: setting.strategies.map((strategy) => ({
      id: strategy.id,
      title: strategy.title,
      color: strategy.color,
      detail: "",
      keepCurrent: strategy.keepCurrent,
    })),
  };
}

function createInitialState() {
  return {
    completedSteps: cloneCompletedSteps(initialCompletedSteps),
    selectedPatient: null as TrpDataLoadSelectionSummary | null,
    patientDiseaseInfo: null as TrpPatientDiseaseInfoFormData | null,
    treatmentDraft: cloneTreatmentInfoForm(initialTreatmentForm),
    treatmentSaved: cloneTreatmentInfoForm(initialTreatmentForm),
    simulationSaved: cloneTrpSimulationSettingForm(initialSimulationSettingForm),
    simulationSetting: null as TrpSimulationSettingData | null,
    analysisRequest: null as TrpAnalysisRequest | null,
    analysisResponse: null as TrpAnalysisResponse | null,
    analysisStatus: "idle" as TrpAnalysisStatus,
    analysisError: null as string | null,
  };
}

function createInitialAnalysisState() {
  return {
    analysisRequest: null as TrpAnalysisRequest | null,
    analysisResponse: null as TrpAnalysisResponse | null,
    analysisStatus: "idle" as TrpAnalysisStatus,
    analysisError: null as string | null,
  };
}

function resolveSnapshotTreatmentInfo(snapshot: TrpSavedSimulationSnapshot) {
  return cloneTreatmentInfoForm(snapshot.treatmentSaved ?? snapshot.treatmentInfo);
}

function resolveSnapshotSimulationSetting(snapshot: TrpSavedSimulationSnapshot) {
  if (snapshot.simulationSetting) {
    return cloneSimulationSettingData(snapshot.simulationSetting);
  }

  if (snapshot.simulationSaved) {
    return convertSimulationSavedToSettingData(snapshot.simulationSaved);
  }

  return null;
}

function applySavedSimulationSnapshot(snapshot: TrpSavedSimulationSnapshot) {
  const treatmentInfo = resolveSnapshotTreatmentInfo(snapshot);
  const simulationSetting = resolveSnapshotSimulationSetting(snapshot);

  return {
    completedSteps: {
      ...initialCompletedSteps,
      ...cloneCompletedSteps(snapshot.completedSteps),
    },
    selectedPatient: snapshot.selectedPatient ? { ...snapshot.selectedPatient } : null,
    patientDiseaseInfo: clonePatientDiseaseInfo(snapshot.patientDiseaseInfo),
    treatmentDraft: treatmentInfo,
    treatmentSaved: cloneTreatmentInfoForm(treatmentInfo),
    simulationSaved: snapshot.simulationSaved
      ? cloneTrpSimulationSettingForm(snapshot.simulationSaved)
      : simulationSetting
        ? convertSimulationSettingToSavedForm(simulationSetting)
        : cloneTrpSimulationSettingForm(initialSimulationSettingForm),
    simulationSetting,
    ...createInitialAnalysisState(),
  };
}

function buildAnalysisRequestFromState(state: {
  selectedPatient: TrpDataLoadSelectionSummary | null;
  patientDiseaseInfo: TrpPatientDiseaseInfoFormData | null;
  treatmentSaved: TrpTreatmentInfoForm;
  simulationSetting: TrpSimulationSettingData | null;
}) {
  if (!state.patientDiseaseInfo || !state.simulationSetting) {
    return null;
  }

  return {
    requestedAt: formatLocalTimestamp(new Date()),
    selectedPatient: state.selectedPatient ? { ...state.selectedPatient } : null,
    patientDiseaseInfo: clonePatientDiseaseInfoFormData(state.patientDiseaseInfo),
    treatmentInfo: cloneTreatmentInfoForm(state.treatmentSaved),
    simulationSetting: cloneSimulationSettingData(state.simulationSetting),
  } satisfies TrpAnalysisRequest;
}

function cloneAnalysisRequest(request: TrpAnalysisRequest) {
  return {
    ...request,
    selectedPatient: request.selectedPatient ? { ...request.selectedPatient } : null,
    patientDiseaseInfo: clonePatientDiseaseInfoFormData(request.patientDiseaseInfo),
    treatmentInfo: cloneTreatmentInfoForm(request.treatmentInfo),
    simulationSetting: cloneSimulationSettingData(request.simulationSetting),
  } satisfies TrpAnalysisRequest;
}

export const useTrpSetupStore = create<TrpSetupStoreState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      ...createInitialState(),
      savedSimulations: [],
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      setStepCompleted: (step, completed) =>
        set((state) => ({
          completedSteps: {
            ...state.completedSteps,
            [step]: completed,
          },
        })),
      resetStepProgressFrom: (step) =>
        set((state) => {
          const fromIndex = progressOrder.indexOf(step);
          const nextCompletedSteps = { ...state.completedSteps };
          const shouldResetSimulationSetting = progressOrder
            .slice(fromIndex)
            .includes("simulation-setting");

          progressOrder.slice(fromIndex).forEach((key) => {
            nextCompletedSteps[key] = false;
          });

          return {
            completedSteps: nextCompletedSteps,
            simulationSaved: shouldResetSimulationSetting
              ? cloneTrpSimulationSettingForm(initialSimulationSettingForm)
              : state.simulationSaved,
            simulationSetting: shouldResetSimulationSetting ? null : state.simulationSetting,
            ...createInitialAnalysisState(),
          };
        }),
      setSelectedPatient: (selectedPatient) =>
        set({ selectedPatient, ...createInitialAnalysisState() }),
      setPatientDiseaseInfo: (patientDiseaseInfo) =>
        set({
          patientDiseaseInfo: clonePatientDiseaseInfo(patientDiseaseInfo),
          simulationSaved: cloneTrpSimulationSettingForm(initialSimulationSettingForm),
          simulationSetting: null,
          ...createInitialAnalysisState(),
        }),
      applyDataLoadRecord: (record) =>
        set({
          selectedPatient: buildDataLoadSelectionSummary(record),
          patientDiseaseInfo: mapDataLoadRecordToPatientDiseaseInfo(record),
          simulationSaved: cloneTrpSimulationSettingForm(initialSimulationSettingForm),
          simulationSetting: null,
          ...createInitialAnalysisState(),
        }),
      loadSavedSimulation: (snapshot) =>
        set({
          ...applySavedSimulationSnapshot(snapshot),
        }),
      setTreatmentDraft: (form) =>
        set({ treatmentDraft: cloneTreatmentInfoForm(form), ...createInitialAnalysisState() }),
      patchTreatmentDraft: (patch) =>
        set((state) => ({
          treatmentDraft: {
            ...state.treatmentDraft,
            ...patch,
          },
          ...createInitialAnalysisState(),
        })),
      setTreatmentSaved: (form) =>
        set({ treatmentSaved: cloneTreatmentInfoForm(form), ...createInitialAnalysisState() }),
      setSimulationSaved: (form) =>
        set({
          simulationSaved: cloneTrpSimulationSettingForm(form),
          simulationSetting: convertSimulationSavedToSettingData(form),
          ...createInitialAnalysisState(),
        }),
      restoreTreatmentDraft: () =>
        set((state) => ({
          treatmentDraft: cloneTreatmentInfoForm(state.treatmentSaved),
          ...createInitialAnalysisState(),
        })),
      setSimulationSetting: (setting) => {
        const nextSetting = cloneSimulationSettingData(setting);

        set({
          simulationSetting: nextSetting,
          simulationSaved: convertSimulationSettingToSavedForm(nextSetting),
          ...createInitialAnalysisState(),
        });
      },
      clearSimulationSetting: () =>
        set({
          simulationSaved: cloneTrpSimulationSettingForm(initialSimulationSettingForm),
          simulationSetting: null,
          ...createInitialAnalysisState(),
        }),
      prepareAnalysisRequest: () => {
        let analysisRequest: TrpAnalysisRequest | null = null;

        set((state) => {
          analysisRequest = buildAnalysisRequestFromState(state);

          if (!analysisRequest) {
            return {
              ...createInitialAnalysisState(),
            };
          }

          return {
            analysisRequest,
            analysisResponse: null,
            analysisStatus: "idle",
            analysisError: null,
          };
        });

        return analysisRequest;
      },
      setAnalysisPending: (request) =>
        set({
          analysisRequest: cloneAnalysisRequest(request),
          analysisResponse: null,
          analysisStatus: "running",
          analysisError: null,
        }),
      setAnalysisResult: ({ request, response }) =>
        set({
          analysisRequest: cloneAnalysisRequest(request),
          analysisResponse: response,
          analysisStatus: "succeeded",
          analysisError: null,
        }),
      setAnalysisFailure: ({ request, error }) =>
        set({
          analysisRequest: request ? cloneAnalysisRequest(request) : null,
          analysisResponse: null,
          analysisStatus: "failed",
          analysisError: error,
        }),
      clearAnalysisState: () =>
        set({
          ...createInitialAnalysisState(),
        }),
      saveCurrentSimulation: ({ simulationName, description }) => {
        let savedRecord: TrpSavedSimulationRecord | null = null;

        set((state) => {
          const simulationSetting = state.simulationSetting
            ? cloneSimulationSettingData(state.simulationSetting)
            : null;
          const simulationSaved = simulationSetting
            ? convertSimulationSettingToSavedForm(simulationSetting)
            : cloneTrpSimulationSettingForm(state.simulationSaved);
          const treatmentInfo = cloneTreatmentInfoForm(state.treatmentSaved);
          const snapshot: TrpSavedSimulationSnapshot = {
            completedSteps: cloneCompletedSteps(state.completedSteps),
            selectedPatient: state.selectedPatient ? { ...state.selectedPatient } : null,
            patientDiseaseInfo: clonePatientDiseaseInfo(state.patientDiseaseInfo),
            treatmentInfo,
            treatmentSaved: cloneTreatmentInfoForm(treatmentInfo),
            simulationSetting,
            simulationSaved,
          };

          savedRecord = {
            id: `trp-${Date.now()}`,
            simulationName: simulationName.trim(),
            description: description.trim(),
            disease: state.patientDiseaseInfo?.disease
              ? state.patientDiseaseInfo.disease === "prediabetes"
                ? "Prediabetes"
                : "Diabetes"
              : state.selectedPatient?.primaryCondition || "-",
            targetOutcome:
              state.completedSteps["simulation-setting"] && simulationSetting
                ? getTrpSimulationSelectedOutcomeLabel(simulationSaved.selectedValue)
                : "-",
            treatment: formatTreatmentRegimen(state.treatmentSaved),
            lastUpdated: formatLocalTimestamp(new Date()),
            snapshot,
          };

          return {
            savedSimulations: [savedRecord, ...state.savedSimulations],
          };
        });

        if (!savedRecord) {
          throw new Error("Failed to save TRP simulation snapshot.");
        }

        return savedRecord;
      },
      restoreSavedSimulation: (snapshot) =>
        set({
          ...applySavedSimulationSnapshot(snapshot),
        }),
      resetTreatmentFlow: () =>
        set({
          ...createInitialState(),
        }),
    }),
    {
      name: "trp-setup-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        completedSteps: state.completedSteps,
        selectedPatient: state.selectedPatient,
        patientDiseaseInfo: state.patientDiseaseInfo,
        treatmentDraft: state.treatmentDraft,
        treatmentSaved: state.treatmentSaved,
        simulationSaved: state.simulationSaved,
        simulationSetting: state.simulationSetting,
        analysisRequest: state.analysisRequest,
        analysisResponse: state.analysisResponse,
        analysisStatus: state.analysisStatus,
        analysisError: state.analysisError,
        savedSimulations: state.savedSimulations,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
