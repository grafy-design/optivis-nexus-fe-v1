"use client";

/**
 * ReportPage — ATS 시뮬레이션 리포트 페이지
 *
 * 역할:
 *   시뮬레이션 Apply 후 이동하는 최종 분석 리포트 페이지입니다.
 *   - 왼쪽 패널: Results Overview (Insight Summary + 4개 Reduction 카드)
 *   - 오른쪽 패널: Trial Design Conditions Summary, Prediction Accuracy by Model,
 *                  Demonstration of Robustness (Step 1~4 차트 2×2 그리드), Appendix
 *
 * 주요 기능:
 *   - isApplied/apiData 미충족 시 시뮬레이션 페이지로 리다이렉트
 *   - "save-report-pdf" 이벤트 수신 → handleDownloadPDF (jsPDF + html-to-image)
 *   - reportData (useMemo): result_resultsoverview에서 퍼센트·감소율 계산
 *   - StepCard: 재사용 가능한 step 번호·타이틀·설명·차트 컨테이너 컴포넌트
 */

import { useRouter, usePathname } from "next/navigation";
import { useSimulationStore } from "@/store/simulationStore";
import { AppLayout } from "@/components/layout/AppLayout";
import ArrowIcon from "@/components/ui/arrow-icon";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SolidButton from "@/components/ui/solid-button";
import {
  Step1TypeISafetyChart,
  Step2VarianceDeclineChart,
  Step2BoxplotChart,
  Step3AbsolutePerformanceChart,
  Step3PerformanceGainChart,
  Step4DecisionStabilityChart,
} from "./charts";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Loading } from "@/components/common/Loading";

// Step 카드 컴포넌트
interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  chartContent: React.ReactNode;
}

