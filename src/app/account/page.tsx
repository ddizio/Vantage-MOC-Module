import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { ChangePasswordForm } from "@/components/change-password-form";
import { SITE_ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">My Account</h1>
      <Card title="Profile">
        <p className="text-sm">
          <strong>{user.name}</strong> · {user.email}
          {user.isAdmin && " · Administrator"}
        </p>
        <div className="mt-2 text-sm text-ink-3">
          {user.memberships.length === 0 ? (
            <p>Not assigned to any site yet.</p>
          ) : (
            user.memberships.map((m) => (
              <p key={m.siteId}>
                {m.site.name} ({m.site.code})
                {m.roles.length > 0 &&
                  ` — ${m.roles.map((r) => SITE_ROLE_LABELS[r]).join(", ")}`}
              </p>
            ))
          )}
        </div>
      </Card>
      <Card
        title="Change password"
        subtitle="Your password doubles as your electronic signature credential — keep it private."
      >
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
