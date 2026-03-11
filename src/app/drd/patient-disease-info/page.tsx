/**
 * Patient / Disease Info Page — Default Settings Step 1: Patient/Disease Info
 *
 * 역할:
 *   시뮬레이션 조건을 고정하고 대조 변수를 선택하여 환자 그룹을 정의하는 설정 페이지입니다.
 *   두 컬럼으로 구성됩니다:
 *   - Baseline Variables (좌): Demographic information·Measurement 중 1개 라디오 선택
 *   - Control Variables (우): Value / Trend 모드 중 1개 선택 + 세부 트렌드(Increase·Stable·Decrease) 선택
 *
 * 레이아웃:
 *   ┌─────────────────────┬──────────────────────────────────────────────────┐
 *   │ 왼쪽: Navy Glass     │ 오른쪽: Baseline Variables | Control Variables    │
 *   │ - Filtered % 카드   │ (아코디언 섹션 + RadioButton 목록)                 │
 *   │ - 4-Step 사이드바   │                                                  │
 *   └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * 주요 상태:
 *   - baselineDemo: Demographic 섹션 선택값 (Age | Sex)
 *   - baselineMeasure: Measurement 섹션 선택값 (BMI | SBP | HbA1c | Glucose | eGFR | UACR)
 *   - controlMode: Control Variables 모드 (value | trend)
 *   - trendSelection: 트렌드 리스트 선택값 (Increase | Stable | Decrease)
 *   - openSections: 각 아코디언 섹션의 열림 여부
 *
 * 저장:
 *   Confirm 클릭 시 4개 값을 patientDiseaseInfoData로 저장하고
 *   patient-disease-info 완료 상태를 true로 설정한 뒤 /drd/default-setting으로 이동합니다.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import RadioButton from "@/components/ui/radio-button";
import { DrdLeftPanel } from "@/components/drd/DrdLeftPanel";
import { makeDefaultSettingSteps } from "@/components/drd/drd-step-data";
import { GlassTestButton } from "@/components/ui/glass-button";

function IconChevronDown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke="var(--neutral-30)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


export default function PatientDiseaseInfoPage() {
  const router = useRouter();
  // defaultSettingStore: 코호트 수, 완료 상태, PDI 설정 데이터 관리
  const { setCompleted, cohortCount, finalCohortCount, setPatientDiseaseInfoData } = useDefaultSettingStore();
  // filteredRatio: Filtered Patients 카드 프로그레스바 비율
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;
  // controlMode: Control Variables 탭 — "value"(값 기준) | "trend"(트렌드 기준)
  const [controlMode, setControlMode] = useState<"value" | "trend">("value");
  // openSections: 아코디언 섹션 열림 여부 (demographic, measurement)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    demographic: true,
    measurement: true,
  });
  /** 아코디언 섹션 토글 */
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Baseline Variables — Demographic 섹션 선택 (Age | Sex)
  const [baselineDemo, setBaselineDemo] = useState<string>("Age");
  // Baseline Variables — Measurement 섹션 선택 (BMI | SBP | HbA1c | Glucose | eGFR | UACR)
  const [baselineMeasure, setBaselineMeasure] = useState<string>("BMI");
  // Control Variables — 트렌드 목록 선택 (Increase | Stable | Decrease)
  const [trendSelection, setTrendSelection] = useState<string>("Increase");

  // 초기값 상수 — isDirty 계산 및 Reset 시 복원에 사용
  const INITIAL_CONTROL_MODE = "value" as const;
  const INITIAL_BASELINE_DEMO = "Age";
  const INITIAL_BASELINE_MEASURE = "BMI";
  const INITIAL_TREND_SELECTION = "Increase";

  // isDirty: 초기값 대비 변경된 값이 있으면 true — Reset 버튼 활성화 기준
  const isDirty =
    controlMode !== INITIAL_CONTROL_MODE ||
    baselineDemo !== INITIAL_BASELINE_DEMO ||
    baselineMeasure !== INITIAL_BASELINE_MEASURE ||
    trendSelection !== INITIAL_TREND_SELECTION;

  /** Reset 버튼 클릭 시 모든 선택을 초기값으로 복원하고 완료 상태를 해제합니다 */
  const handleReset = () => {
    setControlMode(INITIAL_CONTROL_MODE);
    setBaselineDemo(INITIAL_BASELINE_DEMO);
    setBaselineMeasure(INITIAL_BASELINE_MEASURE);
    setTrendSelection(INITIAL_TREND_SELECTION);
    setCompleted("patient-disease-info", false);
  };
  
  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <div className="flex flex-col h-full w-full overflow-hidden gap-6">
        {/* {타이틀 영역/Title Area} */}
        {/* ── TOP: Title ───────────────────────────── */}
        <div className="flex flex-row items-start justify-between shrink-0 px-1">
          <div className="flex flex-col">
            <h1 onClick={() => router.push("/drd/default-setting")} className="cursor-pointer text-page-title">
              Default Settings
            </h1>
            <span className="text-page-subtitle">
              Setup Required
            </span>
          </div>
        </div>

        {/* {컨텐츠 행/Content Row} */}
        {/* ── ② 컨텐츠 행 (왼쪽 패널 + 오른쪽 패널) ───────────────────────── */}
        <div className="flex flex-1 min-h-0 items-stretch gap-1">
          
          {/* {왼쪽 패널/Left Panel} */}
          <DrdLeftPanel
            steps={makeDefaultSettingSteps("patient-disease-info")}
            filteredPatientsProps={{
              filteredRatio,
              initialCohort: cohortCount,
              finalCohort: finalCohortCount,
              onAddDataClick: () => router.push("/drd/datasetting"),
            }}
          />

          {/* {오른쪽 패널/Right Panel} */}
         {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
           <div className="figma-nine-slice figma-home-panel-right flex flex-col rounded-[36px] overflow-hidden flex-[78] min-w-0 min-h-0 gap-3">

              {/* 상단 섹션: 제목 + Reset */}
              <div className="flex justify-between items-center shrink-0 pl-[8px] pr-0 h-[40px] pt-0 pb-0">
                <h2 className="text-body1 text-[var(--text-header)] m-0">
                  Patient / Disease Info
                </h2>
                <div className="flex items-center gap-3">
                  <GlassTestButton onClick={() => {
                    setBaselineDemo("Sex");
                    setBaselineMeasure("HbA1c");
                    setControlMode("value");
                    setTrendSelection("Increase");
                  }} />
                  <button
                    onClick={handleReset}
                    disabled={!isDirty}
                    className="btn-tsi btn-tsi-secondary gap-2"
                    style={{ paddingRight: 16 }}
                  >
                    Reset
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2V4C10.0845 4.00022 8.23272 4.6877 6.78115 5.93749C5.32958 7.18727 4.37462 8.9164 4.08983 10.8106C3.80504 12.7048 4.20934 14.6382 5.22923 16.2596C6.24912 17.881 7.81691 19.0826 9.64763 19.646C11.4783 20.2095 13.4505 20.0974 15.2055 19.3301C16.9606 18.5628 18.3821 17.1913 19.2117 15.4648C20.0413 13.7382 20.2239 11.7714 19.7262 9.9217C19.2286 8.07199 18.0839 6.46223 16.5 5.385V8H14.5V2H20.5V4H18C19.2425 4.93093 20.251 6.13866 20.9453 7.52734C21.6397 8.91601 22.0008 10.4474 22 12Z" fill="white" stroke="white" strokeWidth="0.5"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* {설정 패널 영역/Setting Panel Area} */}
              {/* 설정 패널 영역 (Baseline + Control) */}
              <div className="flex flex-1 min-h-0 gap-[12px]">

                {/* {Baseline Variables 섹션/Baseline Variables Section} */}
                {/* Baseline Variables 섹션 */}
                <div className="flex-1 rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[16px] overflow-hidden min-h-0">
                  <div className="flex flex-col gap-[20px] overflow-auto scrollbar-hide h-full">
                  <div className="text-body3">
                    <span className="text-neutral-30">Baseline Variables </span><span className="text-tertiary-40">*</span>
                  </div>

                  <div className="flex flex-col gap-[12px]">
                    {/* Demographic information 그룹 */}
                    <div className="bg-white rounded-[8px] overflow-hidden shrink-0 flex flex-col pb-[8px]">
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
                        <span className="text-body4 text-neutral-30">
                          Demographic information
                        </span>
                      </button>
                      {openSections.demographic && (
                        <div className="border-t-[1.5px] border-solid border-neutral-80 flex flex-col py-[12px] pl-[48px] gap-[12px]">
                          <RadioButton checked={baselineDemo === "Age"} onChange={() => setBaselineDemo("Age")} label="Age" />
                          <RadioButton checked={baselineDemo === "Sex"} onChange={() => setBaselineDemo("Sex")} label="Sex" />
                        </div>
                      )}
                    </div>

                    {/* Measurement 그룹 */}
                    <div className="bg-white rounded-[8px] overflow-hidden shrink-0 flex flex-col pb-[8px]">
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
                        <span className="text-body4 text-text-primary">
                          Measurement
                        </span>
                      </button>
                      {openSections.measurement && (
                        <div className="border-t-[1.5px] border-solid border-neutral-80 flex flex-col py-[12px] pl-[48px] gap-[12px]">
                          {["BMI", "SBP", "HbA1c", "Glucose", "eGFR", "UACR"].map((m) => (
                            <RadioButton key={m} checked={baselineMeasure === m} onChange={() => setBaselineMeasure(m)} label={m} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>

                {/* {Control Variables 섹션/Control Variables Section} */}
                {/* Control Variables 섹션 */}
                <div className="flex-1 rounded-[29px] bg-[rgba(255,255,255,0.6)] p-[16px] overflow-hidden min-h-0">
                  <div className="flex flex-col gap-[20px] overflow-auto scrollbar-hide h-full">
                  <div className="text-body3">
                    <span className="text-text-primary">Control Variables </span><span className="text-tertiary-40">*</span>
                  </div>
                  
                  <div className="bg-white rounded-[14px] p-[16px] flex flex-col gap-[12px]">
                    <div className="flex gap-[12px] h-[18px] items-start">
                      <RadioButton checked={controlMode === "value"} label="Value" onChange={() => setControlMode("value")} />
                      <RadioButton checked={controlMode === "trend"} label="Trend" onChange={() => setControlMode("trend")} />
                    </div>

                    {/* 트렌드 선택 상자 */}
                    <div className="bg-neutral-98 rounded-[4px] px-[12px] py-[10px] flex flex-col gap-[24px]">
                      <span className="text-body4 text-neutral-30">
                        Select patients based on value
                      </span>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-[8px] pl-[24px] py-[4px]">
                          <span className="w-[160px] text-body4m text-neutral-30">HbA1c</span>
                          <span className="text-body4m text-neutral-30">Value</span>
                        </div>

                        {[
                          { label: "Increase", value: ">= 1.0%/year" },
                          { label: "Stable", value: "1.0%/year" },
                          { label: "Decrease", value: "<= -1.0%/year" },
                        ].map((item) => (
                          <div key={item.label} className="border-solid flex items-center gap-[8px] py-[8px] cursor-pointer border-t-[1.5px] border-neutral-80" onClick={() => setTrendSelection(item.label)}>
                            <div onClick={e => e.stopPropagation()}><RadioButton checked={trendSelection === item.label} onChange={() => setTrendSelection(item.label)} /></div>
                            <span className="w-[160px] text-body4m text-neutral-30">
                              {item.label}
                            </span>
                            <span className="text-body4m text-neutral-60">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
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
                className="btn-tsi btn-tsi-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => { setPatientDiseaseInfoData({ baselineDemo, baselineMeasure, controlMode, trendSelection }); setCompleted("patient-disease-info", true); router.push("/drd/default-setting"); }}
                className="btn-tsi btn-tsi-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}