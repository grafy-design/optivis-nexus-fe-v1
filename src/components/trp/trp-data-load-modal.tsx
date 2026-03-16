"use client";

import type { ReactNode, UIEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import TrpSelect from "@/components/trp/trp-select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import {
  trpDataLoadMockPatients,
  trpPrimaryConditionOptions,
  type TrpDataLoadPatientRecord,
  type TrpPrimaryConditionValue,
} from "@/components/trp/trp-data-load-mock-data";

const DEFAULT_PAGE_SIZE = 10;
const patientIdCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

type ConditionFilterValue = "" | "all" | TrpPrimaryConditionValue;

export type TrpDataLoadConditionOption = {
  label: string;
  value: TrpPrimaryConditionValue;
};

export type TrpDataLoadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (record: TrpDataLoadPatientRecord) => void;
  records?: readonly TrpDataLoadPatientRecord[];
  title?: string;
  description?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  primaryConditionLabel?: string;
  primaryConditionOptions?: readonly TrpDataLoadConditionOption[];
  requirePrimaryCondition?: boolean;
  includeAllConditionsOption?: boolean;
  defaultPrimaryConditionValue?: ConditionFilterValue;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  missingConditionTitle?: string;
  missingConditionDescription?: string;
  applyButtonLabel?: string;
  pageSize?: number;
  sortRecords?: (
    records: readonly TrpDataLoadPatientRecord[]
  ) => readonly TrpDataLoadPatientRecord[];
};

export function sortTrpDataLoadRecords(
  records: readonly TrpDataLoadPatientRecord[]
): TrpDataLoadPatientRecord[] {
  return [...records].sort((left, right) => {
    const patientIdResult = patientIdCollator.compare(left.patientId, right.patientId);

    if (patientIdResult !== 0) {
      return patientIdResult;
    }

    return patientIdCollator.compare(left.dataName, right.dataName);
  });
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13.75 13.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "min-w-0 truncate font-[Inter,sans-serif] text-[12px] font-medium tracking-[-0.02em] text-[#4C4757]",
        align === "center" && "text-center"
      )}
    >
      {children}
    </div>
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-[14px] w-[14px] items-center justify-center rounded-full border",
        selected ? "border-[#312B73]" : "border-[#A39CAE]"
      )}
    >
      {selected ? <span className="h-[6px] w-[6px] rounded-full bg-[#312B73]" /> : null}
    </span>
  );
}

