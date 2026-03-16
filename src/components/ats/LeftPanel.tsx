"use client";

import { useState } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import DropdownCell from "@/components/ui/dropdown-cell";
import Slider from "@/components/ui/slider";
import InfoIcon from "@/components/ui/info-icon";
import SolidButton from "@/components/ui/solid-button";
import HypothesisTypeModal from "@/components/ui/hypothesis-type-modal";
import AddEndpointsModal, {
  type AddEndpointsSaveData,
  type EndpointItemSave,
} from "@/components/ui/add-endpoints-modal";
import ActiveDataIcon from "@/assets/icons/active-data.svg";

const ENDPOINT_OPTIONS = ["ADAS Cog 11", "MMSE", "CDR"];

/**
 * ATS(Adaptive Trial Simulation) 워크플로우의 왼쪽 패널 컴포넌트입니다.
 * 시뮬레이션 설정(샘플 사이즈, 질환, 평가지표, 임상 디자인 등) 폼을 제공하고 상태를 상위 컴포넌트로 전달합니다.
 */
interface LeftPanelProps {
  /** 샘플 사이즈 조절 값 (Power 기반 계산용) */
  sampleSizeControl: number;
  /** 샘플 사이즈 조절 값 변경 핸들러 */
  setSampleSizeControl: (value: number) => void;
  /** 대상 질환명 */
  disease: string;
  /** 질환명 변경 핸들러 */
  setDisease: (value: string) => void;
  /** 1차 평가지표 (Primary Endpoints) 목록 */
  primaryEndpoints: EndpointItemSave[];
  /** 1차 평가지표 목록 변경 핸들러 */
  setPrimaryEndpoints: (
    arg:
      | EndpointItemSave[]
      | ((prev: EndpointItemSave[]) => EndpointItemSave[]),
  ) => void;
  /** 2차 평가지표 (Secondary Endpoints) 목록 */
  secondaryEndpoints: EndpointItemSave[];
  /** 2차 평가지표 목록 변경 핸들러 */
  setSecondaryEndpoints: (
    arg:
      | EndpointItemSave[]
      | ((prev: EndpointItemSave[]) => EndpointItemSave[]),
  ) => void;
  /** 명목 검정력 (Power) 설정값 */
  nominalPower: number;
  /** 명목 검정력 변경 핸들러 */
  setNominalPower: (value: number) => void;
  /** 유의수준 (Alpha) 설정값 */
  alpha: number;
  /** 다중성 제어 (Multiplicity) 방식 */
  multiplicity: string;
  /** 치료 기간 (ex: "12 months") */
  treatmentDuration: string;
  /** 치료 기간 변경 핸들러 */
  setTreatmentDuration: (value: string) => void;
  /** 가설 유형 (ex: "Superiority") */
  hypothesisType: string;
  /** 가설 유형 변경 핸들러 */
  setHypothesisType: (value: string) => void;
  /** 투약 그룹(군) 수 */
  treatmentArms: string;
  /** 투약 그룹(군) 수 변경 핸들러 */
  setTreatmentArms: (value: string) => void;
  /** 무작위 배정 비율 (ex: "1:1") */
  randomizationRatio: string;
  /** 무작위 배정 비율 변경 핸들러 */
  setRandomizationRatio: (value: string) => void;
  /** 타겟 하위집단 (Subpopulation) */
  subpopulation: string;
  /** 하위집단 변경 핸들러 */
  setSubpopulation: (value: string) => void;
  /** 활성(기준) 데이터 소스 (ex: "Oprimed data") */
  activeData: string;
  /** 데이터 소스 변경 핸들러 */
  setActiveData: (value: string) => void;
  /** 시뮬레이션 적용(실행) 버튼 핸들러 */
  onApply: () => void;
  /** 시뮬레이션 실행/로딩 상태 */
  isLoading: boolean;
  /** 평가지표(Endpoints) 저장 완료 시 핸들러 (모달 콜백) */
  onSaveEndpoints?: (data: AddEndpointsSaveData) => void;
}

/**
 * ATS 시뮬레이션 파라미터를 입력받는 사이드바 컴포넌트 (`LeftPanel`).
 * 샘플 사이즈 조정 슬라이더 및 기타 Trial Design 정보 폼을 렌더링합니다.
 */
