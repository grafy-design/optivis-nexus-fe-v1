import type {
  PlayDrdSimulationNonResponderFeature,
  PlayDrdSimulationNonResponderIdentificationData,
  PlayDrdSimulationNonResponderMeta,
  PlayDrdSimulationNonResponderStrategy,
} from "@/services/types/drd-service.types";

type UnknownRecord = Record<string, unknown>;

const DEFAULT_NON_RESPONDER_META: PlayDrdSimulationNonResponderMeta = {
  title: "Non-responder Identification",
  description: "Top contributing factors ranked by impact score",
};

export interface DrdNonResponderFeatureViewModel {
  rank: string;
  condition: string;
  score: string;
}

export interface DrdNonResponderStrategyViewModel {
  strategyName: string;
  features: DrdNonResponderFeatureViewModel[];
}

export interface DrdNonResponderSectionViewModel {
  title: string;
  description: string;
  strategies: DrdNonResponderStrategyViewModel[];
}

export const EMPTY_DRD_NON_RESPONDER_SECTION: DrdNonResponderSectionViewModel = {
  title: DEFAULT_NON_RESPONDER_META.title,
  description: "",
  strategies: [],
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeFeature = (value: unknown): PlayDrdSimulationNonResponderFeature | null => {
  const parsed = parseMaybeJson(value);
  if (!isRecord(parsed)) return null;

  const rank = toFiniteNumber(parsed.rank);
  const featureCondition = toText(parsed.feature_condition || parsed.feature || parsed.condition);
  const impactScore = toFiniteNumber(parsed.impact_score ?? parsed.score);

  if (rank === null || !featureCondition || impactScore === null) return null;

  return {
    rank: Math.trunc(rank),
    feature_condition: featureCondition,
    impact_score: impactScore,
  };
};

const normalizeStrategy = (value: unknown): PlayDrdSimulationNonResponderStrategy | null => {
  const parsed = parseMaybeJson(value);
  if (!isRecord(parsed)) return null;

  const strategy = toText(parsed.strategy || parsed.strategy_name || parsed.strategy_label);
  const features = Array.isArray(parsed.data)
    ? parsed.data.map(normalizeFeature).filter((item): item is PlayDrdSimulationNonResponderFeature => item !== null)
    : [];

  if (!strategy || features.length === 0) return null;

  return {
    strategy,
    data: [...features].sort((left, right) => left.rank - right.rank),
  };
};

const normalizeMeta = (value: unknown): PlayDrdSimulationNonResponderMeta => {
  const parsed = parseMaybeJson(value);
  if (!isRecord(parsed)) return DEFAULT_NON_RESPONDER_META;

  const title = toText(parsed.title) || DEFAULT_NON_RESPONDER_META.title;
  const description = toText(parsed.description) || DEFAULT_NON_RESPONDER_META.description;

  return { title, description };
};

const normalizeFromGroupedShape = (
  value: unknown
): PlayDrdSimulationNonResponderIdentificationData | null => {
  const parsed = parseMaybeJson(value);
  if (!isRecord(parsed) || !Array.isArray(parsed.strategies)) return null;

  const strategies = parsed.strategies
    .map(normalizeStrategy)
    .filter((item): item is PlayDrdSimulationNonResponderStrategy => item !== null);

  if (strategies.length === 0) return null;

  return {
    meta: normalizeMeta(parsed.meta),
    strategies,
  };
};

type FlatFeatureRow = {
  strategy: string;
  rank: number | null;
  feature_condition: string;
  impact_score: number;
};

const normalizeFlatFeatureRow = (value: unknown): FlatFeatureRow | null => {
  const parsed = parseMaybeJson(value);
  if (!isRecord(parsed)) return null;

  const strategy = toText(parsed.strategy || parsed.strategy_name || parsed.strategy_label);
  const featureCondition = toText(parsed.feature_condition || parsed.feature || parsed.condition);
  const impactScore = toFiniteNumber(parsed.impact_score ?? parsed.score);

  if (!strategy || !featureCondition || impactScore === null) return null;

  return {
    strategy,
    rank: toFiniteNumber(parsed.rank),
    feature_condition: featureCondition,
    impact_score: impactScore,
  };
};

const normalizeFromFlatRows = (
  value: unknown
): PlayDrdSimulationNonResponderIdentificationData | null => {
  const parsed = parseMaybeJson(value);
  if (!Array.isArray(parsed)) return null;

  const rows = parsed
    .map(normalizeFlatFeatureRow)
    .filter((item): item is FlatFeatureRow => item !== null);

  if (rows.length === 0) return null;

  const grouped = new Map<string, FlatFeatureRow[]>();
  rows.forEach((row) => {
    const bucket = grouped.get(row.strategy) ?? [];
    bucket.push(row);
    grouped.set(row.strategy, bucket);
  });

  const strategies: PlayDrdSimulationNonResponderStrategy[] = Array.from(grouped.entries()).map(
    ([strategy, items]) => {
      const sortedItems = [...items].sort((left, right) => {
        if (left.rank !== null && right.rank !== null) return left.rank - right.rank;
        if (left.rank !== null) return -1;
        if (right.rank !== null) return 1;
        return right.impact_score - left.impact_score;
      });

      return {
        strategy,
        data: sortedItems.map((item, index) => ({
          rank: item.rank !== null ? Math.trunc(item.rank) : index + 1,
          feature_condition: item.feature_condition,
          impact_score: item.impact_score,
        })),
      };
    }
  );

  return {
    meta: DEFAULT_NON_RESPONDER_META,
    strategies,
  };
};

const normalizeNonResponderPayload = (
  value: unknown
): PlayDrdSimulationNonResponderIdentificationData | null =>
  normalizeFromGroupedShape(value) ?? normalizeFromFlatRows(value);

const collectCandidateSources = (value: unknown): unknown[] => {
  const parsed = parseMaybeJson(value);
  const candidates: unknown[] = [parsed];

  if (!isRecord(parsed)) {
    return candidates.filter((item) => item !== null && item !== undefined);
  }

  const parsedData = parseMaybeJson(parsed.data);
  candidates.push(parsed.non_responder_identification);
  candidates.push(parsed.safety_tradeoff_ranking);
  candidates.push(parsed.strategy_output);
  candidates.push(parsedData);

  if (isRecord(parsedData)) {
    candidates.push(parsedData.non_responder_identification);
    candidates.push(parsedData.safety_tradeoff_ranking);
    candidates.push(parsedData.strategy_output);
  }

  return candidates.filter((item) => item !== null && item !== undefined);
};

const formatImpactScore = (value: number): string => value.toFixed(2);

const toSectionViewModel = (
  value: PlayDrdSimulationNonResponderIdentificationData
): DrdNonResponderSectionViewModel => ({
  title: value.meta.title,
  description: value.meta.description,
  strategies: value.strategies.map((strategy) => ({
    strategyName: strategy.strategy,
    features: strategy.data.map((feature) => ({
      rank: String(feature.rank),
      condition: feature.feature_condition,
      score: formatImpactScore(feature.impact_score),
    })),
  })),
});

export const convertDrdSimulationPlayToNonResponderSection = (
  value: unknown
): DrdNonResponderSectionViewModel => {
  for (const candidate of collectCandidateSources(value)) {
    const normalized = normalizeNonResponderPayload(candidate);
    if (normalized) {
      return toSectionViewModel(normalized);
    }
  }

  return EMPTY_DRD_NON_RESPONDER_SECTION;
};
