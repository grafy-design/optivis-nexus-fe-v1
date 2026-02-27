"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import RadioButton from "@/components/ui/radio-button";

const stepRoutes: Record<string, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  "filter": "/drd/filter",
  "high-risk": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

// ── 아이콘 SVG 컴포넌트 ──────────────────────────────────────────────────

function IconVirusGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconvirusgray_hrsg)">
        <path d="M12 19.2188C15.9868 19.2188 19.2188 15.9868 19.2188 12C19.2188 8.01319 15.9868 4.78125 12 4.78125C8.01319 4.78125 4.78125 8.01319 4.78125 12C4.78125 15.9868 8.01319 19.2188 12 19.2188Z" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.3594 12C11.2655 12 12 11.2655 12 10.3594C12 9.45328 11.2655 8.71875 10.3594 8.71875C9.45328 8.71875 8.71875 9.45328 8.71875 10.3594C8.71875 11.2655 9.45328 12 10.3594 12Z" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.9375 13.3125C16.6624 13.3125 17.25 12.7249 17.25 12C17.25 11.2751 16.6624 10.6875 15.9375 10.6875C15.2126 10.6875 14.625 11.2751 14.625 12C14.625 12.7249 15.2126 13.3125 15.9375 13.3125Z" fill="white" />
        <path d="M12 17.25C12.7249 17.25 13.3125 16.6624 13.3125 15.9375C13.3125 15.2126 12.7249 14.625 12 14.625C11.2751 14.625 10.6875 15.2126 10.6875 15.9375C10.6875 16.6624 11.2751 17.25 12 17.25Z" fill="white" />
        <path d="M12 2.8125V4.78125" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.1875 12H19.2188" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.8125 12H4.78125" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19.2188V21.1875" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.4375 5.4375L6.8952 6.8952" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.1094 6.8952L18.5671 5.4375" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5671 18.5671L17.1094 17.1094" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.4375 18.5671L6.8952 17.1094" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconvirusgray_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconFunnelGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconfunnelgray_hrsg)">
        <path d="M4.29556 6.53508C4.21017 6.4411 4.15387 6.32437 4.1335 6.19904C4.11313 6.0737 4.12955 5.94515 4.18079 5.82897C4.23202 5.71279 4.31586 5.61396 4.42214 5.54447C4.52842 5.47499 4.65257 5.43783 4.77955 5.4375H19.217C19.3442 5.43751 19.4685 5.47444 19.5751 5.5438C19.6816 5.61317 19.7657 5.71197 19.8171 5.82822C19.8685 5.94447 19.8851 6.07315 19.8648 6.19863C19.8445 6.32412 19.7882 6.441 19.7027 6.53508L13.967 12.6562V17.4674C13.9671 17.5755 13.9405 17.6819 13.8896 17.7772C13.8386 17.8725 13.7649 17.9537 13.675 18.0137L11.05 19.7634C10.9513 19.8293 10.8365 19.8672 10.718 19.873C10.5994 19.8788 10.4815 19.8524 10.3768 19.7965C10.2721 19.7406 10.1845 19.6573 10.1233 19.5556C10.0622 19.4539 10.0298 19.3374 10.0295 19.2187V12.6562L4.29556 6.53508Z" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconfunnelgray_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconAsteriskActive({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.0312" cy="12" r="12" fill="#F06600" />
      <g clipPath="url(#clip0_iconasteriskactive_hrsg)">
        <path d="M12 4.78125V19.2188" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.4375 8.0625L18.5625 15.9375" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.4375 15.9375L18.5625 8.0625" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconasteriskactive_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconClockGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconclockgray_hrsg)">
        <path d="M12 8.0625V12L15.2812 13.9688" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.40625 10.0312H4.125V6.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.04531 17.2503C8.07724 18.2241 9.37323 18.8721 10.7714 19.1135C12.1695 19.3549 13.6078 19.1789 14.9065 18.6076C16.2051 18.0363 17.3067 17.0949 18.0734 15.9011C18.8402 14.7073 19.2381 13.314 19.2175 11.8954C19.197 10.4767 18.7588 9.09554 17.9578 7.92448C17.1568 6.75342 16.0284 5.84437 14.7137 5.31092C13.399 4.77747 11.9562 4.64327 10.5657 4.9251C9.17512 5.20692 7.89846 5.89227 6.8952 6.89551C5.92969 7.87332 5.13234 8.79536 4.125 10.0316" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconclockgray_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function AccordionItem({ open = false }: { open?: boolean }) {
  const size = 20;
  if (open) {
    // 열린 아코디언: chevron up (∧)
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M5 12.5L10 7.5L15 12.5" stroke="#313030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // 닫힌 아코디언: chevron down (∨)
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="#313030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 데이터 설정 ──────────────────────────────────────────────────────────

const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusGray,
    isActive: false,
    title: "Patient/Disease Info",
    description:
      "Define patient groups by fixing simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "filter",
    IconComponent: IconFunnelGray,
    isActive: false,
    title: "Filter",
    description:
      "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "high-risk",
    IconComponent: IconAsteriskActive,
    isActive: true,
    title: "High-Risk Subgroup",
    description:
      "Select high-risk subgroups based on disease progression slopes. Prognostic scoring and loading of prior subgroup definitions are supported.",
    titleColor: "#ffffff",
    descriptionColor: "#c9c5c8",
    bgColor: "#262255",
  },
  {
    id: "medical-history",
    IconComponent: IconClockGray,
    isActive: false,
    title: "Medical History",
    description:
      "Define patient groups based on clinical history and risk profiles. Patient groups can be selected using diagnoses, comorbidities, risk factors, and key medical history.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
];



// ──────────────────────────────────────────────────────────────────────────

export default function HighRiskSubgroupPage() {
  const router = useRouter();
  const { setCompleted, cohortCount, finalCohortCount, setHighRiskSubgroupData } = useDefaultSettingStore();
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;

  // 서브행 ID → 표시 데이터 매핑
  const subRowDataMap: Record<string, { parentName: string; subRowName: string; feature: string; condition: string; month: string; slope: string; status: string }> = {
    "ckd1-slow":  { parentName: "CKD 1 Stage", subRowName: "Slow",  feature: "eGFR", condition: "> 90",      month: "36", slope: "2", status: "n=1,200" },
    "ckd1-rapid": { parentName: "CKD 1 Stage", subRowName: "Rapid", feature: "eGFR", condition: "≤ 90",      month: "36", slope: "2", status: "n=360"   },
    "ckd2-slow":  { parentName: "CKD 2 Stage", subRowName: "Slow",  feature: "eGFR", condition: "> 60",      month: "36", slope: "3", status: "n=1,200" },
    "ckd2-rapid": { parentName: "CKD 2 Stage", subRowName: "Rapid", feature: "eGFR", condition: "≤ 60",      month: "36", slope: "3", status: "n=360"   },
    "set1-slow":  { parentName: "Set 1",        subRowName: "Slow",  feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
    "set1-rapid": { parentName: "Set 1",        subRowName: "Rapid", feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
    "set4-slow":  { parentName: "Set 4",        subRowName: "Slow",  feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
    "set4-rapid": { parentName: "Set 4",        subRowName: "Rapid", feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
  };
  const [selectedSubRow, setSelectedSubRow] = useState<string>("ckd1-slow");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["ckd1"]));
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);

  // 선택된 서브행이 속한 부모 id를 반환
  const getSelectedParent = (sel: string) => {
    if (sel.startsWith("ckd1-")) return "ckd1";
    if (sel.startsWith("ckd2-")) return "ckd2";
    if (sel.startsWith("set1-")) return "set1";
    if (sel.startsWith("set4-")) return "set4";
    return null;
  };

  const toggleRow = (id: string) => setExpandedRows((prev) => {
    const selectedParent = getSelectedParent(selectedSubRow);
    if (prev.has(id)) {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }
    // 닫혀있는 경우: 열기
    // 선택된 부모가 현재 열려있을 때만 유지, 닫혀있으면 그대로 유지
    const next = new Set<string>();
    if (selectedParent && prev.has(selectedParent)) next.add(selectedParent);
    next.add(id);
    return next;
  });

  // 라디오 버튼 선택: 이전 부모 아코디언 유지, 새 부모 열기
  const selectSubRow = (rowId: string) => {
    const nextParent = getSelectedParent(rowId);
    setSelectedSubRow(rowId);
    if (nextParent) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.add(nextParent);
        return next;
      });
    }
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

        {/* {컨텐츠 행/Content Row} */}
        {/* ── ② 컨텐츠 행 ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, gap: "0px",  minHeight: 0, alignItems: "stretch", overflow: "hidden" }}>

          {/* {왼쪽 패널/Left Panel} */}
          {/* ── 왼쪽 패널 (Navy Glass - 9-slice) ────────────────── */}
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
                    <span className="font-['Inter'] font-semibold text-[15px] leading-[1.18] text-white tracking-[-0.36px]">
                      filtered patients
                    </span>
                    <span className="font-['Inter'] font-semibold text-[36px] leading-none text-white tracking-[-1.08px]">
                      {filteredRatio}%
                    </span>
                  </div>
                  <button onClick={() => router.push("/drd/datasetting")} className="flex items-center gap-[4px] h-[30px] px-[14px] py-[8px] rounded-[36px] border-none cursor-pointer relative bg-transparent overflow-hidden">
                    <div className="absolute inset-0 bg-[#f06600] mix-blend-plus-lighter" />
                    <span className="relative z-10 font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px] mix-blend-screen">
                      Add data
                    </span>
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
                  <div className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-white tracking-[-0.75px]">
                    OPMD
                  </div>
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

            {/* {설정 단계/Setup Steps} */}
            {/* Setup Steps */}
            <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-y-auto">
              {setupSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => router.push(stepRoutes[step.id])}
                  className={[
                    "flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150",
                    step.bgColor === "#262255" ? "hover:bg-[#2e2a66] active:bg-[#1e1a44]" : "hover:bg-[#f9f8fc] active:bg-[#efeff4]",
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
         {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
            <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", paddingBottom:"0px", marginLeft: "-6px" }}>


            {/* 상단: 제목 + Go to Create Subgroup 버튼 */}
            <div className="shrink-0 flex items-center justify-between pl-[4px] pr-[4px] h-[40px]" style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}>
              <h2 className="font-['Inter'] font-semibold text-[24px] leading-[1.2] text-[#484646] tracking-[-0.72px] m-0">
                Load Subgroup
              </h2>
              <button onClick={() => setShowSubgroupModal(true)} className="flex items-center justify-center gap-[8px] h-[42px] px-[24px] rounded-[100px] border-none cursor-pointer relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 bg-[#f06600] rounded-[36px]" />
                <span className="relative z-10 font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white tracking-[-0.51px] whitespace-nowrap">
                  Go to Create Subgroup
                </span>
              </button>
            </div>

            {/* {테이블 영역/Table Area} */}
            {/* 테이블 영역 */}
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
              <div className="bg-white rounded-[24px] flex flex-col overflow-hidden h-full">

                {/* {테이블 헤더/Table Header} */}
                {/* 테이블 헤더 */}
                <div className="flex items-center shrink-0 border-b border-[#e2e1e5]" style={{ padding: "12px 0" }}>
                  <div className="w-[7.63%] shrink-0" />
                  <div className="flex items-center px-[10px] w-[17.94%] h-full border-l border-[#e2e1e5] shrink-0">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Set Name</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[20.04%] h-full border-l border-[#e2e1e5] shrink-0">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Feature</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[14.31%] h-full border-l border-[#e2e1e5] shrink-0">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Condition</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[11.45%] h-full border-l border-[#e2e1e5] shrink-0">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Month</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[11.45%] h-full border-l border-[#e2e1e5] shrink-0">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Slope</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[17.18%] h-full border-l border-[#e2e1e5] shrink-0">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Status</span>
                  </div>
                  <div className="flex items-center px-[10px] flex-1 h-full border-l border-[#e2e1e5]">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-[1.1] text-[#919092] tracking-[-0.36px]">Date</span>
                  </div>
                </div>

                {/* {테이블 바디/Table Body} */}
                {/* 테이블 바디 */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">

                  {/* CKD 1 Stage */}
                  {(() => { const ckd1HasSel = ["ckd1-slow","ckd1-rapid"].includes(selectedSubRow ?? ""); const ckd1Open = expandedRows.has("ckd1"); return (
                  <div className={`flex flex-col shrink-0 ${ckd1HasSel || ckd1Open ? "border-solid" : "border-b border-[#919092] border-solid"}`} style={{ background: ckd1HasSel ? "rgba(243,238,255,0.6)" : ckd1Open ? "#fbfbfc" : "white", ...(ckd1HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : ckd1Open ? { borderTop: "1px solid #919092", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer${ckd1HasSel ? " [&_span]:text-[#313030]" : ""}`} onClick={() => toggleRow("ckd1")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("ckd1")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">
                          CKD 1 Stage
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">
                          eGFR
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">
                          ≤ 90
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">
                          36
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">
                          2
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">
                          OK (n min=150)
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] flex-1 border-l border-[#e2e1e5]">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">
                          2025/12/25 17:00:01
                        </span>
                      </div>
                    </div>

                    {expandedRows.has("ckd1") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "ckd1-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: `1.5px solid ${ckd1HasSel ? "#3a11d8" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd1-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd1-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">{`> 90`}</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">2</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">n=1,200</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "ckd1-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd1-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd1-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">≤ 90</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">2</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">n=360</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                  {/* CKD 2 Stage */}
                  {(() => { const ckd2HasSel = ["ckd2-slow","ckd2-rapid"].includes(selectedSubRow ?? ""); const ckd2Open = expandedRows.has("ckd2"); return (
                  <div className={`flex flex-col shrink-0 ${ckd2HasSel || ckd2Open ? "border-solid" : "border-b border-[#919092] border-solid"}`} style={{ background: ckd2HasSel ? "rgba(243,238,255,0.6)" : ckd2Open ? "#fbfbfc" : "white", ...(ckd2HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : ckd2Open ? { borderTop: "1px solid #919092", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer${ckd2HasSel ? " [&_span]:text-[#313030]" : ""}`} onClick={() => toggleRow("ckd2")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("ckd2")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">CKD 2 Stage</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">eGFR</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">≤ 60 ≤ 90</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">36</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">3</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-[#e2e1e5] shrink-0">
                        <p className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] m-0">
                          <span className="text-[#f06600]">NG</span>{` (n min=150)`}
                        </p>
                      </div>
                      <div className="flex items-center px-[10px] flex-1 border-l border-[#e2e1e5]">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">2025/12/25 17:00:01</span>
                      </div>
                    </div>
                    {expandedRows.has("ckd2") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "ckd2-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: `1.5px solid ${ckd2HasSel ? "#3a11d8" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd2-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd2-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">{`> 60`}</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">3</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">n=1,200</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "ckd2-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd2-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd2-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">≤ 60</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">3</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">n=360</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                  {/* Set 1 */}
                  {(() => { const set1HasSel = ["set1-slow","set1-rapid"].includes(selectedSubRow ?? ""); const set1Open = expandedRows.has("set1"); return (
                  <div className={`flex flex-col shrink-0 ${set1HasSel || set1Open ? "border-solid" : "border-b border-[#919092] border-solid"}`} style={{ background: set1HasSel ? "rgba(243,238,255,0.6)" : set1Open ? "#fbfbfc" : "white", ...(set1HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : set1Open ? { borderTop: "1px solid #919092", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer${set1HasSel ? " [&_span]:text-[#313030]" : ""}`} onClick={() => toggleRow("set1")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("set1")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">Set 1</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">HbA1c</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] flex-1 border-l border-[#e2e1e5]">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">2025/12/25 17:00:01</span>
                      </div>
                    </div>
                    {expandedRows.has("set1") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "set1-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: `1.5px solid ${set1HasSel ? "#3a11d8" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set1-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set1-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "set1-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set1-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set1-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                  {/* Set 4 */}
                  {(() => { const set4HasSel = ["set4-slow","set4-rapid"].includes(selectedSubRow ?? ""); const set4Open = expandedRows.has("set4"); return (
                  <div className={`flex flex-col shrink-0 ${set4HasSel || set4Open ? "border-solid" : "border-b border-[#919092] border-solid"}`} style={{ background: set4HasSel ? "rgba(243,238,255,0.6)" : set4Open ? "#fbfbfc" : "white", ...(set4HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : set4Open ? { borderTop: "1px solid #919092", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer${set4HasSel ? " [&_span]:text-[#313030]" : ""}`} onClick={() => toggleRow("set4")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("set4")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">Set 4</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-[#e2e1e5] shrink-0">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">HbA1c</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-[#e2e1e5] shrink-0" />
                      <div className="flex items-center px-[10px] flex-1 border-l border-[#e2e1e5]">
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">2025/12/25 17:00:01</span>
                      </div>
                    </div>
                    {expandedRows.has("set4") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "set4-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: `1.5px solid ${set4HasSel ? "#3a11d8" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set4-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set4-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "set4-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${isSel ? "[&>div]:border-[#e2e1e5] [&_span]:text-[#313030]" : "[&>div]:border-[#e2e1e5]"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set4-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set4-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px] flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#5f5e5e] tracking-[-0.75px]">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                </div>
              </div>
            </div>


             {/* {하단 버튼/Bottom Buttons} */}
             {/* 하단 버튼 */}
            <div className="shrink-0 flex justify-end gap-[12px] p-0 m-0">
              <button
                onClick={() => router.push("/drd/default-setting")}
                className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] bg-[#787776] border-none cursor-pointer"
              >
                <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white tracking-[-0.51px]">Cancel</span>
              </button>
              <button
                onClick={() => { const d = subRowDataMap[selectedSubRow]; if (d) setHighRiskSubgroupData({ selectedSubRow, ...d }); setCompleted("high-risk-subgroup", true); router.push("/drd/default-setting"); }}
                className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] bg-[#f06600] border-none cursor-pointer"
              >
                <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white text-center tracking-[-0.51px]">Confirm</span>
              </button>
            </div>

          </div>
        </div>
      </div>
      {showSubgroupModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSubgroupModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: 380, borderRadius: 20, padding: "20px 20px 20px", display: "flex", flexDirection: "column", gap: 36, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            {/* 글래스 배경 */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "rgba(255,255,255,0.88)" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
            </div>

            {/* 콘텐츠 */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
              <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 19, color: "#250d0dff", letterSpacing: "-0.54px", lineHeight: 1.2, margin: 0 }}>Go to Create Subgroup</p>
              <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 15, color: "#484646", letterSpacing: "-0.42px", lineHeight: 1.35, margin: 0 }}>
                If you create a new subgroup, you will leave this page and all unsaved data will be lost. Do you want to continue?
              </p>
            </div>

            {/* 버튼 */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8, justifyContent: "center" }}>
              <button type="button" onClick={() => setShowSubgroupModal(false)} style={{ width: 112, height: 44, borderRadius: 36, border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: 15, color: "#262255", letterSpacing: "-0.45px", background: "rgba(255,255,255,0.92)", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
                Cancel
              </button>
              <button type="button" onClick={() => { setShowSubgroupModal(false); router.push("/tsi"); }} style={{ width: 112, height: 44, borderRadius: 36, border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: 15, color: "#262255", letterSpacing: "-0.45px", background: "rgba(255,255,255,0.92)", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}