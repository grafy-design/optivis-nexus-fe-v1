"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import Image from "next/image";
import Gauge from "@/components/ui/gauge";
import Select from "@/components/ui/select";
import Slider from "@/components/ui/slider";
import InfoIcon from "@/components/ui/info-icon";
import ArrowIcon from "@/components/ui/arrow-icon";
import FullscreenIcon from "@/components/ui/fullscreen-icon";
import Button from "@/components/ui/button";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import ReactECharts from "echarts-for-react";

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState<"compare" | "reduction">("compare");
  const [isApplied, setIsApplied] = useState(false);
  
  // Sample Size Control state
  const [sampleSizeControl, setSampleSizeControl] = useState(0.51);

  // Simulation Setting states
  const [disease, setDisease] = useState("Alzheimer's disease");
  const [primaryEndpoint, setPrimaryEndpoint] = useState("ADAS Cog 11");
  const [primaryEffectSize, setPrimaryEffectSize] = useState(0.8);
  const [secondaryEndpoint, setSecondaryEndpoint] = useState("");
  const [secondaryEffectSize, setSecondaryEffectSize] = useState(0.8);
  const [nominalPower, setNominalPower] = useState(0.8);
  const [treatmentDuration, setTreatmentDuration] = useState("12 months");
  const [hypothesisType, setHypothesisType] = useState("Superiority");
  const [treatmentArms, setTreatmentArms] = useState("1");
  const [randomizationRatio, setRandomizationRatio] = useState("1:1");
  const [subpopulation, setSubpopulation] = useState("All");
  const [activeData, setActiveData] = useState("Oprimed data");

  // Mock data for simulation results
  const simulationData = {
    topMetrics: {
      nToScreen: "1,671",
      sampleSize: "932",
      enrollment: "15.57",
      primaryEndpointPower: "80.0",
      secondaryEndpointPower: "68.3",
      estimatedCostReduction: "28",
      gaugeValue: 0.8,
      gaugeText: "80.0%"
    },
    smallerSample: {
      percentage: "028%",
      chartData: {
        optivis: [
          [520, 0.6], [550, 0.65], [580, 0.7], [610, 0.75], [640, 0.8], [670, 0.85], [700, 0.88], [730, 0.92]
        ],
        traditional: [
          [650, 0.6], [700, 0.65], [750, 0.7], [800, 0.75], [850, 0.8], [900, 0.85], [941, 0.92]
        ]
      }
    },
    smallerNToScreen: {
      percentage: "26.8%",
      subtitle: "Enrollment Time vs Power",
      chartData: {
        optivis: [
          [10, 0.6], [12, 0.7], [14, 0.75], [15, 0.8], [16, 0.82], [18, 0.85]
        ],
        traditional: [
          [12, 0.6], [15, 0.7], [18, 0.75], [20, 0.8], [21, 0.82], [24, 0.85]
        ]
      }
    },
    lowerCost: {
      percentage: "006%",
      subtitle: "Sample Size vs Cost",
      chartData: {
        optivis: [
          [400, 100], [450, 120], [500, 140], [550, 160], [600, 180], [650, 200]
        ],
        traditional: [
          [500, 100], [550, 120], [600, 140], [650, 160], [700, 180], [750, 200]
        ]
      }
    },
    comparisonTable: {
      enrollment: {
        optivis: "15.57",
        traditional: "21.27"
      },
      primaryEndpointPower: {
        optivis: "80.0%",
        traditional: "80.0%"
      },
      secondaryEndpointPower: {
        optivis: "68.3%",
        traditional: "66.8%"
      },
      sampleSize: {
        optivis: {
          treatmentGroup1: "233",
          controlGroup: "233",
          total: "466"
        },
        traditional: {
          treatmentGroup1: "325",
          controlGroup: "325",
          total: "650"
        }
      }
    },
    reductionView: {
      charts: [
        {
          label: 'Sample Size',
          change: '28%',
          optivis: 466,
          traditional: 638
        },
        {
          label: 'Power',
          change: 'No loss',
          optivis: 80,
          traditional: 80
        },
        {
          label: 'Enrollment Time',
          change: '25%',
          optivis: 15,
          traditional: 20
        },
        {
          label: 'Cost',
          change: '$25.8M',
          optivis: 55,
          traditional: 80
        }
      ]
    }
  };

  return (
    <AppLayout headerType="simulation">
      <div className="w-full flex flex-col items-center">
        {/* Top Section - Title and Metrics */}
        <div className="w-full flex justify-center mb-2 max-w-full">
          <div className="w-[1772px] flex-shrink-0 mx-auto">
            {/* Title Section */}
            <div className="flex items-start justify-between mb-4 min-w-full">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-[#111111] text-left">
                Adaptive Trial Simulation
              </div>
            
              <p className="text-body2m text-[#787776] text-left">
                Optimize study design
              </p>
            </div>

            {/* Metrics and Gauge Section - Right Aligned */}
            {/*
            <div className="flex items-start gap-[18px] flex-shrink-0">
              <div className="grid grid-cols-3 gap-4 flex-shrink-0 mt-4">
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied ? simulationData.topMetrics.nToScreen : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    N to Screen
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied ? simulationData.topMetrics.sampleSize : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Sample Size
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-h2 text-[#1b1b1b]">
                      {isApplied ? simulationData.topMetrics.enrollment : "--"}
                    </span>
                    <span className="text-body5 text-[#1b1b1b]">
                      {isApplied ? "months" : ""}
                    </span>
                  </div>
                  <span className="text-body5m text-[#666b73]">
                    Enrollment
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied ? `${simulationData.topMetrics.primaryEndpointPower}%` : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Primary Endpoint Power
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied ? `${simulationData.topMetrics.secondaryEndpointPower}%` : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Secondary Endpoint Power
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied ? `${simulationData.topMetrics.estimatedCostReduction}%` : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Estimated Cost Reduction
                  </span>
                </div>
              </div>

              <Gauge 
                value={isApplied ? simulationData.topMetrics.gaugeValue : 0.6} 
                text={isApplied ? simulationData.topMetrics.gaugeText : "--"}
                showIndicator={true}
              />
            </div>
            */}
          </div>
          </div>
        </div>

        {/* Main Content - Three Column Layout */}
        <div className="flex gap-4 w-full">
          {/* Left Column - Simulation Settings */}
          <div className="flex flex-col w-full max-w-[380px]">
            <div
              className="relative rounded-[18px] overflow-hidden w-full h-[880px] max-w-full flex flex-col"
              style={{
                backgroundImage: 'url(/assets/simulation/left-card.png)',
                backgroundSize: '380px 880px',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="flex flex-col w-full h-full p-[12px] min-h-0 gap-4">
                {/* Sample Size Control */}
                <div
                  className="rounded-[18px] p-4 flex-shrink-0"
                  style={{ background: "#262255" }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-body2 text-white">
                      Sample Size Control
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body5 text-[#fafafa]">
                      Size -
                    </span>
                    <span className="text-body5 text-[#fafafa]">
                      Power +
                    </span>
                  </div>
                  {/* Slider */}
                  <div className="relative">
                    <div className="h-[12px] rounded-full bg-[#787878]" style={{ opacity: 0.2 }} />
                    <div
                      className="h-[12px] rounded-full absolute top-0 left-0"
                      style={{ width: `${sampleSizeControl * 100}%`, background: "#f26702" }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-[38px] h-[24px] rounded-full bg-white cursor-grab active:cursor-grabbing"
                      style={{ left: `calc(${sampleSizeControl * 100}% - 19px)` }}
                      onMouseDown={(e) => {
                        const slider = e.currentTarget.parentElement;
                        if (!slider) return;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const rect = slider.getBoundingClientRect();
                          const x = moveEvent.clientX - rect.left;
                          const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                          setSampleSizeControl(percentage / 100);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener("mousemove", handleMouseMove);
                          document.removeEventListener("mouseup", handleMouseUp);
                        };
                        
                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-body5m text-[#787776]">Min</span>
                    <span className="text-body5m text-[#787776]">Max</span>
                  </div>
                </div>

                {/* Simulation Setting Section */}
                <div className="flex-1 flex flex-col min-h-0" >
                  <div
                    className="relative rounded-[18px] overflow-hidden w-full h-full flex flex-col"
                    style={{
                      backgroundColor: '#f4f3f5',
                    }}
                  >
                    <SimpleBar className="w-full h-full">
                      <div className="flex flex-col w-full p-4 gap-3 bg-[#f4f3f5]">
                        {/* Simulation Setting Header */}
                        <div className="text-body2 text-black flex-shrink-0">
                          Simulation Setting
                        </div>

                      {/* Disease Section */}
                      <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-body4 text-[#111111]">Disease</span>
                          <span className="text-body4 text-[#3609a1]">*</span>
                        </div>
                        <div className="bg-[#ebebf0] rounded-[8px] h-[26px] px-3 flex items-center w-[154px]">
                          <input
                            type="text"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                            className="w-full bg-transparent text-body5 text-[#787776] outline-none"
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
                                fill="#787776"
                              />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Endpoints Design Section */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-body4 text-[#111111]">Endpoints Design</span>
                        <button className="w-6 h-6 rounded-[8px] bg-[#231f52] flex items-center justify-center">
                          <span className="text-body4 text-white">+</span>
                        </button>
                      </div>
                      <div className="bg-white rounded-[12px] p-4 flex flex-col gap-2">
                      {/* Primary Endpoint */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-body5 text-[#5f5e5e]">Primary Endpoint</span>
                          <Select
                            value={primaryEndpoint}
                            options={["ADAS Cog 11", "MMSE", "CDR"]}
                            onChange={setPrimaryEndpoint}
                            className="w-[154px]"
                          />
                        </div>
                        <div className="flex flex-col gap-0">
                          <div className="flex items-center">
                            <span className="text-body5 text-[#5f5e5e]">Expected Effect Size</span>
                            <span className="text-body5 text-[#3609a1]">*</span>
                          </div>
                          <Slider
                            value={primaryEffectSize}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={setPrimaryEffectSize}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="h-[1px] bg-[#c6c5c9]" />

                      {/* Secondary Endpoint */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-body5 text-[#5f5e5e]">Secondary Endpoint</span>
                          <Select
                            value={secondaryEndpoint}
                            placeholder="Select"
                            options={["ADAS Cog 11", "MMSE", "CDR"]}
                            onChange={setSecondaryEndpoint}
                            className="w-[154px]"
                          />
                        </div>
                        <div className="flex flex-col gap-0">
                          <div className="flex items-center">
                            <span className="text-body5 text-[#5f5e5e]">Expected Effect Size</span>
                            <span className="text-body5 text-[#3609a1]">*</span>
                          </div>
                          <Slider
                            value={secondaryEffectSize}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={setSecondaryEffectSize}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="h-[1px] bg-[#c6c5c9]" />

                      {/* Nominal Power */}
                      <div className="flex flex-col gap-0">
                        <div className="flex items-center">
                          <span className="text-body5 text-[#5f5e5e]">Norminal Power</span>
                          <span className="text-body5 text-[#3609a1]">*</span>
                        </div>
                        <Slider
                          value={nominalPower}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={setNominalPower}
                          className="w-full"
                        />
                      </div>
                      </div>
                    </div>

                    {/* Treatment Duration */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-body4 text-[#111111]">Treatment Duration</span>
                          <span className="text-body4 text-[#3609a1]">*</span>
                        </div>
                        <Select
                          value={treatmentDuration}
                          options={["6 months", "12 months", "18 months", "24 months"]}
                          onChange={setTreatmentDuration}
                          className="[&>button]:h-[30px]"
                        />
                      </div>
                    </div>

                    {/* Trial Design Section */}
                    <div className="flex flex-col gap-2">
                      <div className="text-body4 text-[#111111]">Trial Design</div>
                      <div className="bg-white rounded-[12px] px-2 py-2 flex flex-col gap-2">

                      {/* Hypothesis Type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <span className="text-body5 text-[#5f5e5e]">Hypothesis Type</span>
                            <span className="text-body5 text-[#3609a1]">*</span>
                          </div>
                          <InfoIcon />
                        </div>
                        <Select
                          value={hypothesisType}
                          options={["Superiority", "Non-inferiority", "Equivalence"]}
                          onChange={setHypothesisType}
                          className="w-[154px]"
                        />
                      </div>


                      {/* Treatment Arms */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-body5 text-[#5f5e5e]">Treatment Arms</span>
                          <span className="text-body5 text-[#3609a1]">*</span>
                        </div>
                        <Select
                          value={treatmentArms}
                          options={["1", "2", "3", "4"]}
                          onChange={setTreatmentArms}
                          className="w-[154px]"
                        />
                      </div>

         

                      {/* Randomization Ratio */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-body5 text-[#5f5e5e]">Randomization Ratio</span>
                          <span className="text-body5 text-[#3609a1]">*</span>
                        </div>
                        <Select
                          value={randomizationRatio}
                          options={["1:1", "2:1", "3:1", "1:2"]}
                          onChange={setRandomizationRatio}
                          className="w-[154px]"
                        />
                      </div>

         

                      {/* Subpopulation */}
                      <div className="flex items-center justify-between">
                        <span className="text-body5 text-[#5f5e5e]">Subpopulation</span>
                        <Select
                          value={subpopulation}
                          options={["All", "Subgroup A", "Subgroup B"]}
                          onChange={setSubpopulation}
                          className="w-[154px]"
                        />
                      </div>
                      </div>
                    </div>

                    {/* Active Data */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
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
                              stroke="#111111"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-body4 text-[#111111]">Active Data</span>
                        </div>
                        <Select
                          value={activeData}
                          options={["Oprimed data", "Historical data", "Synthetic data"]}
                          onChange={setActiveData}
                        />
                      </div>
                    </div>

                      {/* Apply Button */}
                      <Button
                        variant="orange"
                        size="md"
                        icon="play"
                        iconPosition="right"
                        onClick={() => setIsApplied(true)}
                        className="self-end h-[30px] text-body4"
                      >
                        Apply
                      </Button>
                      </div>
                    </SimpleBar>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Frame 1272632515 */}
          <div className="w-[1375px] flex-shrink-0">
            <div
              className="relative rounded-[36px] overflow-hidden w-[1375px] h-[880px]"
              style={{
                backgroundImage: 'url(/assets/main/card-bg-large2.png)',
                backgroundSize: '1375px 880px',
                backgroundPosition: '0 0',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="flex flex-col w-full h-full p-[12px]">
                {/* Top Section - Tab Bar and Legend */}
                <div className="flex items-center justify-between mb-4 px-[12px]">
                  {/* Tab Bar */}
                  <div className="bg-white rounded-full p-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("compare")}
                        className={`px-[18px] py-[10px] rounded-full transition-all ${
                          activeTab === "compare"
                            ? "bg-[#231f52] text-white text-body4m"
                            : "text-[#484646] text-body4"
                        }`}
                      >
                        Compare View
                      </button>
                      <button
                        onClick={() => setActiveTab("reduction")}
                        className={`px-[18px] py-[10px] rounded-full transition-all ${
                          activeTab === "reduction"
                            ? "bg-[#231f52] text-white text-body4m"
                            : "text-[#484646] text-body4"
                        }`}
                      >
                        Reduction View
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#f06600] flex-shrink-0" />
                      <span className="text-[15px] font-semibold text-[#f06600] leading-[16.5px] tracking-[-0.75px]">
                        OPTIVIS NEXUS
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#231f52] flex-shrink-0" />
                      <span className="text-[15px] font-semibold text-[#231f52] leading-[16.5px] tracking-[-0.75px]">
                        Traditional Design
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex gap-4 min-h-0">
                  {/* Left Area - Smaller Sample, Smaller N to screen, Lower cost */}
                  <div className="w-[889px] flex-shrink-0 flex flex-col gap-4">
                    {/* Smaller Sample Card */}
                    <div
                      className="rounded-[18px] overflow-hidden flex-1 min-h-0"
                      style={{
                        background: "#262255",
                      }}
                    >
                      <div className="flex flex-col w-full h-full p-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-body1m text-[#fafafa]">
                              Smaller Sample
                            </h3>
                            <p className="text-body4 text-[#fafafa]">
                              Sample Size vs CI Width
                            </p>
                            {isApplied && (
                              <p className="text-h0 text-[#fafafa] mt-1">
                                {simulationData.smallerSample.percentage}
                              </p>
                            )}
                          </div>
                          {isApplied && <FullscreenIcon backgroundColor="#1c1942" />}
                        </div>
                        {/* Chart Area */}
                        <div className="mt-auto bg-[#f8f8f8] rounded-[12px] border border-white" style={{ height: 'auto', minHeight: '280px' }}>
                          {isApplied ? (
                            <ReactECharts
                              option={{
                                grid: { left: 60, right: 20, top: 20, bottom: 50 },
                                xAxis: {
                                  type: 'value',
                                  name: 'Sample Size',
                                  nameLocation: 'middle',
                                  nameGap: 30,
                                  nameTextStyle: { fontSize: 12, color: '#666' },
                                  axisLine: { lineStyle: { color: '#999' } },
                                  splitLine: { show: false }
                                },
                                yAxis: {
                                  type: 'value',
                                  name: 'CI Width',
                                  nameLocation: 'middle',
                                  nameGap: 40,
                                  nameTextStyle: { fontSize: 12, color: '#666' },
                                  axisLine: { lineStyle: { color: '#999' } },
                                  splitLine: { show: true, lineStyle: { color: '#e0e0e0', type: 'dashed' } }
                                },
                                series: [
                                  {
                                    name: 'OPTIVIS',
                                    type: 'line',
                                    data: simulationData.smallerSample.chartData.optivis,
                                    lineStyle: { color: '#f06600', width: 2 },
                                    symbol: 'circle',
                                    symbolSize: 6,
                                    itemStyle: { color: '#f06600' },
                                    smooth: true
                                  },
                                  {
                                    name: 'Traditional',
                                    type: 'line',
                                    data: simulationData.smallerSample.chartData.traditional,
                                    lineStyle: { color: '#231f52', width: 2 },
                                    symbol: 'circle',
                                    symbolSize: 6,
                                    itemStyle: { color: '#231f52' },
                                    smooth: true
                                  }
                                ],
                                tooltip: {
                                  trigger: 'axis',
                                  axisPointer: { type: 'cross' }
                                }
                              }}
                              style={{ height: '100%', width: '100%' }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Two Cards */}
                    <div className="flex gap-4 h-[276px]">
                      {/* Smaller N to screen Card */}
                      <div
                        className="w-[436.5px] flex-shrink-0 rounded-[24px] overflow-hidden"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        <div className="flex flex-col w-full h-full p-4">
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-col gap-1">
                              <h3 className="text-body4 text-[#262625]">
                                Smaller N to screen
                              </h3>
                              <p className="text-small1 text-[#262625]">
                                {isApplied ? simulationData.smallerNToScreen.subtitle : "at the same Power"}
                              </p>
                              {isApplied && (
                                <div className="flex items-center gap-1 mt-1">
                                  <ArrowIcon direction="down" color="#231F52" />
                                  <p className="text-h4 text-[#262625]">
                                    {simulationData.smallerNToScreen.percentage}
                                  </p>
                                </div>
                              )}
                            </div>
                            {isApplied && <FullscreenIcon />}
                          </div>
                          {/* Chart Area */}
                          <div className="mt-auto bg-white/60 rounded-[12px]" style={{ height: '148px' }}>
                            {isApplied ? (
                              <ReactECharts
                                option={{
                                  grid: { left: 50, right: 20, top: 20, bottom: 40 },
                                  xAxis: {
                                    type: 'value',
                                    name: 'Enrollment Time',
                                    nameLocation: 'middle',
                                    nameGap: 25,
                                    nameTextStyle: { fontSize: 10, color: '#666' },
                                    axisLine: { lineStyle: { color: '#999' } },
                                    splitLine: { show: false }
                                  },
                                  yAxis: {
                                    type: 'value',
                                    name: 'Power',
                                    nameLocation: 'middle',
                                    nameGap: 30,
                                    nameTextStyle: { fontSize: 10, color: '#666' },
                                    axisLine: { lineStyle: { color: '#999' } },
                                    splitLine: { show: true, lineStyle: { color: '#e0e0e0', type: 'dashed' } }
                                  },
                                  series: [
                                    {
                                      name: 'OPTIVIS',
                                      type: 'line',
                                      data: simulationData.smallerNToScreen.chartData.optivis,
                                      lineStyle: { color: '#f06600', width: 2 },
                                      symbol: 'circle',
                                      symbolSize: 4,
                                      itemStyle: { color: '#f06600' },
                                      smooth: true
                                    },
                                    {
                                      name: 'Traditional',
                                      type: 'line',
                                      data: simulationData.smallerNToScreen.chartData.traditional,
                                      lineStyle: { color: '#231f52', width: 2 },
                                      symbol: 'circle',
                                      symbolSize: 4,
                                      itemStyle: { color: '#231f52' },
                                      smooth: true
                                    }
                                  ],
                                  tooltip: {
                                    trigger: 'axis',
                                    axisPointer: { type: 'cross' }
                                  }
                                }}
                                style={{ height: '100%', width: '100%' }}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Lower cost Card */}
                      <div
                        className="w-[436.5px] flex-shrink-0 rounded-[24px] overflow-hidden"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        <div className="flex flex-col w-full h-full p-4">
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-col gap-1">
                              <h3 className="text-body4 text-[#262625]">
                                Lower cost
                              </h3>
                              <p className="text-small1 text-[#262625]">
                                {isApplied ? simulationData.lowerCost.subtitle : "at the same sample size"}
                              </p>
                              {isApplied && (
                                <div className="flex items-center gap-1  mt-1">
                                  <ArrowIcon direction="down" color="#231F52" />
                                  <p className="text-h4 text-[#262625]">
                                    {simulationData.lowerCost.percentage}
                                  </p>
                                </div>
                              )}
                            </div>
                            {isApplied && <FullscreenIcon />}
                          </div>
                          {/* Chart Area */}
                          <div className="mt-auto bg-white/60 rounded-[12px]" style={{ height: '148px' }}>
                            {isApplied ? (
                              <ReactECharts
                                option={{
                                  grid: { left: 40, right: 15, top: 15, bottom: 30 },
                                  xAxis: {
                                    type: 'value',
                                    name: 'Sample Size',
                                    nameLocation: 'middle',
                                    nameGap: 25,
                                    nameTextStyle: { fontSize: 10, color: '#666' },
                                    axisLine: { lineStyle: { color: '#999' } },
                                    splitLine: { show: false }
                                  },
                                  yAxis: {
                                    type: 'value',
                                    name: 'Cost',
                                    nameLocation: 'middle',
                                    nameGap: 30,
                                    nameTextStyle: { fontSize: 10, color: '#666' },
                                    axisLine: { lineStyle: { color: '#999' } },
                                    splitLine: { show: true, lineStyle: { color: '#e0e0e0', type: 'dashed' } }
                                  },
                                  series: [
                                    {
                                      name: 'OPTIVIS',
                                      type: 'line',
                                      data: simulationData.lowerCost.chartData.optivis,
                                      lineStyle: { color: '#f06600', width: 2 },
                                      symbol: 'circle',
                                      symbolSize: 4,
                                      itemStyle: { color: '#f06600' },
                                      smooth: true
                                    },
                                    {
                                      name: 'Traditional',
                                      type: 'line',
                                      data: simulationData.lowerCost.chartData.traditional,
                                      lineStyle: { color: '#231f52', width: 2 },
                                      symbol: 'circle',
                                      symbolSize: 4,
                                      itemStyle: { color: '#231f52' },
                                      smooth: true
                                    }
                                  ],
                                  tooltip: {
                                    trigger: 'axis',
                                    axisPointer: { type: 'cross' }
                                  }
                                }}
                                style={{ height: '100%', width: '100%' }}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Area - OPTIVIS NEXUS vs Traditional Design, Reduction View */}
                  <div className="w-[446px] flex-shrink-0 flex flex-col gap-4">
                    {/* OPTIVIS NEXUS vs Traditional Design Card */}
                    <div className="bg-white rounded-[24px] flex flex-col" style={{ height: '396px' }}>
                      {/* Title */}
                      <div className="px-4 pt-4 pb-3 flex-shrink-0">
                        <h3 className="text-body2 text-[#1c1b1c]">
                          OPTIVIS NEXUS vs Traditional Design
                        </h3>
                      </div>

                      {/* Table Content */}
                      <div className="flex flex-col px-4 pb-4 mt-auto">
                        {/* Header */}
                        <div className="flex items-end mb-0 flex-shrink-0 border-b border-[#c6c5c9] pb-3">
                          <div className="flex-1">
                       
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1 w-[98px]">
                              <span className="text-body5m text-[#f06600]">
                                OPTIVIS
                              </span>
                              <InfoIcon className="flex-shrink-0" color="#f06600" />
                            </div>
                            <div className="flex items-center gap-1 w-[98px]">
                              <span className="text-body5m text-[#231f52]">
                                Traditional
                              </span>
                              <InfoIcon className="flex-shrink-0" color="#231f52" />
                            </div>
                          </div>
                        </div>

                        {/* Table Rows */}
                        <div className="flex flex-col gap-0">
                          {/* Enrollment Row */}
                          <div className="flex items-end border-b border-[#c6c5c9] py-3 flex-shrink-0">
                            <div className="flex-1 flex items-center">
                              <div className="flex flex-col">
                                <span className="text-body5 text-[#464747]">
                                  Enrollment
                                </span>
                                <span className="text-small1 text-[#929090]">
                                  Est. Enrollment Period in Months
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-4 items-end">
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#f06600]">
                                  {isApplied ? simulationData.comparisonTable.enrollment.optivis : "-"}
                                </span>
                              </div>
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#231f52]">
                                  {isApplied ? simulationData.comparisonTable.enrollment.traditional : "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Primary Endpoint Power Row */}
                          <div className="flex items-end border-b border-[#c6c5c9] py-3 flex-shrink-0">
                            <div className="flex-1 flex items-center">
                              <div className="flex flex-col">
                                <span className="text-body5 text-[#464747]">
                                  Primary Endpoint Power
                                </span>
                                <span className="text-small1 text-[#929090]">
                                  ADAS-Cog Total Score
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-4 items-end">
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#f06600]">
                                  {isApplied ? simulationData.comparisonTable.primaryEndpointPower.optivis : "-"}
                                </span>
                              </div>
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#231f52]">
                                  {isApplied ? simulationData.comparisonTable.primaryEndpointPower.traditional : "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Secondary Endpoint Power Row */}
                          <div className="flex items-end border-b border-[#c6c5c9] py-3 flex-shrink-0">
                            <div className="flex-1 flex items-center">
                              <div className="flex flex-col">
                                <span className="text-body5 text-[#464747]">
                                  Secondary Endpoint Power
                                </span>
                                <span className="text-small1 text-[#929090]">
                                  CDR Total Score
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-4 items-end">
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#f06600]">
                                  {isApplied ? simulationData.comparisonTable.secondaryEndpointPower.optivis : "-"}
                                </span>
                              </div>
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#231f52]">
                                  {isApplied ? simulationData.comparisonTable.secondaryEndpointPower.traditional : "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Sample Size Row */}
                          <div className="flex items-end py-3 flex-shrink-0">
                            <div className="flex-1 flex items-start">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-body5 text-[#464747]">
                                    Sample Size
                                  </span>
                                  <InfoIcon className="flex-shrink-0" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-small1 text-[#929090]">
                                    Treatment Group 1
                                  </span>
                                  <span className="text-small1 text-[#929090]">
                                    Control Group
                                  </span>
                                  <span className="text-small1 text-[#929090]">
                                    Total
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 items-end">
                              <div className="w-[98px] flex flex-col gap-1">
                                <span className="text-body5 text-[#f06600]">
                                  {isApplied ? simulationData.comparisonTable.sampleSize.optivis.treatmentGroup1 : "-"}
                                </span>
                                <span className="text-body5 text-[#f06600]">
                                  {isApplied ? simulationData.comparisonTable.sampleSize.optivis.controlGroup : "-"}
                                </span>
                                <span className="text-body5 text-[#f06600]">
                                  {isApplied ? simulationData.comparisonTable.sampleSize.optivis.total : "-"}
                                </span>
                              </div>
                              <div className="w-[98px] flex flex-col gap-1">
                                <span className="text-body5 text-[#231f52]">
                                  {isApplied ? simulationData.comparisonTable.sampleSize.traditional.treatmentGroup1 : "-"}
                                </span>
                                <span className="text-body5 text-[#231f52]">
                                  {isApplied ? simulationData.comparisonTable.sampleSize.traditional.controlGroup : "-"}
                                </span>
                                <span className="text-body5 text-[#231f52]">
                                  {isApplied ? simulationData.comparisonTable.sampleSize.traditional.total : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reduction View Card */}
                    <div className="bg-white rounded-[24px] flex flex-col" style={{ height: '394px' }}>
                      {/* Title */}
                      <div className="px-4 pt-4 pb-3 flex-shrink-0">
                        <h3 className="text-body2 text-[#1c1b1c]">
                          Reduction View
                        </h3>
                      </div>

                      {/* Reduction View Content */}
                      <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
                        {isApplied ? (
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {simulationData.reductionView.charts.map((chart, index) => (
                              <div key={index} className="flex flex-col gap-2">
                                <span className="text-body5 text-[#464747]">{chart.label}</span>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <div className="mt-1">
                                      <ArrowIcon direction="down" color="#231F52" />
                                    </div>
                                    <span className="text-body1m text-[#464747]">{chart.change}</span>
                                  </div>
                                  <FullscreenIcon />
                                </div>
                                <div style={{ height: '80px', width: '100%' }}>
                                  <ReactECharts
                                    option={{
                                      grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                      xAxis: { 
                                        show: false,
                                        type: 'category',
                                        data: ['']
                                      },
                                      yAxis: { 
                                        show: false,
                                        type: 'value',
                                        max: Math.max(chart.optivis, chart.traditional) * 1.2
                                      },
                                      series: [
                                        {
                                          type: 'bar',
                                          data: [chart.optivis],
                                          itemStyle: { color: '#f06600', borderRadius: [4, 4, 0, 0] },
                                          barWidth: '45%',
                                          barGap: '10%',
                                          label: {
                                            show: true,
                                            position: 'insideTop',
                                            formatter: `${chart.optivis}${chart.label === 'Cost' ? 'M' : ''}`,
                                            color: '#ffffff',
                                            fontSize: 12,
                                            fontWeight: 'bold'
                                          }
                                        },
                                        {
                                          type: 'bar',
                                          data: [chart.traditional],
                                          itemStyle: { color: '#231f52', borderRadius: [4, 4, 0, 0] },
                                          barWidth: '45%',
                                          label: {
                                            show: true,
                                            position: 'insideTop',
                                            formatter: `${chart.traditional}${chart.label === 'Cost' ? 'M' : ''}`,
                                            color: '#ffffff',
                                            fontSize: 12,
                                            fontWeight: 'bold'
                                          }
                                        }
                                      ],
                                      tooltip: { show: false },
                                      legend: { show: false }
                                    }}
                                    style={{ height: '100%', width: '100%' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 bg-[#f8f8f8] rounded-[12px] border border-[#e5e5e5]">
                            {/* Empty state */}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
