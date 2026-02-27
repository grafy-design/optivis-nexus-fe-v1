"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSimulationStore, type SimulationState } from "@/store/simulationStore";

// ── SVG 아이콘 ──────────────────────────────────────────────────────────────



function CheckboxChecked({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <rect x="0.5" y="0.5" width="16" height="16" rx="3.5" fill="#3a11d8" stroke="#3a11d8" />
      <path d="M4 8.5l3.5 3.5 5.5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckboxUnchecked({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <rect x="0.5" y="0.5" width="16" height="16" rx="3.5" fill="white" stroke="#c6c5c9" />
    </svg>
  );
}

function IconDownload({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v13M7 11l5 5 5-5" stroke="#484646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#484646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAddFolder({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="#484646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v6M9 14h6" stroke="#484646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="#929090" strokeWidth="1.4" />
      <path d="M13.5 13.5l3 3" stroke="#929090" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconWarning({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5.134 1.5L0.804 9a1 1 0 00.866 1.5h8.66A1 1 0 0011.196 9L6.866 1.5a1 1 0 00-1.732 0z" fill="#F59E0B" />
      <path d="M6 4.5v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6" cy="8.5" r="0.6" fill="white" />
    </svg>
  );
}

function IconDelete({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.5 4h11M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M6.5 7v4M9.5 7v4M3.5 4l.75 8.5a1 1 0 001 .9h5.5a1 1 0 001-.9L12.5 4" stroke="#aaaaad" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 리퀴드 글래스 버튼 ──────────────────────────────────────────────────────

function GlassIconButton({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ── Category Frame ───────────────────────────────────────────────────────────

type CategoryItem = { label: string; selected?: boolean; disabled?: boolean; saved?: boolean };
type CategoryFrameProps = { header: string; items: CategoryItem[]; onSelect?: (index: number) => void };

function CategoryFrame({ header, items, onSelect }: CategoryFrameProps) {
  return (
    <div style={{ background: "white", borderRadius: 12, flex: 1, minWidth: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`
        .cat-row { transition: background 0.1s; }
        .cat-row.cat-selected { background: #262255 !important; }
        .cat-row.cat-selected:hover { background: #2e2a66 !important; }
        .cat-row.cat-selected:active { background: #1a1738 !important; }
        .cat-row.cat-normal:hover { background: #efeff4 !important; }
        .cat-row.cat-normal:active { background: #e2e1e5 !important; }
        .cat-list::-webkit-scrollbar { width: 4px; }
        .cat-list::-webkit-scrollbar-track { background: transparent; }
        .cat-list::-webkit-scrollbar-thumb { background: #c6c5c9; border-radius: 2px; }
      `}</style>
      <div style={{ height: 36, borderBottom: "1px solid #aaaaad", display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 12, flexShrink: 0 }}>
        <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#262255", letterSpacing: "-0.68px", lineHeight: "1.12", width: 180 }}>
          {header}
        </span>
      </div>
      <div className="cat-list" style={{ overflowY: "auto", flex: 1 }}>
        {items.map((item, i) => {
          const isSelected = item.selected;
          const isDisabled = item.disabled;

          const textColor = isSelected ? "white" : isDisabled ? "#c6c5c9" : "#484646";
          const chevronColor = isSelected ? "rgba(255,255,255,0.7)" : isDisabled ? "#e2e1e5" : "#c6c5c9";
          const rowClass = `cat-row ${isDisabled ? "" : isSelected ? "cat-selected" : "cat-normal"}`;

          return (
            <div
              key={i}
              className={rowClass}
              onClick={() => !isDisabled && onSelect?.(i)}
              style={{
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingLeft: 16,
                paddingRight: 8,
                ...(isSelected ? { background: "#262255" } : {}),
                cursor: isDisabled ? "default" : "pointer",
                userSelect: "none",
              }}
            >
              <span style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 500, color: textColor, letterSpacing: "-0.6px", lineHeight: "1.1" }}>
                {item.label}
              </span>
              <div style={{ width: 24, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M4 3L7 5.5L4 8" stroke={chevronColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── 글래스 Test 버튼 ───────────────────────────────────────────────────────

function GlassTestButton({ disabled, onClick }: { disabled?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const bg = disabled ? "#F5F5F7" : pressed ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)" : hovered ? "#EBEBEB" : "#F7F7F7";
  const textColor = disabled ? "#C6C5C9" : pressed ? "#3a11d8" : "#262255";
  return (
    <div
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
      style={{
        position: "relative",
        height: 40,
        paddingLeft: 20,
        paddingRight: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        borderRadius: 36,
        boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "#333333", mixBlendMode: "color-dodge" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: bg, transition: "background 0.12s" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: pressed ? "2px solid rgba(58,17,216,0.19)" : "2px solid rgba(255,255,255,0.3)", boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)", transition: "border-color 0.12s" }} />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 17,
          color: textColor,
          letterSpacing: "-0.51px",
          whiteSpace: "nowrap",
          paddingTop: 2,
          transition: "color 0.12s",
        }}
      >
        Test Load
      </span>
    </div>
  );
}

// ── ResizablePill ────────────────────────────────────────────────────────────

// 상태별 스타일
// Default:  bg=#efeff4, border=#c6c5c9, text=#484646, grip=#aaaaad
// Hover:    bg=#e2e1e8, border=#b0afb8, text=#484646, grip=#8a8a90
// Pressed:  bg=rgba(58,17,216,0.12), border=rgba(58,17,216,0.3), text=#3a11d8, grip=#7a55e8
// Disabled: bg=#f5f5f7, border=#e2e1e5, text=#c6c5c9, grip=#e2e1e5

function ResizablePill({ disabled, name, code, testLeftPct, testWidthPct, resetKey }: { disabled?: boolean; name: string; code: string; testLeftPct?: number; testWidthPct?: number; resetKey?: number }) {
  const minW = 60;
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultW = Math.max(minW, name.length * 8 + (code ? code.length * 8 + 14 : 0) + 36);
  const [width, setWidth] = useState(defaultW);
  const [left, setLeft] = useState(16);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const dragRef = useRef<{ type: "left" | "right" | "move"; startX: number; startW: number; startL: number } | null>(null);

  const pillState = disabled ? "disabled" : pressed ? "pressed" : hovered ? "hover" : "default";
  const styles = {
    default:  { bg: "#efeff4",              border: "1px solid #c6c5c9",              text: "#484646", code: "#929090", grip: "#aaaaad" },
    hover:    { bg: "#e2e1e8",              border: "1px solid #b0afb8",              text: "#484646", code: "#929090", grip: "#8a8a90" },
    pressed:  { bg: "rgba(58,17,216,0.12)", border: "1px solid rgba(58,17,216,0.3)", text: "#3a11d8", code: "#7a55e8", grip: "#7a55e8" },
    disabled: { bg: "#f5f5f7",              border: "1px solid #e2e1e5",              text: "#c6c5c9", code: "#c6c5c9", grip: "#e2e1e5" },
  }[pillState];

  // 컨테이너 실제 너비 기준으로 pill 너비 초기화 + resize 반응
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const update = () => {
      const containerW = parent.clientWidth;
      if (containerW > 0) {
        if (testLeftPct !== undefined && testWidthPct !== undefined) {
          setLeft(Math.round(containerW * testLeftPct / 100));
          setWidth(Math.round(containerW * testWidthPct / 100));
        } else {
          const clampedW = Math.min(containerW - left, Math.max(minW, defaultW));
          setWidth(clampedW);
        }
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testLeftPct, testWidthPct, resetKey]);

  const startDrag = (type: "left" | "right" | "move") => (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setPressed(true);
    dragRef.current = { type, startX: e.clientX, startW: width, startL: left };

    const onMove = (mv: MouseEvent) => {
      if (!dragRef.current) return;
      const parent = containerRef.current?.parentElement;
      const containerW = parent?.clientWidth ?? 800;
      const dx = mv.clientX - dragRef.current.startX;
      if (dragRef.current.type === "right") {
        const newW = Math.min(containerW - dragRef.current.startL, Math.max(minW, dragRef.current.startW + dx));
        setWidth(newW);
      } else if (dragRef.current.type === "left") {
        const newW = Math.min(containerW, Math.max(minW, dragRef.current.startW - dx));
        const newL = dragRef.current.startL + (dragRef.current.startW - newW);
        setWidth(newW);
        setLeft(Math.max(0, newL));
      } else {
        const newL = Math.max(0, Math.min(containerW - dragRef.current.startW, dragRef.current.startL + dx));
        setLeft(newL);
      }
    };
    const onUp = () => {
      dragRef.current = null;
      setPressed(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const GripIcon = () => (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" style={{ flexShrink: 0 }}>
      {[0, 1, 2].map(r => [0, 1].map(c => (
        <circle key={`${r}-${c}`} cx={4 + c * 4} cy={4 + r * 4} r="1.2" fill={styles.grip} />
      )))}
    </svg>
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      style={{
        position: "absolute",
        left,
        top: 0,
        bottom: 0,
        width,
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 4,
        background: styles.bg,
        border: styles.border,
        userSelect: "none",
        boxSizing: "border-box",
        zIndex: 1,
        overflow: "hidden",
        transition: "background 0.12s, border-color 0.12s",
        cursor: disabled ? "not-allowed" : "default",
      }}
    >
      {/* 왼쪽 그립 — 좌측 크기 조절 */}
      <div
        onMouseDown={startDrag("left")}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: "100%", cursor: disabled ? "not-allowed" : "ew-resize", flexShrink: 0 }}
      >
        <GripIcon />
      </div>
      {/* 텍스트 영역 — 드래그 이동 */}
      <div
        onMouseDown={startDrag("move")}
        style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, minWidth: 0, overflow: "hidden", cursor: disabled ? "not-allowed" : "grab", height: "100%" }}
      >
        <span style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: styles.text, letterSpacing: "-0.48px", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{name}</span>
        {code && (
          <span style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: styles.code, letterSpacing: "-0.48px", lineHeight: 1.15, whiteSpace: "nowrap", flexShrink: 0 }}>{code}</span>
        )}
      </div>
      {/* 오른쪽 그립 — 우측 크기 조절 */}
      <div
        onMouseDown={startDrag("right")}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: "100%", cursor: disabled ? "not-allowed" : "ew-resize", flexShrink: 0 }}
      >
        <GripIcon />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

// ── Save Progress 모달 ───────────────────────────────────────────────────────

function SaveProgressModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {/* 모달 */}
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: "white", borderRadius: 20, padding: "28px 28px 24px", width: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "Inter", fontSize: 20, fontWeight: 700, color: "#262255", letterSpacing: "-0.6px", lineHeight: 1.2 }}>
                Save Simulation
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "#929090", letterSpacing: "-0.39px", lineHeight: 1.3, marginTop: 4 }}>
                Enter a name to save current simulation settings.
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="#aaaaad" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 입력 필드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: "#484646", letterSpacing: "-0.39px" }}>
              Simulation Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
              placeholder="e.g. DRD Baseline HbA1c 12m"
              style={{
                height: 44,
                background: "#efeff4",
                borderRadius: 10,
                border: "1.5px solid transparent",
                paddingLeft: 14,
                paddingRight: 14,
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: 15,
                color: "#262255",
                letterSpacing: "-0.45px",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "#3a11d8"; }}
              onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "transparent"; }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                height: 40, paddingLeft: 20, paddingRight: 20, borderRadius: 36, border: "1.5px solid #c6c5c9",
                background: "transparent", fontFamily: "Inter", fontWeight: 600, fontSize: 15,
                color: "#484646", letterSpacing: "-0.45px", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                height: 40, paddingLeft: 20, paddingRight: 20, borderRadius: 36, border: "none",
                background: name.trim() ? "#3a11d8" : "#c6c5c9",
                fontFamily: "Inter", fontWeight: 600, fontSize: 15,
                color: "white", letterSpacing: "-0.45px",
                cursor: name.trim() ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Save Toast ───────────────────────────────────────────────────────────────

function SaveToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: "#262255", borderRadius: 36, paddingLeft: 20, paddingRight: 20, height: 44,
      display: "flex", alignItems: "center", gap: 10, zIndex: 10001,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      animation: "fadeInUp 0.22s ease",
    }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#4ade80" />
        <path d="M5 8l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, color: "white", letterSpacing: "-0.42px", whiteSpace: "nowrap" }}>
        {message}
      </span>
    </div>
  );
}

