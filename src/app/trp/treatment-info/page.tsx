"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import TrpFramePanel from "@/components/trp/trp-frame-panel";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import TrpDataLoadModal from "@/components/trp/trp-data-load-modal";
import TrpPageTitle from "@/components/trp/trp-page-title";
import TrpSelect from "@/components/trp/trp-select";
import TrpSetupSidebarPanel from "@/components/trp/trp-setup-sidebar-panel";
import {
  trpPrimaryConditionDiabetesOnlyOptions,
  type TrpDataLoadPatientRecord,
} from "@/components/trp/trp-data-load-mock-data";
import { resolveTrpSetupFlowState } from "@/components/trp/setup-steps";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import RadioButton from "@/components/ui/radio-button";
import { cn } from "@/lib/cn";
import { mapDataLoadRecordToTreatmentInfo } from "@/lib/trp-data-load-mappers";
import {
  getTreatmentCombinationStatus,
  isSameTreatmentInfoForm,
  type TrpTreatmentInfoForm,
  useTrpSetupStore,
} from "@/store/trp-setup-store";
import { trpHypoglycemicDrugValues, trpInsulinDrugValues } from "@/lib/trp-drug-catalog";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type ValidationField = "treatmentDrugs" | "treatmentLineSelect" | "dmDuration";

const hypoglycemicAgentOptions: SelectOption[] = [
  { label: "Select", value: "" },
  ...trpHypoglycemicDrugValues.map((value) => ({
    label: value,
    value,
  })),
];

const insulinBasedOptions: SelectOption[] = [
  { label: "Select", value: "" },
  ...trpInsulinDrugValues.map((value) => ({
    label: value,
    value,
  })),
];

const treatmentLineOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "OAD", value: "OAD" },
  { label: "Advanced Therapy", value: "Advanced Therapy" },
  { label: "Insulin-based", value: "Insulin-based" },
];

const dmDurationOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "< 5 Years", value: "< 5 Years" },
  { label: "5 ~ 10 Years", value: "5 ~ 10 Years" },
  { label: "> 10 Years", value: "> 10 Years" },
];

const demoTreatmentPreset: TrpTreatmentInfoForm = {
  hypoglycemicAgentDrugs: ["Metformin", "GLP-1 receptor agonist"],
  insulinBasedDrugs: ["Basal insulin"],
  treatmentLineSelect: "Advanced Therapy",
  treatmentLineFlags: ["OAD", "Advanced Therapy", "Insulin-based"],
  priorSwitchHistory: "No",
  lowBloodSugarSeverity: "Step 1 (< 70mg/dL)",
  dmDuration: "> 10 Years",
  cvdHistory: ["ASCVD"],
  persistenceProxy: "High",
};

function buildSelectableOptions(options: readonly SelectOption[], selectedValues: readonly string[]) {
  return options.map((option) =>
    option.value
      ? {
          ...option,
          disabled: selectedValues.includes(option.value),
        }
      : option
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2V4C10.0845 4.00022 8.23272 4.6877 6.78115 5.93749C5.32958 7.18727 4.37462 8.9164 4.08983 10.8106C3.80504 12.7048 4.20934 14.6382 5.22923 16.2596C6.24912 17.881 7.81691 19.0826 9.64763 19.646C11.4783 20.2095 13.4505 20.0974 15.2055 19.3301C16.9606 18.5628 18.3821 17.1913 19.2117 15.4648C20.0413 13.7382 20.2239 11.7714 19.7262 9.9217C19.2286 8.07199 18.0839 6.46223 16.5 5.385V8H14.5V2H20.5V4H18C19.2425 4.93093 20.251 6.13866 20.9453 7.52734C21.6397 8.91601 22.0008 10.4474 22 12Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-[Inter,sans-serif] text-[11px] font-bold tracking-[-0.02em] text-[#59556A]">
      {children}
    </div>
  );
}

function handleToggleKeyDown(event: KeyboardEvent<HTMLDivElement>, onToggle: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onToggle();
  }
}

