"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  createUserAction,
  updateUserAction,
  setMembershipAction,
  createSiteAction,
} from "@/app/actions";
import { Field, inputCls } from "./ui";
import { SITE_ROLES, SITE_ROLE_LABELS, type SiteRole } from "@/lib/constants";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, {});
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {state.error && (
        <p className="sm:col-span-2 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="sm:col-span-2 rounded-md bg-vantage-50 border border-vantage-100 text-vantage-700 text-sm px-3 py-2">
          User created. Assign them to a site below.
        </p>
      )}
      <Field label="Full name">
        <input name="name" required className={inputCls} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" required className={inputCls} />
      </Field>
      <Field label="Initial password (min 10 chars)">
        <input name="password" type="password" required minLength={10} className={inputCls} />
      </Field>
      <label className="flex items-center gap-2 text-sm mt-6">
        <input type="checkbox" name="isAdmin" value="1" /> Administrator
      </label>
      <div className="sm:col-span-2">
        <button
          disabled={pending}
          className="rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  active: boolean;
  memberships: { siteId: string; roles: string[] }[];
}

export interface AdminSiteRow {
  id: string;
  code: string;
  name: string;
}

export function UserAdminRow({
  user,
  sites,
}: {
  user: AdminUserRow;
  sites: AdminSiteRow[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateUserAction, {});
  return (
    <div className="border-b border-gray-100 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{user.name}</span>
        <span className="text-ink-3">{user.email}</span>
        {user.isAdmin && (
          <span className="rounded-full bg-vantage-blue/10 text-vantage-blue text-xs px-2 py-0.5">admin</span>
        )}
        {!user.active && (
          <span className="rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5">deactivated</span>
        )}
        <span className="text-xs text-ink-3 ml-auto">
          {user.memberships.length} site{user.memberships.length === 1 ? "" : "s"}
        </span>
        <button onClick={() => setOpen(!open)} className="text-xs text-vantage-blue hover:underline">
          {open ? "Close" : "Manage"}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-4 rounded-md bg-gray-50 p-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3 text-sm">
            {state.error && <p className="w-full text-xs text-red-700">{state.error}</p>}
            <input type="hidden" name="userId" value={user.id} />
            <label className="text-xs">
              Name
              <input name="name" defaultValue={user.name} className="block rounded border border-gray-300 px-2 py-1.5 text-sm mt-0.5" />
            </label>
            <label className="text-xs">
              Reset password (blank = keep)
              <input name="password" type="password" className="block rounded border border-gray-300 px-2 py-1.5 text-sm mt-0.5" />
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" name="active" value="1" defaultChecked={user.active} /> Active
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" name="isAdmin" value="1" defaultChecked={user.isAdmin} /> Administrator
            </label>
            <button
              disabled={pending}
              className="rounded-md bg-vantage-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>
          </form>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-2">Site membership &amp; functional roles</p>
            {sites.map((site) => (
              <MembershipForm
                key={site.id}
                userId={user.id}
                site={site}
                membership={user.memberships.find((m) => m.siteId === site.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MembershipForm({
  userId,
  site,
  membership,
}: {
  userId: string;
  site: AdminSiteRow;
  membership?: { roles: string[] };
}) {
  const [state, formAction, pending] = useActionState(setMembershipAction, {});
  const [isMember, setIsMember] = useState(!!membership);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs rounded border border-gray-200 bg-white px-2 py-1.5">
      {state.error && <p className="w-full text-red-700">{state.error}</p>}
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="siteId" value={site.id} />
      <label className="flex items-center gap-1.5 font-medium w-36">
        <input
          type="checkbox"
          name="member"
          value="1"
          checked={isMember}
          onChange={(e) => setIsMember(e.target.checked)}
        />
        {site.code} — {site.name}
      </label>
      {isMember &&
        SITE_ROLES.map((r) => (
          <label key={r} className="flex items-center gap-1 text-ink-3">
            <input
              type="checkbox"
              name={`role_${r}`}
              value="1"
              defaultChecked={membership?.roles.includes(r)}
            />
            {SITE_ROLE_LABELS[r as SiteRole]}
          </label>
        ))}
      <button disabled={pending} className="ml-auto text-vantage-blue hover:underline">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function CreateSiteForm() {
  const [state, formAction, pending] = useActionState(createSiteAction, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state.error && (
        <p className="w-full rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <Field label="Site code (used in MOC numbers)" hint="e.g. GUR">
        <input name="code" required maxLength={6} className={inputCls + " w-28 uppercase"} />
      </Field>
      <Field label="Site name">
        <input name="name" required className={inputCls + " w-64"} />
      </Field>
      <button
        disabled={pending}
        className="rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Add site"}
      </button>
    </form>
  );
}
