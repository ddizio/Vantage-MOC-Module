"use client";

import { useActionState, useState } from "react";
import {
  answerChecklistAction,
  toggleSeWordAction,
  updateDocChecklistAction,
  addTransitionItemAction,
  type ActionResult,
} from "@/app/actions";
import { SE_ASSESSMENT_CATEGORIES, seItemKey } from "@/lib/checklists";
import { DOC_PHASE_LABELS } from "@/lib/constants";
import { inputCls } from "./ui";

export interface ChecklistRow {
  id: string;
  itemKey: string;
  label: string;
  category: string | null;
  answer: string | null;
  remarks: string | null;
  ownerId: string | null;
  requiredPhase: string | null;
  completedByName?: string | null;
}

export interface PersonOption {
  id: string;
  name: string;
}

// ─── Yes/No/NA checklist (functional review, L1 close-out) ─────────────────

function YesNoRow({
  row,
  editable,
}: {
  row: ChecklistRow;
  editable: boolean;
}) {
  const [, formAction] = useActionState(answerChecklistAction, {});
  const [remarks, setRemarks] = useState(row.remarks ?? "");
  const options = ["YES", "NO", "NA"];
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="py-2 pr-3 text-sm">{row.label}</td>
      <td className="py-2 pr-3">
        <div className="flex gap-1">
          {options.map((o) => (
            <form action={formAction} key={o}>
              <input type="hidden" name="responseId" value={row.id} />
              <input type="hidden" name="answer" value={o} />
              <input type="hidden" name="remarks" value={remarks} />
              <button
                type="submit"
                disabled={!editable}
                className={`rounded px-2 py-1 text-xs font-medium border ${
                  row.answer === o
                    ? o === "NO"
                      ? "bg-orange-50 border-vantage-orange text-vantage-orange"
                      : "bg-vantage-50 border-vantage-500 text-vantage-700"
                    : "border-gray-200 text-ink-3"
                } ${editable ? "hover:border-vantage-500" : "opacity-60 cursor-default"}`}
              >
                {o === "NA" ? "N/A" : o.charAt(0) + o.slice(1).toLowerCase()}
              </button>
            </form>
          ))}
        </div>
      </td>
      <td className="py-2 w-64">
        {editable ? (
          <form action={formAction}>
            <input type="hidden" name="responseId" value={row.id} />
            <input type="hidden" name="answer" value={row.answer ?? ""} />
            <input
              name="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onBlur={(e) => {
                // Save remarks when the field loses focus (not only on Enter).
                if (remarks !== (row.remarks ?? "")) e.currentTarget.form?.requestSubmit();
              }}
              placeholder="Remarks (saved on tab/click away)"
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
            />
          </form>
        ) : (
          <span className="text-xs text-ink-3">{row.remarks}</span>
        )}
      </td>
    </tr>
  );
}

export function YesNoChecklist({
  rows,
  editable,
}: {
  rows: ChecklistRow[];
  editable: boolean;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-ink-3 border-b border-gray-200">
          <th className="py-1.5">Item</th>
          <th className="py-1.5">Answer</th>
          <th className="py-1.5">Remarks</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <YesNoRow key={r.id} row={r} editable={editable} />
        ))}
      </tbody>
    </table>
  );
}

// ─── Level 2 Appendix A: Safety & Environmental Assessment ─────────────────