function CompactChoiceOption({
  label,
  active,
  onClick,
  variant = "radio",
  name,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "radio" | "checkbox";
  name?: string;
}) {
  if (variant === "checkbox") {
    return (
      <label className="inline-flex cursor-pointer items-center gap-[7px] rounded-[8px] bg-transparent p-0 text-left">
        <CustomCheckbox checked={active} onChange={onClick} size={12} />
        <span className="font-[Inter,sans-serif] text-[11.5px] leading-[1.35] font-medium tracking-[-0.02em] text-[#504C5D]">
          {label}
        </span>
      </label>
    );
  }

  return (
    <div
      role="radio"
      aria-checked={active}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => handleToggleKeyDown(event, onClick)}
      className="inline-flex cursor-pointer items-center gap-[7px] rounded-[8px] bg-transparent p-0 text-left"
    >
      <RadioButton
        checked={active}
        name={name ?? `compact-choice-${label.replace(/\s+/g, "-").toLowerCase()}`}
        onChange={onClick}
        size={12}
        className="shrink-0"
      />
      <span className="font-[Inter,sans-serif] text-[11.5px] leading-[1.35] font-medium tracking-[-0.02em] text-[#504C5D]">
        {label}
      </span>
    </div>
  );
}

function ReadonlyChoiceOption({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="inline-flex items-center gap-[7px] rounded-[8px] p-0 text-left">
      <RadioButton
        checked={active}
        name={`readonly-choice-${label.replace(/\s+/g, "-").toLowerCase()}`}
        onChange={() => undefined}
        size={12}
        className="pointer-events-none shrink-0"
      />
      <span
        className={cn(
          "font-[Inter,sans-serif] text-[11.5px] leading-[1.35] font-medium tracking-[-0.02em]",
          active ? "text-[#504C5D]" : "text-[#8E8A98]"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function SeverityRow({
  title,
  children,
  hasTopBorder = false,
  align = "start",
}: {
  title: string;
  children: ReactNode;
  hasTopBorder?: boolean;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[168px_minmax(0,1fr)] gap-[10px] py-[10px]",
        hasTopBorder && "border-t border-[#D8D6E2]",
        align === "center" ? "items-center" : "items-start"
      )}
    >
      <div className="font-[Inter,sans-serif] text-[12px] leading-[1.35] font-bold tracking-[-0.02em] text-[#59556A]">
        {title}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function EvidenceChevron({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 3.5L11 9H3L7 3.5Z" fill="#7A7785" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 10.5L3 5H11L7 10.5Z" fill="#7A7785" />
    </svg>
  );
}

function MiniActionButton({
  children,
  onClick,
  disabled = false,
  variant = "default",
  endIcon,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "reset";
  endIcon?: ReactNode;
}) {
  const isReset = variant === "reset";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-[30px] items-center justify-center gap-[6px] rounded-full border border-[rgba(226,225,229,0.95)] px-4 font-[Inter,sans-serif] text-[12px] leading-none font-semibold tracking-[-0.02em] disabled:cursor-not-allowed",
        isReset
          ? cn(
              "min-w-[74px]",
              disabled ? "bg-[#D5D2DA] text-[#F3F2F6]" : "bg-[#D5D2DA] text-[#FFFFFF]"
            )
          : "min-w-[56px] bg-white text-[#111111]"
      )}
    >
      {children}
      {endIcon ? <span className="shrink-0 opacity-95">{endIcon}</span> : null}
    </button>
  );
}

function SurfaceCard({
  title,
  headerRight,
  children,
}: {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[rgba(255,255,255,0.64)] px-4 pt-5 pb-4 shadow-[0_16px_30px_rgba(38,34,85,0.05)] backdrop-blur-[14px]">
      <div className="mb-4 flex items-center justify-between gap-3 px-2">
        <h3 className="m-0 font-[Inter,sans-serif] text-[19.5px] leading-[1.12] font-semibold tracking-[-0.04em] text-black">
          {title}
        </h3>
        {headerRight}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto [overscroll-behavior:contain] pr-1 [scrollbar-gutter:stable]">
        {children}
      </div>
    </div>
  );
}

function TreatmentSubsection({
  title,
  children,
  invalid = false,
}: {
  title: string;
  children: ReactNode;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-white/70 bg-[rgba(255,255,255,0.66)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-[12px]",
        invalid && "border-[rgba(240,82,69,0.42)] bg-[rgba(255,244,243,0.72)]"
      )}
    >
      <div className="mb-3 font-[Inter,sans-serif] text-[13px] font-bold tracking-[-0.03em] text-[#36324D]">
        {title}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function OverviewRow({
  title,
  children,
  hasTopBorder = false,
}: {
  title: string;
  children: ReactNode;
  hasTopBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-[10px] py-[10px]",
        hasTopBorder && "border-t border-[#CDC9D8]"
      )}
    >
      <div className="flex-1 font-[Inter,sans-serif] text-[12px] leading-[1.35] font-medium tracking-[-0.02em] text-[#45414F]">
        {title}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SelectedDrugChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#D9D5E3] bg-[#F8F6FC] px-3 py-1 font-[Inter,sans-serif] text-[11px] font-semibold tracking-[-0.02em] text-[#4F4A60]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E2DDEA] text-[#5C566C]"
        aria-label={`Remove ${label}`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1 1L7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

function DrugSelectionBlock({
  options,
  pendingValue,
  selectedValues,
  onPendingValueChange,
  onRemove,
  invalid = false,
  validationField,
}: {
  options: readonly SelectOption[];
  pendingValue: string;
  selectedValues: readonly string[];
  onPendingValueChange: (value: string) => void;
  onRemove: (value: string) => void;
  invalid?: boolean;
  validationField?: ValidationField;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="min-w-[72px] flex-1">
          <FieldLabel>Drug</FieldLabel>
        </div>
        <div className="min-w-0 flex-[1.25]">
          <TrpSelect
            value={pendingValue}
            options={options}
            onValueChange={onPendingValueChange}
            variant="inline"
            wrapperClassName="min-w-0"
            data-validation-field={validationField}
            className={cn(
              "h-[30px] rounded-[6px] border border-transparent bg-[#ECEAF1] px-[11px] pr-8 text-[11.5px] leading-[1.2] font-medium tracking-[-0.02em] text-[#534F60]",
              invalid && "border-[rgba(240,82,69,0.42)] bg-[#FFF4F3]"
            )}
            placeholderColor="#888496"
            iconColor="#8B8796"
          />
        </div>
      </div>

      <div
        className={cn(
          "min-h-[44px] rounded-[12px] border border-[rgba(226,224,234,0.95)] bg-[#F6F4FB] px-3 py-2",
          invalid && "border-[rgba(240,82,69,0.42)] bg-[#FFF4F3]"
        )}
      >
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((value) => (
              <SelectedDrugChip key={value} label={value} onRemove={() => onRemove(value)} />
            ))}
          </div>
        ) : (
          <div className="font-[Inter,sans-serif] text-[11px] font-medium tracking-[-0.02em] text-[#9B97A8]">
            No drugs selected.
          </div>
        )}
      </div>
    </>
  );
}

