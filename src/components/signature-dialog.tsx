"use client";

import { useState } from "react";
import { useActionState } from "react";
import { signApprovalAction, type ActionResult } from "@/app/actions";
import { inputCls } from "./ui";

/**
 * Electronic signature dialog. Mirrors the wet-signature blocks on the paper
 * forms: the signer types their full name and re-enters their password, and
 * the decision is recorded with a timestamp in the audit trail.
 */
export function SignatureDialog({
  approvalId,
  roleLabel,
  stageTitle,
}: {
  approvalId: string;
  roleLabel: string;
  stageTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult, form: FormData) => {
      const result = await signApprovalAction(prev, form);
      if (result.ok) setOpen(false);
      return result;
    },
    {}
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-vantage-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-vantage-600"
      >
        Review &amp; Sign
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold">Electronic Signature</h3>
              <p className="text-xs text-ink-3 mt-1">
                {stageTitle} — signing as <strong>{roleLabel}</strong>
              </p>
            </div>
            <form action={formAction} className="px-5 py-4 space-y-3">
              <input type="hidden" name="approvalId" value={approvalId} />
              <input type="hidden" name="decision" value={decision} />
              {state.error && (
                <p className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
                  {state.error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDecision("APPROVED")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    decision === "APPROVED"
                      ? "border-vantage-500 bg-vantage-50 text-vantage-700"
                      : "border-gray-300 text-ink-3"
                  }`}
                >
                  Approved to Proceed
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("REJECTED")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    decision === "REJECTED"
                      ? "border-vantage-orange bg-orange-50 text-vantage-orange"
                      : "border-gray-300 text-ink-3"
                  }`}
                >
                  Not Approved
                </button>
              </div>
              <label className="block text-sm">
                <span className="font-medium text-ink-2">
                  Type your full name (signature)
                </span>
                <input name="signedName" required className={inputCls + " mt-1"} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-2">
                  Re-enter your password to sign
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputCls + " mt-1"}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-2">
                  Comment {decision === "REJECTED" && "(required)"}
                </span>
                <textarea name="comment" rows={2} className={inputCls + " mt-1"} />
              </label>
              <p className="text-xs text-ink-3">
                By signing you certify this electronic signature is the legal
                equivalent of your handwritten signature on this record.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    decision === "APPROVED"
                      ? "bg-vantage-500 hover:bg-vantage-600"
                      : "bg-vantage-orange hover:opacity-90"
                  }`}
                >
                  {pending ? "Recording…" : "Sign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
