"use client";

import { useState, useEffect } from "react";
import SolidButton from "@/components/ui/solid-button";

interface TSISaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, desc: string) => void;
}

export function TSISaveModal({ open, onClose, onSave }: TSISaveModalProps) {
  const [simName, setSimName] = useState("");
  const [simDesc, setSimDesc] = useState("");

  // 모달이 열릴 때 입력값 초기화
  useEffect(() => {
    if (open) {
      setSimName("");
      setSimDesc("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      {/* 모달 카드 (클릭 버블링 방지) / Modal card (stop propagation) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-[24px] gap-9 relative flex flex-col overflow-hidden"
        style={{
          width: "420px",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >

        {/* 글래스모피즘 배경 레이어 / Glassmorphism background layers */}
        <div
          aria-hidden="true"
          className="rounded-[24px] absolute inset-0 pointer-events-none"
        >
          <div className="rounded-[24px] absolute inset-0" style={{ background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
          <div className="rounded-[24px] absolute inset-0" style={{ background: "rgba(255,255,255,0.88)" }} />
          <div className="rounded-[24px] absolute inset-0" style={{ background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
        </div>

        {/* 모달 폼 필드 / Modal form fields */}
        <div className="gap-4 relative flex flex-col" style={{ zIndex: 1 }}>

          {/* Study Title 입력 / Study Title input */}
          <div className="gap-1 flex flex-col">
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "15px", color: "#484646", letterSpacing: "-0.45px", lineHeight: "15.75px", margin: 0 }}>
              Study Title
            </p>
            <input
              type="text"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="Write a title"
              className="w-full border-none"
              style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "12px", color: "var(--icon-primary)", letterSpacing: "-0.36px", lineHeight: "13.2px", background: "none", outline: "none", padding: 0 }}
            />
          </div>

          {/* Date 표시 (자동) / Date display (auto) */}
          <div className="gap-1 flex flex-col">
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "15px", color: "#484646", letterSpacing: "-0.45px", lineHeight: "15.75px", margin: 0 }}>
              Date
            </p>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "12px", color: "var(--icon-primary)", letterSpacing: "-0.36px", lineHeight: "13.2px", margin: 0 }}>
              {new Date().toISOString().replace("T", " ").slice(0, 19)}
            </p>
          </div>

          {/* Version 표시 / Version display */}
          <div className="gap-1 flex flex-col">
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "15px", color: "#484646", letterSpacing: "-0.45px", lineHeight: "15.75px", margin: 0 }}>
              Version
            </p>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "12px", color: "var(--icon-primary)", letterSpacing: "-0.36px", lineHeight: "13.2px", margin: 0 }}>
              v 1.1
            </p>
          </div>

          {/* Description 입력 (최대 30자) / Description input (max 30 chars) */}
          <div className="gap-1.5 flex flex-col">
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "15px", color: "#484646", letterSpacing: "-0.45px", lineHeight: "15.75px", margin: 0 }}>
              Description
            </p>
            <div className="rounded-[12px] flex items-center" style={{ background: "#d9d9d9", padding: "0 20px", height: "36px" }}>
              <input
                type="text"
                value={simDesc}
                onChange={(e) => setSimDesc(e.target.value.slice(0, 30))}
                placeholder="Please enter a description."
                className="w-full border-none"
                style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "15px", color: "var(--icon-primary)", letterSpacing: "-0.45px", background: "none", outline: "none" }}
              />
            </div>
          </div>

        </div>

        {/* 모달 버튼 영역 / Modal action buttons */}
        <div className="gap-3 relative flex justify-center" style={{ zIndex: 1 }}>
          {/* Close 버튼 / Close button */}
          <SolidButton
            variant="secondary"
            size="L"
            className="w-[180px]"
            onClick={onClose}
          >
            Close
          </SolidButton>
          {/* Save 버튼 / Save button */}
          <SolidButton
            variant="primary"
            size="L"
            className="w-[180px]"
            onClick={() => onSave(simName, simDesc)}
          >
            Save
          </SolidButton>
        </div>

      </div>
    </div>
  );
}
