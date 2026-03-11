import type { FilterSection } from "@/store/defaultSettingStore";

type FilterBucketSections = {
  inclusion: FilterSection[];
  exclusion: FilterSection[];
};

type ParsedClause = {
  feature: string;
  op: string;
  value: string;
};

const LOGIC_SEPARATOR_REGEX = /\s+(and|or)\s+/gi;
const CLAUSE_OPERATOR_REGEX = /^(.*?)(\s+not\s+in\s+|>=|<=|!=|<>|>|<|=|\s+in\s+)(.*)$/i;

const cleanExpressionPart = (raw: unknown): string => {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => cleanExpressionPart(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return String(raw);
  }
  if (typeof raw !== "string") {
    return "";
  }

  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => cleanExpressionPart(entry))
          .filter(Boolean)
          .join(", ");
      }
      return "";
    } catch {
      return "";
    }
  }

  return trimmed.replace(/^"+|"+$/g, "").trim();
};

const normalizeLogic = (raw: string | null | undefined): "And" | "Or" => {
  if (typeof raw !== "string") return "And";
  return raw.trim().toLowerCase() === "or" ? "Or" : "And";
};

const formatClause = (
  feature: unknown,
  op: unknown,
  value: unknown
): string => {
  const featureText = cleanExpressionPart(feature);
  const opText = cleanExpressionPart(op);
  const valueText = cleanExpressionPart(value);

  if (!featureText || !opText || !valueText) {
    return "";
  }

  return `${featureText} ${opText} ${valueText}`;
};

const formatSection = (section: FilterSection): string => {
  const mainClause = formatClause(section.feature, section.op, section.value);
  if (!mainClause) return "";

  const tokens: string[] = [mainClause];
  (section.subRows ?? []).forEach((subRow) => {
    const nextClause = formatClause(subRow.feature, subRow.op, subRow.value);
    if (!nextClause) return;
    tokens.push(normalizeLogic(subRow.logic), nextClause);
  });

  return `{ ${tokens.join(" ")} }`;
};

const formatBucket = (
  label: "Inclusion" | "Exclusion",
  sections: FilterSection[]
): string => {
  const serializedSections = sections.map(formatSection).filter(Boolean);
  if (serializedSections.length === 0) return "";
  return `${label} [ ${serializedSections.join(" And ")} ]`;
};

const extractBucketBody = (
  expression: string,
  label: "Inclusion" | "Exclusion"
): string | null => {
  const match = new RegExp(`${label}\\s*\\[`, "i").exec(expression);
  if (!match) return null;

  const start = match.index + match[0].length;
  let braceDepth = 0;

  for (let index = start; index < expression.length; index += 1) {
    const char = expression[index];
    if (char === "{") {
      braceDepth += 1;
      continue;
    }
    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (char === "]" && braceDepth === 0) {
      return expression.slice(start, index).trim();
    }
  }

  return null;
};

const extractSectionBodies = (bucketBody: string): string[] => {
  const sections: string[] = [];
  let braceDepth = 0;
  let startIndex = -1;

  for (let index = 0; index < bucketBody.length; index += 1) {
    const char = bucketBody[index];
    if (char === "{") {
      if (braceDepth === 0) {
        startIndex = index + 1;
      }
      braceDepth += 1;
      continue;
    }
    if (char === "}") {
      braceDepth -= 1;
      if (braceDepth === 0 && startIndex >= 0) {
        sections.push(bucketBody.slice(startIndex, index).trim());
        startIndex = -1;
      }
    }
  }

  return sections;
};

const splitSectionClauses = (
  sectionBody: string
): Array<{ logic: "And" | "Or" | null; clause: string }> => {
  const tokens: Array<{ logic: "And" | "Or" | null; clause: string }> = [];
  let cursor = 0;
  let pendingLogic: "And" | "Or" | null = null;

  for (const match of sectionBody.matchAll(LOGIC_SEPARATOR_REGEX)) {
    const clause = sectionBody.slice(cursor, match.index).trim();
    if (clause) {
      tokens.push({ logic: pendingLogic, clause });
    }
    pendingLogic = normalizeLogic(match[1]);
    cursor = (match.index ?? 0) + match[0].length;
  }

  const tail = sectionBody.slice(cursor).trim();
  if (tail) {
    tokens.push({ logic: pendingLogic, clause: tail });
  }

  return tokens;
};

const parseClause = (rawClause: string): ParsedClause | null => {
  const match = rawClause.match(CLAUSE_OPERATOR_REGEX);
  if (!match) return null;

  const feature = match[1].trim();
  const op = match[2].trim().replace(/\s+/g, " ");
  const value = match[3].trim();

  if (!feature || !op || !value) return null;

  return { feature, op, value };
};

const parseBucketSections = (bucketBody: string): FilterSection[] => {
  const sections: FilterSection[] = [];

  extractSectionBodies(bucketBody).forEach((sectionBody, index) => {
    const parsedClauses: Array<ParsedClause & { logic: "And" | "Or" | null }> = [];

    splitSectionClauses(sectionBody).forEach((token) => {
      const parsed = parseClause(token.clause);
      if (!parsed) return;
      parsedClauses.push({
        ...parsed,
        logic: token.logic,
      });
    });

    if (parsedClauses.length === 0) return;

    const [mainClause, ...subClauses] = parsedClauses;
    sections.push({
      id: index + 1,
      name: `Section ${index + 1}`,
      feature: mainClause.feature,
      op: mainClause.op,
      value: mainClause.value,
      subRows: subClauses.map((clause) => ({
        logic: clause.logic ?? "And",
        feature: clause.feature,
        op: clause.op,
        value: clause.value,
      })),
    });
  });

  return sections;
};

export const serializeDrdFilterConditionRawJson = (
  sections: FilterBucketSections
): string => {
  return [
    formatBucket("Inclusion", sections.inclusion),
    formatBucket("Exclusion", sections.exclusion),
  ]
    .filter(Boolean)
    .join(" ");
};

export const parseDrdFilterConditionRawJson = (
  raw: string
): FilterBucketSections | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      inclusion: [],
      exclusion: [],
    };
  }

  const inclusionBody = extractBucketBody(trimmed, "Inclusion");
  const exclusionBody = extractBucketBody(trimmed, "Exclusion");

  if (inclusionBody === null && exclusionBody === null) {
    return null;
  }

  return {
    inclusion: inclusionBody ? parseBucketSections(inclusionBody) : [],
    exclusion: exclusionBody ? parseBucketSections(exclusionBody) : [],
  };
};
