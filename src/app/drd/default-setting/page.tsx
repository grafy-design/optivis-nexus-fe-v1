"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore, type DefaultSettingId } from "@/store/defaultSettingStore";
import { useSimulationStore, type EndpointItem } from "@/store/simulationStore";
import { Loading } from "@/components/common/Loading";
import { callMLStudyDesign, type PrimaryEndpointData, type SecondaryEndpointData, type StudyParameters } from "@/services/studyService";
import { IconVirusGray, IconFunnelGray, IconAsteriskGray, IconClockGray, IconVirusOrange, IconFunnelActive, IconAsteriskOrange, IconClockOrange } from "@/components/ui/drd-step-icons";

function IconComplete(): React.JSX.Element {
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F06600", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 9L7 13L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── 설정 아이템 정의 ─────────────────────────────────────────────────────────

type IconComp = (props: { size?: number }) => React.JSX.Element;

const settingItems: {
  id: DefaultSettingId;
  title: string;
  description: string;
  icon: IconComp;
  completedSummary: {
    columns?: { heading: string; rows: { label?: string; value: string }[] }[];
    heading?: string;
    rows?: { label: string; value: string }[];
  };
}[] = [
  {
    id: "patient-disease-info",
    title: "Patient/Disease Info",
    description: "Define patient groups by fixing simulation conditions and selecting control variables.",
    icon: IconVirusGray,
    completedSummary: {
      heading: "",
      rows: [],
    },
  },
  {
    id: "filter",
    title: "Filter",
    description: "Define patient groups through direct feature-based filtering.",
    icon: IconFunnelGray,
    completedSummary: {
      heading: "Inclusion",
      rows: [],
    },
  },
  {
    id: "high-risk-subgroup",
    title: "High-Risk Subgroup",
    description: "Select high-risk subgroups based on disease progression slopes.",
    icon: IconAsteriskGray,
    completedSummary: {
      heading: "",
      rows: [],
    },
  },
  {
    id: "medical-history",
    title: "Medical History",
    description: "Define patient groups based on clinical history and risk profiles.",
    icon: IconClockGray,
    completedSummary: {
      columns: [],
    },
  },
];

const settingRoutes: Record<DefaultSettingId, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  "filter": "/drd/filter",
  "high-risk-subgroup": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

// ── 서브컴포넌트 ─────────────────────────────────────────────────────────────


function InitialCard({ item, onClick }: { item: any; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={30} />
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "rgb(72,70,70)", letterSpacing: "-0.51px", lineHeight: "1" }}>{item.title}</span>
      </div>
      <p style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgb(145,144,146)", letterSpacing: "-0.39px", lineHeight: "1.4", margin: "16px 0 0", flex: 1 }}>
        {item.description}
      </p>
      <button onClick={onClick} style={{ width: "100%", height: 36, borderRadius: 36, border: "none", cursor: "pointer", background: "#8F8AC4", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, flexShrink: 0, paddingTop: 2 }}>
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.51px", lineHeight: 1 }}>Setting</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.33594 8.33594H14.3359" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.33594 2.33594V14.3359" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function CompletedCard({ item, onReset, onEdit }: { item: any; onReset: () => void; onEdit: () => void }) {
  const summary = item.completedSummary;
  const hasColumns = !!summary.columns;

  return (
    <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 42, minWidth: 0, flex: 1, overflow: "hidden" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <IconComplete />
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "rgb(72,70,70)", letterSpacing: "-0.51px", lineHeight: "1" }}>{item.title}</span>
      </div>

      {/* 내용 */}
      <div style={{ display: "flex", flex: 1, gap: 8, overflow: "hidden" }}>
        {hasColumns ? (
          /* Multi-column: Each column gets its own identical white container */
          (summary.columns as any[]).map((col: any, ci: number) => (
            <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 16, padding: 14, gap: 12, minWidth: 0 }}>
               {/* 컬럼 헤딩 */}
               <div style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "rgb(72,70,70)", letterSpacing: "-0.51px", lineHeight: 1, flexShrink: 0 }}>
                {col.heading}
              </div>
              
              <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
                {/* label 부모 (있을 경우만) */}
                {col.rows.some((r: any) => r.label) && (
                  <div style={{ flex: "0 0 auto", minWidth: "fit-content", display: "flex", flexDirection: "column", gap: 4 }}>
                    {col.rows.map((row: any, ri: number) => (
                      <div key={ri} style={{ height: 17, display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.39px", lineHeight: 1, whiteSpace: "nowrap" }}>
                          {row.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* value 행들 세로 나열 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  {(col.rows as any[]).map((row: any, ri: number) => (
                    <div key={ri} style={{ height: 17, display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgb(72,70,70)", letterSpacing: "-0.39px", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          /* 일반 단일 컨테이너: 헤딩 + 행 테이블 */
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#ffffff", borderRadius: 16, padding: 14, justifyContent: "flex-start", gap: 12 }}>
            {summary.heading && (
              <div style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "rgb(72,70,70)", letterSpacing: "-0.51px", flexShrink: 0 }}>
                {summary.heading}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(summary.rows ?? []).map((row: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", height: 36, gap: 10, flexShrink: 0, borderTop: i === 0 ? "none" : "1px solid #C6C5C9" }}>
                  {row.label && (
                    <span style={{ flex: "0 0 auto", minWidth: 80, fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.39px", lineHeight: 1 }}>{row.label}</span>
                  )}
                  <span style={{ flex: 1, fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgb(72,70,70)", letterSpacing: "-0.39px", lineHeight: 1 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
        <button onClick={onReset} style={{ height: 36, paddingLeft: 20, paddingRight: 10, borderRadius: 36, background: "#8f8ac4", border: "none", cursor: "pointer", fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.45px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          Reset
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/basics/Contents=Reset, Size=16.svg" alt="" width={18} height={18} style={{ display: "block", filter: "brightness(0) invert(1)" }} />
        </button>
        <button onClick={onEdit} style={{ height: 36, paddingLeft: 20, paddingRight: 14, borderRadius: 36, background: "#8f8ac4", border: "none", cursor: "pointer", fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.45px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          Edit
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 3.375V14.625" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.375 9H14.625" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const stepRoutes: Record<string, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  "filter": "/drd/filter",
  "high-risk-subgroup": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

// ── 데이터 설정 ───────────────────────────────────────────────────────────

const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusGray,
    IconOrangeComponent: IconVirusOrange,
    isActive: false,
    title: "Patient/Disease Info",
    description: "Define patient groups by fixing simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "filter",
    IconComponent: IconFunnelGray,
    IconOrangeComponent: IconFunnelActive,
    isActive: false,
    title: "Filter",
    description: "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "high-risk-subgroup",
    IconComponent: IconAsteriskGray,
    IconOrangeComponent: IconAsteriskOrange,
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
    IconOrangeComponent: IconClockOrange,
    isActive: false,
    title: "Medical History",
    description: "Define patient groups based on clinical history and risk profiles. Patient groups can be selected using diagnoses, comorbidities, risk factors, and key medical history.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
];


// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function DefaultSettingPage() {
  const router = useRouter();
  const { completedItems, setCompleted, isAllCompleted, isAnyCompleted, cohortCount, finalCohortCount, filterData, medicalHistoryData, patientDiseaseInfoData, highRiskSubgroupData, addSavedSimulation } = useDefaultSettingStore();

  const allCompleted = isAllCompleted();
  const anyCompleted = isAnyCompleted();

  const initialCohort = cohortCount;
  const finalCohort = finalCohortCount;
  const filteredRatio = initialCohort > 0 ? Math.round((finalCohort / initialCohort) * 100) : 0;

  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [simName, setSimName] = React.useState("");
  const [simDesc, setSimDesc] = React.useState("");

  const handleSaveSimulation = () => {
    if (!simName.trim()) return;
    const now = new Date();
    const lastUpdated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    addSavedSimulation({
      id: `drd-${Date.now()}`,
      simulationName: simName.trim(),
      type: "drd",
      population: `${finalCohortCount.toLocaleString()} / ${cohortCount.toLocaleString()}`,
      outcome: `${filteredRatio}%`,
      description: simDesc.trim(),
      lastUpdated,
    });
    setSimName("");
    setSimDesc("");
    setShowSaveModal(false);
  };

  const [animatedRatio, setAnimatedRatio] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const target = filteredRatio;
    const duration = 1000;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setAnimatedRatio(start);
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [filteredRatio]);

  const dynamicSettingItems = React.useMemo(() => {
    const items = [...settingItems];

    // Patient/Disease Info summary
    const pdiIdx = items.findIndex(it => it.id === "patient-disease-info");
    if (pdiIdx !== -1) {
      const d = patientDiseaseInfoData ?? { baselineDemo: "Age", baselineMeasure: "BMI", controlMode: "value", trendSelection: "Increase" };
      items[pdiIdx] = {
        ...items[pdiIdx],
        completedSummary: {
          heading: "",
          rows: [
            { label: "Demographic", value: d.baselineDemo },
            { label: "Measurement", value: d.baselineMeasure },
            { label: "Control", value: d.controlMode === "trend" ? `Trend: ${d.trendSelection}` : "Value" },
          ],
        },
      };
    }

    // High-Risk Subgroup summary
    const hrsIdx = items.findIndex(it => it.id === "high-risk-subgroup");
    if (hrsIdx !== -1) {
      const d = highRiskSubgroupData ?? { parentName: "CKD 1 Stage", subRowName: "Slow", feature: "eGFR", condition: "> 90", month: "36", slope: "2", status: "n=1,200", selectedSubRow: "ckd1-slow" };
      items[hrsIdx] = {
        ...items[hrsIdx],
        completedSummary: {
          heading: "",
          rows: [
            { label: "Set Name", value: `${d.parentName} / ${d.subRowName}` },
            { label: "Feature", value: d.feature },
            ...(d.condition ? [{ label: "Condition", value: d.condition }] : []),
            ...(d.month ? [{ label: "Month", value: d.month }] : []),
            ...(d.slope ? [{ label: "Slope", value: d.slope }] : []),
            ...(d.status ? [{ label: "Status", value: d.status }] : []),
          ],
        },
      };
    }

    const filterIdx = items.findIndex(it => it.id === "filter");
    if (filterIdx !== -1) {
      const inclusion = filterData.inclusion.filter(s => s.feature || s.op || s.value || (s.subRows && s.subRows.length > 0));
      const exclusion = filterData.exclusion.filter(s => s.feature || s.op || s.value || (s.subRows && s.subRows.length > 0));

      const formatSections = (sections: any[]) => {
        const rows: { label: string; value: string }[] = [];
        sections.forEach((s, sIdx) => {
          const mainPart = [s.feature, s.op, s.value].filter(Boolean).join(" ");
          if (mainPart) {
            rows.push({ label: sIdx === 0 ? "" : "And", value: `{ ${mainPart} }` });
          }
          (s.subRows ?? []).forEach((sr: any) => {
            const subPart = [sr.feature, sr.op, sr.value].filter(Boolean).join(" ");
            if (subPart) {
              rows.push({ label: sr.logic || "And", value: `{ ${subPart} }` });
            }
          });
        });
        
        // Wrap with brackets as requested
        if (rows.length > 0) {
          return rows.map((r, i) => {
             if (i === 0) return { ...r, value: `[ ${r.value}` };
             if (i === rows.length - 1) return { ...r, value: `${r.value} ]` };
             return r;
          });
        }
        return rows;
      };

      const incRows = formatSections(inclusion);
      const excRows = formatSections(exclusion);

      items[filterIdx] = {
        ...items[filterIdx],
        completedSummary: incRows.length > 0 && excRows.length > 0 ? {
          columns: [
            { heading: "Inclusion", rows: incRows },
            { heading: "Exclusion", rows: excRows }
          ]
        } : excRows.length > 0 ? {
          heading: "Exclusion",
          rows: excRows
        } : {
          heading: "Inclusion",
          rows: incRows.length > 0 ? incRows : [{ label: "", value: "-" }]
        }
      };
    }
    // Medical History sync
    const mhIdx = items.findIndex(it => it.id === "medical-history");
    if (mhIdx !== -1) {
      const mhLabels: Record<string, string> = {
        "ckd": "CKD",
        "ckd-1": "Stage 1 (eGFR >=90)",
        "ckd-2": "Stage 2 (eGFR >=60)",
        "ckd-3": "Stage 3 (eGFR >=30)",
        "ckd-4": "Stage 4 (eGFR >=15)",
        "ckd-5": "Stage 5 (eGFR <=90)",
        "cvd": "CVD History",
        "ascvd": "ASCVD",
        "hf": "HF",
        "stroke": "Stroke",
      };

      const baselineRows = ["ckd-1", "ckd-2", "ckd-3", "ckd-4", "ckd-5"]
        .filter(k => medicalHistoryData[k])
        .map(k => ({ label: "", value: mhLabels[k] }));
      
      const historyRows = ["ascvd", "hf", "stroke"]
        .filter(k => medicalHistoryData[k])
        .map(k => ({ label: "", value: mhLabels[k] }));

      // Handle the case where only parent is selected
      const baselineLabel = medicalHistoryData["ckd"] ? "CKD Stage" : "";
      const historyLabel = medicalHistoryData["cvd"] ? "CVD History" : "";

      items[mhIdx] = {
        ...items[mhIdx],
        completedSummary: {
          columns: [
            {
              heading: "Baseline Status",
              rows: [
                { label: baselineLabel || "Diagnosis", value: baselineRows[0]?.value || "-" },
                ...baselineRows.slice(1)
              ]
            },
            {
              heading: "Medical History",
              rows: [
                { label: historyLabel || "Risk Factors", value: historyRows[0]?.value || "-" },
                ...historyRows.slice(1)
              ]
            }
          ]
        }
      };
    }

    return items;
  }, [filterData, medicalHistoryData, patientDiseaseInfoData, highRiskSubgroupData]);

  // Simulation logic from ATS
  const {
    isApplied,
    primaryEndpoints,
    secondaryEndpoints,
    nominalPower,
    alpha,
    multiplicity,
    treatmentDuration,
    hypothesisType,
    treatmentArms,
    randomizationRatio,
    subpopulation,
    isLoading,
    setIsApplied,
    setSampleSizeControl,
    setApiData,
    setTaskId,
    setIsLoading,
    setError,
  } = useSimulationStore();

  const convertPrimaryEndpoint = (endpoint: string): string => {
    const endpointMap: Record<string, string> = {
      "ADAS Cog 11": "ADTOT70",
      MMSE: "MMTOTSCORE",
      CDR: "CDTOTSCORE",
    };
    return endpointMap[endpoint] || endpoint;
  };

  const handleApplySettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const roundedNominalPower = parseFloat(
        (Math.round(nominalPower / 0.05) * 0.05).toFixed(2)
      );

      const toApiType = (t: string | undefined) =>
        t === "Binary" ? "Binary" : "Continous";

      const thresholdPayload = (v: number | null | undefined) =>
        v != null && Number.isFinite(v)
          ? { threshold: v }
          : { threshold: null };

      const primaryDataList: PrimaryEndpointData[] = primaryEndpoints.map(
        (ep: EndpointItem, index: number) => {
          const outcome = convertPrimaryEndpoint(ep.name);
          const effectSize = parseFloat(
            (Math.round(ep.effectSize * 10) / 10).toFixed(1)
          );
          return {
            no: index + 1,
            outcome: [outcome],
            type: [toApiType(ep.type)],
            effect_size: [effectSize],
            ...thresholdPayload(ep.threshold),
            target_power: [roundedNominalPower],
            statistical_method: "ANCOVA",
            multiplicity: multiplicity || "Bonferroni",
            endpoint_objectives: ["Confirmatory"],
            alpha: alpha,
          };
        }
      );

      const secondaryDataList: SecondaryEndpointData[] =
        secondaryEndpoints.length > 0
          ? secondaryEndpoints.map((ep: EndpointItem, index: number) => {
              const outcome = convertPrimaryEndpoint(ep.name);
              const effectSize = parseFloat(
                (Math.round(ep.effectSize * 10) / 10).toFixed(1)
              );
              return {
                no: index + 1,
                outcome: [outcome],
                type: [toApiType(ep.type)],
                effect_size: [effectSize],
                ...thresholdPayload(ep.threshold),
                target_power: [roundedNominalPower],
                statistical_method: "ANCOVA",
                multiplicity: multiplicity || "Bonferroni",
                endpoint_objectives: ["Confirmatory"],
                alpha: alpha,
              };
            })
          : [];

      const durationValue = parseInt(
        treatmentDuration.replace(" months", ""),
        10
      );
      if (
        isNaN(durationValue) ||
        durationValue <= 0 ||
        durationValue % 3 !== 0
      ) {
        throw new Error("Treatment Duration은 3의 배수인 양수여야 합니다.");
      }

      const parameters: StudyParameters = {
        disease_area: "Alzheimer",
        treatment_duration: durationValue,
        treatment_arms: parseInt(treatmentArms, 10),
        randomization_ratio: randomizationRatio,
        stratification: false,
        hypothesis_type: hypothesisType,
        subpopulation: subpopulation,
        primary: primaryDataList,
        ...(secondaryDataList.length > 0
          ? { secondary: secondaryDataList }
          : {}),
      };

      const response = await callMLStudyDesign(parameters);

      const taskId = response.data?.task_id;
      if (taskId) {
        setTaskId(taskId);
      }

      const manageResult = response.data?.table_results?.manage_result as any;
      const sampleSizeEvaluation =
        response.data?.table_results?.sample_size_evaluation;
      const trialDesignConditionsSummary =
        response.data?.table_results?.result_trialdesignconditionsummary;
      const resultTypeSafety = response.data?.table_results?.result_type_safety;
      const resultVarianceDecline =
        response.data?.table_results?.result_variancedecline;
      const resultEstimatedTreatmentEffect =
        response.data?.table_results?.result_estimatedtreatmenteffect;
      const resultAbsolutePerformance =
        response.data?.table_results?.result_absoluteperformancecomparison;
      const resultRobustnessProof =
        response.data?.table_results?.result_robustnessproof;
      const resultDecisionStability =
        response.data?.table_results?.result_decisionstability;
      const graphAccModel = response.data?.table_results?.graph_acc_model;
      const resultPrecModel = response.data?.table_results?.result_prec_model;
      const appendix = response.data?.table_results?.appendix;

      if (manageResult) {
        const optivisData = manageResult.OPTIVIS || [];
        const traditionalData = manageResult.TRADITIONAL || [];
        const resultFormula = response.data?.table_results?.result_formula;

        const resultOverview =
          response.data?.table_results?.result_resultsoverview;

        setApiData({
          OPTIVIS: Array.isArray(optivisData) ? optivisData : [],
          Traditional: Array.isArray(traditionalData) ? traditionalData : [],
          result_formula: resultFormula,
          result_resultsoverview: resultOverview,
          result_trialdesignconditionsummary: trialDesignConditionsSummary,
          sample_size_evaluation: sampleSizeEvaluation,
          result_type_safety: resultTypeSafety,
          result_variancedecline: resultVarianceDecline,
          result_estimatedtreatmenteffect: resultEstimatedTreatmentEffect,
          result_absoluteperformancecomparison: resultAbsolutePerformance,
          result_robustnessproof: resultRobustnessProof,
          result_decisionstability: resultDecisionStability,
          graph_acc_model: graphAccModel,
          result_prec_model: resultPrecModel,
          appendix: appendix,
        });

        const roundedPower = parseFloat(
          (Math.round(nominalPower / 0.05) * 0.05).toFixed(2)
        );
        setSampleSizeControl(Math.max(0.6, Math.min(0.95, roundedPower)));

        setIsApplied(true);
      } else {
        throw new Error("API 응답에 데이터가 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "API 호출에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <Loading isLoading={isLoading} />
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px", }}>
        {/* {타이틀 영역/Title Area} */}
      {/* 타이틀 */}
          <div style={{ flexShrink: 0, padding: "0 12px" }}>
            <h1 onClick={() => router.push("/drd/default-setting")} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
              Default Settings
            </h1>
            <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
              {allCompleted ? "Setup Complete" : "Setup Required"}
            </span>
          </div>

      {/* {메인 레이아웃/Main Layout} */}
      {/* 메인 레이아웃: flex-1로 전체 가용 높이 채움 */}
      <div style={{ display: "flex", flex: 1, gap: "0px",  minHeight: 0, alignItems: "stretch", overflow: "hidden" }}>

         
          {/* {왼쪽 패널/Left Panel} */}
          {/* ── 왼쪽 패널 (Navy Glass - 9-slice) ────────────────── */}
          <div
            className=" drd-left-pannel w-[380px] flex-shrink-0 rounded-[36px] gap-[12px] overflow-hidden flex flex-col" style={{borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent"}}
          >
            {/* {필터링된 환자 카드/Filtered Patients Card} */}
            {/* Filtered Patients 카드 (내부) */}
            <div className="shrink-0 h-[250px] relative rounded-[24px] overflow-hidden flex flex-col p-[16px] shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)]">
              {/* 카드 전용 Navy 그라디언트 필 */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none" 
                style={{ 
                  backgroundImage: "linear-gradient(90deg, #262255 0%, #262255 100%)",
                }} 
              />
              <div className="absolute inset-0 bg-[rgba(38,38,38,0.25)] mix-blend-color-dodge z-[1]" />

              {/* 카드 내용 */}
              <div className="relative z-10 flex flex-col h-full">
                {/* 상단: filtered patients + Add data */}
                <div className="flex justify-between items-start mb-[24px]">
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-['Inter'] font-semibold text-[15px] leading-[1.18] text-white tracking-[-0.36px]">
                      filtered patients
                    </span>
                    <span className="font-['Inter'] font-semibold text-[36px] leading-none text-white tracking-[-1.08px]">
                      {animatedRatio}%
                    </span>
                  </div>

                  {/* Add data 버튼 */}
                  <button onClick={() => router.push("/drd/datasetting")} className="flex items-center gap-[4px] h-[30px] px-[14px] py-[8px] rounded-[36px] border-none cursor-pointer relative bg-transparent overflow-hidden">
                    <div className="absolute inset-0 bg-[#f06600] mix-blend-plus-lighter" />
                    <span className="relative z-10 font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] mix-blend-screen">
                      Add data
                    </span>
                    <span className="relative z-10 text-[16px] text-white font-bold mix-blend-screen">+</span>
                  </button>
                </div>

                {/* 프로그레스 바 (상단 블록 바로 아래 24px) */}
                <div className="relative h-[18px] w-full rounded-[12px]" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="absolute left-0 top-0 h-full bg-[#f06600] rounded-[12px] overflow-hidden" style={{ width: `${animatedRatio}%` }} />
                  <div className="absolute inset-0 flex items-center justify-end pr-[11.13px]">
                    <span className="font-['Inter'] font-semibold text-[13px] leading-[1.18] text-white tracking-[-0.36px] text-right" style={{ textShadow: "0 0 6px rgba(0,0,0,0.4)" }}>
                      {finalCohort.toLocaleString()}/{initialCohort.toLocaleString()} patients
                    </span>
                  </div>
                </div>

                {/* OPMD 섹션: 카드 바닥에 붙음 */}
                <div className="mt-auto flex flex-col gap-[2px]">
                  <div className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px]">
                    OPMD
                  </div>
                  <div className="flex gap-[11px]">
                    <div className="flex gap-[3px] items-center">
                      <span className="font-['Inter'] font-semibold text-[10px] leading-[1.1] text-white tracking-[-0.4px]">
                        Initial Cohort
                      </span>
                      <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] w-[86px]">
                        {initialCohort.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-[3px] items-center">
                      <span className="font-['Inter'] font-semibold text-[10px] leading-[1.1] text-white tracking-[-0.4px]">
                        Final Cohort
                      </span>
                      <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] w-[86px]">
                        {finalCohort.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* {설정 단계/Setup Steps} */}
            {/* Setup Steps 하단 영역 (Light Gray/Blue Glass Overlay) */}
            <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-hidden">
              {setupSteps.map((step) => {
                const isCompleted = completedItems[step.id as DefaultSettingId];
                return (
                  <button
                    key={step.id}
                    onClick={() => router.push(stepRoutes[step.id])}
                    className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                    style={{ background: "transparent", height: 100, justifyContent: "center" }}
                  >
                    <div className="flex items-center gap-[18px]">
                      {isCompleted ? (
                        <div className="shrink-0 flex items-center justify-center">
                          <step.IconOrangeComponent size={24} />
                        </div>
                      ) : (
                        <div className="shrink-0 flex items-center justify-center">
                          <step.IconComponent size={24} />
                        </div>
                      )}
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
                );
              })}
            </div>

            
          </div>


        {/* {오른쪽 패널/Right Panel} */}
        {/* ── 오른쪽 패널 ──────────────────────────────────────────────── */}
        <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", marginLeft: "-6px"}}>

          {/* {2x2 그리드/2x2 Grid} */}
          {/* 2×2 그리드 */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 12, minHeight: 0, paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}>
            {dynamicSettingItems.map((item) =>
              completedItems[item.id] ? (
                <CompletedCard key={item.id} item={item} onReset={() => setCompleted(item.id, false)} onEdit={() => router.push(settingRoutes[item.id])} />
              ) : (
                <InitialCard key={item.id} item={item} onClick={() => router.push(settingRoutes[item.id])} />
              )
            )}
          </div>

          {/* {하단 버튼/Bottom Buttons} */}
          {/* 하단 버튼 */}
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center"}}>
            <button disabled={!anyCompleted} onClick={() => anyCompleted && setShowSaveModal(true)} style={{ height: 40, paddingLeft: 28, paddingRight: 28, borderRadius: 36, background: anyCompleted ? "#787776" : "#c6c5c9", border: "none", cursor: anyCompleted ? "pointer" : "not-allowed", fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: anyCompleted ? "#ffffff" : "#e2e1e5", letterSpacing: "-0.51px" }}>
              Save Progress
            </button>
            <button disabled={!anyCompleted} onClick={() => router.push("/drd/simulation-setting")} style={{ height: 40, paddingLeft: 24, paddingRight: 24, borderRadius: 36, background: anyCompleted ? "#F06600" : "#c6c5c9", border: "none", cursor: anyCompleted ? "pointer" : "not-allowed", fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: anyCompleted ? "#ffffff" : "#e2e1e5", letterSpacing: "-0.51px" }}>
              Apply to Analysis
            </button>
          </div>
        </div>

      </div>

      {/* 데모 토글 */}
      <div style={{ display: "none" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {dynamicSettingItems.map((item: any) => (
            <button key={item.id} onClick={() => setCompleted(item.id as DefaultSettingId, !completedItems[item.id as DefaultSettingId])}
              style={{ fontSize: 9, padding: "3px 8px", background: completedItems[item.id as DefaultSettingId] ? "#F06600" : "rgba(255,255,255,0.8)", color: completedItems[item.id as DefaultSettingId] ? "#fff" : "#333", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}>
              {item.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Save Simulation 모달 */}
      {showSaveModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: 380, borderRadius: 20, padding: "24px 20px 20px", display: "flex", flexDirection: "column", gap: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            {/* 글래스 배경 */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "rgba(255,255,255,0.88)" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
            </div>

            {/* 콘텐츠 */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 18, color: "#484646", letterSpacing: "-0.54px", lineHeight: 1.2, margin: 0 }}>Save Simulation</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#484646", letterSpacing: "-0.39px", lineHeight: 1.2, margin: 0 }}>Simulation Name *</p>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Write a title"
                    style={{ height: 40, borderRadius: 12, border: "none", background: "#e2e1e5", padding: "0 14px", fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#484646", letterSpacing: "-0.39px", outline: "none", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#484646", letterSpacing: "-0.39px", lineHeight: 1.2, margin: 0 }}>Description</p>
                  <input
                    type="text"
                    value={simDesc}
                    onChange={(e) => setSimDesc(e.target.value.slice(0, 30))}
                    placeholder="Enter a Description (max 30 characters)"
                    style={{ height: 40, borderRadius: 12, border: "none", background: "#e2e1e5", padding: "0 14px", fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#484646", letterSpacing: "-0.39px", outline: "none", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8, justifyContent: "center" }}>
              <button type="button" onClick={() => setShowSaveModal(false)} style={{ width: 112, height: 44, borderRadius: 36, border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: 15, color: "#262255", letterSpacing: "-0.45px", background: "rgba(255,255,255,0.92)", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
                Close
              </button>
              <button type="button" onClick={handleSaveSimulation} disabled={!simName.trim()} style={{ width: 112, height: 44, borderRadius: 36, border: "none", cursor: simName.trim() ? "pointer" : "not-allowed", fontFamily: "Inter", fontWeight: 600, fontSize: 15, color: simName.trim() ? "#262255" : "#aaa", letterSpacing: "-0.45px", background: "rgba(255,255,255,0.92)", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
