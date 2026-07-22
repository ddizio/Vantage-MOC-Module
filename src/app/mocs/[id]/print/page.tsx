import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isMemberOfSite } from "@/lib/auth";
import { parseFormData } from "@/lib/forms";
import {
  MOC_TYPE_LABELS,
  PHA_LABELS,
  STATUS_LABELS,
  type MocStatus,
  type MocType,
  type PhaType,
} from "@/lib/constants";
import { getStage, BYPASS_EXTENSION_STAGE } from "@/lib/workflow";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}
function fmtDateTime(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—";
}

export default async function PrintMocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const moc = await prisma.moc.findUnique({
    where: { id },
    include: {
      site: true,
      lead: true,
      approvals: { include: { assignedTo: true }, orderBy: { id: "asc" } },
      checklists: { include: { completedBy: true, owner: true }, orderBy: { id: "asc" } },
      actionItems: { include: { owner: true } },
      addenda: { include: { approver: true, createdBy: true } },
      extensions: { orderBy: { number: "asc" } },
      bypassLogs: { include: { user: true }, orderBy: { date: "asc" } },
      auditEntries: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!moc || !isMemberOfSite(user, moc.siteId)) notFound();
  const fd = parseFormData(moc.formData);
  const type = moc.type as MocType;

  const sectionCls = "border border-gray-400 mt-4";
  const headCls = "bg-gray-100 px-3 py-1.5 font-semibold text-sm border-b border-gray-400";
  const bodyCls = "px-3 py-2 text-sm";

  const checklistGroups = [
    { kind: "FUNCTIONAL_REVIEW", title: "Appendix A — Functional Review Checklist" },
    { kind: "SE_ASSESSMENT", title: "Appendix A — Safety & Environmental Assessment (ticked items)" },
    { kind: "DOC_CHECKLIST", title: "Appendix B — Documentation Checklist" },
    { kind: "TRANSITION_PLAN", title: "Appendix A — Transition Plan" },
    { kind: "CLOSEOUT", title: "Close-Out Checklist" },
  ];

  return (
    <div className="max-w-3xl mx-auto bg-white text-ink">
      <div className="no-print mb-4 text-sm text-ink-3">
        Use your browser&apos;s Print function (Ctrl/Cmd+P) to print or save as PDF.
      </div>
      <div className="flex items-center justify-between border-b-2 border-vantage-500 pb-3">
        <Image src="/vantage-logo.png" alt="Vantage" width={140} height={39} />
        <div className="text-right">
          <h1 className="text-lg font-bold">{MOC_TYPE_LABELS[type]}</h1>
          <p className="text-sm">
            MOC Number: <strong>{moc.number}</strong>
          </p>
        </div>
      </div>

      <div className={sectionCls}>
        <div className={headCls}>Part 1A — Scope</div>
        <div className={bodyCls}>
          <p><strong>Title:</strong> {moc.title}</p>
          <p><strong>Site:</strong> {moc.site.name} ({moc.site.code})</p>
          <p><strong>MOC Lead:</strong> {moc.lead.name}</p>
          <p>
            <strong>Status:</strong> {STATUS_LABELS[moc.status as MocStatus] ?? moc.status}
            {moc.level && <> · <strong>Level:</strong> {moc.level} ({moc.degreeOfHazard} hazard × {moc.significance} significance)</>}
          </p>
          <p>
            <strong>{moc.changeType === "TEMPORARY" ? "Temporary" : "Permanent"}</strong>
            {" · "}Start: {fmtDate(moc.startDate)} · End: {fmtDate(moc.endDate)}
          </p>
          {(type === "LEVEL1" || type === "LEVEL2") && (
            <>
              {fd.asset && <p><strong>Asset:</strong> {fd.asset}</p>}
              {fd.plantArea && <p><strong>Plant area:</strong> {fd.plantArea}</p>}
              <p className="mt-2"><strong>Brief summary:</strong></p>
              <p className="whitespace-pre-wrap">{fd.summary}</p>
              <p className="mt-2"><strong>Technical basis for change:</strong></p>
              <p className="whitespace-pre-wrap">{fd.technicalBasis}</p>
              {type === "LEVEL1" && fd.psiToUpdate && (
                <>
                  <p className="mt-2"><strong>Process Safety Information to update:</strong></p>
                  <p className="whitespace-pre-wrap">{fd.psiToUpdate}</p>
                </>
              )}
              {type === "LEVEL1" && fd.safetyEnvImpact && (
                <>
                  <p className="mt-2"><strong>Part 1B — Impact on safety and environment:</strong></p>
                  <p className="whitespace-pre-wrap">{fd.safetyEnvImpact}</p>
                </>
              )}
              {type === "LEVEL2" && (
                <p className="mt-2">
                  <strong>Part 1C — Process Hazard Review:</strong>{" "}
                  {fd.phaType ? PHA_LABELS[fd.phaType as PhaType] ?? fd.phaType : "—"}
                  {fd.phaJustification && ` — ${fd.phaJustification}`}
                </p>
              )}
            </>
          )}
          {type === "MOOC" && (
            <>
              <p><strong>Job title:</strong> {fd.jobTitle}</p>
              <p>
                <strong>The individual:</strong>{" "}
                {fd.reason === "RESIGNED" ? "Resigned before placement" : "Transferred for another assignment"}
              </p>
              <p className="mt-2"><strong>Job description:</strong></p>
              <p className="whitespace-pre-wrap">{fd.jobDescription}</p>
            </>
          )}
          {type === "BYPASS" && (
            <>
              <p><strong>Bypass start:</strong> {fd.bypassStart?.replace("T", " ")}</p>
              <p><strong>Expected completion:</strong> {fd.expectedCompletion?.replace("T", " ")}</p>
              <p className="mt-2"><strong>Bypassed safety device:</strong> {fd.deviceDescription}</p>
              <p><strong>Description of bypass:</strong> {fd.bypassDescription}</p>
              <p><strong>Protected equipment:</strong> {fd.protectedEquipment}</p>
              <p><strong>Hazard protected against:</strong> {fd.hazardExplanation}</p>
              <p><strong>Reason:</strong> {fd.reason}</p>
              <p><strong>Alternate protection plan:</strong> {fd.alternateProtection}</p>
              <p><strong>Implemented by:</strong> {fd.implementerName}</p>
              {fd.restoredAt && (
                <p><strong>Date and time restored:</strong> {fd.restoredAt.replace("T", " ")}</p>
              )}
            </>
          )}
        </div>
      </div>

      {checklistGroups.map(({ kind, title }) => {
        const rows = moc.checklists.filter((c) => c.kind === kind);
        if (rows.length === 0) return null;
        return (
          <div className={sectionCls} key={kind}>
            <div className={headCls}>{title}</div>
            <table className="w-full text-xs">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200 last:border-0">
                    <td className="px-3 py-1 w-1/2">
                      {r.category && <span className="text-gray-500">[{r.category}] </span>}
                      {r.label}
                    </td>
                    <td className="px-3 py-1">
                      {kind === "SE_ASSESSMENT"
                        ? `✓ — ${r.remarks ?? ""}`
                        : kind === "DOC_CHECKLIST"
                          ? `${r.requiredPhase ? r.requiredPhase.replaceAll("_", " ").toLowerCase() : "not required"}${r.owner ? ` · owner: ${r.owner.name}` : ""}${r.answer === "YES" ? ` · ✓ complete (${r.completedBy?.name})` : ""}`
                          : `${r.answer ?? "—"}${r.remarks ? ` — ${r.remarks}` : ""}${r.completedBy ? ` (${r.completedBy.name})` : ""}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {moc.actionItems.length > 0 && (
        <div className={sectionCls}>
          <div className={headCls}>Action Items / Punch List</div>
          <table className="w-full text-xs">
            <tbody>
              {moc.actionItems.map((i) => (
                <tr key={i.id} className="border-b border-gray-200 last:border-0">
                  <td className="px-3 py-1">{i.description}</td>
                  <td className="px-3 py-1">{i.category}</td>
                  <td className="px-3 py-1">{i.owner?.name ?? "—"}</td>
                  <td className="px-3 py-1">{i.status === "CLOSED" ? `Closed ${fmtDate(i.closedAt)}` : `Open · due ${fmtDate(i.dueDate)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={sectionCls}>
        <div className={headCls}>Signatures</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="px-3 py-1">Stage</th>
              <th className="px-3 py-1">Role</th>
              <th className="px-3 py-1">Decision</th>
              <th className="px-3 py-1">Signed name</th>
              <th className="px-3 py-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {moc.approvals.map((a) => {
              const spec =
                a.stage === "BYPASS_EXTENSION" ? BYPASS_EXTENSION_STAGE : getStage(type, a.stage);
              return (
                <tr key={a.id} className="border-b border-gray-200 last:border-0">
                  <td className="px-3 py-1">{spec?.title ?? a.stage}</td>
                  <td className="px-3 py-1">{a.roleLabel}</td>
                  <td className="px-3 py-1">
                    {a.decision === "APPROVED" ? "Approved" : a.decision === "REJECTED" ? "Not approved" : "Pending"}
                  </td>
                  <td className="px-3 py-1">{a.signedName ?? "—"}</td>
                  <td className="px-3 py-1">{a.decidedAt ? fmtDateTime(a.decidedAt) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {moc.extensions.length > 0 && (
        <div className={sectionCls}>
          <div className={headCls}>Temporary Change Extension Reviews</div>
          <div className={bodyCls}>
            {moc.extensions.map((e) => (
              <p key={e.number}>
                Review #{e.number}: extended to {fmtDate(e.extensionDate)}; assumptions valid:{" "}
                {e.assumptionsValid ? "Yes" : "No"}; signed {e.signedName} on {fmtDate(e.createdAt)}
              </p>
            ))}
          </div>
        </div>
      )}

      {moc.bypassLogs.length > 0 && (
        <div className={sectionCls}>
          <div className={headCls}>Bypass Shift Log</div>
          <div className={bodyCls}>
            {moc.bypassLogs.map((l) => (
              <p key={l.id}>
                {fmtDate(l.date)} · {l.shift === "DAY" ? "Day" : "Night"} · {l.initials} ({l.user.name})
              </p>
            ))}
          </div>
        </div>
      )}

      {moc.addenda.length > 0 && (
        <div className={sectionCls}>
          <div className={headCls}>Addenda</div>
          <div className={bodyCls}>
            {moc.addenda.map((a) => (
              <div key={a.id} className="mb-2">
                <p><strong>{a.summary}</strong></p>
                <p>Technical basis: {a.technicalBasis}</p>
                {a.seAssessment && <p>S&E assessment: {a.seAssessment}</p>}
                <p>
                  Raised by {a.createdBy.name} ·{" "}
                  {a.decision === "PENDING"
                    ? "awaiting Technical Authority"
                    : `${a.decision === "APPROVED" ? "Approved" : "Not approved"} by ${a.signedName} on ${fmtDateTime(a.decidedAt)}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={sectionCls}>
        <div className={headCls}>Audit Trail</div>
        <div className={bodyCls}>
          {moc.auditEntries.map((e) => (
            <p key={e.id} className="text-xs">
              {fmtDateTime(e.createdAt)} · {e.user?.name ?? "System"} · {e.action}
              {e.detail && ` — ${e.detail}`}
            </p>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Generated by Vantage MOC on {fmtDateTime(new Date())}. Electronic
        signatures recorded with password re-verification; this printout is a
        copy of the electronic record.
      </p>
    </div>
  );
}
