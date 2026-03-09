"use client";

import { useState, useEffect } from "react";

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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      {/* 모달 카드 (클릭 버블링 방지) / Modal card (stop propagation) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "480px",
          borderRadius: "24px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "36px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >

        {/* 글래스모피즘 배경 레이어 / Glassmorphism background layers */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            pointerEvents: "none",
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: "24px", background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "24px", background: "rgba(255,255,255,0.88)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "24px", background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
        </div>

        {/* 모달 폼 필드 / Modal form fields */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Study Title 입력 / Study Title input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#484646", letterSpacing: "-0.51px", lineHeight: "17.85px", margin: 0 }}>
              Study Title
            </p>
            <input
              type="text"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="Write a title"
              style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "12px", color: "#787776", letterSpacing: "-0.36px", lineHeight: "13.2px", background: "none", border: "none", outline: "none", padding: 0, width: "100%" }}
            />
          </div>

          {/* Date 표시 (자동) / Date display (auto) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#484646", letterSpacing: "-0.51px", lineHeight: "17.85px", margin: 0 }}>
              Date
            </p>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "12px", color: "#787776", letterSpacing: "-0.36px", lineHeight: "13.2px", margin: 0 }}>
              {new Date().toISOString().replace("T", " ").slice(0, 19)}
            </p>
          </div>

          {/* Version 표시 / Version display */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#484646", letterSpacing: "-0.51px", lineHeight: "17.85px", margin: 0 }}>
              Version
            </p>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "12px", color: "#787776", letterSpacing: "-0.36px", lineHeight: "13.2px", margin: 0 }}>
              v 1.1
            </p>
          </div>

          {/* Description 입력 (최대 30자) / Description input (max 30 chars) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#484646", letterSpacing: "-0.51px", lineHeight: "17.85px", margin: 0 }}>
              Description
            </p>
            <div style={{ background: "#d9d9d9", borderRadius: "12px", padding: "0 20px", height: "36px", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                value={simDesc}
                onChange={(e) => setSimDesc(e.target.value.slice(0, 30))}
                placeholder="Please enter a description."
                style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "19.5px", color: "#787776", letterSpacing: "-0.585px", background: "none", border: "none", outline: "none", width: "100%" }}
              />
            </div>
          </div>

        </div>

        {/* 모달 버튼 영역 / Modal action buttons */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "12px", justifyContent: "center" }}>
          {/* Close 버튼 / Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{ width: "180px", height: "48px", borderRadius: "36px", border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#231f52", letterSpacing: "-0.51px", background: "rgba(255,255,255,0.92)", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)" }}
          >
            Close
          </button>
          {/* Save 버튼 / Save button */}
          <button
            type="button"
            onClick={() => onSave(simName, simDesc)}
            style={{ width: "180px", height: "48px", borderRadius: "36px", border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: "17px", color: "#ffffff", letterSpacing: "-0.51px", background: "#231f52", boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)" }}
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
