import type { StepItem } from "../StepIndicator";

// ── Step 정의 ─────────────────────────────────────────────────────

export const ATS_STEPS: StepItem[] = [
  { key: "simulation", label: "Study Design Optimization", path: "/ats/simulation" },
  { key: "report", label: "Report", path: "/ats/simulation/report" },
];

export const TSI_STEPS: StepItem[] = [
  { key: "default-settings", label: "Default Settings", path: "/tsi" },
  { key: "patients-summary", label: "Patients Summary", path: "/tsi/patients-summary" },
  { key: "basis-selection", label: "Basis selection", path: "/tsi/basis-selection" },
  { key: "subgroup-selection", label: "Subgroup selection", path: "/tsi/subgroup-selection" },
  { key: "subgroup-explain", label: "Subgroup Explain", path: "/tsi/subgroup-explain" },
  { key: "report", label: "Report", path: "/tsi/report" },
];

export const DRD_STEPS: StepItem[] = [
  { key: "default-settings", label: "Default Settings", path: "/drd/default-setting" },
  { key: "simulation-settings", label: "Simulation Settings", path: "/drd/simulation-setting" },
  { key: "dashboard", label: "Dash Board", path: "/drd/simulation-result" },
];

// ── 경로 헬퍼 ─────────────────────────────────────────────────────

export const ATS_SIMULATION_PATH = "/ats/simulation";
export const ATS_REPORT_PATH = "/ats/simulation/report";

/** pathname으로 TSI active step index 계산 */
export function getTSIActiveStepIndex(pathname: string): number {
  if (pathname === "/tsi/report" || /^\/tsi\/[^/]+\/report/.test(pathname)) return 5;
  if (pathname === "/tsi/subgroup-explain") return 4;
  if (pathname === "/tsi/subgroup-selection" || pathname === "/tsi/refine-cutoffs") return 3;
  if (pathname === "/tsi/basis-selection") return 2;
  if (pathname === "/tsi/patients-summary") return 1;
  return 0;
}

/** headerType + pathname + drdStep으로 activeIndex 계산 */
export function getActiveStepIndex(
  type: string,
  pathname: string,
  drdStep: number,
): number {
  if (type === "ats") return pathname.includes("/report") ? 1 : 0;
  if (type === "drd") return drdStep - 1;
  if (type === "tsi") return getTSIActiveStepIndex(pathname);
  return 0;
}

/** TSI 이전 단계 경로 */
const TSI_PREV_PATHS = [
  "/",
  "/tsi",
  "/tsi/patients-summary",
  "/tsi/basis-selection",
  "/tsi/subgroup-selection",
  "/tsi/subgroup-explain",
];

export function getTSIPrevPath(activeIndex: number): string {
  return TSI_PREV_PATHS[activeIndex] || "/";
}
