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

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/common/Loading";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  clearDrdSimulationCondition,
  getDrdSimulationConditionInfo,
  playDrdSimulation,
  type PlayDrdSimulationRequest,
  type DRDSimulationConditionInfoData,
} from "@/services/drd-service";
import { DRD_SIMULATION_RESULT_USE_MOCK } from "@/services/drd-simulation-result-mock-data";
import {
  useSimulationStore,
  type SimulationState,
  type SimCondData,
} from "@/store/simulationStore";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */

/** Simulation Conditions 완료 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SimCondIconCompleted() {
  return (
    <Image
      src="/icons/simulation-setting/state%3Dcompleted%2C%20step%3Dsimulation%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
      alt="Simulation Conditions"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/** Simulation Conditions 미시작 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SimCondIconDefault() {
  return (
    <Image
      src="/icons/simulation-setting/state%3Dnot%20started%2C%20step%3Dsimulation%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
      alt="Simulation Conditions"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/** SMILES Settings 미시작 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SmilesIconNotStarted() {
  return (
    <Image
      src="/icons/simulation-setting/state%3Dnot%20started%2C%20step%3Dsmiles%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
      alt="SMILES Settings"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/** SMILES Settings 완료 상태 아이콘 (우측 카드 헤더 전용 30×30px) */
function SmilesIconCompleted() {
  return (
    <Image
      src="/icons/simulation-setting/state%3Dcompleted%2C%20step%3Dsmiles%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
      alt="SMILES Settings"
      width={30}
      height={30}
      style={{ flexShrink: 0 }}
    />
  );
}

/** 왼쪽 패널 스텝 버튼용 Simulation Conditions 아이콘 (completed에 따라 이미지 전환, 24×24px) */
function SimCondIconLeft({ completed }: { completed: boolean }) {
  return (
    <Image
      src={
        completed
          ? "/icons/simulation-setting/state%3Dcompleted%2C%20step%3Dsimulation%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
          : "/icons/simulation-setting/state%3Dnot%20started%2C%20step%3Dsimulation%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
      }
      alt="Simulation Conditions"
      width={24}
      height={24}
      style={{ flexShrink: 0 }}
    />
  );
}

