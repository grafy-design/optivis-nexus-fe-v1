type TrpTimelineSlotShape = {
  startMonth: number;
  endMonth: number;
};

type TrpSimulationDrugShape = {
  id: number;
  type: string;
  name: string;
  code: string;
  checks: boolean[];
  timelineSlots: Array<TrpTimelineSlotShape | null>;
};

type TrpTreatmentDrugSelection = {
  hypoglycemicAgentDrugs: readonly string[];
  insulinBasedDrugs: readonly string[];
};

export type TrpDrugCatalogEntry = {
  id: number;
  name: string;
  type: string;
  code: string;
  warningGroup: string;
  aliases: readonly string[];
  treatmentCategory: "hypoglycemic" | "insulin" | "search-only";
  defaultTimelineSlot: TrpTimelineSlotShape;
};

const DEFAULT_TIMELINE_SLOT: TrpTimelineSlotShape = {
  startMonth: 0,
  endMonth: 24,
};

const TRP_DRUG_CATALOG_ENTRIES: readonly TrpDrugCatalogEntry[] = [
  {
    id: 1,
    name: "Metformin",
    type: "Biguanide",
    code: "A10BA02",
    warningGroup: "biguanide",
    aliases: ["metformin"],
    treatmentCategory: "hypoglycemic",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 2,
    name: "DPP-4 inhibitor",
    type: "DPP-4 inhibitors",
    code: "CLASS-DPP4",
    warningGroup: "dpp4",
    aliases: ["dpp-4 inhibitor", "dpp4 inhibitor"],
    treatmentCategory: "hypoglycemic",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 3,
    name: "GLP-1 receptor agonist",
    type: "GLP-1 RA",
    code: "CLASS-GLP1",
    warningGroup: "glp1ra",
    aliases: ["glp-1 receptor agonist", "glp-1 ra", "glp1 receptor agonist"],
    treatmentCategory: "hypoglycemic",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 4,
    name: "SGLT2 inhibitor",
    type: "SGLT2 inhibitors",
    code: "CLASS-SGLT2",
    warningGroup: "sglt2",
    aliases: ["sglt2 inhibitor", "sglt2i"],
    treatmentCategory: "hypoglycemic",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 5,
    name: "Basal insulin",
    type: "Insulin-based",
    code: "THERAPY-BASAL",
    warningGroup: "basal-insulin",
    aliases: ["basal insulin"],
    treatmentCategory: "insulin",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 6,
    name: "Prandial insulin",
    type: "Insulin-based",
    code: "THERAPY-PRANDIAL",
    warningGroup: "prandial-insulin",
    aliases: ["prandial insulin"],
    treatmentCategory: "insulin",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 7,
    name: "Premixed insulin",
    type: "Insulin-based",
    code: "THERAPY-PREMIXED",
    warningGroup: "premixed-insulin",
    aliases: ["premixed insulin"],
    treatmentCategory: "insulin",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 8,
    name: "Semaglutide",
    type: "GLP-1 RA",
    code: "A10BJ06",
    warningGroup: "glp1ra",
    aliases: ["semaglutide"],
    treatmentCategory: "search-only",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 9,
    name: "Empagliflozin",
    type: "SGLT2 inhibitors",
    code: "A10BK03",
    warningGroup: "sglt2",
    aliases: ["empagliflozin"],
    treatmentCategory: "search-only",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
  {
    id: 10,
    name: "Liraglutide",
    type: "GLP-1 RA",
    code: "A10BJ02",
    warningGroup: "glp1ra",
    aliases: ["liraglutide"],
    treatmentCategory: "search-only",
    defaultTimelineSlot: DEFAULT_TIMELINE_SLOT,
  },
] as const;

export const trpDrugCatalog = [...TRP_DRUG_CATALOG_ENTRIES];

export const trpHypoglycemicDrugValues = TRP_DRUG_CATALOG_ENTRIES.filter(
  (entry) => entry.treatmentCategory === "hypoglycemic"
).map((entry) => entry.name);

export const trpInsulinDrugValues = TRP_DRUG_CATALOG_ENTRIES.filter(
  (entry) => entry.treatmentCategory === "insulin"
).map((entry) => entry.name);

export type TrpDrugCombinationWarning = {
  id: string;
  title: string;
  detail: string;
  otherDrugName: string;
};

function normalizeDrugValue(value: string) {
  return value.trim().toLowerCase();
}

function createFallbackDrugId(name: string) {
  return (
    5000 +
    name.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
  );
}

function getWarningGroup(value: Pick<TrpSimulationDrugShape, "name" | "type">) {
  return resolveTrpDrugCatalogEntry(value.name)?.warningGroup ?? normalizeDrugValue(value.type);
}

export function resolveTrpDrugCatalogEntry(value: string) {
  const normalizedValue = normalizeDrugValue(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    TRP_DRUG_CATALOG_ENTRIES.find(
      (entry) =>
        normalizeDrugValue(entry.name) === normalizedValue ||
        entry.aliases.some((alias) => normalizeDrugValue(alias) === normalizedValue)
    ) ?? null
  );
}

export function normalizeTrpTreatmentDrug(value: string) {
  const resolved = resolveTrpDrugCatalogEntry(value);

  if (resolved) {
    return resolved.name;
  }

  return value.trim();
}

export function normalizeTrpTreatmentDrugList(values: readonly string[]) {
  const normalizedValues: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const normalizedValue = normalizeTrpTreatmentDrug(value);

    if (!normalizedValue) {
      return;
    }

    const dedupeKey = normalizeDrugValue(normalizedValue);

    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    normalizedValues.push(normalizedValue);
  });

  return normalizedValues;
}

