import Link from "next/link";
import { APP_LOGO, APP_NAME, APP_SHORT_TAGLINE } from "@/lib/constants";
import { logoutAction } from "@/lib/actions/auth";

type NavItem = { href: string; label: string; active?: boolean };

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const height = { sm: 64, md: 88, lg: 180 }[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={APP_LOGO}
      alt="United Group of Institutions — Allahabad · Greater Noida"
      height={height}
      className="block w-auto max-w-none object-contain object-left"
      style={{ height, width: "auto" }}
    />
  );
}

export function Shell({
  children,
  nav,
  user,
}: {
  children: React.ReactNode;
  nav?: NavItem[];
  user?: { name?: string | null; role?: string } | null;
}) {
  return (
    <>
      <div className="bg-orb bg-orb-a" aria-hidden />
      <div className="bg-orb bg-orb-b" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-[min(1180px,calc(100%-2rem))] items-center gap-4 py-2.5">
          <Link href="/" className="flex min-w-[230px] items-center gap-3 text-ink no-underline">
            <BrandMark size="sm" />
            <span className="flex flex-col leading-tight">
              <strong className="font-[family-name:var(--font-display)] text-[1.15rem] tracking-tight text-brand-deep">
                {APP_NAME}
              </strong>
              <small className="max-w-[220px] text-[0.62rem] font-normal leading-snug text-muted">
                {APP_SHORT_TAGLINE}
              </small>
            </span>
          </Link>

          {nav ? (
            <nav className="flex max-w-full flex-1 flex-wrap gap-1 overflow-x-auto text-[0.82rem]">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium no-underline transition ${
                    item.active
                      ? "bg-brand-soft text-brand-deep"
                      : "text-ink-soft hover:bg-brand-soft hover:text-brand-deep"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="flex-1" />
          )}

          {user ? (
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <strong className="block text-sm">{user.name}</strong>
                <small className="text-xs capitalize text-muted">{user.role}</small>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-line bg-transparent px-3 py-2 text-sm font-semibold text-ink-soft"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <main className="relative z-[1] mx-auto w-[min(1180px,calc(100%-2rem))] py-6 pb-12">
        {children}
      </main>
      <footer className="relative z-[1] mx-auto mb-8 flex w-[min(1180px,calc(100%-2rem))] flex-wrap justify-between gap-3 text-sm text-muted">
        <span>
          {APP_NAME} · United Group of Institutions
        </span>
        <span>Allahabad · Greater Noida</span>
      </footer>
    </>
  );
}

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3vw,2.3rem)] tracking-tight">
          {title}
        </h1>
        {subtitle ? <p className="mt-1.5 text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Card({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section
      className={`mb-4 rounded-[18px] border border-line bg-white/78 p-5 shadow-[var(--shadow)] backdrop-blur-sm animate-rise ${className}`}
    >
      {title ? (
        <h2 className="mt-0 font-[family-name:var(--font-display)] text-xl tracking-tight">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

export function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-4 shadow-[var(--shadow)] animate-rise">
      <span className="text-sm text-muted">{label}</span>
      <strong className="mt-1 block font-[family-name:var(--font-display)] text-[1.7rem] text-brand-deep">
        {value}
      </strong>
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "ok" | "warn" | "danger" | "info" | "muted";
}) {
  const tones = {
    ok: "bg-[#dcfae6] text-ok",
    warn: "bg-[#ffefd6] text-warn",
    danger: "bg-[#fee4e2] text-danger",
    info: "bg-[#e0f2fe] text-info",
    muted: "bg-paper text-muted",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold capitalize ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): "ok" | "warn" | "danger" | "info" | "muted" {
  if (["active", "approved", "completed"].includes(status)) return "ok";
  if (["pending", "under_review", "submitted"].includes(status)) return "warn";
  if (["revision", "archived"].includes(status)) return status === "revision" ? "danger" : "muted";
  if (status === "draft") return "muted";
  return "info";
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_4px_rgba(51,77,147,0.14)]";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#334d93] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(51,77,147,0.28)] transition hover:-translate-y-0.5 hover:bg-[#243771]";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-xl bg-[#d9e1f5] px-4 py-3 text-sm font-semibold text-[#1a2440] transition hover:bg-[#c5d0ec]";

export const btnGhost =
  "inline-flex items-center justify-center rounded-xl border border-line bg-transparent px-3 py-2 text-sm font-semibold text-ink-soft";

export const btnAccent =
  "inline-flex items-center justify-center rounded-xl bg-[#d62027] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(214,32,39,0.25)] transition hover:-translate-y-0.5 hover:bg-[#b91b21]";
