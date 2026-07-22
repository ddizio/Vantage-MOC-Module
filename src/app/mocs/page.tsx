import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge, LevelBadge } from "@/components/status-badge";
import {
  MOC_STATUSES,
  MOC_TYPES,
  MOC_TYPE_LABELS,
  STATUS_LABELS,
  type MocStatus,
  type MocType,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MocRegister({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; status?: string; type?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const sites = user.isAdmin
    ? await prisma.site.findMany({ orderBy: { code: "asc" } })
    : user.memberships.map((m) => m.site);

  const where: Record<string, unknown> = user.isAdmin
    ? {}
    : { siteId: { in: sites.map((s) => s.id) } };
  if (params.site) where.siteId = params.site;
  if (params.status && MOC_STATUSES.includes(params.status as MocStatus))
    where.status = params.status;
  if (params.type && MOC_TYPES.includes(params.type as MocType))
    where.type = params.type;
  if (params.q)
    where.OR = [
      { number: { contains: params.q } },
      { title: { contains: params.q } },
    ];

  const mocs = await prisma.moc.findMany({
    where,
    include: { site: true, lead: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const sel = "rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">MOC Register</h1>
        <Link
          href="/mocs/new"
          className="rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600"
        >
          + New MOC
        </Link>
      </div>

      <form className="no-print flex flex-wrap gap-2 items-center" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search number or title…"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-56"
        />
        <select name="site" defaultValue={params.site ?? ""} className={sel}>
          <option value="">All sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={params.type ?? ""} className={sel}>
          <option value="">All types</option>
          {MOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {MOC_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className={sel}>
          <option value="">All statuses</option>
          {MOC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-ink-3">
            <tr>
              <th className="px-4 py-2.5">Number</th>
              <th className="px-2 py-2.5">Title</th>
              <th className="px-2 py-2.5">Type</th>
              <th className="px-2 py-2.5">Level</th>
              <th className="px-2 py-2.5">Site</th>
              <th className="px-2 py-2.5">Lead</th>
              <th className="px-2 py-2.5">Perm/Temp</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mocs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-3">
                  No records match.
                </td>
              </tr>
            )}
            {mocs.map((m) => (
              <tr key={m.id} className="hover:bg-vantage-50/40">
                <td className="px-4 py-2 whitespace-nowrap">
                  <Link href={`/mocs/${m.id}`} className="font-medium text-vantage-blue hover:underline">
                    {m.number}
                  </Link>
                </td>
                <td className="px-2 py-2 max-w-72 truncate">{m.title}</td>
                <td className="px-2 py-2 whitespace-nowrap text-xs">
                  {MOC_TYPE_LABELS[m.type as MocType]}
                </td>
                <td className="px-2 py-2">
                  <LevelBadge level={m.level} />
                </td>
                <td className="px-2 py-2">{m.site.code}</td>
                <td className="px-2 py-2 whitespace-nowrap">{m.lead.name}</td>
                <td className="px-2 py-2 text-xs">
                  {m.changeType === "TEMPORARY" ? (
                    <span className="text-vantage-orange font-medium">
                      Temp{m.endDate ? ` → ${m.endDate.toISOString().slice(0, 10)}` : ""}
                    </span>
                  ) : (
                    "Permanent"
                  )}
                </td>
                <td className="px-2 py-2">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-ink-3">
                  {m.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
