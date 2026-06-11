import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser, isMemberOfSite } from "@/lib/auth";
import { audit } from "@/lib/audit";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

function uploadDir() {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const moc = await prisma.moc.findUnique({ where: { id } });
  if (!moc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isMemberOfSite(user, moc.siteId))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (["CLOSED", "CANCELED"].includes(moc.status))
    return NextResponse.json({ error: "Record is closed" }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File exceeds 25 MB" }, { status: 400 });

  const storedName = crypto.randomUUID() + path.extname(file.name).slice(0, 12);
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(
    path.join(uploadDir(), storedName),
    Buffer.from(await file.arrayBuffer())
  );
  await prisma.attachment.create({
    data: {
      mocId: id,
      filename: file.name,
      storedName,
      size: file.size,
      uploadedById: user.id,
    },
  });
  await audit("Attachment uploaded", { mocId: id, userId: user.id, detail: file.name });
  return NextResponse.redirect(new URL(`/mocs/${id}`, request.url), 303);
}
