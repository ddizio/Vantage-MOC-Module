"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  requireUser,
  requireAdmin,
  verifyPassword,
  hashPassword,
  isMemberOfSite,
  destroySession,
} from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notifyMany } from "@/lib/notify";
import {
  determineLevel,
  type MocType,
  MOC_TYPES,
  SITE_ROLES,
} from "@/lib/constants";
import {
  FUNCTIONAL_REVIEW_ITEMS,
  L1_CLOSEOUT_ITEMS,
  DOC_CHECKLIST_ITEMS,
  TRANSITION_PLAN_ITEMS,
  SE_ASSESSMENT_CATEGORIES,
  seItemKey,
} from "@/lib/checklists";
import {
  submitMoc,
  openStage,
  progressAfterApproval,
  nextMocNumber,
  pendingManualStage,
} from "@/lib/moc-service";
import { BYPASS_EXTENSION_STAGE } from "@/lib/workflow";
import { parseFormData } from "@/lib/forms";

export type ActionResult = { error?: string; ok?: boolean; id?: string };

function fail(error: string): ActionResult {
  return { error };
}

// ─── Session ────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ─── MOC creation & editing ─────────────────────────────────────────────────

function str(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}

function collectFormData(type: MocType, form: FormData): string {
  const keys =
    type === "MOOC"
      ? ["jobTitle", "reason", "jobDescription"]
      : type === "BYPASS"
        ? [
            "bypassStart",
            "expectedCompletion",
            "deviceDescription",
            "bypassDescription",
            "protectedEquipment",
            "hazardExplanation",
            "reason",
            "alternateProtection",
            "implementerName",
          ]
        : [
            "asset",
            "plantArea",
            "summary",
            "technicalBasis",
            "psiToUpdate",
            "safetyEnvImpact",
            "phaType",
            "phaOther",
            "phaJustification",
          ];
  const data: Record<string, string> = {};
  for (const k of keys) {
    const v = str(form, k);
    if (v) data[k] = v;
  }
  return JSON.stringify(data);
}

export async function createMocAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const siteId = str(form, "siteId");
  const type = str(form, "type") as MocType;
  const title = str(form, "title");

  if (!MOC_TYPES.includes(type)) return fail("Invalid form type.");
  if (!title) return fail("Title is required.");
  if (!siteId || !isMemberOfSite(user, siteId))
    return fail("You are not a member of the selected site.");

  const changeType = str(form, "changeType") === "TEMPORARY" ? "TEMPORARY" : "PERMANENT";
  const startDate = str(form, "startDate");
  const endDate = str(form, "endDate");
  if (changeType === "TEMPORARY" && !endDate)
    return fail("Temporary changes require an end date.");

  let level: number | null = null;
  let degreeOfHazard: string | null = null;
  let significance: string | null = null;
  if (type === "LEVEL1" || type === "LEVEL2") {
    degreeOfHazard = str(form, "degreeOfHazard");
    significance = str(form, "significance");
    if (!["LOW", "HIGH"].includes(degreeOfHazard) || !["LOW", "HIGH"].includes(significance))
      return fail("Complete the hazard assessment (degree of hazard and significance).");
    level = determineLevel(degreeOfHazard as "LOW" | "HIGH", significance as "LOW" | "HIGH");
    if (level === 1 && type === "LEVEL2")
      return fail("The hazard assessment indicates Level 1 — use the Level 1 form.");
    if (level > 1 && type === "LEVEL1")
      return fail(`The hazard assessment indicates Level ${level} — use the Level 2 form.`);
  }

  const number = await nextMocNumber(siteId);
  const moc = await prisma.moc.create({
    data: {
      number,
      siteId,
      type,
      level,
      title,
      leadId: user.id,
      changeType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      degreeOfHazard,
      significance,
      formData: collectFormData(type, form),
      createdById: user.id,
    },
  });

  // Pre-create checklist rows from the templates for this form type.
  const rows: { kind: string; itemKey: string; label: string; category?: string }[] = [];
  if (type === "LEVEL1") {
    rows.push(
      ...FUNCTIONAL_REVIEW_ITEMS.map((i) => ({ kind: "FUNCTIONAL_REVIEW", itemKey: i.key, label: i.label, category: i.category })),
      ...L1_CLOSEOUT_ITEMS.map((i) => ({ kind: "CLOSEOUT", itemKey: i.key, label: i.label }))
    );
  } else if (type === "LEVEL2") {
    rows.push(
      ...DOC_CHECKLIST_ITEMS.map((i) => ({ kind: "DOC_CHECKLIST", itemKey: i.key, label: i.label, category: i.category }))
    );
  } else if (type === "MOOC") {
    rows.push(
      ...TRANSITION_PLAN_ITEMS.map((i) => ({ kind: "TRANSITION_PLAN", itemKey: i.key, label: i.label }))
    );
  }
  if (rows.length) {
    await prisma.checklistResponse.createMany({
      data: rows.map((r) => ({ ...r, mocId: moc.id })),
    });
  }

  await audit("MOC created", { mocId: moc.id, userId: user.id, detail: number });
  redirect(`/mocs/${moc.id}`);
}

