"use client";

import { useEffect, useMemo, useState } from "react";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TrpSaveProgressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string) => void;
};

function formatLocalTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="font-[Inter,sans-serif] text-[12px] font-semibold tracking-[-0.03em] text-[#5A5668]">
      {children}
    </label>
  );
}

export default function TrpSaveProgressModal({
  open,
  onOpenChange,
  onSave,
}: TrpSaveProgressModalProps) {
  const [simulationName, setSimulationName] = useState("");
  const [simulationDescription, setSimulationDescription] = useState("");
  const currentDate = useMemo(() => formatLocalTimestamp(new Date()), [open]);
  const canSave = simulationName.trim().length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSimulationName("");
    setSimulationDescription("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideDefaultClose
        className="w-[480px] max-w-[calc(100%-32px)] rounded-[28px] border border-white/70 bg-[rgba(255,255,255,0.94)] p-0 shadow-[0_22px_46px_rgba(27,24,44,0.22)]"
      >
        <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(245,243,249,0.96)_100%)] px-7 py-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="font-[Inter,sans-serif] text-[24px] font-bold tracking-[-0.04em] text-[#262255]">
              Save Progress
            </DialogTitle>
            <DialogDescription className="font-[Inter,sans-serif] text-[13px] leading-[1.45] font-medium text-[#746F82]">
              Save the current TRP setup as a reusable simulation snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel>Simulation name</FieldLabel>
              <input
                type="text"
                value={simulationName}
                onChange={(event) => setSimulationName(event.target.value)}
                placeholder="Enter a simulation name"
                className="h-11 rounded-[14px] border border-white/70 bg-[rgba(255,255,255,0.72)] px-4 font-[Inter,sans-serif] text-[13px] font-medium text-[#2B2641] outline-none transition-colors placeholder:text-[#A09AAA] focus:border-[#8A78F5]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel>Date</FieldLabel>
              <div className="rounded-[14px] border border-white/70 bg-[rgba(248,247,251,0.82)] px-4 py-3 font-[Inter,sans-serif] text-[13px] font-medium text-[#6C667B]">
                {currentDate}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={simulationDescription}
                onChange={(event) => setSimulationDescription(event.target.value)}
                placeholder="Add an optional description"
                rows={4}
                className="resize-none rounded-[14px] border border-white/70 bg-[rgba(255,255,255,0.72)] px-4 py-3 font-[Inter,sans-serif] text-[13px] font-medium text-[#2B2641] outline-none transition-colors placeholder:text-[#A09AAA] focus:border-[#8A78F5]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex-row justify-end gap-3">
            <TrpCtaButton
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="bg-[#C5C2CB] text-white hover:bg-[#B8B5BE]"
            >
              Cancel
            </TrpCtaButton>
            <TrpCtaButton
              onClick={() => {
                if (!canSave) {
                  return;
                }

                onSave(simulationName, simulationDescription);
              }}
              disabled={!canSave}
            >
              Save
            </TrpCtaButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
