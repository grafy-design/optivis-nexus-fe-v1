"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import TrpSavedSimulationsTable, {
  type TrpSavedSimulationRow,
} from "@/components/trp/trp-saved-simulations-table";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import TrpDataLoadModal from "@/components/trp/trp-data-load-modal";
import TrpFieldLabel from "@/components/trp/trp-field-label";
import TrpFramePanel from "@/components/trp/trp-frame-panel";
import TrpLabeledField from "@/components/trp/trp-labeled-field";
import TrpPageTitle from "@/components/trp/trp-page-title";
import TrpSelect from "@/components/trp/trp-select";
import TrpSetupSidebarPanel from "@/components/trp/trp-setup-sidebar-panel";
import TrpSubsectionCard from "@/components/trp/trp-subsection-card";
import TrpSubsectionDivider from "@/components/trp/trp-subsection-divider";
import {
  trpPrimaryConditionDiabetesOnlyOptions,
  trpDataLoadMockPatients,
  type TrpDataLoadPatientRecord,
} from "@/components/trp/trp-data-load-mock-data";
import { resolveTrpSetupFlowState } from "@/components/trp/setup-steps";
import { cn } from "@/lib/cn";
import {
  mapDataLoadRecordToPatientDiseaseInfo,
  mapDataLoadRecordToTreatmentInfo,
} from "@/lib/trp-data-load-mappers";
import {
  type TrpSavedSimulationSnapshot,
  type TrpTreatmentInfoForm,
  useTrpSetupStore,
} from "@/store/trp-setup-store";

type SelectOption = {
  label: string;
  value: string;
};

type ProxyMode = "" | "albuminuria" | "dipstick" | "pcr";
type AlbuminuriaLevel = "" | "a1" | "a2" | "a3";
type DipstickLevel = "" | "negative" | "trace" | "1+" | "2+" | "3+" | "4+";
type ValidationField =
  | "disease"
  | "age"
  | "sex"
  | "height"
  | "weight"
  | "weightTrend"
  | "sbp"
  | "sbpTrend"
  | "hba1cValue"
  | "baselineTrend"
  | "fastingGlucose"
  | "randomGlucose"
  | "egfr"
  | "uacr"
  | "proxyMode"
  | "albuminuriaLevel"
  | "dipstickLevel"
  | "pcrValue";

const requiredValidationFields = [
  "disease",
  "age",
  "sex",
  "height",
  "weight",
  "weightTrend",
  "sbp",
  "sbpTrend",
  "hba1cValue",
  "baselineTrend",
  "fastingGlucose",
  "randomGlucose",
  "egfr",
] as const satisfies readonly ValidationField[];

const validationFieldOrder = [
  ...requiredValidationFields,
  "uacr",
  "proxyMode",
  "albuminuriaLevel",
  "dipstickLevel",
  "pcrValue",
] as const satisfies readonly ValidationField[];

type FormValues = {
  disease: string;
  age: string;
  sex: string;
  height: string;
  bmi: string;
  weight: string;
  weightTrend: string;
  sbp: string;
  sbpTrend: string;
  hba1cValue: string;
  baselineTrend: string;
  fastingGlucose: string;
  randomGlucose: string;
  egfr: string;
  uacr: string;
  dontKnowUacr: boolean;
  proxyMode: ProxyMode;
  albuminuriaLevel: AlbuminuriaLevel;
  dipstickLevel: DipstickLevel;
  pcrValue: string;
  medicalHistories: string[];
};

const diseaseOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "Diabetes", value: "diabetes" },
];

const sexOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const trendOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "Stable", value: "stable" },
  { label: "Increase", value: "increase" },
  { label: "Decrease", value: "decrease" },
];

const sbpOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "Normal < 120 mmHg", value: "normal-lt-120" },
  { label: "Elevated", value: "elevated" },
  { label: "High", value: "high" },
];

const proxyOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "Albuminuria", value: "albuminuria" },
  { label: "Dipstick", value: "dipstick" },
  { label: "PCR", value: "pcr" },
];

const medicalHistoryOptions: SelectOption[] = [
  { label: "Select", value: "" },
  { label: "None", value: "None" },
  { label: "Hypertension", value: "Hypertension" },
  { label: "Diabetes mellitus", value: "Diabetes mellitus" },
  { label: "Dyslipidemia/hyperlipidemia", value: "Dyslipidemia/hyperlipidemia" },
  { label: "Chronic kidney disease (CKD)", value: "Chronic kidney disease (CKD)" },
  { label: "Coronary artery disease(CAD)", value: "Coronary artery disease(CAD)" },
  { label: "Heart failure", value: "Heart failure" },
  { label: "History of stroke", value: "History of stroke" },
  { label: "Chronic respiratory disease", value: "Chronic respiratory disease" },
  { label: "Chronic liver disease", value: "Chronic liver disease" },
  { label: "History of malignancy", value: "History of malignancy" },
];

const albuminuriaChoices = [
  { label: "A1 < 30 mg/day", value: "a1" },
  { label: "A2 30~300 mg/day", value: "a2" },
  { label: "A3 > 300 mg/day", value: "a3" },
] as const;

const dipstickChoices = [
  { label: "Negative", value: "negative" },
  { label: "Trace", value: "trace" },
  { label: "1+", value: "1+" },
  { label: "2+", value: "2+" },
  { label: "3+", value: "3+" },
  { label: "4+", value: "4+" },
] as const;

