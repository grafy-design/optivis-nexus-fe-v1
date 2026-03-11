"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSimulationStore } from "@/store/simulationStore";
import { AppLayout } from "@/components/layout/AppLayout";
import ArrowIcon from "@/components/ui/arrow-icon";
import { SingleBarChart } from "@/components/charts/SingleBarChart";
import { downloadReportFile } from "@/services/study-service";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/button";
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

function StepCard({ stepNumber, title, description, chartContent }: StepCardProps) {
  return (
    <div className="flex min-h-[512px] flex-1 flex-col items-start rounded-[16px] bg-[#f5f5f6] p-5">
      {/* Step 버튼 + 타이틀 + Description 영역 */}
      <div className="mb-8 flex w-full flex-shrink-0 flex-col">
        {/* Step 버튼 */}
        <div className="mb-3">
          <span className="text-body5m inline-flex h-6 items-center rounded-[8px] bg-[#f06600] px-3 py-1 text-white">
            Step {stepNumber}
          </span>
        </div>
        {/* 타이틀 + Description 영역 */}
        <div className="flex w-full flex-1 flex-col">
          {/* 타이틀 */}
          <h3 className="text-h3 mb-6 text-[#1b1b1b]">{title}</h3>
          {/* Description */}
          <p className="text-body3 max-w-[500px] text-[#666b73]">{description}</p>
        </div>
      </div>
      {/* 차트 영역 */}
      <div className="h-[264px] w-full flex-shrink-0 overflow-hidden">{chartContent}</div>
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
    taskId,
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
    const costReductionValue = Math.abs(optivisItem.cost_reduction / 1000000).toFixed(1);

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
            label: "Enrollment Time",
            change: `${enrollmentReduction}%`,
            optivis: optivisItem.enrollment,
            traditional: traditionalItem.enrollment,
            isNegative: enrollmentIsNegative,
          },
          {
            label: "Cost",
            change: `$${costReductionValue}M`,
            optivis: Number((optivisItem.cost / 1000000).toFixed(1)),
            traditional: Number((traditionalItem.cost / 1000000).toFixed(1)),
            isNegative: costIsNegative,
          },
          {
            label: "Power",
            change:
              optivisItem.power >= traditionalItem.power
                ? "No loss"
                : `${((traditionalItem.power - optivisItem.power) * 100).toFixed(1)}%`,
            optivis: Math.round(optivisItem.power * 100),
            traditional: Math.round(traditionalItem.power * 100),
            isNegative: optivisItem.power < traditionalItem.power,
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
          const originalBgColor = (element as HTMLElement).style.backgroundColor;

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

            const setStyle = (target: HTMLElement, prop: StyleProp, value: string) => {
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
              sectionId === "results-overview" ? maxWidth : Math.min(maxWidth, captureWidth);
            const imgHeight = (imageProps.height * imgWidth) / imageProps.width;
            const x = sectionId === "results-overview" ? (pageWidth - imgWidth) / 2 : padding;

            // 현재 페이지에 넣을 수 있는지 확인 (하단 padding 고려)
            if (currentHeight + imgHeight > pageHeight - padding) {
              // 새 페이지 추가 및 배경색 설정
              pdf.addPage();
              setPageBackground();
              currentHeight = padding; // 새 페이지의 시작 위치를 padding으로 설정
            }

            pdf.addImage(imgData, "PNG", x, currentHeight, imgWidth, imgHeight);
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

  const handleDownloadPDFFromBackend = async () => {
    try {
      if (!taskId) {
        alert("task_id를 찾을 수 없습니다.");
        return;
      }

      const blob = await downloadReportFile(taskId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "simulation-report.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("PDF 다운로드에 실패했습니다.");
    }
  };

  if (!isApplied || !apiData || !reportData) {
    return null; // 리다이렉트 중
  }

  return (
    <>
      <AppLayout headerType="ats" scaleMode="fit">
        <div
          id="report-page-root"
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
          <div
            className="flex items-start justify-between"
            style={{ flexShrink: 0, padding: "0 12px" }}
          >
            <div id="report-header" className="flex flex-shrink-0 flex-col items-start gap-1">
              <div className="text-title text-neutral-5 text-left">Analysis Report</div>
              <p className="text-body2m text-left text-neutral-50">{currentDate}</p>
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="text-body3 h-auto rounded-[100px] bg-[#aaaaad] px-5 py-2.5 text-white transition-opacity hover:bg-[#aaaaad] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Save as PDF
            </Button>
          </div>

          <div id="report-content" className="flex min-h-0 flex-1" style={{ gap: "0px" }}>
            {/* LEFT: Results Overview (liquid glass frame) - 고정, 풀높이 */}
            <div className="flex h-full w-[700px] flex-shrink-0 flex-col">
              <div
                className="relative flex flex-1 flex-col overflow-hidden"
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
                <div id="results-overview" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  <h2 className="text-h2 mb-8 pt-1 pl-1 text-[#2d1067]">Results Overview</h2>
                  <div className="flex flex-1 flex-col gap-6">
                    {/* Insight Summary */}
                    <div className="flex flex-1 flex-col">
                      <div
                        className="flex w-full flex-1 flex-col items-center rounded-[16px] bg-[#231f52]"
                        style={{
                          padding: "24px",
                          gap: "24px",
                        }}
                      >
                        <h3 className="text-h3 w-full text-left text-white">Insight Summary</h3>
                        <div className="w-full space-y-4" style={{ marginTop: "24px" }}>
                          <div className="flex items-center gap-8">
                            <Image
                              src="/assets/simulation/insight-summary-sample.svg"
                              alt="Sample Size"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body2 text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]?.sample_size_text ||
                                  ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-[1px] bg-[#adaaaa]" />
                          <div className="flex items-center gap-8">
                            <Image
                              src="/assets/simulation/insight-summary-enrollment.svg"
                              alt="Enrollment"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body2 text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]?.enrollment_text ||
                                  ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-[1px] bg-[#adaaaa]" />
                          <div className="flex items-center gap-8">
                            <Image
                              src="/assets/simulation/insight-summary-cost.svg"
                              alt="Cost"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body2 text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]?.cost_text || ""}
                              </span>
                            </span>
                          </div>
                          <div className="h-[1px] bg-[#adaaaa]" />
                          <div className="flex items-center gap-8">
                            <Image
                              src="/assets/simulation/insight-summary-loss.svg"
                              alt="Power Loss"
                              width={20}
                              height={18}
                              className="flex-shrink-0"
                            />
                            <span className="text-body2 text-white">
                              <span className="font-semibold">
                                {apiData?.result_resultsoverview?.OPTIVIS?.[0]?.power_text || ""}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-auto flex w-full flex-col rounded-[16px] bg-white p-4">
                          <h3 className="text-h3 text-[#231f52]">
                            {apiData?.sample_size_evaluation?.title || ""}
                          </h3>
                          <p className="text-body4m text-neutral-5 mt-auto whitespace-pre-line">
                            {apiData?.sample_size_evaluation?.content || ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2x2 그리드 (4개 카드) */}
                    <div className="grid grid-cols-2 gap-4">
                      {reportData.reductionView.charts.map((chart, index) => {
                        const isPowerNoLoss = chart.label === "Power" && chart.change === "No loss";
                        const formatter =
                          chart.label === "Cost"
                            ? (val: number) => `$${val}M`
                            : chart.label === "Enrollment Time"
                              ? (val: number) => `${val.toFixed(1)} month`
                              : chart.label === "Power"
                                ? (val: number) => `${val}%`
                                : undefined;

                        return (
                          <div
                            key={index}
                            className="flex min-h-0 flex-col rounded-[16px] bg-[#f5f5f6] p-4"
                          >
                            <div className="flex w-full items-start justify-between">
                              <div className="flex flex-col gap-1.5">
                                <h4 className="text-body2 text-[#1c1b1c]">{chart.label}</h4>
                                <div className="flex items-center gap-1">
                                  {!isPowerNoLoss && (
                                    <ArrowIcon
                                      direction={chart.isNegative ? "up" : "down"}
                                      color="#231F52"
                                    />
                                  )}
                                  <span className="text-h3 text-[#1b1b1b]">{chart.change}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-auto grid w-full grid-cols-2 gap-2">
                              {/* OPTIVIS */}
                              <div className="flex flex-col gap-1">
                                <div
                                  style={{
                                    height: "140px",
                                    width: "100%",
                                  }}
                                >
                                  <SingleBarChart
                                    value={chart.optivis}
                                    maxValue={Math.max(chart.optivis, chart.traditional)}
                                    color="#f06600"
                                    height="100%"
                                    formatter={formatter}
                                  />
                                </div>
                              </div>
                              {/* Traditional */}
                              <div className="flex flex-col gap-1">
                                <div
                                  style={{
                                    height: "140px",
                                    width: "100%",
                                  }}
                                >
                                  <SingleBarChart
                                    value={chart.traditional}
                                    maxValue={Math.max(chart.optivis, chart.traditional)}
                                    color="#231f52"
                                    height="100%"
                                    formatter={formatter}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Main content (liquid glass frame) - 독립 스크롤 */}
            <div className="flex h-full min-w-0 flex-1 flex-col" style={{ marginLeft: "-6px" }}>
              <div
                className="relative flex flex-1 flex-col overflow-hidden"
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
                <div className="min-h-0 w-full flex-1 overflow-y-auto">
                  {/* Trial Design Conditions Summary */}
                  <div id="trial-design-summary" className="mb-[100px]">
                    <h2 className="text-h2 mb-[44px] pt-1 pl-1 text-[#2d1067]">
                      Trial Design Conditions Summary
                    </h2>
                    <div className="flex gap-4">
                      {/* Endpoints Design Card */}
                      <div className="flex-1 rounded-[16px] bg-white p-6">
                        <div className="mb-4">
                          <div className="justify-left mb-4 flex">
                            <div
                              className="flex items-center justify-center bg-[#ededed]"
                              style={{
                                width: "175px",
                                height: "24px",
                                borderRadius: "100px",
                              }}
                            >
                              <span className="text-[12px] leading-[18.02px] font-semibold tracking-[-0.51px] text-[#231f52]">
                                Endpoints Design
                              </span>
                            </div>
                          </div>
                          {/* 테이블 형태: 보더라인 없음, 기본 높이 200px, 콘텐츠에 따라 확장 */}
                          <div className="min-h-[200px]">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                    Endpoint Type
                                  </th>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                    No
                                  </th>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                    Outcome
                                  </th>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                    Type
                                  </th>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                    Nominal Power
                                  </th>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                    Threshold
                                  </th>
                                  <th className="px-4 py-3 text-left text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
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
                                  } else if (effectSize >= 4.0 && effectSize <= 6.9) {
                                    barColor = "#3b82f6"; // 파랑색
                                  } else if (effectSize >= 0.1 && effectSize <= 3.9) {
                                    barColor = "#ef4444"; // 빨강색
                                  }
                                  const barWidth = Math.min(
                                    ((effectSize - 0.1) / (10.0 - 0.1)) * 100,
                                    100
                                  );

                                  return (
                                    <Fragment key={`primary-${index}`}>
                                      {/* 헤더와 Primary 사이 구분선 (첫 번째 Primary만) */}
                                      {isFirstPrimary && (
                                        <tr>
                                          <td className="py-0 pl-4">
                                            <div className="h-[1px] bg-[#AEA9B1]" />
                                          </td>
                                          <td colSpan={5} className="p-0">
                                            <div className="h-[1px] bg-[#AEA9B1]" />
                                          </td>
                                          <td className="py-0 pr-4">
                                            <div className="h-[1px] bg-[#AEA9B1]" />
                                          </td>
                                        </tr>
                                      )}
                                      <tr>
                                        {index === 0 && (
                                          <td
                                            rowSpan={primaryEndpoints.length}
                                            className="px-4 py-3 align-top text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]"
                                          >
                                            Primary
                                          </td>
                                        )}
                                        <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                          #{index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                          {endpoint.name}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                          {endpoint.type || "Continuous"}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                          {index === 0 ? `${Math.round(nominalPower * 100)}%` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                          {endpoint.type === "Binary" &&
                                          endpoint.threshold !== null &&
                                          endpoint.threshold !== undefined
                                            ? endpoint.threshold.toFixed(1)
                                            : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[12px] leading-[17px] font-medium whitespace-nowrap text-[#1c1b1c]">
                                              {effectSize.toFixed(1)}
                                            </span>
                                            <div className="flex flex-1 items-center gap-1">
                                              <span className="text-[14px] whitespace-nowrap text-[#666b73]">
                                                Low
                                              </span>
                                              <div className="relative h-2 max-w-[200px] flex-1 rounded-[3px] bg-[#787878]/20">
                                                <div
                                                  className="h-2 rounded-[3px]"
                                                  style={{
                                                    width: `${barWidth}%`,
                                                    backgroundColor: barColor,
                                                  }}
                                                />
                                              </div>
                                              <span className="text-[14px] whitespace-nowrap text-[#666b73]">
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
                                {primaryEndpoints.length > 0 && secondaryEndpoints.length > 0 && (
                                  <tr>
                                    <td className="py-0 pl-4">
                                      <div className="h-[1px] bg-[#AEA9B1]" />
                                    </td>
                                    <td colSpan={5} className="p-0">
                                      <div className="h-[1px] bg-[#AEA9B1]" />
                                    </td>
                                    <td className="py-0 pr-4">
                                      <div className="h-[1px] bg-[#AEA9B1]" />
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
                                  } else if (effectSize >= 4.0 && effectSize <= 6.9) {
                                    barColor = "#3b82f6"; // 파랑색
                                  } else if (effectSize >= 0.1 && effectSize <= 3.9) {
                                    barColor = "#ef4444"; // 빨강색
                                  }
                                  const barWidth = Math.min(
                                    ((effectSize - 0.1) / (10.0 - 0.1)) * 100,
                                    100
                                  );

                                  return (
                                    <tr key={`secondary-${index}`}>
                                      {index === 0 && (
                                        <td
                                          rowSpan={secondaryEndpoints.length}
                                          className="px-4 py-3 align-top text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]"
                                        >
                                          Secondary
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                        #{index + 1}
                                      </td>
                                      <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                        {endpoint.name}
                                      </td>
                                      <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                        {endpoint.type || "Continuous"}
                                      </td>
                                      <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                        -
                                      </td>
                                      <td className="px-4 py-3 text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                        {endpoint.type === "Binary" &&
                                        endpoint.threshold !== null &&
                                        endpoint.threshold !== undefined
                                          ? endpoint.threshold.toFixed(1)
                                          : "-"}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[12px] leading-[17px] font-medium whitespace-nowrap text-[#1c1b1c]">
                                            {effectSize.toFixed(1)}
                                          </span>
                                          <div className="flex flex-1 items-center gap-1">
                                            <span className="text-[14px] whitespace-nowrap text-[#666b73]">
                                              Low
                                            </span>
                                            <div className="relative h-2 max-w-[200px] flex-1 rounded-[3px] bg-[#787878]/20">
                                              <div
                                                className="h-2 rounded-[3px]"
                                                style={{
                                                  width: `${barWidth}%`,
                                                  backgroundColor: barColor,
                                                }}
                                              />
                                            </div>
                                            <span className="text-[14px] whitespace-nowrap text-[#666b73]">
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
                      <div className="w-[556px] rounded-[16px] bg-white p-6">
                        <div className="mb-4">
                          <div className="mb-4 inline-block rounded-[100px] bg-[#ededed] px-4 py-1.5">
                            <span className="text-[12px] leading-[18.02px] font-semibold tracking-[-0.51px] text-[#231f52]">
                              Trial Design
                            </span>
                          </div>
                          <div className="px-[18px]">
                            <div className="flex gap-14">
                              {/* 왼쪽 컬럼: 레이블 */}
                              <div className="flex-shrink-0 space-y-2.5">
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                  Primary Endpoint
                                </p>
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                  Hypothesis Type
                                </p>
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                  Treatment Arms
                                </p>
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#1c1b1c]">
                                  Randomization Ratio
                                </p>
                              </div>
                              {/* 오른쪽 컬럼: 값들 */}
                              <div className="space-y-2.5">
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#4f378a]">
                                  {treatmentDuration}
                                </p>
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#4f378a]">
                                  {hypothesisType}
                                </p>
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#4f378a]">
                                  {treatmentArms}-arm
                                </p>
                                <p className="text-[12px] leading-[17.85px] font-medium tracking-[-0.51px] text-[#4f378a]">
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
                  <div id="prediction-accuracy" className="mb-[100px]">
                    <h2 className="text-h2 mb-[44px] text-[#2d1067]">
                      Prediction Accuracy by Model
                    </h2>
                    {/* 그래프 카드 (graph_acc_model 개수에 따라 2개 또는 3개) */}
                    {(apiData as any)?.graph_acc_model &&
                      (apiData as any).graph_acc_model.length > 0 && (
                        <div className="mb-6 flex gap-4">
                          {(apiData as any).graph_acc_model.slice(0, 3).map((graphItem: any) => {
                            return (
                              <div
                                key={graphItem.id}
                                className="flex-1 rounded-[16px] bg-white p-2"
                                style={{ height: "378px" }}
                              >
                                <div className="flex h-full items-center justify-center overflow-hidden">
                                  {/* SVG 그래프만 표시 */}
                                  <img
                                    src={graphItem.model_svg}
                                    alt={`${graphItem.model} graph`}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {/* 테이블 */}
                    {(apiData as any)?.result_prec_model && (
                      <>
                        <div className="mb-5 rounded-[16px] bg-white p-2">
                          <div className="relative overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  {/* table_head의 순서대로 표시 (JavaScript 객체는 삽입 순서 보장) */}
                                  {Object.entries(
                                    (apiData as any).result_prec_model.table_head
                                  ).map(([key, header]: [string, any], index, array) => {
                                    const isFirstCell = index === 0;
                                    const isLastCell = index === array.length - 1;

                                    // description이 있는 항목들만 필터링하여 번호 매기기
                                    const headersWithDescription = Object.entries(
                                      (apiData as any).result_prec_model.table_head
                                    ).filter(([_, h]: [string, any]) => h.description);

                                    const descriptionIndex = headersWithDescription.findIndex(
                                      ([k]) => k === key
                                    );
                                    const hasDescription = descriptionIndex !== -1;

                                    return (
                                      <th
                                        key={key}
                                        className="text-primary-15 relative px-4 py-5 text-left font-medium"
                                      >
                                        {hasDescription && (
                                          <span className="text-body5 text-primary-15 absolute top-3 left-1 leading-none">
                                            {descriptionIndex + 1})
                                          </span>
                                        )}
                                        <span className="text-body2">{header.display_value}</span>
                                        <div
                                          className="absolute bottom-0 border-b border-[#e2e1e5]"
                                          style={{
                                            left: isFirstCell ? "16px" : "0",
                                            right: isLastCell ? "16px" : "0",
                                          }}
                                        />
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {(apiData as any).result_prec_model.data.map(
                                  (row: any, rowIndex: number) => {
                                    const keys = Object.keys(
                                      (apiData as any).result_prec_model.table_head
                                    );
                                    return (
                                      <tr key={row.id}>
                                        {/* table_head의 키 순서대로 데이터 표시 */}
                                        {keys.map((key, cellIndex) => {
                                          const value = row[key as keyof typeof row];
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
                                          const isLastCell = cellIndex === keys.length - 1;
                                          const showBorder = rowIndex > 0;

                                          return (
                                            <td
                                              key={key}
                                              className={`text-body2m text-neutral-30 px-4 py-3 ${
                                                showBorder ? "relative" : ""
                                              }`}
                                            >
                                              {displayValue}
                                              {showBorder && (
                                                <div
                                                  className="absolute top-0 border-t border-[#e2e1e5]"
                                                  style={{
                                                    left: isFirstCell ? "16px" : "0",
                                                    right: isLastCell ? "16px" : "0",
                                                  }}
                                                />
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 설명 div */}
                        {(() => {
                          const descriptions = Object.entries(
                            (apiData as any).result_prec_model.table_head
                          )
                            .filter(
                              ([_, header]: [string, any]) =>
                                header.description && header.description.trim() !== ""
                            )
                            .map(([_, header]: [string, any]) => header.description);

                          if (descriptions.length === 0) return null;

                          return (
                            <div className="flex gap-6">
                              {descriptions.map((description, index) => (
                                <div key={index} className="flex-1">
                                  <p className="text-body4m text-[#666b73]">
                                    <span className="text-body4m text-[#666b73]">{index + 1})</span>{" "}
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
                  <div id="demonstration-robustness" className="mb-[100px]">
                    <h2 className="text-h2 mb-[44px] text-[#2d1067]">
                      Demonstration of Robustness
                    </h2>
                    {/* 카드 2x2 그리드 (4개) */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Step 1: Type I safety */}
                      <StepCard
                        stepNumber={1}
                        title="Type I Error Control"
                        description="Demonstrate control of the Type I error rate under the null hypothesis."
                        chartContent={<Step1TypeISafetyChart apiData={apiData} />}
                      />

                      {/* Step 2: Sample size reduction */}
                      <StepCard
                        stepNumber={2}
                        title="Sample Size Reduction"
                        description="Demonstrate that efficiency gains from prognostic adjustment increase with model performance and remain robust even if predictive accuracy declines."
                        chartContent={
                          <div className="flex h-full w-full gap-4">
                            <Step2VarianceDeclineChart apiData={apiData} />
                            <Step2BoxplotChart apiData={apiData} />
                          </div>
                        }
                      />

                      {/* Step 3: Data robustness */}
                      <StepCard
                        stepNumber={3}
                        title="Data Robustness"
                        description="Demonstrate that statistical conclusions remain robust under real-world data challenges, including missing data and non-linear outcomes."
                        chartContent={
                          <div className="flex h-full w-full gap-4">
                            <Step3AbsolutePerformanceChart apiData={apiData} />
                            <Step3PerformanceGainChart apiData={apiData} />
                          </div>
                        }
                      />

                      {/* Step 4: Decision stability */}
                      <StepCard
                        stepNumber={4}
                        title="Decision Stability"
                        description="Demonstrate the stability of key trial decisions (e.g., go/no-go conclusions) under plausible changes in design assumptions and data-generating processes"
                        chartContent={<Step4DecisionStabilityChart apiData={apiData} />}
                      />
                    </div>
                  </div>

                  {/* Appendix Section */}
                  {(apiData as any)?.appendix && (
                    <div>
                      <div className="mb-[44px] flex items-center justify-between">
                        <h2 className="text-h2 text-[#2d1067]">
                          {(apiData as any).appendix.title}
                        </h2>
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={handleDownloadPDFFromBackend}
                          className="text-body3 h-auto rounded-[100px] bg-[#aaaaad] px-5 py-2.5 text-white transition-opacity hover:bg-[#aaaaad] hover:opacity-90"
                        >
                          Save as PDF
                        </Button>
                      </div>

                      {/* 카드 1개 */}
                      <div className="rounded-[16px] bg-white p-6" style={{ height: "132px" }}>
                        <div className="flex h-full items-center">
                          <p className="text-body3m text-neutral-20 max-w-[1000px]">
                            {(apiData as any).appendix.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Footer - 오른쪽 패널 하단 */}
                  <div className="flex flex-shrink-0 items-center justify-end py-6">
                    <div className="flex gap-4">
                      <button className="text-body3 flex cursor-pointer items-center gap-2 rounded-[100px] bg-[#aaaaad] px-5 py-2.5 text-white transition-opacity hover:opacity-90">
                        Save Simulation
                      </button>
                      <Button
                        variant="orange"
                        size="md"
                        onClick={() => router.push("/")}
                        className="rounded-[100px]"
                      >
                        Go to Main
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Report page font size overrides: ~30% reduction (제목 제외, 컨텐츠 영역만) */}
        <style jsx global>{`
          #report-content .text-h2 {
            font-size: 28px !important;
            line-height: 28px !important;
            letter-spacing: -0.84px !important;
          }
          #report-content .text-h3 {
            font-size: 25px !important;
            line-height: 25px !important;
            letter-spacing: -0.5px !important;
          }
          #report-content .text-h4 {
            font-size: 20px !important;
            line-height: 20px !important;
            letter-spacing: -0.6px !important;
          }
          #report-content .text-body2 {
            font-size: 14px !important;
            line-height: 16.8px !important;
            letter-spacing: -0.56px !important;
          }
          #report-content .text-body2m {
            font-size: 14px !important;
            line-height: 16.8px !important;
            letter-spacing: -0.42px !important;
          }
          #report-content .text-body3 {
            font-size: 12px !important;
            line-height: 12.6px !important;
            letter-spacing: -0.36px !important;
          }
          #report-content .text-body3m {
            font-size: 12px !important;
            line-height: 12.6px !important;
            letter-spacing: -0.36px !important;
          }
        `}</style>
      </AppLayout>
      <Loading isLoading={isDownloadingPDF} />
    </>
  );
}