export function buildTrpSimulationDrugFromCatalogEntry(entry: TrpDrugCatalogEntry): TrpSimulationDrugShape {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    code: entry.code,
    checks: [true, true, true],
    timelineSlots: [
      { ...entry.defaultTimelineSlot },
      { ...entry.defaultTimelineSlot },
      { ...entry.defaultTimelineSlot },
    ],
  };
}

export function buildTrpSimulationDrugFromName(name: string): TrpSimulationDrugShape {
  const resolved = resolveTrpDrugCatalogEntry(name);

  if (resolved) {
    return buildTrpSimulationDrugFromCatalogEntry(resolved);
  }

  const trimmedName = name.trim();

  return {
    id: createFallbackDrugId(trimmedName),
    type: "Imported",
    name: trimmedName,
    code: "CUSTOM",
    checks: [true, true, true],
    timelineSlots: [
      { ...DEFAULT_TIMELINE_SLOT },
      { ...DEFAULT_TIMELINE_SLOT },
      { ...DEFAULT_TIMELINE_SLOT },
    ],
  };
}

export function buildTrpSimulationDrugListFromTreatment(
  treatmentInfo: TrpTreatmentDrugSelection
) {
  const normalizedNames = normalizeTrpTreatmentDrugList([
    ...treatmentInfo.hypoglycemicAgentDrugs,
    ...treatmentInfo.insulinBasedDrugs,
  ]);

  return normalizedNames.map((name) => buildTrpSimulationDrugFromName(name));
}

export function getTrpDrugCombinationWarnings(
  drug: Pick<TrpSimulationDrugShape, "id" | "name" | "type">,
  drugList: readonly Pick<TrpSimulationDrugShape, "id" | "name" | "type">[]
) {
  const warningGroup = getWarningGroup(drug);

  return drugList.reduce<TrpDrugCombinationWarning[]>((warnings, otherDrug) => {
    if (otherDrug.id === drug.id) {
      return warnings;
    }

    if (warningGroup !== getWarningGroup(otherDrug)) {
      return warnings;
    }

    return [
      ...warnings,
      {
        id: `${warningGroup}-${[drug.id, otherDrug.id].sort((left, right) => left - right).join(":")}`,
        title: "Review combination",
        detail: `${drug.name} and ${otherDrug.name} belong to the same therapy class. Review overlapping class use before applying both in the same regimen.`,
        otherDrugName: otherDrug.name,
      },
    ];
  }, []);
}

export function getUniqueTrpDrugCombinationWarnings(
  drugList: readonly Pick<TrpSimulationDrugShape, "id" | "name" | "type">[]
) {
  const warnings = drugList.flatMap((drug) => getTrpDrugCombinationWarnings(drug, drugList));

  return warnings.filter(
    (warning, index, warningList) =>
      warningList.findIndex((candidate) => candidate.id === warning.id) === index
  );
}
