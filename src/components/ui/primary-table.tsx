"use client";

import React from "react";
import { cn } from "@/lib/cn";

// ── 사이즈별 스타일 설정 / Size-specific style config ────────────────────────
const SIZE_CONFIG = {
  s: {
    // 헤더 (tsi datasetting 테이블 기준)
    headerRadius: "rounded-[20px]",
    headerPadding: "py-2.5 px-6",
    headerBg: "bg-black/60",
    headerText: "text-body5m",
    headerSubText: "text-small2",
    // 바디 카드
    cardRadius: "rounded-[14px]",
    cardPadding: "py-[20px] px-[32px]",
    // 카테고리 헤더
    categoryText: "text-body5",
    categoryColumnText: "text-small2",
    categoryPadding: "pb-1",
    // 데이터 행
    rowPadding: "py-2.5",
    rowLabelText: "text-body5",
    rowValueText: "text-body5",
  },
  m: {
    // 헤더 (patients-summary 테이블 기준)
    headerRadius: "rounded-[12px]",
    headerPadding: "pt-[8px] pb-1.5 px-[12px]",
    headerBg: "bg-table-header-background",
    headerText: "text-body3m",
    headerSubText: "text-small1",
    // 바디 카드
    cardRadius: "rounded-[12px]",
    cardPadding: "pt-[12px] px-[12px] pb-[8px]",
    // 카테고리 헤더
    categoryText: "text-body2",
    categoryColumnText: "text-body5m",
    categoryPadding: "pb-1",
    // 데이터 행
    rowPadding: "pt-2 pb-1",
    rowLabelText: "text-body4m",
    rowValueText: "text-body4m",
  },
} as const;

export type PrimaryTableSize = keyof typeof SIZE_CONFIG;

// ── Context ─────────────────────────────────────────────────────────────────
const SizeContext = React.createContext<PrimaryTableSize>("m");

// ── Root ─────────────────────────────────────────────────────────────────────
interface PrimaryTableProps {
  size?: PrimaryTableSize;
  children: React.ReactNode;
  className?: string;
}

/**
 * Primary Table — 사이즈 기반 테이블 레이아웃 컴포넌트.
 * size: "s" (datasetting 기준) | "m" (patients-summary 기준, 기본값)
 *
 * 구성: Header / Body / Card / CardHeader / Row
 * 스크롤 컨테이너는 외부에서 직접 제어.
 */
function PrimaryTable({ size = "m", children, className }: PrimaryTableProps) {
  return (
    <SizeContext.Provider value={size}>
      <div className={cn("flex flex-col", className)}>
        {children}
      </div>
    </SizeContext.Provider>
  );
}

// ── Header (그레이 헤더 바) ──────────────────────────────────────────────────
interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

function Header({ children, className }: HeaderProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div
      className={cn(
        "w-full flex items-center",
        s.headerBg,
        s.headerRadius,
        s.headerPadding,
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── HeaderCell (헤더 텍스트 셀) ──────────────────────────────────────────────
interface HeaderCellProps {
  children?: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function HeaderCell({ children, sub, className, style }: HeaderCellProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div className={cn("flex flex-col", className)} style={style}>
      {children && (
        <div className={cn(s.headerText, "text-neutral-99")}>{children}</div>
      )}
      {sub && (
        <div className={cn(s.headerSubText, "text-neutral-80 -mt-0.25")}>{sub}</div>
      )}
    </div>
  );
}

// ── Body (카드 목록 래퍼) ────────────────────────────────────────────────────
interface BodyProps {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}

function Body({ children, className, gap = 8 }: BodyProps) {
  return (
    <div className={cn("flex flex-col", className)} style={{ gap }}>
      {children}
    </div>
  );
}

// ── Card (흰색 카드) ─────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div className={cn("bg-white", s.cardRadius, className)}>
      <div className={cn("flex flex-col", s.cardPadding)}>
        {children}
      </div>
    </div>
  );
}

// ── CardHeader (카테고리 헤더 행) ─────────────────────────────────────────────
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function CardHeader({ children, className }: CardHeaderProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div className={cn("border-b border-neutral-80", s.categoryPadding, className)}>
      {children}
    </div>
  );
}

// ── CardHeaderLabel (카테고리명) ──────────────────────────────────────────────
interface CardHeaderLabelProps {
  children: React.ReactNode;
  className?: string;
}

function CardHeaderLabel({ children, className }: CardHeaderLabelProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div className={cn(s.categoryText, "text-neutral-30", className)}>
      {children}
    </div>
  );
}

// ── CardHeaderColumn (카테고리 컬럼 레이블) ───────────────────────────────────
interface CardHeaderColumnProps {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}

function CardHeaderColumn({ children, accent = false, className }: CardHeaderColumnProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div
      className={cn(
        s.categoryColumnText,
        accent ? "text-primary-50" : "text-neutral-50",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Row (데이터 행) ──────────────────────────────────────────────────────────
interface RowProps {
  children: React.ReactNode;
  isLast?: boolean;
  className?: string;
}

function Row({ children, isLast = false, className }: RowProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div
      className={cn(
        s.rowPadding,
        !isLast && "border-b border-neutral-80",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── RowLabel (행 레이블 텍스트) ───────────────────────────────────────────────
interface RowLabelProps {
  children: React.ReactNode;
  className?: string;
}

function RowLabel({ children, className }: RowLabelProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div className={cn(s.rowLabelText, "text-neutral-50", className)}>
      {children}
    </div>
  );
}

// ── RowValue (행 값 텍스트) ──────────────────────────────────────────────────
interface RowValueProps {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}

function RowValue({ children, accent = false, className }: RowValueProps) {
  const s = SIZE_CONFIG[React.useContext(SizeContext)];
  return (
    <div
      className={cn(
        s.rowValueText,
        "tabular-nums",
        accent ? "text-primary-50" : "text-neutral-50",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Compound export ──────────────────────────────────────────────────────────
PrimaryTable.Header = Header;
PrimaryTable.HeaderCell = HeaderCell;
PrimaryTable.Body = Body;
PrimaryTable.Card = Card;
PrimaryTable.CardHeader = CardHeader;
PrimaryTable.CardHeaderLabel = CardHeaderLabel;
PrimaryTable.CardHeaderColumn = CardHeaderColumn;
PrimaryTable.Row = Row;
PrimaryTable.RowLabel = RowLabel;
PrimaryTable.RowValue = RowValue;

export { PrimaryTable };