async function getEditableMoc(mocId: string, userId: string) {
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) throw new Error("MOC not found");
  const user = await requireUser();
  const canEdit =
    (moc.leadId === userId || moc.createdById === userId || user.isAdmin) &&
    ["DRAFT", "REJECTED"].includes(moc.status);
  if (!canEdit) throw new Error("This record can no longer be edited.");
  return moc;
}

export async function updateMocAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  let moc;
  try {
    moc = await getEditableMoc(mocId, user.id);
  } catch (e) {
    return fail((e as Error).message);
  }
  const title = str(form, "title");
  if (!title) return fail("Title is required.");
  const changeType = str(form, "changeType") === "TEMPORARY" ? "TEMPORARY" : "PERMANENT";
  const endDate = str(form, "endDate");
  if (changeType === "TEMPORARY" && !endDate)
    return fail("Temporary changes require an end date.");
  const startDate = str(form, "startDate");

  await prisma.moc.update({
    where: { id: mocId },
    data: {
      title,
      changeType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      formData: collectFormData(moc.type as MocType, form),
    },
  });
  await audit("MOC updated", { mocId, userId: user.id });
  redirect(`/mocs/${mocId}`);
}

// ─── Submission & workflow ──────────────────────────────────────────────────

export async function submitMocAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) return fail("MOC not found.");
  if (!["DRAFT", "REJECTED"].includes(moc.status))
    return fail("Only drafts can be submitted.");
  if (moc.leadId !== user.id && !user.isAdmin)
    return fail("Only the MOC Lead can submit this record.");

  const fd = parseFormData(moc.formData);
  if (moc.type === "LEVEL2") {
    if (!fd.phaType)
      return fail("Select the required Process Hazard Review (Part 1C) before submitting.");
    if (moc.level === 3 && !["WHAT_IF", "HAZOP", "LOPA"].includes(fd.phaType))
      return fail("Level 3 MOCs require at least a What-If Process Hazard Analysis.");
    if (moc.level === 4 && fd.phaType !== "HAZOP")
      return fail("Level 4 MOCs require a HAZOP Process Hazard Analysis.");
  }

  const needsRelevantManager = moc.type === "LEVEL1" || moc.type === "MOOC";
  const relevantManagerId = str(form, "relevantManagerId") || null;
  const approvingManagerId = str(form, "approvingManagerId") || null;
  if (needsRelevantManager) {
    if (!relevantManagerId) return fail("Select the Relevant Manager.");
    if (relevantManagerId === moc.leadId)
      return fail("The Relevant Manager cannot be the MOC Lead.");
  }
  if (moc.type === "BYPASS" && !approvingManagerId)
    return fail("Select the Approving Manager.");

  // Resubmission after rejection: clear previous decisions for a clean stage.
  await prisma.approval.deleteMany({ where: { mocId } });

  await submitMoc(mocId, { relevantManagerId, approvingManagerId });
  await audit("Submitted for approval", { mocId, userId: user.id });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

