// Shapes of the JSON-encoded Moc.formData column, per form type.

/** MOC Level 1 & Level 2 shared scope fields (Part 1A). */
export interface ChangeFormData {
  asset?: string;
  plantArea?: string;
  summary?: string; // Brief Summary of Asset Managed Modification
  technicalBasis?: string;
  psiToUpdate?: string; // Level 1: Process Safety Information to Update
  safetyEnvImpact?: string; // Level 1 Part 1B narrative
  // Level 2 Part 1C — Process Hazard Review
  phaType?: string; // WHAT_IF | HAZOP | LOPA | OTHER | NONE
  phaOther?: string;
  phaJustification?: string;
}

/** Management of Organizational Change (Appendix E). */
export interface MoocFormData {
  jobTitle?: string;
  reason?: "RESIGNED" | "TRANSFERRED";
  jobDescription?: string;
}

/** Safety System Bypass / Impairment (Appendix D). */
export interface BypassFormData {
  bypassStart?: string; // ISO datetime
  expectedCompletion?: string; // ISO datetime
  deviceDescription?: string; // Bypassed safety device ID and description
  bypassDescription?: string;
  protectedEquipment?: string;
  hazardExplanation?: string; // reference PHA when possible
  reason?: string;
  alternateProtection?: string;
  implementerName?: string; // person implementing bypass & alternate protection
  restoredAt?: string; // ISO datetime when returned to service
  extensionExpiration?: string; // bypass expiration date for >72h extension
}

export type AnyFormData = ChangeFormData & MoocFormData & BypassFormData;

export function parseFormData(raw: string): AnyFormData {
  try {
    return JSON.parse(raw) as AnyFormData;
  } catch {
    return {};
  }
}