function StepCard({
  stepNumber,
  title,
  description,
  chartContent,
}: StepCardProps) {
  return (
    <div className="rounded-[12px] p-4 flex flex-col items-start flex-1 gap-6" style={{ backgroundColor: "rgba(255, 255, 255, 0.6)" }}>
      {/* Step 버튼 + 타이틀 + Description 영역 */}
      <div className="w-full flex flex-col flex-shrink-0">
        {/* Step 버튼 */}
        <div className="mb-3">
          <div className="rounded-[8px] px-4 py-1 text-body5m text-text-inverted bg-secondary-60 w-fit">
            Step {stepNumber}
          </div>
        </div>
        {/* 타이틀 + Description 영역 */}
        <div className="flex flex-col w-full flex-1 ">
          {/* 타이틀 */}
          <h3 className="text-body2 text-text-primary mb-1.5">{title}</h3>
          {/* Description */}
          <p className="text-body5m text-text-secondary max-w-[500px] min-h-[28px]">{description}</p>
        </div>
      </div>
      {/* 차트 영역 */}
      <div className="w-full flex-1 min-h-0 overflow-hidden bg-neutral-100 rounded-[12px] relative">
        {chartContent}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const simulationBasePath = pathname.startsWith("/ats/")
    ? "/ats/simulation"
    : pathname.startsWith("/tsi/")
      ? "/tsi"
      : "/simulation";
  const {
    isApplied,
    apiData,
    primaryEndpoints,
    secondaryEndpoints,
    nominalPower,
    treatmentDuration,
    hypothesisType,
    treatmentArms,
    randomizationRatio,
  } = useSimulationStore();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Apply를 안 눌렀을 때는 시뮬레이션 페이지로 리다이렉트
  useEffect(() => {
    if (!isApplied || !apiData) {
      router.push(simulationBasePath);
    }
  }, [isApplied, apiData, router, simulationBasePath]);

  // 헤더의 Save as PDF 버튼 이벤트 리스너
  useEffect(() => {
    const handler = () => handleDownloadPDF();
    window.addEventListener("save-report-pdf", handler);
    return () => window.removeEventListener("save-report-pdf", handler);
  });

  // 리포트 페이지는 result_resultsoverview만 사용하므로 하이라이트 데이터 로직 제거

  // 리포트 데이터 계산 - result_resultsoverview만 사용 (시뮬레이션 페이지와 독립적)
  const reportData = useMemo(() => {
    // sample_size_evaluation 데이터 출력

    // 리포트 페이지는 result_resultsoverview 데이터만 사용
    if (!apiData?.result_resultsoverview) {
      return null;
    }

    const overview = apiData.result_resultsoverview;

    const optivisItem = overview.OPTIVIS?.[0];
    const traditionalItem = overview.TRADITIONAL?.[0];

    if (!optivisItem || !traditionalItem) return null;

    // Percentage 계산
    const smallerSamplePctRaw = optivisItem.sample_size_reduction * 100;
    const smallerSamplePct = Math.abs(smallerSamplePctRaw).toFixed(0);
    const smallerSampleIsNegative = smallerSamplePctRaw < 0;

    const smallerNToScreenPctRaw = optivisItem.enrollment_reduction * 100;
    const smallerNToScreenPct = Math.abs(smallerNToScreenPctRaw).toFixed(1);
    const smallerNToScreenIsNegative = smallerNToScreenPctRaw < 0;

    const lowerCostPctRaw = optivisItem.cost_reduction;
    const lowerCostIsNegative = lowerCostPctRaw < 0;
    const costReductionValue = Math.abs(
      optivisItem.cost_reduction / 1000000,
    ).toFixed(1);

    const enrollmentReductionRaw = optivisItem.enrollment_reduction * 100;
    const enrollmentReduction = Math.abs(enrollmentReductionRaw).toFixed(1);
    const enrollmentIsNegative = enrollmentReductionRaw < 0;

    // Reduction View 데이터 계산
    const sampleSizeReductionRaw = optivisItem.sample_size_reduction * 100;
    const sampleSizeReduction = Math.abs(sampleSizeReductionRaw).toFixed(0);
    const sampleSizeIsNegative = sampleSizeReductionRaw < 0;

    const costReductionRaw = optivisItem.cost_reduction;
    const costIsNegative = costReductionRaw < 0;

    return {
      smallerSample: {
        percentage: `${smallerSamplePct}%`,
        isNegative: smallerSampleIsNegative,
      },
      smallerNToScreen: {
        percentage: `${smallerNToScreenPct}%`,
        isNegative: smallerNToScreenIsNegative,
      },
      lowerCost: {
        percentage: `$${costReductionValue}M`,
        isNegative: lowerCostIsNegative,
      },
      // Reduction View 데이터 (Results Overview용)
      reductionView: {
        charts: [
          {
            label: "Sample Size",
            change: `${sampleSizeReduction}%`,
            optivis: optivisItem.sample_size,
            traditional: traditionalItem.sample_size,
            isNegative: sampleSizeIsNegative,
          },
          {
            label: "Power",
            change:
              optivisItem.power >= traditionalItem.power
                ? "No loss"
                : `${(
                    (traditionalItem.power - optivisItem.power) *
                    100
                  ).toFixed(1)}%`,
            optivis: Math.round(optivisItem.power * 100),
            traditional: Math.round(traditionalItem.power * 100),
            isNegative: optivisItem.power < traditionalItem.power,
          },
          {
            label: "Enrollment Time",
            change: `${enrollmentReduction}%`,
            optivis: optivisItem.enrollment,
            traditional: traditionalItem.enrollment,
            isNegative: enrollmentIsNegative,
          },
          {
            label: "Cost",
            change: `$${costReductionValue}M`,
            optivis: Math.round(optivisItem.cost / 1000000),
            traditional: Math.round(traditionalItem.cost / 1000000),
            isNegative: costIsNegative,
          },
        ],
      },
    };
  }, [apiData]);

  // 현재 날짜/시간 포맷팅
  const currentDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}. ${month}. ${day} ${hours}:${minutes}:${seconds}`;
  }, []);

  const getReportPdfFileName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}_OPTIVIS Nexus_ATS_Report.pdf`;
  };

  const triggerDownload = (file: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // PDF 다운로드 함수 - 클라이언트에서 생성 (기존)
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [1772, 2508], // A4 비율에 맞춘 크기
      });

      // 모든 섹션을 순서대로 한 페이지에 넣기 (헤더 포함)
      const allSections = [
        "report-header",
        "trial-design-summary",
        "results-overview",
        "prediction-accuracy",
        "demonstration-robustness",
      ];

      const padding = 40;
      const sectionGap = 100;
      let currentHeight = padding; // 첫 번째 섹션의 시작 위치를 padding으로 설정
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const backgroundColor = "#e9e7e9";

      // 페이지 배경색 설정 함수
      const setPageBackground = () => {
        pdf.setFillColor(233, 231, 233); // #e9e7e9를 RGB로 변환
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
      };

      // 첫 페이지 배경색 설정
      setPageBackground();

      for (const sectionId of allSections) {
        const element = document.getElementById(sectionId);
        if (element) {
          // 요소의 원래 배경색 저장
          const originalBgColor = (element as HTMLElement).style
            .backgroundColor;

          // 임시로 배경색 설정
          (element as HTMLElement).style.backgroundColor = backgroundColor;

          const captureTarget: HTMLElement = element as HTMLElement;
          let cleanupCaptureTarget: (() => void) | null = null;

          if (sectionId === "results-overview") {
            type StyleProp =
              | "width"
              | "minWidth"
              | "maxWidth"
              | "display"
              | "flexDirection"
              | "alignItems"
              | "gap"
              | "flex"
              | "height"
              | "overflow";

            const savedStyles: Array<{
              el: HTMLElement;
              prop: StyleProp;
              val: string;
            }> = [];

            const setStyle = (
              target: HTMLElement,
              prop: StyleProp,
              value: string,
            ) => {
              savedStyles.push({
                el: target,
                prop,
                val: target.style[prop],
              });
              target.style[prop] = value;
            };

            const targetWidth = pageWidth - padding * 2;

            // captureTarget (results-overview): flex-1 제거 → 콘텐츠 크기에 맞춤
            setStyle(captureTarget, "flex", "none");
            setStyle(captureTarget, "height", "auto");
            setStyle(captureTarget, "overflow", "visible");
            setStyle(captureTarget, "width", `${targetWidth}px`);
            setStyle(captureTarget, "minWidth", `${targetWidth}px`);
            setStyle(captureTarget, "maxWidth", `${targetWidth}px`);

            const flexColWrapper = captureTarget.children.item(1) as HTMLElement | null;
            if (flexColWrapper) {
              setStyle(flexColWrapper, "display", "flex");
              setStyle(flexColWrapper, "width", "100%");
              setStyle(flexColWrapper, "flexDirection", "row");
              setStyle(flexColWrapper, "alignItems", "flex-start");
              setStyle(flexColWrapper, "gap", "24px");
              setStyle(flexColWrapper, "flex", "none");

              const gridEl = flexColWrapper.children[0] as HTMLElement | null;
              if (gridEl) {
                setStyle(gridEl, "flex", "3 1 0%");
                setStyle(gridEl, "minWidth", "0");
                setStyle(gridEl, "width", "100%");

                // 네이비 박스(Insight Summary)의 flex-1 제거 → 콘텐츠 높이에 맞춤
                const navyBox = gridEl.children[0] as HTMLElement | null;
                if (navyBox) {
                  setStyle(navyBox, "flex", "none");
                  setStyle(navyBox, "height", "auto");
                }
              }

              const insightEl = flexColWrapper.children[1] as HTMLElement | null;
              if (insightEl) {
                setStyle(insightEl, "flex", "2 1 0%");
                setStyle(insightEl, "minWidth", "0");
                setStyle(insightEl, "width", "100%");
              }
            }

            cleanupCaptureTarget = () => {
              for (let i = savedStyles.length - 1; i >= 0; i--) {
                const item = savedStyles[i];
                item.el.style[item.prop] = item.val;
              }
              window.dispatchEvent(new Event("resize"));
            };

            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  resolve();
                });
              });
            });
            window.dispatchEvent(new Event("resize"));
            await new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 120);
            });
          }

          try {
            const imgData = await toPng(captureTarget, {
              backgroundColor: backgroundColor,
              pixelRatio: 2,
              quality: 1,
              cacheBust: true,
            });

            // 원래 배경색 복원
            (element as HTMLElement).style.backgroundColor = originalBgColor;
            cleanupCaptureTarget?.();

            const pdfWithImageProps = pdf as jsPDF & {
              getImageProperties: (imageData: string) => {
                width: number;
                height: number;
              };
            };
            const imageProps = pdfWithImageProps.getImageProperties(imgData);
            const maxWidth = pageWidth - padding * 2;
            const captureWidth = captureTarget.offsetWidth;
            const imgWidth =
              sectionId === "results-overview"
                ? maxWidth
                : Math.min(maxWidth, captureWidth);
            const imgHeight = (imageProps.height * imgWidth) / imageProps.width;
            const x =
              sectionId === "results-overview"
                ? (pageWidth - imgWidth) / 2
                : padding;

            // 현재 페이지에 넣을 수 있는지 확인 (하단 padding 고려)
            if (currentHeight + imgHeight > pageHeight - padding) {
              // 새 페이지 추가 및 배경색 설정
              pdf.addPage();
              setPageBackground();
              currentHeight = padding; // 새 페이지의 시작 위치를 padding으로 설정
            }

            pdf.addImage(
              imgData,
              "PNG",
              x,
              currentHeight,
              imgWidth,
              imgHeight,
            );
            currentHeight += imgHeight + sectionGap; // 섹션 간 간격 100px
          } catch (error) {
            // 에러 발생 시 원래 배경색 복원
            (element as HTMLElement).style.backgroundColor = originalBgColor;
            cleanupCaptureTarget?.();
            throw error;
          }
        }
      }

      // 모든 페이지에 페이지 번호 추가
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(40);
        pdf.setTextColor(50, 50, 50); // 진한 회색
        // Inter 폰트 사용 (helvetica는 Inter와 유사한 sans-serif 폰트)
        // Inter 폰트 파일이 필요하면 추가해야 함
        pdf.setFont("helvetica", "bold");
        const pageText = `-${i}-`;
        const textWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 40); // 하단 중앙
      }

      const fileName = getReportPdfFileName();
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      triggerDownload(file, file.name);
      setIsDownloadingPDF(false);
    } catch (_error) {
      // PDF 다운로드 실패
      alert("PDF 다운로드에 실패했습니다.");
      setIsDownloadingPDF(false);
    }
  };

  if (!isApplied || !apiData || !reportData) {
    return null; // 리다이렉트 중
  }

  return (
    <>
      <AppLayout headerType="ats" >
        <div id="report-page-root" className="flex flex-col w-full h-full overflow-hidden gap-6">
          
          <div className="shrink-0 px-1">
            <div
              id="report-header"
              className="flex flex-col gap-1 flex-shrink-0 items-start"
            >
              <div className="text-page-title  text-left">
                Analysis Report
              </div>
              <p className="text-page-subtitle text-left">
                {currentDate}
              </p>
            </div>
          </div>

          <div id="report-content" className="flex flex-1 min-h-0 gap-1">
            {/* LEFT: Results Overview (liquid glass frame) - 고정, 풀높이 */}
            <div className="w-[400px] [@media(min-width:1470px)]:w-[520px] flex-shrink-0 h-full flex flex-col">
              <div
                className="figma-nine-slice figma-home-panel-middle relative flex-1 flex flex-col overflow-hidden"
              >
                <div id="results-overview" className="flex flex-col flex-1 overflow-hidden min-h-0">
                  <h2 className="text-h4 text-primary-15 mb-3 pl-1 pt-1">
                    Results Overview
                  </h2>
                  <div className="flex flex-col gap-6 flex-1 min-h-0">
                    {/* Insight Summary */}
                    <div className="flex-1 flex flex-col">
                      <div
                        className="flex flex-col items-center bg-primary-15 rounded-[12px] w-full flex-1 gap-6 p-4"
                      >
                        <h3 className="text-body2 text-white text-left w-full">
                          Insight Summary
                        </h3>
                        <div
                          className="space-y-4 w-full"
                          style={{ marginTop: "12px" }}
                        >
                          <div className="flex items-center gap-6">
                            <Image
                              src="/assets/simulation/insight-summary-sample.svg"
                              alt="Sample Size"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body5m text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]
                                  ?.sample_size_text || ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-[1px] bg-neutral-70" />
                          <div className="flex items-center gap-6">
                            <Image
                              src="/assets/simulation/insight-summary-enrollment.svg"
                              alt="Enrollment"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body5m text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]
                                  ?.enrollment_text || ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-[1px] bg-neutral-70" />
                          <div className="flex items-center gap-6">
                            <Image
                              src="/assets/simulation/insight-summary-cost.svg"
                              alt="Cost"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body5m text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]
                                  ?.cost_text || ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-[1px] bg-neutral-70" />
                          <div className="flex items-center gap-6">
                            <Image
                              src="/assets/simulation/insight-summary-loss.svg"
                              alt="Power Loss"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body5m text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]
                                  ?.power_text || ""}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="bg-white rounded-[12px] p-3 w-full mt-auto flex flex-col gap-2">
                          <h3 className="text-body4 text-primary-15">
                            {apiData?.sample_size_evaluation?.title || ""}
                          </h3>
                          <p className="text-body5m text-text-secondary whitespace-pre-line mt-auto" style={{ lineHeight: "1.15" }}>
                            {apiData?.sample_size_evaluation?.content || ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2x2 그리드 (4개의 흰색 카드) */}
                    <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-3">
                      {reportData.reductionView.charts.map(
                        (chart, index) => {
                          const formatter =
                            chart.label === "Cost"
                              ? (val: number) => `${val}M`
                              : chart.label === "Enrollment Time"
                                ? (val: number) => val.toFixed(2)
                                : chart.label === "Power"
                                  ? (val: number) => `${val}%`
                                  : undefined;

                          return (
                            <div
                              key={index}
                              className="flex flex-col items-start bg-white rounded-[12px] p-3 gap-2 h-full overflow-hidden"
                            >
                              <div className="flex items-start justify-between w-full">
                                <div className="flex flex-col gap-0">
                                  <h4 className="text-body5m text-text-secondary">
                                    {chart.label}
                                  </h4>
                                  <div className="flex items-center gap-0.5 mt-0">
                                    <ArrowIcon
                                      direction={
                                        chart.isNegative ? "up" : "down"
                                      }
                                      color="var(--text-accent)"
                                      size="s"
                                    />
                                    <span className="text-body2 text-text-accent">
                                      {chart.change}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 min-h-0 w-full">
                                <ComparisonBarChart
                                  optivisValue={chart.optivis}
                                  traditionalValue={chart.traditional}
                                  height="100%"
                                  label={chart.label}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Main content (liquid glass frame) - 독립 스크롤 */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
              <div
                className="figma-nine-slice figma-home-panel-right flex flex-col overflow-hidden relative flex-1"
              >
                <div className="w-full overflow-y-auto flex-1 min-h-0">
                  {/* Trial Design Conditions Summary */}
                  <div id="trial-design-summary" className="mb-10">
                    <h2 className="text-h4 text-primary-15 mb-3 ml-[4px] pt-1">
                      Trial Design Conditions Summary
                    </h2>
                    <div className="flex gap-3">
                      {/* Endpoints Design Card */}
                      <div className="flex-[2] min-w-0 bg-white rounded-[12px] p-4 gap-2 min-h-[180px] h-fit">
                        <div className="mb-2">
                          <div className="flex justify-left mb-2">
                            <div
                              className="bg-neutral-90 flex items-center justify-center rounded-full px-3 py-1 w-fit"
                            >
                              <span className="text-body5 text-primary-15">
                                Endpoints Design
                              </span>
                            </div>
                          </div>
                          {/* 테이블 형태: 보더라인 없음, 기본 높이 200px, 콘텐츠에 따라 확장 */}
                          <div className="h-fit">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    Endpoint Type
                                  </th>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    No
                                  </th>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    Outcome
                                  </th>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    Type
                                  </th>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    Nominal Power
                                  </th>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    Threshold
                                  </th>
                                  <th className="text-left py-2 px-3 text-small1 text-text-primary">
                                    Expected Effect size
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Primary Endpoints */}
                                {primaryEndpoints.map((endpoint, index) => {
                                  const isFirstPrimary = index === 0;
                                  const effectSize = endpoint.effectSize;
                                  // 색상 결정: High (7.0~10.0 초록), Moderate (4.0~6.9 파랑), Low (0.1~3.9 빨강)
                                  let barColor = "#f06600"; // 기본값
                                  if (effectSize >= 7.0 && effectSize <= 10.0) {
                                    barColor = "#22c55e"; // 초록색
                                  } else if (
                                    effectSize >= 4.0 &&
                                    effectSize <= 6.9
                                  ) {
                                    barColor = "#3b82f6"; // 파랑색
                                  } else if (
                                    effectSize >= 0.1 &&
                                    effectSize <= 3.9
                                  ) {
                                    barColor = "#ef4444"; // 빨강색
                                  }
                                  const barWidth = Math.min(
                                    ((effectSize - 0.1) / (10.0 - 0.1)) * 100,
                                    100,
                                  );

                                  return (
                                    <Fragment key={`primary-${index}`}>
                                      {/* 헤더와 Primary 사이 구분선 (첫 번째 Primary만) */}
                                      {isFirstPrimary && (
                                        <tr>
                                          <td className="pl-3 py-0">
                                            <div className="h-[1px] bg-neutral-70" />
                                          </td>
                                          <td colSpan={5} className="p-0">
                                            <div className="h-[1px] bg-neutral-70" />
                                          </td>
                                          <td className="pr-3 py-0">
                                            <div className="h-[1px] bg-neutral-70" />
                                          </td>
                                        </tr>
                                      )}
                                      <tr>
                                        {index === 0 && (
                                          <td
                                            rowSpan={primaryEndpoints.length}
                                            className="py-2 px-3 text-small1 text-text-primary align-top"
                                          >
                                            Primary
                                          </td>
                                        )}
                                        <td className="py-2 px-3 text-small1 text-text-primary">
                                          #{index + 1}
                                        </td>
                                        <td className="py-2 px-3 text-small1 text-text-primary">
                                          {endpoint.name}
                                        </td>
                                        <td className="py-2 px-3 text-small1 text-text-primary">
                                          {endpoint.type || "Continuous"}
                                        </td>
                                        <td className="py-2 px-3 text-small1 text-text-primary">
                                          {index === 0
                                            ? `${Math.round(
                                                nominalPower * 100,
                                              )}%`
                                            : "-"}
                                        </td>
                                        <td className="py-2 px-3 text-small1 text-text-primary">
                                          {endpoint.type === "Binary" &&
                                          endpoint.threshold !== null &&
                                          endpoint.threshold !== undefined
                                            ? endpoint.threshold.toFixed(1)
                                            : "-"}
                                        </td>
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-small1 text-text-primary whitespace-nowrap">
                                              {effectSize.toFixed(1)}
                                            </span>
                                            <div className="flex items-center gap-1 flex-1">
                                              <span className="text-small1 text-text-primary whitespace-nowrap">
                                                Low
                                              </span>
                                              <div className="flex-1 h-2 bg-neutral-50/20 rounded-[3px] relative max-w-[200px]">
                                                <div
                                                  className="h-2 rounded-[3px]"
                                                  style={{
                                                    width: `${barWidth}%`,
                                                    backgroundColor: barColor,
                                                  }}
                                                />
                                              </div>
                                              <span className="text-small1 text-text-primary whitespace-nowrap">
                                                High
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    </Fragment>
                                  );
                                })}

                                {/* Primary와 Secondary 사이 구분선 */}
                                {primaryEndpoints.length > 0 &&
                                  secondaryEndpoints.length > 0 && (
                                    <tr>
                                      <td className="pl-3 py-0">
                                        <div className="h-[1px] bg-neutral-70" />
                                      </td>
                                      <td colSpan={5} className="p-0">
                                        <div className="h-[1px] bg-neutral-70" />
                                      </td>
                                      <td className="pr-3 py-0">
                                        <div className="h-[1px] bg-neutral-70" />
                                      </td>
                                    </tr>
                                  )}

                                {/* Secondary Endpoints */}
                                {secondaryEndpoints.map((endpoint, index) => {
                                  const effectSize = endpoint.effectSize;
                                  // 색상 결정: High (7.0~10.0 초록), Moderate (4.0~6.9 파랑), Low (0.1~3.9 빨강)
                                  let barColor = "#f06600"; // 기본값
                                  if (effectSize >= 7.0 && effectSize <= 10.0) {
                                    barColor = "#22c55e"; // 초록색
                                  } else if (
                                    effectSize >= 4.0 &&
                                    effectSize <= 6.9
                                  ) {
                                    barColor = "#3b82f6"; // 파랑색
                                  } else if (
                                    effectSize >= 0.1 &&
                                    effectSize <= 3.9
                                  ) {
                                    barColor = "#ef4444"; // 빨강색
                                  }
                                  const barWidth = Math.min(
                                    ((effectSize - 0.1) / (10.0 - 0.1)) * 100,
                                    100,
                                  );

                                  return (
                                    <tr key={`secondary-${index}`}>
                                      {index === 0 && (
                                        <td
                                          rowSpan={secondaryEndpoints.length}
                                          className="py-2 px-3 text-small1 text-text-primary align-top"
                                        >
                                          Secondary
                                        </td>
                                      )}
                                      <td className="py-2 px-3 text-small1 text-text-primary">
                                        #{index + 1}
                                      </td>
                                      <td className="py-2 px-3 text-small1 text-text-primary">
                                        {endpoint.name}
                                      </td>
                                      <td className="py-2 px-3 text-small1 text-text-primary">
                                        {endpoint.type || "Continuous"}
                                      </td>
                                      <td className="py-2 px-3 text-small1 text-text-primary">
                                        -
                                      </td>
                                      <td className="py-2 px-3 text-small1 text-text-primary">
                                        {endpoint.type === "Binary" &&
                                        endpoint.threshold !== null &&
                                        endpoint.threshold !== undefined
                                          ? endpoint.threshold.toFixed(1)
                                          : "-"}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-small1 text-text-primary whitespace-nowrap">
                                            {effectSize.toFixed(1)}
                                          </span>
                                          <div className="flex items-center gap-1 flex-1">
                                            <span className="text-small1 text-text-primary whitespace-nowrap">
                                              Low
                                            </span>
                                            <div className="flex-1 h-2 bg-neutral-50/20 rounded-[3px] relative max-w-[200px]">
                                              <div
                                                className="h-2 rounded-[3px]"
                                                style={{
                                                  width: `${barWidth}%`,
                                                  backgroundColor: barColor,
                                                }}
                                              />
                                            </div>
                                            <span className="text-small1 text-text-primary whitespace-nowrap">
                                              High
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Trial Design Card */}
                      <div className="flex-[1] min-w-0 bg-white rounded-[12px] p-4 min-h-[180px]">
                        <div className="mb-3 ">
                          <div className="bg-neutral-90 flex rounded-full px-3 py-1 w-fit mb-3">
                            <span className="text-body5 text-primary-15">
                              Trial Design
                            </span>
                          </div>
                          <div className="px-3.5">
                            <div className="flex gap-14">
                              {/* 왼쪽 컬럼: 레이블 */}
                              <div className="space-y-2.5 flex-shrink-0">
                                <p className="text-small1 text-text-primary">
                                  Primary Endpoint
                                </p>
                                <p className="text-small1 text-text-primary">
                                  Hypothesis Type
                                </p>
                                <p className="text-small1 text-text-primary">
                                  Treatment Arms
                                </p>
                                <p className="text-small1 text-text-primary">
                                  Randomization Ratio
                                </p>
                              </div>
                              {/* 오른쪽 컬럼: 값들 */}
                              <div className="space-y-2">
                                <p className="text-body5 text-primary-15">
                                  {treatmentDuration}
                                </p>
                                <p className="text-body5 text-primary-15">
                                  {hypothesisType}
                                </p>
                                <p className="text-body5 text-primary-15">
                                  {treatmentArms}-arm
                                </p>
                                <p className="text-body5 text-primary-15">
                                  {randomizationRatio}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prediction Accuracy by Model Section */}
                  <div id="prediction-accuracy" className="mb-10">
                    <h2 className="text-h4 text-primary-15 mb-4">
                      Prediction Accuracy by Model
                    </h2>
                    {/* 그래프 카드 (graph_acc_model 개수에 따라 2개 또는 3개) */}
                    {(apiData as any)?.graph_acc_model &&
                      (apiData as any).graph_acc_model.length > 0 && (
                        <div className="flex gap-3 mb-3">
                          {(() => {
                            const models = (apiData as any).graph_acc_model.slice(0, 3);
                            const precData = (apiData as any)?.result_prec_model?.data as any[] | undefined;

                            // r_square 기반 정확도 레벨 결정
                            const getAccuracyLevel = (rSquare: number) => {
                              if (rSquare >= 0.85) return "Highest";
                              if (rSquare >= 0.7) return "High";
                              if (rSquare >= 0.5) return "Moderate";
                              if (rSquare >= 0.2) return "Low";
                              return "Very Low";
                            };

                            // 모델별 r_square 매칭
                            const modelRSquares = models.map((graphItem: any) => {
                              const matched = precData?.find((d: any) => d.model === graphItem.model);
                              return { graphItem, rSquare: matched?.r_square ?? 0 };
                            });

                            // r_square 순으로 상대 레벨 매핑
                            const sorted = [...modelRSquares].sort((a: any, b: any) => b.rSquare - a.rSquare);
                            const relativeLabels = ["Highest", "Moderate", "Very Low"];
                            const levelMap = new Map<number, string>();
                            sorted.forEach((item: any, idx: number) => {
                              levelMap.set(item.graphItem.id, relativeLabels[Math.min(idx, relativeLabels.length - 1)]);
                            });

                            return modelRSquares.map(({ graphItem, rSquare }: any) => {
                              const accuracyLevel = precData
                                ? (levelMap.get(graphItem.id) ?? getAccuracyLevel(rSquare))
                                : "";

                              return (
                                <div
                                  key={graphItem.id}
                                  className="flex-1 bg-white rounded-[12px] flex flex-col overflow-hidden p-4 gap-8"
                                >
                                  {/* 모델명 + 정확도 라벨 */}
                                  <div className="shrink-0 flex0.5">
                                    <p className="text-body5m text-text-secondary">{graphItem.model}</p>
                                    <p className="text-body3 text-text-accent">{accuracyLevel}</p>
                                  </div>
                                  {/* SVG 그래프 (상단 헤더 영역 CSS 클리핑) */}
                                  <div className="flex-1 min-h-0 overflow-hidden">
                                    <img
                                      src={graphItem.model_svg}
                                      alt={`${graphItem.model} graph`}
                                      className="w-full h-auto object-contain object-bottom"
                                      style={{ marginTop: "-60px" }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                    {/* 테이블 */}
                    {(apiData as any)?.result_prec_model && (
                      <>
                        <div className="bg-white rounded-[12px] p-1 mb-2">
                          <div className="overflow-x-auto relative">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  {/* table_head의 순서대로 표시 (JavaScript 객체는 삽입 순서 보장) */}
                                  {Object.entries(
                                    (apiData as any).result_prec_model
                                      .table_head,
                                  ).map(
                                    (
                                      [key, header]: [string, any],
                                      index,
                                      array,
                                    ) => {
                                      const isFirstCell = index === 0;
                                      const isLastCell =
                                        index === array.length - 1;

                                      // description이 있는 항목들만 필터링하여 번호 매기기
                                      const headersWithDescription =
                                        Object.entries(
                                          (apiData as any).result_prec_model
                                            .table_head,
                                        ).filter(
                                          ([_, h]: [string, any]) =>
                                            h.description,
                                        );

                                      const descriptionIndex =
                                        headersWithDescription.findIndex(
                                          ([k]) => k === key,
                                        );
                                      const hasDescription =
                                        descriptionIndex !== -1;

                                      return (
                                        <th
                                          key={key}
                                          className="text-left py-3 px-3 text-primary-15 text-body4 relative"
                                        >
                                          {hasDescription && (
                                            <span className="absolute text-right top-2.5 left-0.5 text-small1 text-primary-15 leading-none [@media(max-width:1470px)]:top-1.5 [@media(max-width:1470px)]:left-[-1px] [@media(max-width:1470px)]:text-small2">
                                              {descriptionIndex + 1})
                                            </span>
                                          )}
                                          <span className="text-body4">
                                            {header.display_value}
                                          </span>
                                          <div
                                            className="absolute bottom-0 border-b border-neutral-90 "
                                            style={{
                                              left: isFirstCell ? "16px" : "0",
                                              right: isLastCell ? "16px" : "0",
                                            }}
                                          />
                                        </th>
                                      );
                                    },
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {(apiData as any).result_prec_model.data.map(
                                  (row: any, rowIndex: number) => {
                                    const keys = Object.keys(
                                      (apiData as any).result_prec_model
                                        .table_head,
                                    );
                                    return (
                                      <tr key={row.id}>
                                        {/* table_head의 키 순서대로 데이터 표시 */}
                                        {keys.map((key, cellIndex) => {
                                          const value =
                                            row[key as keyof typeof row];
                                          let displayValue = "";

                                          if (key === "r_square") {
                                            displayValue = value.toFixed(3);
                                          } else if (key === "mse") {
                                            displayValue = value.toFixed(2);
                                          } else if (key === "rmse") {
                                            displayValue = value.toFixed(2);
                                          } else if (key === "ratio") {
                                            displayValue = value.toFixed(3);
                                          } else {
                                            displayValue = String(value);
                                          }

                                          const isFirstCell = cellIndex === 0;
                                          const isLastCell =
                                            cellIndex === keys.length - 1;
                                          const showBorder = rowIndex > 0;

                                          return (
                                            <td
                                              key={key}
                                              className={`py-2 px-3 text-body5m text-neutral-30 [@media(max-width:1470px)]:py-4 ${
                                                showBorder ? "relative" : ""
                                              }`}
                                            >
                                              {displayValue}
                                              {showBorder && (
                                                <div
                                                  className="absolute top-0 border-t border-neutral-90"
                                                  style={{
                                                    left: isFirstCell
                                                      ? "16px"
                                                      : "0",
                                                    right: isLastCell
                                                      ? "16px"
                                                      : "0",
                                                  }}
                                                />
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 설명 div */}
                        {(() => {
                          const descriptions = Object.entries(
                            (apiData as any).result_prec_model.table_head,
                          )
                            .filter(
                              ([_, header]: [string, any]) =>
                                header.description &&
                                header.description.trim() !== "",
                            )
                            .map(
                              ([_, header]: [string, any]) =>
                                header.description,
                            );

                          if (descriptions.length === 0) return null;

                          return (
                            <div className="flex gap-6">
                              {descriptions.map((description, index) => (
                                <div key={index} className="flex-1">
                                  <p className="text-body5m text-neutral-50" style={{lineHeight: "115%", letterSpacing: "-0.01em"}}>
                                    <span className="text-body5m text-neutral-50">
                                      {index + 1})
                                    </span>{" "}
                                    {description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Demonstration of Robustness Section */}
                  <div id="demonstration-robustness" className="mb-10">
                    <h2 className="text-h4 text-primary-15 mb-4">
                      Demonstration of Robustness
                    </h2>
                    {/* 카드 그리드: 1470px 이상 2×2, 미만 1열 */}
                    <div className="grid grid-cols-1 min-[1470px]:grid-cols-2 gap-3">
                      {/* Step 1: Type I safety */}
                      <StepCard
                        stepNumber={1}
                        title="Type I safety"
                        description="Demonstrate adppropriate control of the Type I error under the null treatment effect."
                        chartContent={
                          <div className="w-full aspect-[4/1] flex flex-col">
                            <div className="flex-shrink-0 px-3 pt-3">
                              <p className="text-body5 text-neutral-30">P-value distribution under H0</p>
                              <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
                            </div>
                            <Step1TypeISafetyChart apiData={apiData} />
                          </div>
                        }
                      />

                      {/* Step 2: Sample size reduction */}
                      <StepCard
                        stepNumber={2}
                        title="Sample size reduction"
                        description="Demonstrate that efficiency gains from prognostic adjustment scale smoothly with model performance and remain stable under degradation of predictive accuracy."
                        chartContent={
                          <div className="aspect-[4/1] min-[1470px]:aspect-auto min-[1470px]:absolute min-[1470px]:inset-0 flex gap-0">
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex-shrink-0 px-3 pt-3">
                                <p className="text-body5 text-neutral-30">Variance Decline</p>
                                <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
                              </div>
                              <Step2VarianceDeclineChart apiData={apiData} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex-shrink-0 px-3 pt-3">
                                <p className="text-body5 text-neutral-30">Estimated treatment effect</p>
                                <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
                              </div>
                              <Step2BoxplotChart apiData={apiData} />
                            </div>
                          </div>
                        }
                      />

                      {/* Step 3: Data robustness */}
                      <StepCard
                        stepNumber={3}
                        title="Data robustness"
                        description="Demonstrate the robustness of statistical conclusions under realistic data complexities, including missingness and outcome non linearity."
                        chartContent={
                          <div className="aspect-[4/1] min-[1470px]:aspect-auto min-[1470px]:absolute min-[1470px]:inset-0 flex gap-0">
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex-shrink-0 px-3 pt-3">
                                <p className="text-body5 text-neutral-30">A. Absolute Performance Comparison (Dodged)</p>
                                <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
                              </div>
                              <Step3AbsolutePerformanceChart apiData={apiData} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex-shrink-0 px-3 pt-3">
                                <p className="text-body5 text-neutral-30">B. Robustness Proof: Performance Gain over Unadjusted</p>
                                <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
                              </div>
                              <Step3PerformanceGainChart apiData={apiData} />
                            </div>
                          </div>
                        }
                      />

                      {/* Step 4: Decision stability */}
                      <StepCard
                        stepNumber={4}
                        title="Decision stability size reduction"
                        description="Demonstrate the stability of key trial decisions (e.g., go/no go conclusions) across plausible perturbations in design assumptions and data generating processes."
                        chartContent={
                          <div className="w-full aspect-[4/1] flex flex-col">
                            <div className="flex-shrink-0 px-3 pt-3">
                              <p className="text-body5 text-neutral-30">Decision Stability across Perturbations</p>
                              <div className="h-[1px] bg-[#E5E5E5] mt-1.5" />
                            </div>
                            <Step4DecisionStabilityChart apiData={apiData} />
                          </div>
                        }
                      />
                    </div>
                  </div>

                  {/* Appendix Section */}
                  {(apiData as any)?.appendix && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-h4 text-primary-15">
                          {(apiData as any).appendix.title}
                        </h2>
                      </div>

                      {/* 카드 1개 */}
                      <div
                        className="bg-white rounded-[12px] p-4"
                        style={{ height: "132px" }}
                      >
                        <div className="flex items-center">
                          <p className="text-body5m text-neutral-50 max-w-[1000px]">
                            {(apiData as any).appendix.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Footer - 오른쪽 패널 하단 */}
                  <div className="flex items-center justify-end pt-5 flex-shrink-0">
                    <div className="flex gap-4">
                      <SolidButton
                        variant="secondary"
                        size="m"
                        className="rounded-[96px]"
                      >
                        Save Simulation
                      </SolidButton>
                      <SolidButton
                        variant="primary"
                        size="m"
                        onClick={() => router.push("/")}
                        className="rounded-[96px]"
                      >
                        Go to Main
                      </SolidButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
      <Loading isLoading={isDownloadingPDF} />
    </>
  );
}