export async function signApprovalAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const approvalId = str(form, "approvalId");
  const decision = str(form, "decision"); // APPROVED | REJECTED
  const signedName = str(form, "signedName");
  const password = form.get("password") as string | null;
  const comment = str(form, "comment");

  if (!["APPROVED", "REJECTED"].includes(decision)) return fail("Invalid decision.");
  if (!signedName) return fail("Type your full name to sign.");
  if (decision === "REJECTED" && !comment)
    return fail("A comment is required when not approving.");
  if (!password || !(await verifyPassword(user.id, password)))
    return fail("Password verification failed. Your signature was not recorded.");

  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: { moc: true },
  });
  if (!approval) return fail("Signature request not found.");
  if (["CLOSED", "CANCELED"].includes(approval.moc.status))
    return fail("This record is closed.");
  if (approval.decision !== "PENDING") return fail("This signature has already been recorded.");
  if (approval.assignedToId !== user.id)
    return fail("This signature is assigned to a different person.");

  await prisma.approval.update({
    where: { id: approvalId },
    data: { decision, signedName, comment: comment || null, decidedAt: new Date() },
  });
  await audit(
    `${decision === "APPROVED" ? "Signed / approved" : "Not approved"}: ${approval.roleLabel} (${approval.stage})`,
    { mocId: approval.mocId, userId: user.id, detail: comment || undefined }
  );

  if (decision === "REJECTED") {
    await prisma.moc.update({
      where: { id: approval.mocId },
      data: { status: "REJECTED" },
    });
    await notifyMany(
      [approval.moc.leadId],
      `${approval.moc.number} was not approved by ${approval.roleLabel}. See comments, revise, and resubmit.`,
      { mocId: approval.mocId, link: `/mocs/${approval.mocId}` }
    );
  } else {
    await progressAfterApproval(approval.mocId, approval.stage);
  }
  revalidatePath(`/mocs/${approval.mocId}`);
  return { ok: true };
}

/** MOC Lead advances an implemented change to its next approval stage. */
export async function advanceStageAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) return fail("MOC not found.");
  if (moc.leadId !== user.id && !user.isAdmin)
    return fail("Only the MOC Lead can advance this record.");
  const stage = await pendingManualStage(mocId);
  if (!stage) return fail("No stage to advance to.");

  const relevant = await prisma.approval.findFirst({
    where: { mocId, roleKey: "RELEVANT_MANAGER" },
  });
  await openStage(mocId, stage, { relevantManagerId: relevant?.assignedToId });
  await prisma.moc.update({ where: { id: mocId }, data: { status: stage.status } });
  await audit(`Advanced to: ${stage.title}`, { mocId, userId: user.id });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

export async function cancelMocAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const reason = str(form, "reason");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) return fail("MOC not found.");
  if (moc.leadId !== user.id && !user.isAdmin)
    return fail("Only the MOC Lead or an administrator can cancel.");
  if (moc.status === "CLOSED") return fail("Closed records cannot be canceled.");
  if (!reason) return fail("A cancellation reason is required.");
  await prisma.moc.update({ where: { id: mocId }, data: { status: "CANCELED" } });
  await audit("MOC canceled", { mocId, userId: user.id, detail: reason });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

// ─── Checklists ─────────────────────────────────────────────────────────────

