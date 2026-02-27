"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface FormulaDisplayProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * LaTeX 수식을 렌더링하는 컴포넌트
 * @param formula - LaTeX 수식 문자열
 * @param displayMode - true면 블록 모드, false면 인라인 모드
 * @param className - 추가 CSS 클래스
 */
export function FormulaDisplay({
  formula,
  displayMode = false,
  className = "",
}: FormulaDisplayProps) {
  return (
    <div className={`${className} ${!displayMode ? 'katex-display-inline' : ''}`}>
      {displayMode ? (
        <BlockMath 
          math={formula} 
          throwOnError={false}
          errorColor="#cc0000"
        />
      ) : (
        <InlineMath 
          math={formula} 
          throwOnError={false}
          errorColor="#cc0000"
        />
      )}
    </div>
  );
}

