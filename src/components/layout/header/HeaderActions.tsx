"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useSimulationStore, type SimulationState } from "@/store/simulationStore";
import { GlassBtn } from "./GlassBtn";
import {
  ATS_SIMULATION_PATH,
  ATS_REPORT_PATH,
  getActiveStepIndex,
  getTSIPrevPath,
} from "./constants";

interface HeaderActionsProps {
  type: "default" | "ats" | "tsi" | "drd";
  drdStep?: number;
}

/** 우측 버튼 영역 — type에 따라 적절한 액션 버튼 조합 */
export const HeaderActions: React.FC<HeaderActionsProps> = ({ type, drdStep = 1 }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isApplied = useSimulationStore((state: SimulationState) => state.isApplied);

  return (
    <>
      {/* ── Default (홈) ── */}
      {type === "default" && (
        <>
          <GlassBtn iconSrc="/icons/basics/download-20.svg">
            Data template
          </GlassBtn>
          <GlassBtn iconSrc="/icons/basics/setting-20.svg">
            Data setting
          </GlassBtn>
        </>
      )}

      {/* ── ATS ── */}
      {type === "ats" && (
        <div className="flex items-center gap-4">
          {pathname.includes("/report") ? (
            <GlassBtn
              width={180}
              iconSrc="/assets/header/download.svg"
              onClick={() => window.dispatchEvent(new Event("save-report-pdf"))}
            >
              <div className="pr-1">Save as PDF</div>
            </GlassBtn>
          ) : (
            <button
              type="button"
              onClick={() => isApplied && router.push(ATS_REPORT_PATH)}
              disabled={!isApplied}
              className="rounded-[32px] h-10 px-6 gap-2 [@media(max-width:1470px)]:h-[30px] [@media(max-width:1470px)]:px-4 [@media(max-width:1470px)]:gap-1.5 [@media(max-width:1470px)]:rounded-[24px] inline-flex items-center justify-center border-none cursor-pointer shrink-0 transition-colors"
              style={{
                background: !isApplied ? "var(--primary-30)" : "var(--primary-15)",
                cursor: !isApplied ? "default" : "pointer",
              }}
              onMouseEnter={(e) => { if (isApplied) (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-20)"; }}
              onMouseLeave={(e) => { if (isApplied) (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-15)"; }}
              onMouseDown={(e) => { if (isApplied) (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-10)"; }}
              onMouseUp={(e) => { if (isApplied) (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-20)"; }}
            >
              <span className="flex items-center shrink-0">
                <Image src="/assets/simulation/FilePdf.png" alt="" width={16} height={16} className="[@media(max-width:1470px)]:w-3 [@media(max-width:1470px)]:h-3" style={{ objectFit: "contain" }} />
              </span>
              <span
                className="text-body4m"
                style={{ color: "#fff", whiteSpace: "nowrap" }}
              >
                Make Report
              </span>
            </button>
          )}
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() =>
              router.push(pathname.includes("/report") ? ATS_SIMULATION_PATH : "/")
            }
            className="figma-header-btn-cir w-[55px] h-[55px] [@media(max-width:1470px)]:w-[41px] [@media(max-width:1470px)]:h-[41px] flex items-center justify-center border-none cursor-pointer transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="[@media(max-width:1470px)]:w-[18px] [@media(max-width:1470px)]:h-[18px] [@media(max-width:1470px)]:relative [@media(max-width:1470px)]:-top-px">
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="var(--icon-on-button)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── TSI ── */}
      {type === "tsi" && (
        <button
          onClick={() => {
            const activeIndex = getActiveStepIndex("tsi", pathname, 0);
            router.push(getTSIPrevPath(activeIndex));
          }}
          className="relative w-[55px] h-[55px] [@media(max-width:1470px)]:w-[41px] [@media(max-width:1470px)]:h-[41px] flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{
            backgroundImage: "url('/assets/sidebar-folder-button.png')",
            backgroundSize: "cover",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="[@media(max-width:1470px)]:w-[18px] [@media(max-width:1470px)]:h-[18px] [@media(max-width:1470px)]:relative [@media(max-width:1470px)]:-top-px">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="var(--icon-on-button)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* ── DRD ── */}
      {type === "drd" && drdStep !== 3 && (
        <button
          onClick={() => router.push(drdStep === 1 ? "/" : "/drd/default-setting")}
          className="figma-header-btn-cir w-[55px] h-[55px] [@media(max-width:1470px)]:w-[41px] [@media(max-width:1470px)]:h-[41px] flex items-center justify-center border-none cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="[@media(max-width:1470px)]:w-[18px] [@media(max-width:1470px)]:h-[18px] [@media(max-width:1470px)]:relative [@media(max-width:1470px)]:-top-px">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="var(--icon-on-button)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* ── 공통 Help 버튼 ── */}
      <button
        type="button"
        className="figma-header-btn-cir w-[55px] h-[55px] [@media(max-width:1470px)]:w-[41px] [@media(max-width:1470px)]:h-[41px] flex items-center justify-center border-none cursor-pointer transition-all shrink-0"
      >
        <span
          className="text-icon-on-button font-semibold [@media(max-width:1470px)]:!text-[15px]"
          style={{ fontSize: "20px" }}
        >
          ?
        </span>
      </button>
    </>
  );
};