export async function answerChecklistAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(form, "responseId");
  const answer = str(form, "answer") || null;
  const remarks = str(form, "remarks") || null;
  const row = await prisma.checklistResponse.findUnique({
    where: { id },
    include: { moc: true },
  });
  if (!row) return fail("Checklist item not found.");
  if (row.moc.status === "CLOSED" || row.moc.status === "CANCELED")
    return fail("This record is closed.");
  if (!isMemberOfSite(user, row.moc.siteId)) return fail("Not authorized.");

  await prisma.checklistResponse.update({
    where: { id },
    data: {
      answer,
      remarks,
      completedAt: answer ? new Date() : null,
      completedById: answer ? user.id : null,
    },
  });
  revalidatePath(`/mocs/${row.mocId}`);
  return { ok: true };
}

/** Toggle a Safety & Environmental Assessment check word (Level 2 Appendix A). */
export async function toggleSeWordAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const category = str(form, "category");
  const word = str(form, "word");
  const assessment = str(form, "assessment");
  const checked = str(form, "checked") === "1";

  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) return fail("MOC not found.");
  if (!isMemberOfSite(user, moc.siteId)) return fail("Not authorized.");
  const cat = SE_ASSESSMENT_CATEGORIES.find((c) => c.category === category);
  if (!cat || !cat.words.includes(word)) return fail("Unknown check word.");

  const itemKey = seItemKey(category, word);
  if (!checked) {
    await prisma.checklistResponse.deleteMany({
      where: { mocId, kind: "SE_ASSESSMENT", itemKey },
    });
  } else {
    await prisma.checklistResponse.upsert({
      where: { mocId_kind_itemKey: { mocId, kind: "SE_ASSESSMENT", itemKey } },
      create: {
        mocId,
        kind: "SE_ASSESSMENT",
        itemKey,
        category,
        label: word,
        answer: "CHECKED",
        remarks: assessment || null,
        completedById: user.id,
        completedAt: new Date(),
      },
      update: { remarks: assessment || null },
    });
  }
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

/** Documentation checklist (Level 2 Appendix B): assign owner/phase, mark complete. */
export async function updateDocChecklistAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(form, "responseId");
  const row = await prisma.checklistResponse.findUnique({
    where: { id },
    include: { moc: true },
  });
  if (!row) return fail("Checklist item not found.");
  if (!isMemberOfSite(user, row.moc.siteId)) return fail("Not authorized.");

  const ownerId = str(form, "ownerId") || null;
  const requiredPhase = str(form, "requiredPhase") || null;
  const complete = str(form, "complete") === "1";

  await prisma.checklistResponse.update({
    where: { id },
    data: {
      ownerId,
      requiredPhase,
      answer: complete ? "YES" : null,
      completedAt: complete ? new Date() : null,
      completedById: complete ? user.id : null,
    },
  });
  revalidatePath(`/mocs/${row.mocId}`);
  return { ok: true };
}

/** Add a custom transition-plan row (MOOC Appendix A has free rows). */
export async function addTransitionItemAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const label = str(form, "label");
  if (!label) return fail("Describe the transition plan element.");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc || moc.type !== "MOOC") return fail("MOOC not found.");
  if (!isMemberOfSite(user, moc.siteId)) return fail("Not authorized.");
  await prisma.checklistResponse.create({
    data: {
      mocId,
      kind: "TRANSITION_PLAN",
      itemKey: `tp-custom-${Date.now()}`,
      label,
    },
  });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

// ─── Action items (punch list) ──────────────────────────────────────────────

