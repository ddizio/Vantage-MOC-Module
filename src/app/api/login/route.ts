import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = ((form.get("email") as string) ?? "").trim().toLowerCase();
  const password = (form.get("password") as string) ?? "";
  const next = ((form.get("next") as string) ?? "/").trim();
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user && user.active && (await bcrypt.compare(password, user.passwordHash));

  if (!valid) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    if (safeNext !== "/") url.searchParams.set("next", safeNext);
    return NextResponse.redirect(url, 303);
  }

  await createSession(user.id);
  await audit("Signed in", { userId: user.id });
  return NextResponse.redirect(new URL(safeNext, request.url), 303);
}