export default function SimulationConditionPage() {
  const router = useRouter();
  const [followUpMonths, setFollowUpMonths] = useState(12);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const followUpRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<number | null>(null);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [unitValues, setUnitValues] = useState(["%" , "%", "%"]);
  const [openUnitIdx, setOpenUnitIdx] = useState<number | null>(null);
  const [unitDropdownPos, setUnitDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [monthValues, setMonthValues] = useState(["6", "6", "3"]);
  const [inputValues, setInputValues] = useState(["10", "0", "-10"]);
  const [pillResetKey, setPillResetKey] = useState(0);

  // Save Progress 상태
  const [savedSimId, setSavedSimId] = useState<string | null>(null);
  const [savedSimName, setSavedSimName] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleTestLoad = () => {
    setSelectedCategory(0);
    setSelectedDetail(1);
    setSelectedValue(2);
    setFollowUpMonths(12);
    setInputValues(["10", "0", "-10"]);
    setUnitValues(["%", "%", "%"]);
    setMonthValues(["6", "6", "3"]);
    // pillPositions[strategyIdx]: A=0, B=1, C=2
    setDrugList([
      { ...allDrugRows[0], id: 0, pillPositions: [{ leftPct: 0, widthPct: 100 }, { leftPct: 0, widthPct: 100 }, { leftPct: 0, widthPct: 100 }] },
      { ...allDrugRows[1], id: 1, pillPositions: [{ leftPct: 0, widthPct: 50 },  { leftPct: 0, widthPct: 100 }, { leftPct: 0, widthPct: 100 }] },
      { ...allDrugRows[2], id: 2, pillPositions: [{ leftPct: 62.5, widthPct: 37.5 }, { leftPct: 0, widthPct: 100 }, null] },
    ]);
    setPillResetKey(k => k + 1);
  };
  const setSimCondCompleted = useSimulationStore((s: SimulationState) => s.setSimCondCompleted);
  const setSimCondData = useSimulationStore((s: SimulationState) => s.setSimCondData);
  const simSmilesCompleted = useSimulationStore((s: SimulationState) => s.simSmilesCompleted);

  const maxMonths = 24;
  const sliderPct = ((followUpMonths - 3) / (maxMonths - 3)) * 100;

  const allDrugRows = [
    { type: "Basal insulin", name: "Insulin glargine", code: "A10AE04", checks: [true, true, true], warning: false },
    { type: "SGLT2 inhibitors", name: "Empagliflozin", code: "A10BK03", checks: [true, true, true], warning: false },
    { type: "Sulfonylurea", name: "Glimepiride", code: "A10BB12", checks: [true, true, false], warning: true },
    { type: "DPP-4 inhibitors", name: "Sitagliptin", code: "A10BH01", checks: [false, false, true], warning: false },
    { type: "GLP-1 RA", name: "Liraglutide", code: "A10BJ02", checks: [false, true, false], warning: false },
    { type: "Biguanide", name: "Metformin", code: "A10BA02", checks: [true, false, true], warning: false },
  ];

  const [drugList, setDrugList] = useState<Array<{ type: string; name: string; code: string; checks: boolean[]; warning: boolean; id: number; pillPositions?: Array<{ leftPct: number; widthPct: number } | null> }>>([]);
  const nextIdRef = useRef(allDrugRows.length);

  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [drugSearchOpen, setDrugSearchOpen] = useState(false);
  const [drugSearchPos, setDrugSearchPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const drugSearchContainerRef = useRef<HTMLDivElement>(null);
  const drugSearchDropdownRef = useRef<HTMLDivElement>(null);
  const drugCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drugSearchResults = useMemo(() => {
    const q = drugSearchQuery.toLowerCase().trim();
    if (!q) return allDrugRows;
    return allDrugRows.filter(
      d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
    );
  }, [drugSearchQuery]);

  useEffect(() => {
    if (!drugSearchOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!drugSearchContainerRef.current?.contains(target) && !drugSearchDropdownRef.current?.contains(target)) {
        setDrugSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drugSearchOpen]);

  const drugRows = drugList;

  // ── Save Progress 핸들러 ────────────────────────────────────────────────────

  const getCurrentSnapshot = () => ({
    selectedCategory, selectedDetail, selectedValue,
    followUpMonths, inputValues, unitValues, monthValues, drugList,
  });

  const handleSaveProgress = () => {
    if (savedSimId) {
      // 저장 이력 있음 → 바로 덮어쓰기
      const snapshot = getCurrentSnapshot();
      localStorage.setItem(`sim_save_${savedSimId}`, JSON.stringify(snapshot));
      setSaveToast(`"${savedSimName}" saved`);
    } else {
      // 저장 이력 없음 → 모달 표시
      setShowSaveModal(true);
    }
  };

  const handleSaveConfirm = (name: string) => {
    const id = `${Date.now()}`;
    const snapshot = getCurrentSnapshot();
    localStorage.setItem(`sim_save_${id}`, JSON.stringify(snapshot));
    setSavedSimId(id);
    setSavedSimName(name);
    setShowSaveModal(false);
    setSaveToast(`"${name}" saved`);
  };

  // Confirm 버튼 활성화 조건:
  // 1) followUpMonths가 선택된 상태 (null이 아님)
  // 2) drugList에 체크박스가 하나라도 체크된 약물이 있어야 함
  const canConfirm = followUpMonths !== null &&
    drugList.length > 0 &&
    drugList.some(d => d.checks.some(checked => checked));

  return (
    <AppLayout headerType="drd" drdStep={2} scaleMode="none">
      {/* Unit 드롭다운 — fixed 포지션 (클리핑 방지) */}
      {openUnitIdx !== null && unitDropdownPos && (
        <>
          <div onClick={() => { setOpenUnitIdx(null); setUnitDropdownPos(null); }} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
          <div style={{ position: "fixed", top: unitDropdownPos.top, left: unitDropdownPos.left, minWidth: unitDropdownPos.width, zIndex: 9999, background: "#efeff4", border: "1px solid #c6c5c9", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
            {["%", "mmol/mol"].map((opt, oi) => (
              <div key={opt}>
                <div
                  onClick={() => { setUnitValues(prev => prev.map((v, idx) => idx === openUnitIdx ? opt : v)); setOpenUnitIdx(null); setUnitDropdownPos(null); }}
                  style={{ padding: "6px 10px", fontFamily: "Inter", fontSize: 14, fontWeight: 600, color: unitValues[openUnitIdx] === opt ? "#484646" : "#787776", cursor: "pointer", whiteSpace: "nowrap" }}
                >{opt}</div>
                {oi < 1 && <div style={{ height: 1, background: "#c6c5c9" }} />}
              </div>
            ))}
          </div>
        </>
      )}
         <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px" }}>
        {/* 타이틀 */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1 onClick={() => router.push("/drd/simulation-setting")} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
            Simulation Settings
          </h1>
          <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
            Configure simulation parameters
          </span>
        </div>

        {/* 두 패널 행 */}
        <div style={{ display: "flex", flex: 1, alignItems: "stretch", gap: "0px", minHeight: 0 }}>
          {/* 왼쪽 패널 */}
          <div
            className="w-[380px] h-flex flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-y-auto">
              {/* Step 2: SMILES Settings (완료) */}
              <button
                onClick={() => router.push("/drd/smile-setting")}
                className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                style={{ background: "transparent", height: 96, justifyContent: "center" }}
              >
                <div className="flex items-center gap-[18px]">
                  <div className="shrink-0 flex items-center justify-center">
                    <img src={simSmilesCompleted ? "/icons/simulation-setting/state=completed, step=smiles, Select=Default, Size=24px.svg" : "/icons/simulation-setting/state=not started, step=smiles, Select=Default, Size=24px.svg"} width={24} height={24} alt="" style={{ flexShrink: 0 }} />
                  </div>
                  <span className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]" style={{ color: "#484646" }}>
                    SMILES Settings
                  </span>
                </div>
                <div className="pl-[42px] mt-0">
                  <p className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0" style={{ color: "#919092" }}>
                    {simSmilesCompleted ? "Complete" : "Add SMILES strings to define the chemical structures for simulation conditions"}
                  </p>
                </div>
              </button>

              {/* Step 1: Simulation Conditions (활성) */}
              <button
                onClick={() => router.push("/drd/simulation-condition")}
                className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#2e2a66] active:bg-[#1e1a44]"
                style={{ background: "#262255", height: 96, justifyContent: "center" }}
              >
                <div className="flex items-center gap-[18px]">
                  <div className="shrink-0 flex items-center justify-center">
                    <img src="/icons/simulation-setting/state=completed, step=simulation, Select=Default, Size=24px.svg" width={24} height={24} alt="" style={{ flexShrink: 0 }} />
                  </div>
                  <span className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]" style={{ color: "white" }}>
                    Simulation Conditions
                  </span>
                </div>
                <div className="pl-[42px] mt-0">
                  <p className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Develop a plan to assess the subject&apos;s prognosis based on the entered information.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 오른쪽 패널 */}
          {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
            <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", marginLeft: "-6px" }}>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1, minHeight: 0, overflow: "auto", minWidth: 600 }}>
              {/* 상단 카드: Select target outcome variable — flex 4.5 */}
              <div style={{ background: "rgba(255,255,255,0.60)", borderRadius: 24, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, display: "flex", flexDirection: "column", gap: 12, flex: "1 1 0", minHeight: 0, overflow: "visible", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <div style={{ fontFamily: "Inter", fontSize: 24, fontWeight: 600, color: "#262255", letterSpacing: "-0.72px", lineHeight: 1.2 }}>
                    Select the target outcome variable
                  </div>
                  <GlassTestButton onClick={handleTestLoad} />
                </div>
                {/* 파란 컨테이너: Category/Detail/Value — 위로 튀어나옴 */}
                <div style={{ display: "flex", gap: 17, flex: 1, minHeight: 0, position: "relative", zIndex: 2 }}>
                  <CategoryFrame header="Category" items={[{ label: "Patient Info", selected: selectedCategory === 0, saved: selectedCategory !== 0 }, { label: "Medical History", selected: selectedCategory === 1 }, { label: "Treatment Info", selected: selectedCategory === 2, disabled: true }]} onSelect={(i) => { setSelectedCategory(i); setSelectedDetail(null); setSelectedValue(null); }} />
                  <div style={{ flex: 1, minWidth: 0, opacity: selectedCategory === null ? 0.4 : 1, pointerEvents: selectedCategory === null ? "none" : "auto", transition: "opacity 0.2s" }}>
                    <CategoryFrame header="Detail" items={[{ label: "Demographic Info", selected: selectedDetail === 0 }, { label: "Baseline", selected: selectedDetail === 1 }]} onSelect={(i) => { setSelectedDetail(i); setSelectedValue(null); }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, opacity: selectedDetail === null ? 0.4 : 1, pointerEvents: selectedDetail === null ? "none" : "auto", transition: "opacity 0.2s" }}>
                    <CategoryFrame header="Value" items={[{ label: "BMI", selected: selectedValue === 0 }, { label: "SBP", selected: selectedValue === 1 }, { label: "HbA1c", selected: selectedValue === 2 }, { label: "Fasting glucose", selected: selectedValue === 3 }, { label: "eGFR", disabled: true }]} onSelect={setSelectedValue} />
                  </div>
                </div>

                {/* HbA1c 테이블 */}
                <div style={{ opacity: selectedValue === null ? 0.4 : 1, pointerEvents: selectedValue === null ? "none" : "auto", transition: "opacity 0.2s", flex: 1, minHeight: 0, overflow: "hidden" }}>
                  <div style={{ borderRadius: 12, overflow: "auto", background: "white", display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ background: "white", borderBottom: "1px solid #c6c5c9", display: "flex", alignItems: "flex-end", height: 44, paddingBottom: 4, paddingTop: 12, paddingLeft: 16, paddingRight: 16, gap: 8 }}>
                      <div style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#262255", letterSpacing: "-0.51px", flex: "0 0 25%", lineHeight: 1.05 }}>
                        {selectedValue !== null ? (["BMI", "SBP", "HbA1c", "Fasting glucose"][selectedValue] ?? "[Outcome]") : "[Outcome]"}
                      </div>
                      <div style={{ display: "flex", gap: 8, flex: 1 }}>
                        {["Value", "Unit", "Months"].map((col) => (
                          <div key={col} style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#262255", letterSpacing: "-0.51px", flex: 1, lineHeight: 1.05 }}>{col}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 0", background: "white" }}>
                      {[{ label: "Increase" }, { label: "Stable" }, { label: "Decrease" }].map((row, i) => (
                        <div key={row.label} style={{ background: "white", display: "flex", alignItems: "center", height: 36, paddingLeft: 16, paddingRight: 16 }}>
                          <div style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 500, color: "#484646", letterSpacing: "-0.45px", flex: "0 0 25%" }}>{row.label}</div>
                          <div style={{ display: "flex", gap: 8, flex: 1 }}>
                            <input type="text" value={inputValues[i]} onChange={(e) => setInputValues(prev => prev.map((v, idx) => idx === i ? e.target.value : v))} className="placeholder:text-[#c6c5c9]" style={{ flex: 1, minWidth: 0, height: 36, background: "#efeff4", borderRadius: 8, border: "none", paddingLeft: 12, paddingRight: 12, fontFamily: "Inter", fontWeight: 500, fontSize: 17, color: "#484646", letterSpacing: "-0.68px", outline: "none", cursor: "text" }} />
                            <div style={{ position: "relative", flex: 1 }}>
                              <div onClick={(e) => { if (openUnitIdx === i) { setOpenUnitIdx(null); setUnitDropdownPos(null); } else { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setUnitDropdownPos({ top: rect.bottom + 2, left: rect.left, width: rect.width }); setOpenUnitIdx(i); } }} style={{ background: "#efeff4", borderRadius: 8, height: 36, display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 4, cursor: "pointer", gap: 2 }}>
                                <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 500, color: "#484646", letterSpacing: "-0.68px", lineHeight: 1.1, flex: 1 }}>{unitValues[i]}</span>
                                <img src="/icons/disclosure/Property 1=Close, Size=18.svg" width={18} height={18} alt="" style={{ flexShrink: 0 }} />
                              </div>
                            </div>
                            <input type="text" value={monthValues[i]} onChange={(e) => setMonthValues(prev => prev.map((v, idx) => idx === i ? e.target.value : v))} className="placeholder:text-[#c6c5c9]" style={{ flex: 1, minWidth: 0, height: 36, background: "#efeff4", borderRadius: 8, border: "none", paddingLeft: 12, paddingRight: 12, fontFamily: "Inter", fontWeight: 500, fontSize: 17, color: "#484646", letterSpacing: "-0.68px", outline: "none", cursor: "text" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow-up Window + Develop a plan — 가로 배치 래퍼 */}
              <div style={{ display: "flex", gap: 12, flex: "1 1 0", minHeight: 0, overflow: "auto" }}>

              {/* Follow-up Window — 좌측 1 */}
              <div style={{ flex: "1 1 0", minWidth: 0, background: "#262255", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", gap: 12 }}>
                {/* 헤더 + 설명 텍스트 묶음 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* 헤더 영역 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ lineHeight: 1.2 }}>
                      <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "white", letterSpacing: "-0.68px", lineHeight: 1.2 }}>Follow-up Window</span>
                      <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 600, color: "#f06600", letterSpacing: "-0.68px" }}>*</span>
                    </div>
                    <div ref={followUpRef} style={{ position: "relative" }}>
                      <div onClick={() => setFollowUpOpen((v) => !v)} style={{ background: "#efeff4", borderRadius: 8, height: 28, minWidth: 52, display: "flex", alignItems: "center", paddingLeft: 8, paddingRight: 4, gap: 2, cursor: "pointer", userSelect: "none" }}>
                        <span style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "#484646", letterSpacing: "-0.48px", lineHeight: 1.1, flex: 1 }}>{followUpMonths}</span>
                        <div style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", transform: followUpOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                          <img src="/icons/disclosure/Property 1=Close, Size=18.svg" width={18} height={18} alt="" />
                        </div>
                      </div>
                      {followUpOpen && (
                        <>
                          <div onClick={() => setFollowUpOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
                          <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#efeff4", border: "1px solid #c6c5c9", borderRadius: 8, overflow: "hidden", zIndex: 9999, minWidth: 52, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                            {[3, 6, 9, 12, 15, 18, 21, 24].map((n, i, arr) => (
                              <div key={n}>
                                <div onClick={() => { setFollowUpMonths(n); setFollowUpOpen(false); }} style={{ height: 28, display: "flex", alignItems: "center", paddingLeft: 10, paddingRight: 10, cursor: "pointer", background: followUpMonths === n ? "#dddde6" : "transparent", fontFamily: "Inter", fontSize: 12, fontWeight: 600, color: followUpMonths === n ? "#484646" : "#787776", letterSpacing: "-0.48px", whiteSpace: "nowrap" }} onMouseEnter={(e) => { if (followUpMonths !== n) (e.currentTarget as HTMLDivElement).style.background = "#e8e8f0"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = followUpMonths === n ? "#dddde6" : "transparent"; }}>{n}</div>
                                {i < arr.length - 1 && <div style={{ height: 1, background: "#c6c5c9" }} />}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* 설명 텍스트 */}
                  <p style={{ margin: 0, padding: 0, fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "white", letterSpacing: "-0.39px", lineHeight: 1.25 }}>
                    Sets the follow-up duration (time horizon) for the simulation.<br />
                    Defines how many months outcomes and the timeline are calculated and displayed.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ position: "relative", height: 30 }}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 12, borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, background: "#c6c5c9" }} />
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${sliderPct}%`, background: "#f06600" }} />
                    </div>
                    <div style={{ position: "absolute", left: `calc((100% - 30px) * ${sliderPct} / 100)`, top: "50%", transform: "translate(0, -50%)", width: 30, height: 30, borderRadius: 36, background: "#f9f8fc", boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.12), 0px 6px 13px 0px rgba(0,0,0,0.12)" }} />
                    <input type="range" min={3} max={24} step={3} value={followUpMonths} onChange={(e) => setFollowUpMonths(Number(e.target.value))} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }} />
                  </div>
                  <div style={{ position: "relative", height: 16 }}>
                    {[3, 6, 9, 12, 15, 18, 21, 24].map((n, i) => (
                      <span key={n} style={{ position: "absolute", left: `calc((100% - 24px) * ${i / 7} + 12px)`, transform: "translateX(-50%)", fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "white", letterSpacing: "-0.48px", lineHeight: 1.1, textAlign: "center", whiteSpace: "nowrap" }}>{n}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 하단 카드: Develop a plan — 우측 3 */}
              <div style={{ background: "rgba(255,255,255,0.60)", borderRadius: 24, paddingTop: 10, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, display: "flex", flexDirection: "column", gap: 12, flex: "4 3 0", minHeight: 0, overflow: "auto" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", height: 44, flexShrink: 0 }}>
                  <div style={{ fontFamily: "Inter", fontSize: 24, fontWeight: 600, color: "#262255", letterSpacing: "-0.72px", lineHeight: 1.2, flex: 1, display: "flex", alignItems: "center" }}>
                    Develop a plan for the selected medication
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", height: 44 }}>
                    <GlassIconButton><IconDownload size={24} /></GlassIconButton>
                    <GlassIconButton><IconAddFolder size={24} /></GlassIconButton>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 17, flex: 1, minHeight: 0, overflow: "hidden" }}>
                  {/* 의약품 목록 — 상단 Category 너비와 동일하게 1:2 비율 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 0", minWidth: 0, alignSelf: "stretch", maxWidth: "calc((100% - 34px) / 3)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                      <div style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 500, color: "#484646", letterSpacing: "-0.68px", lineHeight: 1.1 }}>
                        Add on drug<span style={{ color: "#3a11d8" }}>*</span>
                      </div>
                      {/* 검색 필드 — filter 페이지 방식 */}
                      <div
                        ref={drugSearchContainerRef}
                        style={{ position: "relative" }}
                        onMouseEnter={() => {
                          if (drugCloseTimerRef.current) clearTimeout(drugCloseTimerRef.current);
                          const rect = drugSearchContainerRef.current?.getBoundingClientRect();
                          if (rect) setDrugSearchPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                          setDrugSearchOpen(true);
                        }}
                        onMouseLeave={() => {
                          drugCloseTimerRef.current = setTimeout(() => setDrugSearchOpen(false), 120);
                        }}
                      >
                        <div style={{ background: "white", borderRadius: 8, height: 32, display: "flex", alignItems: "center", paddingLeft: 8, paddingRight: 4, gap: 4, overflow: "visible" }}>
                          <IconSearch size={18} />
                          <input
                            type="text"
                            placeholder="Search features"
                            value={drugSearchQuery}
                            onChange={e => {
                              setDrugSearchQuery(e.target.value);
                              const rect = drugSearchContainerRef.current?.getBoundingClientRect();
                              if (rect) setDrugSearchPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                              setDrugSearchOpen(true);
                            }}
                            onFocus={() => {
                              const rect = drugSearchContainerRef.current?.getBoundingClientRect();
                              if (rect) setDrugSearchPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                              setDrugSearchOpen(true);
                            }}
                            style={{
                              flex: 1, border: "none", outline: "none", background: "transparent",
                              fontFamily: "Inter", fontWeight: 500, fontSize: 12,
                              color: "#484646", letterSpacing: "-0.48px",
                            }}
                          />
                        </div>
                        {/* 검색 드롭다운 — Portal */}
                        {drugSearchOpen && typeof document !== "undefined" && createPortal(
                          <div
                            ref={drugSearchDropdownRef}
                            onMouseEnter={() => {
                              if (drugCloseTimerRef.current) clearTimeout(drugCloseTimerRef.current);
                            }}
                            onMouseLeave={() => {
                              drugCloseTimerRef.current = setTimeout(() => setDrugSearchOpen(false), 120);
                            }}
                            style={{
                              position: "fixed",
                              top: drugSearchPos.top,
                              left: drugSearchPos.left,
                              width: drugSearchPos.width,
                              background: "white",
                              borderRadius: 12,
                              paddingTop: 4,
                              paddingBottom: 4,
                              zIndex: 9999,
                              maxHeight: 220,
                              overflowY: "auto",
                              boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
                              border: "1px solid #e2e1e5",
                            }}
                          >
                            {drugSearchResults.length === 0 ? (
                              <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 12, color: "#aaaaad", letterSpacing: "-0.39px" }}>
                                  No results found
                                </span>
                              </div>
                            ) : (
                              drugSearchResults.map((drug, i) => (
                                <div
                                  key={i}
                                  onMouseDown={() => {
                                    const newId = nextIdRef.current++;
                                    setDrugList(prev => [...prev, { ...drug, id: newId, checks: [false, false, false] as boolean[] }]);
                                    setDrugSearchQuery("");
                                    setDrugSearchOpen(false);
                                  }}
                                  style={{
                                    height: 44, display: "flex", alignItems: "center",
                                    paddingLeft: 12, paddingRight: 12, cursor: "pointer",
                                    borderTop: i > 0 ? "1px solid #e2e1e5" : undefined,
                                    gap: 8,
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.04)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 500, color: "#aaaaad", letterSpacing: "-0.27px", lineHeight: 1.05 }}>{drug.type}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, letterSpacing: "-0.52px", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {(() => {
                                          const q = drugSearchQuery.trim();
                                          if (!q) return <span style={{ color: "#484646" }}>{drug.name}</span>;
                                          const idx = drug.name.toLowerCase().indexOf(q.toLowerCase());
                                          if (idx === -1) return <span style={{ color: "#484646" }}>{drug.name}</span>;
                                          return (
                                            <>
                                              <span style={{ color: "#484646" }}>{drug.name.slice(0, idx)}</span>
                                              <span style={{ color: "#3a11d8" }}>{drug.name.slice(idx, idx + q.length)}</span>
                                              <span style={{ color: "#484646" }}>{drug.name.slice(idx + q.length)}</span>
                                            </>
                                          );
                                        })()}
                                      </span>
                                      {drug.warning && <IconWarning size={12} />}
                                    </div>
                                  </div>
                                  <span style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 500, color: "#aaaaad", letterSpacing: "-0.27px", flexShrink: 0 }}>{drug.code}</span>
                                </div>
                              ))
                            )}
                          </div>,
                          document.body
                        )}
                      </div>
                    </div>
                    {/* 체크박스 포함 영역 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, overflow: "hidden" }}>
                      {drugList.length === 0 ? (
                        /* 빈 상태 — "Select Add on drug" 안내 텍스트 */
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "#aaaaad", letterSpacing: "-0.52px", lineHeight: 1.2, textAlign: "center" }}>Select Add on drug</span>
                        </div>
                      ) : (
                        <>
                      {/* Strategy 헤더 — 체크박스 위치에 맞춰 정렬, 텍스트 높이만큼 */}
                      <div style={{ display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 16, paddingBottom: 2, flexShrink: 0, background: "transparent", gap:"12px" }}>
                        {/* 왼쪽: "Strategy" 레이블 */}
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "#1c1b1b", letterSpacing: "-0.48px", lineHeight: 1.1 }}>Strategy</span>
                        </div>
                        {/* 체크박스 3개 위치에 맞춰 A/B/C 헤더 */}
                        <div style={{ display: "flex", gap: 38, alignItems: "center", flexShrink: 0 }}>
                          {["A", "B", "C"].map((s) => (
                            <span key={s} style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "#1c1b1b", letterSpacing: "-0.48px", lineHeight: 1.1, textAlign: "center", width: 18 }}>{s}</span>
                          ))}
                        </div>
                        {/* 삭제 버튼 자리 (24px + 16px gap) */}
                        <div style={{ width: 24 + 16, flexShrink: 0 }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "auto" }}>
                        {drugRows.map((drug, idx) => (
                          <div key={"id" in drug ? String(drug.id) : idx} style={{ background: "white", borderRadius: 16, minHeight: 48, display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 16, gap: 12, flexShrink: 0 }}>
                            {/* 왼쪽: 약물 정보 — type+code 같은 줄, name 아래 */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 500, color: "#aaaaad", letterSpacing: "-0.27px", lineHeight: 1.05 }}>{drug.type}</span>
                                <span style={{ fontFamily: "Inter", fontSize: 9, fontWeight: 500, color: "#aaaaad", letterSpacing: "-0.27px", lineHeight: 1.05, flexShrink: 0 }}>{drug.code}</span>
                              </div>
                              <span style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#1c1b1b", letterSpacing: "-0.75px", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{drug.name}</span>
                            </div>
                            {/* 체크박스 */}
                            <div style={{ display: "flex", gap: 38, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
                              {drug.checks.map((checked, ci) => (
                                <div
                                  key={ci}
                                  onClick={() => {
                                    if (!("id" in drug)) return;
                                    setDrugList(prev => prev.map(d =>
                                      d.id === (drug as typeof d).id
                                        ? { ...d, checks: d.checks.map((c, i) => i === ci ? !c : c) }
                                        : d
                                    ));
                                  }}
                                  style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                >
                                  {checked ? <CheckboxChecked size={17} /> : <CheckboxUnchecked size={17} />}
                                </div>
                              ))}
                            </div>
                            {/* 삭제 버튼 — 우측 고정 */}
                            <button
                              onClick={() => setDrugList(prev => prev.filter((_, i) => i !== idx))}
                              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginLeft: 16 }}
                            >
                              <IconDelete size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* HbA1c Trend 차트 — 피그마 디자인 */}
                  <div style={{ flex: "2.5 2.5 0", minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* 숫자 헤더 (0~24) — 오른쪽 약물 영역 위에만 */}
                    <div style={{ display: "flex", paddingLeft: "clamp(140px, 22%, 236px)", marginBottom: 4 }}>
                      {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((n) => (
                        <span key={n} style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "#262255", letterSpacing: "-0.48px", lineHeight: 1.1, textAlign: "center", flex: 1 }}>{n}</span>
                      ))}
                    </div>
                    {/* Strategy 행들 */}
                    <div style={{ background: "white", borderRadius: 16, overflow: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
                      {([
                        { strategy: "Strategy A", color: "#3a11d8", detail: "Increase : 6 Months", strategyIdx: 0 },
                        { strategy: "Strategy B", color: "#f06600", detail: "Stable : 6 Months", strategyIdx: 1 },
                        { strategy: "Strategy C", color: "#24c6c9", detail: "Decrease : 3 Months", strategyIdx: 2 },
                      ]).map((row, ri) => (
                        <div key={ri} style={{ flex: 1, minHeight: 80, display: "flex", borderTop: ri > 0 ? "1px solid #e2e1e5" : undefined }}>
                          {/* 왼쪽: Strategy 정보 */}
                          <div style={{ width: "clamp(140px, 22%, 236px)", flexShrink: 0, borderRight: "1px solid #e2e1e5", display: "flex", flexDirection: "column", gap: 6, paddingTop: 2, paddingBottom: 2 }}>
                            {/* Strategy 이름 + 컬러 언더라인 */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", paddingLeft: 16, paddingTop: 6 }}>
                                <span style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: row.color, letterSpacing: "-0.75px", lineHeight: 1.15 }}>{row.strategy}</span>
                              </div>
                              <div style={{ height: 1, background: row.color }} />
                            </div>
                            {/* HbA1c Trend 정보 */}
                            <div style={{ display: "flex", flexDirection: "column", paddingLeft: 16, paddingRight: 8 }}>
                              <span style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "#1c1b1b", letterSpacing: "-0.48px", lineHeight: 1.1 }}>HbA1c Trend</span>
                              <span style={{ fontFamily: "Inter", fontSize: 12, fontWeight: 500, color: "#1c1b1b", letterSpacing: "-0.48px", lineHeight: 1.1 }}>{row.detail}</span>
                            </div>
                          </div>
                          {/* 오른쪽: 약물 pill 행들 + 점선 그리드 */}
                          <div style={{ flex: 1, minWidth: 0, position: "relative", display: "flex", flexDirection: "column", paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12, gap: 4, alignItems: "stretch", justifyContent: "center" }}>
                            {/* 점선 세로 라인 — pill 뒤에 깔림 (zIndex: 0) */}
                            <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none", zIndex: 0 }}>
                              {Array.from({ length: 9 }).map((_, ci) => (
                                <div
                                  key={ci}
                                  style={{
                                    flex: 1,
                                    borderLeft: ci > 0 ? "1px dashed #efeff4" : undefined,
                                  }}
                                />
                              ))}
                            </div>
                            {drugList.map((drug) => {
                              const pos = drug.pillPositions?.[row.strategyIdx];
                              const leftPct = pos ? pos.leftPct : 0;
                              const widthPct = pos ? pos.widthPct : 100 / 9;
                              const visible = drug.checks[row.strategyIdx] && pos !== null;
                              return (
                                <div key={drug.id} style={{ flex: 1, minHeight: 16, maxHeight: 32, display: "flex", alignItems: "center", position: "relative", overflow: "visible", zIndex: 1 }}>
                                  {visible && (
                                    <ResizablePill name={drug.name} code={drug.code} testLeftPct={leftPct} testWidthPct={widthPct} resetKey={drug.id * 10 + row.strategyIdx + pillResetKey} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>{/* 래퍼 끝 */}
            </div>

            {/* 하단 버튼 */}
            <div className="shrink-0 flex justify-end gap-[12px]">
              <button
                onClick={() => router.push("/drd/simulation-setting")}
                className="flex items-center justify-center h-[42px] px-[24px] rounded-[36px] bg-transparent relative overflow-hidden border-none cursor-pointer"
              >
                <div className="absolute inset-0 bg-[#787776]" />
                <span className="relative z-10 font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white tracking-[-0.51px]">Cancel</span>
              </button>
              {/* Save Progress 버튼 */}
              <button
                onClick={handleSaveProgress}
                className="flex items-center justify-center h-[42px] px-[24px] rounded-[36px] relative overflow-hidden border-none cursor-pointer"
                style={{ background: "#484646" }}
              >
                <span className="relative z-10 font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white tracking-[-0.51px]">
                  Save Progress
                </span>
              </button>
              <button
                onClick={() => {
                  if (!canConfirm) return;
                  setSimCondData({ selectedCategory, selectedDetail, selectedValue, followUpMonths, inputValues, unitValues, monthValues, drugList });
                  setSimCondCompleted(true);
                  router.push("/drd/simulation-setting");
                }}
                className="flex items-center justify-center h-[42px] px-[24px] rounded-[36px] bg-transparent relative overflow-hidden border-none"
                style={{ cursor: canConfirm ? "pointer" : "not-allowed" }}
              >
                <div className="absolute inset-0" style={{ background: canConfirm ? "#f06600" : "#c6c5c9", transition: "background 0.15s" }} />
                <span className="relative z-10 font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white text-center tracking-[-0.51px]">Confirm</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 모달 */}
      {showSaveModal && (
        <SaveProgressModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveConfirm}
        />
      )}

      {/* 저장 완료 토스트 */}
      {saveToast && (
        <SaveToast message={saveToast} onDone={() => setSaveToast(null)} />
      )}
    </AppLayout>
  );
}