export async function addActionItemAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const description = str(form, "description");
  if (!description) return fail("Describe the action item.");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) return fail("MOC not found.");
  if (!isMemberOfSite(user, moc.siteId)) return fail("Not authorized.");
  const dueDate = str(form, "dueDate");
  const ownerId = str(form, "ownerId") || null;
  const category = ["A", "B", "C"].includes(str(form, "category"))
    ? str(form, "category")
    : "GENERAL";
  const item = await prisma.actionItem.create({
    data: {
      mocId,
      description,
      category,
      ownerId,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  if (ownerId)
    await notifyMany([ownerId], `Action item assigned to you on ${moc.number}: ${description}`, {
      mocId,
      link: `/mocs/${mocId}`,
    });
  await audit("Action item added", { mocId, userId: user.id, detail: item.description });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

export async function toggleActionItemAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(form, "actionItemId");
  const item = await prisma.actionItem.findUnique({
    where: { id },
    include: { moc: true },
  });
  if (!item) return fail("Action item not found.");
  if (!isMemberOfSite(user, item.moc.siteId)) return fail("Not authorized.");
  const closing = item.status === "OPEN";
  await prisma.actionItem.update({
    where: { id },
    data: { status: closing ? "CLOSED" : "OPEN", closedAt: closing ? new Date() : null },
  });
  await audit(`Action item ${closing ? "closed" : "reopened"}`, {
    mocId: item.mocId,
    userId: user.id,
    detail: item.description,
  });
  revalidatePath(`/mocs/${item.mocId}`);
  return { ok: true };
}

// ─── Addenda (Appendix G) ───────────────────────────────────────────────────

export async function createAddendumAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const summary = str(form, "summary");
  const technicalBasis = str(form, "technicalBasis");
  const seAssessment = str(form, "seAssessment");
  if (!summary || !technicalBasis)
    return fail("Summary and technical basis are required.");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc) return fail("MOC not found.");
  if (!isMemberOfSite(user, moc.siteId)) return fail("Not authorized.");
  if (["DRAFT", "CLOSED", "CANCELED", "REJECTED"].includes(moc.status))
    return fail("Addenda can only be added to in-flight MOCs.");

  const { roleHolders } = await import("@/lib/moc-service");
  const tas = await roleHolders(moc.siteId, "TECHNICAL_AUTHORITY");
  const addendum = await prisma.addendum.create({
    data: {
      mocId,
      summary,
      technicalBasis,
      seAssessment: seAssessment || null,
      createdById: user.id,
      approverId: tas[0] ?? null,
    },
  });
  if (tas[0])
    await notifyMany([tas[0]], `Addendum on ${moc.number} needs Technical Authority approval`, {
      mocId,
      link: `/mocs/${mocId}`,
    });
  await audit("Addendum created", { mocId, userId: user.id, detail: addendum.summary });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

export async function signAddendumAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const id = str(form, "addendumId");
  const decision = str(form, "decision");
  const signedName = str(form, "signedName");
  const password = form.get("password") as string | null;
  const comment = str(form, "comment");
  if (!["APPROVED", "REJECTED"].includes(decision)) return fail("Invalid decision.");
  if (!signedName) return fail("Type your full name to sign.");
  if (!password || !(await verifyPassword(user.id, password)))
    return fail("Password verification failed. Your signature was not recorded.");
  const addendum = await prisma.addendum.findUnique({
    where: { id },
    include: { moc: true },
  });
  if (!addendum) return fail("Addendum not found.");
  if (addendum.decision !== "PENDING") return fail("Already decided.");
  if (addendum.approverId !== user.id)
    return fail("This approval is assigned to a different person.");
  await prisma.addendum.update({
    where: { id },
    data: { decision, signedName, comment: comment || null, decidedAt: new Date() },
  });
  await audit(`Addendum ${decision === "APPROVED" ? "approved" : "not approved"} by Technical Authority`, {
    mocId: addendum.mocId,
    userId: user.id,
  });
  revalidatePath(`/mocs/${addendum.mocId}`);
  return { ok: true };
}

// ─── Temporary change extensions & bypass features ──────────────────────────

