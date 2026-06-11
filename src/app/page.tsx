import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge, LevelBadge } from "@/components/status-badge";
import { Card } from "@/components/ui";
import { MOC_TYPE_LABELS, type MocType } from "@/lib/constants";

export const dynamic = "force-dynamic";

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const siteIds = user.memberships.map((m) => m.siteId);
  const siteFilter = user.isAdmin ? {} : { siteId: { in: siteIds } };

  const [myApprovals, myMocs, openMocs, overdueTemp, activeBypasses, myActions] =
    await Promise.all([
      prisma.approval.findMany({
        where: { assignedToId: user.id, decision: "PENDING", moc: { status: { notIn: ["DRAFT", "CANCELED"] } } },
        include: { moc: { include: { site: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.moc.findMany({
        where: { leadId: user.id, status: { notIn: ["CLOSED", "CANCELED"] } },
        include: { site: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.moc.count({
        where: { ...siteFilter, status: { notIn: ["CLOSED", "CANCELED", "DRAFT"] } },
      }),
      prisma.moc.findMany({
        where: {
          ...siteFilter,
          changeType: "TEMPORARY",
          status: { notIn: ["CLOSED", "CANCELED", "DRAFT", "REJECTED"] },
          endDate: { lt: new Date() },
        },
        include: { site: true },
      }),
      prisma.moc.findMany({
        where: { ...siteFilter, type: "BYPASS", status: "ACTIVE" },
        include: { site: true },
      }),
      prisma.actionItem.findMany({
        where: { ownerId: user.id, status: "OPEN" },
        include: { moc: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-3">
            Welcome back, {user.name.split(" ")[0]}. {openMocs} change
            {openMocs === 1 ? " is" : "s are"} in flight at your site
            {user.memberships.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/mocs/new"
          className="no-print rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600"
        >
          + Start a Change
        </Link>
      </div>

      {(overdueTemp.length > 0 || activeBypasses.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overdueTemp.length > 0 && (
            <Card title="⚠ Overdue temporary changes" className="border-vantage-orange">
              <ul className="divide-y divide-gray-100 text-sm">
                {overdueTemp.map((m) => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-2">
                    <Link href={`/mocs/${m.id}`} className="text-vantage-blue hover:underline">
                      {m.number} — {m.title}
                    </Link>
                    <span className="text-vantage-orange font-medium whitespace-nowrap">
                      due {fmt(m.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-3">
                Restore the plant/system or record an extension review.
              </p>
            </Card>
          )}
          {activeBypasses.length > 0 && (
            <Card title="🛡 Active safety system bypasses" className="border-vantage-yellow">
              <ul className="divide-y divide-gray-100 text-sm">
                {activeBypasses.map((m) => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-2">
                    <Link href={`/mocs/${m.id}`} className="text-vantage-blue hover:underline">
                      {m.number} — {m.title}
                    </Link>
                    <span className="text-ink-3 whitespace-nowrap">
                      expires {fmt(m.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-3">
                Bypasses over 72 hours require PM, TA, and EHSS Manager approval.
              </p>
            </Card>
          )}
        </div>
      )}

      <Card
        title="Waiting for my signature"
        subtitle="Approvals assigned to you, ready to review"
      >
        {myApprovals.length === 0 ? (
          <p className="text-sm text-ink-3">Nothing waiting on you. 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3 border-b border-gray-100">
                <th className="py-2">MOC</th>
                <th>Title</th>
                <th>Site</th>
                <th>Signing as</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myApprovals.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-medium whitespace-nowrap">{a.moc.number}</td>
                  <td>{a.moc.title}</td>
                  <td>{a.moc.site.code}</td>
                  <td>{a.roleLabel}</td>
                  <td className="text-right">
                    <Link
                      href={`/mocs/${a.mocId}`}
                      className="text-vantage-blue hover:underline font-medium"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="My changes" subtitle="MOCs where you are the lead">
          {myMocs.length === 0 ? (
            <p className="text-sm text-ink-3">
              You have no open changes.{" "}
              <Link href="/mocs/new" className="text-vantage-blue hover:underline">
                Start one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {myMocs.map((m) => (
                <li key={m.id} className="py-2 flex items-center gap-2">
                  <Link href={`/mocs/${m.id}`} className="text-vantage-blue hover:underline font-medium whitespace-nowrap">
                    {m.number}
                  </Link>
                  <span className="truncate flex-1">{m.title}</span>
                  <LevelBadge level={m.level} />
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="My open action items" subtitle="Punch list items assigned to you">
          {myActions.length === 0 ? (
            <p className="text-sm text-ink-3">No open action items.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {myActions.map((a) => (
                <li key={a.id} className="py-2">
                  <Link href={`/mocs/${a.mocId}`} className="text-vantage-blue hover:underline">
                    {a.moc.number}
                  </Link>{" "}
                  — {a.description}
                  {a.dueDate && (
                    <span
                      className={`ml-2 text-xs ${a.dueDate < new Date() ? "text-vantage-orange font-medium" : "text-ink-3"}`}
                    >
                      due {fmt(a.dueDate)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs text-ink-3">
        Need an MOC? Any change that is <em>not replacement-in-kind</em> needs
        one. Unsure which form? See{" "}
        <Link href="/help" className="text-vantage-blue hover:underline">
          Help — choosing a form &amp; level
        </Link>
        . Form types: {(["LEVEL1", "LEVEL2", "MOOC", "BYPASS"] as MocType[])
          .map((t) => MOC_TYPE_LABELS[t])
          .join(" · ")}
      </p>
    </div>
  );
}
