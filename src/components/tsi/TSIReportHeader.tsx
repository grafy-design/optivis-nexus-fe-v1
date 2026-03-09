"use client";

import { useState, useEffect } from "react";

interface TSIReportHeaderProps {
  onSaveAsPDF?: () => void;
}

export function TSIReportHeader({ onSaveAsPDF }: TSIReportHeaderProps) {
  const [titleFontSize, setTitleFontSize] = useState(42);

  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const currentDate = `${year}. ${month}. ${day} ${hours}:${minutes}:${seconds}`;

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "0 12px 4px 12px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <div className="flex flex-col gap-1 flex-shrink-0 items-start">
        <div className="text-title text-neutral-5 text-left" style={{ fontSize: titleFontSize, lineHeight: "120%" }}>
          Target Subgroup Identification
        </div>
        <p className="text-body2m text-neutral-50 text-left">
          {currentDate}
        </p>
      </div>
      <button
        type="button"
        className="btn-tsi btn-tsi-secondary"
        onClick={onSaveAsPDF}
      >
        Save as PDF
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path d="M3 13H13M8 3V11M5 8L8 11L11 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}