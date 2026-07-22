// End-to-end workflow engine test against the dev database.
import { PrismaClient } from "@prisma/client";
import { submitMoc, openStage, progressAfterApproval, nextMocNumber, pendingManualStage } from "../src/lib/moc-service";
import { WORKFLOWS } from "../src/lib/workflow";
import { determineLevel } from "../src/lib/constants";

const prisma = new PrismaClient();
let failures = 0;
function check(cond: boolean, msg: string) {
  console.log(`${cond ? "PASS" : "FAIL"}: ${msg}`);
  if (!cond) failures++;
}

async function signAll(mocId: string, stage: string) {
  const approvals = await prisma.approval.findMany({ where: { mocId, stage, decision: "PENDING" } });
  for (const a of approvals) {
    await prisma.approval.update({
      where: { id: a.id },
      data: { decision: "APPROVED", signedName: "Test Signer", decidedAt: new Date() },
    });
    await progressAfterApproval(mocId, stage);
  }
}

async function main() {
  // level matrix
  check(determineLevel("LOW", "LOW") === 1, "matrix LOW/LOW -> 1");
  check(determineLevel("LOW", "HIGH") === 2, "matrix LOW/HIGH -> 2");
  check(determineLevel("HIGH", "LOW") === 3, "matrix HIGH/LOW -> 3");
  check(determineLevel("HIGH", "HIGH") === 4, "matrix HIGH/HIGH -> 4");

  const site = await prisma.site.findFirstOrThrow();
  const lead = await prisma.user.findUniqueOrThrow({ where: { email: "jamie@vantage.local" } });
  const relevant = await prisma.user.findUniqueOrThrow({ where: { email: "pat@vantage.local" } });

  // ── LEVEL 2 full flow ──
  const num = await nextMocNumber(site.id);
  check(/^GUR-\d{4}-\d{4}$/.test(num), `MOC number format: ${num}`);
  const moc = await prisma.moc.create({
    data: {
      number: num, siteId: site.id, type: "LEVEL2", level: 2, title: "Test L2",
      leadId: lead.id, createdById: lead.id, degreeOfHazard: "LOW", significance: "HIGH",
      formData: JSON.stringify({ phaType: "NONE", summary: "x", technicalBasis: "y" }),
    },
  });
  await submitMoc(moc.id, {});
  const mA = await prisma.moc.findUniqueOrThrow({ where: { id: moc.id }, include: { approvals: true } });
  check(mA.status === "REVIEW", "L2 submitted -> REVIEW");
  check(mA.approvals.length === 5, `L2 has 5 approval-to-proceed signatures (got ${mA.approvals.length})`);
  check(mA.approvals.every(a => a.assignedToId), "all 5 signatures routed to role holders");

  await signAll(moc.id, "APPROVAL_TO_PROCEED");
  const mB = await prisma.moc.findUniqueOrThrow({ where: { id: moc.id } });
  check(mB.status === "IMPLEMENTATION", "L2 all approved -> IMPLEMENTATION");

  const manual = await pendingManualStage(moc.id);
  check(manual?.stage === "HANDOVER", "next manual stage is HANDOVER");
  await openStage(moc.id, manual!);
  await prisma.moc.update({ where: { id: moc.id }, data: { status: manual!.status } });
  await signAll(moc.id, "HANDOVER");
  const mC = await prisma.moc.findUniqueOrThrow({ where: { id: moc.id }, include: { approvals: true } });
  check(mC.status === "CLOSEOUT", "handover signed -> CLOSEOUT");
  check(mC.approvals.some(a => a.stage === "CLOSEOUT"), "closeout approvals auto-opened");
  await signAll(moc.id, "CLOSEOUT");
  const mD = await prisma.moc.findUniqueOrThrow({ where: { id: moc.id } });
  check(mD.status === "CLOSED" && !!mD.closedAt, "closeout signed -> CLOSED with closedAt");

  // ── LEVEL 1 with rejection ──
  const moc1 = await prisma.moc.create({
    data: {
      number: await nextMocNumber(site.id), siteId: site.id, type: "LEVEL1", level: 1,
      title: "Test L1", leadId: lead.id, createdById: lead.id,
      degreeOfHazard: "LOW", significance: "LOW", formData: "{}",
    },
  });
  await submitMoc(moc1.id, { relevantManagerId: relevant.id });
  const m1 = await prisma.moc.findUniqueOrThrow({ where: { id: moc1.id }, include: { approvals: true } });
  check(m1.approvals.length === 2, "L1 functional review has 2 signatures");
  check(m1.approvals.find(a => a.roleKey === "RELEVANT_MANAGER")?.assignedToId === relevant.id, "relevant manager routed to named user");

  // ── MOOC auto-open chain ──
  const mooc = await prisma.moc.create({
    data: {
      number: await nextMocNumber(site.id), siteId: site.id, type: "MOOC",
      title: "Test MOOC", leadId: lead.id, createdById: lead.id, formData: "{}",
    },
  });
  await submitMoc(mooc.id, { relevantManagerId: relevant.id });
  await signAll(mooc.id, "TRANSITION_PLAN");
  const mmA = await prisma.moc.findUniqueOrThrow({ where: { id: mooc.id }, include: { approvals: true } });
  check(mmA.status === "REVIEW", "MOOC stays REVIEW after transition plan");
  check(mmA.approvals.some(a => a.stage === "FINAL_APPROVAL"), "site manager FINAL_APPROVAL auto-opened");
  await signAll(mooc.id, "FINAL_APPROVAL");
  const mmB = await prisma.moc.findUniqueOrThrow({ where: { id: mooc.id } });
  check(mmB.status === "IMPLEMENTATION", "MOOC final approval -> IMPLEMENTATION");

  // ── BYPASS ──
  const byp = await prisma.moc.create({
    data: {
      number: await nextMocNumber(site.id), siteId: site.id, type: "BYPASS",
      title: "Test Bypass", leadId: lead.id, createdById: lead.id, formData: "{}",
    },
  });
  await submitMoc(byp.id, { approvingManagerId: relevant.id });
  await signAll(byp.id, "BYPASS_APPROVAL");
  const bbA = await prisma.moc.findUniqueOrThrow({ where: { id: byp.id }, include: { approvals: true } });
  check(bbA.status === "ACTIVE", "bypass approved -> ACTIVE");
  check(bbA.approvals.some(a => a.stage === "RESTORATION" && a.decision === "PENDING"), "restoration signature auto-opened");
  await signAll(byp.id, "RESTORATION");
  const bbB = await prisma.moc.findUniqueOrThrow({ where: { id: byp.id } });
  check(bbB.status === "CLOSED", "restoration signed -> CLOSED");

  // workflow definitions sanity
  for (const [t, stages] of Object.entries(WORKFLOWS)) {
    check(stages.length > 0 && stages[stages.length - 1].nextStatus === "CLOSED", `${t} workflow terminates in CLOSED`);
  }

  // cleanup test mocs
  await prisma.moc.deleteMany({ where: { title: { startsWith: "Test " } } });
  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}
main().finally(() => prisma.$disconnect());
