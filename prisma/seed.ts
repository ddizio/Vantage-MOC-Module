/**
 * Seeds the first administrator account and (optionally) demo data.
 *
 *   npm run db:seed          — creates the admin from ADMIN_EMAIL / ADMIN_NAME /
 *                              ADMIN_PASSWORD env vars (or safe defaults) and a
 *                              first site, only if the database is empty.
 *   SEED_DEMO=1 npm run db:seed — also creates demo users with site roles so
 *                              the full approval workflow can be exercised.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0 && !process.env.SEED_DEMO) {
    console.log("Database already has users — nothing to do.");
    return;
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@vantage.local").toLowerCase();
  const adminName = process.env.ADMIN_NAME ?? "MOC Administrator";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!2026";

  const site = await prisma.site.upsert({
    where: { code: process.env.SITE_CODE ?? "GUR" },
    create: {
      code: process.env.SITE_CODE ?? "GUR",
      name: process.env.SITE_NAME ?? "Gurnee",
    },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      isAdmin: true,
    },
    update: {},
  });
  await prisma.siteMembership.upsert({
    where: { siteId_userId: { siteId: site.id, userId: admin.id } },
    create: { siteId: site.id, userId: admin.id, roles: "PROCESS_SAFETY" },
    update: {},
  });
  console.log(`Admin ready: ${adminEmail}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  Default password: ${adminPassword}  — CHANGE IT after first sign-in.`);
  }

  if (process.env.SEED_DEMO) {
    const demoPassword = await bcrypt.hash("VantageDemo1!", 12);
    const demoUsers: [string, string, string][] = [
      // [name, email, comma-separated site roles]
      ["Karen Hitchcock", "karen@vantage.local", "PROCESS_SAFETY"],
      ["Pat Delaney", "pat@vantage.local", "PRODUCTION_MANAGER"],
      ["Terry Aguilar", "terry@vantage.local", "TECHNICAL_AUTHORITY"],
      ["Morgan Lee", "morgan@vantage.local", "MAINTENANCE_MANAGER"],
      ["Alex Rivera", "alex@vantage.local", "EHSS_MANAGER"],
      ["Sam Okafor", "sam@vantage.local", "SITE_MANAGER"],
      ["Jamie Chen", "jamie@vantage.local", ""],
    ];
    for (const [name, email, roles] of demoUsers) {
      const u = await prisma.user.upsert({
        where: { email },
        create: { email, name, passwordHash: demoPassword },
        update: {},
      });
      await prisma.siteMembership.upsert({
        where: { siteId_userId: { siteId: site.id, userId: u.id } },
        create: { siteId: site.id, userId: u.id, roles },
        update: { roles },
      });
    }
    console.log("Demo users created (password: VantageDemo1!)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