export async function addExtensionReviewAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const extensionDate = str(form, "extensionDate");
  const assumptionsValid = str(form, "assumptionsValid") === "1";
  const signedName = str(form, "signedName");
  const password = form.get("password") as string | null;
  const comment = str(form, "comment");

  if (!extensionDate) return fail("An extension date is required.");
  if (!signedName) return fail("Type your full name to sign.");
  if (!password || !(await verifyPassword(user.id, password)))
    return fail("Password verification failed.");

  const moc = await prisma.moc.findUnique({
    where: { id: mocId },
    include: { extensions: true },
  });
  if (!moc) return fail("MOC not found.");
  if (moc.changeType !== "TEMPORARY") return fail("Only temporary changes can be extended.");
  if (!isMemberOfSite(user, moc.siteId)) return fail("Not authorized.");
  if (moc.extensions.length >= 3)
    return fail("A temporary change may only be extended 3 times. Make it permanent via a new MOC or restore the plant.");

  await prisma.extensionReview.create({
    data: {
      mocId,
      number: moc.extensions.length + 1,
      assumptionsValid,
      extensionDate: new Date(extensionDate),
      comment: comment || null,
      reviewedById: user.id,
      signedName,
    },
  });
  await prisma.moc.update({
    where: { id: mocId },
    data: { endDate: new Date(extensionDate) },
  });
  await audit(`Temporary change extension review #${moc.extensions.length + 1}`, {
    mocId,
    userId: user.id,
    detail: `New end date ${extensionDate}; assumptions valid: ${assumptionsValid ? "yes" : "no"}`,
  });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

export async function addBypassLogAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const shift = str(form, "shift") === "NIGHT" ? "NIGHT" : "DAY";
  const initials = str(form, "initials");
  const date = str(form, "date");
  if (!initials) return fail("Initials are required.");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc || moc.type !== "BYPASS") return fail("Bypass record not found.");
  if (moc.status !== "ACTIVE") return fail("The bypass is not active.");
  if (!isMemberOfSite(user, moc.siteId)) return fail("Not authorized.");
  await prisma.bypassLogEntry.create({
    data: {
      mocId,
      shift,
      initials,
      userId: user.id,
      date: date ? new Date(date) : new Date(),
    },
  });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

export async function requestBypassExtensionAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const expiration = str(form, "expiration");
  if (!expiration) return fail("A bypass expiration date is required.");
  const moc = await prisma.moc.findUnique({
    where: { id: mocId },
    include: { approvals: { where: { stage: "BYPASS_EXTENSION" } } },
  });
  if (!moc || moc.type !== "BYPASS") return fail("Bypass record not found.");
  if (moc.status !== "ACTIVE") return fail("The bypass is not active.");
  if (moc.leadId !== user.id && !user.isAdmin)
    return fail("Only the MOC Lead can request an extension.");
  if (moc.approvals.some((a) => a.decision === "PENDING"))
    return fail("An extension request is already pending.");

  const fd = parseFormData(moc.formData);
  fd.extensionExpiration = expiration;
  await prisma.moc.update({
    where: { id: mocId },
    data: { formData: JSON.stringify(fd), endDate: new Date(expiration) },
  });
  await openStage(mocId, BYPASS_EXTENSION_STAGE);
  await audit("Bypass extension (>72h) requested", {
    mocId,
    userId: user.id,
    detail: `Expiration ${expiration}`,
  });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

/** Record the date/time the safety system was restored (with the signature). */
export async function recordRestorationAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const mocId = str(form, "mocId");
  const restoredAt = str(form, "restoredAt");
  if (!restoredAt) return fail("Date and time restored is required.");
  const moc = await prisma.moc.findUnique({ where: { id: mocId } });
  if (!moc || moc.type !== "BYPASS") return fail("Bypass record not found.");
  if (moc.leadId !== user.id && !user.isAdmin) return fail("Only the MOC Lead can record this.");
  const fd = parseFormData(moc.formData);
  fd.restoredAt = restoredAt;
  await prisma.moc.update({ where: { id: mocId }, data: { formData: JSON.stringify(fd) } });
  await audit("Safety system restoration time recorded", {
    mocId,
    userId: user.id,
    detail: restoredAt,
  });
  revalidatePath(`/mocs/${mocId}`);
  return { ok: true };
}

// ─── Approval reassignment (Process Safety / admin) ─────────────────────────

