import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { CreateUserForm, UserAdminRow } from "@/components/admin-forms";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const [users, sites] = await Promise.all([
    prisma.user.findMany({
      include: { memberships: true },
      orderBy: { name: "asc" },
    }),
    prisma.site.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Administration</h1>
        <nav className="text-sm">
          <span className="font-medium text-vantage-700">Users</span>
          <span className="mx-2 text-gray-300">|</span>
          <Link href="/admin/sites" className="text-vantage-blue hover:underline">
            Sites
          </Link>
        </nav>
      </div>

      <Card
        title="Add a user"
        subtitle="Users sign in with email + password. Their password is also their e-signature credential."
      >
        <CreateUserForm />
      </Card>

      <Card
        title={`Users (${users.length})`}
        subtitle="Assign each user to their site(s) and tick the functional roles they hold — approvals route to role holders automatically."
      >
        {users.map((u) => (
          <UserAdminRow
            key={u.id}
            user={{
              id: u.id,
              name: u.name,
              email: u.email,
              isAdmin: u.isAdmin,
              active: u.active,
              memberships: u.memberships.map((m) => ({
                siteId: m.siteId,
                roles: m.roles.split(",").filter(Boolean),
              })),
            }}
            sites={sites.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
          />
        ))}
      </Card>
    </div>
  );
}
