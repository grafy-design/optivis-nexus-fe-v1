"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
// Removed import Image from "next/image"; as the module or types can't be found.
import Select from "@/components/ui/select";
import Image from "next/image";
const MULTIPLICITY_OPTIONS = ["Bonferroni", "Holm", "Hochberg"] as const;
const OUTCOME_OPTIONS = ["ADAS Cog 11", "MMSE", "CDR"];
const TYPE_OPTIONS = ["Continuous", "Binary"];
const TARGET_POWER_OPTIONS = ["80%", "85%", "90%"];

/** Primary + Secondary 합계 최대 개수 */
const MAX_TOTAL_ENDPOINTS = 5;


interface PrimaryRow {
  id: string;
  outcome: string;
  type: string;
  effectSize: string;
  threshold: string;
  alpha: string;
  targetPower: string;
}

interface SecondaryRow {
  id: string;
  outcome: string;
  type: string;
  effectSize: string;
  threshold: string;
}

/** Setting 루프용 엔드포인트 1개 (store EndpointItem과 동일) */
export interface EndpointItemSave {
  name: string;
  effectSize: number;
  /** Endpoint 변수 타입 (Continuous, Binary). API는 Continous/Binary */
  type?: string;
  /** Binary 타입 시 임계값 (없으면 null) */
  threshold?: number | null;
}

export interface AddEndpointsSaveData {
  primaryEndpoints: EndpointItemSave[];
  secondaryEndpoints: EndpointItemSave[];
  nominalPower: number;
  alpha: number;
  /** 유의수준 조정 방법 (Bonferroni, Holm, Hochberg) */
  multiplicity: string;
}

interface AddEndpointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaveDisabled?: boolean;
  /** 다중 Primary (모달 열 때 초기 행 구성) */
  primaryEndpoints: EndpointItemSave[];
  /** 다중 Secondary (모달 열 때 초기 행 구성) */
  secondaryEndpoints: EndpointItemSave[];
  nominalPower: number;
  alpha: number;
  /** 유의수준 조정 방법 (모달 열 때 초기값) */
  multiplicity: string;
  onSave?: (data: AddEndpointsSaveData) => void;
}

// 간단한 고유 ID 생성 (각 행 구분용)
let idCounter = 0;
function generateId(): string {
  return `row-${Date.now()}-${++idCounter}-${Math.random().toString(36).substring(2, 9)}`;
}

function ensureInOptions(options: string[], value: string): string[] {
  if (!value || options.includes(value)) return options;
  const num = parseFloat(value);
  if (options.some((o) => parseFloat(o) === num)) return options;
  return [...options, value].sort((a, b) => parseFloat(a) - parseFloat(b));
}

/** id 제외한 행 데이터만 비교용으로 직렬화 */
function serializePrimary(row: PrimaryRow) {
  const { id: _id, ...rest } = row;
  return rest;
}
function serializeSecondary(row: SecondaryRow) {
  const { id: _id, ...rest } = row;
  return rest;
}

function targetPowerToNumber(s: string): number {
  if (s === "80%") return 0.8;
  if (s === "85%") return 0.85;
  if (s === "90%") return 0.9;
  const n = parseFloat(s.replace("%", ""));
  return Number.isFinite(n) ? n / 100 : 0.8;
}