export async function reassignApprovalAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const approvalId = str(form, "approvalId");
  const assignedToId = str(form, "assignedToId");
  if (!assignedToId) return fail("Select a person.");
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: { moc: true },
  });
  if (!approval) return fail("Signature request not found.");
  if (approval.decision !== "PENDING") return fail("Already decided.");
  const roles = user.memberships.find((m) => m.siteId === approval.moc.siteId)?.roles ?? [];
  if (!user.isAdmin && !roles.includes("PROCESS_SAFETY") && !roles.includes("EHSS_MANAGER"))
    return fail("Only Process Safety, the EHSS Manager, or an administrator can reassign signatures.");
  await prisma.approval.update({
    where: { id: approvalId },
    data: { assignedToId },
  });
  await notifyMany(
    [assignedToId],
    `${approval.moc.number} "${approval.moc.title}" needs your signature — ${approval.roleLabel}`,
    { mocId: approval.mocId, link: `/mocs/${approval.mocId}` }
  );
  await audit(`Signature reassigned: ${approval.roleLabel}`, {
    mocId: approval.mocId,
    userId: user.id,
  });
  revalidatePath(`/mocs/${approval.mocId}`);
  return { ok: true };
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

// ─── Admin: users & sites ───────────────────────────────────────────────────

export async function createUserAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const email = str(form, "email").toLowerCase();
  const name = str(form, "name");
  const password = form.get("password") as string | null;
  if (!email || !name) return fail("Name and email are required.");
  if (!password || password.length < 10)
    return fail("Password must be at least 10 characters.");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("A user with that email already exists.");
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      isAdmin: str(form, "isAdmin") === "1",
    },
  });
  await audit("User created", { userId: admin.id, detail: email });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const userId = str(form, "userId");
  const name = str(form, "name");
  const password = (form.get("password") as string | null) ?? "";
  const data: Record<string, unknown> = {
    active: str(form, "active") === "1",
    isAdmin: str(form, "isAdmin") === "1",
  };
  if (name) data.name = name;
  if (password) {
    if (password.length < 10) return fail("Password must be at least 10 characters.");
    data.passwordHash = await hashPassword(password);
  }
  if (userId === admin.id && data.isAdmin === false)
    return fail("You cannot remove your own administrator access.");
  await prisma.user.update({ where: { id: userId }, data });
  await audit("User updated", { userId: admin.id, detail: userId });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setMembershipAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const userId = str(form, "userId");
  const siteId = str(form, "siteId");
  const member = str(form, "member") === "1";
  const roles = SITE_ROLES.filter((r) => str(form, `role_${r}`) === "1");

  if (!member) {
    await prisma.siteMembership.deleteMany({ where: { userId, siteId } });
  } else {
    await prisma.siteMembership.upsert({
      where: { siteId_userId: { siteId, userId } },
      create: { siteId, userId, roles: roles.join(",") },
      update: { roles: roles.join(",") },
    });
  }
  await audit("Site membership updated", { userId: admin.id, detail: `${userId} @ ${siteId}` });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function createSiteAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const code = str(form, "code").toUpperCase();
  const name = str(form, "name");
  if (!/^[A-Z0-9]{2,6}$/.test(code))
    return fail("Site code must be 2-6 letters/digits (used in MOC numbers).");
  if (!name) return fail("Site name is required.");
  const existing = await prisma.site.findUnique({ where: { code } });
  if (existing) return fail("That site code is already in use.");
  await prisma.site.create({ data: { code, name } });
  await audit("Site created", { userId: admin.id, detail: code });
  revalidatePath("/admin/sites");
  return { ok: true };
}

// ─── Change own password ────────────────────────────────────────────────────

export async function changePasswordAction(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const current = form.get("current") as string | null;
  const next = form.get("next") as string | null;
  if (!current || !(await verifyPassword(user.id, current)))
    return fail("Current password is incorrect.");
  if (!next || next.length < 10) return fail("New password must be at least 10 characters.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  await audit("Password changed", { userId: user.id });
  return { ok: true };
}
