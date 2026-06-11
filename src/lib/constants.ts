// Authoritative value lists for string-typed enum columns in the database.

export const MOC_TYPES = ["LEVEL1", "LEVEL2", "MOOC", "BYPASS"] as const;
export type MocType = (typeof MOC_TYPES)[number];

export const MOC_TYPE_LABELS: Record<MocType, string> = {
  LEVEL1: "MOC — Level 1",
  LEVEL2: "MOC — Level 2/3/4",
  MOOC: "Management of Organizational Change (MOOC)",
  BYPASS: "Safety System Bypass / Impairment",
};

export const MOC_STATUSES = [
  "DRAFT",
  "REVIEW",
  "IMPLEMENTATION",
  "HANDOVER",
  "CLOSEOUT",
  "ACTIVE",
  "CLOSED",
  "REJECTED",
  "CANCELED",
] as const;
export type MocStatus = (typeof MOC_STATUSES)[number];

export const STATUS_LABELS: Record<MocStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Pending Approval",
  IMPLEMENTATION: "Approved — In Progress",
  HANDOVER: "Commissioning",
  CLOSEOUT: "Close-Out",
  ACTIVE: "Bypass Active",
  CLOSED: "Closed",
  REJECTED: "Not Approved",
  CANCELED: "Canceled",
};

export const STATUS_COLORS: Record<MocStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  REVIEW: "bg-amber-50 text-amber-800 border-amber-300",
  IMPLEMENTATION: "bg-sky-50 text-sky-800 border-sky-300",
  HANDOVER: "bg-indigo-50 text-indigo-800 border-indigo-300",
  CLOSEOUT: "bg-teal-50 text-teal-800 border-teal-300",
  ACTIVE: "bg-orange-50 text-orange-800 border-orange-300",
  CLOSED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  REJECTED: "bg-red-50 text-red-800 border-red-300",
  CANCELED: "bg-gray-100 text-gray-500 border-gray-300",
};

// Site-level functional roles used to route approvals.
export const SITE_ROLES = [
  "PROCESS_SAFETY",
  "EHSS_MANAGER",
  "PRODUCTION_MANAGER",
  "TECHNICAL_AUTHORITY",
  "MAINTENANCE_MANAGER",
  "SITE_MANAGER",
] as const;
export type SiteRole = (typeof SITE_ROLES)[number];

export const SITE_ROLE_LABELS: Record<SiteRole, string> = {
  PROCESS_SAFETY: "Process Safety",
  EHSS_MANAGER: "EHSS Manager",
  PRODUCTION_MANAGER: "Production Manager",
  TECHNICAL_AUTHORITY: "Technical Authority (TA)",
  MAINTENANCE_MANAGER: "Maintenance Manager",
  SITE_MANAGER: "Site Manager",
};

export const CHANGE_TYPES = ["PERMANENT", "TEMPORARY"] as const;

export const PHA_TYPES = [
  "WHAT_IF",
  "HAZOP",
  "LOPA",
  "OTHER",
  "NONE",
] as const;
export type PhaType = (typeof PHA_TYPES)[number];

export const PHA_LABELS: Record<PhaType, string> = {
  WHAT_IF: "What-If Review",
  HAZOP: "HAZOP",
  LOPA: "LOPA",
  OTHER: "Other",
  NONE: "None Required",
};

/**
 * Hazard assessment matrix (from MOC training):
 *
 *                        LOW Significance   HIGH Significance
 *  LOW Degree of Hazard      Level 1            Level 2
 *  HIGH Degree of Hazard     Level 3            Level 4
 *
 * Level 3 requires a What-If PHA; Level 4 requires a HAZOP.
 */
export function determineLevel(
  degreeOfHazard: "LOW" | "HIGH",
  significance: "LOW" | "HIGH"
): 1 | 2 | 3 | 4 {
  if (degreeOfHazard === "LOW") return significance === "LOW" ? 1 : 2;
  return significance === "LOW" ? 3 : 4;
}

export function requiredPhaForLevel(level: number): PhaType | null {
  if (level === 3) return "WHAT_IF";
  if (level === 4) return "HAZOP";
  return null;
}

export const DOC_PHASES = [
  "DETAILED_DESIGN",
  "PRE_COMMISSIONING",
  "PRE_CLOSEOUT",
] as const;

export const DOC_PHASE_LABELS: Record<string, string> = {
  DETAILED_DESIGN: "Required for Detailed Design",
  PRE_COMMISSIONING: "Required Prior to Commissioning",
  PRE_CLOSEOUT: "Required Prior to Close-Out",
};

export const ACTION_CATEGORIES: Record<string, string> = {
  A: "A — Complete prior to reinventorying hazardous chemicals",
  B: "B — Required during hot commissioning",
  C: "C — Complete after start-up / prior to MOC closure",
  GENERAL: "General",
};

// A bypass extension beyond 72 hours requires additional approvals.
export const BYPASS_EXTENSION_HOURS = 72;
