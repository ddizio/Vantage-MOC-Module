import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isMemberOfSite, rolesAtSite } from "@/lib/auth";
import { parseFormData } from "@/lib/forms";
import {
  MOC_TYPE_LABELS,
  PHA_LABELS,
  type MocType,
  type PhaType,
} from "@/lib/constants";
import { getStages, getStage, BYPASS_EXTENSION_STAGE } from "@/lib/workflow";
import { pendingManualStage } from "@/lib/moc-service";
import { StatusBadge, LevelBadge } from "@/components/status-badge";
import { Card } from "@/components/ui";
import { SignatureDialog } from "@/components/signature-dialog";
import {
  YesNoChecklist,
  SeAssessment,
  DocChecklist,
  TransitionPlan,
} from "@/components/checklist-sections";
import {
  SubmitPanel,
  AdvancePanel,
  CancelPanel,
  ActionItems,
  AddendumSection,
  ExtensionSection,
  BypassPanel,
  ReassignControl,
} from "@/components/moc-sections";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "—";
}
function fmtDateTime(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—";
}

export default async function MocDetailPage({
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
      createdBy: true,
      approvals: { include: { assignedTo: true }, orderBy: { id: "asc" } },
      checklists: { include: { completedBy: true }, orderBy: { id: "asc" } },
      actionItems: { include: { owner: true }, orderBy: { createdAt: "asc" } },
      attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "asc" } },
      addenda: { include: { approver: true, createdBy: true }, orderBy: { createdAt: "asc" } },
      extensions: { orderBy: { number: "asc" } },
      bypassLogs: { include: { user: true }, orderBy: { date: "asc" } },
      auditEntries: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!moc) notFound();
  if (!isMemberOfSite(user, moc.siteId)) notFound();

  const fd = parseFormData(moc.formData);
  const type = moc.type as MocType;
  const stages = getStages(type);
  const isLead = moc.leadId === user.id || user.isAdmin;
  const myRoles = rolesAtSite(user, moc.siteId);
  const canManageSignatures =
    user.isAdmin || myRoles.includes("PROCESS_SAFETY") || myRoles.includes("EHSS_MANAGER");
  const editable = ["DRAFT", "REJECTED"].includes(moc.status);
  const openRecord = !["CLOSED", "CANCELED"].includes(moc.status);
  // During review, the lead, an admin, or an assigned (still-pending) approver
  // may revise the description/scope.
  const isAssignedApprover = moc.approvals.some(
    (a) => a.assignedToId === user.id && a.decision === "PENDING"
  );
  const canEditScope =
    editable || (moc.status === "REVIEW" && (isLead || isAssignedApprover));

  const siteMembers = await prisma.siteMembership.findMany({
    where: { siteId: moc.siteId, user: { active: true } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });
  const people = siteMembers.map((m) => ({ id: m.user.id, name: m.user.name }));

  const manualStage = moc.status === "IMPLEMENTATION" ? await pendingManualStage(moc.id) : null;

  const approvalsByStage = new Map<string, typeof moc.approvals>();
  for (const a of moc.approvals) {
    approvalsByStage.set(a.stage, [...(approvalsByStage.get(a.stage) ?? []), a]);
  }
  const extensionApprovals = approvalsByStage.get("BYPASS_EXTENSION") ?? [];

  const functionalReview = moc.checklists.filter((c) => c.kind === "FUNCTIONAL_REVIEW");
  const closeout = moc.checklists.filter((c) => c.kind === "CLOSEOUT");
  const seRows = moc.checklists.filter((c) => c.kind === "SE_ASSESSMENT");
  const docRows = moc.checklists.filter((c) => c.kind === "DOC_CHECKLIST");
  const transitionRows = moc.checklists.filter((c) => c.kind === "TRANSITION_PLAN");

  const toRow = (c: (typeof moc.checklists)[number]) => ({
    id: c.id,
    itemKey: c.itemKey,
    label: c.label,
    category: c.category,
    answer: c.answer,
    remarks: c.remarks,
    ownerId: c.ownerId,
    requiredPhase: c.requiredPhase,
    completedByName: c.completedBy?.name ?? null,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{moc.number}</h1>
            <LevelBadge level={moc.level} />
            <StatusBadge status={moc.status} />
            {moc.changeType === "TEMPORARY" && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Temporary → {fmtDate(moc.endDate)}
              </span>
            )}
          </div>
          <p className="text-lg text-ink-2 mt-1">{moc.title}</p>
          <p className="text-xs text-ink-3 mt-1">
            {MOC_TYPE_LABELS[type]} · {moc.site.name} ({moc.site.code}) · Lead:{" "}
            {moc.lead.name} · Created {fmtDate(moc.createdAt)} by {moc.createdBy.name}
          </p>
        </div>
        <div className="no-print flex items-center gap-3">
          {canEditScope && (
            <Link
              href={`/mocs/${moc.id}/edit`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {editable ? "Edit draft" : "Edit description"}
            </Link>
          )}
          <Link
            href={`/mocs/${moc.id}/print`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Print / PDF
          </Link>
        </div>
      </div>

      {/* Workflow progress */}
      <div className="no-print flex flex-wrap items-center gap-1.5">
        {stages.map((s, i) => {
          const rows = approvalsByStage.get(s.stage) ?? [];
          const done = rows.length > 0 && rows.every((a) => a.decision === "APPROVED");
          const current = rows.some((a) => a.decision === "PENDING");
          const rejected = rows.some((a) => a.decision === "REJECTED");
          return (
            <span key={s.stage} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300">→</span>}
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  rejected
                    ? "bg-red-50 border-red-300 text-red-800"
                    : done
                      ? "bg-vantage-500 border-vantage-500 text-white"
                      : current
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-gray-200 text-ink-3"
                }`}
              >
                {done ? "✓ " : ""}
                {s.title}
              </span>
            </span>
          );
        })}
      </div>

      {/* Draft / rejected: submit */}
      {editable && isLead && (
        <Card
          title={moc.status === "REJECTED" ? "Revise & resubmit" : "Submit for approval"}
          subtitle={
            moc.status === "REJECTED"
              ? "Address the comments below, edit the draft if needed, then resubmit. All signatures will be collected again."
              : "Submitting opens the first approval stage and notifies the signers."
          }
        >
          <SubmitPanel mocId={moc.id} type={type} people={people} leadId={moc.leadId} />
        </Card>
      )}

      {/* Implementation: advance */}
      {manualStage && isLead && (
        <Card
          title="Change approved — implementation in progress"
          subtitle="When the work is complete, advance the MOC to the next stage."
        >
          <AdvancePanel mocId={moc.id} nextTitle={manualStage.title} />
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Scope */}
          <Card title="Part 1A — Scope">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              {type !== "MOOC" && type !== "BYPASS" && (
                <>
                  <div>
                    <dt className="text-xs text-ink-3">Asset</dt>
                    <dd>{fd.asset || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">Plant area</dt>
                    <dd>{fd.plantArea || "—"}</dd>
                  </div>
                </>
              )}
              <div>
                <dt className="text-xs text-ink-3">Permanent / Temporary</dt>
                <dd>
                  {moc.changeType === "TEMPORARY"
                    ? `Temporary (${fmtDate(moc.startDate)} → ${fmtDate(moc.endDate)})`
                    : "Permanent"}
                </dd>
              </div>
              {(type === "LEVEL1" || type === "LEVEL2") && (
                <div>
                  <dt className="text-xs text-ink-3">Hazard assessment</dt>
                  <dd>
                    {moc.degreeOfHazard} degree of hazard × {moc.significance} significance →{" "}
                    <strong>Level {moc.level}</strong>
                  </dd>
                </div>
              )}
              {type === "MOOC" && (
                <>
                  <div>
                    <dt className="text-xs text-ink-3">Job title</dt>
                    <dd>{fd.jobTitle || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">The individual</dt>
                    <dd>
                      {fd.reason === "RESIGNED"
                        ? "Resigned before placement (temporary change)"
                        : "Transferred for another assignment"}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            {(type === "LEVEL1" || type === "LEVEL2") && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <h4 className="text-xs text-ink-3">Brief summary of the modification</h4>
                  <p className="whitespace-pre-wrap">{fd.summary || "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs text-ink-3">Technical basis for change</h4>
                  <p className="whitespace-pre-wrap">{fd.technicalBasis || "—"}</p>
                </div>
                {type === "LEVEL1" && (
                  <>
                    <div>
                      <h4 className="text-xs text-ink-3">Process Safety Information to update</h4>
                      <p className="whitespace-pre-wrap">{fd.psiToUpdate || "—"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-ink-3">
                        Part 1B — Impact on safety and environment
                      </h4>
                      <p className="whitespace-pre-wrap">{fd.safetyEnvImpact || "—"}</p>
                    </div>
                  </>
                )}
                {type === "LEVEL2" && (
                  <div>
                    <h4 className="text-xs text-ink-3">Part 1C — Process Hazard Review</h4>
                    <p>
                      {fd.phaType
                        ? `${PHA_LABELS[fd.phaType as PhaType] ?? fd.phaType}${fd.phaType === "OTHER" && fd.phaOther ? ` (${fd.phaOther})` : ""}`
                        : "Not selected"}
                      {fd.phaJustification && ` — ${fd.phaJustification}`}
                    </p>
                  </div>
                )}
              </div>
            )}
            {type === "MOOC" && (
              <div className="mt-4 text-sm">
                <h4 className="text-xs text-ink-3">Job description</h4>
                <p className="whitespace-pre-wrap">{fd.jobDescription || "—"}</p>
              </div>
            )}
            {type === "BYPASS" && (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs text-ink-3">Bypass start</h4>
                    <p>{fd.bypassStart?.replace("T", " ") || "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-ink-3">Expected completion</h4>
                    <p>{fd.expectedCompletion?.replace("T", " ") || "—"}</p>
                  </div>
                </div>
                {(
                  [
                    ["Bypassed safety device", fd.deviceDescription],
                    ["Description of bypass", fd.bypassDescription],
                    ["Protected equipment", fd.protectedEquipment],
                    ["Hazard the device protects against", fd.hazardExplanation],
                    ["Reason for bypass / impairment", fd.reason],
                    ["Alternate protection plan", fd.alternateProtection],
                    ["Implemented by", fd.implementerName],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <h4 className="text-xs text-ink-3">{label}</h4>
                    <p className="whitespace-pre-wrap">{value || "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Type-specific checklists */}
          {type === "LEVEL1" && (
            <Card
              title="Appendix A — Functional Review Checklist"
              subtitle="Reviewed by Process Safety and the Relevant Manager before sign-off"
            >
              <YesNoChecklist
                rows={functionalReview.map(toRow)}
                editable={openRecord && ["DRAFT", "REJECTED", "REVIEW"].includes(moc.status)}
              />
            </Card>
          )}
          {type === "LEVEL2" && (
            <>
              <Card title="Appendix A — Safety & Environmental Assessment">
                <SeAssessment
                  mocId={moc.id}
                  checkedRows={seRows.map(toRow)}
                  editable={editable || moc.status === "REVIEW"}
                />
              </Card>
              <Card title="Appendix B — Documentation Checklist">
                <DocChecklist rows={docRows.map(toRow)} people={people} editable={openRecord} />
              </Card>
            </>
          )}
          {type === "MOOC" && (
            <Card
              title="Appendix A — Transition Plan"
              subtitle="Reassign each responsibility and record the transition detail"
            >
              <TransitionPlan
                mocId={moc.id}
                rows={transitionRows.map(toRow)}
                editable={openRecord}
              />
            </Card>
          )}
          {type === "LEVEL1" && (
            <Card title="Part 2 — Close-Out Checklist">
              <YesNoChecklist rows={closeout.map(toRow)} editable={openRecord} />
            </Card>
          )}
          {type === "BYPASS" && (
            <Card title="Bypass Operations">
              <BypassPanel
                mocId={moc.id}
                isLead={isLead}
                active={moc.status === "ACTIVE"}
                logs={moc.bypassLogs.map((l) => ({
                  id: l.id,
                  date: fmtDate(l.date),
                  shift: l.shift,
                  initials: l.initials,
                  userName: l.user.name,
                }))}
                extensionPending={extensionApprovals.some((a) => a.decision === "PENDING")}
                extensionApproved={
                  extensionApprovals.length > 0 &&
                  extensionApprovals.every((a) => a.decision === "APPROVED")
                }
                restoredAt={fd.restoredAt?.replace("T", " ") ?? null}
              />
            </Card>
          )}

          {/* Punch list */}
          {type !== "BYPASS" && (
            <Card
              title="Action Items / Punch List"
              subtitle="PSSR punch list categories: A pre-inventory · B hot commissioning · C pre-closure"
            >
              <ActionItems
                mocId={moc.id}
                items={moc.actionItems.map((i) => ({
                  id: i.id,
                  description: i.description,
                  category: i.category,
                  status: i.status,
                  dueDate: i.dueDate ? fmtDate(i.dueDate) : null,
                  ownerName: i.owner?.name ?? null,
                }))}
                people={people}
                editable={openRecord}
              />
            </Card>
          )}

          {/* Addenda */}
          {(type === "LEVEL1" || type === "LEVEL2") && (
            <Card title="Addenda (Appendix G)">
              <AddendumSection
                mocId={moc.id}
                addenda={moc.addenda.map((a) => ({
                  id: a.id,
                  summary: a.summary,
                  technicalBasis: a.technicalBasis,
                  seAssessment: a.seAssessment,
                  decision: a.decision,
                  signedName: a.signedName,
                  comment: a.comment,
                  decidedAt: a.decidedAt ? fmtDateTime(a.decidedAt) : null,
                  approverName: a.approver?.name ?? null,
                  approverId: a.approverId,
                  createdByName: a.createdBy.name,
                  createdAt: fmtDate(a.createdAt),
                }))}
                currentUserId={user.id}
                canAdd={openRecord && !editable}
              />
            </Card>
          )}

          {/* Temporary extensions */}
          {moc.changeType === "TEMPORARY" && type !== "BYPASS" && (
            <Card title={`${type === "MOOC" ? "Part 3B" : "Part 4B"} — Temporary Change Reviews`}>
              <ExtensionSection
                mocId={moc.id}
                extensions={moc.extensions.map((e) => ({
                  number: e.number,
                  signedName: e.signedName,
                  assumptionsValid: e.assumptionsValid,
                  extensionDate: fmtDate(e.extensionDate),
                  comment: e.comment,
                  createdAt: fmtDate(e.createdAt),
                }))}
                editable={openRecord}
              />
            </Card>
          )}
        </div>

        {/* Right column: signatures, attachments, audit */}
        <div className="space-y-5">
          <Card title="Signatures" subtitle="Electronic signatures with timestamps">
            {moc.approvals.length === 0 && (
              <p className="text-sm text-ink-3">
                No signatures yet — they are created when the record is submitted.
              </p>
            )}
            <div className="space-y-4">
              {[...approvalsByStage.entries()].map(([stageKey, rows]) => {
                const spec =
                  stageKey === "BYPASS_EXTENSION"
                    ? BYPASS_EXTENSION_STAGE
                    : getStage(type, stageKey);
                return (
                  <div key={stageKey}>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-1.5">
                      {spec?.title ?? stageKey}
                    </h4>
                    <ul className="space-y-2">
                      {rows.map((a) => (
                        <li key={a.id} className="rounded-md border border-gray-200 p-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-xs">{a.roleLabel}</span>
                            {a.decision === "APPROVED" && (
                              <span className="text-xs font-medium text-vantage-700">✓ Approved</span>
                            )}
                            {a.decision === "REJECTED" && (
                              <span className="text-xs font-medium text-red-700">✗ Not approved</span>
                            )}
                            {a.decision === "PENDING" && (
                              <span className="text-xs text-amber-700">Pending</span>
                            )}
                          </div>
                          <p className="text-xs text-ink-3 mt-1">
                            {a.decision === "PENDING" ? (
                              <>Assigned to {a.assignedTo?.name ?? <em>unassigned — needs reassignment</em>}</>
                            ) : (
                              <>
                                Signed <strong>{a.signedName}</strong> ({a.assignedTo?.name}) ·{" "}
                                {fmtDateTime(a.decidedAt)}
                              </>
                            )}
                          </p>
                          {a.comment && (
                            <p className="text-xs mt-1 text-ink-2">“{a.comment}”</p>
                          )}
                          {a.decision === "PENDING" && openRecord && (
                            <div className="no-print mt-2 flex items-center gap-3">
                              {a.assignedToId === user.id && (
                                <SignatureDialog
                                  approvalId={a.id}
                                  roleLabel={a.roleLabel}
                                  stageTitle={spec?.title ?? stageKey}
                                />
                              )}
                              {canManageSignatures && (
                                <ReassignControl approvalId={a.id} people={people} />
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Attachments" subtitle="P&IDs, PHA reports, PSSR, photos, permits…">
            {moc.attachments.length === 0 && (
              <p className="text-sm text-ink-3">No attachments.</p>
            )}
            <ul className="space-y-1.5 text-sm">
              {moc.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={`/api/attachments/${a.id}`}
                    className="text-vantage-blue hover:underline break-all"
                  >
                    {a.filename}
                  </a>
                  <span className="text-xs text-ink-3">
                    {" "}
                    · {(a.size / 1024).toFixed(0)} KB · {a.uploadedBy.name}
                  </span>
                </li>
              ))}
            </ul>
            {openRecord && (
              <form
                method="post"
                action={`/api/mocs/${moc.id}/attachments`}
                encType="multipart/form-data"
                className="no-print mt-3 flex items-center gap-2"
              >
                <input type="file" name="file" required className="text-xs" />
                <button className="rounded-md border border-vantage-500 text-vantage-700 px-3 py-1.5 text-xs hover:bg-vantage-50">
                  Upload
                </button>
              </form>
            )}
          </Card>

          <Card title="Audit Trail" subtitle="Most recent 50 events">
            <ul className="space-y-1.5 text-xs text-ink-3">
              {moc.auditEntries.map((e) => (
                <li key={e.id}>
                  <span className="text-ink-2 font-medium">{e.action}</span>
                  {e.detail && <> — {e.detail}</>}
                  <br />
                  {e.user?.name ?? "System"} · {fmtDateTime(e.createdAt)}
                </li>
              ))}
            </ul>
          </Card>

          {openRecord && isLead && (
            <div className="no-print">
              <CancelPanel mocId={moc.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
