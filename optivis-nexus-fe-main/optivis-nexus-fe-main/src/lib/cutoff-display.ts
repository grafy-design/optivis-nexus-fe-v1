const CUTOFF_OPERATOR_SYMBOL_BY_TEXT: Record<string, string> = {
  "<=": "\u2264",
  ">=": "\u2265",
};

export const formatCutoffExpressionForDisplay = (
  value: string | null | undefined
): string => {
  if (!value) return "";

  return value.replace(/<=|>=/g, (operator) => CUTOFF_OPERATOR_SYMBOL_BY_TEXT[operator] ?? operator);
};

export const formatCutoffListForDisplay = (
  values: Array<string | null | undefined> | null | undefined
): string[] => {
  if (!Array.isArray(values)) return [];
  return values.map((value) => formatCutoffExpressionForDisplay(value));
};
