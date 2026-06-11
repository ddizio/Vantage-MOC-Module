import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isMemberOfSite } from "@/lib/auth";
import { parseFormData } from "@/lib/forms";
import { EditMocForm } from "@/components/edit-moc-form";
import type { MocType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function EditMocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const moc = await prisma.moc.findUnique({ where: { id } });
  if (!moc || !isMemberOfSite(user, moc.siteId)) notFound();
  const canEdit =
    (moc.leadId === user.id || moc.createdById === user.id || user.isAdmin) &&
    ["DRAFT", "REJECTED"].includes(moc.status);
  if (!canEdit) redirect(`/mocs/${id}`);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Edit {moc.number}</h1>
      <p className="text-sm text-ink-3 mb-6">
        Drafts can be edited until they are submitted. The hazard assessment
        (and therefore the level) is fixed at creation — if it was wrong,
        cancel this record and start a new one.
      </p>
      <EditMocForm
        mocId={moc.id}
        type={moc.type as MocType}
        level={moc.level}
        defaults={{
          title: moc.title,
          changeType: moc.changeType,
          startDate: moc.startDate?.toISOString().slice(0, 10) ?? "",
          endDate: moc.endDate?.toISOString().slice(0, 10) ?? "",
          ...parseFormData(moc.formData),
        }}
      />
    </div>
  );
}
