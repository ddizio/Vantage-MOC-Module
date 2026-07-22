// Checklist templates transcribed from the paper MOC forms.
// Responses are stored per-MOC in ChecklistResponse rows keyed by itemKey.

export interface ChecklistTemplateItem {
  key: string;
  label: string;
  category?: string;
}

// ─── MOC Level 1, Appendix A: Functional Review Checklist ──────────────────
export const FUNCTIONAL_REVIEW_ITEMS: ChecklistTemplateItem[] = [
  { key: "fr-material", category: "Design / Engineering", label: "Does the change involve material upgrade? Has it been reviewed and inspected by relevant engineer?" },
  { key: "fr-machinery", category: "Design / Engineering", label: "Does the change involve machinery? Technical change basis provided with the document and reviewed by relevant engineer?" },
  { key: "fr-hazards", category: "Design / Engineering", label: "Have the hazards of the change been considered and documented (e.g. deviations in flow, pressure, temperature)?" },
  { key: "fr-inspection", category: "Design / Engineering", label: "Have inspection requirements been reviewed by relevant engineer?" },
  { key: "fr-welding", category: "Design / Engineering", label: "Is welding design/procedure in accordance with code requirements?" },
  { key: "fr-gusseting", category: "Design / Engineering", label: "Has the design included gusseting small piping connections as needed?" },
  { key: "fr-workspace", category: "Design / Engineering", label: "Is there adequate working space for field work?" },
  { key: "fr-lighting", category: "Design / Engineering", label: "Would any additional lighting be required to operate the change?" },
  { key: "fr-supervision", category: "Design / Engineering", label: "Will the execution of the change be done under the direct supervision of experienced Vantage personnel?" },
  { key: "fr-fire-hazard", category: "Design / Engineering", label: "Is there a fire hazard during field work?" },
  { key: "fr-fire-measures", category: "Design / Engineering", label: "Have adequate measures (placing of additional fire extinguishers/hoses) been taken in case the area is not covered by existing fire water facility?" },
  { key: "fr-closeout", category: "Design / Engineering", label: "Will closeout of change be required?" },
  { key: "fr-pssr", category: "Design / Engineering", label: "PSSR required (input from Process Safety Engineer)?" },
];

// ─── MOC Level 1, Part 2: Close-Out Checklist ───────────────────────────────
export const L1_CLOSEOUT_ITEMS: ChecklistTemplateItem[] = [
  { key: "co-job", label: "Job completed?" },
  { key: "co-pssr", label: "PSSR completed?" },
  { key: "co-psi", label: "PSI & Equipment File updated?" },
  { key: "co-amd", label: "Add / Modify / Delete Form submitted & installed?" },
  { key: "co-punchlist", label: "All punch list recommendations closed?" },
  { key: "co-ldar", label: "LDAR updated?" },
];

