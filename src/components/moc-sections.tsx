"use client";

import { useActionState, useState } from "react";
import {
  submitMocAction,
  advanceStageAction,
  cancelMocAction,
  addActionItemAction,
  toggleActionItemAction,
  createAddendumAction,
  signAddendumAction,
  addExtensionReviewAction,
  addBypassLogAction,
  requestBypassExtensionAction,
  recordRestorationAction,
  reassignApprovalAction,
} from "@/app/actions";
import { Field, inputCls } from "./ui";
import type { PersonOption } from "./checklist-sections";

// ─── Submit for approval ────────────────────────────────────────────────────

export function SubmitPanel({
  mocId,
  type,
  people,
  leadId,
}: {
  mocId: string;
  type: string;
  people: PersonOption[];
  leadId: string;
}) {
  const [state, formAction, pending] = useActionState(submitMocAction, {});
  const needsRelevant = type === "LEVEL1" || type === "MOOC";
  const needsApproving = type === "BYPASS";
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="mocId" value={mocId} />
      {state.error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      {needsRelevant && (
        <Field
          label="Relevant Manager"
          hint="Cannot be the MOC Lead — they sign the review alongside Process Safety."
        >
          <select name="relevantManagerId" required className={inputCls}>
            <option value="">Select…</option>
            {people
              .filter((p) => p.id !== leadId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </Field>
      )}
      {needsApproving && (
        <Field label="Approving Manager">
          <select name="approvingManagerId" required className={inputCls}>
            <option value="">Select…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit for approval"}
      </button>
    </form>
  );
}

// ─── Advance / cancel ───────────────────────────────────────────────────────

export function AdvancePanel({
  mocId,
  nextTitle,
}: {
  mocId: string;
  nextTitle: string;
}) {
  const [state, formAction, pending] = useActionState(advanceStageAction, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="mocId" value={mocId} />
      {state.error && <p className="text-sm text-red-700 mb-2">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-vantage-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Working…" : `Ready: ${nextTitle} →`}
      </button>
    </form>
  );
}

export function CancelPanel({ mocId }: { mocId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(cancelMocAction, {});
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-ink-3 hover:text-vantage-orange"
      >
        Cancel this MOC…
      </button>
    );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="mocId" value={mocId} />
      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
      <input name="reason" placeholder="Reason for cancellation" className={inputCls + " w-64"} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-vantage-orange px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Confirm cancel
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-3">
        Keep open
      </button>
    </form>
  );
}

// ─── Reassign a pending signature ───────────────────────────────────────────

export function ReassignControl({
  approvalId,
  people,
}: {
  approvalId: string;
  people: PersonOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(reassignApprovalAction, {});
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink-3 hover:text-vantage-blue"
      >
        Reassign
      </button>
    );
  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="approvalId" value={approvalId} />
      {state.error && <span className="text-xs text-red-700">{state.error}</span>}
      <select name="assignedToId" className="rounded border border-gray-200 px-1.5 py-1 text-xs bg-white">
        <option value="">Select…</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="text-xs text-vantage-blue hover:underline">
        Save
      </button>
    </form>
  );
}

// ─── Action items (punch list) ──────────────────────────────────────────────

export interface ActionItemRow {
  id: string;
  description: string;
  category: string;
  status: string;
  dueDate: string | null;
  ownerName: string | null;
}

export function ActionItems({
  mocId,
  items,
  people,
  editable,
}: {
  mocId: string;
  items: ActionItemRow[];
  people: PersonOption[];
  editable: boolean;
}) {
  const [addState, addAction, addPending] = useActionState(addActionItemAction, {});
  const [, toggleAction] = useActionState(toggleActionItemAction, {});
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-ink-3">No action items yet.</p>}
      {items.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-3 border-b border-gray-200">
              <th className="py-1.5">Item</th>
              <th>Timing</th>
              <th>Owner</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-gray-100">
                <td className={`py-1.5 pr-2 ${i.status === "CLOSED" ? "line-through text-ink-3" : ""}`}>
                  {i.description}
                </td>
                <td className="pr-2 text-xs">{i.category}</td>
                <td className="pr-2 text-xs">{i.ownerName ?? "—"}</td>
                <td className="pr-2 text-xs whitespace-nowrap">{i.dueDate ?? "—"}</td>
                <td className="text-right">
                  {editable && (
                    <form action={toggleAction} className="inline">
                      <input type="hidden" name="actionItemId" value={i.id} />
                      <button className="text-xs text-vantage-blue hover:underline">
                        {i.status === "OPEN" ? "Close" : "Reopen"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editable && (
        <form action={addAction} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] items-center">
          {addState.error && (
            <p className="sm:col-span-5 text-xs text-red-700">{addState.error}</p>
          )}
          <input type="hidden" name="mocId" value={mocId} />
          <input name="description" placeholder="New action item…" className={inputCls} />
          <select name="category" className={inputCls + " w-44"} title="Action item timing">
            <option value="GENERAL">General</option>
            <option value="A">A — Part of design</option>
            <option value="B">B — Prior to commissioning</option>
            <option value="C">C — Prior to closure</option>
          </select>
          <select name="ownerId" className={inputCls + " w-40"}>
            <option value="">Owner…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input name="dueDate" type="date" className={inputCls + " w-36"} />
          <button
            disabled={addPending}
            className="rounded-md border border-vantage-500 text-vantage-700 px-3 py-2 text-sm hover:bg-vantage-50 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Addenda ────────────────────────────────────────────────────────────────

export interface AddendumRow {
  id: string;
  summary: string;
  technicalBasis: string;
  seAssessment: string | null;
  decision: string;
  signedName: string | null;
  comment: string | null;
  decidedAt: string | null;
  approverName: string | null;
  approverId: string | null;
  createdByName: string;
  createdAt: string;
}

export function AddendumSection({
  mocId,
  addenda,
  currentUserId,
  canAdd,
}: {
  mocId: string;
  addenda: AddendumRow[];
  currentUserId: string;
  canAdd: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAddendumAction, {});
  return (
    <div className="space-y-3">
      {addenda.length === 0 && (
        <p className="text-sm text-ink-3">
          No addenda. Use an addendum for a scoped change to this MOC after
          approval — it requires Technical Authority sign-off.
        </p>
      )}
      {addenda.map((a) => (
        <div key={a.id} className="rounded-md border border-gray-200 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{a.summary}</p>
            <span
              className={`text-xs font-medium rounded-full px-2 py-0.5 border ${
                a.decision === "APPROVED"
                  ? "bg-vantage-50 text-vantage-700 border-vantage-100"
                  : a.decision === "REJECTED"
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {a.decision === "PENDING" ? "Awaiting TA" : a.decision === "APPROVED" ? "Approved" : "Not approved"}
            </span>
          </div>
          <p className="text-xs text-ink-3 mt-1">
            Technical basis: {a.technicalBasis}
          </p>
          {a.seAssessment && (
            <p className="text-xs text-ink-3 mt-1">S&amp;E assessment: {a.seAssessment}</p>
          )}
          <p className="text-xs text-ink-3 mt-1">
            Raised by {a.createdByName} on {a.createdAt}
            {a.decision !== "PENDING" &&
              ` · ${a.decision === "APPROVED" ? "approved" : "declined"} by ${a.signedName} (${a.approverName}) on ${a.decidedAt}`}
            {a.comment && ` — "${a.comment}"`}
          </p>
          {a.decision === "PENDING" && a.approverId === currentUserId && (
            <AddendumSignForm addendumId={a.id} />
          )}
        </div>
      ))}
      {canAdd &&
        (open ? (
          <form action={formAction} className="space-y-2 rounded-md border border-gray-200 p-3">
            {state.error && <p className="text-xs text-red-700">{state.error}</p>}
            <input type="hidden" name="mocId" value={mocId} />
            <Field label="Brief summary of addendum">
              <textarea name="summary" rows={2} required className={inputCls} />
            </Field>
            <Field label="Technical basis for change">
              <textarea name="technicalBasis" rows={2} required className={inputCls} />
            </Field>
            <Field label="Safety & environmental assessment">
              <textarea name="seAssessment" rows={2} className={inputCls} />
            </Field>
            <div className="flex gap-2">
              <button
                disabled={pending}
                className="rounded-md bg-vantage-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Submit addendum
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-3">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="rounded-md border border-vantage-500 text-vantage-700 px-3 py-1.5 text-sm hover:bg-vantage-50"
          >
            + Add addendum
          </button>
        ))}
    </div>
  );
}

function AddendumSignForm({ addendumId }: { addendumId: string }) {
  const [state, formAction, pending] = useActionState(signAddendumAction, {});
  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-vantage-50 p-2">
      {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
      <input type="hidden" name="addendumId" value={addendumId} />
      <label className="text-xs">
        Full name (signature)
        <input name="signedName" required className="block rounded border border-gray-300 px-2 py-1 text-xs mt-0.5" />
      </label>
      <label className="text-xs">
        Password
        <input name="password" type="password" required className="block rounded border border-gray-300 px-2 py-1 text-xs mt-0.5" />
      </label>
      <label className="text-xs flex-1 min-w-32">
        Comment
        <input name="comment" className="block w-full rounded border border-gray-300 px-2 py-1 text-xs mt-0.5" />
      </label>
      <button
        name="decision"
        value="APPROVED"
        disabled={pending}
        className="rounded bg-vantage-500 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Approve
      </button>
      <button
        name="decision"
        value="REJECTED"
        disabled={pending}
        className="rounded bg-vantage-orange px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Not approved
      </button>
    </form>
  );
}

// ─── Temporary change extension reviews ─────────────────────────────────────

export interface ExtensionRow {
  number: number;
  signedName: string;
  assumptionsValid: boolean;
  extensionDate: string;
  comment: string | null;
  createdAt: string;
}

export function ExtensionSection({
  mocId,
  extensions,
  editable,
}: {
  mocId: string;
  extensions: ExtensionRow[];
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addExtensionReviewAction, {});
  return (
    <div className="space-y-2">
      {extensions.length === 0 && (
        <p className="text-sm text-ink-3">
          No extension reviews. If the plant/system is not restored by the end
          date, review the temporary modification and record an extension (max 3).
        </p>
      )}
      {extensions.map((e) => (
        <p key={e.number} className="text-sm">
          <strong>Review #{e.number}</strong> — extended to {e.extensionDate}; initial
          assumptions &amp; design {e.assumptionsValid ? "still valid" : "NOT valid"}; signed{" "}
          {e.signedName} on {e.createdAt}
          {e.comment && ` — "${e.comment}"`}
        </p>
      ))}
      {editable && extensions.length < 3 && (
        open ? (
          <form action={formAction} className="space-y-2 rounded-md border border-gray-200 p-3">
            {state.error && <p className="text-xs text-red-700">{state.error}</p>}
            <input type="hidden" name="mocId" value={mocId} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="New end / extension date">
                <input name="extensionDate" type="date" required className={inputCls} />
              </Field>
              <Field label="Initial assumptions & design still valid?">
                <select name="assumptionsValid" className={inputCls}>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </Field>
              <Field label="Full name (signature)">
                <input name="signedName" required className={inputCls} />
              </Field>
              <Field label="Password">
                <input name="password" type="password" required className={inputCls} />
              </Field>
            </div>
            <Field label="Comment">
              <input name="comment" className={inputCls} />
            </Field>
            <div className="flex gap-2">
              <button
                disabled={pending}
                className="rounded-md bg-vantage-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Record extension review
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-3">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="rounded-md border border-vantage-500 text-vantage-700 px-3 py-1.5 text-sm hover:bg-vantage-50"
          >
            + Record extension review
          </button>
        )
      )}
      {extensions.length >= 3 && (
        <p className="text-xs text-vantage-orange font-medium">
          Extension limit reached (3). Restore the plant/system or raise a new
          MOC to make the change permanent.
        </p>
      )}
    </div>
  );
}

// ─── Safety system bypass extras ────────────────────────────────────────────

export interface BypassLogRow {
  id: string;
  date: string;
  shift: string;
  initials: string;
  userName: string;
}

export function BypassPanel({
  mocId,
  isLead,
  active,
  logs,
  extensionPending,
  extensionApproved,
  restoredAt,
}: {
  mocId: string;
  isLead: boolean;
  active: boolean;
  logs: BypassLogRow[];
  extensionPending: boolean;
  extensionApproved: boolean;
  restoredAt: string | null;
}) {
  const [logState, logAction, logPending] = useActionState(addBypassLogAction, {});
  const [extState, extAction, extPending] = useActionState(requestBypassExtensionAction, {});
  const [restState, restAction, restPending] = useActionState(recordRestorationAction, {});
  const [showExt, setShowExt] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-1">Shift log (Day / Night initials)</h4>
        {logs.length === 0 && (
          <p className="text-sm text-ink-3">No entries yet. Each shift initials while the bypass is active.</p>
        )}
        {logs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3 border-b border-gray-200">
                <th className="py-1">Date</th>
                <th>Shift</th>
                <th>Initials</th>
                <th>Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-100">
                  <td className="py-1">{l.date}</td>
                  <td>{l.shift === "DAY" ? "Day" : "Night"}</td>
                  <td>{l.initials}</td>
                  <td className="text-xs text-ink-3">{l.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {active && (
          <form action={logAction} className="mt-2 flex flex-wrap items-center gap-2">
            {logState.error && <p className="w-full text-xs text-red-700">{logState.error}</p>}
            <input type="hidden" name="mocId" value={mocId} />
            <input name="date" type="date" className={inputCls + " w-36"} />
            <select name="shift" className={inputCls + " w-24"}>
              <option value="DAY">Day</option>
              <option value="NIGHT">Night</option>
            </select>
            <input name="initials" placeholder="Initials" className={inputCls + " w-24"} />
            <button
              disabled={logPending}
              className="rounded-md border border-vantage-500 text-vantage-700 px-3 py-1.5 text-sm hover:bg-vantage-50 disabled:opacity-50"
            >
              Log shift
            </button>
          </form>
        )}
      </div>

      {active && isLead && (
        <div className="rounded-md border border-vantage-yellow bg-amber-50/50 p-3">
          <h4 className="text-sm font-semibold">Extension over 72 hours</h4>
          {extensionApproved && (
            <p className="text-sm text-vantage-700 mt-1">✓ Extension approved by PM, TA, and EHSS Manager.</p>
          )}
          {extensionPending && (
            <p className="text-sm text-amber-800 mt-1">Extension approvals pending — see signatures below.</p>
          )}
          {!extensionPending && !extensionApproved && (
            showExt ? (
              <form action={extAction} className="mt-2 flex flex-wrap items-end gap-2">
                {extState.error && <p className="w-full text-xs text-red-700">{extState.error}</p>}
                <input type="hidden" name="mocId" value={mocId} />
                <label className="text-xs">
                  Bypass expiration date
                  <input name="expiration" type="date" required className="block rounded border border-gray-300 px-2 py-1.5 text-sm mt-0.5" />
                </label>
                <button
                  disabled={extPending}
                  className="rounded-md bg-vantage-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Request extension approvals
                </button>
                <button type="button" onClick={() => setShowExt(false)} className="text-sm text-ink-3">
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowExt(true)}
                className="mt-2 rounded-md border border-vantage-500 text-vantage-700 px-3 py-1.5 text-sm hover:bg-vantage-50"
              >
                Request &gt;72 h extension (requires PM, TA, EHSS)
              </button>
            )
          )}
        </div>
      )}

      {active && isLead && (
        <div className="rounded-md border border-gray-200 p-3">
          <h4 className="text-sm font-semibold">Return to service</h4>
          {restoredAt ? (
            <p className="text-sm text-vantage-700 mt-1">
              Restoration recorded: {restoredAt}. Sign the “Return to Service” signature below to close.
            </p>
          ) : (
            <form action={restAction} className="mt-2 flex flex-wrap items-end gap-2">
              {restState.error && <p className="w-full text-xs text-red-700">{restState.error}</p>}
              <input type="hidden" name="mocId" value={mocId} />
              <label className="text-xs">
                Date and time restored
                <input name="restoredAt" type="datetime-local" required className="block rounded border border-gray-300 px-2 py-1.5 text-sm mt-0.5" />
              </label>
              <button
                disabled={restPending}
                className="rounded-md bg-vantage-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Record restoration time
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
