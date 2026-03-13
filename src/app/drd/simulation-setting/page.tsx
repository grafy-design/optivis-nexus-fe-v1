/**
 * Simulation Setting Page — 시뮬레이션 설정 허브 페이지 (Step 2)
 *
 * 역할:
 *   Simulation Conditions와 SMILES Settings 두 서브 설정의 진행 상태를 보여주는
 *   중간 허브 페이지입니다.
 *   - 두 설정이 미완료 상태일 때: InitialCard(회색 "Setting" 버튼) 표시
 *   - 설정 완료 후: 각각 SimCondCompletedCard / SmilesCompletedCard로 전환
 *
 * 레이아웃:
 *   왼쪽 패널 — SMILES Settings / Simulation Conditions 스텝 네비게이션 버튼
 *   오른쪽 패널 — 카드 행 (SMILES 카드 + Simulation Conditions 카드) + 하단 버튼
 *
 * 상태 (전역 SimulationStore에서 읽음):
 *   simCondCompleted  — Simulation Conditions 완료 여부
 *   simSmilesCompleted — SMILES Settings 완료 여부
 *   simCondData       — Simulation Conditions에서 저장한 데이터
 *   smilesData        — SMILES Settings에서 저장한 약물 목록
 *
 * 버튼:
 *   Save Progress — simCondCompleted일 때 활성화 (현재는 라우팅 없음)
 *   Apply to Analysis — simCondCompleted일 때 활성화 → /drd/simulation-result 이동
 */
"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { DrdLeftPanel } from "@/components/drd/DrdLeftPanel";
import type { DrdStepItem } from "@/components/drd/drd-step-data";
import { useSimulationStore, type SimulationState, type SimCondData } from "@/store/simulationStore";
import SolidButton from "@/components/ui/solid-button";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */

/** Simulation Conditions 완료 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SimCondIconCompleted() {
  return (
    <Image
      src="/icons/simulation-setting/step-simulation-completed.svg"
      alt="Simulation Conditions"
      width={30}
      height={30}
      className="shrink-0"
    />
  );
}

/** Simulation Conditions 미시작 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SimCondIconDefault() {
  return (
    <Image
      src="/icons/simulation-setting/step-simulation-default.svg"
      alt="Simulation Conditions"
      width={30}
      height={30}
      className="shrink-0"
    />
  );
}

/** SMILES Settings 미시작 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SmilesIconNotStarted() {
  return (
    <Image
      src="/icons/simulation-setting/step-smiles-default.svg"
      alt="SMILES Settings"
      width={30}
      height={30}
      className="shrink-0"
    />
  );
}

/** SMILES Settings 완료 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SmilesIconCompleted() {
  return (
    <Image
      src="/icons/simulation-setting/step-smiles-completed.svg"
      alt="SMILES Settings"
      width={30}
      height={30}
      className="shrink-0"
    />
  );
}

/** 왼쪽 패널 스텝 버튼용 Simulation Conditions 아이콘 (completed에 따라 이미지 전환, 24×24px) */
function SimCondIconLeft({ completed }: { completed: boolean }) {
  return (
    <Image
      src={completed
        ? "/icons/simulation-setting/step-simulation-completed.svg"
        : "/icons/simulation-setting/step-simulation-default.svg"}
      alt="Simulation Conditions"
      width={24}
      height={24}
      className="shrink-0"
    />
  );
}

/** 왼쪽 패널 스텝 버튼용 SMILES Settings 아이콘 (completed에 따라 이미지 전환, 24×24px) */
function SmilesIconLeft({ completed }: { completed: boolean }) {
  return (
    <Image
      src={completed
        ? "/icons/simulation-setting/step-smiles-completed.svg"
        : "/icons/simulation-setting/step-smiles-default.svg"}
      alt="SMILES Settings"
      width={24}
      height={24}
      className="shrink-0"
    />
  );
}


/* ─────────────────────────────────────────────
   RIGHT PANEL — INITIAL CARD (미완료)
───────────────────────────────────────────── */
/**
 * InitialCard — 설정이 아직 완료되지 않은 상태의 카드 컴포넌트
 * - 아이콘(step에 따라 SimCondIconDefault 또는 SmilesIconNotStarted), 제목, 설명, "Setting" 버튼으로 구성
 * - 버튼 클릭 시 해당 설정 페이지로 이동 (onClick 콜백)
 * - required가 true이면 제목 옆에 파란 별표(*) 표시
 */
