import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./db";
import type { SiteRole } from "./constants";

const SESSION_COOKIE = "vmoc_session";
const SESSION_HOURS = 12;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set to a random string of at least 16 characters."
      );
    }
    return new TextEncoder().encode("dev-only-insecure-session-secret");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  memberships: { siteId: string; roles: SiteRole[]; site: { id: string; code: string; name: string } }[];
};

/** Returns the logged-in user or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { site: true } } },
    });
    if (!user || !user.active) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      memberships: user.memberships.map((m) => ({
        siteId: m.siteId,
        roles: m.roles.split(",").filter(Boolean) as SiteRole[],
        site: { id: m.site.id, code: m.site.code, name: m.site.name },
      })),
    };
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("Administrator access required");
  return user;
}

export async function verifyPassword(
  userId: string,
  password: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function rolesAtSite(user: SessionUser, siteId: string): SiteRole[] {
  return user.memberships.find((m) => m.siteId === siteId)?.roles ?? [];
}

export function isMemberOfSite(user: SessionUser, siteId: string): boolean {
  return user.isAdmin || user.memberships.some((m) => m.siteId === siteId);
}
