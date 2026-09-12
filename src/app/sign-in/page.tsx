import { signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  // Real, deliberate safety check: only ever redirect to a real, relative
  // path within this app - never follow a callbackUrl to an external
  // host, which would turn this into an open-redirect vector.
  const destination =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/properties";

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Sign in to Niwasthan
        </h1>
        <p className="mt-2 font-body text-sm text-ink-soft">
          Continue with Google to pick up where you left off.
        </p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: destination });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-sm border border-ink/15 bg-white px-5 py-3 font-body text-sm font-medium text-ink transition-colors hover:border-ink/30"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
