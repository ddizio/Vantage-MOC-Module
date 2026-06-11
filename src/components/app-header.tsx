import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions";

export async function AppHeader() {
  const user = await getCurrentUser();

  const unread = user
    ? await prisma.notification.count({
        where: { userId: user.id, readAt: null },
      })
    : 0;

  return (
    <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/vantage-logo.png"
            alt="Vantage"
            width={118}
            height={33}
            priority
          />
          <span className="text-sm font-semibold tracking-wide text-vantage-600 border-l border-gray-300 pl-3">
            MOC
          </span>
        </Link>
        {user && (
          <>
            <nav className="flex items-center gap-1 text-sm font-medium text-ink-2">
              <Link href="/" className="px-3 py-2 rounded-md hover:bg-vantage-50 hover:text-vantage-700">
                Dashboard
              </Link>
              <Link href="/mocs" className="px-3 py-2 rounded-md hover:bg-vantage-50 hover:text-vantage-700">
                MOC Register
              </Link>
              <Link
                href="/mocs/new"
                className="px-3 py-2 rounded-md bg-vantage-500 text-white hover:bg-vantage-600"
              >
                + New MOC
              </Link>
              <Link href="/help" className="px-3 py-2 rounded-md hover:bg-vantage-50 hover:text-vantage-700">
                Help
              </Link>
              {user.isAdmin && (
                <Link href="/admin/users" className="px-3 py-2 rounded-md hover:bg-vantage-50 hover:text-vantage-700">
                  Admin
                </Link>
              )}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/notifications"
                className="relative p-2 rounded-md hover:bg-vantage-50"
                title="Notifications"
              >
                <svg className="w-5 h-5 text-ink-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-vantage-orange text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="text-sm text-ink-2 hover:text-vantage-700"
                title="My account"
              >
                {user.name}
              </Link>
              <form action={logoutAction}>
                <button className="text-sm text-ink-3 hover:text-vantage-orange" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
