import { prisma } from "./db";

export async function audit(
  action: string,
  opts: { mocId?: string; userId?: string; detail?: string } = {}
) {
  await prisma.auditEntry.create({
    data: {
      action,
      mocId: opts.mocId,
      userId: opts.userId,
      detail: opts.detail,
    },
  });
}
