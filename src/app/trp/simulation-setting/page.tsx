"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import { GlassTestButton } from "@/components/ui/glass-button";
import TrpFramePanel from "@/components/trp/trp-frame-panel";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import TrpPageTitle from "@/components/trp/trp-page-title";
import TrpSetupSidebarPanel from "@/components/trp/trp-setup-sidebar-panel";
import { resolveTrpSetupFlowState } from "@/components/trp/setup-steps";
import {
  convertSimulationSavedToSettingData,
  useTrpSetupStore,
  type TrpSimulationDrug,
  type TrpSimulationSettingData,
  type TrpSimulationStrategy,
  type TrpSimulationTargetConfig,
  type TrpTimelineSlot,
  type TrpTreatmentInfoForm,
} from "@/store/trp-setup-store";
import { cn } from "@/lib/cn";
import {
  createInitialTrpSimulationSettingForm,
  isSameTrpSimulationSettingForm,
} from "@/lib/trp-simulation-setting";
import {
  buildTrpSimulationDrugFromCatalogEntry,
  buildTrpSimulationDrugFromName,
  buildTrpSimulationDrugListFromTreatment,
  getTrpDrugCombinationWarnings,
  getUniqueTrpDrugCombinationWarnings,
  trpDrugCatalog,
  type TrpDrugCatalogEntry,
  type TrpDrugCombinationWarning,
} from "@/lib/trp-drug-catalog";

type CategoryItem = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  saved?: boolean;
};

type DragMode = "move" | "resize-start" | "resize-end";

type ActiveDragState = {
  drugId: number;
  strategyIndex: number;
  mode: DragMode;
  startX: number;
  containerWidth: number;
  initialSlot: TrpTimelineSlot;
};

const CATEGORY_OPTIONS = ["Patient Info", "Medical History", "Treatment Info"] as const;
const DETAIL_OPTIONS = ["Demographic Info", "Baseline"] as const;
const VALUE_OPTIONS = ["BMI", "SBP", "HbA1c", "Fasting glucose", "eGFR"] as const;
const FOLLOW_UP_OPTIONS = [3, 6, 9, 12, 15, 18, 21, 24] as const;
const STRATEGY_LABELS = ["A", "B", "C"] as const;
const TIMELINE_MAX_MONTHS = 24;
const TIMELINE_STEP = 3;
const TIMELINE_MIN_DURATION = 3;

const initialTargetConfigs: TrpSimulationTargetConfig[] = [
  { label: "Increase", value: "", unit: "%", months: "" },
  { label: "Stable", value: "", unit: "%", months: "" },
  { label: "Decrease", value: "", unit: "%", months: "" },
];

const initialStrategies: TrpSimulationStrategy[] = [
  {
    id: "strategy-a",
    title: "Strategy A",
    color: "#3A11D8",
    keepCurrent: true,
  },
  {
    id: "strategy-b",
    title: "Strategy B",
    color: "#F06600",
    keepCurrent: true,
  },
  {
    id: "strategy-c",
    title: "Strategy C",
    color: "#24C6C9",
    keepCurrent: true,
  },
];

const testLoadDrugNames = ["Metformin", "SGLT2 inhibitor", "Basal insulin"] as const;