const initialValues: FormValues = {
  disease: "diabetes",
  age: "",
  sex: "",
  height: "",
  bmi: "",
  weight: "",
  weightTrend: "",
  sbp: "",
  sbpTrend: "",
  hba1cValue: "",
  baselineTrend: "",
  fastingGlucose: "",
  randomGlucose: "",
  egfr: "",
  uacr: "",
  dontKnowUacr: false,
  proxyMode: "",
  albuminuriaLevel: "",
  dipstickLevel: "",
  pcrValue: "",
  medicalHistories: [],
};

function isBlankValue(value: string) {
  return value.trim().length === 0;
}

function calculateBmi(height: string, weight: string) {
  const heightValue = Number.parseFloat(height);
  const weightValue = Number.parseFloat(weight);

  if (!Number.isFinite(heightValue) || !Number.isFinite(weightValue) || heightValue <= 0) {
    return "";
  }

  const bmi = weightValue / (heightValue / 100) ** 2;
  return bmi.toFixed(1);
}

function cloneFormValues(values: FormValues): FormValues {
  return {
    ...values,
    medicalHistories: [...values.medicalHistories],
  };
}

function areFormValuesEqual(left: FormValues, right: FormValues) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2V4C10.0845 4.00022 8.23272 4.6877 6.78115 5.93749C5.32958 7.18727 4.37462 8.9164 4.08983 10.8106C3.80504 12.7048 4.20934 14.6382 5.22923 16.2596C6.24912 17.881 7.81691 19.0826 9.64763 19.646C11.4783 20.2095 13.4505 20.0974 15.2055 19.3301C16.9606 18.5628 18.3821 17.1913 19.2117 15.4648C20.0413 13.7382 20.2239 11.7714 19.7262 9.9217C19.2286 8.07199 18.0839 6.46223 16.5 5.385V8H14.5V2H20.5V4H18C19.2425 4.93093 20.251 6.13866 20.9453 7.52734C21.6397 8.91601 22.0008 10.4474 22 12Z"
        fill="currentColor"
      />
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

function TestIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.5 4.5L19.5 10.5L13.5 16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SurfaceCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/70 bg-[rgba(255,255,255,0.64)] p-5 shadow-[0_16px_34px_rgba(38,34,85,0.06)] backdrop-blur-[14px]",
        className
      )}
    >
      <h3 className="m-0 mb-3 font-[Inter,sans-serif] text-[19.5px] leading-[1.12] font-semibold tracking-[-0.04em] text-black">
        {title}
      </h3>
      {children}
    </div>
  );
}

function HubServiceCard({
  title,
  description,
  active = false,
}: {
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-5 py-5 transition-colors",
        active
          ? "border-[#322C76] bg-[#2B2565] text-white shadow-[0_18px_32px_rgba(38,34,85,0.14)]"
          : "border-white/70 bg-white/78 text-[#3F3B4A]"
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 font-[Inter,sans-serif] text-[15px] font-bold">
        {title.slice(0, 1)}
      </div>
      <div className="font-[Inter,sans-serif] text-[18px] font-semibold tracking-[-0.04em]">
        {title}
      </div>
      <p
        className={cn(
          "mt-2 font-[Inter,sans-serif] text-[12px] leading-[1.45] font-medium",
          active ? "text-white/75" : "text-[#7A7686]"
        )}
      >
        {description}
      </p>
    </div>
  );
}

