"use client";

import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { FormulaCard } from "./FormulaCard";
import InfoIcon from "@/components/ui/info-icon";

interface FormulaTooltipProps {
  trigger?: React.ReactNode;
  formula: string;
  usedValues?: Array<{ label: string; value: string }>;
  definitions?: Array<{ symbol: string; description: string }>;
}

/**
 * 수식 툴팁 컴포넌트 (info 아이콘 밑에 표시)
 */
export function FormulaTooltip({
  trigger,
  formula,
  usedValues = [],
  definitions = [],
}: FormulaTooltipProps) {
  const defaultTrigger = (
    <button className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
      <InfoIcon />
    </button>
  );

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {trigger || defaultTrigger}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[9999] outline-none"
          side="bottom"
          align="start"
          sideOffset={0}
          alignOffset={0}
        >
          <FormulaCard
            title="Formula & Used Value"
            formula={formula}
            usedValues={usedValues}
            definitions={definitions}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

