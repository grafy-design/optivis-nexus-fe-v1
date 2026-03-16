"use client";

import { cn } from "@/lib/cn";

export type TrpSavedSimulationRow<TValue> = {
  id: string;
  simulationName: string;
  disease: string;
  targetOutcome: string;
  treatment: string;
  lastUpdated: string;
  value: TValue;
};

type TrpSavedSimulationsTableProps<TValue> = {
  rows: readonly TrpSavedSimulationRow<TValue>[];
  selectedId: string | null;
  onSelect: (row: TrpSavedSimulationRow<TValue>) => void;
};

export default function TrpSavedSimulationsTable<TValue>({
  rows,
  selectedId,
  onSelect,
}: TrpSavedSimulationsTableProps<TValue>) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div>
          <h2 className="m-0 font-[Inter,sans-serif] text-[20px] leading-none font-semibold tracking-[-0.04em] text-[#1E183B]">
            Saved Simulations
          </h2>
          <p className="mt-1 font-[Inter,sans-serif] text-[12px] font-medium text-[#8A8698]">
            Restore a saved TRP setup across the patient, treatment, and simulation steps.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-white/70 bg-[rgba(255,255,255,0.68)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[12px]">
        <div className="grid grid-cols-[1.2fr_0.9fr_1fr_1.15fr_0.95fr] gap-4 bg-[#262255] px-5 py-3 font-[Inter,sans-serif] text-[11px] font-semibold tracking-[-0.02em] text-white">
          <span>Simulation name</span>
          <span>Disease</span>
          <span>Target Outcome</span>
          <span>Treatment</span>
          <span>Last updated</span>
        </div>

        <div className="divide-y divide-[#ECE8F4]">
          {rows.map((row) => {
            const isSelected = row.id === selectedId;

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row)}
                className={cn(
                  "grid w-full grid-cols-[1.2fr_0.9fr_1fr_1.15fr_0.95fr] gap-4 px-5 py-3 text-left transition-colors",
                  isSelected ? "bg-[#F2EEFF]" : "bg-white hover:bg-[#FAF8FF]"
                )}
              >
                <span className="font-[Inter,sans-serif] text-[12px] font-semibold text-[#2B2641]">
                  {row.simulationName}
                </span>
                <span className="font-[Inter,sans-serif] text-[12px] font-medium text-[#5A5567]">
                  {row.disease}
                </span>
                <span className="font-[Inter,sans-serif] text-[12px] font-medium text-[#5A5567]">
                  {row.targetOutcome}
                </span>
                <span className="font-[Inter,sans-serif] text-[12px] font-medium text-[#5A5567]">
                  {row.treatment}
                </span>
                <span className="font-[Inter,sans-serif] text-[12px] font-medium text-[#5A5567]">
                  {row.lastUpdated}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