// ─── MOC Level 2, Appendix A: Safety & Environmental Assessment check words ─
// MOC Lead ticks the issues with moderate/significant impact, then writes an
// assessment for each ticked word (Part B of the appendix).
export const SE_ASSESSMENT_CATEGORIES: {
  category: string;
  prompt: string;
  words: string[];
}[] = [
  {
    category: "Design Changes",
    prompt: "What is being changed with this modification?",
    words: [
      "Flowrate", "Velocity", "Capacity", "Pressure", "Temperature", "Level",
      "Feed/Product Specifications", "New Process Materials", "Stream Compositions",
      "Stream Mixing", "Physical Properties", "Changes of Phase", "Sampling / Analysis",
      "Operating Envelope", "Design Conditions", "Valve Types", "Pipework",
      "Novel Equipment", "Item Modification", "Materials of Construction",
      "Structures / Plant Layout", "Electrics", "Power Distribution", "Instrumentation",
      "PLC / SIS Operation", "DCS Operation", "Critical Alarms", "Shutdown Systems",
      "Advanced Control", "Inspection Strategy",
    ],
  },
  {
    category: "Hazards",
    prompt: "What new SSHE hazards are introduced by this modification?",
    words: [
      "Overfilling", "Emptying", "Gas Blow-by", "Reverse Flow", "Surge", "Overpressure",
      "Vacuum Formation", "Low / High Temperature", "Contamination", "Fouling / Deposition",
      "Blockages / Freezing", "Chemical Reactions", "Two Phasing", "Sloshing / Cyclic Loads",
      "Flammability / Explosion", "Op. Envelope Breaches", "Pipework Stressing",
      "Vibration Fatigue", "Thermal Fatigue", "Thermal / Pressure Cycling", "Erosion",
      "Embrittlement", "Upstream / Downstream Impact", "Internal / External Corrosion",
      "Under Lagging Corrosion", "New Corrosion Mechanism", "Valve Line Up",
      "Cross Connections", "Passing Valves", "Changed chance of leaks or spills",
      "Changed severity of leaks or spills", "Increased severity of human error",
      "Chemical Exposure", "Slip, Trip, Fall Hazard", "Legionella Risk", "Equipment Failure",
      "Trip Failure", "Source of Ignition", "Static / Lightning", "Access Restrictions",
      "Loss of Service", "Combustible Dust", "Dust", "Toxicity", "Radiation Exposure",
      "Lifting Activities", "O2 Deficient Atmosphere",
    ],
  },
  {
    category: "Safeguards",
    prompt: "What existing safeguards are affected and what new safeguards are required?",
    words: [
      "Flaring / Vent / Relief Systems", "Fire Protection Systems", "Thermal Relief",
      "Isolation Requirements", "NRVs", "Restriction Orifices", "Remote Isolation",
      "Pipe Specifications", "Safety Showers / Eye Washes", "Grounding / Bonding",
      "Locking / Interlocking", "Secondary Containment", "Tertiary Containment",
      "Purging / Inerting", "Lighting", "Area Classification", "Freeze Precautions",
      "Facility Siting", "Instrumentation", "Trips / ESD Appraisal", "Control System Design",
      "Control Valve Failure Mode", "Duplication / Redundancy", "Access / Escape",
      "Shutdown / Start Up", "Inspection Scheme / Frequency", "Procedures / Training",
      "Emergency Response Plan", "Fire Fighting / Plans", "Leak Detection",
      "Fire / Gas Detection", "Paving / Drainage", "Personnel Protection",
      "Corrosion Monitoring", "Ventilation",
    ],
  },
  {
    category: "Environment",
    prompt: "What environmental aspects are affected by this modification?",
    words: [
      "Toxicity", "Smell", "Noise", "EO / Vent Emissions", "Community Air Quality",
      "Spill Prevention", "Gas Detection", "Relief Vents", "Storm Water",
      "Effluent Treatment", "Mixing Effluents", "Plant Drainage", "Dust Emissions",
      "Solids Disposal", "Liquids Waste", "Energy Conservation", "LDAR", "RMP",
    ],
  },
  {
    category: "Operations & Maintenance",
    prompt: "What aspects of maintenance and operating activities are affected?",
    words: [
      "Changes in Alarm Handling", "Complexity of Operations", "Clarity of Instructions",
      "Clarity of Drawings", "Increased Distractions", "Manning / Manpower",
      "Change in Mental Workload", "Changes in Time Pressure", "Visual Displays",
      "Labelling & Signs", "Changes to Controls", "Platforms / Walkways / Handrails / Ladders",
      "Changes in Physical Workload", "Access Openings", "Awkward or Static Postures",
      "Access / Egress", "Manual Handling", "Welding Requirements", "Lighting",
      "Temperature", "Noise", "Vibration", "Auditory Information",
    ],
  },
  {
    category: "Procedures & Regulations",
    prompt: "Does this modification impact key procedures, reports and regulations?",
    words: [
      "Air Permit", "Wastewater Discharge Permit", "Fire Suppression System",
      "Toxic Gas Monitoring System", "New Chemical", "NPDES (SWPPP)",
      "SPCC (Denaturant Tank)", "Waste Disposal (Haz, Non-Haz)", "RMP", "PSM",
      "DOT - HAZMAT", "Other",
    ],
  },
  {
    category: "Personnel",
    prompt:
      "Does this change affect who is responsible for these areas? Who is newly responsible? Are they adequately trained?",
    words: [
      "Manages Area Operations", "Manages Area Personnel", "Manages Contract Personnel",
      "Issues Permits", "Hazard Reviews", "Incident Reviews", "Training",
      "Coordinates On-site Drills", "Safety Committee", "Area Compliance",
      "Mechanical Integrity", "Operating Envelopes", "Operating Procedures", "Other",
    ],
  },
];

export function seItemKey(category: string, word: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `se-${slug(category)}--${slug(word)}`;
}

