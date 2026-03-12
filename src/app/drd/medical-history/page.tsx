/**
 * Medical History Page — Default Settings Step 1: Medical History
 *
 * 역할:
 *   임상 병력 및 위험 요인 기반으로 환자 그룹을 정의하는 설정 페이지입니다.
 *   두 컬럼으로 구성됩니다:
 *   - Baseline Status (좌): 진단명(Diagnosis), 동반질환(Comorbidity) 체크박스
 *   - Control Variables (우): 위험인자(Risk Factors) 체크박스
 *
 * 레이아웃:
 *   ┌─────────────────────┬──────────────────────────────────────────────────┐
 *   │ 왼쪽: Navy Glass     │ 오른쪽: Baseline Status | Control Variables       │
 *   │ - Filtered % 카드   │ (CategoryGroup 아코디언 + CheckboxItem 트리 구조)  │
 *   │ - 4-Step 사이드바   │                                                  │
 *   └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * 주요 상태:
 *   - checked: 각 체크박스 키의 선택 여부 (Record<string, boolean>)
 *   - 부모 체크박스 토글 시 하위 자식 항목들도 일괄 체크/해제됩니다
 *
 * 유효성 검증:
 *   - Baseline Status와 Control Variables 양쪽 모두 하나 이상 선택되어야 Confirm 활성화됩니다
 *
 * 저장:
 *   Confirm 클릭 시 checked 상태를 medicalHistoryData로 저장하고
 *   medical-history 완료 상태를 true로 설정한 뒤 /drd/default-setting으로 이동합니다.
 */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import { DrdLeftPanel } from "@/components/drd/DrdLeftPanel";
import { makeDefaultSettingSteps } from "@/components/drd/drd-step-data";
import { GlassTestButton } from "@/components/ui/glass-button";

// ── 아이콘 SVG 컴포넌트 ──────────────────────────────────────────────────

function IconReset({ size = 24, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2V4C10.0845 4.00022 8.23272 4.6877 6.78115 5.93749C5.32958 7.18727 4.37462 8.9164 4.08983 10.8106C3.80504 12.7048 4.20934 14.6382 5.22923 16.2596C6.24912 17.881 7.81691 19.0826 9.64763 19.646C11.4783 20.2095 13.4505 20.0974 15.2055 19.3301C16.9606 18.5628 18.3821 17.1913 19.2117 15.4648C20.0413 13.7382 20.2239 11.7714 19.7262 9.9217C19.2286 8.07199 18.0839 6.46223 16.5 5.385V8H14.5V2H20.5V4H18C19.2425 4.93093 20.251 6.13866 20.9453 7.52734C21.6397 8.91601 22.0008 10.4474 22 12Z" fill={color} stroke={color} strokeWidth="0.5"/>
    </svg>
  );
}

