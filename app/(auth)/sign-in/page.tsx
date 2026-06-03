import { auth, signIn } from "@/auth";
import { AnimateIn, ThemeToggle } from "@/components/ui";
import { ArrowRight, BarChart3, LockKeyhole, ShieldCheck, TrendingUp } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";

export const metadata = { title: "Sign in | Financial Command Center" };

const authTheme = {
  "--color-primary": "#6ee7b7",
  "--color-primary-container": "#10b981",
  "--color-on-primary-container": "#022c22",
  "--color-background": "#141313",
  "--color-on-background": "#e5e2e1",
  "--color-on-surface": "#e5e2e1",
  "--color-on-surface-variant": "#b9d8cc",
  "--color-surface-container": "#201f1f",
  "--color-surface-container-low": "#1c1b1b",
  "--color-outline-variant": "#24483d",
} as CSSProperties;

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
    <main
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-4 py-6 text-on-surface sm:px-6 sm:py-10 lg:px-8 lg:py-24"
      style={authTheme}
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <Image
          alt=""
          className="data-mountain data-mountain-hero h-full w-full object-cover object-center opacity-75"
          fill
          priority
          sizes="100vw"
          src="/landing/data-terrain.svg"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,19,19,0.58)_0%,rgba(20,19,19,0.78)_45%,rgba(20,19,19,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,19,19,0.96)_0%,rgba(20,19,19,0.42)_50%,rgba(20,19,19,0.96)_100%)]" />
        <div className="absolute inset-0 grid-background opacity-25" />
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-2xl border border-primary/15 bg-background/74 shadow-2xl shadow-black/40 backdrop-blur-xl lg:min-h-[min(760px,calc(100dvh-96px))] lg:grid-cols-[1.05fr_0.95fr]">
        <AnimateIn className="relative hidden overflow-hidden border-r border-primary/10 bg-surface-container-low/72 p-10 lg:block">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary-container/15 text-sm font-bold text-primary">
                  FC
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Financial Command</p>
                  <p className="text-xs text-on-surface-variant">Espacio CFO personal</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
                Beta privada
              </div>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-normal text-on-surface sm:text-5xl lg:text-6xl">
                Tu centro de mando financiero privado.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-on-surface-variant sm:text-base">
                Importa estados de cuenta, revisa flujo de caja, monitorea credito
                y convierte tus movimientos en decisiones claras.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:mt-0">
              <div className="premium-glow-hover rounded-xl border border-primary/15 bg-surface-container/68 p-4 shadow-2xl shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Vista previa</p>
                  <TrendingUp aria-hidden="true" className="h-4 w-4 text-primary" strokeWidth={1.8} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-on-surface">$186k</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Patrimonio</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-primary">+12%</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Flujo</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-warning-400">31%</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Uso de credito</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-primary/12 bg-surface-container/52 p-4">
                  <BarChart3 aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  <p className="mt-4 text-sm font-medium text-on-surface">Analitica primero</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Disenado para revisar metricas, tendencias y detalle.
                  </p>
                </div>
                <div className="rounded-xl border border-primary/12 bg-surface-container/52 p-4">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  <p className="mt-4 text-sm font-medium text-on-surface">Privado por defecto</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Tus datos son tuyos y quedan aislados en tu cuenta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>

        <AnimateIn className="flex items-center justify-center bg-background/54 px-5 py-10 sm:px-8 lg:px-12" delay={0.06}>
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary-container/15 text-sm font-bold text-primary">
                  FC
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Financial Command</p>
                  <p className="text-xs text-on-surface-variant">Espacio CFO personal</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
                Beta privada
              </div>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-normal text-on-surface">
                Tu centro financiero privado.
              </h1>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Importa, revisa y decide con claridad desde un espacio seguro.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-surface-container-low/86 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7">
              <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary-container/10 text-primary">
                <LockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary">
                Inicia sesion o registrate
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal text-on-surface">
                Crea tu espacio
              </h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Continua con Google para crear tu Financial Command Center personal. Si es tu primera vez, tu cuenta se crea automaticamente.
              </p>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: destination });
                }}
                className="mt-7"
              >
                <button
                  className="group flex w-full items-center justify-center gap-3 rounded-xl border border-primary/35 bg-primary-container px-4 py-3 text-sm font-semibold text-on-primary-container shadow-[0_0_34px_rgba(16,185,129,0.18)] transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
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
                  Continuar con Google
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 text-on-primary-container/70 transition group-hover:translate-x-0.5 group-hover:text-on-primary-container"
                    strokeWidth={1.8}
                  />
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-primary/12 bg-surface-container/60 px-4 py-3">
                <p className="text-xs leading-5 text-on-surface-variant">
                  La autenticacion se maneja de forma segura con Google OAuth. Solo la usamos para identificar tu espacio; nunca vemos tu contrasena.
                </p>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </main>
  );
}