// ─── MOC Level 2, Appendix B: Documentation Checklist ───────────────────────
export const DOC_CHECKLIST_ITEMS: ChecklistTemplateItem[] = [
  { key: "doc-sshe-manual", category: "SSHE", label: "SSHE Manual" },
  { key: "doc-new-chemical", category: "SSHE", label: "New Chemical Approval & SDS" },
  { key: "doc-fire-suppression", category: "SSHE", label: "Fire Suppression System" },
  { key: "doc-erm", category: "SSHE", label: "Emergency Response Manual" },
  { key: "doc-permit", category: "SSHE", label: "Regulatory Permit (SPCC, SWPPP, etc.)" },
  { key: "doc-rmp", category: "SSHE", label: "RMP Updated" },
  { key: "doc-ldar", category: "SSHE", label: "LDAR Updated" },
  { key: "doc-datasheets", category: "Process Design / Engineering", label: "Data Sheets (Equipment & Instruments)" },
  { key: "doc-design-guidelines", category: "Process Design / Engineering", label: "Design / Operating Guidelines" },
  { key: "doc-operating-window", category: "Process Design / Engineering", label: "Operating Window" },
  { key: "doc-heat-mass", category: "Process Design / Engineering", label: "Heat & Mass Balance" },
  { key: "doc-pfd", category: "Process Design / Engineering", label: "Process Flow Diagrams" },
  { key: "doc-pid", category: "Process Design / Engineering", label: "P&IDs" },
  { key: "doc-sizing", category: "Process Design / Engineering", label: "Sizing Calculations" },
  { key: "doc-control-philosophy", category: "Process Design / Engineering", label: "Control Philosophy" },
  { key: "doc-cgmp", category: "Process Design / Engineering", label: "CGMP / Food Contact Impact Approved" },
  { key: "doc-om-review", category: "Process Design / Engineering", label: "Operability and Maintainability Design Review" },
  { key: "doc-hazard-review", category: "Process Design / Engineering", label: "Hazard Review" },
  { key: "doc-facility-layout", category: "Mechanical Design / Engineering", label: "Facility Layout" },
  { key: "doc-general-arrangement", category: "Mechanical Design / Engineering", label: "General Arrangement" },
  { key: "doc-piping-route", category: "Mechanical Design / Engineering", label: "Piping Route & Layout" },
  { key: "doc-isometrics", category: "Mechanical Design / Engineering", label: "Isometrics" },
  { key: "doc-pipe-supports", category: "Mechanical Design / Engineering", label: "Pipe Supports" },
  { key: "doc-asme", category: "Mechanical Design / Engineering", label: "Mechanical Design / ASME Calcs / Permits" },
  { key: "doc-loop-drawings", category: "E&I Design / Engineering", label: "Loop / IO / Network / Panel Drawings" },
  { key: "doc-single-line", category: "E&I Design / Engineering", label: "Single Line Diagram" },
  { key: "doc-ei-list", category: "E&I Design / Engineering", label: "Electrical / Instrument List" },
  { key: "doc-area-classification", category: "E&I Design / Engineering", label: "Area Classification Drawing" },
  { key: "doc-hmi", category: "E&I Design / Engineering", label: "HMI / PLC / DCS Updated" },
  { key: "doc-commissioning-plan", category: "Commissioning", label: "Commissioning Plan" },
  { key: "doc-commissioning-sops", category: "Commissioning", label: "Commissioning SOPs" },
  { key: "doc-pssr", category: "Commissioning", label: "PSSR" },
  { key: "doc-punch-list", category: "Commissioning", label: "Punch List" },
  { key: "doc-ops-training", category: "Operations", label: "Training / Notification Completed & Documented" },
  { key: "doc-sops", category: "Operations", label: "SOPs" },
  { key: "doc-labelling", category: "Operations", label: "Labelling" },
  { key: "doc-loto", category: "Operations", label: "LOTO SOP" },
  { key: "doc-training-manuals", category: "Operations", label: "Training Manuals" },
  { key: "doc-amd-form", category: "Maintenance / Reliability", label: "Add / Modify / Delete Form Submitted" },
  { key: "doc-ppm", category: "Maintenance / Reliability", label: "Preventative / Predictive Maintenance" },
  { key: "doc-spares", category: "Maintenance / Reliability", label: "Procured Required Equipment Spares" },
  { key: "doc-maint-training", category: "Maintenance / Reliability", label: "Training / Notification Completed & Documented (Maintenance)" },
  { key: "doc-equipment-files", category: "Maintenance / Reliability", label: "Updated Equipment Files" },
  { key: "doc-relief-valve-list", category: "Maintenance / Reliability", label: "Updated Master Equipment / Relief Valve List" },
];

// ─── MOOC, Appendix A: Transition Plan default elements ─────────────────────
export const TRANSITION_PLAN_ITEMS: ChecklistTemplateItem[] = [
  { key: "tp-env-permits", label: "Update environmental permitting / agency designations" },
  { key: "tp-erp", label: "Update Emergency Response Plan" },
  { key: "tp-incidents", label: "Reassign incidents & action items" },
  { key: "tp-mocs", label: "Reassign MOCs and MOC actions" },
  { key: "tp-psm-audit", label: "Reassign PSM audit action items" },
  { key: "tp-pha", label: "Reassign PHA action items" },
  { key: "tp-hr", label: "Update reporting hierarchy in HR management system" },
];
