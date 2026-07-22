import type { MocStatus, MocType } from "./constants";

// A required signature within a stage. roleKey is either a SiteRole (routed
// to the site's designated holder of that role), or one of the special keys:
//   MOC_LEAD          — the MOC lead named on the record
//   RELEVANT_MANAGER  — a manager picked at submission (cannot be the lead)
//   APPROVING_MANAGER — the approving manager picked at submission (bypass)
export interface SignatureSpec {
  roleKey: string;
  roleLabel: string;
}

export interface StageSpec {
  stage: string; // Approval.stage key
  title: string;
  description: string;
  signatures: SignatureSpec[];
  /** MOC status while this stage's signatures are being collected. */
  status: MocStatus;
  /** Status the MOC moves to once every signature in the stage is approved. */
  nextStatus: MocStatus;
  /**
   * When true, the next stage's approvals are created immediately after this
   * stage completes. When false, real-world work (e.g. installing the change)
   * happens in between and the MOC Lead advances the record manually.
   */
  autoOpenNext: boolean;
}

// ─── Workflow definitions, mirroring the paper forms ────────────────────────

const LEVEL1_STAGES: StageSpec[] = [
  {
    stage: "FUNCTIONAL_REVIEW",
    status: "REVIEW",
    title: "Part 1C — Functional Review",
    description:
      "Process Safety and the Relevant Manager review the functional review checklist and approve the MOC Lead to proceed with implementation.",
    signatures: [
      { roleKey: "PROCESS_SAFETY", roleLabel: "Process Safety" },
      { roleKey: "RELEVANT_MANAGER", roleLabel: "Relevant Manager (cannot be the MOC Lead)" },
    ],
    nextStatus: "IMPLEMENTATION",
    autoOpenNext: false,
  },
  {
    stage: "CLOSEOUT",
    status: "CLOSEOUT",
    title: "Part 2 — Post-Commissioning & Close-Out",
    description:
      "MOC Lead confirms the change is working and the close-out checklist is complete. Outstanding punch list items are completed or tracked.",
    signatures: [
      { roleKey: "MOC_LEAD", roleLabel: "MOC Lead" },
      { roleKey: "PROCESS_SAFETY", roleLabel: "Process Safety" },
    ],
    nextStatus: "CLOSED",
    autoOpenNext: false,
  },
];

const LEVEL2_STAGES: StageSpec[] = [
  {
    stage: "APPROVAL_TO_PROCEED",
    status: "REVIEW",
    title: "Part 2 — Approval to Proceed",
    description:
      "Approvers grant Approval for Procurement & Construction of the detailed design and confirm all design documents identified in the documentation checklist are provided.",
    signatures: [
      { roleKey: "PRODUCTION_MANAGER", roleLabel: "Production Manager (PM)" },
      { roleKey: "TECHNICAL_AUTHORITY", roleLabel: "Technical Authority (TA)" },
      { roleKey: "MAINTENANCE_MANAGER", roleLabel: "Maintenance Manager" },
      { roleKey: "EHSS_MANAGER", roleLabel: "EHSS Manager" },
      { roleKey: "PROCESS_SAFETY", roleLabel: "Process Safety" },
    ],
    nextStatus: "IMPLEMENTATION",
    autoOpenNext: false,
  },
  {
    stage: "HANDOVER",
    status: "HANDOVER",
    title: "Part 3 — Modification Completion / Handover & Commissioning",
    description:
      "Production Manager acknowledges the modification was installed per the approved design, pre-commissioning documentation is updated, operating instructions are available, training is complete, and commissioning may proceed.",
    signatures: [
      { roleKey: "PRODUCTION_MANAGER", roleLabel: "Production Manager" },
    ],
    nextStatus: "CLOSEOUT",
    autoOpenNext: true,
  },
  {
    stage: "CLOSEOUT",
    status: "CLOSEOUT",
    title: "Part 4 — Post-Commissioning & Close-Out",
    description:
      "MOC Lead confirms the MOC is working as designed and the documentation checklist is complete. Outstanding punch list items are completed or tracked.",
    signatures: [
      { roleKey: "MOC_LEAD", roleLabel: "MOC Lead" },
      { roleKey: "PROCESS_SAFETY", roleLabel: "Process Safety" },
    ],
    nextStatus: "CLOSED",
    autoOpenNext: false,
  },
];