export default function AddEndpointsModal({
  open,
  onOpenChange,
  isSaveDisabled: _isSaveDisabled = false,
  primaryEndpoints,
  secondaryEndpoints,
  nominalPower,
  alpha,
  multiplicity: initialMultiplicity,
  onSave,
}: AddEndpointsModalProps) {
  const [multiplicity, setMultiplicity] = useState<string>(
    initialMultiplicity || MULTIPLICITY_OPTIONS[0],
  );

  const handleMultiplicityChange = (v: string) => setMultiplicity(v);
  const [primaryRows, setPrimaryRows] = useState<PrimaryRow[]>([]);
  const [secondaryRows, setSecondaryRows] = useState<SecondaryRow[]>([]);

  /** 모달 열렸을 때의 초기 스냅샷 (Save 버튼 활성화 판단용) */
  const initialSnapshotRef = useRef<{
    multiplicity: string;
    primary: ReturnType<typeof serializePrimary>[];
    secondary: ReturnType<typeof serializeSecondary>[];
  } | null>(null);
  const prevOpenRef = useRef(false);

  // 모달이 막 열릴 때만 multiplicity 동기화 + Primary/Secondary 초기화 + 초기 스냅샷 저장 (배열 기반)
  useEffect(() => {
    if (open) {
      setMultiplicity(initialMultiplicity || MULTIPLICITY_OPTIONS[0]);
    }
    if (open && !prevOpenRef.current) {
      prevOpenRef.current = true;
      const powerStr =
        nominalPower <= 0.82 ? "80%" : nominalPower <= 0.87 ? "85%" : "90%";
      const alphaStr =
        alpha === 0.025 ? "0.025" : alpha === 0.01 ? "0.01" : "0.05";
      const thresholdStr = (v: number | null | undefined) =>
        v != null && Number.isFinite(v) ? String(v) : "";
      const typeStr = (t: string | undefined) =>
        t === "Binary" ? "Binary" : "Continuous";
      const newPrimary: PrimaryRow[] =
        primaryEndpoints.length > 0
          ? primaryEndpoints.map((ep) => ({
              id: generateId(),
              outcome: ep.name || OUTCOME_OPTIONS[0],
              type: typeStr(ep.type),
              effectSize: ep.effectSize.toFixed(1),
              threshold: thresholdStr(ep.threshold),
              alpha: alphaStr,
              targetPower: powerStr,
            }))
          : [
              {
                id: generateId(),
                outcome: OUTCOME_OPTIONS[0],
                type: "Continuous",
                effectSize: "3.0",
                threshold: "",
                alpha: alphaStr,
                targetPower: powerStr,
              },
            ];
      const newSecondary: SecondaryRow[] = secondaryEndpoints.map((ep) => ({
        id: generateId(),
        outcome: ep.name || OUTCOME_OPTIONS[0],
        type: typeStr(ep.type),
        effectSize: ep.effectSize.toFixed(1),
        threshold: thresholdStr(ep.threshold),
      }));
      setPrimaryRows(newPrimary);
      setSecondaryRows(newSecondary);
      initialSnapshotRef.current = {
        multiplicity: multiplicity,
        primary: newPrimary.map(serializePrimary),
        secondary: newSecondary.map(serializeSecondary),
      };
    }
    if (!open) {
      prevOpenRef.current = false;
      initialSnapshotRef.current = null;
    }
  }, [
    open,
    initialMultiplicity,
    multiplicity,
    primaryEndpoints,
    secondaryEndpoints,
    nominalPower,
    alpha,
  ]);

  /** 데이터가 추가/수정/삭제되어 저장할 내용이 있으면 true */
  const hasChanges = useMemo(() => {
    const snap = initialSnapshotRef.current;
    if (!open || !snap) return false;
    if (multiplicity !== snap.multiplicity) return true;
    if (
      primaryRows.length !== snap.primary.length ||
      secondaryRows.length !== snap.secondary.length
    )
      return true;
    const primarySame =
      JSON.stringify(primaryRows.map(serializePrimary)) ===
      JSON.stringify(snap.primary);
    const secondarySame =
      JSON.stringify(secondaryRows.map(serializeSecondary)) ===
      JSON.stringify(snap.secondary);
    return !primarySame || !secondarySame;
  }, [open, multiplicity, primaryRows, secondaryRows]);

  const targetPowerOptions = ensureInOptions(
    TARGET_POWER_OPTIONS,
    primaryRows[0]?.targetPower ?? "",
  );

  const handleAddPrimary = () => {
    setPrimaryRows((prev) => [
      ...prev,
      {
        id: generateId(),
        outcome: OUTCOME_OPTIONS[0],
        type: "Continuous",
        effectSize: "3.0",
        threshold: "",
        alpha: "0.05",
        targetPower: primaryRows[0]?.targetPower ?? "80%",
      },
    ]);
  };

  const handleAddSecondary = () => {
    setSecondaryRows((prev) => [
      ...prev,
      {
        id: generateId(),
        outcome: OUTCOME_OPTIONS[0],
        type: "Continuous",
        effectSize: "3.0",
        threshold: "",
      },
    ]);
  };

  const updatePrimary = (
    id: string,
    field: keyof PrimaryRow,
    value: string,
  ) => {
    if (field === "targetPower") {
      setPrimaryRows((prev) =>
        prev.map((row) => ({ ...row, targetPower: value })),
      );
    } else {
      setPrimaryRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );
    }
  };

  const updateSecondaryRow = (
    id: string,
    field: keyof SecondaryRow,
    value: string,
  ) => {
    setSecondaryRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const removePrimaryRow = (id: string) => {
    setPrimaryRows((prev) => prev.filter((row) => row.id !== id));
  };

  const removeSecondaryRow = (id: string) => {
    setSecondaryRows((prev) => prev.filter((row) => row.id !== id));
  };

  const sharedTargetPower = primaryRows[0]?.targetPower ?? "0.8";

  /** Primary 행들의 Alpha 값 합산 (FWER 행 표시용) */
  const alphaSum = primaryRows.reduce(
    (sum, row) => sum + (parseFloat(row.alpha) || 0),
    0,
  );
  const alphaSumDisplay =
    Number.isInteger(alphaSum) || alphaSum === 0
      ? String(alphaSum)
      : alphaSum.toFixed(3).replace(/\.?0+$/, "");

  const totalEndpoints = primaryRows.length + secondaryRows.length;
  const canAddMore = totalEndpoints < MAX_TOTAL_ENDPOINTS;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[110]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[1032px] h-auto min-h-[482px] max-h-[700px] overflow-auto p-0 border-0 bg-transparent">
          <VisuallyHidden.Root>
            <Dialog.Title>Add Endpoints</Dialog.Title>
            <Dialog.Description>
              Add primary and secondary endpoints for your trial design
            </Dialog.Description>
          </VisuallyHidden.Root>
          <div className="relative w-full min-h-[482px] rounded-[36px] overflow-hidden opacity-94">
            <Image
              src="/assets/simulation/endpoint-bg.png"
              alt="Add Endpoints Modal"
              width={1032}
              height={482}
              className="absolute inset-0 w-full h-full object-cover"
              priority
            />
            <div className="relative z-10 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-14">
                <h2 className="text-[36px] font-semibold leading-[36px] tracking-[-0.72px] text-white">
                  Add Endpoints
                </h2>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => {
                      if (!hasChanges) return;
                      const firstPrimary = primaryRows[0];
                      const parseThreshold = (s: string): number | null => {
                        if (s == null || s.trim() === "") return null;
                        const n = parseFloat(s.trim());
                        return Number.isFinite(n) ? n : null;
                      };
                      const payload: AddEndpointsSaveData = {
                        primaryEndpoints: primaryRows.map((r) => ({
                          name: r.outcome,
                          effectSize: parseFloat(r.effectSize) || 0,
                          type: r.type === "Binary" ? "Binary" : "Continuous",
                          threshold: parseThreshold(r.threshold),
                        })),
                        secondaryEndpoints: secondaryRows.map((r) => ({
                          name: r.outcome,
                          effectSize: parseFloat(r.effectSize) || 0,
                          type: r.type === "Binary" ? "Binary" : "Continuous",
                          threshold: parseThreshold(r.threshold),
                        })),
                        nominalPower: targetPowerToNumber(
                          firstPrimary?.targetPower ?? "80%",
                        ),
                        alpha:
                          parseFloat(firstPrimary?.alpha ?? "0.05") || 0.05,
                        multiplicity: multiplicity,
                      };
                      onSave?.(payload);
                      onOpenChange(false);
                    }}
                    disabled={!hasChanges}
                    className={`flex items-center justify-center transition-opacity z-10 ${
                      !hasChanges
                        ? " cursor-not-allowed"
                        : "hover:opacity-70 cursor-pointer"
                    }`}
                  >
                    <Image
                      src={
                        !hasChanges
                          ? "/assets/simulation/savebtn-disabled.png"
                          : "/assets/simulation/savebtn.png"
                      }
                      alt="Save"
                      width={115}
                      height={48}
                      className="flex-shrink-0 w-full h-full object-contain"
                    />
                  </button>
                  <Dialog.Close asChild>
                    <button className="w-[120px] h-12 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer z-10">
                      <Image
                        src="/assets/simulation/close-button.png"
                        alt="Close"
                        width={120}
                        height={48}
                        className="flex-shrink-0 w-full h-full object-contain"
                      />
                    </button>
                  </Dialog.Close>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="w-[158px] min-h-[36px] flex items-center">
                  <Select
                    value={multiplicity}
                    options={[...MULTIPLICITY_OPTIONS]}
                    onChange={handleMultiplicityChange}
                    className="w-[158px]"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleAddPrimary}
                    disabled={!canAddMore}
                    className={`rounded-[16px] h-[36px] px-4 text-body4 text-white inline-flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 ${
                      canAddMore
                        ? "bg-[#3a11d8] hover:bg-[#2e09bb] cursor-pointer"
                        : "bg-[#535252] cursor-not-allowed"
                    }`}
                  >
                    <span className="whitespace-nowrap">Add Primary</span>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <rect width="24" height="24" rx="12" fill={"white"} />
                      <path
                        d="M6 12H18"
                        stroke={canAddMore ? "#3A11D8" : "#535252"}
                        strokeWidth="2"
                      />
                      <path
                        d="M12 6V18"
                        stroke={canAddMore ? "#3A11D8" : "#535252"}
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSecondary}
                    disabled={!canAddMore}
                    className={`rounded-[16px] h-[36px] px-4 text-body4 text-white inline-flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 ${
                      canAddMore
                        ? "bg-[#f06600] hover:bg-[#d85a00] cursor-pointer"
                        : "bg-[#535252] cursor-not-allowed"
                    }`}
                  >
                    <span className="whitespace-nowrap">Add Secondary</span>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <rect width="24" height="24" rx="12" fill={"white"} />
                      <path
                        d="M6 12H18"
                        stroke={canAddMore ? "#f06600" : "#535252"}
                        strokeWidth="2"
                      />
                      <path
                        d="M12 6V18"
                        stroke={canAddMore ? "#f06600" : "#535252"}
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-t-[18px] rounded-b-[18px] overflow-auto max-h-[450px] flex flex-col">
                <div
                  className="overflow-auto p-4 pr-5 min-h-[240px]"
                  style={{ scrollbarGutter: "stable" }}
                >
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="border-b border-[#c6c5c9]">
                        <th className="w-[12%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Endpoint Type
                        </th>
                        <th className="w-[6%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          No
                        </th>
                        <th className="w-[18%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Outcome
                        </th>
                        <th className="w-[14%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Type
                        </th>
                        <th className="w-[14%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Effect size
                        </th>
                        <th className="w-[12%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Threshold
                        </th>
                        <th className="w-[12%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Alpha
                        </th>
                        <th className="w-[18%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold">
                          Target Power
                        </th>
                        <th className="w-[3%] p-1 pl-4 text-left text-body5 text-neutral-30 font-semibold" />
                      </tr>
                      <tr>
                        <td
                          colSpan={9}
                          className="h-1 p-0 border-0 bg-transparent"
                        />
                      </tr>
                    </thead>
                    <tbody className="text-body5 text-neutral-5">
                      {/* Primary Section */}
                      {primaryRows.map((row, index) => (
                        <tr key={row.id}>
                          {index === 0 && (
                            <td
                              rowSpan={primaryRows.length}
                              className="p-1 align-middle relative"
                            >
                              <div className="absolute inset-[4px] rounded-[8px] bg-primary-95 flex items-center justify-start px-3 text-body5 font-semibold text-neutral-30">
                                Primary
                              </div>
                            </td>
                          )}
                          <td className="p-1 align-middle">
                            <div className="rounded-[8px] bg-neutral-90 min-w-[48px] h-[26px] flex items-center justify-start px-3 text-body5 text-neutral-50">
                              #{index + 1}
                            </div>
                          </td>
                          <td className="p-1 align-middle">
                            <Select
                              value={row.outcome}
                              options={OUTCOME_OPTIONS}
                              onChange={(v) =>
                                updatePrimary(row.id, "outcome", v)
                              }
                              className="w-full min-w-0"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <Select
                              value={row.type}
                              options={TYPE_OPTIONS}
                              onChange={(v) => updatePrimary(row.id, "type", v)}
                              className="w-full min-w-0"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <input
                              type="text"
                              value={row.effectSize}
                              onChange={(e) =>
                                updatePrimary(
                                  row.id,
                                  "effectSize",
                                  e.target.value,
                                )
                              }
                              className="w-full h-[26px] px-3 rounded-[8px] bg-neutral-90 text-body5 text-neutral-50 border-0 outline-none"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <input
                              type="text"
                              value={row.threshold}
                              onChange={(e) =>
                                updatePrimary(
                                  row.id,
                                  "threshold",
                                  e.target.value,
                                )
                              }
                              disabled={row.type === "Continuous"}
                              placeholder={
                                row.type === "Continuous"
                                  ? "Disabled"
                                  : undefined
                              }
                              className={`w-full h-[26px] px-3 rounded-[8px] bg-neutral-90 text-body5 text-neutral-50 border-0 outline-none ${
                                row.type === "Continuous"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <input
                              type="text"
                              value={row.alpha}
                              onChange={(e) =>
                                updatePrimary(row.id, "alpha", e.target.value)
                              }
                              className="w-full h-[26px] px-3 rounded-[8px] bg-neutral-90 text-body5 text-neutral-50 border-0 outline-none"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            {index === 0 ? (
                              <Select
                                value={sharedTargetPower}
                                options={targetPowerOptions}
                                onChange={(v) =>
                                  updatePrimary(row.id, "targetPower", v)
                                }
                                className="w-full min-w-0"
                              />
                            ) : (
                              <span className="text-neutral-40"></span>
                            )}
                          </td>
                          <td className="p-1 align-middle w-[3%]">
                            {index === 0 ? (
                              <span className="inline-block w-6" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => removePrimaryRow(row.id)}
                                className="text-neutral-40 hover:text-neutral-5"
                                aria-label="Delete row"
                              >
                                <img
                                  src="/assets/icons/trash.svg"
                                  alt="Delete row"
                                  width={20}
                                  height={26}
                                  className="w-5 h-[26px] object-contain"
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Secondary Section */}
                      {secondaryRows.map((row, index) => (
                        <tr key={row.id}>
                          {index === 0 && (
                            <td
                              rowSpan={secondaryRows.length}
                              className="p-1 align-middle relative"
                            >
                              <div className="absolute inset-[4px] rounded-[8px] bg-primary-95 flex items-center justify-start px-3 text-body5 font-semibold text-neutral-30">
                                Secondary
                              </div>
                            </td>
                          )}
                          <td className="p-1 align-middle">
                            <div className="rounded-[8px] bg-neutral-90 min-w-[48px] h-[26px] flex items-center justify-start px-3 text-body5 text-neutral-50">
                              #{index + 1}
                            </div>
                          </td>
                          <td className="p-1 align-middle">
                            <Select
                              value={row.outcome}
                              options={OUTCOME_OPTIONS}
                              onChange={(v) =>
                                updateSecondaryRow(row.id, "outcome", v)
                              }
                              className="w-full min-w-0"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <Select
                              value={row.type}
                              options={TYPE_OPTIONS}
                              onChange={(v) =>
                                updateSecondaryRow(row.id, "type", v)
                              }
                              className="w-full min-w-0"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <input
                              type="text"
                              value={row.effectSize}
                              onChange={(e) =>
                                updateSecondaryRow(
                                  row.id,
                                  "effectSize",
                                  e.target.value,
                                )
                              }
                              className="w-full h-[26px] px-3 rounded-[8px] bg-neutral-90 text-body5 text-neutral-50 border-0 outline-none"
                            />
                          </td>
                          <td className="p-1 align-middle">
                            <input
                              type="text"
                              value={row.threshold}
                              onChange={(e) =>
                                updateSecondaryRow(
                                  row.id,
                                  "threshold",
                                  e.target.value,
                                )
                              }
                              disabled={row.type === "Continuous"}
                              placeholder={
                                row.type === "Continuous"
                                  ? "Disabled"
                                  : undefined
                              }
                              className={`w-full h-[26px] px-3 rounded-[8px] bg-neutral-90 text-body5 text-neutral-50 border-0 outline-none ${
                                row.type === "Continuous"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                          </td>

                          <td className="p-1 align-middle text-neutral-40"></td>
                          <td className="p-1 align-middle text-neutral-40"></td>
                          <td className="p-1 align-middle w-[3%]">
                            <button
                              type="button"
                              onClick={() => removeSecondaryRow(row.id)}
                              className="text-neutral-40 hover:text-neutral-5"
                              aria-label="Delete row"
                            >
                              <img
                                src="/assets/icons/trash.svg"
                                alt="Delete row"
                                width={20}
                                height={26}
                                className="w-5 h-[26px] object-contain"
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FWER 행: FWER은 화면 중앙, 0.05=8열(Alpha), 80%=9열(Target Power), 텍스트 왼쪽 정렬 */}
                <div
                  className="relative grid items-center bg-[#e2e1e5] px-4 py-2 rounded-b-[18px] gap-0 pl-4 pr-5"
                  style={{
                    gridTemplateColumns:
                      "12fr 6fr 18fr 14fr 14fr 12fr 12fr 18fr 3fr",
                  }}
                >
                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-body3 text-neutral-5 font-semibold pointer-events-none"
                    aria-hidden
                  >
                    FWER
                  </span>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span className="text-body3 text-neutral-5 font-semibold text-left pl-1 leading-none">
                    {alphaSumDisplay}
                  </span>
                  <span className="text-body3 text-neutral-5 font-semibold text-left pl-1 leading-none whitespace-nowrap">
                    {primaryRows[0]
                      ? `${sharedTargetPower}(Primary)`
                      : "80%(Primary)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