function CheckboxChecked({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="16"
        rx="3.5"
        fill="var(--tertiary-40)"
        stroke="var(--tertiary-40)"
      />
      <path
        d="M4 8.5l3.5 3.5 5.5-6"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckboxUnchecked({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <rect x="0.5" y="0.5" width="16" height="16" rx="3.5" fill="white" stroke="var(--neutral-80)" />
    </svg>
  );
}

function IconDownload({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v13M7 11l5 5 5-5"
        stroke="var(--primary-15)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="var(--primary-15)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAddFolder({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"
        stroke="var(--primary-15)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v6M9 14h6"
        stroke="var(--primary-15)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="var(--neutral-60)" strokeWidth="1.4" />
      <path d="M13.5 13.5l3 3" stroke="var(--neutral-60)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconWarning({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className="shrink-0">
      <path
        d="M5.134 1.5L0.804 9a1 1 0 00.866 1.5h8.66A1 1 0 0011.196 9L6.866 1.5a1 1 0 00-1.732 0z"
        fill="#F59E0B"
      />
      <path d="M6 4.5v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6" cy="8.5" r="0.6" fill="white" />
    </svg>
  );
}

function IconDelete({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M2.5 4h11M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M6.5 7v4M9.5 7v4M3.5 4l.75 8.5a1 1 0 001 .9h5.5a1 1 0 001-.9L12.5 4"
        stroke="var(--neutral-70)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlassIconButton({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative shrink-0 flex items-center justify-center cursor-pointer"
      style={{ width: 44, height: 44 }}
    >
      <div
        className="rounded-full absolute inset-0"
        style={{
          background: "rgba(255,255,255,0.6)",
          boxShadow: "0px 0px 2px rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.10)",
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function InfoIcon({ color = "#7F7D8F" }: { color?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.75" stroke={color} strokeWidth="0.9" />
      <path d="M5.5 5v2.15" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="5.5" cy="3.3" r="0.6" fill={color} />
    </svg>
  );
}

function WarningIcon({ color = "#F16600" }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M6.5 1.15L12 11.1H1L6.5 1.15Z"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M6.5 4.1V7.15" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6.5" cy="9.2" r="0.7" fill={color} />
    </svg>
  );
}

function cloneTargetConfigs(configs: TrpSimulationTargetConfig[]) {
  return configs.map((config) => ({ ...config }));
}

function cloneStrategies(strategies: TrpSimulationStrategy[]) {
  return strategies.map((strategy) => ({ ...strategy }));
}

function cloneDrug(drug: TrpSimulationDrug): TrpSimulationDrug {
  return {
    ...drug,
    checks: [...drug.checks],
    timelineSlots: drug.timelineSlots.map((slot) => (slot ? { ...slot } : null)),
  };
}

function cloneSimulationSetting(data: TrpSimulationSettingData): TrpSimulationSettingData {
  return {
    ...data,
    targetConfigs: cloneTargetConfigs(data.targetConfigs),
    drugList: data.drugList.map((drug) => cloneDrug(drug)),
    strategies: cloneStrategies(data.strategies),
  };
}

function buildDrugListFromTreatment(treatmentInfo: TrpTreatmentInfoForm): TrpSimulationDrug[] {
  return buildTrpSimulationDrugListFromTreatment(treatmentInfo).map((drug) => cloneDrug(drug));
}

function buildDefaultSimulationSetting(treatmentInfo: TrpTreatmentInfoForm): TrpSimulationSettingData {
  return {
    selectedCategory: null,
    selectedDetail: null,
    selectedValue: null,
    followUpMonths: 12,
    targetConfigs: cloneTargetConfigs(initialTargetConfigs),
    drugList: buildDrugListFromTreatment(treatmentInfo),
    strategies: cloneStrategies(initialStrategies),
  };
}

function buildTestLoadState(): TrpSimulationSettingData {
  return {
    selectedCategory: 0,
    selectedDetail: 1,
    selectedValue: 2,
    followUpMonths: 12,
    targetConfigs: [
      { label: "Increase", value: "10", unit: "%", months: "6" },
      { label: "Stable", value: "0", unit: "%", months: "6" },
      { label: "Decrease", value: "-10", unit: "%", months: "3" },
    ],
    drugList: testLoadDrugNames.map((name) => cloneDrug(buildTrpSimulationDrugFromName(name))),
    strategies: cloneStrategies(initialStrategies),
  };
}

function snapToStep(value: number) {
  return Math.round(value / TIMELINE_STEP) * TIMELINE_STEP;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTargetConfigSummary(config: TrpSimulationTargetConfig) {
  const formattedValue = config.value.trim() ? `${config.value}${config.unit}` : "value pending";
  const formattedMonths = config.months.trim() ? `${config.months} Months` : "months pending";

  return `${config.label} ${formattedValue} / ${formattedMonths}`;
}

function CategoryFrame({
  header,
  items,
  onSelect,
}: {
  header: string;
  items: CategoryItem[];
  onSelect?: (index: number) => void;
}) {
  return (
    <div
      className="rounded-[8px] flex-1 min-w-0 h-full overflow-hidden flex flex-col"
      style={{ background: "white" }}
    >
      <style>{`
        .cat-row { transition: background 0.1s; }
        .cat-row.cat-selected { background: var(--primary-15) !important; }
        .cat-row.cat-selected:hover { background: #2e2a66 !important; }
        .cat-row.cat-selected:active { background: #1a1738 !important; }
        .cat-row.cat-normal:hover { background: var(--neutral-95) !important; }
        .cat-row.cat-normal:active { background: var(--neutral-90) !important; }
        .cat-list::-webkit-scrollbar { width: 4px; }
        .cat-list::-webkit-scrollbar-track { background: transparent; }
        .cat-list::-webkit-scrollbar-thumb { background: var(--neutral-80); border-radius: 2px; }
      `}</style>
      <div
        className="flex items-center shrink-0 py-2"
        style={{ borderBottom: "1px solid var(--neutral-70)", paddingLeft: 16, paddingRight: 12 }}
      >
        <span className="text-body3" style={{ color: "var(--text-header)", width: 180 }}>
          {header}
        </span>
      </div>
      <div className="cat-list overflow-y-auto flex-1">
        {items.map((item, index) => {
          const isSelected = item.selected;
          const isDisabled = item.disabled;
          const textColor = isSelected
            ? "var(--text-inverted)"
            : isDisabled
              ? "var(--text-disabled)"
              : "var(--text-secondary)";
          const chevronColor = isSelected
            ? "rgba(255,255,255,0.7)"
            : isDisabled
              ? "var(--icon-disabled)"
              : "var(--icon-secondary)";
          const rowClass = `cat-row ${isDisabled ? "" : isSelected ? "cat-selected" : "cat-normal"}`;

          return (
            <div
              key={`${item.label}-${index}`}
              className={`${rowClass} flex items-center justify-between select-none`}
              onClick={() => !isDisabled && onSelect?.(index)}
              style={{
                height: 34,
                paddingLeft: 16,
                paddingRight: 8,
                ...(isSelected ? { background: "var(--primary-15)" } : {}),
                cursor: isDisabled ? "default" : "pointer",
              }}
            >
              <span className="text-body4m" style={{ color: textColor }}>
                {item.label}
              </span>
              <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 30 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M4 3L7 5.5L4 8"
                    stroke={chevronColor}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DrugWarningIndicator({
  warnings,
  compact = false,
}: {
  warnings: TrpDrugCombinationWarning[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div
      className="relative flex shrink-0 items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-[#FFD8B4] bg-[#FFF2E8] px-2 py-[2px] font-[Inter,sans-serif] text-[10px] font-semibold text-[#C96A24]",
          compact && "h-5 w-5 justify-center rounded-full p-0"
        )}
      >
        <WarningIcon />
        {!compact ? <span>Review</span> : null}
      </span>

      {open ? (
        <div className="absolute top-full right-0 z-20 mt-2 w-[248px] rounded-[12px] border border-[#FFD8B4] bg-white px-3 py-3 shadow-[0_14px_24px_rgba(38,34,85,0.14)]">
          <div className="font-[Inter,sans-serif] text-[11px] font-semibold text-[#C96A24]">
            {warnings[0].title}
          </div>
          <div className="mt-1 font-[Inter,sans-serif] text-[11px] leading-[1.45] font-medium text-[#5F5E5E]">
            {warnings[0].detail}
          </div>
          <div className="mt-2 font-[Inter,sans-serif] text-[10px] font-semibold text-[#8D8A90]">
            Related drug: {warnings.map((warning) => warning.otherDrugName).join(", ")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimelinePill({
  name,
  code,
  slot,
  active,
  onDragStart,
}: {
  name: string;
  code: string;
  slot: TrpTimelineSlot;
  active: boolean;
  onDragStart: (event: ReactMouseEvent<HTMLButtonElement>, mode: DragMode) => void;
}) {
  const leftPct = (slot.startMonth / TIMELINE_MAX_MONTHS) * 100;
  const widthPct = ((slot.endMonth - slot.startMonth) / TIMELINE_MAX_MONTHS) * 100;
  const [hovered, setHovered] = useState(false);
  const pillState = active ? "pressed" : hovered ? "hover" : "default";
  const styles = {
    default: {
      bg: "var(--neutral-95)",
      border: "1px solid var(--neutral-80)",
      text: "var(--neutral-30)",
      code: "var(--neutral-60)",
      grip: "var(--neutral-70)",
    },
    hover: {
      bg: "#e2e1e8",
      border: "1px solid #b0afb8",
      text: "var(--neutral-30)",
      code: "var(--neutral-60)",
      grip: "#8a8a90",
    },
    pressed: {
      bg: "rgba(58,17,216,0.12)",
      border: "1px solid rgba(58,17,216,0.3)",
      text: "var(--tertiary-40)",
      code: "#7a55e8",
      grip: "#7a55e8",
    },
  }[pillState];

  const GripIcon = () => (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="shrink-0">
      {[0, 1, 2].map((rowIndex) =>
        [0, 1].map((columnIndex) => (
          <circle
            key={`${rowIndex}-${columnIndex}`}
            cx={4 + columnIndex * 4}
            cy={4 + rowIndex * 4}
            r="1.2"
            fill={styles.grip}
          />
        ))
      )}
    </svg>
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-[4px] absolute inline-flex items-center select-none box-border overflow-hidden"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        top: 0,
        bottom: 0,
        background: styles.bg,
        border: styles.border,
        zIndex: 1,
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      <button
        type="button"
        onMouseDown={(event) => onDragStart(event, "resize-start")}
        className="flex items-center justify-center h-full shrink-0"
        style={{ width: 16, cursor: "ew-resize" }}
      >
        <GripIcon />
      </button>
      <button
        type="button"
        onMouseDown={(event) => onDragStart(event, "move")}
        className="gap-1 flex-1 flex items-center min-w-0 overflow-hidden h-full active:cursor-grabbing"
        style={{ cursor: "grab" }}
      >
        <span
          className="flex-1 overflow-hidden text-body5m"
          style={{ color: styles.text, whiteSpace: "nowrap", textOverflow: "ellipsis" }}
        >
          {name}
        </span>
        {code ? (
          <span
            className="shrink-0 text-body5m"
            style={{ color: styles.code, whiteSpace: "nowrap" }}
          >
            {code}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        onMouseDown={(event) => onDragStart(event, "resize-end")}
        className="flex items-center justify-center h-full shrink-0"
        style={{ width: 16, cursor: "ew-resize" }}
      >
        <GripIcon />
      </button>
    </div>
  );
}

export default function TrpSimulationSettingPage() {
  const router = useRouter();
  const hasHydrated = useTrpSetupStore((state) => state.hasHydrated);
  const completedSteps = useTrpSetupStore((state) => state.completedSteps);
  const setStepCompleted = useTrpSetupStore((state) => state.setStepCompleted);
  const patientDiseaseInfo = useTrpSetupStore((state) => state.patientDiseaseInfo);
  const treatmentSaved = useTrpSetupStore((state) => state.treatmentSaved);
  const savedSimulationSetting = useTrpSetupStore((state) => state.simulationSaved);
  const persistedSimulationSetting = useTrpSetupStore((state) => state.simulationSetting);
  const setSimulationSetting = useTrpSetupStore((state) => state.setSimulationSetting);
  const initialLegacySimulationSetting = useMemo(
    () => createInitialTrpSimulationSettingForm(),
    []
  );
  const hasLegacySimulationSetting = useMemo(
    () =>
      completedSteps["simulation-setting"] ||
      !isSameTrpSimulationSettingForm(
        savedSimulationSetting,
        initialLegacySimulationSetting
      ),
    [completedSteps, initialLegacySimulationSetting, savedSimulationSetting]
  );
  const sidebarState = useMemo(
    () =>
      resolveTrpSetupFlowState({
        activeStep: "simulation-setting",
        completedSteps,
        patientDiseaseInfo,
        treatmentInfo: treatmentSaved,
        simulationSettingComplete:
          completedSteps["simulation-setting"] &&
          (persistedSimulationSetting !== null || hasLegacySimulationSetting),
      }),
    [
      completedSteps,
      hasLegacySimulationSetting,
      patientDiseaseInfo,
      persistedSimulationSetting,
      treatmentSaved,
    ]
  );

  const resolvedInitialState = useMemo(() => {
    if (persistedSimulationSetting) {
      return cloneSimulationSetting(persistedSimulationSetting);
    }

    if (hasLegacySimulationSetting) {
      return convertSimulationSavedToSettingData(savedSimulationSetting);
    }

    return buildDefaultSimulationSetting(treatmentSaved);
  }, [
    hasLegacySimulationSetting,
    persistedSimulationSetting,
    savedSimulationSetting,
    treatmentSaved,
  ]);

  const [formState, setFormState] = useState<TrpSimulationSettingData>(resolvedInitialState);
  const [savedState, setSavedState] = useState<TrpSimulationSettingData>(resolvedInitialState);
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [drugSearchOpen, setDrugSearchOpen] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [strategyLimitMessage, setStrategyLimitMessage] = useState<string | null>(null);
  const [dragState, setDragState] = useState<ActiveDragState | null>(null);
  const dragStateRef = useRef<ActiveDragState | null>(null);
  const followUpRef = useRef<HTMLDivElement>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [openUnitIdx, setOpenUnitIdx] = useState<number | null>(null);
  const [unitDropdownPos, setUnitDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [drugSearchPos, setDrugSearchPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const drugSearchContainerRef = useRef<HTMLDivElement>(null);
  const drugSearchDropdownRef = useRef<HTMLDivElement>(null);
  const drugCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const nextState = persistedSimulationSetting
      ? cloneSimulationSetting(persistedSimulationSetting)
      : hasLegacySimulationSetting
        ? convertSimulationSavedToSettingData(savedSimulationSetting)
        : buildDefaultSimulationSetting(treatmentSaved);

    setFormState(nextState);
    setSavedState(nextState);
  }, [
    hasHydrated,
    hasLegacySimulationSetting,
    persistedSimulationSetting,
    savedSimulationSetting,
    treatmentSaved,
  ]);

  useEffect(() => {
    if (!hasHydrated || sidebarState.accessMap["simulation-setting"]) {
      return;
    }

    router.replace(
      sidebarState.accessMap["treatment-info"] ? "/trp/treatment-info" : "/trp"
    );
  }, [hasHydrated, router, sidebarState.accessMap]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    dragStateRef.current = dragState;

    const handleMouseMove = (event: MouseEvent) => {
      const activeDrag = dragStateRef.current;

      if (!activeDrag || activeDrag.containerWidth <= 0) {
        return;
      }

      const diffX = event.clientX - activeDrag.startX;
      const monthDelta = snapToStep((diffX / activeDrag.containerWidth) * TIMELINE_MAX_MONTHS);

      setFormState((prev) => ({
        ...prev,
        drugList: prev.drugList.map((drug) => {
          if (drug.id !== activeDrag.drugId) {
            return drug;
          }

          return {
            ...drug,
            timelineSlots: drug.timelineSlots.map((slot, slotIndex) => {
              if (slotIndex !== activeDrag.strategyIndex || !slot) {
                return slot;
              }

              let nextStart = activeDrag.initialSlot.startMonth;
              let nextEnd = activeDrag.initialSlot.endMonth;

              if (activeDrag.mode === "move") {
                const duration = activeDrag.initialSlot.endMonth - activeDrag.initialSlot.startMonth;
                nextStart = clamp(
                  snapToStep(activeDrag.initialSlot.startMonth + monthDelta),
                  0,
                  TIMELINE_MAX_MONTHS - duration
                );
                nextEnd = nextStart + duration;
              }

              if (activeDrag.mode === "resize-start") {
                nextStart = clamp(
                  snapToStep(activeDrag.initialSlot.startMonth + monthDelta),
                  0,
                  activeDrag.initialSlot.endMonth - TIMELINE_MIN_DURATION
                );
              }

              if (activeDrag.mode === "resize-end") {
                nextEnd = clamp(
                  snapToStep(activeDrag.initialSlot.endMonth + monthDelta),
                  activeDrag.initialSlot.startMonth + TIMELINE_MIN_DURATION,
                  TIMELINE_MAX_MONTHS
                );
              }

              return {
                startMonth: nextStart,
                endMonth: nextEnd,
              };
            }),
          };
        }),
      }));
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  const selectedOutcomeLabel =
    formState.selectedValue !== null ? VALUE_OPTIONS[formState.selectedValue] : null;
  const selectedCategory = formState.selectedCategory;
  const selectedDetail = formState.selectedDetail;
  const selectedValue = formState.selectedValue;
  const followUpMonths = formState.followUpMonths;
  const inputValues = formState.targetConfigs.map((config) => config.value);
  const unitValues = formState.targetConfigs.map((config) => config.unit);
  const monthValues = formState.targetConfigs.map((config) => config.months);
  const sliderPct =
    ((followUpMonths - FOLLOW_UP_OPTIONS[0]) /
      (FOLLOW_UP_OPTIONS[FOLLOW_UP_OPTIONS.length - 1] - FOLLOW_UP_OPTIONS[0])) *
    100;

  const filteredDrugPresets = useMemo(() => {
    const usedIds = new Set(formState.drugList.map((drug) => drug.id));
    const query = drugSearchQuery.trim().toLowerCase();

    return trpDrugCatalog.filter((drug) => {
      if (usedIds.has(drug.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        drug.name.toLowerCase().includes(query) ||
        drug.code.toLowerCase().includes(query) ||
        drug.type.toLowerCase().includes(query)
      );
    });
  }, [drugSearchQuery, formState.drugList]);
  const drugSearchResults = filteredDrugPresets;
  const drugRows = formState.drugList;

  const strategySelectionCounts = useMemo(() => {
    return STRATEGY_LABELS.map((_, strategyIndex) =>
      formState.drugList.filter((drug) => drug.checks[strategyIndex]).length
    );
  }, [formState.drugList]);

  const missingStrategySelections = useMemo(
    () => strategySelectionCounts.map((count) => count === 0),
    [strategySelectionCounts]
  );

  const activeCombinationWarnings = useMemo(
    () => getUniqueTrpDrugCombinationWarnings(formState.drugList),
    [formState.drugList]
  );

  const isDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(savedState),
    [formState, savedState]
  );

  useEffect(() => {
    if (!hasHydrated || !isDirty || !completedSteps["simulation-setting"]) {
      return;
    }

    setStepCompleted("simulation-setting", false);
  }, [completedSteps, hasHydrated, isDirty, setStepCompleted]);

  useEffect(() => {
    if (!drugSearchOpen) {
      return;
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        !drugSearchContainerRef.current?.contains(target) &&
        !drugSearchDropdownRef.current?.contains(target)
      ) {
        setDrugSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drugSearchOpen]);

  useEffect(() => {
    return () => {
      if (drugCloseTimerRef.current) {
        clearTimeout(drugCloseTimerRef.current);
      }
    };
  }, []);

  const isOutcomeSelectionMissing =
    formState.selectedCategory === null ||
    formState.selectedDetail === null ||
    formState.selectedValue === null;
  const isTargetConfigMissing = formState.targetConfigs.some(
    (config) => !config.value.trim() || !config.months.trim()
  );
  const hasOutcomeCardValidationError = isOutcomeSelectionMissing || isTargetConfigMissing;
  const isDrugSelectionMissing = formState.drugList.length === 0;
  const hasValidationError =
    hasOutcomeCardValidationError ||
    isDrugSelectionMissing ||
    missingStrategySelections.some(Boolean);
  const strategyRows = formState.strategies.map((strategy, strategyIdx) => ({
    strategy: strategy.title,
    color: strategy.color,
    detail: selectedOutcomeLabel
      ? formatTargetConfigSummary(formState.targetConfigs[strategyIdx])
      : "Select target outcome first",
    strategyIdx,
    keepCurrent: strategy.keepCurrent,
    strategyId: strategy.id,
  }));

  const updateTargetConfigValues = (
    key: keyof Omit<TrpSimulationTargetConfig, "label">,
    updater: (values: string[]) => string[]
  ) => {
    setShowValidationError(false);
    setFormState((prev) => {
      const nextValues = updater(prev.targetConfigs.map((config) => config[key]));

      return {
        ...prev,
        targetConfigs: prev.targetConfigs.map((config, index) => ({
          ...config,
          [key]: nextValues[index] ?? config[key],
        })),
      };
    });
  };

  const setInputValues = (updater: (values: string[]) => string[]) => {
    updateTargetConfigValues("value", updater);
  };

  const setUnitValues = (updater: (values: string[]) => string[]) => {
    updateTargetConfigValues("unit", updater);
  };

  const setMonthValues = (updater: (values: string[]) => string[]) => {
    updateTargetConfigValues("months", updater);
  };

  const handleAddDrug = (drug: TrpDrugCatalogEntry) => {
    setStrategyLimitMessage(null);
    setShowValidationError(false);
    setFormState((prev) => ({
      ...prev,
      drugList: [...prev.drugList, cloneDrug(buildTrpSimulationDrugFromCatalogEntry(drug))],
    }));
    setDrugSearchQuery("");
    setDrugSearchOpen(false);
  };

  const handleToggleCheck = (drugId: number, strategyIndex: number) => {
    const targetDrug = formState.drugList.find((drug) => drug.id === drugId);

    if (!targetDrug) {
      return;
    }

    if (!targetDrug.checks[strategyIndex] && strategySelectionCounts[strategyIndex] >= 3) {
      setStrategyLimitMessage(`Strategy ${STRATEGY_LABELS[strategyIndex]} allows up to 3 drugs.`);
      return;
    }

    setStrategyLimitMessage(null);
    setShowValidationError(false);
    setFormState((prev) => ({
      ...prev,
      drugList: prev.drugList.map((drug) =>
        drug.id === drugId
          ? {
              ...drug,
              checks: drug.checks.map((checked, index) =>
                index === strategyIndex ? !checked : checked
              ),
              timelineSlots: drug.timelineSlots.map((slot, index) =>
                index === strategyIndex && slot === null
                  ? { startMonth: 0, endMonth: 24 }
                  : slot
              ),
            }
          : drug
      ),
    }));
  };

  const handleRemoveDrug = (drugId: number) => {
    setFormState((prev) => ({
      ...prev,
      drugList: prev.drugList.filter((drug) => drug.id !== drugId),
    }));
  };

  const handleKeepCurrentToggle = (strategyId: TrpSimulationStrategy["id"]) => {
    setFormState((prev) => ({
      ...prev,
      strategies: prev.strategies.map((strategy) =>
        strategy.id === strategyId
          ? { ...strategy, keepCurrent: !strategy.keepCurrent }
          : strategy
      ),
    }));
  };

  const handleTestLoad = () => {
    setFormState(buildTestLoadState());
    setShowValidationError(false);
    setStrategyLimitMessage(null);
    setDrugSearchQuery("");
    setDrugSearchOpen(false);
    setOpenUnitIdx(null);
    setUnitDropdownPos(null);
    setFollowUpOpen(false);
  };

  const handleApply = () => {
    setShowValidationError(true);

    if (hasValidationError) {
      return;
    }

    const nextSavedState = cloneSimulationSetting(formState);
    setSimulationSetting(nextSavedState);
    setSavedState(nextSavedState);
    setStepCompleted("simulation-setting", true);

    console.log("[TRP-004] apply clicked", nextSavedState);
    router.push("/trp/view-summary");
  };

  const handleTimelineDragStart = (
    event: ReactMouseEvent<HTMLButtonElement>,
    drugId: number,
    strategyIndex: number,
    mode: DragMode
  ) => {
    event.preventDefault();

    const track = event.currentTarget.closest("[data-timeline-track='true']");
    const slot = formState.drugList.find((drug) => drug.id === drugId)?.timelineSlots[strategyIndex];

    if (!(track instanceof HTMLElement) || !slot) {
      return;
    }

    setStrategyLimitMessage(null);
    setDragState({
      drugId,
      strategyIndex,
      mode,
      startX: event.clientX,
      containerWidth: track.getBoundingClientRect().width,
      initialSlot: { ...slot },
    });
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <AppLayout headerType="trp">
      {openUnitIdx !== null && unitDropdownPos && (
        <>
          <div
            onClick={() => {
              setOpenUnitIdx(null);
              setUnitDropdownPos(null);
            }}
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
          />
          <div
            className="rounded-[4px] fixed overflow-hidden"
            style={{
              top: unitDropdownPos.top,
              left: unitDropdownPos.left,
              minWidth: unitDropdownPos.width,
              zIndex: 9999,
              background: "var(--neutral-95)",
              border: "1px solid var(--neutral-80)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            {["%", "mmol/mol"].map((option, optionIndex) => (
              <div key={option}>
                <div
                  onClick={() => {
                    setUnitValues((prev) =>
                      prev.map((value, index) => (index === openUnitIdx ? option : value))
                    );
                    setOpenUnitIdx(null);
                    setUnitDropdownPos(null);
                  }}
                  className="cursor-pointer"
                  style={{
                    padding: "6px 10px",
                    fontFamily: "Inter",
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      unitValues[openUnitIdx] === option
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {option}
                </div>
                {optionIndex < 1 && <div style={{ height: 1, background: "var(--neutral-80)" }} />}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex h-full w-[calc(100%-28px)] flex-col gap-2.5 overflow-hidden px-[10px] pt-4 pr-[6px] pb-[10px]">
        <TrpPageTitle title="Default Settings" subtitle="Setup Required" />

        <div className="grid min-h-0 flex-1 grid-cols-[356px_minmax(0,1fr)] gap-[4px] overflow-hidden">
          <TrpSetupSidebarPanel
            steps={sidebarState.steps}
            panelVariant="left"
          />

          <div className="min-h-0">
            <TrpFramePanel
              variant="right"
              className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pr-1">
                <div
                  className="rounded-[20px] gap-3 flex flex-col relative h-fit shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.60)",
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 16,
                    paddingRight: 16,
                    zIndex: 1,
                  }}
                >
                  <div className="flex items-center justify-between shrink-0">
                    <div className="text-body1" style={{ color: "var(--text-header)" }}>
                      Select the target outcome variable
                    </div>
                    <GlassTestButton onClick={handleTestLoad} />
                  </div>

                  <div className="gap-3 flex shrink-0 h-[180px] max-[1470px]:h-[160px] relative" style={{ zIndex: 2 }}>
                    <CategoryFrame
                      header="Category"
                      items={CATEGORY_OPTIONS.map((option, index) => ({
                        label: option,
                        selected: selectedCategory === index,
                        disabled: index === 2,
                        saved: index === 0 ? selectedCategory !== 0 : undefined,
                      }))}
                      onSelect={(index) => {
                        setShowValidationError(false);
                        setFormState((prev) => ({
                          ...prev,
                          selectedCategory: index,
                          selectedDetail: null,
                          selectedValue: null,
                        }));
                      }}
                    />
                    <div
                      className="flex-1 min-w-0"
                      style={{
                        opacity: selectedCategory === null ? 0.4 : 1,
                        pointerEvents: selectedCategory === null ? "none" : "auto",
                        transition: "opacity 0.2s",
                      }}
                    >
                      <CategoryFrame
                        header="Detail"
                        items={DETAIL_OPTIONS.map((option, index) => ({
                          label: option,
                          selected: selectedDetail === index,
                        }))}
                        onSelect={(index) => {
                          setShowValidationError(false);
                          setFormState((prev) => ({
                            ...prev,
                            selectedDetail: index,
                            selectedValue: null,
                          }));
                        }}
                      />
                    </div>
                    <div
                      className="flex-1 min-w-0"
                      style={{
                        opacity: selectedDetail === null ? 0.4 : 1,
                        pointerEvents: selectedDetail === null ? "none" : "auto",
                        transition: "opacity 0.2s",
                      }}
                    >
                      <CategoryFrame
                        header="Value"
                        items={VALUE_OPTIONS.map((option, index) => ({
                          label: option,
                          selected: selectedValue === index,
                          disabled: index === 4,
                        }))}
                        onSelect={(index) => {
                          setShowValidationError(false);
                          setFormState((prev) => ({
                            ...prev,
                            selectedValue: index,
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="gap-3 flex min-h-[180px] overflow-hidden" style={{ flex: "1 1 0" }}>
                    <div
                      className="shrink-0 w-full h-fit"
                      style={{
                        flex: "1 1 0",
                        opacity: selectedValue === null ? 0.4 : 1,
                        pointerEvents: selectedValue === null ? "none" : "auto",
                        transition: "opacity 0.2s",
                      }}
                    >
                      <div className="rounded-[8px] overflow-hidden h-full" style={{ background: "white" }}>
                        <div className="overflow-auto flex flex-col h-full">
                          <div
                            className="gap-2 flex items-end"
                            style={{
                              background: "white",
                              borderBottom: "1px solid var(--neutral-80)",
                              paddingBottom: 4,
                              paddingTop: 12,
                              paddingLeft: 16,
                              paddingRight: 16,
                            }}
                          >
                            <div className="text-body3" style={{ color: "var(--text-header)", flex: "0 0 25%" }}>
                              {selectedValue !== null ? (VALUE_OPTIONS[selectedValue] ?? "[Outcome]") : "[Outcome]"}
                            </div>
                            <div className="gap-2 flex flex-1">
                              {["Value", "Unit", "Months"].map((column) => (
                                <div key={column} className="flex-1 text-body3" style={{ color: "var(--text-header)" }}>
                                  {column}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="gap-1 flex flex-col" style={{ padding: "8px 0", background: "white" }}>
                            {[{ label: "Increase" }, { label: "Stable" }, { label: "Decrease" }].map((row, index) => (
                              <div
                                key={row.label}
                                className="flex items-center"
                                style={{ background: "white", height: 36, paddingLeft: 16, paddingRight: 16 }}
                              >
                                <div className="text-body4m" style={{ color: "var(--text-primary)", flex: "0 0 25%" }}>
                                  {row.label}
                                </div>
                                <div className="gap-2 flex flex-1">
                                  <input
                                    type="text"
                                    value={inputValues[index]}
                                    onChange={(event) =>
                                      setInputValues((prev) =>
                                        prev.map((value, valueIndex) =>
                                          valueIndex === index ? event.target.value : value
                                        )
                                      )
                                    }
                                    className="placeholder:text-neutral-80 rounded-[4px] flex-1 min-w-0 border-none cursor-text text-body4m py-2"
                                    style={{
                                      background: "var(--neutral-95)",
                                      paddingLeft: 8,
                                      paddingRight: 8,
                                      color: "var(--text-primary)",
                                      letterSpacing: "-0.68px",
                                      outline: "none",
                                    }}
                                  />
                                  <div className="relative flex-1">
                                    <div
                                      onClick={(event) => {
                                        if (openUnitIdx === index) {
                                          setOpenUnitIdx(null);
                                          setUnitDropdownPos(null);
                                        } else {
                                          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                                          setUnitDropdownPos({
                                            top: rect.bottom + 2,
                                            left: rect.left,
                                            width: rect.width,
                                          });
                                          setOpenUnitIdx(index);
                                        }
                                      }}
                                      className="rounded-[4px] gap-0.5 flex items-center cursor-pointer py-2"
                                      style={{
                                        background: "var(--neutral-95)",
                                        paddingLeft: 12,
                                        paddingRight: 4,
                                      }}
                                    >
                                      <span className="flex-1 text-body4m" style={{ color: "var(--text-primary)" }}>
                                        {unitValues[index]}
                                      </span>
                                      <img src="/icons/disclosure/close-18.svg" width={18} height={18} alt="" className="shrink-0" />
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    value={monthValues[index]}
                                    onChange={(event) =>
                                      setMonthValues((prev) =>
                                        prev.map((value, valueIndex) =>
                                          valueIndex === index ? event.target.value : value
                                        )
                                      )
                                    }
                                    className="placeholder:text-neutral-80 rounded-[4px] flex-1 min-w-0 border-none cursor-text py-2 text-body4m"
                                    style={{
                                      background: "var(--neutral-95)",
                                      paddingLeft: 12,
                                      paddingRight: 12,
                                      color: "var(--text-primary)",
                                      letterSpacing: "-0.68px",
                                      outline: "none",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-[20px] gap-3 min-w-0 flex flex-col justify-between box-border"
                      style={{ flex: "1 1 0", background: "var(--primary-15)", padding: 16 }}
                    >
                      <div className="gap-2 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div style={{ lineHeight: 1.2 }}>
                            <span className="text-body3" style={{ color: "var(--text-inverted)" }}>Follow-up Window</span>
                            <span className="text-body3" style={{ color: "var(--secondary-60)" }}>*</span>
                          </div>
                          <div ref={followUpRef} className="relative">
                            <div
                              onClick={() => setFollowUpOpen((value) => !value)}
                              className="rounded-[4px] gap-0.5 flex items-center cursor-pointer select-none"
                              style={{ background: "var(--neutral-95)", height: 28, minWidth: 52, paddingLeft: 8, paddingRight: 4 }}
                            >
                              <span className="flex-1 text-body5m" style={{ color: "var(--text-primary)" }}>{followUpMonths}</span>
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  width: 18,
                                  height: 18,
                                  transform: followUpOpen ? "rotate(180deg)" : "rotate(0deg)",
                                  transition: "transform 0.15s",
                                }}
                              >
                                <img src="/icons/disclosure/close-18.svg" width={18} height={18} alt="" />
                              </div>
                            </div>
                            {followUpOpen && (
                              <>
                                <div onClick={() => setFollowUpOpen(false)} className="fixed inset-0" style={{ zIndex: 9998 }} />
                                <div
                                  className="rounded-[4px] absolute overflow-hidden"
                                  style={{
                                    top: "calc(100% + 4px)",
                                    right: 0,
                                    background: "var(--neutral-95)",
                                    border: "1px solid var(--neutral-80)",
                                    zIndex: 9999,
                                    minWidth: 52,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                  }}
                                >
                                  {FOLLOW_UP_OPTIONS.map((month, monthIndex, months) => (
                                    <div key={month}>
                                      <div
                                        onClick={() => {
                                          setShowValidationError(false);
                                          setFormState((prev) => ({ ...prev, followUpMonths: month }));
                                          setFollowUpOpen(false);
                                        }}
                                        className="flex items-center cursor-pointer"
                                        style={{
                                          height: 28,
                                          paddingLeft: 10,
                                          paddingRight: 10,
                                          background: followUpMonths === month ? "#dddde6" : "transparent",
                                          fontFamily: "Inter",
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: followUpMonths === month ? "var(--text-primary)" : "var(--text-secondary)",
                                          letterSpacing: "-0.48px",
                                          whiteSpace: "nowrap",
                                        }}
                                        onMouseEnter={(event) => {
                                          if (followUpMonths !== month) {
                                            (event.currentTarget as HTMLDivElement).style.background = "#e8e8f0";
                                          }
                                        }}
                                        onMouseLeave={(event) => {
                                          (event.currentTarget as HTMLDivElement).style.background =
                                            followUpMonths === month ? "#dddde6" : "transparent";
                                        }}
                                      >
                                        {month}
                                      </div>
                                      {monthIndex < months.length - 1 && <div style={{ height: 1, background: "var(--neutral-80)" }} />}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
             
                      </div>
                      <div className="gap-1 flex flex-col">
                        <div className="relative" style={{ height: 30 }}>
                          <div
                            className="rounded-[2px] absolute overflow-hidden"
                            style={{ left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 12 }}
                          >
                            <div className="absolute inset-0" style={{ background: "var(--neutral-80)" }} />
                            <div
                              className="absolute"
                              style={{ left: 0, top: 0, bottom: 0, width: `${sliderPct}%`, background: "var(--secondary-60)" }}
                            />
                          </div>
                          <div
                            className="rounded-full absolute"
                            style={{
                              left: `calc((100% - 30px) * ${sliderPct} / 100)`,
                              top: "50%",
                              transform: "translate(0, -50%)",
                              width: 30,
                              height: 30,
                              background: "var(--neutral-98)",
                              boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.12), 0px 6px 13px 0px rgba(0,0,0,0.12)",
                            }}
                          />
                          <input
                            type="range"
                            min={FOLLOW_UP_OPTIONS[0]}
                            max={FOLLOW_UP_OPTIONS[FOLLOW_UP_OPTIONS.length - 1]}
                            step={TIMELINE_STEP}
                            value={followUpMonths}
                            onChange={(event) => {
                              setShowValidationError(false);
                              setFormState((prev) => ({
                                ...prev,
                                followUpMonths: Number(event.target.value),
                              }));
                            }}
                            className="absolute w-full h-full cursor-pointer"
                            style={{ top: 0, bottom: 0, left: 0, right: 0, opacity: 0, zIndex: 2 }}
                          />
                        </div>
                        <div className="relative" style={{ height: 16 }}>
                          {FOLLOW_UP_OPTIONS.map((month, index) => (
                            <span
                              key={month}
                              className="absolute text-body5m"
                              style={{
                                left: `calc((100% - 24px) * ${index / (FOLLOW_UP_OPTIONS.length - 1)} + 12px)`,
                                transform: "translateX(-50%)",
                                color: "var(--text-inverted)",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {month}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-h-[430px] flex-[1_0_430px] overflow-hidden">
                  <div
                    className="rounded-[20px] gap-3 flex flex-col min-h-0 overflow-hidden h-full"
                    style={{
                      background: "rgba(255,255,255,0.60)",
                      paddingTop: 10,
                      paddingBottom: 16,
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                  >
                    <div className="gap-2.5 flex items-center shrink-0" style={{ height: 44 }}>
                      <div className="flex-1 flex items-center text-body1" style={{ color: "var(--text-header)" }}>
                        Develop a plan for the selected medication
                      </div>
                      {strategyLimitMessage ? (
                        <div className="rounded-full bg-[#FFF2E8] px-3 py-1 font-[Inter,sans-serif] text-[11px] font-semibold text-[#C96A24]">
                          {strategyLimitMessage}
                        </div>
                      ) : null}
                      <div className="gap-2.5 flex items-center" style={{ height: 44 }}>
                        <GlassIconButton>
                          <IconDownload size={24} />
                        </GlassIconButton>
                        <GlassIconButton>
                          <IconAddFolder size={24} />
                        </GlassIconButton>
                      </div>
                    </div>

                    {activeCombinationWarnings.length > 0 ? (
                      <div className="rounded-[12px] border border-[#FFD8B4] bg-[#FFF6EE] px-4 py-2 font-[Inter,sans-serif] text-[12px] font-semibold text-[#C96A24]">
                        Review highlighted drug combinations. Hover the warning icon for details.
                      </div>
                    ) : null}

                    <div className="gap-[17px] flex flex-1 min-h-0 overflow-hidden">
                      <div
                        className="gap-1.5 flex flex-col min-w-0 self-stretch"
                        style={{ flex: "1 1 0", maxWidth: "calc((100% - 34px) / 3)" }}
                      >
                        <div className="gap-1.5 flex flex-col shrink-0">
                          <div className="text-body3m" style={{ color: "var(--text-primary)" }}>
                            Add on drug<span style={{ color: "var(--text-active)" }}>*</span>
                          </div>
                          <div
                            ref={drugSearchContainerRef}
                            className="relative"
                            onMouseEnter={() => {
                              if (drugCloseTimerRef.current) {
                                clearTimeout(drugCloseTimerRef.current);
                              }
                              const rect = drugSearchContainerRef.current?.getBoundingClientRect();
                              if (rect) {
                                setDrugSearchPos({
                                  top: rect.bottom + 4,
                                  left: rect.left,
                                  width: rect.width,
                                });
                              }
                              setDrugSearchOpen(true);
                            }}
                            onMouseLeave={() => {
                              drugCloseTimerRef.current = setTimeout(
                                () => setDrugSearchOpen(false),
                                120
                              );
                            }}
                          >
                            <div
                              className={cn(
                                "rounded-[4px] gap-1 flex items-center overflow-visible",
                                showValidationError &&
                                  isDrugSelectionMissing &&
                                  "shadow-[inset_0_0_0_1.5px_rgba(239,68,68,0.85)]"
                              )}
                              style={{
                                background: "white",
                                height: 32,
                                paddingLeft: 8,
                                paddingRight: 4,
                              }}
                            >
                              <IconSearch size={18} />
                              <input
                                type="text"
                                placeholder="Search drug name, code, or mechanism"
                                value={drugSearchQuery}
                                onChange={(event) => {
                                  setDrugSearchQuery(event.target.value);
                                  const rect = drugSearchContainerRef.current?.getBoundingClientRect();
                                  if (rect) {
                                    setDrugSearchPos({
                                      top: rect.bottom + 4,
                                      left: rect.left,
                                      width: rect.width,
                                    });
                                  }
                                  setDrugSearchOpen(true);
                                }}
                                onFocus={() => {
                                  const rect = drugSearchContainerRef.current?.getBoundingClientRect();
                                  if (rect) {
                                    setDrugSearchPos({
                                      top: rect.bottom + 4,
                                      left: rect.left,
                                      width: rect.width,
                                    });
                                  }
                                  setDrugSearchOpen(true);
                                }}
                                className="flex-1 border-none"
                                style={{
                                  outline: "none",
                                  background: "transparent",
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: "var(--text-primary)",
                                  letterSpacing: "-0.48px",
                                }}
                              />
                            </div>
                            {drugSearchOpen &&
                              typeof document !== "undefined" &&
                              createPortal(
                                <div
                                  ref={drugSearchDropdownRef}
                                  onMouseEnter={() => {
                                    if (drugCloseTimerRef.current) {
                                      clearTimeout(drugCloseTimerRef.current);
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    drugCloseTimerRef.current = setTimeout(
                                      () => setDrugSearchOpen(false),
                                      120
                                    );
                                  }}
                                  className="rounded-[8px] fixed overflow-y-auto"
                                  style={{
                                    top: drugSearchPos.top,
                                    left: drugSearchPos.left,
                                    width: drugSearchPos.width,
                                    background: "white",
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                    zIndex: 9999,
                                    maxHeight: 220,
                                    boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
                                    border: "1px solid var(--neutral-90)",
                                  }}
                                >
                                  {drugSearchResults.length === 0 ? (
                                    <div className="flex items-center justify-center" style={{ height: 40 }}>
                                      <span className="text-body5m" style={{ color: "var(--neutral-70)" }}>
                                        No results found
                                      </span>
                                    </div>
                                  ) : (
                                    drugSearchResults.map((drug) => {
                                      const searchWarnings = getTrpDrugCombinationWarnings(
                                        buildTrpSimulationDrugFromCatalogEntry(drug),
                                        formState.drugList
                                      );

                                      return (
                                        <div
                                          key={drug.id}
                                          onMouseDown={() => handleAddDrug(drug)}
                                          className="gap-2 flex items-center cursor-pointer"
                                          style={{
                                            height: 44,
                                            paddingLeft: 12,
                                            paddingRight: 12,
                                          }}
                                          onMouseEnter={(event) => {
                                            (event.currentTarget as HTMLDivElement).style.background =
                                              "rgba(0,0,0,0.04)";
                                          }}
                                          onMouseLeave={(event) => {
                                            (event.currentTarget as HTMLDivElement).style.background =
                                              "transparent";
                                          }}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div
                                              style={{
                                                fontSize: 9,
                                                fontWeight: 500,
                                                color: "var(--neutral-70)",
                                                letterSpacing: "-0.27px",
                                                lineHeight: 1.05,
                                              }}
                                            >
                                              {drug.type}
                                            </div>
                                            <div className="gap-1 flex items-center">
                                              <span
                                                className="overflow-hidden text-caption"
                                                style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                                              >
                                                {(() => {
                                                  const query = drugSearchQuery.trim();
                                                  if (!query) {
                                                    return (
                                                      <span style={{ color: "var(--text-primary)" }}>
                                                        {drug.name}
                                                      </span>
                                                    );
                                                  }
                                                  const matchIndex = drug.name
                                                    .toLowerCase()
                                                    .indexOf(query.toLowerCase());
                                                  if (matchIndex === -1) {
                                                    return (
                                                      <span style={{ color: "var(--text-primary)" }}>
                                                        {drug.name}
                                                      </span>
                                                    );
                                                  }
                                                  return (
                                                    <>
                                                      <span style={{ color: "var(--text-primary)" }}>
                                                        {drug.name.slice(0, matchIndex)}
                                                      </span>
                                                      <span style={{ color: "var(--text-active)" }}>
                                                        {drug.name.slice(matchIndex, matchIndex + query.length)}
                                                      </span>
                                                      <span style={{ color: "var(--text-primary)" }}>
                                                        {drug.name.slice(matchIndex + query.length)}
                                                      </span>
                                                    </>
                                                  );
                                                })()}
                                              </span>
                                              {searchWarnings.length > 0 ? <IconWarning size={12} /> : null}
                                            </div>
                                          </div>
                                          <span
                                            className="shrink-0"
                                            style={{
                                              fontSize: 9,
                                              fontWeight: 500,
                                              color: "var(--neutral-70)",
                                              letterSpacing: "-0.27px",
                                            }}
                                          >
                                            {drug.code}
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>,
                                document.body
                              )}
                          </div>
                        </div>

                      <div className="gap-0 flex flex-col flex-1 overflow-hidden">
                        {drugRows.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span
                              className="text-captionm"
                              style={{ color: "var(--neutral-70)", textAlign: "center" }}
                            >
                              Select Add on drug
                            </span>
                          </div>
                        ) : (
                          <>
                            <div
                              className="gap-3 flex items-center shrink-0"
                              style={{
                                paddingLeft: 16,
                                paddingRight: 16,
                                paddingBottom: 2,
                                background: "transparent",
                              }}
                            >
                              <div className="flex-1">
                                <span className="text-body5m" style={{ color: "var(--neutral-10)" }}>
                                  Strategy
                                </span>
                              </div>
                              <div className="gap-[38px] flex items-center shrink-0">
                                {["A", "B", "C"].map((strategyLabel) => (
                                  <span
                                    key={strategyLabel}
                                    className="text-body5m"
                                    style={{ color: "var(--neutral-10)", textAlign: "center", width: 18 }}
                                  >
                                    {strategyLabel}
                                  </span>
                                ))}
                              </div>
                              <div className="shrink-0" style={{ width: 24 + 16 }} />
                            </div>
                            <div className="gap-1.5 flex flex-col flex-1 overflow-auto">
                              {drugRows.map((drug) => {
                                const selectedWarnings = getTrpDrugCombinationWarnings(
                                  drug,
                                  formState.drugList
                                );

                                return (
                                  <div
                                    key={drug.id}
                                    className="rounded-[12px] gap-3 flex items-center shrink-0"
                                    style={{
                                      background: selectedWarnings.length > 0 ? "#FFF8F1" : "white",
                                      minHeight: 48,
                                      paddingLeft: 16,
                                      paddingRight: 16,
                                      boxShadow:
                                        selectedWarnings.length > 0
                                          ? "inset 0 0 0 1px rgba(255,198,144,0.95)"
                                          : "inset 0 0 0 1px rgba(235,234,239,0.95)",
                                    }}
                                  >
                                    <div className="gap-0.5 flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 500,
                                            color: "var(--neutral-70)",
                                            letterSpacing: "-0.27px",
                                            lineHeight: 1.05,
                                          }}
                                        >
                                          {drug.type}
                                        </span>
                                        <span
                                          className="shrink-0"
                                          style={{
                                            fontSize: 9,
                                            fontWeight: 500,
                                            color: "var(--neutral-70)",
                                            letterSpacing: "-0.27px",
                                            lineHeight: 1.05,
                                          }}
                                        >
                                          {drug.code}
                                        </span>
                                      </div>
                                      <div className="gap-2 flex items-center">
                                        <span
                                          className="overflow-hidden text-body4"
                                          style={{
                                            color: "var(--neutral-10)",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {drug.name}
                                        </span>
                                        {selectedWarnings.length > 0 ? (
                                          <DrugWarningIndicator warnings={selectedWarnings} compact />
                                        ) : null}
                                      </div>
                                    </div>
                                    <div
                                      className="gap-[38px] flex items-center shrink-0"
                                      style={{ marginLeft: 12 }}
                                    >
                                      {drug.checks.map((checked, checkIndex) => (
                                        <div
                                          key={`${drug.id}-${checkIndex}`}
                                          onClick={() => handleToggleCheck(drug.id, checkIndex)}
                                          className="flex items-center justify-center cursor-pointer"
                                          style={{ width: 18, height: 18 }}
                                        >
                                          {checked ? (
                                            <CheckboxChecked size={17} />
                                          ) : (
                                            <CheckboxUnchecked size={17} />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDrug(drug.id)}
                                      className="flex items-center justify-center border-none cursor-pointer shrink-0"
                                      style={{
                                        width: 24,
                                        height: 24,
                                        background: "none",
                                        padding: 0,
                                        marginLeft: 16,
                                      }}
                                    >
                                      <IconDelete size={18} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                      <div className="min-w-0 flex-1 overflow-hidden" style={{ flex: "2.5 2.5 0" }}>
                        <div className="grid h-full min-h-0 [grid-template-columns:minmax(0,1fr)_144px] gap-x-[10px]">
                          <div className="gap-0 min-w-0 overflow-hidden flex flex-col">
                            <div
                              className="flex"
                              style={{ paddingLeft: "clamp(140px, 22%, 236px)", marginBottom: 4 }}
                            >
                              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((number) => (
                                <span
                                  key={number}
                                  className="flex-1 text-body5m"
                                  style={{ color: "var(--text-header)", textAlign: "center" }}
                                >
                                  {number}
                                </span>
                              ))}
                            </div>
                            <div className="rounded-[12px] overflow-hidden flex-1" style={{ background: "white" }}>
                              <div className="overflow-auto flex flex-col h-full">
                                {strategyRows.map((row, rowIndex) => (
                                  <div
                                    key={row.strategyId}
                                    className={cn(
                                      "flex-1 flex",
                                      showValidationError &&
                                        missingStrategySelections[row.strategyIdx] &&
                                        "bg-[#FFF8F8]"
                                    )}
                                    style={{
                                      minHeight: 80,
                                      borderTop:
                                        rowIndex > 0 ? "1px solid var(--neutral-90)" : undefined,
                                    }}
                                  >
                                    <div
                                      className="gap-1.5 shrink-0 flex flex-col"
                                      style={{
                                        width: "clamp(140px, 22%, 236px)",
                                        borderRight: "1px solid var(--neutral-90)",
                                        paddingTop: 2,
                                        paddingBottom: 2,
                                      }}
                                    >
                                      <div className="gap-1.5 flex flex-col shrink-0">
                                        <div className="flex items-center" style={{ paddingLeft: 16, paddingTop: 6 }}>
                                          <span className="text-body4" style={{ color: row.color }}>
                                            {row.strategy}
                                          </span>
                                          <span className="ml-1.5">
                                            <InfoIcon />
                                          </span>
                                        </div>
                                        <div style={{ height: 1, background: row.color }} />
                                      </div>
                                      <div className="flex flex-col" style={{ paddingLeft: 16, paddingRight: 8 }}>
                                        <span className="text-body5m" style={{ color: "var(--neutral-10)" }}>
                                          {selectedOutcomeLabel ?? "Outcome"}
                                        </span>
                                        <span className="text-body5m" style={{ color: "var(--neutral-10)" }}>
                                          {row.detail}
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      className="gap-1 flex-1 min-w-0 relative flex flex-col items-stretch justify-center"
                                      style={{
                                        paddingTop: 8,
                                        paddingBottom: 8,
                                        paddingLeft: 12,
                                        paddingRight: 12,
                                      }}
                                    >
                                      <div className="absolute inset-0 flex pointer-events-none" style={{ zIndex: 0 }}>
                                        {Array.from({ length: 9 }).map((_, columnIndex) => (
                                          <div
                                            key={`${row.strategyId}-${columnIndex}`}
                                            className="flex-1"
                                            style={{
                                              borderLeft:
                                                columnIndex > 0
                                                  ? "1px dashed var(--neutral-95)"
                                                  : undefined,
                                            }}
                                          />
                                        ))}
                                      </div>
                                      {drugRows.map((drug) => {
                                        const slot = drug.timelineSlots[row.strategyIdx];
                                        const isVisible = drug.checks[row.strategyIdx] && slot !== null;
                                        const isActiveDrag =
                                          dragState?.drugId === drug.id &&
                                          dragState.strategyIndex === row.strategyIdx;

                                        return (
                                          <div
                                            key={`${drug.id}-${row.strategyId}`}
                                            data-timeline-track="true"
                                            className="flex-1 flex items-center relative overflow-visible"
                                            style={{ minHeight: 16, maxHeight: 32, zIndex: 1 }}
                                          >
                                            {isVisible && slot ? (
                                              <TimelinePill
                                                name={drug.name}
                                                code={drug.code}
                                                slot={slot}
                                                active={isActiveDrag}
                                                onDragStart={(event, mode) =>
                                                  handleTimelineDragStart(
                                                    event,
                                                    drug.id,
                                                    row.strategyIdx,
                                                    mode
                                                  )
                                                }
                                              />
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-col">
                            {strategyRows.map((row, rowIndex) => (
                              <div
                                key={`${row.strategyId}-keep-current`}
                                className={cn(
                                  "flex items-center px-3",
                                  showValidationError &&
                                    missingStrategySelections[row.strategyIdx] &&
                                    "bg-[#FFF8F8]"
                                )}
                                style={{
                                  minHeight: 80,
                                  borderTop: rowIndex > 0 ? "1px solid transparent" : undefined,
                                }}
                              >
                                <label className="flex cursor-pointer items-center gap-2">
                                  <CustomCheckbox
                                    checked={row.keepCurrent}
                                    onChange={() => handleKeepCurrentToggle(row.strategyId)}
                                    size={17}
                                  />
                                  <span className="font-[Inter,sans-serif] text-[12px] font-semibold whitespace-nowrap text-[#5F5E5E]">
                                    Keep current
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3">
                <TrpCtaButton onClick={handleApply}>Apply</TrpCtaButton>
              </div>
            </TrpFramePanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
