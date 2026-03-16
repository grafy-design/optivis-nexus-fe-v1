"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { TrpSetupSidebarStep } from "@/components/trp/setup-steps";

type TrpSetupSidebarProps = {
  steps: readonly TrpSetupSidebarStep[];
};

export default function TrpSetupSidebar({ steps }: TrpSetupSidebarProps) {
  const router = useRouter();

  return (
    <div className="flex h-full min-h-0 flex-col gap-[30px] rounded-[24px] border border-white/40 bg-white/60 px-4 pt-3 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-[14px]">
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto pr-1">
        {steps.map((step, index) => {
          const isActive = step.state === "active";
          const isComplete = step.state === "complete";
          const isWarning = step.state === "warning";
          const isDisabled = step.disabled;

          return (
            <button
              key={step.title}
              type="button"
              aria-current={isActive ? "step" : undefined}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => {
                if (!isActive && !isDisabled) {
                  router.push(step.href);
                }
              }}
              className={cn(
                "text-left",
                isActive
                  ? "cursor-default rounded-[22px] border border-white/15 bg-[#2B2565] px-[14px] py-[12px] shadow-[0_10px_18px_rgba(38,34,85,0.12)]"
                  : isDisabled
                    ? "cursor-not-allowed rounded-[18px] border border-transparent px-[10px] py-[8px] opacity-60"
                    : "cursor-pointer rounded-[18px] border border-transparent px-[10px] py-[8px] transition-colors hover:bg-white/20"
              )}
            >
              <div className="flex h-full items-start gap-3">
                {isActive ? (
                  <span className="mt-[4px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-[3px] border-[#F06600]">
                    <span className="block h-1.5 w-1.5 rounded-full bg-[#2B2565]" />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "mt-[2px] flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                      isComplete
                        ? "bg-[#CAC7CD] text-[#7D7A83]"
                        : isWarning
                          ? "bg-[#FFE2DE] text-[#D53C2A]"
                          : "bg-[#929095] text-white"
                    )}
                  >
                    {isWarning ? "!" : index + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3
                    className={cn(
                      "m-0 mt-1 font-[Inter,sans-serif] text-[16px] leading-[1.15] font-bold tracking-[-0.035em]",
                      isActive ? "text-white" : isWarning ? "text-[#B33A2B]" : "text-[#4C4A4E]"
                    )}
                  >
                    {step.title}
                  </h3>

                  {step.description ? (
                    <p
                      className={cn(
                        "mt-1.5 max-w-[224px] font-[Inter,sans-serif] text-[11px] leading-[1.22] font-medium tracking-[-0.02em]",
                        isActive
                          ? "text-[rgba(255,255,255,0.78)]"
                          : isWarning
                            ? "text-[#C65548]"
                            : "text-[#8D8A90]"
                      )}
                    >
                      {step.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
