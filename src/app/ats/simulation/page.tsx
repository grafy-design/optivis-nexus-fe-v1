"use client";

import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  callMLStudyDesign,
  type StudyParameters,
  type PrimaryEndpointData,
  type SecondaryEndpointData,
} from "@/services/studyService";
import { useProcessedStudyData } from "@/hooks/useProcessedStudyData";
import { useSimulationStore } from "@/store/simulationStore";
import { Loading } from "@/components/common/Loading";
import { LeftPanel } from "@/components/ats/LeftPanel";
import { RightPanel } from "@/components/ats/RightPanel";
import type { AddEndpointsSaveData } from "@/components/ui/add-endpoints-modal";

export default function SimulationPage() {
  // Zustand store에서 상태 가져오기
  const {
    activeTab,
    isApplied,
    sampleSizeControl,
    disease,
    primaryEndpoints,
    secondaryEndpoints,
    nominalPower,
    alpha,
    multiplicity,
    treatmentDuration,
    hypothesisType,
    treatmentArms,
    randomizationRatio,
    subpopulation,
    activeData,
    apiData,
    isLoading,
    setActiveTab,
    setIsApplied,
    setSampleSizeControl,
    setDisease,
    setPrimaryEndpoints,
    setSecondaryEndpoints,
    setNominalPower,
    setAlpha,
    setMultiplicity,
    setTreatmentDuration,
    setHypothesisType,
    setTreatmentArms,
    setRandomizationRatio,
    setSubpopulation,
    setActiveData,
    setApiData,
    setTaskId,
    setIsLoading,
    setError,
  } = useSimulationStore();

  const handleSaveEndpoints = (data: AddEndpointsSaveData) => {
    setPrimaryEndpoints(data.primaryEndpoints);
    setSecondaryEndpoints(data.secondaryEndpoints);
    setNominalPower(data.nominalPower);
    setAlpha(data.alpha);
    setMultiplicity(data.multiplicity ?? "Bonferroni");
  };

  // 페이지 로드 시 상태 초기화는 제거
  // 뒤로가기로 돌아왔을 때 데이터를 유지하기 위해 reset() 호출을 제거
  // 새로고침 시에는 Zustand store가 자동으로 초기화됨

  // API 데이터 처리
  const optivisData = apiData?.OPTIVIS || [];
  const traditionalData = apiData?.Traditional || [];

  const { filteredData, chartData, defaultPowerIndex: _defaultPowerIndex } = useProcessedStudyData(
    optivisData,
    traditionalData,
    nominalPower
  );

  // 하이라이트된 포인트의 실제 데이터를 찾는 함수
  // sampleSizeControl은 power 값을 나타냄 (0~1)
  const findHighlightedData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    // 필터링된 데이터가 비어있으면 원본 데이터 사용
    const optivisToSearch =
      filteredData.optivis.length > 0 ? filteredData.optivis : optivisData;

    if (optivisToSearch.length === 0) return null;

    // sampleSizeControl을 power 값으로 사용하여 가장 가까운 데이터 포인트 찾기
    const targetPower = sampleSizeControl;

    // OPTIVIS에서 power 값이 가장 가까운 포인트 찾기
    let optivisIndex = 0;
    let minPowerDiff = Math.abs(
      optivisToSearch[0].primary_endpoint_power - targetPower
    );

    for (let i = 1; i < optivisToSearch.length; i++) {
      const powerDiff = Math.abs(
        optivisToSearch[i].primary_endpoint_power - targetPower
      );
      if (powerDiff < minPowerDiff) {
        minPowerDiff = powerDiff;
        optivisIndex = i;
      }
    }

    const optivisPoint = optivisToSearch[optivisIndex];
    if (!optivisPoint) return null;

    // Traditional 데이터가 없으면 OPTIVIS만 반환
    const traditionalToSearch =
      filteredData.traditional.length > 0
        ? filteredData.traditional
        : traditionalData;

    if (traditionalToSearch.length === 0) {
      return {
        optivis: optivisPoint,
        traditional: null,
      };
    }

    // Traditional에서도 같은 power 값에 가장 가까운 포인트 찾기
    let traditionalIndex = 0;
    let minTraditionalPowerDiff = Math.abs(
      traditionalToSearch[0].primary_endpoint_power - targetPower
    );

    for (let i = 1; i < traditionalToSearch.length; i++) {
      const powerDiff = Math.abs(
        traditionalToSearch[i].primary_endpoint_power - targetPower
      );
      if (powerDiff < minTraditionalPowerDiff) {
        minTraditionalPowerDiff = powerDiff;
        traditionalIndex = i;
      }
    }

    const traditionalPoint = traditionalToSearch[traditionalIndex];

    return {
      optivis: optivisPoint,
      traditional: traditionalPoint,
    };
  }, [apiData, sampleSizeControl, filteredData, optivisData, traditionalData]);

  const getHighlightXValue = (
    _optivisData: number[][],
    chartType: "sampleSize" | "enrollment" | "cost" = "sampleSize"
  ) => {
    if (!findHighlightedData || !findHighlightedData.optivis) {
      return undefined;
    }
    const highlightedPoint = findHighlightedData.optivis;
    switch (chartType) {
      case "sampleSize": return highlightedPoint.total_patient;
      case "enrollment": return highlightedPoint.enrollment;
      case "cost": return highlightedPoint.total_patient;
      default: return highlightedPoint.total_patient;
    }
  };

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
          primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(
            1
          ),
          secondaryEndpointPower: optivis.secondary_endpoint_power
            ? (optivis.secondary_endpoint_power * 100).toFixed(1)
            : "0.0",
          estimatedCostReduction: "-",
          gaugeValue: optivis.primary_endpoint_power,
          gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
        },
        smallerSample: {
          percentage: "-",
          chartData: {
            optivis: chartData.chart1Data.optivis,
            traditional: chartData.chart1Data.traditional,
          },
        },
        smallerNToScreen: {
          percentage: "-",
          subtitle: "Enrollment Time vs Power",
          chartData: {
            optivis: chartData.chart2Data.optivis,
            traditional: chartData.chart2Data.traditional,
          },
        },
        lowerCost: {
          percentage: "-",
          subtitle: "Sample Size vs Cost",
          chartData: {
            optivis: chartData.chart3Data.optivis,
            traditional: chartData.chart3Data.traditional,
          },
        },
        comparisonTable: {
          enrollment: {
            optivis: optivis.enrollment.toFixed(2),
            traditional: "-",
          },
          primaryEndpointPower: {
            optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
            traditional: "-",
          },
          secondaryEndpointPower: {
            optivis: optivis.secondary_endpoint_power
              ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
              : "0.0%",
            traditional: "-",
          },
          sampleSize: {
            optivis: {
              treatmentGroup1: optivis.treatment_group_1?.toString() || null,
              treatmentGroup2: optivis.treatment_group_2?.toString() || null,
              treatmentGroup3: optivis.treatment_group_3?.toString() || null,
              controlGroup: optivis.control_group?.toString() || "0",
              total: optivis.total_patient.toString(),
            },
            traditional: {
              treatmentGroup1: null,
              treatmentGroup2: null,
              treatmentGroup3: null,
              controlGroup: "-",
              total: "-",
            },
          },
        },
        reductionView: {
          charts: [
            {
              label: "Sample Size",
              change: "-",
              optivis: optivis.total_patient,
              traditional: 0,
            },
            {
              label: "Power",
              change: "-",
              optivis: Math.round(optivis.primary_endpoint_power * 100),
              traditional: 0,
            },
            {
              label: "Enrollment Time",
              change: "-",
              optivis: Math.round(optivis.enrollment),
              traditional: 0,
            },
            {
              label: "Cost",
              change: "-",
              optivis: Math.round(optivis.cost / 1000000),
              traditional: 0,
            },
          ],
        },
      };
    }

    // Percentage 계산 (Smaller Sample, Smaller N to Screen, Lower Cost)
    // 음수가 나오면 안 되므로, 절댓값을 사용하고 화살표 방향을 조정
    // Smaller Sample: (Traditional total_patient - OPTIVIS total_patient) / Traditional total_patient * 100
    const smallerSamplePctRaw =
      ((traditional.total_patient - optivis.total_patient) /
        traditional.total_patient) *
      100;
    const smallerSamplePct = Math.abs(smallerSamplePctRaw).toFixed(0);
    const smallerSampleIsNegative = smallerSamplePctRaw < 0;

    // Smaller N to Screen: (Traditional enrollment - OPTIVIS enrollment) / Traditional enrollment * 100
    // 그래프가 enrollment를 X축으로 사용하므로 enrollment로 계산
    const smallerNToScreenPctRaw =
      ((traditional.enrollment - optivis.enrollment) / traditional.enrollment) *
      100;
    const smallerNToScreenPct = Math.abs(smallerNToScreenPctRaw).toFixed(1);
    const smallerNToScreenIsNegative = smallerNToScreenPctRaw < 0;

    // Lower Cost: (Traditional cost - OPTIVIS cost) / Traditional cost * 100
    const lowerCostPctRaw =
      ((traditional.cost - optivis.cost) / traditional.cost) * 100;
    const lowerCostPct = Math.abs(lowerCostPctRaw).toFixed(0);
    const lowerCostIsNegative = lowerCostPctRaw < 0;

    // Reduction 계산 (Reduction View용)
    // 음수가 나오면 안 되므로, 절댓값을 사용하고 화살표 방향을 조정
    const sampleSizeReductionRaw =
      ((traditional.total_patient - optivis.total_patient) /
        traditional.total_patient) *
      100;
    const sampleSizeReduction = Math.abs(sampleSizeReductionRaw).toFixed(0);
    const sampleSizeIsNegative = sampleSizeReductionRaw < 0;

    const enrollmentReductionRaw =
      ((traditional.enrollment - optivis.enrollment) / traditional.enrollment) *
      100;
    const enrollmentReduction = Math.abs(enrollmentReductionRaw).toFixed(1);
    const enrollmentIsNegative = enrollmentReductionRaw < 0;

    const costReductionRaw =
      ((traditional.cost - optivis.cost) / traditional.cost) * 100;
    const costReduction = Math.abs(costReductionRaw).toFixed(0);
    const costReductionValue = Math.abs(
      (traditional.cost - optivis.cost) / 1000000
    ).toFixed(1);
    const costIsNegative = costReductionRaw < 0;

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
        gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
      },
      smallerSample: {
        percentage: `${smallerSamplePct}%`,
        isNegative: smallerSampleIsNegative,
        chartData: {
          optivis: chartData.chart1Data.optivis,
          traditional: chartData.chart1Data.traditional,
        },
      },
      smallerNToScreen: {
        percentage: `${smallerNToScreenPct}%`,
        isNegative: smallerNToScreenIsNegative,
        subtitle: "Enrollment Time vs Power",
        chartData: {
          optivis: chartData.chart2Data.optivis,
          traditional: chartData.chart2Data.traditional,
        },
      },
      lowerCost: {
        percentage: `${lowerCostPct}%`,
        isNegative: lowerCostIsNegative,
        subtitle: "Sample Size vs Cost",
        chartData: {
          optivis: chartData.chart3Data.optivis,
          traditional: chartData.chart3Data.traditional,
        },
      },
      comparisonTable: {
        // OPTIVIS vs Traditional 데이터 직접 사용
        enrollment: {
          optivis: optivis.enrollment.toFixed(2),
          traditional: traditional.enrollment.toFixed(2),
        },
        primaryEndpointPower: {
          optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
          traditional: `${(traditional.primary_endpoint_power * 100).toFixed(
            1
          )}%`,
        },
        secondaryEndpointPower: {
          optivis: optivis.secondary_endpoint_power
            ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
          traditional: traditional.secondary_endpoint_power
            ? `${(traditional.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
        },
        sampleSize: {
          optivis: {
            treatmentGroup1: optivis.treatment_group_1?.toString() || null,
            treatmentGroup2: optivis.treatment_group_2?.toString() || null,
            treatmentGroup3: optivis.treatment_group_3?.toString() || null,
            controlGroup: optivis.control_group?.toString() || "0",
            total: optivis.total_patient.toString(),
          },
          traditional: {
            treatmentGroup1: traditional.treatment_group_1?.toString() || null,
            treatmentGroup2: traditional.treatment_group_2?.toString() || null,
            treatmentGroup3: traditional.treatment_group_3?.toString() || null,
            controlGroup: traditional.control_group?.toString() || "0",
            total: traditional.total_patient.toString(),
          },
        },
      },
      reductionView: {
        // Reduction View Bar Chart 데이터 - OPTIVIS vs Traditional 직접 사용
        charts: [
          {
            label: "Sample Size",
            change: `${sampleSizeReduction}%`,
            optivis: optivis.total_patient,
            traditional: traditional.total_patient,
            isNegative: sampleSizeIsNegative,
          },
          {
            label: "Power",
            change:
              optivis.primary_endpoint_power >=
              traditional.primary_endpoint_power
                ? "No loss"
                : `${(
                    (traditional.primary_endpoint_power -
                      optivis.primary_endpoint_power) *
                    100
                  ).toFixed(1)}%`,
            optivis: Math.round(optivis.primary_endpoint_power * 100),
            traditional: Math.round(traditional.primary_endpoint_power * 100),
            isNegative:
              optivis.primary_endpoint_power <
              traditional.primary_endpoint_power,
          },
          {
            label: "Enrollment Time",
            change: `${enrollmentReduction}%`,
            optivis: optivis.enrollment,
            traditional: traditional.enrollment,
            isNegative: enrollmentIsNegative,
          },
          {
            label: "Cost",
            change: `$${costReductionValue}M`,
            optivis: Math.round(optivis.cost / 1000000),
            traditional: Math.round(traditional.cost / 1000000),
            isNegative: costIsNegative,
          },
        ],
      },
    };
  }, [findHighlightedData, chartData, filteredData]);

  // 동적 데이터 사용 (슬라이더 값에 따라 업데이트됨)
  // API 데이터가 있을 때만 실제 데이터 사용
  const simulationData =
    apiData && dynamicSimulationData ? dynamicSimulationData : null;

  // API 데이터를 차트 형식으로 변환 - 활성 탭의 데이터만 계산 (lazy)
  const apiChartData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    // Compare View에서 사용하는 라인 차트 데이터 (compare 탭일 때만 계산)
    // Reduction View에서도 우측 Compare View 카드에서 사용하므로 항상 계산
    const chart1Optivis =
      chartData.chart1Data.optivis.length > 0
        ? chartData.chart1Data.optivis
        : optivisData.map((item) => [item.total_patient, item.n_to_screen]);
    const chart1Traditional =
      chartData.chart1Data.traditional.length > 0
        ? chartData.chart1Data.traditional
        : traditionalData.map((item) => [item.total_patient, item.n_to_screen]);

    const chart2Optivis =
      chartData.chart2Data.optivis.length > 0
        ? chartData.chart2Data.optivis
        : optivisData.map((item) => [
            item.enrollment,
            item.primary_endpoint_power,
          ]);
    const chart2Traditional =
      chartData.chart2Data.traditional.length > 0
        ? chartData.chart2Data.traditional
        : traditionalData.map((item) => [
            item.enrollment,
            item.primary_endpoint_power,
          ]);

    const chart3Optivis =
      chartData.chart3Data.optivis.length > 0
        ? chartData.chart3Data.optivis
        : optivisData.map((item) => [item.total_patient, item.cost / 1000000]);
    const chart3Traditional =
      chartData.chart3Data.traditional.length > 0
        ? chartData.chart3Data.traditional
        : traditionalData.map((item) => [
            item.total_patient,
            item.cost / 1000000,
          ]);

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
      MMSE: "MMTOTSCORE",
      CDR: "CDTOTSCORE",
    };
    return endpointMap[endpoint] || endpoint;
  };

  // API 호출 함수
  const handleApplySettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 값들을 정확히 반올림 (부동소수점 오차 방지)
      const roundedNominalPower = parseFloat(
        (Math.round(nominalPower / 0.05) * 0.05).toFixed(2)
      );

      // UI type(Continuous/Binary) -> API type(Continous/Binary). 넘겨준 값 또는 기본값 사용
      const toApiType = (t: string | undefined) =>
        t === "Binary" ? "Binary" : "Continous";

      // threshold: 단일 값. 없으면 null, 있으면 number (리스트 아님)
      const thresholdPayload = (v: number | null | undefined) =>
        v != null && Number.isFinite(v)
          ? { threshold: v }
          : { threshold: null };

      // Primary 데이터 구성: multiplicity·type은 넘겨준 값(또는 기본값) 사용
      const primaryDataList: PrimaryEndpointData[] = primaryEndpoints.map(
        (ep, index) => {
          const outcome = convertPrimaryEndpoint(ep.name);
          const effectSize = parseFloat(
            (Math.round(ep.effectSize * 10) / 10).toFixed(1)
          );
          return {
            no: index + 1,
            outcome: [outcome],
            type: [toApiType(ep.type)],
            effect_size: [effectSize],
            ...thresholdPayload(ep.threshold),
            target_power: [roundedNominalPower],
            statistical_method: "ANCOVA",
            multiplicity: multiplicity || "Bonferroni",
            endpoint_objectives: ["Confirmatory"],
            alpha: alpha,
          };
        }
      );

      // Secondary 데이터 구성: multiplicity·type은 넘겨준 값(또는 기본값) 사용
      const secondaryDataList: SecondaryEndpointData[] =
        secondaryEndpoints.length > 0
          ? secondaryEndpoints.map((ep, index) => {
              const outcome = convertPrimaryEndpoint(ep.name);
              const effectSize = parseFloat(
                (Math.round(ep.effectSize * 10) / 10).toFixed(1)
              );
              return {
                no: index + 1,
                outcome: [outcome],
                type: [toApiType(ep.type)],
                effect_size: [effectSize],
                ...thresholdPayload(ep.threshold),
                target_power: [roundedNominalPower],
                statistical_method: "ANCOVA",
                multiplicity: multiplicity || "Bonferroni",
                endpoint_objectives: ["Confirmatory"],
                alpha: alpha,
              };
            })
          : [];

      // treatment_duration 검증 및 변환 (3의 배수, >0, 정수)
      const durationValue = parseInt(
        treatmentDuration.replace(" months", ""),
        10
      );
      if (
        isNaN(durationValue) ||
        durationValue <= 0 ||
        durationValue % 3 !== 0
      ) {
        throw new Error("Treatment Duration은 3의 배수인 양수여야 합니다.");
      }

      const parameters: StudyParameters = {
        disease_area: "Alzheimer",
        treatment_duration: durationValue,
        treatment_arms: parseInt(treatmentArms, 10),
        randomization_ratio: randomizationRatio,
        stratification: false, // 기본값: false
        hypothesis_type: hypothesisType,
        subpopulation: subpopulation,
        primary: primaryDataList, // Primary 여러 개 (엔드포인트별 1개)
        ...(secondaryDataList.length > 0
          ? { secondary: secondaryDataList }
          : {}), // Secondary 여러 개 (엔드포인트별 1개)
      };

      const response = await callMLStudyDesign(parameters);

      // API 응답에서 데이터 추출

      // task_id 추출 및 저장
      const taskId = response.data?.task_id;
      if (taskId) {
        setTaskId(taskId);
      }

      const manageResult = response.data?.table_results?.manage_result as any;
      const sampleSizeEvaluation =
        response.data?.table_results?.sample_size_evaluation;
      const trialDesignConditionsSummary =
        response.data?.table_results?.result_trialdesignconditionsummary;
      const resultTypeSafety = response.data?.table_results?.result_type_safety;
      const resultVarianceDecline =
        response.data?.table_results?.result_variancedecline;
      const resultEstimatedTreatmentEffect =
        response.data?.table_results?.result_estimatedtreatmenteffect;
      const resultAbsolutePerformance =
        response.data?.table_results?.result_absoluteperformancecomparison;
      const resultRobustnessProof =
        response.data?.table_results?.result_robustnessproof;
      const resultDecisionStability =
        response.data?.table_results?.result_decisionstability;
      const graphAccModel = response.data?.table_results?.graph_acc_model;
      const resultPrecModel = response.data?.table_results?.result_prec_model;
      const appendix = response.data?.table_results?.appendix;

      if (manageResult) {
        // API 응답 키는 모두 대문자: TRADITIONAL, OPTIVIS
        const optivisData = manageResult.OPTIVIS || [];
        const traditionalData = manageResult.TRADITIONAL || [];
        const resultFormula = response.data?.table_results?.result_formula;

        const resultOverview =
          response.data?.table_results?.result_resultsoverview;

        setApiData({
          OPTIVIS: Array.isArray(optivisData) ? optivisData : [],
          Traditional: Array.isArray(traditionalData) ? traditionalData : [],
          result_formula: resultFormula,
          result_resultsoverview: resultOverview,
          result_trialdesignconditionsummary: trialDesignConditionsSummary,
          sample_size_evaluation: sampleSizeEvaluation,
          result_type_safety: resultTypeSafety,
          result_variancedecline: resultVarianceDecline,
          result_estimatedtreatmenteffect: resultEstimatedTreatmentEffect,
          result_absoluteperformancecomparison: resultAbsolutePerformance,
          result_robustnessproof: resultRobustnessProof,
          result_decisionstability: resultDecisionStability,
          graph_acc_model: graphAccModel,
          result_prec_model: resultPrecModel,
          appendix: appendix,
        });

        // Nominal Power 값으로 Sample Size Control 초기 위치 설정 (Apply 시)
        // sampleSizeControl 범위: 0.6~0.95 (차트 하이라이트용)
        const roundedPower = parseFloat(
          (Math.round(nominalPower / 0.05) * 0.05).toFixed(2)
        );
        setSampleSizeControl(Math.max(0.6, Math.min(0.95, roundedPower)));

        setIsApplied(true);
      } else {
        throw new Error("API 응답에 데이터가 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "API 호출에 실패했습니다.");
      // API 호출 오류
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Loading isLoading={isLoading} />
      <AppLayout headerType="ats" scaleMode="height">
        <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px", }}>
          
          <div style={{ flexShrink: 0, padding: "0 12px" }}>
            <div className="text-title text-neutral-5 text-left">
              Adaptive Trial Simulation
            </div>
            <p className="text-body2m text-neutral-50 text-left">
              Optimize study design
            </p>
          </div>

          <div className="ats-simulation-layout flex gap-[0px] w-full flex-1 min-h-0">
            <div className="ats-left-panel flex-[22] min-w-[280px] min-h-0">
              <LeftPanel
                sampleSizeControl={sampleSizeControl}
                setSampleSizeControl={setSampleSizeControl}
                disease={disease}
                setDisease={setDisease}
                primaryEndpoints={primaryEndpoints}
                setPrimaryEndpoints={setPrimaryEndpoints}
                secondaryEndpoints={secondaryEndpoints}
                setSecondaryEndpoints={setSecondaryEndpoints}
                nominalPower={nominalPower}
                setNominalPower={setNominalPower}
                alpha={alpha}
                multiplicity={multiplicity}
                treatmentDuration={treatmentDuration}
                setTreatmentDuration={setTreatmentDuration}
                hypothesisType={hypothesisType}
                setHypothesisType={setHypothesisType}
                treatmentArms={treatmentArms}
                setTreatmentArms={setTreatmentArms}
                randomizationRatio={randomizationRatio}
                setRandomizationRatio={setRandomizationRatio}
                subpopulation={subpopulation}
                setSubpopulation={setSubpopulation}
                activeData={activeData}
                setActiveData={setActiveData}
                onApply={handleApplySettings}
                isLoading={isLoading}
                onSaveEndpoints={handleSaveEndpoints}
              />
            </div>
            <div className="ats-right-panel flex-[78] min-w-0 min-h-0" style={{ marginLeft: "-6px" }}>
              <RightPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isApplied={isApplied}
                simulationData={simulationData}
                chartDataToUse={chartDataToUse}
                getHighlightXValue={getHighlightXValue}
                apiData={apiData}
              />
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