const MOOC_STAGES: StageSpec[] = [
  {
    stage: "TRANSITION_PLAN",
    status: "REVIEW",
    title: "Part 1B — Transition Plan Confirmation",
    description:
      "MOOC Lead and the Relevant Manager acknowledge a transition plan was developed and responsibilities have been reassigned in the transition plan checklist.",
    signatures: [
      { roleKey: "MOC_LEAD", roleLabel: "MOOC Lead" },
      { roleKey: "RELEVANT_MANAGER", roleLabel: "Relevant Manager" },
    ],
    nextStatus: "REVIEW",
    autoOpenNext: true,
  },
  {
    stage: "FINAL_APPROVAL",
    status: "REVIEW",
    title: "Part 2 — Final Review and Approval",
    description:
      "Site Manager approves the reassignment of responsibilities and documents any change in ownership.",
    signatures: [{ roleKey: "SITE_MANAGER", roleLabel: "Site Manager" }],
    nextStatus: "IMPLEMENTATION",
    autoOpenNext: false,
  },
  {
    stage: "CLOSEOUT",
    status: "CLOSEOUT",
    title: "Part 3 — Close-Out",
    description:
      "MOOC Lead confirms the organizational change is working as designed and the transition plan checklist is complete. Process Safety ensures completion and record keeping.",
    signatures: [
      { roleKey: "MOC_LEAD", roleLabel: "MOOC Lead" },
      { roleKey: "PROCESS_SAFETY", roleLabel: "Process Safety" },
    ],
    nextStatus: "CLOSED",
    autoOpenNext: false,
  },
];

const BYPASS_STAGES: StageSpec[] = [
  {
    stage: "BYPASS_APPROVAL",
    status: "REVIEW",
    title: "Bypass Approval",
    description:
      "Approving Manager authorizes the safety system bypass and the alternate protection plan.",
    signatures: [
      { roleKey: "APPROVING_MANAGER", roleLabel: "Approving Manager" },
      { roleKey: "MOC_LEAD", roleLabel: "MOC Lead" },
    ],
    nextStatus: "ACTIVE",
    autoOpenNext: true,
  },
  {
    stage: "RESTORATION",
    status: "ACTIVE",
    title: "Return to Service",
    description:
      "The signers verify the safety system has been returned to service and is functioning correctly. Process Safety countersigns to close the record.",
    signatures: [
      { roleKey: "MOC_LEAD", roleLabel: "MOC Lead" },
      { roleKey: "PROCESS_SAFETY", roleLabel: "Process Safety" },
    ],
    nextStatus: "CLOSED",
    autoOpenNext: false,
  },
];

// Extension beyond 72 hours (created on demand, not part of the linear flow).
export const BYPASS_EXTENSION_STAGE: StageSpec = {
  stage: "BYPASS_EXTENSION",
  status: "ACTIVE",
  title: "Bypass Extension (>72 hours)",
  description:
    "A safety system bypass extension over 72 hours requires Production Manager, Technical Authority, and EHSS Manager approval.",
  signatures: [
    { roleKey: "PRODUCTION_MANAGER", roleLabel: "Production Manager" },
    { roleKey: "TECHNICAL_AUTHORITY", roleLabel: "Technical Authority" },
    { roleKey: "EHSS_MANAGER", roleLabel: "EHSS Manager" },
  ],
  nextStatus: "ACTIVE",
  autoOpenNext: false,
};

export const WORKFLOWS: Record<MocType, StageSpec[]> = {
  LEVEL1: LEVEL1_STAGES,
  LEVEL2: LEVEL2_STAGES,
  MOOC: MOOC_STAGES,
  BYPASS: BYPASS_STAGES,
};

export function getStages(type: MocType): StageSpec[] {
  return WORKFLOWS[type];
}

export function getStage(type: MocType, stage: string): StageSpec | undefined {
  if (stage === "BYPASS_EXTENSION") return BYPASS_EXTENSION_STAGE;
  return WORKFLOWS[type].find((s) => s.stage === stage);
}

export function nextStage(
  type: MocType,
  stage: string
): StageSpec | undefined {
  const stages = WORKFLOWS[type];
  const idx = stages.findIndex((s) => s.stage === stage);
  if (idx === -1) return undefined;
  return stages[idx + 1];
}

/** First stage in the workflow (opened when the draft is submitted). */
export function firstStage(type: MocType): StageSpec {
  return WORKFLOWS[type][0];
}
