"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import { useSimulationStore } from "@/store/simulationStore";
import { useProcessedStudyData } from "@/hooks/useProcessedStudyData";
import { RightPanel } from "@/components/drd/RightPanel";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import { IconVirusGray, IconFunnelActive, IconAsteriskGray, IconClockGray } from "@/components/ui/drd-step-icons";

const stepRoutes: Record<string, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  "filter": "/drd/filter",
  "high-risk": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};


const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusGray,
    isActive: false,
    title: "Patient/Disease Info",
    description: "Define patient groups by fixing simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "filter",
    IconComponent: IconFunnelActive,
    isActive: true,
    title: "Filter",
    description: "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    titleColor: "#ffffff",
    descriptionColor: "#c9c5c8",
    bgColor: "#262255",
  },
  {
    id: "high-risk",
    IconComponent: IconAsteriskGray,
    isActive: false,
    title: "High-Risk Subgroub",
    description: "Select high-risk subgroups based on disease progression slopes. Prognostic scoring and loading of prior subgroup definitions are supported.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "medical-history",
    IconComponent: IconClockGray,
    isActive: false,
    title: "Medical History",
    description: "Define patient groups based on clinical history and risk profiles. Patient groups can be selected using diagnoses, comorbidities, risk factors, and key medical history.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
];

