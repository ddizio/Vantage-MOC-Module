import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getCurrentUser, isMemberOfSite } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { moc: true },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isMemberOfSite(user, attachment.moc.siteId))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
  try {
    const data = await readFile(path.join(dir, attachment.storedName));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Disposition": `attachment; filename="${attachment.filename.replace(/"/g, "")}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing from storage" }, { status: 404 });
  }
}
