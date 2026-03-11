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
          <GlassBtn width={170} iconSrc="/assets/figma/home/header-download-icon.png">
            Data template
          </GlassBtn>
          <GlassBtn width={170} iconSrc="/assets/figma/home/header-setting-icon.png">
            Data setting
          </GlassBtn>
        </>
      )}

      {/* ── ATS ── */}
      {type === "ats" && (
        <div className="flex items-center gap-4">
          {pathname.includes("/report") ? (
            <button
              onClick={() => window.dispatchEvent(new Event("save-report-pdf"))}
              className="h-12 px-5 bg-[#aaaaad] text-white rounded-[100px] text-body3 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Image
                src="/assets/header/download.svg"
                alt=""
                width={22}
                height={22}
                className="brightness-0 invert"
              />
              Save as PDF
            </button>
          ) : (
            <button
              onClick={() => isApplied && router.push(ATS_REPORT_PATH)}
              disabled={!isApplied}
              className={`px-5 py-2.5 rounded-[100px] text-body3 flex items-center gap-2 transition-opacity ${
                isApplied
                  ? "bg-[#262255] text-white hover:opacity-90"
                  : "bg-[#262255]/40 text-white cursor-not-allowed"
              }`}
            >
              Make Report
              <Image src="/assets/simulation/FilePdf.png" alt="PDF" width={24} height={24} />
            </button>
          )}
          {/* Back/Forward Nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                router.push(pathname.includes("/report") ? ATS_SIMULATION_PATH : "/")
              }
              className="hover:opacity-70 transition-opacity"
            >
              <Image src="/assets/simulation/back.png" alt="Back" width={48} height={48} />
            </button>
            <button
              onClick={() => isApplied && router.push(ATS_REPORT_PATH)}
              disabled={!isApplied}
              className={`transition-opacity ${
                isApplied ? "hover:opacity-70" : "opacity-40 cursor-not-allowed"
              }`}
            >
              <Image src="/assets/simulation/front.png" alt="Forward" width={48} height={48} />
            </button>
          </div>
        </div>
      )}

      {/* ── TSI ── */}
      {type === "tsi" && (
        <button
          onClick={() => {
            const activeIndex = getActiveStepIndex("tsi", pathname, 0);
            router.push(getTSIPrevPath(activeIndex));
          }}
          className="relative w-[55px] h-[55px] flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{
            backgroundImage: "url('/assets/sidebar-folder-button.png')",
            backgroundSize: "cover",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
          className="figma-header-btn-cir w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
        className="figma-header-btn-cir w-[55px] h-[55px] flex items-center justify-center border-none cursor-pointer hover:opacity-70 transition-opacity shrink-0"
      >
        <span
          className="text-icon-on-button font-semibold"
          style={{ fontSize: "20px" }}
        >
          ?
        </span>
      </button>
    </>
  );
};
