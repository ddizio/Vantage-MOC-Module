import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { CreateSiteForm } from "@/components/admin-forms";
import { SITE_ROLES, SITE_ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminSitesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const sites = await prisma.site.findMany({
    include: {
      memberships: { include: { user: true } },
      _count: { select: { mocs: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Administration</h1>
        <nav className="text-sm">
          <Link href="/admin/users" className="text-vantage-blue hover:underline">
            Users
          </Link>
          <span className="mx-2 text-gray-300">|</span>
          <span className="font-medium text-vantage-700">Sites</span>
        </nav>
      </div>

      <Card title="Add a site">
        <CreateSiteForm />
      </Card>

      {sites.map((site) => {
        return (
          <Card
            key={site.id}
            title={`${site.code} — ${site.name}`}
            subtitle={`${site.memberships.length} members · ${site._count.mocs} MOCs`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-3 border-b border-gray-200">
                  <th className="py-1.5">Functional role</th>
                  <th className="py-1.5">Held by</th>
                </tr>
              </thead>
              <tbody>
                {SITE_ROLES.map((role) => {
                  const holders = site.memberships.filter((m) =>
                    m.roles.split(",").includes(role)
                  );
                  return (
                    <tr key={role} className="border-b border-gray-100">
                      <td className="py-1.5">{SITE_ROLE_LABELS[role]}</td>
                      <td className={`py-1.5 ${holders.length === 0 ? "text-vantage-orange" : ""}`}>
                        {holders.length === 0
                          ? "⚠ Unassigned — approvals for this role cannot be routed"
                          : holders.map((h) => h.user.name).join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-ink-3 mt-2">
              Assign roles from the{" "}
              <Link href="/admin/users" className="text-vantage-blue hover:underline">
                Users
              </Link>{" "}
              page.
            </p>
          </Card>
        );
      })}
    </div>
  );
}
