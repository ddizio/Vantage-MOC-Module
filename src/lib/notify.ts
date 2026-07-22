import { prisma } from "./db";

/**
 * In-app notification, plus email when SMTP is configured via env vars:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_URL.
 */
export async function notify(
  userId: string,
  message: string,
  opts: { mocId?: string; link?: string } = {}
) {
  await prisma.notification.create({
    data: { userId, message, mocId: opts.mocId, link: opts.link },
  });

  if (process.env.SMTP_HOST) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.email) return;
      const nodemailer = (await import("nodemailer")).default;
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "1",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      const base = process.env.APP_URL?.replace(/\/$/, "") ?? "";
      await transport.sendMail({
        from: process.env.SMTP_FROM ?? "moc@localhost",
        to: user.email,
        subject: `Vantage MOC: ${message}`,
        text: `${message}\n\n${opts.link ? base + opts.link : base}`,
      });
    } catch (err) {
      // Email is best-effort; the in-app notification is the system of record.
      console.error("Email notification failed:", err);
    }
  }
}

export async function notifyMany(
  userIds: string[],
  message: string,
  opts: { mocId?: string; link?: string } = {}
) {
  await Promise.all(
    [...new Set(userIds)].map((id) => notify(id, message, opts))
  );
}