/** 왼쪽 패널 스텝 버튼용 SMILES Settings 아이콘 (completed에 따라 이미지 전환, 24×24px) */
function SmilesIconLeft({ completed }: { completed: boolean }) {
  return (
    <Image
      src={
        completed
          ? "/icons/simulation-setting/state%3Dcompleted%2C%20step%3Dsmiles%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
          : "/icons/simulation-setting/state%3Dnot%20started%2C%20step%3Dsmiles%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
      }
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
/**
 * InitialCard — 설정이 아직 완료되지 않은 상태의 카드 컴포넌트
 * - 아이콘(step에 따라 SimCondIconDefault 또는 SmilesIconNotStarted), 제목, 설명, "Setting" 버튼으로 구성
 * - 버튼 클릭 시 해당 설정 페이지로 이동 (onClick 콜백)
 * - required가 true이면 제목 옆에 파란 별표(*) 표시
 */
function InitialCard({
  step,
  title,
  required,
  description,
  flex,
  onClick,
}: {
  step: string;
  title: string;
  required?: boolean;
  description: string;
  flex?: number;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        flex: flex ?? 1,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 24,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40 }}>
        <div style={{ display: "flex", alignItems: "center", height: 40, flexShrink: 0 }}>
          {step === "Step 1" ? <SimCondIconDefault /> : <SmilesIconNotStarted />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 17,
              fontWeight: 600,
              color: "rgb(72,70,70)",
              letterSpacing: "-0.51px",
              lineHeight: "1.2",
            }}
          >
            {title}
          </span>
          {required && (
            <span
              style={{
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: 600,
                color: "rgb(64,19,238)",
              }}
            >
              *
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontFamily: "Inter",
            fontSize: 13,
            fontWeight: 500,
            color: "rgb(145,144,146)",
            letterSpacing: "-0.39px",
            lineHeight: "1.4",
            margin: 0,
          }}
        >
          {description}
        </p>
        <button
          onClick={onClick}
          style={{
            width: "100%",
            height: 36,
            borderRadius: 36,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#8F8AC4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 17,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "-0.51px",
              lineHeight: 1,
            }}
          >
            Setting
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.33594 8.33594H14.3359"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.33594 2.33594V14.3359"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "flex-end",
        flexShrink: 0,
      }}
    >
      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          position: "relative",
          height: 36,
          paddingLeft: 20,
          paddingRight: 10,
          borderRadius: 36,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{ position: "absolute", inset: 0, borderRadius: 36, backgroundColor: "#8f8ac4" }}
        />
        <span
          style={{
            position: "relative",
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.45px",
            lineHeight: 1.05,
            whiteSpace: "nowrap",
          }}
        >
          Reset
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/basics/Contents%3DReset%2C%20Size%3D16.svg"
          alt=""
          width={18}
          height={18}
          style={{ position: "relative", flexShrink: 0, filter: "brightness(0) invert(1)" }}
        />
      </button>
      {/* Edit */}
      <button
        onClick={onEdit}
        style={{
          position: "relative",
          height: 36,
          paddingLeft: 20,
          paddingRight: 14,
          borderRadius: 36,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{ position: "absolute", inset: 0, borderRadius: 36, backgroundColor: "#8f8ac4" }}
        />
        <span
          style={{
            position: "relative",
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.45px",
            lineHeight: 1.05,
            whiteSpace: "nowrap",
          }}
        >
          Edit
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/basics/Contents%3DAdd%2C%20Size%3D16.svg"
          alt=""
          width={18}
          height={18}
          style={{ position: "relative", flexShrink: 0, filter: "brightness(0) invert(1)" }}
        />
      </button>
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
    <div
      style={{
        ...(isFirst ? {} : { borderTop: "1px solid #c6c5c9" }),
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        paddingTop: 10,
        paddingBottom: 10,
      }}
    >
      <div style={{ width: 120, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 13,
            fontWeight: 600,
            color: "#787776",
            letterSpacing: "-0.39px",
            lineHeight: "1.18",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 13,
            fontWeight: 600,
            color: "#484646",
            letterSpacing: "-0.39px",
            lineHeight: "1.18",
          }}
        >
          {value}
        </span>
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
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          background: "white",
          borderRadius: "16px 16px 0 0",
          borderBottom: `1.5px solid ${color}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 17,
            fontWeight: 600,
            color,
            letterSpacing: "-0.51px",
            lineHeight: 1.05,
          }}
        >
          {label}
        </span>
      </div>
      {/* Body */}
      <div
        style={{
          background: "white",
          borderRadius: "0 0 16px 16px",
          padding: "12px 16px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {drugs.map((drug, i) => (
          <div
            key={i}
            style={{
              fontFamily: "Inter",
              fontSize: 13,
              fontWeight: 600,
              color: "#484646",
              letterSpacing: "-0.39px",
              lineHeight: "1.18",
            }}
          >
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
const TREND_LABELS = ["Increase", "Stable", "Decrease"]; // HbA1c 증감 행 레이블
const STRATEGY_COLORS = ["#3a11d8", "#f06600", "#24c6c9"]; // 전략 A/B/C 컬러
const STRATEGY_LABELS = ["Strategy A", "Strategy B", "Strategy C"]; // 전략 라벨
const DRD_ENTITY_TYPE = "drd";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toRecord = (value: unknown): UnknownRecord | null => {
  if (isRecord(value)) return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const toSafeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSimulationSnapshot = (info: DRDSimulationConditionInfoData): SimCondData | null => {
  const snapshot = toRecord(info.fe_snapshot_text);
  if (!snapshot) return null;

  const trendRows = Array.isArray(snapshot.trend_rows) ? snapshot.trend_rows.filter(isRecord) : [];
  const trendMap = new Map<string, UnknownRecord>();
  trendRows.forEach((row) => {
    const label = typeof row.label === "string" ? row.label.trim().toLowerCase() : "";
    if (label) trendMap.set(label, row);
  });

  const monthValues = TREND_LABELS.map((label) => {
    const month = toSafeNumber(trendMap.get(label.toLowerCase())?.month);
    return month !== null ? String(Math.round(month)) : "0";
  });
  const inputValues = TREND_LABELS.map((label) => {
    const delta = trendMap.get(label.toLowerCase())?.delta;
    return delta === null || delta === undefined ? "0" : String(delta);
  });
  const unitValues = TREND_LABELS.map((label) => {
    const unit = trendMap.get(label.toLowerCase())?.unit;
    return typeof unit === "string" && unit.trim() ? unit.trim() : "%";
  });

  const followUpRaw = toSafeNumber(snapshot.follow_up_months);
  const followUpFromMonth = Math.max(
    3,
    ...monthValues.map((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 3;
    })
  );
  const followUpMonths =
    followUpRaw !== null && followUpRaw > 0 ? Math.round(followUpRaw) : followUpFromMonth;

  const selectedValueLabel =
    typeof snapshot.target_feature === "string" && snapshot.target_feature.trim()
      ? snapshot.target_feature.trim()
      : typeof snapshot.selected_value === "string" && snapshot.selected_value.trim()
        ? snapshot.selected_value.trim()
        : undefined;
  const selectedValueIndex = selectedValueLabel
    ? VALUE_LABELS.findIndex((label) => label.toLowerCase() === selectedValueLabel.toLowerCase())
    : -1;

  const rawDrugList = Array.isArray(snapshot.drug_list) ? snapshot.drug_list.filter(isRecord) : [];
  const drugList = rawDrugList.map((drug, index) => {
    const checksRaw = Array.isArray(drug.checks) ? drug.checks : [];
    return {
      id: toSafeNumber(drug.id) ?? index,
      type: typeof drug.type === "string" ? drug.type : "",
      name: typeof drug.name === "string" ? drug.name : "",
      code: typeof drug.code === "string" ? drug.code : "",
      checks: [0, 1, 2].map((i) => Boolean(checksRaw[i])),
      warning: Boolean(drug.warning),
    };
  });

  return {
    selectedCategory: null,
    selectedDetail: null,
    selectedValue: selectedValueIndex >= 0 ? selectedValueIndex : null,
    selectedValueLabel,
    followUpMonths,
    inputValues,
    unitValues,
    monthValues,
    drugList,
  };
};

/**
 * SimCondCompletedCard — Simulation Conditions 설정 완료 시 표시되는 카드
 * - SimCondData를 받아 Selected Value, Trend 요약, Follow-up Window, 전략별 약물 목록 표시
 * - 하단: Reset(완료 상태 초기화) + Edit(simulation-condition 페이지로 이동) 버튼
 */
function SimCondCompletedCard({
  flex,
  onClick,
  onReset,
  data,
}: {
  flex?: number;
  onClick?: () => void;
  onReset?: () => void;
  data: SimCondData;
}) {
  const valueName =
    data.selectedValueLabel ??
    (data.selectedValue !== null ? (VALUE_LABELS[data.selectedValue] ?? "") : "");

  // "Increase (6m) / Stable (6m) / Decrease (3m)" 형태
  const trendSummary = TREND_LABELS.map(
    (label, i) => `${label} (${data.monthValues[i] ?? "-"}m)`
  ).join(" / ");

  // 전략별 약물 목록: checks[strategyIdx]가 true인 약물만
  const strategyDrugs = [0, 1, 2].map((si) =>
    data.drugList.filter((d) => d.checks[si]).map((d) => d.name)
  );

  return (
    <div
      style={{
        flex: flex ?? 1,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 24,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            height: 40,
            alignItems: "center",
            paddingTop: 4,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <SimCondIconCompleted />
        </div>
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 17,
            fontWeight: 600,
            color: "#484646",
            letterSpacing: "-0.72px",
            lineHeight: "1.2",
            display: "flex",
            alignItems: "center",
            height: 40,
          }}
        >
          Simulation Conditions
        </span>
      </div>

      {/* Content + buttons (flex-1, justify-between) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Top: summary table + strategy cards — 스크롤 영역 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 0,
          }}
        >
          {/* Summary table */}
          <div
            style={{ background: "white", borderRadius: 16, padding: "4px 16px", flexShrink: 0 }}
          >
            {/* Selected Value — 2행 구조 */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <div style={{ width: 120, flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#787776",
                    letterSpacing: "-0.39px",
                    lineHeight: "1.18",
                  }}
                >
                  Selected Value
                </span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#484646",
                    letterSpacing: "-0.39px",
                    lineHeight: "1.18",
                  }}
                >
                  {valueName || "-"}
                </span>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#919092",
                    letterSpacing: "-0.39px",
                    lineHeight: "1.18",
                  }}
                >
                  {trendSummary}
                </span>
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
/**
 * SmilesCompletedCard — SMILES Settings 완료 시 표시되는 카드
 * - drugs 배열을 받아 약물 이름 번호 목록 표시
 * - 하단: Reset(완료 상태 초기화) + Edit(smile-setting 페이지로 이동) 버튼
 */
function SmilesCompletedCard({
  flex,
  onClick,
  onReset,
  drugs,
}: {
  flex?: number;
  onClick?: () => void;
  onReset?: () => void;
  drugs: { name: string }[];
}) {
  return (
    <div
      style={{
        flex: flex ?? 1,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 24,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            height: 40,
            alignItems: "center",
            paddingTop: 4,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <SmilesIconCompleted />
        </div>
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 17,
            fontWeight: 600,
            color: "#484646",
            letterSpacing: "-0.72px",
            lineHeight: "1.2",
            display: "flex",
            alignItems: "center",
            height: 40,
          }}
        >
          SMILES Settings
        </span>
      </div>

      {/* Content + buttons (flex-1) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Top: drug list — 스크롤 영역 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 0,
          }}
        >
          {/* Drug list */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {drugs.map((drug, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "Inter",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#484646",
                  letterSpacing: "-0.39px",
                  lineHeight: "1.18",
                }}
              >
                <span>
                  {i + 1} {drug.name}
                </span>
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
/**
 * SimulationSettingPage — 시뮬레이션 설정 허브 페이지 메인 컴포넌트
 *
 * 전역 SimulationStore에서 완료 상태와 데이터를 읽어 카드 UI를 조건부 렌더링한다.
 * - simCondCompleted → true면 SimCondCompletedCard, false면 InitialCard("Step 1")
 * - simSmilesCompleted → true면 SmilesCompletedCard, false면 InitialCard("Step 2")
 */
function SimulationSettingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTaskId =
    searchParams.get("task_id") ?? searchParams.get("taskId") ?? searchParams.get("test_id");
  const simCondCompleted = useSimulationStore((s: SimulationState) => s.simCondCompleted); // Simulation Conditions 완료 여부
  const simSmilesCompleted = useSimulationStore((s: SimulationState) => s.simSmilesCompleted); // SMILES Settings 완료 여부
  const simCondData = useSimulationStore((s: SimulationState) => s.simCondData); // Simulation Conditions 저장 데이터
  const setSimCondCompleted = useSimulationStore((s: SimulationState) => s.setSimCondCompleted); // 완료 상태 초기화 setter
  const setSimSmilesCompleted = useSimulationStore((s: SimulationState) => s.setSimSmilesCompleted); // SMILES 완료 상태 초기화 setter
  const setSimCondData = useSimulationStore((s: SimulationState) => s.setSimCondData); // 조건 데이터 초기화 setter
  const setTaskId = useSimulationStore((s: SimulationState) => s.setTaskId);
  const smilesData = useSimulationStore((s: SimulationState) => s.smilesData); // SMILES 약물 목록
  const simulationTaskId = useSimulationStore((s: SimulationState) => s.taskId);
  const [isInfoLoading, setIsInfoLoading] = useState(false);
  const [isResettingSimCond, setIsResettingSimCond] = useState(false);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(false);
  const [simulationCompanyId, setSimulationCompanyId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const resolvedTaskId = useMemo(() => {
    const candidate = queryTaskId?.trim() || simulationTaskId;
    return candidate?.trim() || null;
  }, [queryTaskId, simulationTaskId]);

  const resolveTaskId = (): string | null => resolvedTaskId;

  const buildDrdPathWithContext = (pathname: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    const taskId = resolveTaskId();

    if (taskId) {
      params.delete("taskId");
      params.delete("test_id");
      params.set("task_id", taskId);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  useEffect(() => {
    const taskId = resolvedTaskId;
    if (!taskId) {
      setPageError("task_id를 확인할 수 없어 Simulation Condition 조회를 진행할 수 없습니다.");
      return;
    }

    let cancelled = false;
    const loadSimulationConditionInfo = async () => {
      setIsInfoLoading(true);
      setPageError(null);
      setTaskId(taskId);

      try {
        const response = await getDrdSimulationConditionInfo({
          entity_type: DRD_ENTITY_TYPE,
          task_id: taskId,
        });

        if (cancelled) return;

        const info = response.data;
        setSimulationCompanyId(
          typeof info?.company_id === "number" && Number.isFinite(info.company_id)
            ? info.company_id
            : null
        );

        if (!info || !info.is_selected) {
          setSimCondCompleted(false);
          setSimCondData(null);
          return;
        }

        const parsedData = parseSimulationSnapshot(info);
        if (!parsedData) {
          setPageError("Simulation Condition 정보를 파싱할 수 없습니다.");
          return;
        }

        setSimCondData(parsedData);
        setSimCondCompleted(true);
      } catch (error) {
        if (cancelled) return;
        setPageError(
          error instanceof Error ? error.message : "Simulation Condition 조회에 실패했습니다."
        );
      } finally {
        if (!cancelled) {
          setIsInfoLoading(false);
        }
      }
    };

    void loadSimulationConditionInfo();

    return () => {
      cancelled = true;
    };
  }, [resolvedTaskId, setSimCondCompleted, setSimCondData, setTaskId]);

  const handleResetSimulationCondition = async (): Promise<void> => {
    if (isResettingSimCond) return;

    const taskId = resolveTaskId();
    if (!taskId) {
      setPageError("task_id를 확인할 수 없어 Simulation Condition Reset을 진행할 수 없습니다.");
      return;
    }

    try {
      setIsResettingSimCond(true);
      setPageError(null);
      await clearDrdSimulationCondition({
        entity_type: DRD_ENTITY_TYPE,
        task_id: taskId,
      });
      setSimCondCompleted(false);
      setSimCondData(null);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Simulation Condition Reset에 실패했습니다."
      );
    } finally {
      setIsResettingSimCond(false);
    }
  };

  const handleApplyToAnalysis = async (): Promise<void> => {
    if (!simCondCompleted || isPlayingSimulation) return;

    const taskId = resolveTaskId();
    if (!taskId) {
      setPageError("task_id를 확인할 수 없어 시뮬레이션 실행을 진행할 수 없습니다.");
      return;
    }
    if (!simCondData) {
      setPageError("Simulation Condition 데이터가 없어 시뮬레이션 실행을 진행할 수 없습니다.");
      return;
    }

    try {
      if (DRD_SIMULATION_RESULT_USE_MOCK) {
        // Temporary: keep the report screen on branch-aligned mock data
        // until the DRD play -> report integration is reconnected.
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(`drd_simulation_play_request_${taskId}`);
          window.localStorage.removeItem(`drd_simulation_play_${taskId}`);
        }

        setPageError(null);
        router.push(buildDrdPathWithContext("/drd/simulation-result"));
        return;
      }

      setIsPlayingSimulation(true);
      setPageError(null);

      const companyId = simulationCompanyId;
      if (companyId === null) {
        throw new Error("company_id를 확인할 수 없어 시뮬레이션 실행을 진행할 수 없습니다.");
      }

      const playRequest: PlayDrdSimulationRequest = {
        company_id: companyId,
        task_id: taskId,
      };
      console.log("[DRD Simulation] play request payload", playRequest);

      const playResponse = await playDrdSimulation(playRequest);

      if (typeof window !== "undefined") {
        localStorage.setItem(`drd_simulation_play_request_${taskId}`, JSON.stringify(playRequest));
        localStorage.setItem(`drd_simulation_play_${taskId}`, JSON.stringify(playResponse));
      }

      router.push(buildDrdPathWithContext("/drd/simulation-result"));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "시뮬레이션 실행에 실패했습니다.");
    } finally {
      setIsPlayingSimulation(false);
    }
  };

  return (
    <AppLayout headerType="drd" drdStep={2} scaleMode="none">
      <Loading isLoading={isInfoLoading || isResettingSimCond || isPlayingSimulation} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 24px)",
          height: "100%",
          gap: 24,
          overflow: "hidden",
          marginLeft: "8px",
          marginRight: "8px",
        }}
      >
        {/* ── TOP: Title ───────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
            padding: "0 12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-setting"))}
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 42,
                fontWeight: 600,
                color: "rgb(17,17,17)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                margin: 0,
                cursor: "pointer",
              }}
            >
              Simulation Settings
            </h1>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: 600,
                color: "rgb(120,119,118)",
                letterSpacing: "-0.48px",
              }}
            >
              Configure simulation parameters
            </span>
            {pageError && (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "Inter",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#b42318",
                  letterSpacing: "-0.36px",
                  lineHeight: 1.3,
                }}
              >
                {pageError}
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN: Left + Right panels ───────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: 1,
            gap: "0px",
            minHeight: "720px",
            alignItems: "stretch",
          }}
        >
          {/* ── LEFT PANEL (520px) ─────────── */}
          <div
            className="flex w-[380px] flex-shrink-0 flex-col gap-[12px] overflow-hidden rounded-[36px]"
            style={{
              borderImage:
                'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            <div className="flex flex-1 flex-col gap-[8px] overflow-y-auto rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[10px]">
              {/* Step 2: SMILES Settings */}
              <button
                onClick={() => router.push(buildDrdPathWithContext("/drd/smile-setting"))}
                className="flex w-full shrink-0 cursor-pointer flex-col rounded-[24px] border-none p-[16px] pt-[12px] pb-[16px] text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                style={{ background: "transparent", height: 96, justifyContent: "center" }}
              >
                <div className="flex items-center gap-[18px]">
                  <div className="flex shrink-0 items-center justify-center">
                    <SmilesIconLeft completed={simSmilesCompleted} />
                  </div>
                  <span
                    className="font-['Inter'] text-[17px] leading-[1.12] font-semibold tracking-[-0.68px]"
                    style={{ color: "#484646" }}
                  >
                    SMILES Settings
                  </span>
                </div>
                <div className="mt-0 pl-[42px]">
                  <p
                    className="m-0 font-['Inter'] text-[10px] leading-[1.1] font-semibold tracking-[-0.4px]"
                    style={{ color: "#919092" }}
                  >
                    Add SMILES strings to define the chemical structures for simulation conditions.
                  </p>
                </div>
              </button>

              {/* Step 1: Simulation Conditions */}
              <button
                onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-condition"))}
                className="flex w-full shrink-0 cursor-pointer flex-col rounded-[24px] border-none p-[16px] pt-[12px] pb-[16px] text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                style={{ background: "transparent", height: 96, justifyContent: "center" }}
              >
                <div className="flex items-center gap-[18px]">
                  <div className="flex shrink-0 items-center justify-center">
                    <SimCondIconLeft completed={simCondCompleted} />
                  </div>
                  <span
                    className="font-['Inter'] text-[17px] leading-[1.12] font-semibold tracking-[-0.68px]"
                    style={{ color: "#484646" }}
                  >
                    Simulation Conditions
                  </span>
                </div>
                <div className="mt-0 pl-[42px]">
                  <p
                    className="m-0 font-['Inter'] text-[10px] leading-[1.1] font-semibold tracking-[-0.4px]"
                    style={{ color: "#919092" }}
                  >
                    Develop a plan to assess the subject&apos;s prognosis based on the entered
                    information.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL ────────── */}
          <div
            className="drd-right-panel flex min-h-0 min-w-0 flex-[78] flex-col"
            style={{
              borderImage:
                'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
              gap: "12px",
              marginLeft: "-6px",
            }}
          >
            {/* Cards row */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                gap: 12,
                minHeight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                paddingRight: 0,
              }}
            >
              {simSmilesCompleted ? (
                <SmilesCompletedCard
                  flex={1}
                  onClick={() => router.push(buildDrdPathWithContext("/drd/smile-setting"))}
                  onReset={() => setSimSmilesCompleted(false)}
                  drugs={smilesData}
                />
              ) : (
                <InitialCard
                  step="Step 2"
                  title="SMILES Settings"
                  description="Add SMILES to define the chemical structures for simulation conditions."
                  flex={1}
                  onClick={() => router.push(buildDrdPathWithContext("/drd/smile-setting"))}
                />
              )}
              {simCondCompleted && simCondData ? (
                <SimCondCompletedCard
                  flex={2.775}
                  onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-condition"))}
                  onReset={() => {
                    void handleResetSimulationCondition();
                  }}
                  data={simCondData}
                />
              ) : (
                <InitialCard
                  step="Step 1"
                  title="Simulation Conditions"
                  required
                  description="Develop a plan to assess the subject's prognosis based on the entered information."
                  flex={2.775}
                  onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-condition"))}
                />
              )}
            </div>

            {/* Bottom buttons */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                alignItems: "center",
              }}
            >
              <button
                disabled={!simCondCompleted}
                style={{
                  height: 40,
                  paddingLeft: 28,
                  paddingRight: 28,
                  borderRadius: 36,
                  background: simCondCompleted ? "#787776" : "#c6c5c9",
                  border: "none",
                  cursor: simCondCompleted ? "pointer" : "not-allowed",
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: 600,
                  color: simCondCompleted ? "#ffffff" : "#e2e1e5",
                  letterSpacing: "-0.51px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Save Progress
              </button>
              <button
                disabled={!simCondCompleted || isPlayingSimulation}
                onClick={() => void handleApplyToAnalysis()}
                style={{
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: 36,
                  background: simCondCompleted && !isPlayingSimulation ? "#F06600" : "#c6c5c9",
                  border: "none",
                  cursor: simCondCompleted && !isPlayingSimulation ? "pointer" : "not-allowed",
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: 600,
                  color: simCondCompleted && !isPlayingSimulation ? "#ffffff" : "#e2e1e5",
                  letterSpacing: "-0.51px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isPlayingSimulation ? "Applying..." : "Apply to Analysis"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function SimulationSettingPage() {
  return (
    <Suspense fallback={null}>
      <SimulationSettingPageContent />
    </Suspense>
  );
}
