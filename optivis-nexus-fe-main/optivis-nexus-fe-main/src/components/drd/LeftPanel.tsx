"use client";

import { useState } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import Select from "@/components/ui/select";
import Slider from "@/components/ui/slider";
import InfoIcon from "@/components/ui/info-icon";
import Button from "@/components/ui/button";
import HypothesisTypeModal from "@/components/ui/hypothesis-type-modal";
import AddEndpointsModal, {
  type AddEndpointsSaveData,
  type EndpointItemSave,
} from "@/components/ui/add-endpoints-modal";

const ENDPOINT_OPTIONS = ["ADAS Cog 11", "MMSE", "CDR"];

interface LeftPanelProps {
  sampleSizeControl: number;
  setSampleSizeControl: (value: number) => void;
  disease: string;
  setDisease: (value: string) => void;
  primaryEndpoints: EndpointItemSave[];
  setPrimaryEndpoints: (
    arg:
      | EndpointItemSave[]
      | ((prev: EndpointItemSave[]) => EndpointItemSave[]),
  ) => void;
  secondaryEndpoints: EndpointItemSave[];
  setSecondaryEndpoints: (
    arg:
      | EndpointItemSave[]
      | ((prev: EndpointItemSave[]) => EndpointItemSave[]),
  ) => void;
  nominalPower: number;
  setNominalPower: (value: number) => void;
  alpha: number;
  multiplicity: string;
  treatmentDuration: string;
  setTreatmentDuration: (value: string) => void;
  hypothesisType: string;
  setHypothesisType: (value: string) => void;
  treatmentArms: string;
  setTreatmentArms: (value: string) => void;
  randomizationRatio: string;
  setRandomizationRatio: (value: string) => void;
  subpopulation: string;
  setSubpopulation: (value: string) => void;
  activeData: string;
  setActiveData: (value: string) => void;
  onApply: () => void;
  isLoading: boolean;
  onSaveEndpoints?: (data: AddEndpointsSaveData) => void;
}

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
        className="relative w-full h-full min-h-0 flex flex-col overflow-visible"
        style={{
          borderImage:
            'url("/assets/figma/home/frame-panel-left.png") 72 fill / 36px / 0 stretch',
          borderStyle: "solid",
          borderWidth: "24px",
          borderColor: "transparent",
        }}
      >
        <div className="flex flex-col w-full h-full p-0 min-h-0 gap-4">
          {/* Sample Size Control */}
          <div
            className="rounded-[18px] p-4 flex-shrink-0"
            style={{ background: "var(--primary-15)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-body2 text-white">Sample Size Control</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-body5 text-neutral-98">Size -</span>
              <span className="text-body5 text-neutral-98">Power +</span>
            </div>
            {/* Slider */}
            <div
              className="relative select-none"
              style={{ userSelect: "none" }}
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
                      className="absolute top-1/2 -translate-y-1/2 w-[38px] h-[24px] rounded-full bg-white cursor-grab active:cursor-grabbing"
                      style={{
                        left: `calc(${Math.max(0, Math.min(100, sliderPercentage))}% - 19px)`,
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
            <div className="flex items-center justify-between mt-2">
              <span className="text-body5m text-neutral-50">Min</span>
              <span className="text-body5m text-neutral-50">Max</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div
              className="relative rounded-[18px] overflow-hidden w-full h-full flex flex-col min-h-0 bg-neutral-95"
              style={{ backgroundColor: "var(--neutral-95)" }}
            >
              <div className="flex-1 min-h-0 overflow-hidden">
                <SimpleBar className="w-full h-full">
                  <div className="flex flex-col w-full p-4 gap-3 bg-neutral-95">
                    <div className="text-body2 text-black flex-shrink-0">
                      Simulation Setting
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-body4 text-neutral-5">
                            Disease
                          </span>
                          <span className="text-body4 text-tertiary-30">*</span>
                        </div>
                        <div className="bg-neutral-90 rounded-[8px] h-[26px] px-3 flex items-center w-[154px]">
                          <input
                            type="text"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                            className="w-full bg-transparent text-body5 text-neutral-50 outline-none"
                            placeholder="Alzheimer's disease"
                          />
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="flex-shrink-0"
                          >
                            <g style={{ mixBlendMode: "plus-darker" }}>
                              <path
                                d="M6.77336 6.10156L13.3829 6.10156C13.621 6.10156 13.7956 6.15113 13.9067 6.25026C14.021 6.34939 14.0781 6.46727 14.0781 6.60391C14.0781 6.72447 14.0369 6.84771 13.9543 6.97363L10.7115 11.6555C10.5972 11.8216 10.494 11.9368 10.4019 12.0011C10.313 12.0681 10.2051 12.1016 10.0781 12.1016C9.95432 12.1016 9.84638 12.0681 9.75432 12.0011C9.66225 11.9368 9.55908 11.8216 9.44479 11.6555L6.20193 6.97363C6.1194 6.84771 6.07813 6.72447 6.07813 6.60391C6.07813 6.46727 6.13527 6.34939 6.24955 6.25026C6.36384 6.15113 6.53844 6.10156 6.77336 6.10156Z"
                                fill="var(--neutral-50)"
                              />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-body4 text-neutral-5">
                          Endpoints Design
                        </span>
                        <button
                          onClick={() => setIsAddEndpointsModalOpen(true)}
                          className="w-6 h-6 rounded-[8px] flex items-center justify-center cursor-pointer flex-shrink-0"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M0 8C0 3.58172 3.58172 0 8 0H16C20.4183 0 24 3.58172 24 8V16C24 20.4183 20.4183 24 16 24H8C3.58172 24 0 20.4183 0 16V8Z"
                              fill="#231F52"
                            />
                            <path
                              d="M7.96436 13.5649V11.9097H16.0356V13.5649H7.96436ZM11.1724 16.7363V8.73828H12.8276V16.7363H11.1724Z"
                              fill="white"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-white rounded-[12px] p-4 flex flex-col gap-2">
                        {primaryEndpoints.map((ep, i) => (
                          <div
                            key={`primary-${i}`}
                            className="flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-body5 text-neutral-40">
                                Primary Endpoint #{i + 1}
                              </span>
                              <Select
                                value={ep.name}
                                options={ENDPOINT_OPTIONS}
                                onChange={(value) => {
                                  setPrimaryEndpoints((prev) =>
                                    prev.map((e, j) =>
                                      j === i ? { ...e, name: value } : e,
                                    ),
                                  );
                                }}
                                className="w-[154px]"
                              />
                            </div>
                            <div className="flex flex-col gap-0">
                              <div className="flex items-center">
                                <span className="text-body5 text-neutral-40">
                                  Expected Effect Size
                                </span>
                                <span className="text-body5 text-tertiary-30">
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
                                <div className="flex items-center justify-between">
                                  <span className="text-body5 text-neutral-40">
                                    Secondary Endpoint #{i + 1}
                                  </span>
                                  <Select
                                    value={ep.name}
                                    placeholder="Select"
                                    options={ENDPOINT_OPTIONS}
                                    onChange={(value) => {
                                      setSecondaryEndpoints((prev) =>
                                        prev.map((e, j) =>
                                          j === i ? { ...e, name: value } : e,
                                        ),
                                      );
                                    }}
                                    className="w-[154px]"
                                  />
                                </div>
                                <div className="flex flex-col gap-0">
                                  <div className="flex items-center">
                                    <span className="text-body5 text-neutral-40">
                                      Expected Effect Size
                                    </span>
                                    <span className="text-body5 text-tertiary-30">
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
                            <span className="text-body5 text-neutral-40">
                              Norminal Power
                            </span>
                            <span className="text-body5 text-tertiary-30">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-body4 text-neutral-5">
                            Treatment Duration
                          </span>
                          <span className="text-body4 text-tertiary-30">*</span>
                        </div>
                        <Select
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
                          className="w-[100px] [&>button]:h-[26px]"
                          iconPath="/assets/icons/chevron-select.svg"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-body4 text-neutral-5">
                        Trial Design
                      </div>
                      <div className="bg-white rounded-[12px] px-2 py-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <span className="text-body5 text-neutral-40">
                                Hypothesis Type
                              </span>
                              <span className="text-body5 text-tertiary-30">
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
                          <Select
                            value={hypothesisType}
                            options={[
                              "Superiority",
                              "Non-inferiority",
                              "Equivalence",
                            ]}
                            onChange={setHypothesisType}
                            className="w-[154px]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-body5 text-neutral-40">
                              Treatment Arms
                            </span>
                            <span className="text-body5 text-tertiary-30">
                              *
                            </span>
                          </div>
                          <Select
                            value={treatmentArms}
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
                            className="w-[154px]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-body5 text-neutral-40">
                              Randomization Ratio
                            </span>
                            <span className="text-body5 text-tertiary-30">
                              *
                            </span>
                          </div>
                          <Select
                            value={randomizationRatio}
                            options={
                              treatmentArms === "1"
                                ? ["1:1", "2:1"]
                                : treatmentArms === "2"
                                  ? ["1:1:1", "2:1:1"]
                                  : []
                            }
                            onChange={setRandomizationRatio}
                            className="w-[154px]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-body5 text-neutral-40">
                            Subpopulation
                          </span>
                          <Select
                            value={subpopulation}
                            options={["ALL", "Mild AD", "Moderate AD"]}
                            onChange={setSubpopulation}
                            className="w-[154px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </SimpleBar>
              </div>
              <div className="mt-auto flex-shrink-0 p-4 pt-0 flex flex-col gap-3 bg-neutral-95">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 19 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M17.75 4.91667C17.75 6.9425 14.0558 8.58333 9.5 8.58333C4.94417 8.58333 1.25 6.9425 1.25 4.91667M17.75 4.91667C17.75 2.89083 14.0558 1.25 9.5 1.25C4.94417 1.25 1.25 2.89083 1.25 4.91667M17.75 4.91667V9.5M1.25 4.91667V9.5M1.25 9.5C1.25 11.5258 4.94417 13.1667 9.5 13.1667M1.25 9.5V14.0833C1.25 16.1092 4.94417 17.75 9.5 17.75M15 12.25V15M15 15V17.75M15 15H17.75M15 15H12.25"
                          stroke="var(--neutral-5)"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-body4 text-neutral-5 ">
                        Active Data
                      </span>
                    </div>
                    <Select
                      value={activeData}
                      options={[
                        "Oprimed data",
                        "Historical data",
                        "Synthetic data",
                      ]}
                      onChange={setActiveData}
                      className=" [&>button]:h-[26px]"
                      iconPath="/assets/icons/active-data-edit.svg"
                      iconWidth={18}
                      iconHeight={18}
                    />
                  </div>
                </div>
                <Button
                  variant="orange"
                  size="md"
                  icon="play"
                  iconPosition="right"
                  onClick={onApply}
                  disabled={isLoading}
                  className="self-end h-[30px] text-body4"
                >
                  {isLoading ? "Loading..." : "Apply"}
                </Button>
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