function SavedSimulationHub({
  rows,
  selectedId,
  onSelect,
  onStartNewSimulation,
}: {
  rows: readonly TrpSavedSimulationRow<TrpSavedSimulationSnapshot>[];
  selectedId: string | null;
  onSelect: (row: TrpSavedSimulationRow<TrpSavedSimulationSnapshot>) => void;
  onStartNewSimulation: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[356px_minmax(0,1fr)] gap-[4px] overflow-hidden">
      <TrpFramePanel variant="left" className="flex min-h-0 flex-col gap-4">
        <div className="px-2 pt-1">
          <div className="font-[Inter,sans-serif] text-[12px] font-bold tracking-[0.12em] text-[#8A8498] uppercase">
            Package
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <HubServiceCard
            title="Twin Predict"
            description="Simulates individual patient outcomes and supports data-driven treatment recommendations."
            active
          />
          <HubServiceCard
            title="Trial Optimizer"
            description="Generates optimal trial design strategies through repeated simulation across design conditions."
          />
          <HubServiceCard
            title="Virtual Control"
            description="Supports early study design with digital-twin style virtual control scenarios."
          />
        </div>
      </TrpFramePanel>

      <TrpFramePanel variant="right" className="flex min-h-0 flex-col gap-4">
        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-4 px-2 pt-1">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <h2 className="m-0 font-[Poppins,Inter,sans-serif] text-[46px] leading-[0.98] font-semibold tracking-[-0.05em] text-[#111111]">
                Patient Outcome Prediction
              </h2>
              <p className="mt-4 max-w-[470px] font-[Inter,sans-serif] text-[15px] leading-[1.55] font-medium tracking-[-0.03em] text-[#66616F]">
                Resume a saved TRP simulation or start a new setup to define patient profile,
                treatment information, and simulation strategy.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <TrpCtaButton
                onClick={onStartNewSimulation}
                endIcon={
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path
                      d="M3.25 2.75L8.25 6.5L3.25 10.25"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                New Simulation
              </TrpCtaButton>
              <span className="font-[Inter,sans-serif] text-[12px] font-medium text-[#8A8595]">
                {rows.length} saved simulation{rows.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_25%_20%,rgba(119,163,255,0.38),transparent_32%),linear-gradient(145deg,#1D1947_0%,#25215C_38%,#111631_100%)] shadow-[0_28px_60px_rgba(25,21,64,0.24)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_38%)]" />
            <div className="absolute top-6 left-6 right-6 grid grid-cols-[1.2fr_0.8fr] gap-3">
              <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-[10px]">
                <div className="font-[Inter,sans-serif] text-[11px] font-semibold tracking-[0.14em] text-white/65 uppercase">
                  Summary
                </div>
                <div className="mt-3 h-[150px] rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_100%)] p-3">
                  <div className="grid h-full grid-cols-[repeat(4,minmax(0,1fr))] gap-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-[10px] bg-white/10"
                        style={{ opacity: 0.45 + ((index % 3) * 0.12) }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-[10px]">
                <div className="font-[Inter,sans-serif] text-[11px] font-semibold tracking-[0.14em] text-white/65 uppercase">
                  Dashboard
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { color: "#4D6BFF", width: "82%" },
                    { color: "#F16600", width: "68%" },
                    { color: "#24C6C9", width: "74%" },
                    { color: "#FFFFFF", width: "56%" },
                  ].map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="h-[6px] rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: item.width, backgroundColor: item.color }}
                        />
                      </div>
                      <div className="h-[56px] rounded-[12px] bg-white/8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 px-2 pb-1">
          <TrpSavedSimulationsTable
            rows={rows}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>
      </TrpFramePanel>
    </div>
  );
}

function InputControl({
  value,
  placeholder = "Value",
  onChange,
  disabled = false,
  readOnly = false,
  invalid = false,
  validationField,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  validationField?: ValidationField;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid}
      data-validation-field={validationField}
      className={cn(
        "h-8 w-full rounded-[8px] border border-[#EFEFF4] bg-[#EFEFF4] px-3 font-[Inter,sans-serif] text-[12px] font-semibold tracking-[-0.03em] text-[#4E4A57] outline-none placeholder:text-[#B2B1BA]",
        invalid && "border-[rgba(240,82,69,0.28)]",
        disabled && "opacity-75"
      )}
    />
  );
}

function UnitInputControl({
  value,
  unit,
  placeholder = "Value",
  onChange,
  disabled = false,
  readOnly = false,
  invalid = false,
  validationField,
}: {
  value: string;
  unit: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  validationField?: ValidationField;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-full min-w-0 items-center gap-1 rounded-[8px] border border-[#EFEFF4] bg-[#EFEFF4] px-3",
        invalid && "border-[rgba(240,82,69,0.28)]",
        disabled && "opacity-75"
      )}
    >
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid}
        data-validation-field={validationField}
        className="min-w-0 flex-1 border-none bg-transparent font-[Inter,sans-serif] text-[12px] font-semibold tracking-[-0.03em] text-[#484646] outline-none placeholder:text-[#B2B1BA]"
      />
      <span className="shrink-0 font-[Inter,sans-serif] text-[10px] font-semibold tracking-[-0.03em] whitespace-nowrap text-[#787776]">
        {unit}
      </span>
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-2 inline-flex items-center gap-2">
      <CustomCheckbox checked={checked} onChange={() => onChange(!checked)} size={14} />
      <span className="font-[Inter,sans-serif] text-[10px] font-medium tracking-[-0.02em] text-[#8F8B99]">
        {label}
      </span>
    </label>
  );
}

function ChoicePill({
  label,
  selected,
  onClick,
  invalid = false,
  validationField,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  invalid?: boolean;
  validationField?: ValidationField;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-validation-field={validationField}
      onClick={onClick}
      className="inline-flex items-center gap-1"
    >
      <span
        className={cn(
          "flex h-[10px] w-[10px] items-center justify-center rounded-full border-[1.3px]",
          selected
            ? "border-[#6A4CFF] bg-[#6A4CFF]"
            : invalid
              ? "border-[rgba(240,82,69,0.28)] bg-transparent"
              : "border-[#CFCBDA] bg-transparent"
        )}
      >
        {selected ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
      </span>
      <span
        className={cn(
          "font-[Inter,sans-serif] text-[9px] leading-[1.2] font-medium tracking-[-0.02em]",
          invalid ? "text-[#F05245]" : "text-[#6A6675]"
        )}
      >
        {label}
      </span>
    </button>
  );
}

function HistoryChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-[10px] bg-white/70 px-1.5 py-0.5 font-[Inter,sans-serif] text-[9px] leading-[1.2] font-medium text-[#6B6777]"
    >
      {label}
      <span className="text-[#A6A2B2]">×</span>
    </button>
  );
}

