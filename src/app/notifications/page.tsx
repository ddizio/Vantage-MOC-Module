import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markNotificationsReadAction } from "@/app/actions";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread && (
          <form action={markNotificationsReadAction}>
            <button className="text-sm text-vantage-blue hover:underline">
              Mark all as read
            </button>
          </form>
        )}
      </div>
      <Card>
        {notifications.length === 0 ? (
          <p className="text-sm text-ink-3">No notifications.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li key={n.id} className={`py-2.5 text-sm ${n.readAt ? "text-ink-3" : "font-medium"}`}>
                {n.link ? (
                  <Link href={n.link} className="hover:text-vantage-700">
                    {n.message}
                  </Link>
                ) : (
                  n.message
                )}
                <span className="block text-xs text-ink-3 font-normal">
                  {n.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
