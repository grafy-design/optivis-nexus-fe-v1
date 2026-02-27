"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import IconButton from "@/components/ui/icon-button";
import { useSimulationStore, type SimulationState } from "@/store/simulationStore";

export const ATSHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isApplied = useSimulationStore((state: SimulationState) => state.isApplied);

  const simulationBasePath = "/ats/simulation";
  const reportPath = `${simulationBasePath}/report`;
  const isReportPage = pathname === reportPath;

  const handleMakeReport = () => {
    if (isApplied) {
      router.push(reportPath);
    }
  };

  return (
    <header className="sticky top-0 z-[90] mt-0 pt-0 mb-0 w-full bg-[#e7e5e7]">
      <div className="w-full h-[90px] px-10 flex justify-between items-center">
        {/* Left - Breadcrumb */}
        <div className="flex items-center gap-9">
          {/* Breadcrumb Item 1 */}
          <button
            onClick={() => router.push(simulationBasePath)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <rect width="16" height="16" rx="8" fill={isReportPage ? "#939090" : "#2D1067"} />
              <path
                d="M7.95898 12.5V5.5332H7.85352L5.75 7.01562V5.59766L7.95898 4.04492H9.46484V12.5H7.95898Z"
                fill="white"
              />
            </svg>
            <span className={`text-body2 ${isReportPage ? "text-[#797676]" : "text-[#2d1067]"}`}>
              Study Design Optimization
            </span>
          </button>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
          >
            <rect width="16" height="16" rx="8" fill="#939090" />
            <path
              d="M10.8916 7.82715C10.8916 7.91504 10.874 7.99854 10.8389 8.07764C10.8066 8.15381 10.7539 8.22705 10.6807 8.29736L7.30127 11.6064C7.18701 11.7178 7.04785 11.7734 6.88379 11.7734C6.77832 11.7734 6.68018 11.7471 6.58936 11.6943C6.49854 11.6416 6.42529 11.5713 6.36963 11.4834C6.31689 11.3955 6.29053 11.2959 6.29053 11.1846C6.29053 11.0234 6.35205 10.8799 6.4751 10.7539L9.48535 7.82715L6.4751 4.90039C6.35205 4.77734 6.29053 4.63379 6.29053 4.46973C6.29053 4.36133 6.31689 4.26318 6.36963 4.17529C6.42529 4.08447 6.49854 4.0127 6.58936 3.95996C6.68018 3.90723 6.77832 3.88086 6.88379 3.88086C7.04785 3.88086 7.18701 3.93652 7.30127 4.04785L10.6807 7.35693C10.751 7.42725 10.8037 7.50049 10.8389 7.57666C10.874 7.65283 10.8916 7.73633 10.8916 7.82715Z"
              fill="white"
            />
          </svg>
          {/* Breadcrumb Item 2 */}
          <button
            onClick={() => {
              if (isApplied) {
                router.push(reportPath);
              }
            }}
            disabled={!isApplied}
            className={`flex items-center gap-2 transition-opacity ${
              isApplied
                ? "hover:opacity-70 cursor-pointer"
                : "cursor-not-allowed"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <rect
                width="16"
                height="16"
                rx="8"
                fill={isReportPage ? "#2D1067" : "#939090"}
              />
              <path
                d="M5.11719 12.5V11.4805L7.88867 8.64453C8.27148 8.25781 8.56836 7.93945 8.7793 7.68945C8.99414 7.43555 9.14453 7.21289 9.23047 7.02148C9.31641 6.82617 9.35938 6.62109 9.35938 6.40625V6.38867C9.35938 6.13086 9.30273 5.90039 9.18945 5.69727C9.07617 5.49414 8.91406 5.33594 8.70312 5.22266C8.49219 5.10547 8.24023 5.04688 7.94727 5.04688C7.65039 5.04688 7.38867 5.10938 7.16211 5.23438C6.93555 5.35547 6.75977 5.52539 6.63477 5.74414C6.50977 5.96289 6.44727 6.21875 6.44727 6.51172L6.44141 6.53516L5.03516 6.5293L5.0293 6.51172C5.0293 5.98438 5.15625 5.51953 5.41016 5.11719C5.66406 4.71484 6.01562 4.40039 6.46484 4.17383C6.91406 3.94727 7.43359 3.83398 8.02344 3.83398C8.57031 3.83398 9.05664 3.9375 9.48242 4.14453C9.91211 4.35156 10.248 4.63672 10.4902 5C10.7324 5.36328 10.8535 5.7832 10.8535 6.25977V6.27734C10.8535 6.59375 10.793 6.9043 10.6719 7.20898C10.5508 7.50977 10.3438 7.83984 10.0508 8.19922C9.76172 8.55859 9.36133 8.98633 8.84961 9.48242L6.75781 11.5156L7.15625 10.8477V11.5156L6.75781 11.252H10.9824V12.5H5.11719Z"
                fill="white"
              />
            </svg>
            <span
              className={`text-body2 ${isReportPage ? "text-[#2d1067]" : "text-[#797676]"}`}
            >
              Report
            </span>
          </button>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-4">
          {isReportPage && (
            <button
              onClick={() => window.dispatchEvent(new Event("save-report-pdf"))}
              className="h-12 px-5 bg-[#aaaaad] text-white rounded-[100px] text-body3 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <Image
                src="/assets/header/download.svg"
                alt=""
                width={22}
                height={22}
                className="object-contain brightness-0 invert"
              />
              Save as PDF
            </button>
          )}
          {!isReportPage && (
            <button
              onClick={handleMakeReport}
              disabled={!isApplied}
              className={`px-5 py-2.5 rounded-[100px] text-body3 transition-opacity flex items-center gap-2 ${
                isApplied
                  ? "bg-[#262255] text-white hover:opacity-90 cursor-pointer"
                  : "bg-[#262255] text-white cursor-not-allowed"
              }`}
            >
              Make Report
              <Image
                src="/assets/simulation/FilePdf.png"
                alt="PDF"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
            </button>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isReportPage) {
                  router.push(simulationBasePath);
                } else {
                  router.push("/");
                }
              }}
              className="w-12 h-12 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer rounded-full overflow-hidden"
            >
              <Image
                src="/assets/simulation/back.png"
                alt="Back"
                width={48}
                height={48}
                className="flex-shrink-0 w-full h-full object-contain"
              />
            </button>
            <button
              onClick={() => {
                if (isApplied) {
                  router.push(reportPath);
                }
              }}
              disabled={!isApplied}
              className={`w-12 h-12 flex items-center justify-center transition-opacity rounded-full overflow-hidden ${
                isApplied
                  ? "hover:opacity-70 cursor-pointer"
                  : "cursor-not-allowed"
              }`}
            >
              <Image
                src="/assets/simulation/front.png"
                alt="Forward"
                width={48}
                height={48}
                className="flex-shrink-0 w-full h-full object-contain"
              />
            </button>
          </div>

          <IconButton icon="/assets/header/help.png" alt="Help" />
        </div>
      </div>
    </header>
  );
};
