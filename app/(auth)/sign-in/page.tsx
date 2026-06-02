import { auth, signIn } from "@/auth";
import { AnimateIn, Badge, ThemeToggle } from "@/components/ui";
import { ArrowRight, BarChart3, ShieldCheck, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in | Financial Command Center" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  const { callbackUrl } = await searchParams;
  const destination = callbackUrl ?? "/dashboard";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-surface-card/88 shadow-2xl shadow-black/25 backdrop-blur xl:min-h-[min(760px,calc(100vh-48px))] xl:grid-cols-[1.05fr_0.95fr]">
        <AnimateIn className="relative hidden min-h-full overflow-hidden border-r border-white/10 bg-surface-raised/70 p-8 xl:block">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-400 via-info-400 to-transparent" />

          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-sm font-bold text-brand-300">
                  FC
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Financial Command</p>
                  <p className="text-xs text-text-secondary">Personal CFO workspace</p>
                </div>
              </div>

              <Badge label="Create your workspace" tone="info" size="md" />
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-normal text-text-primary">
                Build a private command center for your finances.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-text-secondary">
                Import statements, review cash flow, monitor credit exposure and
                plan goals from a focused workspace built for fast decisions.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Product preview</p>
                  <TrendingUp aria-hidden="true" className="h-4 w-4 text-positive-400" strokeWidth={1.8} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-text-primary">$186k</p>
                    <p className="mt-1 text-xs text-text-secondary">Net worth</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-positive-400">+12%</p>
                    <p className="mt-1 text-xs text-text-secondary">Cash flow</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-warning-400">31%</p>
                    <p className="mt-1 text-xs text-text-secondary">Credit use</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <BarChart3 aria-hidden="true" className="h-5 w-5 text-info-400" strokeWidth={1.8} />
                  <p className="mt-4 text-sm font-medium text-text-primary">Analytics-first</p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Designed around metrics, trends and drill-downs.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-300" strokeWidth={1.8} />
                  <p className="mt-4 text-sm font-medium text-text-primary">Private by default</p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Your data is yours alone — isolated to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>

        <AnimateIn className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12" delay={0.06}>
          <div className="w-full max-w-md">
            <div className="mb-8 xl:hidden">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-brand-400/30 bg-brand-500/15 text-sm font-bold text-brand-300">
                  FC
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Financial Command</p>
                  <p className="text-xs text-text-secondary">Personal CFO workspace</p>
                </div>
              </div>
              <Badge label="Create your workspace" tone="info" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface-card p-5 shadow-2xl shadow-black/20 sm:p-7">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
                Sign in or sign up
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-text-primary">
                Create your workspace
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Continue with Google to set up your personal Financial Command Center. New here? Your account is created automatically.
              </p>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: destination });
                }}
                className="mt-7"
              >
                <button
                  className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-medium text-text-primary transition hover:border-brand-400/30 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
                  type="submit"
                >
                  <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-300"
                    strokeWidth={1.8}
                  />
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs leading-5 text-text-muted">
                  Authentication is handled securely through Google OAuth. We only use it to identify your workspace — we never see your password.
                </p>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </main>
  );
}