export default function TrpDataLoadModal({
  open,
  onOpenChange,
  onApply,
  records = trpDataLoadMockPatients,
  title = "Data Select",
  description = "",
  searchLabel = "Patient ID",
  searchPlaceholder = "Search patient ID",
  primaryConditionLabel = "Primary Condition",
  primaryConditionOptions = trpPrimaryConditionOptions,
  requirePrimaryCondition = false,
  includeAllConditionsOption = true,
  defaultPrimaryConditionValue,
  emptyStateTitle = "No matching patient ID found.",
  emptyStateDescription = "Try a different patient ID or reset the current search condition.",
  missingConditionTitle = "Select a primary condition.",
  missingConditionDescription = "Choose the required primary condition to load patient records.",
  applyButtonLabel = "Apply",
  pageSize = DEFAULT_PAGE_SIZE,
  sortRecords = sortTrpDataLoadRecords,
}: TrpDataLoadModalProps) {
  const resolvedConditionOptions = useMemo(() => {
    const baseOptions = [...primaryConditionOptions];

    if (requirePrimaryCondition) {
      return [{ label: primaryConditionLabel, value: "" }, ...baseOptions];
    }

    if (!includeAllConditionsOption) {
      return baseOptions;
    }

    return [{ label: "All conditions", value: "all" as const }, ...baseOptions];
  }, [
    includeAllConditionsOption,
    primaryConditionLabel,
    primaryConditionOptions,
    requirePrimaryCondition,
  ]);

  const initialConditionFilter = useMemo<ConditionFilterValue>(() => {
    if (defaultPrimaryConditionValue !== undefined) {
      return defaultPrimaryConditionValue;
    }

    if (requirePrimaryCondition) {
      return "";
    }

    return includeAllConditionsOption ? "all" : "";
  }, [
    defaultPrimaryConditionValue,
    includeAllConditionsOption,
    primaryConditionOptions,
    requirePrimaryCondition,
  ]);

  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilterValue>(initialConditionFilter);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const hasSelectedCondition = conditionFilter !== "" && conditionFilter !== "all";
  const isConditionRequiredAndMissing = requirePrimaryCondition && !hasSelectedCondition;

  const filteredRecords = useMemo(() => {
    if (isConditionRequiredAndMissing) {
      return [];
    }

    const normalizedQuery = submittedQuery.trim().toLowerCase();
    const nextRecords = records.filter((record) => {
      const matchesCondition =
        conditionFilter === "" ||
        conditionFilter === "all" ||
        record.primaryCondition === conditionFilter;
      const matchesPatientId =
        normalizedQuery.length === 0 ||
        record.patientId.toLowerCase().includes(normalizedQuery);

      return matchesCondition && matchesPatientId;
    });

    return [...sortRecords(nextRecords)];
  }, [conditionFilter, isConditionRequiredAndMissing, records, sortRecords, submittedQuery]);

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? null;

  const currentEmptyStateTitle = isConditionRequiredAndMissing
    ? missingConditionTitle
    : emptyStateTitle;
  const currentEmptyStateDescription = isConditionRequiredAndMissing
    ? missingConditionDescription
    : emptyStateDescription;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchInput("");
    setSubmittedQuery("");
    setConditionFilter(initialConditionFilter);
    setSelectedRecordId("");
    setVisibleCount(pageSize);
  }, [initialConditionFilter, open, pageSize]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setVisibleCount(pageSize);
  }, [conditionFilter, open, pageSize, submittedQuery]);

  useEffect(() => {
    if (searchInput.trim().length > 0) {
      return;
    }

    setSubmittedQuery("");
  }, [searchInput]);

  useEffect(() => {
    if (!selectedRecordId) {
      return;
    }

    if (filteredRecords.some((record) => record.id === selectedRecordId)) {
      return;
    }

    setSelectedRecordId("");
  }, [filteredRecords, selectedRecordId]);

  const handleSearch = () => {
    setSubmittedQuery(searchInput.trim());
  };

  const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const remainingHeight = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (remainingHeight > 120 || visibleCount >= filteredRecords.length) {
      return;
    }

    setVisibleCount((previous) => Math.min(previous + pageSize, filteredRecords.length));
  };

  const handleApply = () => {
    if (!selectedRecord || isConditionRequiredAndMissing) {
      return;
    }

    onApply(selectedRecord);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideDefaultClose
        overlayClassName="bg-[#16131F]/58 backdrop-blur-[2px]"
        className="h-[min(440px,calc(100vh-40px))] w-[min(760px,calc(100vw-32px))] max-w-[min(760px,calc(100vw-32px))] overflow-hidden rounded-[20px] border border-white/70 bg-[rgba(255,255,255,0.88)] p-0 shadow-[0_28px_56px_rgba(17,12,35,0.22)] backdrop-blur-[16px]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>

        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-[#E3DEEC] px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="font-[Inter,sans-serif] text-[17px] leading-none font-semibold tracking-[-0.04em] text-[#1C1736]">
                {title}
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#1F1B28]"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </DialogClose>
            </div>

            <form
              className="mt-4 grid grid-cols-[minmax(0,1fr)_40px_170px] gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                handleSearch();
              }}
            >
              <label className="sr-only" htmlFor="trp-data-load-search">
                {searchLabel}
              </label>
              <input
                id="trp-data-load-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-[30px] rounded-[6px] border border-white/70 bg-[rgba(255,255,255,0.76)] px-3 font-[Inter,sans-serif] text-[12px] font-medium tracking-[-0.02em] text-[#2F2B3A] outline-none transition-shadow placeholder:text-[#A39EAF] focus-visible:ring-2 focus-visible:ring-[#262255]/15"
              />
              <button
                type="submit"
                className="inline-flex h-[30px] w-10 items-center justify-center rounded-[6px] border border-white/70 bg-[rgba(255,255,255,0.76)] text-[#514C61] transition-colors hover:bg-[#F7F5FB]"
                aria-label={searchLabel}
              >
                <SearchIcon />
              </button>
              <div>
                <span className="sr-only">{primaryConditionLabel}</span>
                <TrpSelect
                  value={conditionFilter}
                  options={resolvedConditionOptions}
                  onValueChange={(value) => setConditionFilter(value as ConditionFilterValue)}
                  variant="outline"
                  className="h-[30px] rounded-[6px] border-[#CFCAD8] px-3 pr-8 text-[12px] font-medium tracking-[-0.02em] text-[#2F2B3A]"
                  wrapperClassName="w-full"
                  placeholderColor="#A39EAF"
                  iconColor="#6D687C"
                />
              </div>
            </form>
          </div>

          <div className="min-h-0 flex-1 px-4 py-3">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-white/70 bg-[rgba(255,255,255,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[12px]">
              <div className="grid grid-cols-[28px_86px_minmax(0,1fr)_48px_60px_60px_72px_minmax(0,1fr)_78px_98px] gap-3 border-b border-[#E7E2EF] bg-[#3E3875] px-4 py-2.5">
                <div />
                {[
                  "Patient ID",
                  "Data name",
                  "Age",
                  "Sex",
                  "BMI",
                  "SBP/DBP",
                  "Related disease",
                  "Duration",
                  "Update date",
                ].map((label) => (
                  <div
                    key={label}
                    className="min-w-0 truncate font-[Inter,sans-serif] text-[10px] font-bold tracking-[0.04em] text-white"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto" onScroll={handleTableScroll}>
                {visibleRecords.length === 0 ? (
                  <div className="flex h-full min-h-[168px] flex-col items-center justify-center px-6 text-center">
                    <div className="mb-2 font-[Inter,sans-serif] text-[12px] font-medium tracking-[-0.02em] text-[#3D3948]">
                      {currentEmptyStateTitle}
                    </div>
                    <div className="max-w-[320px] font-[Inter,sans-serif] text-[11px] leading-[1.45] font-medium tracking-[-0.02em] text-[#8A8496]">
                      {currentEmptyStateDescription}
                    </div>
                  </div>
                ) : (
                  visibleRecords.map((record) => {
                    const isSelected = selectedRecordId === record.id;

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => setSelectedRecordId(record.id)}
                        className={cn(
                          "grid w-full grid-cols-[28px_86px_minmax(0,1fr)_48px_60px_60px_72px_minmax(0,1fr)_78px_98px] gap-3 border-b border-[#ECE8F3] px-4 py-2.5 text-left transition-colors",
                          isSelected ? "bg-[#F7F5FC]" : "bg-white hover:bg-[#FAF8FD]"
                        )}
                      >
                        <div className="flex items-center justify-center">
                          <SelectionIndicator selected={isSelected} />
                        </div>
                        <TableCell>{record.patientId}</TableCell>
                        <TableCell>{record.dataName}</TableCell>
                        <TableCell align="center">{record.age}</TableCell>
                        <TableCell align="center">
                          {record.sex === "male" ? "Male" : "Female"}
                        </TableCell>
                        <TableCell align="center">{record.bmi.toFixed(1)}</TableCell>
                        <TableCell align="center">
                          {record.sbp}/{record.dbp}
                        </TableCell>
                        <TableCell>{record.relatedDisease}</TableCell>
                        <TableCell align="center">{record.durationYears} yr</TableCell>
                        <TableCell align="center">{record.updatedAt}</TableCell>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-4 pt-1 pb-4 sm:flex-row sm:items-center sm:justify-center">
            <TrpCtaButton
              onClick={handleApply}
              disabled={!selectedRecord || isConditionRequiredAndMissing}
              className="min-w-[138px] shadow-none"
            >
              {applyButtonLabel}
            </TrpCtaButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
