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

function IconVirusActive({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <circle cx="12.0312" cy="12" r="12" fill="#F06600" />
      <g clipPath="url(#clip0_iconvirusactive)">
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
        <clipPath id="clip0_iconvirusactive">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconFunnelGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconfunnelgray_pdi)">
        <path d="M4.29556 6.53508C4.21017 6.4411 4.15387 6.32437 4.1335 6.19904C4.11313 6.0737 4.12955 5.94515 4.18079 5.82897C4.23202 5.71279 4.31586 5.61396 4.42214 5.54447C4.52842 5.47499 4.65257 5.43783 4.77955 5.4375H19.217C19.3442 5.43751 19.4685 5.47444 19.5751 5.5438C19.6816 5.61317 19.7657 5.71197 19.8171 5.82822C19.8685 5.94447 19.8851 6.07315 19.8648 6.19863C19.8445 6.32412 19.7882 6.441 19.7027 6.53508L13.967 12.6562V17.4674C13.9671 17.5755 13.9405 17.6819 13.8896 17.7772C13.8386 17.8725 13.7649 17.9537 13.675 18.0137L11.05 19.7634C10.9513 19.8293 10.8365 19.8672 10.718 19.873C10.5994 19.8788 10.4815 19.8524 10.3768 19.7965C10.2721 19.7406 10.1845 19.6573 10.1233 19.5556C10.0622 19.4539 10.0298 19.3374 10.0295 19.2187V12.6562L4.29556 6.53508Z" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconfunnelgray_pdi">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconAsteriskGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconasteriskgray_pdi)">
        <path d="M12 4.78125V19.2188" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.4375 8.0625L18.5625 15.9375" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.4375 15.9375L18.5625 8.0625" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconasteriskgray_pdi">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconClockGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconclockgray_pdi)">
        <path d="M12 8.0625V12L15.2812 13.9688" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.40625 10.0312H4.125V6.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.04531 17.2503C8.07724 18.2241 9.37323 18.8721 10.7714 19.1135C12.1695 19.3549 13.6078 19.1789 14.9065 18.6076C16.2051 18.0363 17.3067 17.0949 18.0734 15.9011C18.8402 14.7073 19.2381 13.314 19.2175 11.8954C19.197 10.4767 18.7588 9.09554 17.9578 7.92448C17.1568 6.75342 16.0284 5.84437 14.7137 5.31092C13.399 4.77747 11.9562 4.64327 10.5657 4.9251C9.17512 5.20692 7.89846 5.89227 6.8952 6.89551C5.92969 7.87332 5.13234 8.79536 4.125 10.0316" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_iconclockgray_pdi">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}


function IconChevronDown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke="#484646" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 데이터 설정 ───────────────────────────────────────────────────────────