function IconPlus({ size = 16, color = "#c6c5c9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3V13M3 8L13 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


function IconFileDownload({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V16M12 16L8 12M12 16L16 12M4 20H20" stroke="#c6c5c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolderPlus({ size = 24, color = "#262255" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11V17M15 14H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash({ size = 24, color = "#c6c5c9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M10 11V17M14 11V17M5 6L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 6M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const infoFeatures = [
  "GENDER", "AGE", "ALC", "RACE", "DRUG", "HEIGHT", "WEIGHT", "EDU", "CAORBD", "TOB"
];

type SubRow = { logic: string; feature: string; op: string; value: string };
type Section = {
  id: number;
  name: string;
  feature: string;
  op: string;
  value: string;
  subRows?: SubRow[];
};

const featureOptions = ["AGE", "WEIGHT [kg]", "MMTOTSCORE", "CDRTOT", "CITY", "GENDER", "ALC", "RACE", "DRUG", "HEIGHT", "EDU"];
const opOptions = [">", ">=", "<", "<=", "=", "!="];
const logicOptions = ["And", "Or"];

function makeEmptySection(id: number): Section {
  return { id, name: `Section ${id}`, feature: "", op: "", value: "" };
}

function GlassTestButton({ disabled, onClick }: { disabled?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const bg = disabled ? "#F5F5F7" : pressed ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)" : hovered ? "#EBEBEB" : "#F7F7F7";
  const textColor = disabled ? "#C6C5C9" : pressed ? "#3a11d8" : "#262255";
  return (
    <div
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
      style={{
        position: "relative",
        height: 40,
        paddingLeft: 20,
        paddingRight: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        borderRadius: 36,
        boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)",
        transition: "opacity 0.12s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "#333333", mixBlendMode: "color-dodge" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: bg, transition: "background 0.12s" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: pressed ? "2px solid rgba(51, 0, 255, 0.4)" : "2px solid rgba(255,255,255,0.3)", boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)", transition: "border-color 0.12s" }} />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 17,
          color: textColor,
          letterSpacing: "-0.51px",
          whiteSpace: "nowrap",
          paddingTop: 2,
          transition: "color 0.12s",
        }}
      >
        Test Load
      </span>
    </div>
  );
}

/* Figma DropdownItem — node 179:24118 */
function DropdownCell({
  value,
  width,
  flex,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  width?: number | string;
  flex?: number | string;
  placeholder?: boolean;
  options?: string[];
  onChange?: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!triggerRef.current) { setOpen(prev => !prev); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(prev => !prev);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width, flex, minWidth: 0, flexShrink: flex ? 1 : 0 }}>
      {/* 트리거 */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          width: "100%",
          height: 36,
          background: "#efeff4",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          paddingRight: 8,
          gap: 4,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 15,
            color: placeholder ? "#c6c5c9" : "#484646",
            letterSpacing: "-0.6px",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={open ? "/icons/disclosure/Property 1=Open, Size=18.svg" : "/icons/disclosure/Property 1=Close, Size=18.svg"}
          alt=""
          width={18}
          height={18}
          style={{ flexShrink: 0, display: "block" }}
        />
      </div>

      {/* 드롭다운 메뉴 — Portal로 document.body에 마운트해서 overflow:hidden 완전 우회 */}
      {open && options && options.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            background: "#efeff4",
            border: "1px solid #c6c5c9",
            borderRadius: 8,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 9999,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0px 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {options.map((opt, idx) => (
            <React.Fragment key={opt}>
              {idx > 0 && (
                <div style={{ height: 1, background: "#c6c5c9", flexShrink: 0 }} />
              )}
              <button
                onMouseDown={() => { onChange?.(opt); setOpen(false); }}
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 2,
                  paddingBottom: 2,
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#787776",
                  letterSpacing: "-0.6px",
                  lineHeight: 1.18,
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {opt}
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}


// ── 아이콘 SVG 컴포넌트 ──────────────────────────────────────────────────

function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="#C7C5C9" strokeWidth="1.5" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" stroke="#C7C5C9" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown({ size = 16, color = "#484646" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ size = 16, color = "#484646" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 16" fill="none">
      <path d="M1 1L8 8L1 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


// ── 데이터 설정 ───────────────────────────────────────────────────────────

const featureCategories = [
  { name: "COHORT", open: false },
  { name: "INFO", open: false, active: true },
  { name: "ADAS", open: false },
  { name: "CDR", open: false },
  { name: "CLIN", open: false },
  { name: "DRUG", open: false },
  { name: "LAB", open: false },
  { name: "MMSE", open: false },
];

// ──────────────────────────────────────────────────────────────────────────

export default function FilterPage() {
  const router = useRouter();
  const { setCompleted, cohortCount, finalCohortCount, filterData, setFilterData } = useDefaultSettingStore();
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});

  // Simulation logic from ATS
  const {
    activeTab: simActiveTab,
    isApplied,
    sampleSizeControl,
    nominalPower,
    apiData,
    setActiveTab: setSimActiveTab,
  } = useSimulationStore();

  const optivisData = apiData?.OPTIVIS || [];
  const traditionalData = apiData?.Traditional || [];

  const { filteredData, chartData } = useProcessedStudyData(
    optivisData,
    traditionalData,
    nominalPower
  );

  const findHighlightedData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    const optivisToSearch =
      filteredData.optivis.length > 0 ? filteredData.optivis : optivisData;

    if (optivisToSearch.length === 0) return null;

    const targetPower = sampleSizeControl;

    let optivisIndex = 0;
    let minPowerDiff = Math.abs(
      optivisToSearch[0].primary_endpoint_power - targetPower
    );

    for (let i = 1; i < optivisToSearch.length; i++) {
      const powerDiff = Math.abs(
        optivisToSearch[i].primary_endpoint_power - targetPower
      );
      if (powerDiff < minPowerDiff) {
        minPowerDiff = powerDiff;
        optivisIndex = i;
      }
    }

    const optivisPoint = optivisToSearch[optivisIndex];
    if (!optivisPoint) return null;

    const traditionalToSearch =
      filteredData.traditional.length > 0
        ? filteredData.traditional
        : traditionalData;

    if (traditionalToSearch.length === 0) {
      return {
        optivis: optivisPoint,
        traditional: null,
      };
    }

    let traditionalIndex = 0;
    let minTraditionalPowerDiff = Math.abs(
      traditionalToSearch[0].primary_endpoint_power - targetPower
    );

    for (let i = 1; i < traditionalToSearch.length; i++) {
      const powerDiff = Math.abs(
        traditionalToSearch[i].primary_endpoint_power - targetPower
      );
      if (powerDiff < minTraditionalPowerDiff) {
        minTraditionalPowerDiff = powerDiff;
        traditionalIndex = i;
      }
    }

    const traditionalPoint = traditionalToSearch[traditionalIndex];

    return {
      optivis: optivisPoint,
      traditional: traditionalPoint,
    };
  }, [apiData, sampleSizeControl, filteredData, optivisData, traditionalData]);

  const dynamicSimulationData = useMemo(() => {
    if (!findHighlightedData) {
      return null;
    }

    const { optivis, traditional } = findHighlightedData;

    if (!traditional) {
      return {
        topMetrics: {
          nToScreen: optivis.n_to_screen.toLocaleString(),
          sampleSize: optivis.total_patient.toLocaleString(),
          enrollment: optivis.enrollment.toFixed(2),
          primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(
            1
          ),
          secondaryEndpointPower: optivis.secondary_endpoint_power
            ? (optivis.secondary_endpoint_power * 100).toFixed(1)
            : "0.0",
          estimatedCostReduction: "-",
          gaugeValue: optivis.primary_endpoint_power,
          gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
        },
        smallerSample: {
          percentage: "-",
          chartData: {
            optivis: chartData.chart1Data.optivis,
            traditional: chartData.chart1Data.traditional,
          },
        },
        smallerNToScreen: {
          percentage: "-",
          subtitle: "Enrollment Time vs Power",
          chartData: {
            optivis: chartData.chart2Data.optivis,
            traditional: chartData.chart2Data.traditional,
          },
        },
        lowerCost: {
          percentage: "-",
          subtitle: "Sample Size vs Cost",
          chartData: {
            optivis: chartData.chart3Data.optivis,
            traditional: chartData.chart3Data.traditional,
          },
        },
        comparisonTable: {
          enrollment: {
            optivis: optivis.enrollment.toFixed(2),
            traditional: "-",
          },
          primaryEndpointPower: {
            optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
            traditional: "-",
          },
          secondaryEndpointPower: {
            optivis: optivis.secondary_endpoint_power
              ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
              : "0.0%",
            traditional: "-",
          },
          sampleSize: {
            optivis: {
              treatmentGroup1: optivis.treatment_group_1?.toString() || null,
              treatmentGroup2: optivis.treatment_group_2?.toString() || null,
              treatmentGroup3: optivis.treatment_group_3?.toString() || null,
              controlGroup: optivis.control_group?.toString() || "0",
              total: optivis.total_patient.toString(),
            },
            traditional: {
              treatmentGroup1: null,
              treatmentGroup2: null,
              treatmentGroup3: null,
              controlGroup: "-",
              total: "-",
            },
          },
        },
        reductionView: {
          charts: [
            {
              label: "Sample Size",
              change: "-",
              optivis: optivis.total_patient,
              traditional: 0,
            },
            {
              label: "Power",
              change: "-",
              optivis: Math.round(optivis.primary_endpoint_power * 100),
              traditional: 0,
            },
            {
              label: "Enrollment Time",
              change: "-",
              optivis: Math.round(optivis.enrollment),
              traditional: 0,
            },
            {
              label: "Cost",
              change: "-",
              optivis: Math.round(optivis.cost / 1000000),
              traditional: 0,
            },
          ],
        },
      };
    }

    const smallerSamplePctRaw =
      ((traditional.total_patient - optivis.total_patient) /
        traditional.total_patient) *
      100;
    const smallerSamplePct = Math.abs(smallerSamplePctRaw).toFixed(0);
    const smallerSampleIsNegative = smallerSamplePctRaw < 0;

    const smallerNToScreenPctRaw =
      ((traditional.enrollment - optivis.enrollment) / traditional.enrollment) *
      100;
    const smallerNToScreenPct = Math.abs(smallerNToScreenPctRaw).toFixed(1);
    const smallerNToScreenIsNegative = smallerNToScreenPctRaw < 0;

    const lowerCostPctRaw =
      ((traditional.cost - optivis.cost) / traditional.cost) * 100;
    const lowerCostPct = Math.abs(lowerCostPctRaw).toFixed(0);
    const lowerCostIsNegative = lowerCostPctRaw < 0;

    const sampleSizeReductionRaw =
      ((traditional.total_patient - optivis.total_patient) /
        traditional.total_patient) *
      100;
    const sampleSizeReduction = Math.abs(sampleSizeReductionRaw).toFixed(0);
    const sampleSizeIsNegative = sampleSizeReductionRaw < 0;

    const enrollmentReductionRaw =
      ((traditional.enrollment - optivis.enrollment) / traditional.enrollment) *
      100;
    const enrollmentReduction = Math.abs(enrollmentReductionRaw).toFixed(1);
    const enrollmentIsNegative = enrollmentReductionRaw < 0;

    const costReductionRaw =
      ((traditional.cost - optivis.cost) / traditional.cost) * 100;
    const costReduction = Math.abs(costReductionRaw).toFixed(0);
    const costReductionValue = Math.abs(
      (traditional.cost - optivis.cost) / 1000000
    ).toFixed(1);
    const costIsNegative = costReductionRaw < 0;

    return {
      topMetrics: {
        nToScreen: optivis.n_to_screen.toLocaleString(),
        sampleSize: optivis.total_patient.toLocaleString(),
        enrollment: optivis.enrollment.toFixed(2),
        primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(1),
        secondaryEndpointPower: optivis.secondary_endpoint_power
          ? (optivis.secondary_endpoint_power * 100).toFixed(1)
          : "0.0",
        estimatedCostReduction: costReduction,
        gaugeValue: optivis.primary_endpoint_power,
        gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
      },
      smallerSample: {
        percentage: `${smallerSamplePct}%`,
        isNegative: smallerSampleIsNegative,
        chartData: {
          optivis: chartData.chart1Data.optivis,
          traditional: chartData.chart1Data.traditional,
        },
      },
      smallerNToScreen: {
        percentage: `${smallerNToScreenPct}%`,
        isNegative: smallerNToScreenIsNegative,
        subtitle: "Enrollment Time vs Power",
        chartData: {
          optivis: chartData.chart2Data.optivis,
          traditional: chartData.chart2Data.traditional,
        },
      },
      lowerCost: {
        percentage: `${lowerCostPct}%`,
        isNegative: lowerCostIsNegative,
        subtitle: "Sample Size vs Cost",
        chartData: {
          optivis: chartData.chart3Data.optivis,
          traditional: chartData.chart3Data.traditional,
        },
      },
      comparisonTable: {
        enrollment: {
          optivis: optivis.enrollment.toFixed(2),
          traditional: traditional.enrollment.toFixed(2),
        },
        primaryEndpointPower: {
          optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
          traditional: `${(traditional.primary_endpoint_power * 100).toFixed(
            1
          )}%`,
        },
        secondaryEndpointPower: {
          optivis: optivis.secondary_endpoint_power
            ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
          traditional: traditional.secondary_endpoint_power
            ? `${(traditional.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
        },
        sampleSize: {
          optivis: {
            treatmentGroup1: optivis.treatment_group_1?.toString() || null,
            treatmentGroup2: optivis.treatment_group_2?.toString() || null,
            treatmentGroup3: optivis.treatment_group_3?.toString() || null,
            controlGroup: optivis.control_group?.toString() || "0",
            total: optivis.total_patient.toString(),
          },
          traditional: {
            treatmentGroup1: traditional.treatment_group_1?.toString() || null,
            treatmentGroup2: traditional.treatment_group_2?.toString() || null,
            treatmentGroup3: traditional.treatment_group_3?.toString() || null,
            controlGroup: traditional.control_group?.toString() || "0",
            total: traditional.total_patient.toString(),
          },
        },
      },
      reductionView: {
        charts: [
          {
            label: "Sample Size",
            change: `${sampleSizeReduction}%`,
            optivis: optivis.total_patient,
            traditional: traditional.total_patient,
            isNegative: sampleSizeIsNegative,
          },
          {
            label: "Power",
            change:
              optivis.primary_endpoint_power >=
              traditional.primary_endpoint_power
                ? "No loss"
                : `${(
                    (traditional.primary_endpoint_power -
                      optivis.primary_endpoint_power) *
                    100
                  ).toFixed(1)}%`,
            optivis: Math.round(optivis.primary_endpoint_power * 100),
            traditional: Math.round(traditional.primary_endpoint_power * 100),
            isNegative:
              optivis.primary_endpoint_power <
              traditional.primary_endpoint_power,
          },
          {
            label: "Enrollment Time",
            change: `${enrollmentReduction}%`,
            optivis: optivis.enrollment,
            traditional: traditional.enrollment,
            isNegative: enrollmentIsNegative,
          },
          {
            label: "Cost",
            change: `$${costReductionValue}M`,
            optivis: Math.round(optivis.cost / 1000000),
            traditional: Math.round(traditional.cost / 1000000),
            isNegative: costIsNegative,
          },
        ],
      },
    };
  }, [findHighlightedData, chartData, filteredData]);

  const getHighlightXValue = (
    _optivisData: number[][],
    chartType: "sampleSize" | "enrollment" | "cost" = "sampleSize"
  ) => {
    if (!findHighlightedData || !findHighlightedData.optivis) {
      return undefined;
    }

    const highlightedPoint = findHighlightedData.optivis;

    switch (chartType) {
      case "sampleSize":
        return highlightedPoint.total_patient;
      case "enrollment":
        return highlightedPoint.enrollment;
      case "cost":
        return highlightedPoint.total_patient;
      default:
        return highlightedPoint.total_patient;
    }
  };

  const simulationData =
    apiData && dynamicSimulationData ? dynamicSimulationData : null;

  const apiChartData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    const chart1Optivis = chartData.chart1Data.optivis;
    const chart1Traditional = chartData.chart1Data.traditional;
    const chart2Optivis = chartData.chart2Data.optivis;
    const chart2Traditional = chartData.chart2Data.traditional;
    const chart3Optivis = chartData.chart3Data.optivis;
    const chart3Traditional = chartData.chart3Data.traditional;

    return {
      smallerSample: {
        optivis: chart1Optivis,
        traditional: chart1Traditional,
      },
      smallerNToScreen: {
        optivis: chart2Optivis,
        traditional: chart2Traditional,
      },
      lowerCost: {
        optivis: chart3Optivis,
        traditional: chart3Traditional,
      },
    };
  }, [apiData, chartData, optivisData, traditionalData]);

  const chartDataToUse = apiChartData;

  const [activeTab, setActiveTab] = useState<"Inclusion" | "Exclusion">("Inclusion");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(featureCategories.map(c => [c.name, c.open ?? false]))
  );
  const [activeCat, setActiveCat] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState<boolean>(false);
  const [searchDropdownPos, setSearchDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  // 검색 결과: 카테고리별로 그룹핑
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { category: string; feature: string }[] = [];
    featureCategories.forEach(cat => {
      infoFeatures.forEach(f => {
        if (f.toLowerCase().includes(q)) {
          results.push({ category: cat.name, feature: f });
        }
      });
    });
    return results;
  }, [searchQuery]);

  // 카테고리별로 그룹핑
  const groupedSearchResults = React.useMemo(() => {
    const groups: Record<string, string[]> = {};
    searchResults.forEach(({ category, feature }) => {
      if (!groups[category]) groups[category] = [];
      if (!groups[category].includes(feature)) groups[category].push(feature);
    });
    return groups;
  }, [searchResults]);

  React.useEffect(() => {
    if (!searchDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!searchContainerRef.current?.contains(target) && !searchDropdownRef.current?.contains(target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchDropdownOpen]);

  // 탭별 섹션 목록 — 초기: Section 1 하나만, 열린 상태
  const [inclusionSections, setInclusionSections] = useState<Section[]>(filterData.inclusion.length > 0 ? filterData.inclusion : [makeEmptySection(1)]);
  const [exclusionSections, setExclusionSections] = useState<Section[]>(filterData.exclusion.length > 0 ? filterData.exclusion : [makeEmptySection(1)]);
  const [inclusionOpenSections, setInclusionOpenSections] = useState<Record<number, boolean>>(filterData.inclusion.length > 0 ? Object.fromEntries(filterData.inclusion.map(s => [s.id, true])) : { 1: true });
  const [exclusionOpenSections, setExclusionOpenSections] = useState<Record<number, boolean>>(filterData.exclusion.length > 0 ? Object.fromEntries(filterData.exclusion.map(s => [s.id, true])) : { 1: true });

  const currentSections = activeTab === "Inclusion" ? inclusionSections : exclusionSections;
  const currentOpenSections = activeTab === "Inclusion" ? inclusionOpenSections : exclusionOpenSections;
  const setCurrentSections = activeTab === "Inclusion" ? setInclusionSections : setExclusionSections;
  const setCurrentOpenSections = activeTab === "Inclusion" ? setInclusionOpenSections : setExclusionOpenSections;

  const isDeleteEnabled = Object.values(checkedRows).some(Boolean);

  const hasValidRow = (sections: Section[]) =>
    sections.some(s => s.feature && s.op && s.value);
  const isConfirmEnabled = hasValidRow(inclusionSections) || hasValidRow(exclusionSections);

  const deleteCheckedRows = () => {
    if (!isDeleteEnabled) return;

    const checkedMainIds = new Set<number>();
    const checkedSubMap: Record<number, Set<number>> = {};

    Object.entries(checkedRows).forEach(([key, val]) => {
      if (!val) return;
      const mainMatch = key.match(/^(\d+)-main$/);
      const subMatch = key.match(/^(\d+)-sub-(\d+)$/);
      if (mainMatch) checkedMainIds.add(Number(mainMatch[1]));
      if (subMatch) {
        const sId = Number(subMatch[1]);
        const rIdx = Number(subMatch[2]);
        if (!checkedSubMap[sId]) checkedSubMap[sId] = new Set();
        checkedSubMap[sId].add(rIdx);
      }
    });

    const firstSectionId = currentSections.length > 0 ? Math.min(...currentSections.map(s => s.id)) : -1;

    setCurrentSections(prev =>
      prev
        .filter(s => !checkedMainIds.has(s.id) || s.id === firstSectionId)
        .map(s => {
          // 첫 번째 섹션의 main이 체크된 경우 → 내용만 초기화
          if (s.id === firstSectionId && checkedMainIds.has(s.id)) {
            return { ...s, feature: "", op: "", value: "", subRows: [] };
          }
          if (!checkedSubMap[s.id]) return s;
          return {
            ...s,
            subRows: (s.subRows ?? []).filter((_, i) => !checkedSubMap[s.id].has(i)),
          };
        })
    );
    setCheckedRows({});
  };

  const toggleSection = (id: number) => {
    setCurrentOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addSection = () => {
    const newId = currentSections.length > 0 ? Math.max(...currentSections.map(s => s.id)) + 1 : 1;
    const newSection = makeEmptySection(newId);
    setCurrentSections(prev => [...prev, newSection]);
    setCurrentOpenSections(prev => ({ ...prev, [newId]: true }));
  };

  const updateSection = (id: number, field: keyof Section, value: string) => {
    setCurrentSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSubRow = (sectionId: number) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const newSubRow: SubRow = { logic: "", feature: "", op: "", value: "" };
      return { ...s, subRows: [...(s.subRows ?? []), newSubRow] };
    }));
  };

  const updateSubRow = (sectionId: number, rIdx: number, field: keyof SubRow, value: string) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const subRows = (s.subRows ?? []).map((r, i) => i === rIdx ? { ...r, [field]: value } : r);
      return { ...s, subRows };
    }));
  };

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => {
      const isCurrentlyOpen = prev[name];
      // 모두 닫고, 현재 항목만 토글 (한 번에 하나만 열림)
      const allClosed = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      return { ...allClosed, [name]: !isCurrentlyOpen };
    });
  };

  const fillTestData = () => {
    setInclusionSections([
      { id: 1, name: "Section 1", feature: "AGE", op: ">", value: "55" },
      { id: 2, name: "Section 2", feature: "WEIGHT [kg]", op: ">", value: "50" },
      { id: 3, name: "Section 3", feature: "MMTOTSCORE", op: ">=", value: "22", subRows: [
        { logic: "Or", feature: "CDRTOT", op: "=", value: "0.5" },
        { logic: "Or", feature: "CDRTOT", op: "=", value: "1.0" },
      ]},
      { id: 4, name: "Section 4", feature: "CITY", op: "=", value: "Seoul" },
    ]);
    setInclusionOpenSections({ 1: true, 2: true, 3: true, 4: true });
    setExclusionSections([
      { id: 1, name: "Section 1", feature: "BMI", op: "<", value: "34" },
    ]);
    setExclusionOpenSections({ 1: true });
    setActiveTab("Inclusion");
    setCheckedRows({});
  };

  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px" }}>
        {/* {타이틀 영역/Title Area} */}
        {/* ── TOP: Title ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0, padding: "0 12px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 onClick={() => router.push("/drd/default-setting")} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
              Default Settings
            </h1>
            <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
              Setup Required
            </span>
          </div>
        </div>

        {/* {컨텐츠 영역/Content Area} */}
        {/* ── 컨텐츠 영역 ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "row", flex: 1, gap: "0px", minHeight: 0, alignItems: "stretch", overflow: "hidden" }}>
          
          {/* ── 왼쪽 패널 (Navy Glass) ────────────────── */}
         <div
            className="w-[380px] flex-shrink-0 rounded-[36px] gap-[12px] overflow-hidden flex flex-col"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            {/* {필터링된 환자 카드/Filtered Patients Card} */}
            {/* Filtered Patients 카드 */}
            <div className="shrink-0 h-[250px] relative rounded-[24px] overflow-hidden flex flex-col p-[16px] shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)]">
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ backgroundImage: "linear-gradient(90deg, #262255 0%, #262255 100%)" }}
              />
              <div className="absolute inset-0 bg-[rgba(38,38,38,0.25)] mix-blend-color-dodge z-[1]" />

              <div className="relative z-10 flex flex-col h-full gap-[0px]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-['Inter'] font-semibold text-[15px] leading-[1.18] text-white tracking-[-0.36px]">filtered patients</span>
                    <span className="font-['Inter'] font-semibold text-[36px] leading-none text-white tracking-[-1.08px]">{filteredRatio}%</span>
                  </div>
                  <button onClick={() => router.push("/drd/datasetting")} className="flex items-center gap-[4px] h-[30px] px-[14px] py-[8px] rounded-[36px] border-none cursor-pointer relative bg-transparent overflow-hidden">
                    <div className="absolute inset-0 bg-[#f06600] mix-blend-plus-lighter" />
                    <span className="relative z-10 font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] mix-blend-screen">Add data</span>
                    <span className="relative z-10 text-[16px] text-white font-bold mix-blend-screen">+</span>
                  </button>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <div className="relative h-[18px] w-full rounded-[12px]" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <div className="absolute left-0 top-0 h-full bg-[#f06600] rounded-[12px] transition-all duration-300 overflow-hidden" style={{ width: `${filteredRatio}%` }} />
                    <div className="absolute inset-0 flex items-center justify-end pr-[11.13px]">
                      <span className="font-['Inter'] font-semibold text-[13px] leading-[1.18] text-white tracking-[-0.36px] text-right" style={{ textShadow: "0 0 6px rgba(0,0,0,0.4)" }}>{finalCohortCount.toLocaleString()}/{cohortCount.toLocaleString()} patients</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-[2px] mt-auto">
                  <div className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px]">OPMD</div>
                  <div className="flex gap-[11px]">
                    <div className="flex gap-[3px] items-center">
                      <span className="font-['Inter'] font-semibold text-[10px] leading-[1.1] text-white tracking-[-0.4px]">Initial Cohort</span>
                      <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] w-[86px]">{cohortCount.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-[3px] items-center">
                      <span className="font-['Inter'] font-semibold text-[10px] leading-[1.1] text-white tracking-[-0.4px]">Final Cohort</span>
                      <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] w-[86px]">{finalCohortCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* {필터 설정 영역/Filter Settings Area} */}
            {/* Filter Settings Area */}
            <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-y-auto">
              {setupSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => router.push(stepRoutes[step.id])}
                  className={[
                    "flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150",
                    step.isActive
                      ? ""
                      : "hover:bg-[#f9f8fc] active:bg-[#efeff4]",
                  ].join(" ")}
                  style={{ backgroundColor: step.bgColor || undefined, height: 100, justifyContent: "center" }}
                >
                  <div className="flex items-center gap-[18px]">
                    <div className="shrink-0 flex items-center justify-center">
                      <step.IconComponent size={24} />
                    </div>
                    <span
                      className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]"
                      style={{ color: step.titleColor }}
                    >
                      {step.title}
                    </span>
                  </div>
                  <div className="pl-[42px] mt-0">
                    <p
                      className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0"
                      style={{ color: step.descriptionColor }}
                    >
                      {step.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* {오른쪽 패널/Right Panel} */}
          {/* ── 오른쪽 패널 (Light Glass) ────────────────── */}
          {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
             <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", marginLeft: "-6px" }}>

            <div className="shrink-0 px-[8px] flex items-center justify-between h-[40px]" style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}>
              <h2 className="font-['Inter'] font-semibold text-[24px] leading-[1.2] text-[#262255] tracking-[-0.72px] m-0">
                Filter
              </h2>
              <GlassTestButton onClick={fillTestData} />
            </div>

            <div className="flex flex-col flex-1 min-h-0 gap-[12px]">
            <div className="flex flex-row flex-1 min-h-0 gap-[12px]">
            
              {/* {피처 리스트/Feature List} */}
              {/* Feature List (왼쪽 컬럼) */}
              <div className="w-[272px] shrink-0 flex flex-col gap-[12px]">
                <div className="px-[4px]">
                  <span className="font-['Inter'] font-medium text-[19.5px] leading-[1.2] text-[#484646] tracking-[-0.585px]">Feature List</span>
                </div>

                {/* 리스트 아코디언 + 검색 필드 */}
                <div className="flex-1 bg-white rounded-[24px] flex flex-col overflow-y-auto font-['Inter']">
                  {/* 검색 필드 */}
                  <div ref={searchContainerRef} className="relative shrink-0">
                    <div className="h-[48px] bg-white flex items-center px-[18px] gap-[8px]" style={{ borderBottom: "1px solid #c7c5c9" }}>
                      <IconSearch size={20} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search features"
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.trim()) {
                            const rect = searchContainerRef.current?.getBoundingClientRect();
                            if (rect) setSearchDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                            setSearchDropdownOpen(true);
                          } else {
                            setSearchDropdownOpen(false);
                          }
                        }}
                        onFocus={() => {
                          if (searchQuery.trim()) {
                            const rect = searchContainerRef.current?.getBoundingClientRect();
                            if (rect) setSearchDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                            setSearchDropdownOpen(true);
                          }
                        }}
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontFamily: "Inter",
                          fontWeight: 500,
                          fontSize: 15,
                          color: "#484646",
                          letterSpacing: "-0.45px",
                          lineHeight: "normal",
                          paddingTop: 0,
                          paddingBottom: 0,
                          display: "block",
                        }}
                        className="placeholder:text-[#c6c5c9]"
                      />
                    </div>

                    {/* 검색 드롭다운 */}
                    {searchDropdownOpen && typeof document !== "undefined" && createPortal(
                      <div
                        ref={searchDropdownRef}
                        style={{
                          position: "fixed",
                          top: searchDropdownPos.top,
                          left: searchDropdownPos.left,
                          width: searchDropdownPos.width,
                          background: "white",
                          borderRadius: 22,
                          zIndex: 9999,
                          maxHeight: 268,
                          overflowY: "auto",
                          boxShadow: "0px 4px 16px rgba(0,0,0,0.125)",
                        }}
                      >
                        {Object.keys(groupedSearchResults).length === 0 ? (
                          <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#aaaaad", letterSpacing: "-0.39px" }}>
                              No results found
                            </span>
                          </div>
                        ) : (
                          <>
                            {Object.entries(groupedSearchResults).map(([category, features], catIdx, arr) => (
                              <div key={category} style={{ borderBottom: catIdx < arr.length - 1 ? "1px solid #EBEBEB" : "none" }}>
                                {/* 카테고리 헤더 */}
                                <div style={{ paddingTop: 4, paddingLeft: 8, paddingRight: 8 }}>
                                  <span style={{
                                    fontFamily: "Inter", fontWeight: 500, fontSize: 10,
                                    color: "#aaaaad", letterSpacing: "-0.27px", lineHeight: 1.05,
                                  }}>
                                    {category}
                                  </span>
                                </div>
                                {/* 항목들 */}
                                {features.map((f, fIdx) => (
                                  <div
                                    key={f}
                                    onMouseDown={() => {
                                      setActiveFeature(f);
                                      setActiveCat(category);
                                      setSearchDropdownOpen(false);
                                    }}
                                    style={{
                                      height: 28,
                                      display: "flex",
                                      alignItems: "center",
                                      paddingLeft: 8,
                                      paddingRight: 8,
                                      borderTop: fIdx === 0 ? "none" : "1px solid #EBEBEB",
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.04)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                                  >
                                    <span style={{
                                      flex: 1,
                                      fontFamily: "Inter", fontWeight: 500, fontSize: 13,
                                      color: "#787776", letterSpacing: "-0.48px", lineHeight: 1.1,
                                    }}>
                                      {f}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                  {featureCategories.map((cat) => {
                    const isOpen = openCategories[cat.name];
                    const isActive = activeCat === cat.name;
                    return (
                      <div key={cat.name} className="flex flex-col border-b border-[#c7c5c9] last:border-none">
                        <div
                          onClick={() => { toggleCategory(cat.name); setActiveCat(cat.name); }}
                          className={`flex items-center h-[48px] px-[18px] gap-[10px] cursor-pointer select-none ${isActive ? "bg-[#262255]" : "hover:bg-[#f9f8fc]"}`}
                        >
                          <div className="shrink-0 w-[16px] h-[16px] flex items-center justify-center">
                            {isOpen
                              ? <IconChevronDown size={14} color={isActive ? "#ffffff" : "#484646"} />
                              : <IconChevronRight size={14} color={isActive ? "#ffffff" : "#484646"} />}
                          </div>
                          <span className={`font-semibold text-[15px] leading-none tracking-[-0.45px] ${isActive ? "text-white" : "text-[#484646]"}`}>
                            {cat.name}
                          </span>
                        </div>
                        {isOpen && (
                          <div className="flex flex-col overflow-y-auto scrollbar-hide">
                            {infoFeatures.map(f => {
                              const isFeatureActive = activeFeature === f;
                              const isFeatureHovered = hoveredFeature === f;
                              return (
                                <div
                                  key={f}
                                  onClick={() => setActiveFeature(isFeatureActive ? null : f)}
                                  onMouseEnter={() => setHoveredFeature(f)}
                                  onMouseLeave={() => setHoveredFeature(null)}
                                  className={`h-[44px] flex items-center pl-[44px] text-[15px] font-medium tracking-[-0.45px] border-t border-[#c7c5c9] first:border-none cursor-pointer select-none transition-colors ${
                                    isFeatureActive
                                      ? "bg-[#efeff4] text-[#262255] font-semibold"
                                      : isFeatureHovered
                                      ? "bg-[#f9f8fc] text-[#484646]"
                                      : "text-[#919092]"
                                  }`}
                                >
                                  {f}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </div>

              {/* {메인 설정 영역/Main Setting Area} */}
              {/* 메인 설정 영역 (오른쪽 컬럼) */}
              <div className="flex-1 flex flex-col gap-[12px] rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[12px] overflow-y-auto">
                
                {/* 상단 탭 + 액션 버튼 */}
                <div className="flex justify-between items-center shrink-0">
                  {/* Inclusion / Exclusion 탭 */}
                  <div className="bg-white p-[4px] rounded-[22px] flex">
                    <button
                      onClick={() => { setActiveTab("Inclusion"); setCheckedRows({}); }}
                      className={`h-[36px] px-[18px] rounded-[36px] border-none font-semibold text-[15px] cursor-pointer transition-all ${activeTab === "Inclusion" ? "bg-[#262255] text-white" : "bg-transparent text-[#484646]"}`}
                    >
                      Inclusion
                    </button>
                    <button
                      onClick={() => { setActiveTab("Exclusion"); setCheckedRows({}); }}
                      className={`h-[36px] px-[18px] rounded-[36px] border-none font-semibold text-[15px] cursor-pointer transition-all ${activeTab === "Exclusion" ? "bg-[#262255] text-white" : "bg-transparent text-[#484646]"}`}
                    >
                      Exclusion
                    </button>
                  </div>

                  {/* 유리 스타일 버튼들 */}
                  <div className="flex items-center gap-[12px]">
                    <div className="flex gap-[4px]">
                      {/* IconFileDownload — 비활성화 상태 (3번과 동일) */}
                      <div className="relative size-[48px] flex items-center justify-center cursor-pointer" style={{ flexShrink: 0 }}>
                        <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                        <IconFileDownload size={24} />
                      </div>
                      {/* IconFolderPlus — 비활성화 상태 */}
                      <div className="relative size-[48px] flex items-center justify-center" style={{ cursor: "default", flexShrink: 0 }}>
                        <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                        <div className="relative z-10"><IconFolderPlus size={24} color="#c6c5c9" /></div>
                      </div>
                      {/* IconTrash — 비활성화: 현재 디자인, 활성화: 유리 스타일 */}
                      <div
                        className="relative size-[48px] flex items-center justify-center"
                        style={{ cursor: isDeleteEnabled ? "pointer" : "default", flexShrink: 0 }}
                        onClick={deleteCheckedRows}
                      >
                        <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                        <div className="relative z-10"><IconTrash size={24} color={isDeleteEnabled ? "#262255" : "#c6c5c9"} /></div>
                      </div>
                    </div>
                    {/* Add Section 버튼 */}
                    <div
                      className="relative h-[48px] px-[20px] rounded-[100px] flex items-center gap-[6px] cursor-pointer"
                      style={{ flexShrink: 0 }}
                      onClick={addSection}
                    >
                      <div style={{ position: "absolute", inset: 0, borderRadius: 100, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                      <span className="relative z-10 font-['Inter'] font-semibold text-[15px] text-[#262255] tracking-[-0.51px]">Add Section</span>
                      <div className="relative z-10"><IconPlus size={16} color="#262255" /></div>
                    </div>
                  </div>
                </div>

                {/* 섹션 리스트 */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-[14px]">
                  {currentSections.map((section: Section) => {
                    const isSectionOpen = currentOpenSections[section.id];
                    return (
                    <div key={section.id} className="bg-white rounded-[12px] flex flex-col">
                      {/* 섹션 헤더 */}
                      <div
                        className={`h-[46px] flex items-center px-[21px] gap-[10px] cursor-pointer select-none hover:bg-[#fdfdfd] rounded-[12px] transition-colors ${isSectionOpen ? "rounded-b-none" : ""}`}
                        style={isSectionOpen ? { borderBottom: "1.5px solid #c7c5c9" } : {}}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className={`shrink-0 transition-transform duration-200 ${isSectionOpen ? "rotate-0" : "-rotate-90"}`}>
                          <IconChevronDown size={14} color="#313030" />
                        </div>
                        <span className="font-['Inter'] font-semibold text-[15px] text-[#313030] tracking-[-0.45px]">
                          {section.name}
                        </span>
                      </div>

                      {/* 섹션 본문 (열렸을 때만) */}
                      {isSectionOpen && (
                        <>
                          {/* 섹션 본문 - 첫 번째 줄 */}
                          <div className="flex items-center h-[50px] px-[24px] gap-[14px]">
                            <CustomCheckbox
                              checked={!!checkedRows[`${section.id}-main`]}
                              onChange={() => setCheckedRows(prev => ({ ...prev, [`${section.id}-main`]: !prev[`${section.id}-main`] }))}
                            />
                            <div className="shrink-0" style={{ flex: "0 0 17%" }} />

                            <DropdownCell
                              value={section.feature || "Feature Select"} flex={3}
                              placeholder={!section.feature} options={featureOptions}
                              onChange={v => updateSection(section.id, "feature", v)}
                            />
                            <DropdownCell
                              value={section.op || "Select"} flex={2}
                              placeholder={!section.op} options={opOptions}
                              onChange={v => updateSection(section.id, "op", v)}
                            />
                            <input
                              type="text"
                              value={section.value}
                              placeholder="Write input"
                              onChange={e => updateSection(section.id, "value", e.target.value)}
                              className="placeholder:text-[#c6c5c9]"
                              style={{
                                flex: 4, minWidth: 0, height: 36,
                                background: "#efeff4", borderRadius: 8, border: "none",
                                paddingLeft: 12, paddingRight: 12,
                                fontFamily: "Inter", fontWeight: 500, fontSize: 17,
                                color: "#484646", letterSpacing: "-0.68px",
                                outline: "none", cursor: "text",
                              }}
                            />

                            <div className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer" onClick={() => addSubRow(section.id)}><IconPlus size={16} color="#999" /></div>
                          </div>

                          {/* 섹션 본문 - 추가 줄 (서브 로직) */}
                          {(section.subRows ?? []).map((row: SubRow, rIdx: number) => (
                            <div key={rIdx} className="flex items-center h-[50px] px-[24px] gap-[14px]" style={{ borderTop: "1.5px solid #c7c5c9" }}>
                              <CustomCheckbox
                                checked={!!checkedRows[`${section.id}-sub-${rIdx}`]}
                                onChange={() => setCheckedRows(prev => ({ ...prev, [`${section.id}-sub-${rIdx}`]: !prev[`${section.id}-sub-${rIdx}`] }))}
                              />

                              <DropdownCell
                                value={row.logic || "Select"} flex="0 0 17%"
                                placeholder={!row.logic}
                                options={logicOptions}
                                onChange={v => updateSubRow(section.id, rIdx, "logic", v)}
                              />
                              <DropdownCell
                                value={row.feature || "Feature Select"} flex={3}
                                placeholder={!row.feature} options={featureOptions}
                                onChange={v => updateSubRow(section.id, rIdx, "feature", v)}
                              />
                              <DropdownCell
                                value={row.op || "Select"} flex={2}
                                placeholder={!row.op} options={opOptions}
                                onChange={v => updateSubRow(section.id, rIdx, "op", v)}
                              />
                              <input
                                type="text"
                                value={row.value}
                                placeholder="Write input"
                                onChange={e => updateSubRow(section.id, rIdx, "value", e.target.value)}
                                className="placeholder:text-[#c6c5c9]"
                                style={{
                                  flex: 4, minWidth: 0, height: 36,
                                  background: "#efeff4", borderRadius: 8, border: "none",
                                  paddingLeft: 12, paddingRight: 12,
                                  fontFamily: "Inter", fontWeight: 500, fontSize: 17,
                                  color: "#484646", letterSpacing: "-0.68px",
                                  outline: "none", cursor: "text",
                                }}
                              />

                              <div className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer" onClick={() => addSubRow(section.id)}><IconPlus size={16} color="#999" /></div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>

                {/* {하단 필터 수식 영역/Bottom Filter Formula Area} */}
                {/* 하단 필터 수식 영역 */}
                {(() => {
                  const extractLines = (sections: Section[]) => {
                    const lines: { logic: string | null; text: string }[] = [];
                    sections.forEach((section) => {
                      const mainHasData = section.feature || section.op || section.value;
                      if (mainHasData) {
                        const parts = [section.feature, section.op, section.value].filter(Boolean).join(" ");
                        lines.push({ logic: null, text: `{ ${parts} }` });
                      }
                      (section.subRows ?? []).forEach((row) => {
                        const rowHasData = row.feature || row.op || row.value;
                        if (rowHasData) {
                          const parts = [row.feature, row.op, row.value].filter(Boolean).join(" ");
                          lines.push({ logic: row.logic || "And", text: `{ ${parts} }` });
                        }
                      });
                    });
                    return lines;
                  };

                  const inclusionLines = extractLines(inclusionSections);
                  const exclusionLines = extractLines(exclusionSections);
                  const bothHaveData = inclusionLines.length > 0 && exclusionLines.length > 0;

                  const renderLines = (lines: { logic: string | null; text: string }[], label: string) => (
                    <div className="font-medium text-[15px] leading-[1.1] text-[#929090] tracking-[-0.45px] flex flex-col gap-[4px] font-['Inter']">
                      {lines.map((line, i) => (
                        <p key={i} className="m-0">
                          {i === 0
                            ? <><span className="text-[#262255] font-semibold">{label}</span> [ &nbsp;{line.text}</>
                            : <><span className="text-[#3a11d8] font-bold">{line.logic}</span> {line.text}</>
                          }
                          {i === lines.length - 1 && <> &nbsp;]</>}
                        </p>
                      ))}
                    </div>
                  );

                  return (
                    <div className="bg-white p-[16px] rounded-[12px] shrink-0 min-h-[104px]" style={{ display: "flex", gap: "16px" }}>
                      {bothHaveData ? (
                        <>
                          <div style={{ flex: 1, minWidth: 0 }}>{renderLines(inclusionLines, "Inclusion")}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>{renderLines(exclusionLines, "Exclusion")}</div>
                        </>
                      ) : (
                        <div style={{ flex: 1 }}>
                          {inclusionLines.length > 0 && renderLines(inclusionLines, "Inclusion")}
                          {exclusionLines.length > 0 && renderLines(exclusionLines, "Exclusion")}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div></div>

                {/* {하단 버튼/Bottom Buttons} */}
                {/* 하단 버튼 */}
                <div className="shrink-0 flex justify-end gap-[12px]">
                  <button
                    onClick={() => router.push("/drd/default-setting")}
                    className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] bg-[#787776] border-none cursor-pointer"
                  >
                    <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white tracking-[-0.51px]">Cancel</span>
                  </button>
                  <button
                    disabled={!isConfirmEnabled}
                    onClick={() => {
                      if (!isConfirmEnabled) return;
                      setFilterData({ inclusion: inclusionSections, exclusion: exclusionSections });
                      setCompleted("filter", true);
                      router.push("/drd/default-setting");
                    }}
                    className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] border-none"
                    style={{
                      background: isConfirmEnabled ? "#f06600" : "#c7c5c9",
                      cursor: isConfirmEnabled ? "pointer" : "not-allowed",
                    }}
                  >
                    <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white text-center tracking-[-0.51px]">Confirm</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
           </div>
    </AppLayout>
  );
}