function PatientProfileCard({
  values,
  setField,
  pendingHistory,
  onPendingHistoryChange,
  onAddHistory,
  onRemoveHistory,
  isFieldInvalid,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  pendingHistory: string;
  onPendingHistoryChange: (value: string) => void;
  onAddHistory: (value: string) => void;
  onRemoveHistory: (value: string) => void;
  isFieldInvalid: (field: ValidationField) => boolean;
}) {
  const historyOptions = medicalHistoryOptions.map((option) => {
    if (!option.value) {
      return option;
    }

    if (option.value === "None") {
      return {
        ...option,
        disabled: values.medicalHistories.some((history) => history !== "None"),
      };
    }

    return {
      ...option,
      disabled: values.medicalHistories.includes("None"),
    };
  });

  return (
    <SurfaceCard title="Patient profile">
      <div className="flex flex-col gap-3">
        <div className="rounded-[20px] bg-[linear-gradient(180deg,#393172_0%,#262255_100%)] px-4 pt-3.5 pb-4 shadow-[0_10px_20px_rgba(38,34,85,0.16)]">
          <div className="font-[Inter,sans-serif] text-[17px] font-bold tracking-[-0.03em] text-white">
            Primary condition
          </div>

          <div className="mt-[36px] flex items-center justify-between">
            <div className="pb-1">
              <TrpFieldLabel
                label="Disease"
                light
                required
                tone={isFieldInvalid("disease") ? "danger" : "default"}
              />
            </div>
            <TrpSelect
              value={values.disease}
              options={diseaseOptions}
              onValueChange={(value) => setField("disease", value)}
              variant="soft"
              wrapperClassName="max-w-[300px]"
              className={cn(
                isFieldInvalid("disease") &&
                  "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
              )}
              placeholderColor="#B2B1BA"
              iconColor={isFieldInvalid("disease") ? "#F05245" : undefined}
              aria-invalid={isFieldInvalid("disease")}
              data-validation-field="disease"
            />
          </div>
        </div>

        <TrpSubsectionCard title="Patient basics">
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <TrpLabeledField
                label="Age"
                required
                tone={isFieldInvalid("age") ? "danger" : "default"}
                control={
                  <InputControl
                    value={values.age}
                    onChange={(value) => setField("age", value)}
                    invalid={isFieldInvalid("age")}
                    validationField="age"
                  />
                }
              />
            </div>
            <div className="min-w-0">
              <TrpLabeledField
                label="Sex"
                required
                tone={isFieldInvalid("sex") ? "danger" : "default"}
                control={
                  <TrpSelect
                    value={values.sex}
                    options={sexOptions}
                    onValueChange={(value) => setField("sex", value)}
                    variant="soft"
                    wrapperClassName="max-w-[300px]"
                    className={cn(
                      isFieldInvalid("sex") &&
                        "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
                    )}
                    placeholderColor="#B2B1BA"
                    iconColor={isFieldInvalid("sex") ? "#F05245" : undefined}
                    aria-invalid={isFieldInvalid("sex")}
                    data-validation-field="sex"
                  />
                }
              />
            </div>
          </div>

          <TrpSubsectionDivider>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <TrpLabeledField
                  label="Height"
                  tone={isFieldInvalid("height") ? "danger" : "default"}
                  control={
                    <UnitInputControl
                      value={values.height}
                      unit="cm"
                      onChange={(value) => setField("height", value)}
                      invalid={isFieldInvalid("height")}
                      validationField="height"
                    />
                  }
                />
                <TrpLabeledField
                  label="Weight"
                  tone={isFieldInvalid("weight") ? "danger" : "default"}
                  control={
                    <UnitInputControl
                      value={values.weight}
                      unit="kg"
                      onChange={(value) => setField("weight", value)}
                      invalid={isFieldInvalid("weight")}
                      validationField="weight"
                    />
                  }
                />
              </div>
              <div className="flex flex-col gap-3">
                <TrpLabeledField
                  label="BMI"
                  control={
                    <UnitInputControl
                      value={values.bmi}
                      unit="kg/m²"
                      placeholder="Auto calculated"
                      onChange={() => {}}
                      readOnly
                    />
                  }
                />
                <TrpLabeledField
                  label="Trend"
                  helper="Weight"
                  tone={isFieldInvalid("weightTrend") ? "danger" : "default"}
                  control={
                    <TrpSelect
                      value={values.weightTrend}
                      options={trendOptions}
                      onValueChange={(value) => setField("weightTrend", value)}
                      variant="soft"
                      wrapperClassName="max-w-[300px]"
                      className={cn(
                        isFieldInvalid("weightTrend") &&
                          "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
                      )}
                      placeholderColor="#B2B1BA"
                      iconColor={isFieldInvalid("weightTrend") ? "#F05245" : undefined}
                      aria-invalid={isFieldInvalid("weightTrend")}
                      data-validation-field="weightTrend"
                    />
                  }
                />
              </div>
            </div>
          </TrpSubsectionDivider>

          <TrpSubsectionDivider>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <TrpLabeledField
                  label="SBP"
                  tone={isFieldInvalid("sbp") ? "danger" : "default"}
                  control={
                    <TrpSelect
                      value={values.sbp}
                      options={sbpOptions}
                      onValueChange={(value) => setField("sbp", value)}
                      variant="soft"
                      wrapperClassName="max-w-[300px]"
                      className={cn(
                        isFieldInvalid("sbp") &&
                          "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
                      )}
                      placeholderColor="#B2B1BA"
                      iconColor={isFieldInvalid("sbp") ? "#F05245" : undefined}
                      aria-invalid={isFieldInvalid("sbp")}
                      data-validation-field="sbp"
                    />
                  }
                />
              </div>
              <div className="min-w-0">
                <TrpLabeledField
                  label="Trend"
                  helper="SBP"
                  tone={isFieldInvalid("sbpTrend") ? "danger" : "default"}
                  control={
                    <TrpSelect
                      value={values.sbpTrend}
                      options={trendOptions}
                      onValueChange={(value) => setField("sbpTrend", value)}
                      variant="soft"
                      wrapperClassName="max-w-[300px]"
                      className={cn(
                        isFieldInvalid("sbpTrend") &&
                          "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
                      )}
                      placeholderColor="#B2B1BA"
                      iconColor={isFieldInvalid("sbpTrend") ? "#F05245" : undefined}
                      aria-invalid={isFieldInvalid("sbpTrend")}
                      data-validation-field="sbpTrend"
                    />
                  }
                />
              </div>
            </div>
          </TrpSubsectionDivider>
        </TrpSubsectionCard>

        <TrpSubsectionCard title="Comorbidities & history">
          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="pt-1">
              <TrpFieldLabel label="Medical history" helper="Underlying disease" />
            </div>
            <div>
              <TrpSelect
                value={pendingHistory}
                options={historyOptions}
                onValueChange={(value) => {
                  onPendingHistoryChange(value);
                  if (value) {
                    onAddHistory(value);
                  }
                }}
                variant="soft"
                wrapperClassName="max-w-[300px]"
                placeholderColor="#B2B1BA"
              />
            </div>
          </div>

          <div className="mt-3 min-h-[74px] rounded-[14px] border border-[#E4E2EC] bg-[#F9F8FC] p-3">
            <div className="flex flex-wrap gap-x-1.5 gap-y-1.5">
              {values.medicalHistories.map((history) => (
                <HistoryChip
                  key={history}
                  label={history}
                  onRemove={() => onRemoveHistory(history)}
                />
              ))}
            </div>
          </div>
        </TrpSubsectionCard>
      </div>
    </SurfaceCard>
  );
}

