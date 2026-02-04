"use client";

import React from "react";
import { FormulaDisplay } from "./FormulaDisplay";

interface UsedValue {
  label: string;
  value: string;
}

interface Definition {
  symbol: string;
  description: string;
}

interface FormulaCardProps {
  title?: string;
  formula: string;
  usedValues?: UsedValue[];
  definitions?: Definition[];
  className?: string;
}

/**
 * Figma 디자인 기반 수식 카드 컴포넌트
 */
export function FormulaCard({
  title = "Formula & Used Value",
  formula,
  usedValues = [],
  definitions = [],
  className = "",
}: FormulaCardProps) {
  return (
    <div
      className={`rounded-[18px] overflow-hidden max-w-[410px] ${className}`}
      style={{
        backgroundImage: "url(/assets/simulation/formula-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="p-4 pb-1 flex flex-col gap-4">
        {/* Title */}
        <div className="text-body4 text-white ">{title}</div>

        {/* Formula Section */}
        <div className="bg-white rounded-lg p-2">
          <div className="text-[#111111]">
            <FormulaDisplay formula={formula} displayMode={true} />
          </div>
        </div>

        {/* Used Values */}
        {usedValues.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {usedValues.map((item, index) => (
              <div
                key={index}
                className="bg-white/30 rounded-lg p-2 flex flex-col gap-1"
              >
                <div className="text-small1 text-[#ebebf0]">
                  <FormulaDisplay formula={item.label} displayMode={false} />
                </div>
                <span className="text-body3 text-[#ebebf0]">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Definitions */}
        {definitions.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-body4 text-white ">Definitions</div>
            <div className="bg-white/30 rounded-lg p-3 flex flex-col gap-2">
              {definitions.map((def, index) => (
                <div key={index} className="flex gap-1">
                  <div className="flex-shrink-0 w-[20px]">
                    <div className="text-small1 text-[#ebebf0]">
                      <FormulaDisplay
                        formula={`${def.symbol}:`}
                        displayMode={false}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-[#ebebf0] leading-[10px] tracking-[-0.525px] break-words">
                    {def.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
