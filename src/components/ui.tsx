"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/app/actions";

type ServerAction = (
  prev: ActionResult,
  form: FormData
) => Promise<ActionResult>;

/**
 * Form wrapper around useActionState: renders children, an error banner,
 * and disables the submit button while pending.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  className,
  confirm,
  submitClassName,
}: {
  action: ServerAction;
  children?: React.ReactNode;
  submitLabel: string;
  className?: string;
  confirm?: string;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {state.error && (
        <p className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      {children}
      <button
        type="submit"
        disabled={pending}
        className={
          submitClassName ??
          "mt-3 rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600 disabled:opacity-50"
        }
      >
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink-2">{label}</span>
      {hint && <span className="block text-xs text-ink-3 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vantage-500 bg-white";

export function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className ?? ""}`}
    >
      {title && (
        <div className="px-5 pt-4 pb-2 border-b border-gray-100">
          <h2 className="font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-3 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