const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusActive,
    isActive: true,
    title: "Patient/Disease Info",
    description: "Define patient groups by fixing simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs",
    titleColor: "#ffffff",
    descriptionColor: "#c9c5c8",
    bgColor: "#262255",
  },
  {
    id: "filter",
    IconComponent: IconFunnelGray,
    isActive: false,
    title: "Filter",
    description: "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
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


// ─── 글래스 Test 버튼 ───────────────────────────────────────────────────────

function GlassTestButton({ disabled, onClick }: { disabled?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const bg = disabled ? "#F5F5F7" : pressed ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)" : hovered ? "#EBEBEB" : "#F7F7F7";
  const textColor = disabled ? "#C6C5C9" : pressed ? "#3a11d8" : "#262255";
  return (
    <div
      onClick={() => !disabled && onClick?.()}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
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
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "#333333", mixBlendMode: "color-dodge" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: bg, transition: "background 0.12s" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: pressed ? "2px solid rgba(58,17,216,0.19)" : "2px solid rgba(255,255,255,0.3)", boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)", transition: "border-color 0.12s" }} />
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

// 메인 컴포넌트
export default function PatientDiseaseInfoPage() {
  const router = useRouter();
  const { setCompleted, cohortCount, finalCohortCount, setPatientDiseaseInfoData } = useDefaultSettingStore();
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;
  const [controlMode, setControlMode] = useState<"value" | "trend">("value");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    demographic: true,
    measurement: true,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Baseline radio state — default first item
  const [baselineDemo, setBaselineDemo] = useState<string>("Age");
  const [baselineMeasure, setBaselineMeasure] = useState<string>("BMI");

  // Control trend list radio state
  const [trendSelection, setTrendSelection] = useState<string>("Increase");

  // 초기값 (Reset 활성화 비교용)
  const INITIAL_CONTROL_MODE = "value" as const;
  const INITIAL_BASELINE_DEMO = "Age";
  const INITIAL_BASELINE_MEASURE = "BMI";
  const INITIAL_TREND_SELECTION = "Increase";

  const isDirty =
    controlMode !== INITIAL_CONTROL_MODE ||
    baselineDemo !== INITIAL_BASELINE_DEMO ||
    baselineMeasure !== INITIAL_BASELINE_MEASURE ||
    trendSelection !== INITIAL_TREND_SELECTION;

  const handleReset = () => {
    setControlMode(INITIAL_CONTROL_MODE);
    setBaselineDemo(INITIAL_BASELINE_DEMO);
    setBaselineMeasure(INITIAL_BASELINE_MEASURE);
    setTrendSelection(INITIAL_TREND_SELECTION);
    setCompleted("patient-disease-info", false);
  };
  const [resetHover, setResetHover] = useState(false);
  const [resetActive, setResetActive] = useState(false);
  
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
        {/* ── ② 컨텐츠 행 (왼쪽 패널 + 오른쪽 패널) ───────────────────────── */}
        <div className="flex flex-1 min-h-0 items-stretch" style={{ gap: "0px" }}>
          
          {/* {왼쪽 패널/Left Panel} */}
          {/* ── 왼쪽 패널: Navy Liquid Glass ────────────────── */}
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

            {/* {설정 단계/Setup Steps} */}
            {/* Setup Steps 하단 영역 (Light Gray/Blue Glass Overlay) */}
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
         {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
           <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", marginLeft: "-6px"}}>

              {/* 상단 섹션: 제목 + Reset */}
              <div className="flex justify-between items-center shrink-0 pl-[8px] pr-0 h-[40px]" style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}>
                <h2 className="font-['Inter'] font-semibold text-[24px] leading-[1.2] text-[#262255] tracking-[-0.72px] m-0">
                  Patient / Disease Info
                </h2>
                <div className="flex items-center" style={{ gap: 12 }}>
                  <GlassTestButton onClick={() => {
                    setBaselineDemo("Sex");
                    setBaselineMeasure("HbA1c");
                    setControlMode("value");
                    setTrendSelection("Increase");
                  }} />
                  <button
                    onClick={isDirty ? handleReset : undefined}
                    onMouseEnter={() => isDirty && setResetHover(true)}
                    onMouseLeave={() => { setResetHover(false); setResetActive(false); }}
                    onMouseDown={() => isDirty && setResetActive(true)}
                    onMouseUp={() => setResetActive(false)}
                    className="flex items-center justify-center gap-[8px] h-[40px] pl-[20px] pr-[16px] rounded-[36px] border-none bg-transparent relative overflow-hidden"
                    style={{ cursor: isDirty ? "pointer" : "default" }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: !isDirty
                          ? "#c7c5c9"
                          : resetActive
                          ? "#313030"
                          : resetHover
                          ? "#5f5e5e"
                          : "#787776",
                      }}
                    />
                    <span className="relative z-10 font-['Inter'] font-semibold text-[17px] tracking-[-0.51px]" style={{ color: isDirty ? "#ffffff" : "#e3e1e5", paddingTop: 2 }}>
                      Reset
                    </span>
                    <div className="relative z-10 shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2V4C10.0845 4.00022 8.23272 4.6877 6.78115 5.93749C5.32958 7.18727 4.37462 8.9164 4.08983 10.8106C3.80504 12.7048 4.20934 14.6382 5.22923 16.2596C6.24912 17.881 7.81691 19.0826 9.64763 19.646C11.4783 20.2095 13.4505 20.0974 15.2055 19.3301C16.9606 18.5628 18.3821 17.1913 19.2117 15.4648C20.0413 13.7382 20.2239 11.7714 19.7262 9.9217C19.2286 8.07199 18.0839 6.46223 16.5 5.385V8H14.5V2H20.5V4H18C19.2425 4.93093 20.251 6.13866 20.9453 7.52734C21.6397 8.91601 22.0008 10.4474 22 12Z" fill={isDirty ? "#ffffff" : "#e3e1e5"} stroke={isDirty ? "#ffffff" : "#e3e1e5"} strokeWidth="0.5"/>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* {설정 패널 영역/Setting Panel Area} */}
              {/* 설정 패널 영역 (Baseline + Control) */}
              <div className="flex flex-1 min-h-0 gap-[12px]">

                {/* {Baseline Variables 섹션/Baseline Variables Section} */}
                {/* Baseline Variables 섹션 */}
                <div className="flex-1 flex flex-col gap-[20px] p-[16px] rounded-[24px] bg-[rgba(255,255,255,0.6)] overflow-auto scrollbar-hide">
                  <div className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]">
                    <span className="text-[#484646]">Baseline Variables </span><span className="text-[#3a11d8]">*</span>
                  </div>
                  
                  <div className="flex flex-col gap-[12px]">
                    {/* Demographic information 그룹 */}
                    <div className="bg-white rounded-[12px] overflow-hidden shrink-0 flex flex-col pb-[8px]">
                      <button
                        onClick={() => toggleSection("demographic")}
                        className="flex items-center gap-[12px] px-[12px] py-[8px] h-[46px] shrink-0 border-none bg-transparent cursor-pointer text-left w-full"
                      >
                        <div
                          className="shrink-0 transition-transform duration-200"
                          style={{ transform: openSections.demographic ? "rotate(0deg)" : "rotate(-90deg)" }}
                        >
                          <IconChevronDown size={14} />
                        </div>
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#484646] tracking-[-0.75px]">
                          Demographic information
                        </span>
                      </button>
                      {openSections.demographic && (
                        <div className="border-t-[1.5px] border-solid border-[#c7c5c9] flex flex-col py-[12px] pl-[48px] gap-[12px]">
                          <RadioButton checked={baselineDemo === "Age"} onChange={() => setBaselineDemo("Age")} label="Age" />
                          <RadioButton checked={baselineDemo === "Sex"} onChange={() => setBaselineDemo("Sex")} label="Sex" />
                        </div>
                      )}
                    </div>

                    {/* Measurement 그룹 */}
                    <div className="bg-white rounded-[12px] overflow-hidden shrink-0 flex flex-col pb-[8px]">
                      <button
                        onClick={() => toggleSection("measurement")}
                        className="flex items-center gap-[12px] px-[12px] py-[8px] h-[46px] shrink-0 border-none bg-transparent cursor-pointer text-left w-full"
                      >
                        <div
                          className="shrink-0 transition-transform duration-200"
                          style={{ transform: openSections.measurement ? "rotate(0deg)" : "rotate(-90deg)" }}
                        >
                          <IconChevronDown size={14} />
                        </div>
                        <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#484646] tracking-[-0.75px]">
                          Measurement
                        </span>
                      </button>
                      {openSections.measurement && (
                        <div className="border-t-[1.5px] border-solid border-[#c7c5c9] flex flex-col py-[12px] pl-[48px] gap-[12px]">
                          {["BMI", "SBP", "HbA1c", "Glucose", "eGFR", "UACR"].map((m) => (
                            <RadioButton key={m} checked={baselineMeasure === m} onChange={() => setBaselineMeasure(m)} label={m} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* {Control Variables 섹션/Control Variables Section} */}
                {/* Control Variables 섹션 */}
                <div className="flex-1 flex flex-col gap-[20px] p-[16px] rounded-[33px] bg-[rgba(255,255,255,0.6)] overflow-auto scrollbar-hide">
                  <div className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]">
                    <span className="text-[#484646]">Control Variables </span><span className="text-[#3a11d8]">*</span>
                  </div>
                  
                  <div className="bg-white rounded-[18px] p-[16px] flex flex-col gap-[12px]">
                    <div className="flex gap-[12px] h-[18px] items-start">
                      <RadioButton checked={controlMode === "value"} label="Value" onChange={() => setControlMode("value")} />
                      <RadioButton checked={controlMode === "trend"} label="Trend" onChange={() => setControlMode("trend")} />
                    </div>

                    {/* 트렌드 선택 상자 */}
                    <div className="bg-[#f9f8fc] rounded-[8px] px-[12px] py-[10px] flex flex-col gap-[24px]">
                      <span className="font-['Inter'] font-semibold text-[15px] leading-[1.15] text-[#484646] tracking-[-0.75px]">
                        Select patients based on value
                      </span>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-[8px] pl-[24px] py-[4px]">
                          <span className="w-[160px] font-['Inter'] font-medium text-[15px] text-[#484646] tracking-[-0.45px]">HbA1c</span>
                          <span className="font-['Inter'] font-medium text-[15px] text-[#484646] tracking-[-0.45px]">Value</span>
                        </div>

                        {[
                          { label: "Increase", value: ">= 1.0%/year" },
                          { label: "Stable", value: "1.0%/year" },
                          { label: "Decrease", value: "<= -1.0%/year" },
                        ].map((item) => (
                          <div key={item.label} className="border-solid flex items-center gap-[8px] py-[8px] cursor-pointer" style={{ borderTop: "1.5px solid #c7c5c9" }} onClick={() => setTrendSelection(item.label)}>
                            <div onClick={e => e.stopPropagation()}><RadioButton checked={trendSelection === item.label} onChange={() => setTrendSelection(item.label)} /></div>
                            <span className="w-[160px] font-['Inter'] font-medium text-[15px] text-[#484646] tracking-[-0.45px]">
                              {item.label}
                            </span>
                            <span className="font-['Inter'] font-medium text-[15px] text-[#929090] tracking-[-0.45px]">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                onClick={() => { setPatientDiseaseInfoData({ baselineDemo, baselineMeasure, controlMode, trendSelection }); setCompleted("patient-disease-info", true); router.push("/drd/default-setting"); }}
                className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] bg-[#f06600] border-none cursor-pointer"
              >
                <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white text-center tracking-[-0.51px]">Confirm</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}