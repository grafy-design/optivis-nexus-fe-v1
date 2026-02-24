"use client";

import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { FormulaCard } from "./FormulaCard";
import InfoIcon from "@/components/ui/info-icon";

type PopoverSide = "top" | "right" | "bottom" | "left";
type PopoverAlign = "start" | "center" | "end";

interface FormulaTooltipProps {
  trigger?: React.ReactNode;
  formula: string;
  usedValues?: Array<{ label: string; value: string }>;
  definitions?: Array<{ symbol: string; description: string }>;
  /** 팝오버 위치 (기본 bottom). "left"면 아이콘 좌측에 표시 */
  side?: PopoverSide;
  align?: PopoverAlign;
}

/**
 * 수식 툴팁 컴포넌트 (info 아이콘 클릭 시 Formula & Used Value 표시)
 */
export function FormulaTooltip({
  trigger,
  formula,
  usedValues = [],
  definitions = [],
  side = "bottom",
  align = "start",
}: FormulaTooltipProps) {
  const defaultTrigger = (
    <button className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
      <InfoIcon />
    </button>
  );

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger || defaultTrigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[9999] outline-none"
          side={side}
          align={align}
          sideOffset={side === "left" || side === "right" ? 8 : 0}
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
