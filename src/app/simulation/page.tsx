"use client";

import { useMemo, useEffect } from "react";
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
import { callMLStudyDesign, type StudyParameters, type PrimaryEndpointData, type SecondaryEndpointData } from "@/services/studyService";
import { useProcessedStudyData } from "@/hooks/useProcessedStudyData";
import { useSimulationStore } from "@/store/simulationStore";
import { SmallerSampleChart } from "@/components/charts/SmallerSampleChart";
import { SmallerNToScreenChart } from "@/components/charts/SmallerNToScreenChart";
import { LowerCostChart } from "@/components/charts/LowerCostChart";
import { FormulaTooltip } from "@/components/math/FormulaTooltip";
import ReactECharts from "echarts-for-react";
import { Loading } from "@/components/common/Loading";

export default function SimulationPage() {
  // Zustand store에서 상태 가져오기
  const {
    activeTab,
    isApplied,
    sampleSizeControl,
    disease,
    primaryEndpoint,
    primaryEffectSize,
    secondaryEndpoint,
    secondaryEffectSize,
    nominalPower,
    treatmentDuration,
    hypothesisType,
    treatmentArms,
    randomizationRatio,
    subpopulation,
    activeData,
    apiData,
    isLoading,
    error,
    setActiveTab,
    setIsApplied,
    setSampleSizeControl,
    setDisease,
    setPrimaryEndpoint,
    setPrimaryEffectSize,
    setSecondaryEndpoint,
    setSecondaryEffectSize,
    setNominalPower,
    setTreatmentDuration,
    setHypothesisType,
    setTreatmentArms,
    setRandomizationRatio,
    setSubpopulation,
    setActiveData,
    setApiData,
    setIsLoading,
    setError,
    reset,
  } = useSimulationStore();

  // 페이지 로드 시 상태 초기화
  useEffect(() => {
    // 새로고침 시 API 데이터와 적용 상태 초기화
    // reset 함수를 사용하여 전체 상태 초기화
    if (typeof window !== 'undefined') {
      reset();
    }
  }, [reset]); // reset 함수를 의존성에 추가

  // Sample Size Control 값을 x축 값으로 변환하는 함수
  const getHighlightXValue = (optivisData: number[][]) => {
    if (!optivisData || optivisData.length === 0) return undefined;
    
    const minX = Math.min(...optivisData.map(d => d[0]));
    const maxX = Math.max(...optivisData.map(d => d[0]));
    
    // sampleSizeControl (0~1)을 x축 범위로 매핑
    return minX + (maxX - minX) * sampleSizeControl;
  };

  // API 데이터 처리
  const optivisData = apiData?.OPTIVIS || [];
  const traditionalData = apiData?.Traditional || [];

  const {
    filteredData,
    chartData,
    defaultPowerIndex,
  } = useProcessedStudyData(optivisData, traditionalData, nominalPower);

  // 하이라이트된 포인트의 실제 데이터를 찾는 함수
  const findHighlightedData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    // Chart 1 데이터 (Sample Size vs N to Screen)를 사용하여 하이라이트 포인트 찾기
    // 필터링된 데이터가 비어있으면 원본 데이터 사용
    const chart1Optivis = chartData.chart1Data.optivis.length > 0
      ? chartData.chart1Data.optivis
      : optivisData.map(item => [item.total_patient, item.n_to_screen]);
    if (chart1Optivis.length === 0) return null;

    const highlightX = getHighlightXValue(chart1Optivis);
    if (highlightX === undefined) return null;

    // OPTIVIS에서 가장 가까운 포인트 찾기
    let optivisIndex = 0;
    let minDiff = Math.abs(chart1Optivis[0][0] - highlightX);
    for (let i = 1; i < chart1Optivis.length; i++) {
      const diff = Math.abs(chart1Optivis[i][0] - highlightX);
      if (diff < minDiff) {
        minDiff = diff;
        optivisIndex = i;
      }
    }

    // Traditional에서 같은 y값(n_to_screen)에 가장 가까운 포인트 찾기
    const optivisY = chart1Optivis[optivisIndex][1];
    const chart1Traditional = chartData.chart1Data.traditional;
    
    // Traditional 데이터가 없으면 OPTIVIS만 반환
    if (chart1Traditional.length === 0 || traditionalData.length === 0) {
      const optivisPoint = filteredData.optivis.length > 0 
        ? filteredData.optivis[optivisIndex]
        : optivisData[optivisIndex];
      if (!optivisPoint) return null;
      
      return {
        optivis: optivisPoint,
        traditional: null,
      };
    }

    let traditionalIndex = 0;
    let minYDiff = Math.abs(chart1Traditional[0][1] - optivisY);
    for (let i = 1; i < chart1Traditional.length; i++) {
      const diff = Math.abs(chart1Traditional[i][1] - optivisY);
      if (diff < minYDiff) {
        minYDiff = diff;
        traditionalIndex = i;
      }
    }

    const optivisPoint = filteredData.optivis.length > 0
      ? filteredData.optivis[optivisIndex]
      : optivisData[optivisIndex];
    const traditionalPoint = filteredData.traditional.length > 0
      ? filteredData.traditional[traditionalIndex]
      : traditionalData[traditionalIndex];

    if (!optivisPoint) return null;

    return {
      optivis: optivisPoint,
      traditional: traditionalPoint,
    };
  }, [apiData, sampleSizeControl, chartData, filteredData]);

  // 슬라이더 값에 따라 동적으로 계산된 데이터
  const dynamicSimulationData = useMemo(() => {
    if (!findHighlightedData) {
      return null;
    }

    const { optivis, traditional } = findHighlightedData;

    // Traditional 데이터가 없으면 OPTIVIS 데이터만 반환
    if (!traditional) {
      return {
        topMetrics: {
          nToScreen: optivis.n_to_screen.toLocaleString(),
          sampleSize: optivis.total_patient.toLocaleString(),
          enrollment: optivis.enrollment.toFixed(2),
          primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(1),
          secondaryEndpointPower: optivis.secondary_endpoint_power 
            ? (optivis.secondary_endpoint_power * 100).toFixed(1)
            : "0.0",
          estimatedCostReduction: "-",
          gaugeValue: optivis.primary_endpoint_power,
          gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`
        },
        smallerSample: {
          percentage: "-",
          chartData: {
            optivis: chartData.chart1Data.optivis,
            traditional: chartData.chart1Data.traditional,
          }
        },
        smallerNToScreen: {
          percentage: "-",
          subtitle: "Enrollment Time vs Power",
          chartData: {
            optivis: chartData.chart2Data.optivis,
            traditional: chartData.chart2Data.traditional,
          }
        },
        lowerCost: {
          percentage: "-",
          subtitle: "Sample Size vs Cost",
          chartData: {
            optivis: chartData.chart3Data.optivis,
            traditional: chartData.chart3Data.traditional,
          }
        },
        comparisonTable: {
          enrollment: {
            optivis: optivis.enrollment.toFixed(2),
            traditional: "-"
          },
          primaryEndpointPower: {
            optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
            traditional: "-"
          },
          secondaryEndpointPower: {
            optivis: optivis.secondary_endpoint_power 
              ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
              : "0.0%",
            traditional: "-"
          },
          sampleSize: {
            optivis: {
              treatmentGroup1: optivis.treatment_group_1?.toString() || "0",
              controlGroup: optivis.control_group?.toString() || "0",
              total: optivis.total_patient.toString()
            },
            traditional: {
              treatmentGroup1: "-",
              controlGroup: "-",
              total: "-"
            }
          }
        },
        reductionView: {
          charts: [
            {
              label: 'Sample Size',
              change: "-",
              optivis: optivis.total_patient,
              traditional: 0
            },
            {
              label: 'Power',
              change: "-",
              optivis: Math.round(optivis.primary_endpoint_power * 100),
              traditional: 0
            },
            {
              label: 'Enrollment Time',
              change: "-",
              optivis: Math.round(optivis.enrollment),
              traditional: 0
            },
            {
              label: 'Cost',
              change: "-",
              optivis: Math.round(optivis.cost / 1000000),
              traditional: 0
            }
          ]
        }
      };
    }

    // Percentage 계산 (Smaller Sample, Smaller N to Screen, Lower Cost)
    // Smaller Sample: (Traditional total_patient - OPTIVIS total_patient) / Traditional total_patient * 100
    const smallerSamplePct = ((traditional.total_patient - optivis.total_patient) / traditional.total_patient * 100).toFixed(0).padStart(3, '0');
    
    // Smaller N to Screen: (Traditional n_to_screen - OPTIVIS n_to_screen) / Traditional n_to_screen * 100
    const smallerNToScreenPct = ((traditional.n_to_screen - optivis.n_to_screen) / traditional.n_to_screen * 100).toFixed(1);
    
    // Lower Cost: (Traditional cost - OPTIVIS cost) / Traditional cost * 100
    const lowerCostPct = ((traditional.cost - optivis.cost) / traditional.cost * 100).toFixed(0).padStart(3, '0');

    // Reduction 계산 (Reduction View용)
    const sampleSizeReduction = ((traditional.total_patient - optivis.total_patient) / traditional.total_patient * 100).toFixed(0);
    const enrollmentReduction = ((traditional.enrollment - optivis.enrollment) / traditional.enrollment * 100).toFixed(1);
    const costReduction = ((traditional.cost - optivis.cost) / traditional.cost * 100).toFixed(0);
    const costReductionValue = ((traditional.cost - optivis.cost) / 1000000).toFixed(1);

    return {
      topMetrics: {
        nToScreen: optivis.n_to_screen.toLocaleString(),
        sampleSize: optivis.total_patient.toLocaleString(),
        enrollment: optivis.enrollment.toFixed(2),
        primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(1),
        secondaryEndpointPower: optivis.secondary_endpoint_power 
          ? (optivis.secondary_endpoint_power * 100).toFixed(1)
          : "0.0",
        estimatedCostReduction: costReduction,
        gaugeValue: optivis.primary_endpoint_power,
        gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`
      },
      smallerSample: {
        percentage: `${smallerSamplePct}%`,
        chartData: {
          optivis: chartData.chart1Data.optivis,
          traditional: chartData.chart1Data.traditional,
        }
      },
      smallerNToScreen: {
        percentage: `${smallerNToScreenPct}%`,
        subtitle: "Enrollment Time vs Power",
        chartData: {
          optivis: chartData.chart2Data.optivis,
          traditional: chartData.chart2Data.traditional,
        }
      },
      lowerCost: {
        percentage: `${lowerCostPct}%`,
        subtitle: "Sample Size vs Cost",
        chartData: {
          optivis: chartData.chart3Data.optivis,
          traditional: chartData.chart3Data.traditional,
        }
      },
      comparisonTable: {
        // OPTIVIS vs Traditional 데이터 직접 사용
        enrollment: {
          optivis: optivis.enrollment.toFixed(2),
          traditional: traditional.enrollment.toFixed(2)
        },
        primaryEndpointPower: {
          optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
          traditional: `${(traditional.primary_endpoint_power * 100).toFixed(1)}%`
        },
        secondaryEndpointPower: {
          optivis: optivis.secondary_endpoint_power 
            ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
          traditional: traditional.secondary_endpoint_power
            ? `${(traditional.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%"
        },
        sampleSize: {
          optivis: {
            treatmentGroup1: optivis.treatment_group_1?.toString() || "0",
            controlGroup: optivis.control_group?.toString() || "0",
            total: optivis.total_patient.toString()
          },
          traditional: {
            treatmentGroup1: traditional.treatment_group_1?.toString() || "0",
            controlGroup: traditional.control_group?.toString() || "0",
            total: traditional.total_patient.toString()
          }
        }
      },
      reductionView: {
        // Reduction View Bar Chart 데이터 - OPTIVIS vs Traditional 직접 사용
        charts: [
          {
            label: 'Sample Size',
            change: `${sampleSizeReduction}%`,
            optivis: optivis.total_patient,
            traditional: traditional.total_patient
          },
          {
            label: 'Power',
            change: optivis.primary_endpoint_power >= traditional.primary_endpoint_power ? 'No loss' : `${((traditional.primary_endpoint_power - optivis.primary_endpoint_power) * 100).toFixed(1)}%`,
            optivis: Math.round(optivis.primary_endpoint_power * 100),
            traditional: Math.round(traditional.primary_endpoint_power * 100)
          },
          {
            label: 'Enrollment Time',
            change: `${enrollmentReduction}%`,
            optivis: Math.round(optivis.enrollment),
            traditional: Math.round(traditional.enrollment)
          },
          {
            label: 'Cost',
            change: `$${costReductionValue}M`,
            optivis: Math.round(optivis.cost / 1000000),
            traditional: Math.round(traditional.cost / 1000000)
          }
        ]
      }
    };
  }, [findHighlightedData, chartData, filteredData]);

  // 동적 데이터 사용 (슬라이더 값에 따라 업데이트됨)
  // API 데이터가 있을 때만 실제 데이터 사용
  const simulationData = (apiData && dynamicSimulationData) ? dynamicSimulationData : null;


  // API 데이터를 차트 형식으로 변환 (Traditional 데이터가 없어도 OPTIVIS만으로 그래프 그리기)
  const apiChartData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    // 필터링된 데이터가 비어있으면 원본 데이터 사용
    const chart1Optivis = chartData.chart1Data.optivis.length > 0 
      ? chartData.chart1Data.optivis 
      : optivisData.map(item => [item.total_patient, item.n_to_screen]);
    const chart1Traditional = chartData.chart1Data.traditional.length > 0
      ? chartData.chart1Data.traditional
      : traditionalData.map(item => [item.total_patient, item.n_to_screen]);

    const chart2Optivis = chartData.chart2Data.optivis.length > 0
      ? chartData.chart2Data.optivis
      : optivisData.map(item => [item.enrollment, item.primary_endpoint_power]);
    const chart2Traditional = chartData.chart2Data.traditional.length > 0
      ? chartData.chart2Data.traditional
      : traditionalData.map(item => [item.enrollment, item.primary_endpoint_power]);

    const chart3Optivis = chartData.chart3Data.optivis.length > 0
      ? chartData.chart3Data.optivis
      : optivisData.map(item => [item.total_patient, item.cost / 1000000]);
    const chart3Traditional = chartData.chart3Data.traditional.length > 0
      ? chartData.chart3Data.traditional
      : traditionalData.map(item => [item.total_patient, item.cost / 1000000]);

    return {
      smallerSample: {
        optivis: chart1Optivis,
        traditional: chart1Traditional,
      },
      smallerNToScreen: {
        optivis: chart2Optivis,
        traditional: chart2Traditional,
      },
      lowerCost: {
        optivis: chart3Optivis,
        traditional: chart3Traditional,
      },
    };
  }, [apiData, chartData, optivisData, traditionalData]);

  // 차트에 사용할 데이터 (API 데이터가 있을 때만 사용)
  const chartDataToUse = apiChartData;

  // Primary Endpoint를 API 형식으로 변환
  const convertPrimaryEndpoint = (endpoint: string): string => {
    const endpointMap: Record<string, string> = {
      "ADAS Cog 11": "ADTOT70",
      "MMSE": "MMTOTSCORE",
      "CDR": "CDTOTSCORE",
    };
    return endpointMap[endpoint] || endpoint;
  };

  // API 호출 함수
  const handleApplySettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primary 데이터 구성
      const primaryData: PrimaryEndpointData = {
        no: 1,
        outcome: [convertPrimaryEndpoint(primaryEndpoint)],
        type: ["Continous"], // 기본값: Continous (UI에서 선택 가능하도록 확장 가능)
        effect_size: [primaryEffectSize],
        target_power: [nominalPower],
        statistical_method: "ANCOVA", // 기본값: ANCOVA
        multiplicity: "Bonferroni", // 기본값: Bonferroni
        endpoint_objectives: ["Confirmatory"], // 기본값: ["Confirmatory"]
        alpha: 0.05, // 기본값: 0.05
      };

      // Secondary 데이터 구성 (항상 포함)
      const secondaryData: SecondaryEndpointData = {
        no: 1,
        outcome: secondaryEndpoint 
          ? [convertPrimaryEndpoint(secondaryEndpoint)]
          : [convertPrimaryEndpoint(primaryEndpoint)], // secondaryEndpoint가 없으면 primary와 동일하게
        type: ["Continous"],
        effect_size: [secondaryEffectSize],
        target_power: [nominalPower],
        statistical_method: "ANCOVA",
        multiplicity: "Bonferroni",
        endpoint_objectives: ["Confirmatory"],
        alpha: 0.05,
      };

      // treatment_duration 검증 및 변환 (3의 배수, >0, 정수)
      const durationValue = parseInt(treatmentDuration.replace(" months", ""), 10);
      if (isNaN(durationValue) || durationValue <= 0 || durationValue % 3 !== 0) {
        throw new Error("Treatment Duration은 3의 배수인 양수여야 합니다.");
      }

      const parameters: StudyParameters = {
        disease_area:"Alzheimer",
        treatment_duration: durationValue,
        treatment_arms: parseInt(treatmentArms, 10),
        randomization_ratio: randomizationRatio,
        stratification: false, // 기본값: false
        hypothesis_type: hypothesisType,
        subpopulation: subpopulation,
        primary: [primaryData],
        secondary: [secondaryData], // 항상 포함
      };

      const response = await callMLStudyDesign(parameters);
      
      // API 응답에서 데이터 추출
      console.log("전체 API 응답:", JSON.stringify(response, null, 2));
      
      const manageResult = response.data?.table_results?.manage_result as any;
      console.log("manageResult:", JSON.stringify(manageResult, null, 2));
      console.log("manageResult 키들:", manageResult ? Object.keys(manageResult) : "null");
      
      if (manageResult) {
        // API 응답 키는 모두 대문자: TRADITIONAL, OPTIVIS
        const optivisData = manageResult.OPTIVIS || [];
        const traditionalData = manageResult.TRADITIONAL || [];
        const resultFormula = response.data?.table_results?.result_formula;
        
        console.log("API 응답 데이터:", {
          manageResultKeys: Object.keys(manageResult),
          optivisCount: optivisData.length,
          traditionalCount: traditionalData.length,
          optivisSample: optivisData[0],
          traditionalSample: traditionalData[0],
          rawTraditional: manageResult.Traditional,
          rawTraditionalLower: manageResult.traditional,
          allKeys: Object.keys(manageResult),
          resultFormula,
        });
        
        setApiData({
          OPTIVIS: Array.isArray(optivisData) ? optivisData : [],
          Traditional: Array.isArray(traditionalData) ? traditionalData : [],
          result_formula: resultFormula,
        });
        setIsApplied(true);
      } else {
        throw new Error("API 응답에 데이터가 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "API 호출에 실패했습니다.");
      console.error("API 호출 오류:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Loading isLoading={isLoading} />
      <AppLayout headerType="simulation">
        <div className="w-full flex flex-col items-center">
        {/* Top Section - Title and Metrics */}
        <div className="w-full flex justify-center mb-2 max-w-full">
          <div className="w-[1772px] flex-shrink-0 mx-auto">
            {/* Title Section */}
            <div className="flex items-start justify-between mb-2 min-w-full">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-[#111111] text-left mb-2">
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
                    {isApplied && simulationData ? simulationData.topMetrics.nToScreen : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    N to Screen
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied && simulationData ? simulationData.topMetrics.sampleSize : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Sample Size
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-h2 text-[#1b1b1b]">
                      {isApplied && simulationData ? simulationData.topMetrics.enrollment : "--"}
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
                    {isApplied && simulationData ? `${simulationData.topMetrics.primaryEndpointPower}%` : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Primary Endpoint Power
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied && simulationData ? `${simulationData.topMetrics.secondaryEndpointPower}%` : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Secondary Endpoint Power
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-h2 text-[#1b1b1b]">
                    {isApplied && simulationData ? `${simulationData.topMetrics.estimatedCostReduction}%` : "--"}
                  </span>
                  <span className="text-body5m text-[#666b73]">
                    Estimated Cost Reduction
                  </span>
                </div>
              </div>

              <Gauge 
                value={isApplied && simulationData ? simulationData.topMetrics.gaugeValue : 0.6} 
                text={isApplied && simulationData ? simulationData.topMetrics.gaugeText : "--"}
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
                  <div className="relative select-none" style={{ userSelect: "none" }}>
                    <div className="h-[12px] rounded-full bg-[#787878]" style={{ opacity: 0.2 }} />
                    <div
                      className="h-[12px] rounded-full absolute top-0 left-0"
                      style={{ width: `${sampleSizeControl * 100}%`, background: "#f26702" }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-[38px] h-[24px] rounded-full bg-white cursor-grab active:cursor-grabbing"
                      style={{ left: `calc(${sampleSizeControl * 100}% - 19px)` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const slider = e.currentTarget.parentElement;
                        if (!slider) return;
                        
                        // 텍스트 선택 방지 함수들
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
                          const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                          setSampleSizeControl(percentage / 100);
                        };
                        
                        const handleMouseUp = (upEvent: MouseEvent) => {
                          upEvent.preventDefault();
                          upEvent.stopPropagation();
                          document.removeEventListener("mousemove", handleMouseMove);
                          document.removeEventListener("mouseup", handleMouseUp);
                          document.removeEventListener("selectstart", preventSelect);
                          document.removeEventListener("select", preventSelect);
                          document.removeEventListener("dragstart", preventDrag);
                          
                          // 원래 스타일 복원
                          const bodyStyle = document.body.style as any;
                          const originalUserSelect = bodyStyle.userSelect;
                          const originalWebkitUserSelect = bodyStyle.webkitUserSelect;
                          const originalMozUserSelect = bodyStyle.mozUserSelect;
                          const originalMsUserSelect = bodyStyle.msUserSelect;
                          
                          bodyStyle.userSelect = originalUserSelect;
                          bodyStyle.webkitUserSelect = originalWebkitUserSelect;
                          bodyStyle.mozUserSelect = originalMozUserSelect;
                          bodyStyle.msUserSelect = originalMsUserSelect;
                          document.body.classList.remove("no-select");
                        };
                        
                        // 전역 텍스트 선택 차단
                        const bodyStyle = document.body.style as any;
                        const originalUserSelect = bodyStyle.userSelect;
                        const originalWebkitUserSelect = bodyStyle.webkitUserSelect;
                        const originalMozUserSelect = bodyStyle.mozUserSelect;
                        const originalMsUserSelect = bodyStyle.msUserSelect;
                        
                        bodyStyle.userSelect = "none";
                        bodyStyle.webkitUserSelect = "none";
                        bodyStyle.mozUserSelect = "none";
                        bodyStyle.msUserSelect = "none";
                        document.body.classList.add("no-select");
                        
                        document.addEventListener("mousemove", handleMouseMove, { passive: false });
                        document.addEventListener("mouseup", handleMouseUp, { passive: false });
                        document.addEventListener("selectstart", preventSelect);
                        document.addEventListener("select", preventSelect);
                        document.addEventListener("dragstart", preventDrag);
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
                        <button className="w-6 h-6 rounded-[8px] bg-[#231f52] flex items-center justify-center cursor-pointer">
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
                            min={0.1}
                            max={10}
                            step={0.1}
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
                            min={0.1}
                            max={10}
                            step={0.1}
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
                          options={["3 months", "6 months", "9 months", "12 months", "15 months", "18 months", "21 months", "24 months"]}
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
                          options={["1", "2", "3"]}
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
                          options={["ALL", "Mild AD", "Moderate AD"]}
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
                        onClick={handleApplySettings}
                        disabled={isLoading}
                        className="self-end h-[30px] text-body4"
                      >
                        {isLoading ? "Loading..." : "Apply"}
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
                        className={`px-[18px] py-[10px] rounded-full transition-all cursor-pointer ${
                          activeTab === "compare"
                            ? "bg-[#231f52] text-white text-body4m"
                            : "text-[#484646] text-body4"
                        }`}
                      >
                        Compare View
                      </button>
                      <button
                        onClick={() => setActiveTab("reduction")}
                        disabled={!isApplied}
                        className={`px-[18px] py-[10px] rounded-full transition-all ${
                          !isApplied
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        } ${
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
                    {activeTab === "compare" ? (
                      /* Smaller Sample Card - Compare View */
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
                                  {simulationData?.smallerSample?.percentage || "--"}
                                </p>
                              )}
                            </div>
                            {isApplied && <FullscreenIcon backgroundColor="#1c1942" />}
                          </div>
                          {/* Chart Area */}
                          <div className="mt-auto bg-[#f8f8f8] rounded-[12px] border border-white" style={{ height: 'auto', minHeight: '280px' }}>
                            {chartDataToUse && chartDataToUse.smallerSample.optivis.length > 0 ? (
                              <SmallerSampleChart
                                optivisData={chartDataToUse.smallerSample.optivis}
                                traditionalData={chartDataToUse.smallerSample.traditional}
                                highlightXValue={getHighlightXValue(chartDataToUse.smallerSample.optivis)}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Sample Size & Power Card - Reduction View */
                      isApplied && simulationData?.reductionView?.charts ? (
                        <div
                          className="rounded-[18px] overflow-hidden flex-1 min-h-0"
                          style={{
                            background: "#262255",
                          }}
                        >
                          <div className="flex flex-col w-full h-full p-4">
                            {/* Card Header */}
                            <div className="flex flex-col gap-1 mb-4">
                              <h3 className="text-body1m text-[#fafafa]">
                                Smaller Sample
                              </h3>
                              <p className="text-body4 text-[#fafafa]">
                                Sample Size vs Power
                              </p>
                              {isApplied && simulationData?.smallerSample?.percentage && (
                                <p className="text-h0 text-[#fafafa] mt-1">
                                  {simulationData.smallerSample.percentage}
                                </p>
                              )}
                            </div>
                            {/* Chart Area */}
                            <div className="mt-auto bg-[#f8f8f8] rounded-[12px] border border-white" style={{ height: 'auto', maxHeight: '280px' }}>
                              <div className="grid grid-cols-2 gap-4 h-full p-4">
                                {/* Sample Size Section */}
                                {simulationData.reductionView.charts.find(c => c.label === 'Sample Size') && (() => {
                                  const chart = simulationData.reductionView.charts.find(c => c.label === 'Sample Size')!;
                                  return (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex flex-col gap-1">
                                          <h4 className="text-body2 text-[#262255]">
                                            {chart.label}
                                          </h4>
                                          <div className="flex items-center gap-1 mt-1">
                                            <ArrowIcon direction="down" color="#231F52" />
                                            <span className="text-h4 text-[#262625]">
                                              {chart.change}
                                            </span>
                                          </div>
                                        </div>
                                        <FullscreenIcon />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Sample Size - OPTIVIS */}
                                        <div className="flex flex-col gap-1">
                                          <div style={{ height: '180px', width: '100%' }}>
                                            <ReactECharts
                                              option={{
                                                grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                                xAxis: { show: false, type: 'category', data: [''] },
                                                yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                                series: [
                                                  { type: 'bar', data: [chart.optivis], itemStyle: { color: '#f06600', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.optivis}`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                                ],
                                                tooltip: { show: false },
                                                legend: { show: false }
                                              }}
                                              style={{ height: '100%', width: '100%' }}
                                            />
                                          </div>
                                        </div>
                                        {/* Sample Size - Traditional */}
                                        <div className="flex flex-col gap-1">
                                          <div style={{ height: '180px', width: '100%' }}>
                                            <ReactECharts
                                              option={{
                                                grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                                xAxis: { show: false, type: 'category', data: [''] },
                                                yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                                series: [
                                                  { type: 'bar', data: [chart.traditional], itemStyle: { color: '#231f52', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.traditional}`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                                ],
                                                tooltip: { show: false },
                                                legend: { show: false }
                                              }}
                                              style={{ height: '100%', width: '100%' }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                                {/* Power Section */}
                                {simulationData.reductionView.charts.find(c => c.label === 'Power') && (() => {
                                  const chart = simulationData.reductionView.charts.find(c => c.label === 'Power')!;
                                  return (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex flex-col gap-1">
                                          <h4 className="text-body2 text-[#262255]">
                                            {chart.label}
                                          </h4>
                                          <div className="flex items-center gap-1 mt-1">
                                            <ArrowIcon direction="down" color="#231F52" />
                                            <span className="text-h4 text-[#262625]">
                                              {chart.change}
                                            </span>
                                          </div>
                                        </div>
                                        <FullscreenIcon />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Power - OPTIVIS */}
                                        <div className="flex flex-col gap-1">
                                          <div style={{ height: '180px', width: '100%' }}>
                                            <ReactECharts
                                              option={{
                                                grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                                xAxis: { show: false, type: 'category', data: [''] },
                                                yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                                series: [
                                                  { type: 'bar', data: [chart.optivis], itemStyle: { color: '#f06600', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.optivis}`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                                ],
                                                tooltip: { show: false },
                                                legend: { show: false }
                                              }}
                                              style={{ height: '100%', width: '100%' }}
                                            />
                                          </div>
                                        </div>
                                        {/* Power - Traditional */}
                                        <div className="flex flex-col gap-1">
                                          <div style={{ height: '180px', width: '100%' }}>
                                            <ReactECharts
                                              option={{
                                                grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                                xAxis: { show: false, type: 'category', data: [''] },
                                                yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                                series: [
                                                  { type: 'bar', data: [chart.traditional], itemStyle: { color: '#231f52', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.traditional}`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                                ],
                                                tooltip: { show: false },
                                                legend: { show: false }
                                              }}
                                              style={{ height: '100%', width: '100%' }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}

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
                            {activeTab === "compare" ? (
                              <>
                                <div className="flex flex-col gap-1">
                                  <h3 className="text-body4 text-[#262625]">
                                    Smaller N to screen
                                  </h3>
                                  <p className="text-small1 text-[#262625]">
                                    {isApplied && simulationData ? simulationData.smallerNToScreen.subtitle : "at the same Power"}
                                  </p>
                                  {isApplied && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <ArrowIcon direction="down" color="#231F52" />
                                      <p className="text-h4 text-[#262625]">
                                        {simulationData?.smallerNToScreen?.percentage || "--"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {isApplied && <FullscreenIcon />}
                              </>
                            ) : (
                              isApplied && simulationData?.reductionView?.charts ? (() => {
                                const chart = simulationData.reductionView.charts.find(c => c.label === 'Enrollment Time');
                                return chart ? (
                                  <>
                                    <div className="flex flex-col gap-1">
                                      <h3 className="text-body4 text-[#262625]">
                                        {chart.label}
                                      </h3>
                                      <div className="flex items-center gap-1 mt-1">
                                        <ArrowIcon direction="down" color="#231F52" />
                                        <p className="text-h4 text-[#262625]">
                                          {chart.change}
                                        </p>
                                      </div>
                                    </div>
                                    {isApplied && <FullscreenIcon />}
                                  </>
                                ) : null;
                              })() : null
                            )}
                          </div>
                          {/* Chart Area */}
                          <div className="mt-auto bg-white/60 rounded-[12px]" style={{ height: '148px' }}>
                            {activeTab === "compare" ? (
                              chartDataToUse && chartDataToUse.smallerNToScreen.optivis.length > 0 ? (
                                <SmallerNToScreenChart
                                  optivisData={chartDataToUse.smallerNToScreen.optivis}
                                  traditionalData={chartDataToUse.smallerNToScreen.traditional}
                                  highlightXValue={getHighlightXValue(chartDataToUse.smallerNToScreen.optivis)}
                                />
                              ) : null
                            ) : (
                              isApplied && simulationData?.reductionView?.charts ? (() => {
                                const chart = simulationData.reductionView.charts.find(c => c.label === 'Enrollment Time');
                                return chart ? (
                                  <div className="grid grid-cols-2 gap-2 h-full p-2">
                                    {/* Enrollment Time - OPTIVIS */}
                                    <div className="flex flex-col gap-1">
                                      <div style={{ height: '140px', width: '100%' }}>
                                        <ReactECharts
                                          option={{
                                            grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                            xAxis: { show: false, type: 'category', data: [''] },
                                            yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                            series: [
                                              { type: 'bar', data: [chart.optivis], itemStyle: { color: '#f06600', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.optivis}`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                            ],
                                            tooltip: { show: false },
                                            legend: { show: false }
                                          }}
                                          style={{ height: '100%', width: '100%' }}
                                        />
                                      </div>
                                    </div>
                                    {/* Enrollment Time - Traditional */}
                                    <div className="flex flex-col gap-1">
                                      <div style={{ height: '140px', width: '100%' }}>
                                        <ReactECharts
                                          option={{
                                            grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                            xAxis: { show: false, type: 'category', data: [''] },
                                            yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                            series: [
                                              { type: 'bar', data: [chart.traditional], itemStyle: { color: '#231f52', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.traditional}`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                            ],
                                            tooltip: { show: false },
                                            legend: { show: false }
                                          }}
                                          style={{ height: '100%', width: '100%' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : null;
                              })() : null
                            )}
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
                            {activeTab === "compare" ? (
                              <>
                                <div className="flex flex-col gap-1">
                                  <h3 className="text-body4 text-[#262625]">
                                    Lower cost
                                  </h3>
                                  <p className="text-small1 text-[#262625]">
                                    {isApplied && simulationData ? simulationData.lowerCost.subtitle : "at the same sample size"}
                                  </p>
                                  {isApplied && (
                                    <div className="flex items-center gap-1  mt-1">
                                      <ArrowIcon direction="down" color="#231F52" />
                                      <p className="text-h4 text-[#262625]">
                                        {simulationData?.lowerCost?.percentage || "--"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {isApplied && <FullscreenIcon />}
                              </>
                            ) : (
                              isApplied && simulationData?.reductionView?.charts ? (() => {
                                const chart = simulationData.reductionView.charts.find(c => c.label === 'Cost');
                                return chart ? (
                                  <>
                                    <div className="flex flex-col gap-1">
                                      <h3 className="text-body4 text-[#262625]">
                                        {chart.label}
                                      </h3>
                                      <div className="flex items-center gap-1 mt-1">
                                        <ArrowIcon direction="down" color="#231F52" />
                                        <p className="text-h4 text-[#262625]">
                                          {chart.change}
                                        </p>
                                      </div>
                                    </div>
                                    {isApplied && <FullscreenIcon />}
                                  </>
                                ) : null;
                              })() : null
                            )}
                          </div>
                          {/* Chart Area */}
                          <div className="mt-auto bg-white/60 rounded-[12px]" style={{ height: '148px' }}>
                            {activeTab === "compare" ? (
                              chartDataToUse && chartDataToUse.lowerCost.optivis.length > 0 ? (
                                <LowerCostChart
                                  optivisData={chartDataToUse.lowerCost.optivis}
                                  traditionalData={chartDataToUse.lowerCost.traditional}
                                  highlightXValue={getHighlightXValue(chartDataToUse.lowerCost.optivis)}
                                />
                              ) : null
                            ) : (
                              isApplied && simulationData?.reductionView?.charts ? (() => {
                                const chart = simulationData.reductionView.charts.find(c => c.label === 'Cost');
                                return chart ? (
                                  <div className="grid grid-cols-2 gap-2 h-full p-2">
                                    {/* Cost - OPTIVIS */}
                                    <div className="flex flex-col gap-1">
                                      <div style={{ height: '140px', width: '100%' }}>
                                        <ReactECharts
                                          option={{
                                            grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                            xAxis: { show: false, type: 'category', data: [''] },
                                            yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                            series: [
                                              { type: 'bar', data: [chart.optivis], itemStyle: { color: '#f06600', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.optivis}M`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                            ],
                                            tooltip: { show: false },
                                            legend: { show: false }
                                          }}
                                          style={{ height: '100%', width: '100%' }}
                                        />
                                      </div>
                                    </div>
                                    {/* Cost - Traditional */}
                                    <div className="flex flex-col gap-1">
                                      <div style={{ height: '140px', width: '100%' }}>
                                        <ReactECharts
                                          option={{
                                            grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
                                            xAxis: { show: false, type: 'category', data: [''] },
                                            yAxis: { show: false, type: 'value', max: Math.max(chart.optivis, chart.traditional) * 1.2 },
                                            series: [
                                              { type: 'bar', data: [chart.traditional], itemStyle: { color: '#231f52', borderRadius: [8, 8, 8, 8] }, barWidth: '100%', label: { show: true, position: 'insideTop', formatter: `${chart.traditional}M`, color: '#ffffff', fontSize: 19.5, fontWeight: 590, letterSpacing: -0.585 } }
                                            ],
                                            tooltip: { show: false },
                                            legend: { show: false }
                                          }}
                                          style={{ height: '100%', width: '100%' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : null;
                              })() : null
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Area - OPTIVIS NEXUS vs Traditional Design, Reduction View */}
                  <div className="w-[446px] flex-shrink-0 flex flex-col gap-4">
                    {/* OPTIVIS NEXUS vs Traditional Design Card */}
                    <div className="bg-white rounded-[24px] flex flex-col flex-1">
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
                                  {isApplied && simulationData ? simulationData.comparisonTable.enrollment.optivis : "-"}
                                </span>
                              </div>
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#231f52]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.enrollment.traditional : "-"}
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
                                  {isApplied && simulationData ? simulationData.comparisonTable.primaryEndpointPower.optivis : "-"}
                                </span>
                              </div>
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#231f52]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.primaryEndpointPower.traditional : "-"}
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
                                  {isApplied && simulationData ? simulationData.comparisonTable.secondaryEndpointPower.optivis : "-"}
                                </span>
                              </div>
                              <div className="w-[98px]">
                                <span className="text-body1m text-[#231f52]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.secondaryEndpointPower.traditional : "-"}
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
                                  <FormulaTooltip
                                    formula={String.raw`\beta=\Phi\left(\Phi^{-1}\left(\alpha/2\right)+\sqrt{n}\frac{\tau}{\sigma}\right)+\Phi\left(\Phi^{-1}\left(\alpha/2\right)-\sqrt{n}\frac{\tau}{\sigma}\right)`}
                                    usedValues={
                                      isApplied && apiData?.result_formula?.OPTIVIS?.[0]
                                        ? [
                                            { label: String.raw`\Phi`, value: String(apiData.result_formula.OPTIVIS[0].beta) },
                                            { label: String.raw`\Phi^{-1}`, value: String(apiData.result_formula.OPTIVIS[0].inverse_phi) },
                                            { label: String.raw`\alpha`, value: String(apiData.result_formula.OPTIVIS[0].alpha) },
                                            { label: String.raw`\beta`, value: String(apiData.result_formula.OPTIVIS[0].beta) },
                                            { label: String.raw`\tau`, value: String(apiData.result_formula.OPTIVIS[0].tau) },
                                            { label: String.raw`\sigma`, value: String(apiData.result_formula.OPTIVIS[0].sigma) },
                                          ]
                                        : [
                                            { label: String.raw`\Phi`, value: "" },
                                            { label: String.raw`\Phi^{-1}`, value: "" },
                                            { label: String.raw`\alpha`, value: "" },
                                            { label: String.raw`\beta`, value: "" },
                                            { label: String.raw`\tau`, value: "" },
                                            { label: String.raw`\sigma`, value: "" },
                                          ]
                                    }
                                    definitions={[
                                      {
                                        symbol: String.raw`\Phi`,
                                        description: "Represents the variance scale parameter (Φ), characterizing the dispersion of the outcome distribution beyond what is explained by the mean structure",
                                      },
                                      {
                                        symbol: String.raw`\Phi^{-1}`,
                                        description: "Represents the inverse of the variance scale parameter (1/Φ), commonly interpreted as statistical precision.",
                                      },
                                      {
                                        symbol: String.raw`\alpha`,
                                        description: "Denotes the significance level (α), defined as the probability of rejecting the null hypothesis when it is true",
                                      },
                                      {
                                        symbol: String.raw`\beta`,
                                        description: "Represents the effect size or regression coefficient (β), quantifying the linear influence of covariates (e.g., prognostic scores) on the outcome",
                                      },
                                      {
                                        symbol: String.raw`\tau`,
                                        description: "The expected treatment effect",
                                      },
                                      {
                                        symbol: String.raw`\sigma`,
                                        description: "The reduced standard deviation achieved by incorporating the prognostic score is applied",
                                      },
                                    ]}
                                    trigger={
                                      <button className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
                                        <InfoIcon />
                                      </button>
                                    }
                                  />
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
                                  {isApplied && simulationData ? simulationData.comparisonTable.sampleSize.optivis.treatmentGroup1 : "-"}
                                </span>
                                <span className="text-body5 text-[#f06600]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.sampleSize.optivis.controlGroup : "-"}
                                </span>
                                <span className="text-body5 text-[#f06600]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.sampleSize.optivis.total : "-"}
                                </span>
                              </div>
                              <div className="w-[98px] flex flex-col gap-1">
                                <span className="text-body5 text-[#231f52]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.sampleSize.traditional.treatmentGroup1 : "-"}
                                </span>
                                <span className="text-body5 text-[#231f52]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.sampleSize.traditional.controlGroup : "-"}
                                </span>
                                <span className="text-body5 text-[#231f52]">
                                  {isApplied && simulationData ? simulationData.comparisonTable.sampleSize.traditional.total : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reduction View Card / Compare View Card */}
                    <div className="bg-white rounded-[24px] flex flex-col flex-1">
                      {/* Title */}
                      <div className="px-4 pt-4 pb-3 flex-shrink-0">
                        <h3 className="text-body2 text-[#1c1b1c]">
                          {activeTab === "compare" ? "Reduction View" : "Compare View"}
                        </h3>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col px-4 pb-4 min-h-0 overflow-hidden">
                        {activeTab === "compare" ? (
                          isApplied ? (
                            <div className="grid grid-cols-2 gap-2 h-full">
                              {simulationData?.reductionView?.charts?.map((chart, index) => (
                                <div key={index} className="flex flex-col gap-2 ">
                                  <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-2">
                                      <span className="text-body5 text-[black]">{chart.label}</span>
                                      <div className="flex items-center gap-1 mt-1">
                                        <ArrowIcon direction="down" color="#231F52" />
                                        <span className="text-body1m text-[#464747]">{chart.change}</span>
                                      </div>
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
                                            itemStyle: { color: '#f06600', borderRadius: [8, 8, 8, 8] },
                                            barWidth: '45%',
                                            barGap: '10%',
                                            label: {
                                              show: true,
                                              position: 'insideTop',
                                              formatter: `${chart.optivis}${chart.label === 'Cost' ? 'M' : ''}`,
                                              color: '#ffffff',
                                              fontSize: 19.5,
                                              fontWeight: 590,
                                              letterSpacing: -0.585
                                            }
                                          },
                                          {
                                            type: 'bar',
                                            data: [chart.traditional],
                                            itemStyle: { color: '#231f52', borderRadius: [8, 8, 8, 8] },
                                            barWidth: '45%',
                                            label: {
                                              show: true,
                                              position: 'insideTop',
                                              formatter: `${chart.traditional}${chart.label === 'Cost' ? 'M' : ''}`,
                                              color: '#ffffff',
                                              fontSize: 19.5,
                                              fontWeight: 590,
                                              letterSpacing: -0.585
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
                          )
                        ) : (
                          /* Compare View Charts - when activeTab is "reduction" */
                          isApplied && chartDataToUse ? (
                            <div className="flex flex-col gap-2 h-full overflow-hidden">
                              {/* Smaller Sample Chart - Single */}
                              {chartDataToUse.smallerSample.optivis.length > 0 && (
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-2">
                                      <h4 className="text-body5 text-[#1c1b1c]">Smaller Sample</h4>
                                      {simulationData && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <ArrowIcon direction="down" color="#231F52" />
                                          <span className="text-body1m text-[#464747]">
                                            {simulationData.smallerSample.percentage || "--"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <FullscreenIcon />
                                  </div>
                                  <div className="bg-white rounded-[12px]" style={{ height: '94px' }}>
                                    <SmallerSampleChart
                                      optivisData={chartDataToUse.smallerSample.optivis}
                                      traditionalData={chartDataToUse.smallerSample.traditional}
                                      highlightXValue={getHighlightXValue(chartDataToUse.smallerSample.optivis)}
                                      compactMode={true}
                                    />
                                  </div>
                                </div>
                              )}
                              {/* Smaller N to screen & Lower cost - Side by side */}
                              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                                {/* Smaller N to screen Chart */}
                                {chartDataToUse.smallerNToScreen.optivis.length > 0 && (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex flex-col gap-2">
                                        <h4 className="text-body5 text-[#1c1b1c]">Smaller N to screen</h4>
                                        {simulationData && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <ArrowIcon direction="down" color="#231F52" />
                                            <span className="text-body1m text-[#464747]">
                                              {simulationData.smallerNToScreen.percentage || "--"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <FullscreenIcon />
                                    </div>
                                    <div className="bg-white rounded-[12px]" style={{ height: '94px' }}>
                                      <SmallerNToScreenChart
                                        optivisData={chartDataToUse.smallerNToScreen.optivis}
                                        traditionalData={chartDataToUse.smallerNToScreen.traditional}
                                        highlightXValue={getHighlightXValue(chartDataToUse.smallerNToScreen.optivis)}
                                        compactMode={true}
                                      />
                                    </div>
                                  </div>
                                )}
                                {/* Lower cost Chart */}
                                {chartDataToUse.lowerCost.optivis.length > 0 && (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex flex-col gap-2">
                                        <h4 className="text-body5 text-[#1c1b1c]">Lower cost</h4>
                                        {simulationData && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <ArrowIcon direction="down" color="#231F52" />
                                            <span className="text-body1m text-[#464747]">
                                              {simulationData.lowerCost.percentage || "--"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <FullscreenIcon />
                                    </div>
                                    <div className="bg-white rounded-[12px]" style={{ height: '94px' }}>
                                      <LowerCostChart
                                        optivisData={chartDataToUse.lowerCost.optivis}
                                        traditionalData={chartDataToUse.lowerCost.traditional}
                                        highlightXValue={getHighlightXValue(chartDataToUse.lowerCost.optivis)}
                                        compactMode={true}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 bg-[#f8f8f8] rounded-[12px] border border-[#e5e5e5]">
                              {/* Empty state */}
                            </div>
                          )
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
    </>
  );
}