export function SeAssessment({
  mocId,
  checkedRows,
  editable,
}: {
  mocId: string;
  checkedRows: ChecklistRow[];
  editable: boolean;
}) {
  const [, formAction] = useActionState(toggleSeWordAction, {});
  const checkedByKey = new Map(checkedRows.map((r) => [r.itemKey, r]));
  const [openCat, setOpenCat] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-3">
        Tick the issues that could have a moderate or significant impact on the
        preparation of this MOC, and write an assessment for each ticked item.
      </p>
      {SE_ASSESSMENT_CATEGORIES.map((cat) => {
        const checkedInCat = checkedRows.filter((r) => r.category === cat.category);
        const open = openCat === cat.category;
        return (
          <div key={cat.category} className="rounded-md border border-gray-200">
            <button
              type="button"
              onClick={() => setOpenCat(open ? null : cat.category)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <span>
                {cat.category}
                <span className="ml-2 font-normal text-xs text-ink-3">{cat.prompt}</span>
              </span>
              <span className="text-xs text-vantage-700">
                {checkedInCat.length > 0 && `${checkedInCat.length} selected`} {open ? "▲" : "▼"}
              </span>
            </button>
            {open && (
              <div className="border-t border-gray-100 px-3 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {cat.words.map((word) => {
                    const key = seItemKey(cat.category, word);
                    const row = checkedByKey.get(key);
                    return (
                      <form action={formAction} key={key} className="inline">
                        <input type="hidden" name="mocId" value={mocId} />
                        <input type="hidden" name="category" value={cat.category} />
                        <input type="hidden" name="word" value={word} />
                        <input type="hidden" name="checked" value={row ? "0" : "1"} />
                        <button
                          type="submit"
                          disabled={!editable}
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            row
                              ? "border-vantage-500 bg-vantage-50 text-vantage-700 font-medium"
                              : "border-gray-200 text-ink-3"
                          } ${editable ? "hover:border-vantage-500" : "cursor-default"}`}
                        >
                          {row ? "✓ " : ""}
                          {word}
                        </button>
                      </form>
                    );
                  })}
                </div>
                {checkedInCat.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {checkedInCat.map((row) => (
                      <SeAssessmentRow
                        key={row.id}
                        mocId={mocId}
                        category={cat.category}
                        row={row}
                        editable={editable}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {checkedRows.length > 0 && (
        <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2">
          <p className="text-xs font-medium text-ink-2 mb-1">
            Part B summary — {checkedRows.length} check word{checkedRows.length === 1 ? "" : "s"} selected
          </p>
          <ul className="text-xs text-ink-3 space-y-0.5">
            {checkedRows.map((r) => (
              <li key={r.id}>
                <strong>{r.label}</strong> ({r.category}): {r.remarks || <em>no assessment written yet</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SeAssessmentRow({
  mocId,
  category,
  row,
  editable,
}: {
  mocId: string;
  category: string;
  row: ChecklistRow;
  editable: boolean;
}) {
  const [, formAction] = useActionState(toggleSeWordAction, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="mocId" value={mocId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="word" value={row.label} />
      <input type="hidden" name="checked" value="1" />
      <span className="text-xs font-medium w-44 shrink-0">{row.label}</span>
      <input
        name="assessment"
        defaultValue={row.remarks ?? ""}
        placeholder="Assessment…"
        disabled={!editable}
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
      />
      {editable && (
        <button type="submit" className="text-xs text-vantage-blue hover:underline">
          Save
        </button>
      )}
    </form>
  );
}

// ─── Level 2 Appendix B: Documentation Checklist ────────────────────────────

export function DocChecklist({
  rows,
  people,
  editable,
}: {
  rows: ChecklistRow[];
  people: PersonOption[];
  editable: boolean;
}) {
  const categories = [...new Set(rows.map((r) => r.category))];
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-3">
        TA / Production Manager assign owners and the phase each document is
        required for. Owners mark items complete; close-out requires all
        assigned items complete.
      </p>
      {categories.map((cat) => (
        <div key={cat ?? "other"}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-1">{cat}</h4>
          <table className="w-full text-sm">
            <tbody>
              {rows
                .filter((r) => r.category === cat)
                .map((r) => (
                  <DocRow key={r.id} row={r} people={people} editable={editable} />
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function DocRow({
  row,
  people,
  editable,
}: {
  row: ChecklistRow;
  people: PersonOption[];
  editable: boolean;
}) {
  const [, formAction] = useActionState(updateDocChecklistAction, {});
  const done = row.answer === "YES";
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1.5 pr-2 w-72">{row.label}</td>
      <td className="py-1.5 pr-2">
        <form action={formAction} className="flex items-center gap-2 flex-wrap">
          <input type="hidden" name="responseId" value={row.id} />
          <select
            name="ownerId"
            defaultValue={row.ownerId ?? ""}
            disabled={!editable}
            className="rounded border border-gray-200 px-1.5 py-1 text-xs bg-white"
          >
            <option value="">No owner</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="requiredPhase"
            defaultValue={row.requiredPhase ?? ""}
            disabled={!editable}
            className="rounded border border-gray-200 px-1.5 py-1 text-xs bg-white"
          >
            <option value="">Not required</option>
            {Object.entries(DOC_PHASE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="complete" value="1" defaultChecked={done} disabled={!editable} />
            Complete
          </label>
          {editable && (
            <button type="submit" className="text-xs text-vantage-blue hover:underline">
              Save
            </button>
          )}
          {done && row.completedByName && (
            <span className="text-[11px] text-vantage-700">✓ {row.completedByName}</span>
          )}
        </form>
      </td>
    </tr>
  );
}

// ─── MOOC transition plan ───────────────────────────────────────────────────

export function TransitionPlan({
  mocId,
  rows,
  editable,
}: {
  mocId: string;
  rows: ChecklistRow[];
  editable: boolean;
}) {
  const [addState, addAction] = useActionState(addTransitionItemAction, {});
  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-3 border-b border-gray-200">
            <th className="py-1.5">Transition plan element</th>
            <th className="py-1.5">Status / detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <TransitionRow key={r.id} row={r} editable={editable} />
          ))}
        </tbody>
      </table>
      {editable && (
        <form action={addAction} className="flex gap-2">
          {addState.error && <p className="text-xs text-red-700">{addState.error}</p>}
          <input type="hidden" name="mocId" value={mocId} />
          <input
            name="label"
            placeholder="Add another transition plan element…"
            className={inputCls + " flex-1"}
          />
          <button className="rounded-md border border-vantage-500 text-vantage-700 px-3 py-1.5 text-sm hover:bg-vantage-50">
            Add
          </button>
        </form>
      )}
    </div>
  );
}

function TransitionRow({ row, editable }: { row: ChecklistRow; editable: boolean }) {
  const [, formAction] = useActionState(answerChecklistAction, {});
  const done = row.answer === "YES";
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="py-2 pr-3 w-80">{row.label}</td>
      <td className="py-2">
        <form action={formAction} className="flex items-center gap-2 flex-wrap">
          <input type="hidden" name="responseId" value={row.id} />
          <input type="hidden" name="answer" value={done ? "" : "YES"} />
          <input
            name="remarks"
            defaultValue={row.remarks ?? ""}
            placeholder="Responsibility / transition detail"
            disabled={!editable}
            className="flex-1 min-w-48 rounded border border-gray-200 px-2 py-1 text-xs"
          />
          {editable && (
            <button
              type="submit"
              className={`rounded px-2 py-1 text-xs font-medium border ${
                done
                  ? "bg-vantage-50 border-vantage-500 text-vantage-700"
                  : "border-gray-300 text-ink-3 hover:border-vantage-500"
              }`}
            >
              {done ? "✓ Signed off — click to reopen" : "Mark complete"}
            </button>
          )}
          {!editable && done && <span className="text-xs text-vantage-700">✓ Complete</span>}
          {done && row.completedByName && (
            <span className="text-[11px] text-ink-3">by {row.completedByName}</span>
          )}
        </form>
      </td>
    </tr>
  );
}

export type { ActionResult };
