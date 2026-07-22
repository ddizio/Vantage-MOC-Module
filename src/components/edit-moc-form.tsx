"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateMocAction } from "@/app/actions";
import { Field, inputCls, Card } from "./ui";
import { PHA_LABELS, type MocType } from "@/lib/constants";
import type { AnyFormData } from "@/lib/forms";

type Defaults = AnyFormData & {
  title: string;
  changeType: string;
  startDate: string;
  endDate: string;
};

export function EditMocForm({
  mocId,
  type,
  level,
  defaults,
}: {
  mocId: string;
  type: MocType;
  level: number | null;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState(updateMocAction, {});
  const [changeType, setChangeType] = useState(defaults.changeType);
  const [phaType, setPhaType] = useState(defaults.phaType ?? "");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="mocId" value={mocId} />
      {state.error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <Card title="Scope">
        <div className="grid gap-4">
          <Field label="Title">
            <input name="title" required defaultValue={defaults.title} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <Field label="Start date">
              <input name="startDate" type="date" defaultValue={defaults.startDate} className={inputCls} />
            </Field>
            <Field label={`End date ${changeType === "TEMPORARY" ? "(required)" : ""}`}>
              <input
                name="endDate"
                type="date"
                defaultValue={defaults.endDate}
                required={changeType === "TEMPORARY"}
                className={inputCls}
              />
            </Field>
          </div>

          {(type === "LEVEL1" || type === "LEVEL2") && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Asset">
                  <input name="asset" defaultValue={defaults.asset ?? ""} className={inputCls} />
                </Field>
                <Field label="Plant area">
                  <input name="plantArea" defaultValue={defaults.plantArea ?? ""} className={inputCls} />
                </Field>
              </div>
              <Field label="Brief summary of the modification">
                <textarea name="summary" rows={3} required defaultValue={defaults.summary ?? ""} className={inputCls} />
              </Field>
              <Field label="Technical basis for change">
                <textarea
                  name="technicalBasis"
                  rows={4}
                  required
                  defaultValue={defaults.technicalBasis ?? ""}
                  className={inputCls}
                />
              </Field>
              {type === "LEVEL1" && (
                <>
                  <Field label="Process Safety Information to update">
                    <textarea name="psiToUpdate" rows={2} defaultValue={defaults.psiToUpdate ?? ""} className={inputCls} />
                  </Field>
                  <Field label="Impact on safety and environment (Part 1B)">
                    <textarea
                      name="safetyEnvImpact"
                      rows={3}
                      defaultValue={defaults.safetyEnvImpact ?? ""}
                      className={inputCls}
                    />
                  </Field>
                </>
              )}
              {type === "LEVEL2" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Process Hazard Review required (Part 1C)"
                    hint={
                      level === 3
                        ? "Level 3 requires at least a What-If review"
                        : level === 4
                          ? "Level 4 requires a HAZOP"
                          : undefined
                    }
                  >
                    <select
                      name="phaType"
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
                      <input name="phaOther" defaultValue={defaults.phaOther ?? ""} className={inputCls} />
                    </Field>
                  )}
                  <Field label="Justification">
                    <input
                      name="phaJustification"
                      defaultValue={defaults.phaJustification ?? ""}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
            </>
          )}

          {type === "MOOC" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Job title affected">
                  <input name="jobTitle" required defaultValue={defaults.jobTitle ?? ""} className={inputCls} />
                </Field>
                <Field label="The individual…">
                  <select name="reason" defaultValue={defaults.reason ?? "RESIGNED"} className={inputCls}>
                    <option value="RESIGNED">Resigned before placement (temporary change)</option>
                    <option value="TRANSFERRED">Transferred for another assignment</option>
                  </select>
                </Field>
              </div>
              <Field label="Job description">
                <textarea
                  name="jobDescription"
                  rows={4}
                  required
                  defaultValue={defaults.jobDescription ?? ""}
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {type === "BYPASS" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bypass start date/time">
                  <input
                    name="bypassStart"
                    type="datetime-local"
                    required
                    defaultValue={defaults.bypassStart ?? ""}
                    className={inputCls}
                  />
                </Field>
                <Field label="Expected completion">
                  <input
                    name="expectedCompletion"
                    type="datetime-local"
                    required
                    defaultValue={defaults.expectedCompletion ?? ""}
                    className={inputCls}
                  />
                </Field>
              </div>
              {(
                [
                  ["deviceDescription", "Bypassed safety device ID and description"],
                  ["bypassDescription", "Description of bypass"],
                  ["protectedEquipment", "Equipment protected by the device"],
                  ["hazardExplanation", "Hazard the device protects against"],
                  ["reason", "Reason for bypass / impairment"],
                  ["alternateProtection", "Alternate protection plan"],
                ] as const
              ).map(([name, label]) => (
                <Field key={name} label={label}>
                  <textarea
                    name={name}
                    rows={2}
                    required={name !== "protectedEquipment"}
                    defaultValue={(defaults[name] as string) ?? ""}
                    className={inputCls}
                  />
                </Field>
              ))}
              <Field label="Person implementing the bypass and alternate protection plan">
                <input
                  name="implementerName"
                  required
                  defaultValue={defaults.implementerName ?? ""}
                  className={inputCls}
                />
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
