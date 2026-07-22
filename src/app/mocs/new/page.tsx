import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewMocForm } from "@/components/new-moc-form";

export const dynamic = "force-dynamic";

export default async function NewMocPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sites = user.isAdmin
    ? await prisma.site.findMany({ where: { active: true }, orderBy: { code: "asc" } })
    : user.memberships.map((m) => m.site);

  if (sites.length === 0) {
    return (
      <p className="text-sm text-ink-3">
        You are not a member of any site yet. Ask your administrator to add you
        to a site before starting a change.
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Start a Change</h1>
      <p className="text-sm text-ink-3 mb-6">
        A change that is <em>not replacement-in-kind</em> requires an MOC.
        Complete the hazard assessment to determine the level, then fill in the
        scope. The record stays in draft until you submit it for approval.
      </p>
      <NewMocForm sites={sites.map((s) => ({ id: s.id, code: s.code, name: s.name }))} />
    </div>
  );
}
