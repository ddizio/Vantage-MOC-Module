import { prisma } from "./db";
import { audit } from "./audit";
import { notifyMany } from "./notify";
import type { MocType } from "./constants";
import {
  firstStage,
  getStage,
  nextStage,
  type StageSpec,
  BYPASS_EXTENSION_STAGE,
  WORKFLOWS,
} from "./workflow";

/** Generate the next sequential MOC number for a site, e.g. GUR-2026-0007. */
export async function nextMocNumber(siteId: string): Promise<string> {
  const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
  const year = new Date().getFullYear();
  const prefix = `${site.code}-${year}-`;
  const last = await prisma.moc.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/** Users holding a given functional role at a site. */
export async function roleHolders(
  siteId: string,
  roleKey: string
): Promise<string[]> {
  const memberships = await prisma.siteMembership.findMany({
    where: { siteId, user: { active: true } },
    select: { userId: true, roles: true },
  });
  return memberships
    .filter((m) => m.roles.split(",").includes(roleKey))
    .map((m) => m.userId);
}

/**
 * Resolve the user a signature should be assigned to.
 * Special keys resolve to named individuals on the MOC; site roles resolve to
 * the site's designated role holder (first holder if several).
 */
async function resolveAssignee(
  spec: { roleKey: string },
  moc: { siteId: string; leadId: string },
  named: { relevantManagerId?: string | null; approvingManagerId?: string | null }
): Promise<string | null> {
  switch (spec.roleKey) {
    case "MOC_LEAD":
      return moc.leadId;
    case "RELEVANT_MANAGER":
      return named.relevantManagerId ?? null;
    case "APPROVING_MANAGER":
      return named.approvingManagerId ?? null;
    default: {
      const holders = await roleHolders(moc.siteId, spec.roleKey);
      return holders[0] ?? null;
    }
  }
}

/** Create the pending Approval rows for a stage and notify assignees. */
export async function openStage(
  mocId: string,
  spec: StageSpec,
  named: { relevantManagerId?: string | null; approvingManagerId?: string | null } = {}
) {
  const moc = await prisma.moc.findUniqueOrThrow({ where: { id: mocId } });
  const assignees: string[] = [];
  for (const sig of spec.signatures) {
    const assignedToId = await resolveAssignee(sig, moc, named);
    await prisma.approval.create({
      data: {
        mocId,
        stage: spec.stage,
        roleKey: sig.roleKey,
        roleLabel: sig.roleLabel,
        assignedToId,
      },
    });
    if (assignedToId) assignees.push(assignedToId);
  }
  await notifyMany(
    assignees,
    `${moc.number} "${moc.title}" needs your signature — ${spec.title}`,
    { mocId, link: `/mocs/${mocId}` }
  );
}

/**
 * Called after an approval is granted: if the whole stage is approved,
 * advance the MOC status and auto-open the next stage where configured.
 */
export async function progressAfterApproval(mocId: string, stageKey: string) {
  const moc = await prisma.moc.findUniqueOrThrow({
    where: { id: mocId },
    include: { approvals: { where: { stage: stageKey } } },
  });
  if (stageKey === BYPASS_EXTENSION_STAGE.stage) return; // side flow, no status change
  const spec = getStage(moc.type as MocType, stageKey);
  if (!spec) return;
  const allApproved =
    moc.approvals.length > 0 &&
    moc.approvals.every((a) => a.decision === "APPROVED");
  if (!allApproved) return;

  const closing = spec.nextStatus === "CLOSED";
  await prisma.moc.update({
    where: { id: mocId },
    data: {
      status: spec.nextStatus,
      closedAt: closing ? new Date() : undefined,
    },
  });
  await audit(`Stage complete: ${spec.title}`, { mocId });

  if (spec.autoOpenNext) {
    const next = nextStage(moc.type as MocType, stageKey);
    if (next) {
      const relevant = await prisma.approval.findFirst({
        where: { mocId, roleKey: "RELEVANT_MANAGER" },
      });
      await openStage(mocId, next, {
        relevantManagerId: relevant?.assignedToId,
      });
      await prisma.moc.update({
        where: { id: mocId },
        data: { status: next.status },
      });
    }
  }

  if (closing) {
    await notifyMany([moc.leadId], `${moc.number} "${moc.title}" is closed.`, {
      mocId,
      link: `/mocs/${mocId}`,
    });
  }
}

/** Submit a draft: open the first workflow stage. */
export async function submitMoc(
  mocId: string,
  named: { relevantManagerId?: string | null; approvingManagerId?: string | null }
) {
  const moc = await prisma.moc.findUniqueOrThrow({ where: { id: mocId } });
  const spec = firstStage(moc.type as MocType);
  await openStage(mocId, spec, named);
  await prisma.moc.update({
    where: { id: mocId },
    data: { status: spec.status, submittedAt: new Date() },
  });
}

/** The stage following the last fully approved stage, for manual advancement. */
export async function pendingManualStage(mocId: string): Promise<StageSpec | null> {
  const moc = await prisma.moc.findUniqueOrThrow({
    where: { id: mocId },
    include: { approvals: true },
  });
  if (moc.status !== "IMPLEMENTATION") return null;
  const stages = WORKFLOWS[moc.type as MocType];
  for (const s of stages) {
    const rows = moc.approvals.filter((a) => a.stage === s.stage);
    if (rows.length === 0) return s; // first stage never opened
  }
  return null;
}