function ProxyDetails({
  values,
  setField,
  isFieldInvalid,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  isFieldInvalid: (field: ValidationField) => boolean;
}) {
  if (values.proxyMode === "albuminuria") {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {albuminuriaChoices.map((choice) => (
          <ChoicePill
            key={choice.value}
            label={choice.label}
            selected={values.albuminuriaLevel === choice.value}
            onClick={() => setField("albuminuriaLevel", choice.value)}
            invalid={isFieldInvalid("albuminuriaLevel")}
            validationField="albuminuriaLevel"
          />
        ))}
      </div>
    );
  }

  if (values.proxyMode === "dipstick") {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {dipstickChoices.map((choice) => (
          <ChoicePill
            key={choice.value}
            label={choice.label}
            selected={values.dipstickLevel === choice.value}
            onClick={() => setField("dipstickLevel", choice.value)}
            invalid={isFieldInvalid("dipstickLevel")}
            validationField="dipstickLevel"
          />
        ))}
      </div>
    );
  }

  if (values.proxyMode === "pcr") {
    return (
      <div>
        <UnitInputControl
          value={values.pcrValue}
          unit="mg/g"
          onChange={(value) => setField("pcrValue", value)}
          invalid={isFieldInvalid("pcrValue")}
          validationField="pcrValue"
        />
      </div>
    );
  }

  return null;
}

function KidneyStatusRow({
  label,
  required = false,
  tone = "default",
  control,
  extra,
  withDivider = false,
}: {
  label: string;
  required?: boolean;
  tone?: "default" | "danger";
  control: ReactNode;
  extra?: ReactNode;
  withDivider?: boolean;
}) {
  return (
    <div className={cn("flex py-3", withDivider && "border-t border-[#D8D6E0]")}>
      <div className="flex-1">
        <TrpFieldLabel label={label} required={required} tone={tone} />
      </div>
      <div className="flex-1">
        {control}
        {extra ? <div>{extra}</div> : null}
      </div>
    </div>
  );
}