function InitialCard({ step, title, required, description, flex, onClick }: {
  step: string; title: string; required?: boolean; description: string; flex?: number; onClick?: () => void;
}) {
  return (
    <div className="flex flex-col min-w-0 rounded-[20px] gap-3" style={{
      flex: flex ?? 1,
      backgroundColor: "rgba(255,255,255,0.6)",
      padding: 16,
    }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5" style={{ height: 40 }}>
        <div className="flex items-center shrink-0" style={{ height: 40 }}>
          {step === "Step 1" ? <SimCondIconDefault /> : <SmilesIconNotStarted />}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-body3" style={{ color: "var(--text-primary)" }}>
            {title}
          </span>
          {required && (
            <span className="text-body3" style={{ color: "rgb(64,19,238)" }}>*</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-between">
        <p className="text-captionm" style={{
          color: "rgb(145,144,146)", margin: 0,
        }}>
          {description}
        </p>
        <SolidButton
          onClick={onClick}
          variant="light-purple" size="m"
          className="w-full"
          style={{ marginTop: 20 }}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.33594 8.33594H14.3359" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.33594 2.33594V14.3359" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          iconPosition="right"
        >
          Setting
        </SolidButton>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Reset + Edit button row
───────────────────────────────────────────── */
/**
 * ResetEditButtons — 완료된 카드 하단의 Reset + Edit 버튼 행
 * - Reset: 해당 설정 완료 상태를 초기화 (전역 store setter 호출)
 * - Edit: 해당 설정 페이지로 이동 (router.push)
 */
function ResetEditButtons({ onReset, onEdit }: { onReset?: () => void; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-end shrink-0 gap-2.5">
      {/* Reset */}
      <SolidButton
        onClick={onReset}
        variant="light-purple" size="m"
        icon={<img src="/icons/basics/reset-16.svg" alt="" width={18} height={18} className="shrink-0" style={{ filter: "brightness(0) invert(1)" }} />}
        iconPosition="right"
      >
        Reset
      </SolidButton>
      {/* Edit */}
      <SolidButton
        onClick={onEdit}
        variant="light-purple" size="m"
        icon={<img src="/icons/basics/add-16.svg" alt="" width={18} height={18} className="shrink-0" style={{ filter: "brightness(0) invert(1)" }} />}
        iconPosition="right"
      >
        Edit
      </SolidButton>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Table row (label + value)
───────────────────────────────────────────── */
/**
 * TableRow — 완료된 카드 내부의 레이블-값 테이블 행
 * - isFirst가 false(기본)이면 상단 구분선 표시
 * - label: 회색 텍스트, value: 짙은 회색 텍스트
 */
function TableRow({ label, value, isFirst }: { label: string; value: string; isFirst?: boolean }) {
  return (
    <div className="flex items-start gap-3" style={{ ...(isFirst ? {} : { borderTop: "1px solid var(--neutral-80)" }), paddingTop: 10, paddingBottom: 10 }}>
      <div className="shrink-0" style={{ width: 120 }}>
        <span className="text-caption" style={{ color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <div className="flex-1">
        <span className="text-caption" style={{ color: "var(--text-primary)" }}>{value}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: Strategy card (colored border + numbered list)
───────────────────────────────────────────── */
/**
 * StrategyCard — 전략별 약물 목록 카드 (SimCondCompletedCard 내부에서 A/B/C 각각 렌더링)
 * - 헤더: 전략명(color 컬러) + 컬러 하단 구분선
 * - 본문: 약물 이름 번호 목록
 */
function StrategyCard({ label, color, drugs }: { label: string; color: string; drugs: string[] }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center rounded-t-[16px] gap-2.5" style={{
        background: "white",
        borderBottom: `1.5px solid ${color}`,
        padding: "12px 16px",
      }}>
        <span className="text-body3" style={{ color }}>{label}</span>
      </div>
      {/* Body */}
      <div className="flex flex-col rounded-b-[16px] gap-1.5" style={{
        background: "white",
        padding: "12px 16px 16px 16px",
      }}>
        {drugs.map((drug, i) => (
          <div key={i} className="text-caption" style={{ color: "var(--text-primary)" }}>
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
const VALUE_LABELS = ["BMI", "SBP", "HbA1c", "Fasting glucose"]; // selectedValue 인덱스 → 이름 매핑
const TREND_LABELS = ["Increase", "Stable", "Decrease"];           // HbA1c 증감 행 레이블
const STRATEGY_COLORS = ["var(--tertiary-40)", "var(--secondary-60)", "#24c6c9"];        // 전략 A/B/C 컬러
const STRATEGY_LABELS = ["Strategy A", "Strategy B", "Strategy C"]; // 전략 라벨

/**
 * SimCondCompletedCard — Simulation Conditions 설정 완료 시 표시되는 카드
 * - SimCondData를 받아 Selected Value, Trend 요약, Follow-up Window, 전략별 약물 목록 표시
 * - 하단: Reset(완료 상태 초기화) + Edit(simulation-condition 페이지로 이동) 버튼
 */
function SimCondCompletedCard({ flex, onClick, onReset, data }: { flex?: number; onClick?: () => void; onReset?: () => void; data: SimCondData }) {
  const valueName = data.selectedValue !== null ? (VALUE_LABELS[data.selectedValue] ?? "") : "";

  // "Increase (6m) / Stable (6m) / Decrease (3m)" 형태
  const trendSummary = TREND_LABELS.map((label, i) => `${label} (${data.monthValues[i]}m)`).join(" / ");

  // 전략별 약물 목록: checks[strategyIdx]가 true인 약물만
  const strategyDrugs = [0, 1, 2].map((si) =>
    data.drugList.filter((d) => d.checks[si]).map((d) => d.name)
  );

  return (
    <div className="flex flex-col min-w-0 overflow-hidden rounded-[20px] gap-3" style={{
      flex: flex ?? 1,
      backgroundColor: "rgba(255,255,255,0.6)",
      padding: 16,
    }}>
      {/* Header */}
      <div className="flex items-start shrink-0 gap-2.5">
        <div className="flex items-center shrink-0" style={{ height: 40, paddingTop: 4, paddingBottom: 4 }}>
          <SimCondIconCompleted />
        </div>
        <span className="flex items-center text-body3" style={{ color: "var(--text-primary)", height: 40 }}>Simulation Conditions</span>
      </div>

      {/* Content + buttons (flex-1, justify-between) */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top: summary table + strategy cards — 스크롤 영역 */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 gap-3">
          {/* Summary table */}
          <div className="shrink-0 rounded-[12px]" style={{ background: "white", padding: "4px 16px" }}>
            {/* Selected Value — 2행 구조 */}
            <div className="flex items-start gap-3" style={{ paddingTop: 10, paddingBottom: 10 }}>
              <div className="shrink-0" style={{ width: 120 }}>
                <span className="text-caption" style={{ color: "var(--text-secondary)" }}>Selected Value</span>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-caption" style={{ color: "var(--text-primary)" }}>{valueName}</span>
                <span className="text-captionm" style={{ color: "var(--text-secondary)" }}>{trendSummary}</span>
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
        <div className="shrink-0" style={{ paddingTop: 12 }}>
          <ResetEditButtons onReset={onReset} onEdit={onClick} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIGHT PANEL — COMPLETED CARD (SMILES Settings)
───────────────────────────────────────────── */
/**
 * SmilesCompletedCard — SMILES Settings 완료 시 표시되는 카드
 * - drugs 배열을 받아 약물 이름 번호 목록 표시
 * - 하단: Reset(완료 상태 초기화) + Edit(smile-setting 페이지로 이동) 버튼
 */
function SmilesCompletedCard({ flex, onClick, onReset, drugs }: { flex?: number; onClick?: () => void; onReset?: () => void; drugs: { name: string }[] }) {
  return (
    <div className="flex flex-col min-w-0 overflow-hidden rounded-[20px] gap-3" style={{
      flex: flex ?? 1,
      backgroundColor: "rgba(255,255,255,0.6)",
      padding: 16,
    }}>
      {/* Header */}
      <div className="flex items-start shrink-0 gap-2.5">
        <div className="flex items-center shrink-0" style={{ height: 40, paddingTop: 4, paddingBottom: 4 }}>
          <SmilesIconCompleted />
        </div>
        <span className="flex items-center text-body3" style={{ color: "var(--text-primary)", height: 40 }}>SMILES Settings</span>
      </div>

      {/* Content + buttons (flex-1) */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top: drug list — 스크롤 영역 */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 gap-2">
          {/* Drug list */}
          <div className="flex flex-col shrink-0 rounded-[12px] gap-2" style={{ background: "white", padding: "16px" }}>
            {drugs.map((drug, i) => (
              <div key={i} className="text-caption" style={{ color: "var(--text-primary)" }}>
                <span>{i + 1} {drug.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Reset + Edit — 하단 고정 */}
        <div className="shrink-0" style={{ paddingTop: 12 }}>
          <ResetEditButtons onReset={onReset} onEdit={onClick} />
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
/**
 * SimulationSettingPage — 시뮬레이션 설정 허브 페이지 메인 컴포넌트
 *
 * 전역 SimulationStore에서 완료 상태와 데이터를 읽어 카드 UI를 조건부 렌더링한다.
 * - simCondCompleted → true면 SimCondCompletedCard, false면 InitialCard("Step 1")
 * - simSmilesCompleted → true면 SmilesCompletedCard, false면 InitialCard("Step 2")
 */
export default function SimulationSettingPage() {
  const router = useRouter();
  const simCondCompleted = useSimulationStore((s: SimulationState) => s.simCondCompleted);   // Simulation Conditions 완료 여부
  const simSmilesCompleted = useSimulationStore((s: SimulationState) => s.simSmilesCompleted); // SMILES Settings 완료 여부
  const simCondData = useSimulationStore((s: SimulationState) => s.simCondData);               // Simulation Conditions 저장 데이터
  const setSimCondCompleted = useSimulationStore((s: SimulationState) => s.setSimCondCompleted); // 완료 상태 초기화 setter
  const setSimSmilesCompleted = useSimulationStore((s: SimulationState) => s.setSimSmilesCompleted); // SMILES 완료 상태 초기화 setter
  const setSimCondData = useSimulationStore((s: SimulationState) => s.setSimCondData);           // 조건 데이터 초기화 setter
  const smilesData = useSimulationStore((s: SimulationState) => s.smilesData);                   // SMILES 약물 목록

  /** 왼쪽 패널 2-Step 데이터 (Image 기반 아이콘, completed 상태에 따라 전환) */
  const simSettingSteps: DrdStepItem[] = useMemo(() => [
    {
      id: "smiles",
      icon: ({ size }: { size?: number }) => <SmilesIconLeft completed={simSmilesCompleted} />,
      title: "SMILES Settings",
      description: "Add SMILES strings to define the chemical structures for simulation conditions.",
      isActive: false,
      route: "/drd/smile-setting",
    },
    {
      id: "simulation-conditions",
      icon: ({ size }: { size?: number }) => <SimCondIconLeft completed={simCondCompleted} />,
      title: "Simulation Conditions",
      description: "Develop a plan to assess the subject's prognosis based on the entered information.",
      isActive: false,
      route: "/drd/simulation-condition",
    },
  ], [simSmilesCompleted, simCondCompleted]);

  return (
    <AppLayout headerType="drd" drdStep={2}>
      <div className="flex flex-col h-full w-full overflow-hidden gap-6">

        {/* ── TOP: Title ───────────────────────────── */}
        <div className="flex flex-row items-start justify-between shrink-0 px-1">
          <div className="flex flex-col">
            <h1 onClick={() => router.push("/drd/simulation-setting")} className="cursor-pointer text-page-title">
              Simulation Settings
            </h1>
            <span className="text-page-subtitle">
              Configure simulation parameters
            </span>
          </div>
        </div>

        {/* ── MAIN: Left + Right panels ───────────────────── */}
        <div className="flex flex-row flex-1 min-h-0 items-stretch gap-1">

          {/* ── LEFT PANEL (520px) ─────────── */}
          <DrdLeftPanel
            showFilteredPatients={false}
            steps={simSettingSteps}
            stepCardHeight={96}
          />

          {/* ── RIGHT PANEL ────────── */}
             <div className="figma-nine-slice figma-home-panel-right flex flex-col rounded-[36px] overflow-hidden flex-[78] min-w-0 min-h-0 gap-3">

            {/* Cards row */}
            <div className="flex-1 flex flex-row min-h-0 gap-3">
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
            <div className="shrink-0 flex justify-end items-center gap-3 pr-0.5">
              <SolidButton
                disabled={!simCondCompleted}
                variant="secondary" size="L"
              >
                Save Progress
              </SolidButton>
              <SolidButton
                disabled={!simCondCompleted}
                onClick={() => simCondCompleted && router.push("/drd/simulation-result")}
                variant="primary" size="L"
              >
                Apply to Analysis
              </SolidButton>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}