"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSimulationStore, type SimulationState, type SimCondData } from "@/store/simulationStore";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */

/* 오렌지 원형 배경 + 차트 아이콘 (Simulation Conditions — completed, 우측 카드용) */
function SimCondIconCompleted() {
  return (
    <Image
      src="/icons/simulation-setting/state=completed, step=simulation, Select=Default, Size=24px.svg"
      alt="Simulation Conditions"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/* 회색 원형 배경 + 차트 아이콘 (Simulation Conditions — not started, 우측 카드용) */
function SimCondIconDefault() {
  return (
    <Image
      src="/icons/simulation-setting/state=not started, step=simulation, Select=Default, Size=24px.svg"
      alt="Simulation Conditions"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/* 회색 원형 배경 + 플라스크 아이콘 (SMILES Settings — not started, 우측 카드용) */
function SmilesIconNotStarted() {
  return (
    <Image
      src="/icons/simulation-setting/state=not started, step=smiles, Select=Default, Size=24px.svg"
      alt="SMILES Settings"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/* 주황색 원형 배경 + 체크 아이콘 (SMILES Settings — completed, 우측 카드용) */
function SmilesIconCompleted() {
  return (
    <Image
      src="/icons/simulation-setting/state=completed, step=smiles, Select=Default, Size=24px.svg"
      alt="SMILES Settings"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/* 왼쪽 패널 아이콘 */
function SimCondIconLeft({ completed }: { completed: boolean }) {
  return (
    <Image
      src={completed
        ? "/icons/simulation-setting/state=completed, step=simulation, Select=Default, Size=24px.svg"
        : "/icons/simulation-setting/state=not started, step=simulation, Select=Default, Size=24px.svg"}
      alt="Simulation Conditions"
      width={24}
      height={24}
      style={{ flexShrink: 0 }}
    />
  );
}

function SmilesIconLeft({ completed }: { completed: boolean }) {
  return (
    <Image
      src={completed
        ? "/icons/simulation-setting/state=completed, step=smiles, Select=Default, Size=24px.svg"
        : "/icons/simulation-setting/state=not started, step=smiles, Select=Default, Size=24px.svg"}
      alt="SMILES Settings"
      width={24}
      height={24}
      style={{ flexShrink: 0 }}
    />
  );
}


/* ─────────────────────────────────────────────
   RIGHT PANEL — INITIAL CARD (미완료)
───────────────────────────────────────────── */
function InitialCard({ step, title, required, description, flex, onClick }: {
  step: string; title: string; required?: boolean; description: string; flex?: number; onClick?: () => void;
}) {
  return (
    <div style={{
      flex: flex ?? 1,
      backgroundColor: "rgba(255,255,255,0.6)",
      borderRadius: 24,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 24,
      minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40 }}>
        <div style={{ display: "flex", alignItems: "center", height: 40, flexShrink: 0 }}>
          {step === "Step 1" ? <SimCondIconDefault /> : <SmilesIconNotStarted />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "rgb(72,70,70)", letterSpacing: "-0.51px", lineHeight: "1.2" }}>
            {title}
          </span>
          {required && (
            <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "rgb(64,19,238)" }}>*</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <p style={{
          fontFamily: "Inter", fontSize: 13, fontWeight: 500,
          color: "rgb(145,144,146)", letterSpacing: "-0.39px", lineHeight: "1.4", margin: 0,
        }}>
          {description}
        </p>
        <button
          onClick={onClick}
          style={{
            width: "100%", height: 36, borderRadius: 36, border: "none", cursor: "pointer",
            backgroundColor: "#8F8AC4",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: 20,
          }}>
          <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.51px", lineHeight: 1 }}>
            Setting
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.33594 8.33594H14.3359" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.33594 2.33594V14.3359" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Reset + Edit button row
───────────────────────────────────────────── */
function ResetEditButtons({ onReset, onEdit }: { onReset?: () => void; onEdit?: () => void }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          position: "relative", height: 36, paddingLeft: 20, paddingRight: 10, borderRadius: 36,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 36, backgroundColor: "#8f8ac4" }} />
        <span style={{ position: "relative", fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.45px", lineHeight: 1.05, whiteSpace: "nowrap" }}>Reset</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/basics/Contents=Reset, Size=16.svg" alt="" width={18} height={18} style={{ position: "relative", flexShrink: 0, filter: "brightness(0) invert(1)" }} />
      </button>
      {/* Edit */}
      <button
        onClick={onEdit}
        style={{
          position: "relative", height: 36, paddingLeft: 20, paddingRight: 14, borderRadius: 36,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 36, backgroundColor: "#8f8ac4" }} />
        <span style={{ position: "relative", fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.45px", lineHeight: 1.05, whiteSpace: "nowrap" }}>Edit</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/basics/Contents=Add, Size=16.svg" alt="" width={18} height={18} style={{ position: "relative", flexShrink: 0, filter: "brightness(0) invert(1)" }} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Table row (label + value)
───────────────────────────────────────────── */
function TableRow({ label, value, isFirst }: { label: string; value: string; isFirst?: boolean }) {
  return (
    <div style={{ ...(isFirst ? {} : { borderTop: "1px solid #c6c5c9" }), display: "flex", gap: 12, alignItems: "flex-start", paddingTop: 10, paddingBottom: 10 }}>
      <div style={{ width: 120, flexShrink: 0 }}>
        <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#787776", letterSpacing: "-0.39px", lineHeight: "1.18" }}>{label}</span>
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#484646", letterSpacing: "-0.39px", lineHeight: "1.18" }}>{value}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Strategy card (colored border + numbered list)
───────────────────────────────────────────── */
function StrategyCard({ label, color, drugs }: { label: string; color: string; drugs: string[] }) {
  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{
        background: "white", borderRadius: "16px 16px 0 0",
        borderBottom: `1.5px solid ${color}`,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color, letterSpacing: "-0.51px", lineHeight: 1.05 }}>{label}</span>
      </div>
      {/* Body */}
      <div style={{
        background: "white", borderRadius: "0 0 16px 16px",
        padding: "12px 16px 16px 16px", display: "flex", flexDirection: "column", gap: 6,
      }}>
        {drugs.map((drug, i) => (
          <div key={i} style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#484646", letterSpacing: "-0.39px", lineHeight: "1.18" }}>
            {drug}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIGHT PANEL — COMPLETED CARD (Simulation Conditions)
───────────────────────────────────────────── */
const VALUE_LABELS = ["BMI", "SBP", "HbA1c", "Fasting glucose"];
const TREND_LABELS = ["Increase", "Stable", "Decrease"];
const STRATEGY_COLORS = ["#3a11d8", "#f06600", "#24c6c9"];
const STRATEGY_LABELS = ["Strategy A", "Strategy B", "Strategy C"];

function SimCondCompletedCard({ flex, onClick, onReset, data }: { flex?: number; onClick?: () => void; onReset?: () => void; data: SimCondData }) {
  const valueName = data.selectedValue !== null ? (VALUE_LABELS[data.selectedValue] ?? "") : "";

  // "Increase (6m) / Stable (6m) / Decrease (3m)" 형태
  const trendSummary = TREND_LABELS.map((label, i) => `${label} (${data.monthValues[i]}m)`).join(" / ");

  // 전략별 약물 목록: checks[strategyIdx]가 true인 약물만
  const strategyDrugs = [0, 1, 2].map((si) =>
    data.drugList.filter((d) => d.checks[si]).map((d) => d.name)
  );

  return (
    <div style={{
      flex: flex ?? 1,
      backgroundColor: "rgba(255,255,255,0.6)",
      borderRadius: 24,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 24,
      minWidth: 0,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", height: 40, alignItems: "center", paddingTop: 4, paddingBottom: 4, flexShrink: 0 }}>
          <SimCondIconCompleted />
        </div>
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#484646", letterSpacing: "-0.72px", lineHeight: "1.2", display: "flex", alignItems: "center", height: 40 }}>Simulation Conditions</span>
      </div>

      {/* Content + buttons (flex-1, justify-between) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Top: summary table + strategy cards — 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          {/* Summary table */}
          <div style={{ background: "white", borderRadius: 16, padding: "4px 16px", flexShrink: 0 }}>
            {/* Selected Value — 2행 구조 */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingTop: 10, paddingBottom: 10 }}>
              <div style={{ width: 120, flexShrink: 0 }}>
                <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#787776", letterSpacing: "-0.39px", lineHeight: "1.18" }}>Selected Value</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#484646", letterSpacing: "-0.39px", lineHeight: "1.18" }}>{valueName}</span>
                <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "#919092", letterSpacing: "-0.39px", lineHeight: "1.18" }}>{trendSummary}</span>
              </div>
            </div>
            <TableRow label="Follow-up Window" value={`${data.followUpMonths} months`} />
          </div>

          {/* Strategy cards */}
          {STRATEGY_LABELS.map((label, si) => (
            <StrategyCard
              key={si}
              label={label}
              color={STRATEGY_COLORS[si]}
              drugs={strategyDrugs[si]}
            />
          ))}
        </div>

        {/* Bottom: Reset + Edit — 하단 고정 */}
        <div style={{ flexShrink: 0, paddingTop: 12 }}>
          <ResetEditButtons onReset={onReset} onEdit={onClick} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIGHT PANEL — COMPLETED CARD (SMILES Settings)
───────────────────────────────────────────── */
function SmilesCompletedCard({ flex, onClick, onReset, drugs }: { flex?: number; onClick?: () => void; onReset?: () => void; drugs: { name: string }[] }) {
  return (
    <div style={{
      flex: flex ?? 1,
      backgroundColor: "rgba(255,255,255,0.6)",
      borderRadius: 24,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 24,
      minWidth: 0,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", height: 40, alignItems: "center", paddingTop: 4, paddingBottom: 4, flexShrink: 0 }}>
          <SmilesIconCompleted />
        </div>
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#484646", letterSpacing: "-0.72px", lineHeight: "1.2", display: "flex", alignItems: "center", height: 40 }}>SMILES Settings</span>
      </div>

      {/* Content + buttons (flex-1) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Top: drug list — 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
          {/* Drug list */}
          <div style={{ background: "white", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            {drugs.map((drug, i) => (
              <div key={i} style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#484646", letterSpacing: "-0.39px", lineHeight: "1.18" }}>
                <span>{i + 1} {drug.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Reset + Edit — 하단 고정 */}
        <div style={{ flexShrink: 0, paddingTop: 12 }}>
          <ResetEditButtons onReset={onReset} onEdit={onClick} />
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function SimulationSettingPage() {
  const router = useRouter();
  const simCondCompleted = useSimulationStore((s: SimulationState) => s.simCondCompleted);
  const simSmilesCompleted = useSimulationStore((s: SimulationState) => s.simSmilesCompleted);
  const simCondData = useSimulationStore((s: SimulationState) => s.simCondData);
  const setSimCondCompleted = useSimulationStore((s: SimulationState) => s.setSimCondCompleted);
  const setSimSmilesCompleted = useSimulationStore((s: SimulationState) => s.setSimSmilesCompleted);
  const setSimCondData = useSimulationStore((s: SimulationState) => s.setSimCondData);
  const smilesData = useSimulationStore((s: SimulationState) => s.smilesData);

  return (
    <AppLayout headerType="drd" drdStep={2} scaleMode="none">
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px" }}>

        {/* ── TOP: Title ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0, padding: "0 12px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 onClick={() => router.push("/drd/simulation-setting")} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
              Simulation Settings
            </h1>
            <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
              Configure simulation parameters
            </span>
          </div>
        </div>

        {/* ── MAIN: Left + Right panels ───────────────────── */}
        <div style={{ display: "flex", flexDirection: "row", flex: 1, gap: "0px", minHeight: 0, alignItems: "stretch" }}>

          {/* ── LEFT PANEL (520px) ─────────── */}
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
            <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-y-auto">

              {/* Step 2: SMILES Settings */}
              <button
                onClick={() => router.push("/drd/smile-setting")}
                className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                style={{ background: "transparent", height: 96, justifyContent: "center" }}
              >
                <div className="flex items-center gap-[18px]">
                  <div className="shrink-0 flex items-center justify-center">
                    <SmilesIconLeft completed={simSmilesCompleted} />
                  </div>
                  <span className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]" style={{ color: "#484646" }}>
                    SMILES Settings
                  </span>
                </div>
                <div className="pl-[42px] mt-0">
                  <p className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0" style={{ color: "#919092" }}>
                    Add SMILES strings to define the chemical structures for simulation conditions.
                  </p>
                </div>
              </button>

              {/* Step 1: Simulation Conditions */}
              <button
                onClick={() => router.push("/drd/simulation-condition")}
                className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                style={{ background: "transparent", height: 96, justifyContent: "center" }}
              >
                <div className="flex items-center gap-[18px]">
                  <div className="shrink-0 flex items-center justify-center">
                    <SimCondIconLeft completed={simCondCompleted} />
                  </div>
                  <span className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]" style={{ color: "#484646" }}>
                    Simulation Conditions
                  </span>
                </div>
                <div className="pl-[42px] mt-0">
                  <p className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0" style={{ color: "#919092" }}>
                    Develop a plan to assess the subject&apos;s prognosis based on the entered information.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL ────────── */}
             <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", marginLeft: "-6px" }}>

            {/* Cards row */}
            <div style={{ flex: 1, display: "flex", flexDirection: "row", gap: 12, minHeight: 0, paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}>
              {simSmilesCompleted ? (
                <SmilesCompletedCard
                  flex={1}
                  onClick={() => router.push("/drd/smile-setting")}
                  onReset={() => setSimSmilesCompleted(false)}
                  drugs={smilesData}
                />
              ) : (
                <InitialCard
                  step="Step 2"
                  title="SMILES Settings"
                  description="Add SMILES to define the chemical structures for simulation conditions."
                  flex={1}
                  onClick={() => router.push("/drd/smile-setting")}
                />
              )}
              {simCondCompleted && simCondData ? (
                <SimCondCompletedCard
                  flex={2.775}
                  onClick={() => router.push("/drd/simulation-condition")}
                  onReset={() => { setSimCondCompleted(false); setSimCondData(null); }}
                  data={simCondData}
                />
              ) : (
                <InitialCard
                  step="Step 1"
                  title="Simulation Conditions"
                  required
                  description="Develop a plan to assess the subject's prognosis based on the entered information."
                  flex={2.775}
                  onClick={() => router.push("/drd/simulation-condition")}
                />
              )}
            </div>

            {/* Bottom buttons */}
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
              <button
                disabled={!simCondCompleted}
                style={{
                  height: 40, paddingLeft: 28, paddingRight: 28, borderRadius: 36,
                  background: simCondCompleted ? "#787776" : "#c6c5c9",
                  border: "none",
                  cursor: simCondCompleted ? "pointer" : "not-allowed",
                  fontFamily: "Inter", fontSize: 15,fontWeight: 600, color: simCondCompleted ? "#ffffff" : "#e2e1e5", letterSpacing: "-0.51px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                Save Progress
              </button>
              <button
                disabled={!simCondCompleted}
                onClick={() => simCondCompleted && router.push("/drd/simulation-result")}
                style={{
                  height: 40, paddingLeft: 24, paddingRight: 24, borderRadius: 36,
                  background: simCondCompleted ? "#F06600" : "#c6c5c9",
                  border: "none",
                  cursor: simCondCompleted ? "pointer" : "not-allowed",
                  fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: simCondCompleted ? "#ffffff" : "#e2e1e5", letterSpacing: "-0.51px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                Apply to Analysis
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}