function BaselineCard({
  values,
  setField,
  isFieldInvalid,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  isFieldInvalid: (field: ValidationField) => boolean;
}) {
  return (
    <SurfaceCard title="Baseline">
      <div className="flex flex-col gap-4">
        <TrpSubsectionCard title="Glycemic status" className="rounded-[22px] border-[#E8E5EF] p-4">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-0 flex-1 basis-[260px]">
                <TrpLabeledField
                  label="HbA1c"
                  helper="recent"
                  required
                  tone={isFieldInvalid("hba1cValue") ? "danger" : "default"}
                  labelWidth={58}
                  control={
                    <UnitInputControl
                      value={values.hba1cValue}
                      unit="%"
                      onChange={(value) => setField("hba1cValue", value)}
                      invalid={isFieldInvalid("hba1cValue")}
                      validationField="hba1cValue"
                    />
                  }
                />
              </div>

              <div className="min-w-0 flex-1 basis-[260px]">
                <TrpLabeledField
                  label="Trend"
                  helper="Weight"
                  tone={isFieldInvalid("baselineTrend") ? "danger" : "default"}
                  labelWidth={58}
                  control={
                    <TrpSelect
                      value={values.baselineTrend}
                      options={trendOptions}
                      onValueChange={(value) => setField("baselineTrend", value)}
                      variant="soft"
                      wrapperClassName="max-w-[300px]"
                      className={cn(
                        isFieldInvalid("baselineTrend") &&
                          "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
                      )}
                      placeholderColor="#B2B1BA"
                      iconColor={isFieldInvalid("baselineTrend") ? "#F05245" : undefined}
                      aria-invalid={isFieldInvalid("baselineTrend")}
                      data-validation-field="baselineTrend"
                    />
                  }
                />
              </div>
            </div>

            <div className="border-t border-[#D8D6E0] pt-3">
              <div className="flex flex-wrap gap-4">
                <div className="min-w-0 flex-1 basis-[260px]">
                  <TrpLabeledField
                    label="Fasting glucose"
                    tone={isFieldInvalid("fastingGlucose") ? "danger" : "default"}
                    labelWidth={58}
                    control={
                      <UnitInputControl
                        value={values.fastingGlucose}
                        unit="mg/dL"
                        onChange={(value) => setField("fastingGlucose", value)}
                        invalid={isFieldInvalid("fastingGlucose")}
                        validationField="fastingGlucose"
                      />
                    }
                  />
                </div>

                <div className="min-w-0 flex-1 basis-[260px]">
                  <TrpLabeledField
                    label="Random glucose"
                    tone={isFieldInvalid("randomGlucose") ? "danger" : "default"}
                    labelWidth={58}
                    control={
                      <UnitInputControl
                        value={values.randomGlucose}
                        unit="mg/dL"
                        onChange={(value) => setField("randomGlucose", value)}
                        invalid={isFieldInvalid("randomGlucose")}
                        validationField="randomGlucose"
                      />
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </TrpSubsectionCard>

        <TrpSubsectionCard
          title="Kidney status"
          className="rounded-[22px] border-[#E8E5EF] p-4"
          titleClassName="mb-3"
        >
          <KidneyStatusRow
            label="eGFR"
            required
            tone={isFieldInvalid("egfr") ? "danger" : "default"}
            control={
              <UnitInputControl
                value={values.egfr}
                unit="mL/min/1.73m²"
                onChange={(value) => setField("egfr", value)}
                invalid={isFieldInvalid("egfr")}
                validationField="egfr"
              />
            }
          />

          <KidneyStatusRow
            label="UACR"
            required
            tone={isFieldInvalid("uacr") ? "danger" : "default"}
            withDivider
            control={
              <UnitInputControl
                value={values.uacr}
                unit="mg/g"
                disabled={values.dontKnowUacr}
                onChange={(value) => setField("uacr", value)}
                invalid={isFieldInvalid("uacr")}
                validationField="uacr"
              />
            }
            extra={
              <CheckboxRow
                checked={values.dontKnowUacr}
                label="Don't Know UACR"
                onChange={(checked) => {
                  setField("dontKnowUacr", checked);
                  if (!checked) {
                    setField("proxyMode", "");
                    setField("albuminuriaLevel", "");
                    setField("dipstickLevel", "");
                    setField("pcrValue", "");
                  }
                }}
              />
            }
          />

          <div className="mt-3 min-h-[124px] rounded-[18px] border border-[#D7D4E1] bg-white/60 px-4 py-[15px]">
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 md:grid-cols-[72px_minmax(0,1fr)]">
                <div className="flex-1">
                  <TrpFieldLabel
                    label="Proxy"
                    tone={isFieldInvalid("proxyMode") ? "danger" : "default"}
                  />
                </div>
                <div className="flex-1">
                  <TrpSelect
                    value={values.proxyMode}
                    options={proxyOptions}
                    disabled={!values.dontKnowUacr}
                    onValueChange={(value) => {
                      setField("proxyMode", value as ProxyMode);
                      setField("albuminuriaLevel", "");
                      setField("dipstickLevel", "");
                      setField("pcrValue", "");
                    }}
                    variant="soft"
                    wrapperClassName="w-full max-w-none"
                    className={cn(
                      isFieldInvalid("proxyMode") &&
                        "border-[rgba(240,82,69,0.28)] bg-[#EFEFF4] text-[#4E4A57]"
                    )}
                    placeholderColor="#B2B1BA"
                    iconColor={isFieldInvalid("proxyMode") ? "#F05245" : undefined}
                    aria-invalid={isFieldInvalid("proxyMode")}
                    data-validation-field="proxyMode"
                  />
                </div>
              </div>

              <p
                className={cn(
                  "-mt-1 font-[Inter,sans-serif] text-[10px] leading-[1.35] font-medium",
                  isFieldInvalid("proxyMode") ? "text-[rgba(240,82,69,0.78)]" : "text-[#A6A2B2]"
                )}
              >
                *If you don&apos;t know UACR, Using proxy
              </p>

              {values.dontKnowUacr ? (
                <div className="min-w-0">
                  <ProxyDetails
                    values={values}
                    setField={setField}
                    isFieldInvalid={isFieldInvalid}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </TrpSubsectionCard>
      </div>
    </SurfaceCard>
  );
}

export default function TrpPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => cloneFormValues(initialValues));
  const [resetSnapshot, setResetSnapshot] = useState<FormValues>(() =>
    cloneFormValues(initialValues)
  );
  const [selectedSavedSimulationId, setSelectedSavedSimulationId] = useState<string | null>(null);
  const [hasDismissedSavedSimulationHub, setHasDismissedSavedSimulationHub] = useState(false);
  const completedSteps = useTrpSetupStore((state) => state.completedSteps);
  const setStepCompleted = useTrpSetupStore((state) => state.setStepCompleted);
  const resetStepProgressFrom = useTrpSetupStore((state) => state.resetStepProgressFrom);
  const [pendingHistory, setPendingHistory] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);
  const [isDataLoadModalOpen, setIsDataLoadModalOpen] = useState(false);
  const hasHydrated = useTrpSetupStore((state) => state.hasHydrated);
  const storedPatientDiseaseInfo = useTrpSetupStore((state) => state.patientDiseaseInfo);
  const setPatientDiseaseInfo = useTrpSetupStore((state) => state.setPatientDiseaseInfo);
  const applyDataLoadRecord = useTrpSetupStore((state) => state.applyDataLoadRecord);
  const loadSavedSimulation = useTrpSetupStore((state) => state.loadSavedSimulation);
  const setTreatmentDraft = useTrpSetupStore((state) => state.setTreatmentDraft);
  const setTreatmentSaved = useTrpSetupStore((state) => state.setTreatmentSaved);
  const treatmentSaved = useTrpSetupStore((state) => state.treatmentSaved);
  const savedSimulations = useTrpSetupStore((state) => state.savedSimulations);

  useEffect(() => {
    if (!hasHydrated || !storedPatientDiseaseInfo) {
      return;
    }

    const nextValues = cloneFormValues(storedPatientDiseaseInfo as FormValues);

    setValues(nextValues);
    setResetSnapshot(cloneFormValues(nextValues));
    setPendingHistory("");
    setShowValidationError(false);
  }, [hasHydrated, storedPatientDiseaseInfo]);

  const sidebarState = useMemo(
    () =>
      resolveTrpSetupFlowState({
        activeStep: "patient-disease-info",
        completedSteps,
        patientDiseaseInfo: storedPatientDiseaseInfo,
        treatmentInfo: treatmentSaved,
        simulationSettingComplete: completedSteps["simulation-setting"],
      }),
    [completedSteps, storedPatientDiseaseInfo, treatmentSaved]
  );

  const savedSimulationRows = useMemo<TrpSavedSimulationRow<TrpSavedSimulationSnapshot>[]>(
    () =>
      savedSimulations.map((row) => ({
        id: row.id,
        simulationName: row.simulationName,
        disease: row.disease,
        targetOutcome: row.targetOutcome,
        treatment: row.treatment,
        lastUpdated: row.lastUpdated,
        value: row.snapshot,
      })),
    [savedSimulations]
  );
  const hasInProgressSetup =
    storedPatientDiseaseInfo !== null ||
    completedSteps["patient-disease-info"] ||
    completedSteps["treatment-info"] ||
    completedSteps["simulation-setting"];
  const showSavedSimulationHub =
    savedSimulationRows.length > 0 && !hasInProgressSetup && !hasDismissedSavedSimulationHub;

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  useEffect(() => {
    const nextBmi = calculateBmi(values.height, values.weight);

    if (values.bmi === nextBmi) {
      return;
    }

    setValues((previous) => ({
      ...previous,
      bmi: nextBmi,
    }));
  }, [values.bmi, values.height, values.weight]);

  const invalidFields = useMemo(() => {
    const next = new Set<ValidationField>();

    for (const field of requiredValidationFields) {
      if (isBlankValue(values[field])) {
        next.add(field);
      }
    }

    if (!values.dontKnowUacr) {
      if (isBlankValue(values.uacr)) {
        next.add("uacr");
      }
      return next;
    }

    if (!values.proxyMode) {
      next.add("proxyMode");
      return next;
    }

    if (values.proxyMode === "albuminuria" && !values.albuminuriaLevel) {
      next.add("albuminuriaLevel");
    }

    if (values.proxyMode === "dipstick" && !values.dipstickLevel) {
      next.add("dipstickLevel");
    }

    if (values.proxyMode === "pcr" && isBlankValue(values.pcrValue)) {
      next.add("pcrValue");
    }

    return next;
  }, [values]);

  const isFormValid = invalidFields.size === 0;
  const isDirty = useMemo(
    () => !areFormValuesEqual(values, resetSnapshot),
    [resetSnapshot, values]
  );
  const hasValidationError = showValidationError && !isFormValid;
  const isFieldInvalid = (field: ValidationField) => hasValidationError && invalidFields.has(field);

  useEffect(() => {
    if (!hasHydrated || !isDirty) {
      return;
    }

    if (completedSteps["patient-disease-info"]) {
      setStepCompleted("patient-disease-info", false);
    }

    if (completedSteps["treatment-info"] || completedSteps["simulation-setting"]) {
      resetStepProgressFrom("treatment-info");
    }
  }, [completedSteps, hasHydrated, isDirty, resetStepProgressFrom, setStepCompleted]);

  const focusFirstInvalidField = () => {
    const firstInvalidField = validationFieldOrder.find((field) => invalidFields.has(field));

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

  const handleAddHistory = (value: string) => {
    setValues((previous) => {
      if (!value) {
        return previous;
      }

      if (value === "None") {
        if (previous.medicalHistories.length === 1 && previous.medicalHistories[0] === "None") {
          return previous;
        }

        return {
          ...previous,
          medicalHistories: ["None"],
        };
      }

      const nextHistories = previous.medicalHistories.filter((history) => history !== "None");

      if (nextHistories.includes(value)) {
        return previous;
      }

      return {
        ...previous,
        medicalHistories: [...nextHistories, value],
      };
    });
    setPendingHistory("");
  };

  const handleRemoveHistory = (value: string) => {
    setValues((previous) => ({
      ...previous,
      medicalHistories: previous.medicalHistories.filter((history) => history !== value),
    }));
  };

  const handleImportPatientInformation = () => {
    setIsDataLoadModalOpen(true);
  };

  const handleDataLoadApply = (record: TrpDataLoadPatientRecord) => {
    const nextValues = mapDataLoadRecordToPatientDiseaseInfo(record) as FormValues;
    const nextTreatment = mapDataLoadRecordToTreatmentInfo(record) as TrpTreatmentInfoForm;

    setValues(nextValues);
    setResetSnapshot(cloneFormValues(nextValues));
    setSelectedSavedSimulationId(null);
    setPendingHistory("");
    setShowValidationError(false);
    setIsDataLoadModalOpen(false);
    applyDataLoadRecord(record);
    setTreatmentDraft(nextTreatment);
    setTreatmentSaved(nextTreatment);
    if (completedSteps["patient-disease-info"]) {
      setStepCompleted("patient-disease-info", false);
    }
    resetStepProgressFrom("treatment-info");
    console.log("[TRP-002] imported patient information", {
      patientId: record.patientId,
      values: nextValues,
      treatment: nextTreatment,
    });
  };

  const handleLoadSavedSimulation = (row: TrpSavedSimulationRow<TrpSavedSimulationSnapshot>) => {
    const nextValues = row.value.patientDiseaseInfo
      ? cloneFormValues(row.value.patientDiseaseInfo as FormValues)
      : cloneFormValues(initialValues);

    loadSavedSimulation(row.value);
    setHasDismissedSavedSimulationHub(true);
    setSelectedSavedSimulationId(row.id);
    setValues(nextValues);
    setResetSnapshot(cloneFormValues(nextValues));
    setPendingHistory("");
    setShowValidationError(false);
    console.log("[TRP-002] loaded saved simulation", row.simulationName, nextValues);
  };

  const handleStartNewSimulation = () => {
    setHasDismissedSavedSimulationHub(true);
    setSelectedSavedSimulationId(null);
    setValues(cloneFormValues(initialValues));
    setResetSnapshot(cloneFormValues(initialValues));
    setPendingHistory("");
    setShowValidationError(false);
  };

  const handleReset = () => {
    const nextValues = cloneFormValues(resetSnapshot);

    setValues(nextValues);
    setPendingHistory("");
    setShowValidationError(false);
    console.log("[TRP-002] reset clicked", nextValues);
  };

  const handleTestLoad = () => {
    const demoRecord = trpDataLoadMockPatients[0];

    if (!demoRecord) {
      return;
    }

    const nextValues = cloneFormValues(
      mapDataLoadRecordToPatientDiseaseInfo(demoRecord) as FormValues
    );

    setSelectedSavedSimulationId(null);
    setValues(nextValues);
    setPendingHistory("");
    setShowValidationError(false);
    console.log("[TRP-002] test load clicked", demoRecord.patientId, nextValues);
  };

  const handleApply = () => {
    if (!isFormValid) {
      setShowValidationError(true);
      focusFirstInvalidField();
      console.log("[TRP-002] apply blocked - missing values", values);
      return;
    }

    console.log("[TRP-002] apply clicked", values);
    setPatientDiseaseInfo(values);
    setStepCompleted("patient-disease-info", true);
    resetStepProgressFrom("treatment-info");
    router.push("/trp/treatment-info");
  };

  return (
    <AppLayout headerType="trp">
      <div className="flex h-full w-[calc(100%-28px)] flex-col gap-2.5 overflow-hidden px-[10px] pt-4 pr-[6px] pb-[10px]">
        <TrpPageTitle title="Default Settings" subtitle="Default settings" />

        <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-hidden">
          {showSavedSimulationHub ? (
            <SavedSimulationHub
              rows={savedSimulationRows}
              selectedId={selectedSavedSimulationId}
              onSelect={handleLoadSavedSimulation}
              onStartNewSimulation={handleStartNewSimulation}
            />
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-[356px_minmax(0,1fr)] gap-[4px] overflow-hidden">
              <TrpSetupSidebarPanel
                steps={sidebarState.steps}
                panelVariant="left"
              />

              <TrpFramePanel variant="right" className="flex min-h-0 flex-col gap-3">


                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] gap-3 overflow-y-auto pr-1">
                  <PatientProfileCard
                    values={values}
                    setField={setField}
                    pendingHistory={pendingHistory}
                    onPendingHistoryChange={setPendingHistory}
                    onAddHistory={handleAddHistory}
                    onRemoveHistory={handleRemoveHistory}
                    isFieldInvalid={isFieldInvalid}
                  />
                  <BaselineCard values={values} setField={setField} isFieldInvalid={isFieldInvalid} />
                </div>

                <div className="flex shrink-0 justify-end">
                  <div className="flex flex-col items-end gap-2">
                    {hasValidationError ? (
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#F05245]">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path d="M7 1.4L13 12.6H1L7 1.4Z" fill="#F05245" />
                          <path
                            d="M7 4.1V7.55"
                            stroke="white"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                          <circle cx="7" cy="10.1" r="0.75" fill="white" />
                        </svg>
                        <span>Please enter all values.</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-end gap-3">
                      <TrpCtaButton onClick={handleImportPatientInformation}>
                        Import Patient Information
                      </TrpCtaButton>
                      <TrpCtaButton
                        onClick={handleApply}
                        endIcon={
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path
                              d="M3.25 2.75L8.25 6.5L3.25 10.25"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                      >
                        Apply
                      </TrpCtaButton>
                    </div>
                  </div>
                </div>
              </TrpFramePanel>
            </div>
          )}
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