function IconChevronDown({ size = 14, color = "var(--neutral-30)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


// ── 체크박스 아이템 컴포넌트 ─────────────────────────────────────────────

/**
 * 체크박스 + 레이블 조합 컴포넌트.
 * indent=true이면 24px 왼쪽 들여쓰기가 적용되어 하위 항목처럼 표시됩니다.
 * disabled=true이면 클릭 비활성화 + 회색 텍스트로 표시됩니다.
 */
function CheckboxItem({
  label,
  checked = false,
  onToggle,
  indent = false,
  disabled = false,
}: {
  label: string;
  checked?: boolean;
  onToggle?: () => void;
  indent?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex gap-[8px] items-center ${indent ? "pl-[24px]" : ""} ${disabled ? "" : "cursor-pointer"}`}
      onClick={disabled ? undefined : onToggle}
    >
      <CustomCheckbox
        checked={checked}
        onChange={() => {}}
        size={16}
        disabled={disabled}
      />
      <span
        className="text-body4m"
        style={{ color: disabled ? "var(--neutral-70)" : "var(--text-primary)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ── 진단/카테고리 그룹 컴포넌트 ──────────────────────────────────────────

/**
 * 아코디언 형태의 카테고리 그룹 컴포넌트.
 * defaultOpen=true이면 처음에 펼쳐진 상태로 시작합니다.
 * 헤더 버튼 클릭 시 내용 표시/숨김 토글됩니다.
 */
function CategoryGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-[8px] overflow-hidden shrink-0 flex flex-col">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-[12px] px-[12px] py-[8px] h-[46px] shrink-0 border-none bg-transparent cursor-pointer text-left w-full"
      >
        <div
          className="shrink-0 flex items-center justify-center transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <IconChevronDown size={14} />
        </div>
        <span className="text-body4 text-neutral-30">
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-solid border-neutral-80 flex flex-col py-[12px] pl-[48px] pr-[12px] gap-[12px]">
          {children}
        </div>
      )}
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────

/**
 * 체크박스 초기 상태 — 모든 항목이 false(미선택)입니다.
 * Reset 버튼 클릭 시 이 상태로 초기화됩니다.
 */
const initialChecked: Record<string, boolean> = {
  "ckd": false,
  "ckd-1": false, "ckd-2": false, "ckd-3": false, "ckd-4": false, "ckd-5": false,
  "cardiac": false, "vascular": false, "metabolism": false, "renal": false,
  "nervous": false, "eye": false, "hepato": false,
  "cvd": false, "ascvd": false, "hf": false, "stroke": false,
  "lowbs": false, "lowbs-1": false, "lowbs-2": false,
  "dm": false, "dm-1": false, "dm-2": false, "dm-3": false,
};

export default function MedicalHistoryPage() {
  const router = useRouter();
  // defaultSettingStore: 코호트 수, 완료 상태, 병력 데이터 관리
  const { setCompleted, cohortCount, finalCohortCount, medicalHistoryData, setMedicalHistoryData } = useDefaultSettingStore();
  // filteredRatio: Filtered Patients 카드 프로그레스바 비율
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;
  // checked: 저장된 medicalHistoryData가 있으면 복원, 없으면 전부 미선택 상태로 시작
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.keys(medicalHistoryData).length > 0 ? medicalHistoryData : initialChecked
  );
  // parentToChildren: 부모 체크박스 키 → 하위 자식 키 목록 (부모 토글 시 자식 일괄 연동)
  const parentToChildren: Record<string, string[]> = {
    "ckd": ["ckd-1", "ckd-2", "ckd-3", "ckd-4", "ckd-5"],
    "cvd": ["ascvd", "hf", "stroke"],
    "lowbs": ["lowbs-1", "lowbs-2"],
    "dm": ["dm-1", "dm-2", "dm-3"],
  };

  /**
   * 체크박스 토글 함수.
   * 부모 키(ckd, cvd, lowbs, dm)를 토글하면 소속 자식들도 동일하게 체크/해제됩니다.
   */
  const toggle = (key: string) => setChecked(prev => {
    const next = { ...prev, [key]: !prev[key] };
    // 중분류 선택 시 소분류 모두 체크/해제
    if (key in parentToChildren) {
      const newVal = next[key];
      parentToChildren[key].forEach(child => { next[child] = newVal; });
    }
    return next;
  });
  // isDirty: 하나라도 체크된 항목이 있으면 true — Reset 버튼 활성화 기준
  const isDirty = Object.values(checked).some(Boolean);
  /** Reset 버튼 클릭 시 모든 체크박스를 초기화하고 완료 상태도 해제합니다 */
  const handleReset = () => {
    setChecked(initialChecked);
    setCompleted("medical-history", false);
  };

  // Baseline Status 영역의 체크박스 키 목록
  const baselineKeys = ["ckd", "ckd-1", "ckd-2", "ckd-3", "ckd-4", "ckd-5", "cardiac", "vascular", "metabolism", "renal", "nervous", "eye", "hepato"];
  // Control Variables 영역의 체크박스 키 목록
  const controlKeys = ["cvd", "ascvd", "hf", "stroke", "lowbs", "lowbs-1", "lowbs-2", "dm", "dm-1", "dm-2", "dm-3"];

  // isConfirmEnabled: Baseline + Control 양쪽 모두 최소 1개 이상 선택되어야 Confirm 버튼 활성화
  const isBaselineSelected = baselineKeys.some((k) => checked[k]);
  const isControlSelected = controlKeys.some((k) => checked[k]);
  const isConfirmEnabled = isBaselineSelected && isControlSelected;

  return (
    <AppLayout headerType="drd" drdStep={1}>
      <div className="flex flex-col h-full gap-6">
        {/* {타이틀 영역/Title Area} */}
        {/* ── TOP: Title ───────────────────────────── */}
        <div className="flex flex-row items-start justify-between shrink-0 px-1">
          <div className="flex flex-col">
            <h1 onClick={() => router.push("/drd/default-setting")} className="text-page-title">
              Default Settings
            </h1>
            <span className="text-page-subtitle">
              Setup Required
            </span>
          </div>
        </div>

        {/* {컨텐츠 행/Content Row} */}
        {/* ── ② 컨텐츠 행 ──────────────────────────────────────────────── */}
      <div className="drd-content-row gap-1">

          {/* ── 왼쪽 패널 (DrdLeftPanel 컴포넌트) ────────────────── */}
          <DrdLeftPanel
            steps={makeDefaultSettingSteps("medical-history")}
            filteredPatientsProps={{
              filteredRatio,
              initialCohort: cohortCount,
              finalCohort: finalCohortCount,
              onAddDataClick: () => router.push("/drd/datasetting"),
            }}
          />

          {/* {오른쪽 패널/Right Panel} */}
          {/* ── 오른쪽 패널 (Light Glass - 9-slice) ────────────────── */}
          {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
             <div className="figma-nine-slice figma-home-panel-right flex flex-col rounded-[36px] overflow-hidden flex-[78] min-w-0 min-h-0 self-stretch gap-3">


            {/* 상단: 제목 + 버튼들 */}
            <div className="shrink-0  flex items-center justify-between gap-[24px] pl-[8px] pr-0 h-[40px] pt-0 pb-0">
              <h2 className="text-body1 text-[var(--text-header)] m-0">
                Medical History
              </h2>
              <div className="flex items-center gap-[12px]">
                {/* Test 버튼 */}
                <GlassTestButton onClick={() => setChecked(prev => ({
                  ...prev,
                  "ckd": true, "ckd-1": true, "ckd-2": true, "ckd-3": true, "ckd-4": true, "ckd-5": true,
                  "cvd": true, "ascvd": true, "hf": true, "stroke": true,
                }))} />
                {/* Reset 버튼 */}
                <button
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="btn-tsi btn-tsi-secondary gap-2"
                  style={{ paddingRight: 16 }}
                >
                  Reset
                  <IconReset size={24} color="white" />
                </button>
              </div>
            </div>

            {/* {메인 컨텐츠 영역/Main Content Area} */}
            {/* 메인 컨텐츠 영역 */}
            <div className="flex flex-col flex-1 min-h-0 gap-[10px] items-stretch">

              {/* {Baseline Status 섹션/Baseline Status Section} */}
              {/* ── Baseline Status 섹션 ── */}
              <div className=" flex flex-row gap-2 h-full">
                <div className="flex flex-col h-full rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[16px] overflow-hidden gap-[20px] flex-1">
                {/* 제목 */}
                <div className="text-body3 shrink-0">
                  <span className="text-text-primary">Baseline Status</span>
                  <span className="text-[var(--text-active)]">*</span>
                </div>

                <div className="flex flex-col gap-[12px]  overflow-auto ">
                  {/* Diagnosis 그룹 */}
                  <CategoryGroup title="Diagnosis">
                    <CheckboxItem label="CKD Stage" checked={checked["ckd"]} onToggle={() => toggle("ckd")} />
                    <div className="flex flex-col gap-[12px] pl-[24px]">
                      <CheckboxItem label="Stage 1 (eGFR >=90)" checked={checked["ckd-1"]} onToggle={() => toggle("ckd-1")} />
                      <CheckboxItem label="Stage 2 (eGFR >=60)" checked={checked["ckd-2"]} onToggle={() => toggle("ckd-2")} />
                      <CheckboxItem label="Stage 3 (eGFR >=30)" checked={checked["ckd-3"]} onToggle={() => toggle("ckd-3")} />
                      <CheckboxItem label="Stage 4 (eGFR >=15)" checked={checked["ckd-4"]} onToggle={() => toggle("ckd-4")} />
                      <CheckboxItem label="Stage 5 (eGFR <=90)" checked={checked["ckd-5"]} onToggle={() => toggle("ckd-5")} />
                    </div>
                  </CategoryGroup>

                  <CategoryGroup title="Comorbidity (동반질환)">
                    <CheckboxItem label="Cardiac disorders" checked={checked["cardiac"]} onToggle={() => toggle("cardiac")} />
                    <CheckboxItem label="Vascular disorders" checked={checked["vascular"]} onToggle={() => toggle("vascular")} />
                    <CheckboxItem label="Metabolism & nutrition" checked={checked["metabolism"]} onToggle={() => toggle("metabolism")} />
                    <CheckboxItem label="Renal & urinary" checked={checked["renal"]} onToggle={() => toggle("renal")} />
                    <CheckboxItem label="Nervous system" checked={checked["nervous"]} onToggle={() => toggle("nervous")} />
                    <CheckboxItem label="Eye disorders" checked={checked["eye"]} onToggle={() => toggle("eye")} />
                    <CheckboxItem label="Hepatobiliary disorders" checked={checked["hepato"]} onToggle={() => toggle("hepato")} />
                  </CategoryGroup>
                </div>
              </div> 

              {/* {Control Variables 섹션/Control Variables Section} */}
              {/* ── Control Variables 섹션 ── */}
              <div className="flex-1 rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[16px] overflow-hidden min-h-0">
              <div className="flex flex-col gap-[20px] overflow-auto scrollbar-hide h-full">
                {/* 제목 */}
                <div className="text-body3 shrink-0">
                  <span className="text-neutral-30">Control Variables</span>
                  <span className="text-tertiary-40">*</span>
                </div>

                <div className="flex flex-col gap-[12px]  overflow-auto ">
                  {/* Risk Factors 그룹 */}
                  <CategoryGroup title="Risk Factors">
                    <CheckboxItem label="CVD History" checked={checked["cvd"]} onToggle={() => toggle("cvd")} />
                    <div className="flex flex-col gap-[12px] pl-[24px]">
                      <CheckboxItem label="ASCVD" checked={checked["ascvd"]} onToggle={() => toggle("ascvd")} />
                      <CheckboxItem label="HF" checked={checked["hf"]} onToggle={() => toggle("hf")} />
                      <CheckboxItem label="Stroke" checked={checked["stroke"]} onToggle={() => toggle("stroke")} />
                    </div>
                    <CheckboxItem label="Low Blood Sugar Severity" checked={checked["lowbs"]} onToggle={() => toggle("lowbs")} />
                    <div className="flex flex-col gap-[12px] pl-[24px]">
                      <CheckboxItem label="Step 1 ( < 70mg/dL)" checked={checked["lowbs-1"]} onToggle={() => toggle("lowbs-1")} />
                      <CheckboxItem label="Step 2 ( < 54mg/dL)" checked={checked["lowbs-2"]} onToggle={() => toggle("lowbs-2")} />
                    </div>
                    <CheckboxItem label="DM Duration" checked={checked["dm"]} onToggle={() => toggle("dm")} />
                    <div className="flex flex-col gap-[12px] pl-[24px]">
                      <CheckboxItem label="Early ( < 1 years)" checked={checked["dm-1"]} onToggle={() => toggle("dm-1")} />
                      <CheckboxItem label="Short ( < 10 years )" checked={checked["dm-2"]} onToggle={() => toggle("dm-2")} />
                      <CheckboxItem label="Long ( >= 10 years )" checked={checked["dm-3"]} onToggle={() => toggle("dm-3")} />
                    </div>
                  </CategoryGroup>
                </div>
              </div>
              </div>
              </div>


            {/* {하단 버튼/Bottom Buttons} */}
            {/* 하단 버튼 */}
             <div className="shrink-0 flex justify-end gap-[12px] pr-0.5">
              <button
                onClick={() => router.push("/drd/default-setting")}
                className="btn-tsi btn-tsi-secondary"
              >
                Cancel
              </button>
              <button
                disabled={!isConfirmEnabled}
                onClick={() => {
                  setMedicalHistoryData(checked);
                  setCompleted("medical-history", true);
                  router.push("/drd/default-setting");
                }}
                className="btn-tsi btn-tsi-primary"
              >
                Confirm
              </button>
            </div>
          </div>

        </div>
      </div></div>
    </AppLayout>
  );
}