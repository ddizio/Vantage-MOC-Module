"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions";
import { Field, inputCls } from "./ui";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});
  return (
    <form action={formAction} className="space-y-3 max-w-sm">
      {state.error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md bg-vantage-50 border border-vantage-100 text-vantage-700 text-sm px-3 py-2">
          Password updated.
        </p>
      )}
      <Field label="Current password">
        <input name="current" type="password" required className={inputCls} />
      </Field>
      <Field label="New password (min 10 characters)">
        <input name="next" type="password" required minLength={10} className={inputCls} />
      </Field>
      <button
        disabled={pending}
        className="rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