export function LeftPanel({
  sampleSizeControl,
  setSampleSizeControl,
  disease,
  setDisease,
  primaryEndpoints,
  setPrimaryEndpoints,
  secondaryEndpoints,
  setSecondaryEndpoints,
  nominalPower,
  setNominalPower,
  alpha,
  multiplicity,
  treatmentDuration,
  setTreatmentDuration,
  hypothesisType,
  setHypothesisType,
  treatmentArms,
  setTreatmentArms,
  randomizationRatio,
  setRandomizationRatio,
  subpopulation,
  setSubpopulation,
  activeData,
  setActiveData,
  onApply,
  isLoading,
  onSaveEndpoints,
}: LeftPanelProps) {
  const [isHypothesisModalOpen, setIsHypothesisModalOpen] = useState(false);
  const [isAddEndpointsModalOpen, setIsAddEndpointsModalOpen] = useState(false);

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <div
        className="figma-nine-slice figma-home-panel-left relative w-full h-full min-h-0 flex flex-col overflow-visible"
      >
        <div className="flex flex-col w-full h-full p-0 min-h-0 gap-3">
          {/* Sample Size Control */}
          <div
            className="rounded-[14px] p-4 flex-shrink-0 flex flex-col gap-12"
            style={{ background: "var(--primary-15)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-body3 text-white">Sample Size Control</h3>
            </div>
            <div className="flex flex-col gap-1  pb-1">
            <div className="flex items-center justify-between">
              <span className="text-small1 text-neutral-98">Size -</span>
              <span className="text-small1 text-neutral-98">Power +</span>
            </div>
            {/* Slider */}
            <div
              className="relative select-none"
            >
              <div
                className="h-[12px] rounded-full bg-neutral-50"
                style={{ opacity: 0.2 }}
              />
              {(() => {
                const minPower = 0.6;
                const maxPower = 0.95;
                const powerRange = maxPower - minPower;
                const sliderPercentage =
                  ((sampleSizeControl - minPower) / powerRange) * 100;
                return (
                  <>
                    <div
                      className="h-[12px] rounded-full absolute top-0 left-0"
                      style={{
                        width: `${Math.max(0, Math.min(100, sliderPercentage))}%`,
                        background: "var(--secondary-60)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-[38px] h-[24px] rounded-full bg-[#fcf8f8] border border-[#e2e1e5] cursor-grab active:cursor-grabbing hover:bg-[#f9f8fc] active:bg-[#efeff4] transition-colors duration-150 shadow-[0px_0.5px_4px_0px_rgba(0,0,0,0.12),0px_6px_13px_0px_rgba(0,0,0,0.12)]"
                      style={{
                        left: `calc(${Math.max(0, Math.min(100, sliderPercentage))}% - ${(Math.max(0, Math.min(100, sliderPercentage)) / 100) * 38}px)`,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement;
                        if (!slider) return;
                        const preventSelect = (event: Event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          return false;
                        };
                        const preventDrag = (event: DragEvent) => {
                          event.preventDefault();
                          return false;
                        };
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          moveEvent.preventDefault();
                          const rect = slider.getBoundingClientRect();
                          const x = moveEvent.clientX - rect.left;
                          const percentage = Math.max(
                            0,
                            Math.min(100, (x / rect.width) * 100),
                          );
                          const rawPower =
                            minPower + (percentage / 100) * powerRange;
                          const steppedPower =
                            Math.round(rawPower / 0.05) * 0.05;
                          const clampedPower = Math.max(
                            minPower,
                            Math.min(maxPower, steppedPower),
                          );
                          setSampleSizeControl(
                            parseFloat(clampedPower.toFixed(2)),
                          );
                        };
                        const handleMouseUp = (upEvent: MouseEvent) => {
                          upEvent.preventDefault();
                          upEvent.stopPropagation();
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp,
                          );
                          document.removeEventListener(
                            "selectstart",
                            preventSelect,
                          );
                          document.removeEventListener("select", preventSelect);
                          document.removeEventListener(
                            "dragstart",
                            preventDrag,
                          );
                          const bodyStyle = document.body.style as any;
                          bodyStyle.userSelect = "";
                          bodyStyle.webkitUserSelect = "";
                          bodyStyle.mozUserSelect = "";
                          bodyStyle.msUserSelect = "";
                          document.body.classList.remove("no-select");
                        };
                        const bodyStyle = document.body.style as any;
                        bodyStyle.userSelect = "none";
                        bodyStyle.webkitUserSelect = "none";
                        bodyStyle.mozUserSelect = "none";
                        bodyStyle.msUserSelect = "none";
                        document.body.classList.add("no-select");
                        document.addEventListener(
                          "mousemove",
                          handleMouseMove,
                          { passive: false },
                        );
                        document.addEventListener("mouseup", handleMouseUp, {
                          passive: false,
                        });
                        document.addEventListener("selectstart", preventSelect);
                        document.addEventListener("select", preventSelect);
                        document.addEventListener("dragstart", preventDrag);
                      }}
                    />
                  </>
                );
              })()}
            </div>
            {/*<div className="flex items-center justify-between">
              <span className="text-small1 text-neutral-80">Min</span>
              <span className="text-small1 text-neutral-80">Max</span>
            </div>*/}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-layer-secondary rounded-[14px] ">
            <div
              className="relative overflow-hidden w-full h-full flex flex-col min-h-0 "
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                <SimpleBar className="w-full h-full">
                  <div className="flex flex-col w-full p-4 gap-3 ">
                    <div className="text-body3 text-text-accent flex-shrink-0">
                      Simulation Setting
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 flex items-center">
                          <span className="text-body5 text-text-primary">
                            Disease
                          </span>
                          <span className="text-body5 text-tertiary-30">*</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <DropdownCell
                            value={disease}
                            options={[
                              "Alzheimer's disease",
                              "Parkinson's",
                              "Breast Cancer",
                              "IBD",
                              "Melanoma",
                              "NASH",
                              "Ovarian",
                            ]}
                            onChange={setDisease}
                            size="xs"
                            width="100%"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-body5 text-text-primary">
                          Endpoints Design
                        </span>
                        <SolidButton
                          onClick={() => setIsAddEndpointsModalOpen(true)}
                          icon="plus"
                          size="s"
                          variant="secondary"
                          className="w-6 h-6 p-0 shrink-0 rounded-[12px] bg-primary-15 hover:bg-primary-20 active:bg-primary-10"
                        />
                      </div>
                      <div className="bg-white rounded-[8px] p-3 py-2 flex flex-col gap-2">
                        {primaryEndpoints.map((ep, i) => (
                          <div
                            key={`primary-${i}`}
                            className="flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex-1 min-w-0 text-small1 text-text-secondary">
                                Primary Endpoint #{i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <DropdownCell
                                  value={ep.name || "Select"}
                                  placeholder={!ep.name}
                                  options={ENDPOINT_OPTIONS}
                                  onChange={(value) => {
                                    setPrimaryEndpoints((prev) =>
                                      prev.map((e, j) =>
                                        j === i ? { ...e, name: value } : e,
                                      ),
                                    );
                                  }}
                                  size="xs"
                                  width="100%"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-0">
                              <div className="flex items-center">
                                <span className="text-small1 text-text-secondary">
                                  Expected Effect Size
                                </span>
                                <span className="text-small1 text-tertiary-30">
                                  *
                                </span>
                              </div>
                              <Slider
                                value={ep.effectSize}
                                min={0.1}
                                max={10}
                                step={0.1}
                                onChange={(value) => {
                                  const rounded = Math.round(value * 10) / 10;
                                  const clamped = Math.max(
                                    0.1,
                                    Math.min(10, rounded),
                                  );
                                  setPrimaryEndpoints((prev) =>
                                    prev.map((e, j) =>
                                      j === i
                                        ? { ...e, effectSize: clamped }
                                        : e,
                                    ),
                                  );
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ))}
                        {secondaryEndpoints.length > 0 ? (
                          <>
                            <div className="h-[1px] bg-neutral-80" />
                            {secondaryEndpoints.map((ep, i) => (
                              <div
                                key={`secondary-${i}`}
                                className="flex flex-col gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="flex-1 min-w-0 text-small1 text-text-secondary">
                                    Secondary Endpoint #{i + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <DropdownCell
                                      value={ep.name || "Select"}
                                      placeholder={!ep.name}
                                      options={ENDPOINT_OPTIONS}
                                      onChange={(value) => {
                                        setSecondaryEndpoints((prev) =>
                                          prev.map((e, j) =>
                                            j === i ? { ...e, name: value } : e,
                                          ),
                                        );
                                      }}
                                      size="xs"
                                      width="100%"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-0">
                                  <div className="flex items-center">
                                    <span className="text-small1 text-text-secondary">
                                      Expected Effect Size
                                    </span>
                                    <span className="text-small1 text-tertiary-30">
                                      *
                                    </span>
                                  </div>
                                  <Slider
                                    value={ep.effectSize}
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    onChange={(value) => {
                                      const rounded =
                                        Math.round(value * 10) / 10;
                                      const clamped = Math.max(
                                        0.1,
                                        Math.min(10, rounded),
                                      );
                                      setSecondaryEndpoints((prev) =>
                                        prev.map((e, j) =>
                                          j === i
                                            ? { ...e, effectSize: clamped }
                                            : e,
                                        ),
                                      );
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="h-[1px] bg-neutral-80" />
                          </>
                        ) : null}
                        <div className="flex flex-col gap-0">
                          <div className="flex items-center">
                            <span className="text-small1 text-text-secondary">
                              Norminal Power
                            </span>
                            <span className="text-small1 text-tertiary-30">
                              *
                            </span>
                          </div>
                          <Slider
                            value={nominalPower}
                            min={0.8}
                            max={0.9}
                            step={0.05}
                            onChange={(value) => {
                              const rounded = Math.round(value / 0.05) * 0.05;
                              setNominalPower(
                                Math.max(0.8, Math.min(0.9, rounded)),
                              );
                            }}
                            valuePrecision={2}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 flex items-center">
                          <span className="text-body5 text-text-primary">
                            Treatment Duration
                          </span>
                          <span className="text-body5 text-tertiary-30">*</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <DropdownCell
                            value={treatmentDuration}
                            options={[
                              "3 months",
                              "6 months",
                              "9 months",
                              "12 months",
                              "15 months",
                              "18 months",
                              "21 months",
                              "24 months",
                            ]}
                            onChange={setTreatmentDuration}
                            size="xs"
                            width="100%"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-body5 text-text-primary">
                        Trial Design
                      </div>
                      <div className="bg-white rounded-[8px] px-2 py-2 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <div className="flex items-center">
                              <span className="text-small1 text-text-secondary">
                                Hypothesis Type
                              </span>
                              <span className="text-small1 text-tertiary-30">
                                *
                              </span>
                            </div>
                            <button
                              onClick={() => setIsHypothesisModalOpen(true)}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <InfoIcon />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <DropdownCell
                              value={hypothesisType || "Select"}
                              placeholder={!hypothesisType}
                              options={[
                                "Superiority",
                                "Non-inferiority",
                                "Equivalence",
                              ]}
                              onChange={setHypothesisType}
                              size="xs"
                              width="100%"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 flex items-center">
                            <span className="text-small1 text-text-secondary">
                              Treatment Arms
                            </span>
                            <span className="text-small1 text-tertiary-30">
                              *
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <DropdownCell
                              value={treatmentArms || "Select"}
                              placeholder={!treatmentArms}
                              options={["1", "2"]}
                              onChange={(value) => {
                                setTreatmentArms(value);
                                if (value === "1") {
                                  if (
                                    !["1:1", "2:1"].includes(randomizationRatio)
                                  ) {
                                    setRandomizationRatio("1:1");
                                  }
                                } else if (value === "2") {
                                  if (
                                    !["1:1:1", "2:1:1"].includes(
                                      randomizationRatio,
                                    )
                                  ) {
                                    setRandomizationRatio("1:1:1");
                                  }
                                }
                              }}
                              size="xs"
                              width="100%"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 flex items-center">
                            <span className="text-small1 text-text-secondary">
                              Randomization Ratio
                            </span>
                            <span className="text-small1 text-tertiary-30">
                              *
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <DropdownCell
                              value={randomizationRatio || "Select"}
                              placeholder={!randomizationRatio}
                              options={
                                treatmentArms === "1"
                                  ? ["1:1", "2:1"]
                                  : treatmentArms === "2"
                                    ? ["1:1:1", "2:1:1"]
                                    : []
                              }
                              onChange={setRandomizationRatio}
                              size="xs"
                              width="100%"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex-1 min-w-0 text-small1 text-text-secondary">
                            Subpopulation
                          </span>
                          <div className="flex-1 min-w-0">
                            <DropdownCell
                              value={subpopulation || "Select"}
                              placeholder={!subpopulation}
                              options={["ALL", "Mild AD", "Moderate AD"]}
                              onChange={setSubpopulation}
                              size="xs"
                              width="100%"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SimpleBar>
              </div>
              <div className="mt-auto flex-shrink-0 p-4 pt-0 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <ActiveDataIcon className="flex-shrink-0 text-text-primary" />
                      <span className="text-body5 text-text-primary">
                        Active Data
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <DropdownCell
                        value={activeData}
                        options={[
                          "Oprimed data",
                          "Historical data",
                          "Synthetic data",
                        ]}
                        onChange={setActiveData}
                        size="xs"
                        width="100%"
                        iconPath="/assets/icons/active-data-edit.svg"
                        iconWidth={18}
                        iconHeight={18}
                        menuMaxHeight={72}
                      />
                    </div>
                  </div>
                </div>
                <SolidButton
                  variant="primary"
                  size="s"
                  icon="play"
                  iconPosition="right"
                  onClick={onApply}
                  disabled={isLoading}
                  className="self-end"
                >
                  {isLoading ? "Loading..." : "Apply"}
                </SolidButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HypothesisTypeModal
        open={isHypothesisModalOpen}
        onOpenChange={setIsHypothesisModalOpen}
      />
      <AddEndpointsModal
        open={isAddEndpointsModalOpen}
        onOpenChange={setIsAddEndpointsModalOpen}
        primaryEndpoints={primaryEndpoints}
        secondaryEndpoints={secondaryEndpoints}
        nominalPower={nominalPower}
        alpha={alpha}
        multiplicity={multiplicity}
        onSave={onSaveEndpoints}
      />
    </div>
  );
}
