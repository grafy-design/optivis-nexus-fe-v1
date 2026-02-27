import { useMemo } from "react";
import type { StudyResult } from "@/services/studyService";

const MIN_POWER = 0.6; // 최소 power 60%
const DEFAULT_POWER = 0.8; // 디폴트 power 80%
const MAX_POWER = 0.95; // 최대 power 95% (sample size control 범위와 동일)

/**
 * API 원본 데이터를 UI에서 사용하기 쉬운 형태로 가공하는 훅
 */
export const useProcessedStudyData = (
  optivisData: StudyResult[],
  traditionalData: StudyResult[],
  userNominalPower?: number,
) => {
  // 1. 필터링 및 정렬된 데이터 (0.6 ~ 0.95 범위)
  const filteredData = useMemo(() => {
    const filteredOptivis = optivisData
      .filter(
        (item) =>
          item.primary_endpoint_power >= MIN_POWER &&
          item.primary_endpoint_power <= MAX_POWER,
      )
      .sort((a, b) => a.primary_endpoint_power - b.primary_endpoint_power);

    const filteredTraditional = traditionalData
      .filter(
        (item) =>
          item.primary_endpoint_power >= MIN_POWER &&
          item.primary_endpoint_power <= MAX_POWER,
      )
      .sort((a, b) => a.primary_endpoint_power - b.primary_endpoint_power);

    return {
      optivis: filteredOptivis,
      traditional: filteredTraditional,
    };
  }, [optivisData, traditionalData]);

  // 2. 차트용 데이터 변환
  const chartData = useMemo(() => {
    // OPTIVIS 데이터가 없으면 빈 배열 반환
    if (filteredData.optivis.length === 0) {
      return {
        chart1Data: {
          optivis: [],
          traditional: [],
        },
        chart2Data: {
          optivis: [],
          traditional: [],
        },
        chart3Data: {
          optivis: [],
          traditional: [],
        },
      };
    }

    // Chart 1: Sample Size vs CI Width (x: total_patient, y: n_to_screen)
    // demo 프로젝트에서는 n_to_screen을 직접 사용
    const chart1Data = {
      optivis: filteredData.optivis.map((item) => [
        item.total_patient,
        item.n_to_screen,
      ]),
      traditional: filteredData.traditional.map((item) => [
        item.total_patient,
        item.n_to_screen,
      ]),
    };

    // Chart 2: Enrollment Time vs Power (x: enrollment, y: primary_endpoint_power)
    const chart2Data = {
      optivis: filteredData.optivis.map((item) => [
        item.enrollment,
        item.primary_endpoint_power,
      ]),
      traditional: filteredData.traditional.map((item) => [
        item.enrollment,
        item.primary_endpoint_power,
      ]),
    };

    // Chart 3: Sample Size vs Cost (x: total_patient, y: cost / 1000000)
    const chart3Data = {
      optivis: filteredData.optivis.map((item) => [
        item.total_patient,
        item.cost / 1000000, // Cost in millions
      ]),
      traditional: filteredData.traditional.map((item) => [
        item.total_patient,
        item.cost / 1000000, // Cost in millions
      ]),
    };

    return {
      chart1Data,
      chart2Data,
      chart3Data,
    };
  }, [filteredData.optivis, filteredData.traditional]);

  // 3. 디폴트 Power에 가장 가까운 인덱스 찾기
  const defaultPowerIndex = useMemo(() => {
    const filtered = filteredData.optivis;
    if (filtered.length === 0) return 0;

    const targetPower = userNominalPower ?? DEFAULT_POWER;
    let closestIndex = 0;
    let minDiff = Math.abs(filtered[0].primary_endpoint_power - targetPower);

    for (let i = 1; i < filtered.length; i++) {
      const diff = Math.abs(filtered[i].primary_endpoint_power - targetPower);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  }, [filteredData.optivis, userNominalPower]);

  return {
    filteredData,
    chartData,
    defaultPowerIndex,
    minPower: MIN_POWER,
    maxPower: MAX_POWER,
    defaultPower: userNominalPower ?? DEFAULT_POWER,
  };
};
