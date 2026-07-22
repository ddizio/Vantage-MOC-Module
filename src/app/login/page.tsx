import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image src="/vantage-logo.png" alt="Vantage" width={160} height={44} priority />
          <h1 className="text-lg font-semibold text-ink">Management of Change</h1>
          <p className="text-xs text-ink-3 text-center">
            Electronic MOC review &amp; approval for safe, compliant change
          </p>
        </div>
        {params.error && (
          <p className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
            Sign-in failed. Check your email and password.
          </p>
        )}
        <form method="post" action="/api/login" className="space-y-4">
          {params.next && <input type="hidden" name="next" value={params.next} />}
          <label className="block text-sm">
            <span className="font-medium text-ink-2">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vantage-500"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-2">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vantage-500"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-vantage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vantage-600"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-3">
          No account? Contact your site EHS administrator.
        </p>
      </div>
    </div>
  );
}
