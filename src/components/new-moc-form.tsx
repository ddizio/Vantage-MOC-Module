"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createMocAction } from "@/app/actions";
import { Field, inputCls, Card } from "./ui";
import { determineLevel, PHA_LABELS, requiredPhaForLevel } from "@/lib/constants";

type Kind = "CHANGE" | "MOOC" | "BYPASS";

const KIND_OPTIONS: { kind: Kind; title: string; blurb: string }[] = [
  {
    kind: "CHANGE",
    title: "Equipment / Process Change (MOC)",
    blurb:
      "Physical or process modification that is not replacement-in-kind. Hazard assessment determines Level 1–4.",
  },
  {
    kind: "MOOC",
    title: "Organizational / Personnel Change (MOOC)",
    blurb:
      "A role change, departure, or transfer that affects responsibilities for safe, compliant operation.",
  },
  {
    kind: "BYPASS",
    title: "Safety System Bypass / Impairment",
    blurb:
      "Temporarily defeating or impairing a safety device. Requires an alternate protection plan; >72 h needs extra approvals.",
  },
];

export function NewMocForm({
  sites,
}: {
  sites: { id: string; code: string; name: string }[];
}) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [degree, setDegree] = useState<"LOW" | "HIGH" | "">("");
  const [signif, setSignif] = useState<"LOW" | "HIGH" | "">("");
  const [changeType, setChangeType] = useState("PERMANENT");
  const [phaType, setPhaType] = useState("");
  const [state, formAction, pending] = useActionState(createMocAction, {});

  const level = degree && signif ? determineLevel(degree, signif) : null;
  const type =
    kind === "MOOC" ? "MOOC" : kind === "BYPASS" ? "BYPASS" : level === 1 ? "LEVEL1" : "LEVEL2";
  const requiredPha = level ? requiredPhaForLevel(level) : null;

  if (!kind) {
    return (
      <div className="grid gap-4">
        {KIND_OPTIONS.map((o) => (
          <button
            key={o.kind}
            onClick={() => setKind(o.kind)}
            className="text-left rounded-lg border border-gray-200 bg-white p-5 hover:border-vantage-500 hover:shadow-sm transition"
          >
            <h3 className="font-semibold text-vantage-700">{o.title}</h3>
            <p className="text-sm text-ink-3 mt-1">{o.blurb}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <button
        type="button"
        onClick={() => setKind(null)}
        className="text-sm text-vantage-blue hover:underline"
      >
        ← Choose a different form type
      </button>

      {state.error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}

      <input type="hidden" name="type" value={type} />

      {kind === "CHANGE" && (
        <Card
          title="Hazard Assessment — determine the MOC level"
          subtitle="Complete this matrix first; it selects the correct form and reviews."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Degree of hazard" hint="How hazardous is the process/material affected?">
              <div className="flex gap-2">
                {(["LOW", "HIGH"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setDegree(v)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                      degree === v
                        ? "border-vantage-500 bg-vantage-50 text-vantage-700"
                        : "border-gray-300 text-ink-3"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input type="hidden" name="degreeOfHazard" value={degree} />
            </Field>
            <Field label="Significance of change" hint="How large/complex is the modification?">
              <div className="flex gap-2">
                {(["LOW", "HIGH"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setSignif(v)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                      signif === v
                        ? "border-vantage-500 bg-vantage-50 text-vantage-700"
                        : "border-gray-300 text-ink-3"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input type="hidden" name="significance" value={signif} />
            </Field>
          </div>
          {level && (
            <div className="mt-4 rounded-md bg-vantage-50 border border-vantage-100 px-4 py-3 text-sm">
              <strong className="text-vantage-700">This is a Level {level} change.</strong>{" "}
              {level === 1 && "Uses the simplified Level 1 form (functional review + close-out)."}
              {level === 2 && "Uses the Level 2 form with full approval chain."}
              {level === 3 && "Uses the Level 2 form and requires a What-If Process Hazard Analysis."}
              {level === 4 && "Uses the Level 2 form and requires a HAZOP Process Hazard Analysis."}
            </div>
          )}
        </Card>
      )}

      {(kind !== "CHANGE" || level) && (
        <>
          <Card title="Scope">
            <div className="grid gap-4">
              <Field label={kind === "MOOC" ? "MOOC Title" : "MOC Title"}>
                <input name="title" required className={inputCls} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Site">
                  <select name="siteId" required className={inputCls} defaultValue={sites.length === 1 ? sites[0].id : ""}>
                    {sites.length > 1 && <option value="">Select site…</option>}
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Permanent or temporary?">
                  <select
                    name="changeType"
                    className={inputCls}
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value)}
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="TEMPORARY">Temporary</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date">
                  <input name="startDate" type="date" className={inputCls} />
                </Field>
                <Field
                  label={`End date ${changeType === "TEMPORARY" ? "(required for temporary changes)" : "(optional)"}`}
                >
                  <input
                    name="endDate"
                    type="date"
                    required={changeType === "TEMPORARY"}
                    className={inputCls}
                  />
                </Field>
              </div>

              {kind === "CHANGE" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Asset">
                      <input name="asset" className={inputCls} />
                    </Field>
                    <Field label="Plant area">
                      <input name="plantArea" className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Brief summary of the modification">
                    <textarea name="summary" rows={3} required className={inputCls} />
                  </Field>
                  <Field
                    label="Technical basis for change"
                    hint="What is to be changed and how? What will be achieved? How will the change achieve the intended goal? Is the change safe to make and why?"
                  >
                    <textarea name="technicalBasis" rows={4} required className={inputCls} />
                  </Field>
                  {level === 1 && (
                    <>
                      <Field
                        label="Process Safety Information to update"
                        hint="Documents that will be updated because of this change"
                      >
                        <textarea name="psiToUpdate" rows={2} className={inputCls} />
                      </Field>
                      <Field label="Impact on safety and environment (Part 1B)">
                        <textarea name="safetyEnvImpact" rows={3} required className={inputCls} />
                      </Field>
                    </>
                  )}
                  {level !== null && level >= 2 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Process Hazard Review required (Part 1C)"
                        hint={
                          requiredPha
                            ? `Level ${level} requires at least: ${PHA_LABELS[requiredPha]}`
                            : "Select the PHA type or 'None required' with justification"
                        }
                      >
                        <select
                          name="phaType"
                          required
                          className={inputCls}
                          value={phaType}
                          onChange={(e) => setPhaType(e.target.value)}
                        >
                          <option value="">Select…</option>
                          {Object.entries(PHA_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {phaType === "OTHER" && (
                        <Field label="Other PHA type">
                          <input name="phaOther" className={inputCls} />
                        </Field>
                      )}
                      <Field label="Justification">
                        <input name="phaJustification" className={inputCls} />
                      </Field>
                    </div>
                  )}
                </>
              )}

              {kind === "MOOC" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Job title affected">
                      <input name="jobTitle" required className={inputCls} />
                    </Field>
                    <Field label="The individual…">
                      <select name="reason" className={inputCls}>
                        <option value="RESIGNED">Resigned before placement (temporary change)</option>
                        <option value="TRANSFERRED">Transferred for another assignment</option>
                      </select>
                    </Field>
                  </div>
                  <Field
                    label="Job description"
                    hint="Mention any specific task in the JD that impacts continuity of site operation in compliance."
                  >
                    <textarea name="jobDescription" rows={4} required className={inputCls} />
                  </Field>
                </>
              )}

              {kind === "BYPASS" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Bypass start date/time">
                      <input name="bypassStart" type="datetime-local" required className={inputCls} />
                    </Field>
                    <Field label="Expected completion">
                      <input name="expectedCompletion" type="datetime-local" required className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Bypassed safety device ID and description">
                    <textarea name="deviceDescription" rows={2} required className={inputCls} />
                  </Field>
                  <Field label="Description of bypass">
                    <textarea name="bypassDescription" rows={2} required className={inputCls} />
                  </Field>
                  <Field label="Equipment protected by the safety system or device being bypassed">
                    <textarea name="protectedEquipment" rows={2} className={inputCls} />
                  </Field>
                  <Field
                    label="Hazard the safety device protects against"
                    hint="Reference the PHA when possible"
                  >
                    <textarea name="hazardExplanation" rows={2} required className={inputCls} />
                  </Field>
                  <Field label="Reason for bypass / impairment">
                    <textarea name="reason" rows={2} required className={inputCls} />
                  </Field>
                  <Field label="Alternate protection plan">
                    <textarea name="alternateProtection" rows={3} required className={inputCls} />
                  </Field>
                  <Field label="Person implementing the bypass and alternate protection plan">
                    <input name="implementerName" required className={inputCls} />
                  </Field>
                </>
              )}
            </div>
          </Card>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-vantage-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-vantage-600 disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create draft"}
          </button>
        </>
      )}
    </form>
  );
}