export default function TrpTreatmentInfoPage() {
  const router = useRouter();
  const hasHydrated = useTrpSetupStore((state) => state.hasHydrated);
  const completedSteps = useTrpSetupStore((state) => state.completedSteps);
  const patientDiseaseInfo = useTrpSetupStore((state) => state.patientDiseaseInfo);
  const form = useTrpSetupStore((state) => state.treatmentDraft);
  const savedForm = useTrpSetupStore((state) => state.treatmentSaved);
  const patchTreatmentDraft = useTrpSetupStore((state) => state.patchTreatmentDraft);
  const setTreatmentDraft = useTrpSetupStore((state) => state.setTreatmentDraft);
  const setTreatmentSaved = useTrpSetupStore((state) => state.setTreatmentSaved);
  const restoreTreatmentDraft = useTrpSetupStore((state) => state.restoreTreatmentDraft);
  const clearSimulationSetting = useTrpSetupStore((state) => state.clearSimulationSetting);
  const setStepCompleted = useTrpSetupStore((state) => state.setStepCompleted);
  const resetStepProgressFrom = useTrpSetupStore((state) => state.resetStepProgressFrom);
  const applyDataLoadRecord = useTrpSetupStore((state) => state.applyDataLoadRecord);
  const [pendingHypoglycemicDrug, setPendingHypoglycemicDrug] = useState("");
  const [pendingInsulinDrug, setPendingInsulinDrug] = useState("");
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(true);
  const [isDataLoadModalOpen, setIsDataLoadModalOpen] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const invalidFields = useMemo(() => {
    const next = new Set<ValidationField>();

    if (form.hypoglycemicAgentDrugs.length + form.insulinBasedDrugs.length === 0) {
      next.add("treatmentDrugs");
    }

    if (!form.treatmentLineSelect) {
      next.add("treatmentLineSelect");
    }

    if (!form.dmDuration) {
      next.add("dmDuration");
    }

    return next;
  }, [form]);

  const isFormValid = invalidFields.size === 0;
  const hasValidationError = showValidationError && !isFormValid;
  const isDirty = useMemo(() => !isSameTreatmentInfoForm(form, savedForm), [form, savedForm]);
  const combinationStatus = useMemo(() => getTreatmentCombinationStatus(form), [form]);
  const sidebarState = useMemo(
    () =>
      resolveTrpSetupFlowState({
        activeStep: "treatment-info",
        completedSteps,
        patientDiseaseInfo,
        treatmentInfo: savedForm,
        simulationSettingComplete: completedSteps["simulation-setting"],
      }),
    [completedSteps, patientDiseaseInfo, savedForm]
  );

  useEffect(() => {
    if (!hasHydrated || !isDirty) {
      return;
    }

    if (completedSteps["treatment-info"]) {
      setStepCompleted("treatment-info", false);
    }

    if (completedSteps["simulation-setting"]) {
      resetStepProgressFrom("simulation-setting");
    }
  }, [completedSteps, hasHydrated, isDirty, resetStepProgressFrom, setStepCompleted]);

  useEffect(() => {
    if (!hasHydrated || sidebarState.accessMap["treatment-info"]) {
      return;
    }

    router.replace("/trp");
  }, [hasHydrated, router, sidebarState.accessMap]);

  const setField = <K extends keyof TrpTreatmentInfoForm>(
    key: K,
    value: TrpTreatmentInfoForm[K]
  ) => {
    patchTreatmentDraft({ [key]: value } as Partial<TrpTreatmentInfoForm>);
  };

  const addDrug = (key: "hypoglycemicAgentDrugs" | "insulinBasedDrugs", value: string) => {
    if (!value || form[key].includes(value)) {
      return;
    }

    setField(key, [...form[key], value] as TrpTreatmentInfoForm[typeof key]);
  };

  const removeDrug = (key: "hypoglycemicAgentDrugs" | "insulinBasedDrugs", value: string) => {
    setField(
      key,
      form[key].filter((drug) => drug !== value) as TrpTreatmentInfoForm[typeof key]
    );
  };

  const toggleArrayField = (key: "treatmentLineFlags" | "cvdHistory", value: string) => {
    const next = form[key].includes(value)
      ? form[key].filter((item) => item !== value)
      : [...form[key], value];

    setField(key, next as TrpTreatmentInfoForm[typeof key]);
  };

  const focusFirstInvalidField = () => {
    const firstInvalidField = ["treatmentDrugs", "treatmentLineSelect", "dmDuration"].find((field) =>
      invalidFields.has(field as ValidationField)
    );

    if (!firstInvalidField || typeof document === "undefined") {
      return;
    }

    const target = document.querySelector<HTMLElement>(
      `[data-validation-field="${firstInvalidField}"]`
    );

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    target.focus({ preventScroll: true });
  };

  const handleReset = () => {
    restoreTreatmentDraft();
    setShowValidationError(false);
    setPendingHypoglycemicDrug("");
    setPendingInsulinDrug("");
  };

  const handleTest = () => {
    setTreatmentDraft(demoTreatmentPreset);
    setShowValidationError(false);
    setPendingHypoglycemicDrug("");
    setPendingInsulinDrug("");
  };

  const handleImportPatientInfo = () => {
    setIsDataLoadModalOpen(true);
  };

  const handleDataLoadApply = (record: TrpDataLoadPatientRecord) => {
    const nextForm = mapDataLoadRecordToTreatmentInfo(record) as TrpTreatmentInfoForm;

    setTreatmentDraft(nextForm);
    setShowValidationError(false);
    setPendingHypoglycemicDrug("");
    setPendingInsulinDrug("");
    applyDataLoadRecord(record);
    if (completedSteps["treatment-info"]) {
      setStepCompleted("treatment-info", false);
    }
    resetStepProgressFrom("simulation-setting");
    setIsDataLoadModalOpen(false);
    console.log("[TRP-003] imported patient information", {
      patientId: record.patientId,
      form: nextForm,
    });
  };

  const handleApply = () => {
    if (!sidebarState.patientStepComplete) {
      router.push("/trp");
      return;
    }

    if (!isFormValid) {
      setShowValidationError(true);
      focusFirstInvalidField();
      console.log("[TRP-003] apply blocked - missing values", form);
      return;
    }

    setTreatmentSaved(form);
    setShowValidationError(false);
    setStepCompleted("treatment-info", true);

    if (isDirty) {
      clearSimulationSetting();
      resetStepProgressFrom("simulation-setting");
    }

    console.log("[TRP-003] apply clicked", form);
    router.push("/trp/simulation-setting");
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <AppLayout
      headerType="trp"
      scaleMode="fit"
      scaleReferenceWidth={1344}
      scaleReferenceHeight={940}
      minScale={0.35}
    >
      <div className="flex h-full w-[calc(100%-28px)] flex-col gap-2.5 overflow-hidden px-[10px] pt-4 pr-[6px] pb-[10px]">
        <TrpPageTitle title="Default Settings" subtitle="Setup Required" />

        <div className="grid min-h-0 flex-1 grid-cols-[356px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-[4px] overflow-hidden">
          <TrpSetupSidebarPanel
            steps={sidebarState.steps}
            panelVariant="left"
          />

          <TrpFramePanel variant="right" className="flex min-h-0 flex-col gap-[14px]">
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] grid-rows-[minmax(0,1fr)] gap-3 overflow-hidden pr-1">
              <SurfaceCard title="Treatment Overview">
                <div className="flex min-h-0 flex-col gap-3">
                  <TreatmentSubsection
                    title="Hypoglycemic agent"
                    invalid={hasValidationError && invalidFields.has("treatmentDrugs")}
                  >
                    <DrugSelectionBlock
                      options={buildSelectableOptions(
                        hypoglycemicAgentOptions,
                        form.hypoglycemicAgentDrugs
                      )}
                      pendingValue={pendingHypoglycemicDrug}
                      selectedValues={form.hypoglycemicAgentDrugs}
                      onPendingValueChange={(value) => {
                        setPendingHypoglycemicDrug("");
                        addDrug("hypoglycemicAgentDrugs", value);
                      }}
                      onRemove={(value) => removeDrug("hypoglycemicAgentDrugs", value)}
                      invalid={hasValidationError && invalidFields.has("treatmentDrugs")}
                      validationField="treatmentDrugs"
                    />
                  </TreatmentSubsection>

                  <TreatmentSubsection
                    title="Insulin-based"
                    invalid={hasValidationError && invalidFields.has("treatmentDrugs")}
                  >
                    <DrugSelectionBlock
                      options={buildSelectableOptions(insulinBasedOptions, form.insulinBasedDrugs)}
                      pendingValue={pendingInsulinDrug}
                      selectedValues={form.insulinBasedDrugs}
                      onPendingValueChange={(value) => {
                        setPendingInsulinDrug("");
                        addDrug("insulinBasedDrugs", value);
                      }}
                      onRemove={(value) => removeDrug("insulinBasedDrugs", value)}
                      invalid={hasValidationError && invalidFields.has("treatmentDrugs")}
                    />
                  </TreatmentSubsection>

                  <div className="rounded-[15px] border border-white/70 bg-[rgba(255,255,255,0.72)] px-[14px] py-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[10px]">
                    <OverviewRow title="Combination status">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        {["Solo", "Combo"].map((option) => (
                          <ReadonlyChoiceOption
                            key={option}
                            label={option}
                            active={combinationStatus === option}
                          />
                        ))}
                      </div>
                    </OverviewRow>

                    <OverviewRow title="Treatment Line" hasTopBorder>
                      <div className="flex max-w-[176px] flex-col gap-[8px]">
                        <TrpSelect
                          value={form.treatmentLineSelect}
                          options={treatmentLineOptions}
                          onValueChange={(nextValue) => setField("treatmentLineSelect", nextValue)}
                          variant="inline"
                          wrapperClassName="w-full max-w-[172px]"
                          data-validation-field="treatmentLineSelect"
                          className={cn(
                            "h-[30px] rounded-[6px] border border-transparent bg-[#ECEAF1] px-[11px] pr-8 text-[11.5px] leading-[1.2] font-medium tracking-[-0.02em] text-[#534F60]",
                            hasValidationError &&
                              invalidFields.has("treatmentLineSelect") &&
                              "border-[rgba(240,82,69,0.42)] bg-[#FFF4F3]"
                          )}
                          placeholderColor="#888496"
                          iconColor="#8B8796"
                        />
                        <div className="flex flex-col gap-[5px]">
                          {["OAD", "Advanced Therapy", "Insulin-based"].map((option) => (
                            <CompactChoiceOption
                              key={option}
                              label={option}
                              active={form.treatmentLineFlags.includes(option)}
                              onClick={() => toggleArrayField("treatmentLineFlags", option)}
                              variant="checkbox"
                            />
                          ))}
                        </div>
                      </div>
                    </OverviewRow>

                    <OverviewRow title="Prior switch history" hasTopBorder>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        {["Yes", "No"].map((option) => (
                          <CompactChoiceOption
                            key={option}
                            label={option}
                            active={form.priorSwitchHistory === option}
                            onClick={() => setField("priorSwitchHistory", option as "Yes" | "No")}
                            name="prior-switch-history"
                          />
                        ))}
                      </div>
                    </OverviewRow>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard
                title="Severity Status"
                headerRight={
                  <div className="flex items-center gap-2">
                    <MiniActionButton
                      onClick={handleReset}
                      disabled={!isDirty}
                      variant="reset"
                      endIcon={<ResetIcon />}
                    >
                      Reset
                    </MiniActionButton>
                    <MiniActionButton onClick={handleTest}>Test Load</MiniActionButton>
                  </div>
                }
              >
                <div className="rounded-[20px] border border-white/70 bg-[rgba(255,255,255,0.68)] px-4 py-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[12px]">
                  <SeverityRow title="Low Blood Sugar Severity">
                    <div className="flex flex-col gap-[6px] pt-[1px]">
                      {["Step 1 (< 70mg/dL)", "Step 2 (< 54mg/dL)"].map((option) => (
                        <CompactChoiceOption
                          key={option}
                          label={option}
                          active={form.lowBloodSugarSeverity === option}
                          onClick={() =>
                            setField(
                              "lowBloodSugarSeverity",
                              option as TrpTreatmentInfoForm["lowBloodSugarSeverity"]
                            )
                          }
                          name="low-blood-sugar-severity"
                        />
                      ))}
                    </div>
                  </SeverityRow>

                  <SeverityRow title="DM duration" hasTopBorder align="center">
                    <TrpSelect
                      value={form.dmDuration}
                      options={dmDurationOptions}
                      onValueChange={(nextValue) =>
                        setField("dmDuration", nextValue as TrpTreatmentInfoForm["dmDuration"])
                      }
                      variant="inline"
                      wrapperClassName="w-full"
                      data-validation-field="dmDuration"
                      className={cn(
                        "h-[30px] rounded-[6px] border border-transparent bg-[#ECEAF1] px-[11px] pr-8 text-[11.5px] leading-[1.2] font-medium tracking-[-0.02em] text-[#534F60]",
                        hasValidationError &&
                          invalidFields.has("dmDuration") &&
                          "border-[rgba(240,82,69,0.42)] bg-[#FFF4F3]"
                      )}
                      placeholderColor="#888496"
                      iconColor="#8B8796"
                    />
                  </SeverityRow>

                  <SeverityRow title="CVD History" hasTopBorder>
                    <div className="flex flex-col gap-[6px] pt-[1px]">
                      {["ASCVD", "HF", "Stroke"].map((option) => (
                        <CompactChoiceOption
                          key={option}
                          label={option}
                          active={form.cvdHistory.includes(option)}
                          onClick={() => toggleArrayField("cvdHistory", option)}
                          variant="checkbox"
                        />
                      ))}
                    </div>
                  </SeverityRow>

                  <SeverityRow title="Persistence(proxy)" hasTopBorder align="center">
                    <div className="flex items-center gap-3">
                      <RadioButton
                        checked
                        name="persistence-proxy"
                        onChange={() => undefined}
                        size={14}
                        className="pointer-events-none shrink-0"
                      />
                      <span className="font-[Inter,sans-serif] text-[12px] font-bold text-[#747082]">
                        {form.persistenceProxy}
                      </span>
                    </div>
                  </SeverityRow>

                  <div className="border-t border-[#D9D7E3] pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEvidenceOpen((prev) => !prev)}
                      className="w-full rounded-[16px] bg-[#F9F8FC] px-4 py-4 text-left"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-[Inter,sans-serif] text-[13px] font-bold tracking-[-0.02em] text-[#4A465D]">
                          Evidence
                        </span>
                        <EvidenceChevron open={isEvidenceOpen} />
                      </div>
                      {isEvidenceOpen ? (
                        <div className="font-[Inter,sans-serif] text-[12px] leading-[1.45] font-medium text-[#5A5668]">
                          PDC proxy 0.82, Median gap 14days
                        </div>
                      ) : null}
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {hasValidationError ? (
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#F05245]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1.4L13 12.6H1L7 1.4Z" fill="#F05245" />
                    <path d="M7 4.1V7.55" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="7" cy="10.1" r="0.75" fill="white" />
                  </svg>
                  <span>Please enter all required values.</span>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <TrpCtaButton onClick={handleImportPatientInfo}>
                  Import Patient Information
                </TrpCtaButton>
                <TrpCtaButton onClick={handleApply}>Apply</TrpCtaButton>
              </div>
            </div>
          </TrpFramePanel>
        </div>
      </div>
      <TrpDataLoadModal
        open={isDataLoadModalOpen}
        onOpenChange={setIsDataLoadModalOpen}
        onApply={handleDataLoadApply}
        primaryConditionOptions={trpPrimaryConditionDiabetesOnlyOptions}
        requirePrimaryCondition
        includeAllConditionsOption={false}
      />
    </AppLayout>
  );
}
