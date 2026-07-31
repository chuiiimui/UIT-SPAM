import Link from "next/link";
import { APP_LOGO, APP_NAME, APP_SHORT_TAGLINE } from "@/lib/constants";
import { logoutAction } from "@/lib/actions/auth";

type NavItem = { href: string; label: string; active?: boolean };

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heightClass = {
    sm: "h-10 sm:h-14",
    md: "h-14 sm:h-[88px]",
    lg: "h-24 sm:h-36 md:h-[180px]",
  }[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={APP_LOGO}
      alt="United Group of Institutions — Allahabad · Greater Noida"
      className={`block w-auto max-w-[min(100%,280px)] object-contain object-left ${heightClass}`}
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
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-[min(1180px,calc(100%-1rem))] flex-col gap-2 py-2.5 sm:w-[min(1180px,calc(100%-2rem))] sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center gap-2 text-ink no-underline sm:gap-3 sm:flex-none"
            >
              <BrandMark size="sm" />
              <span className="flex min-w-0 flex-col leading-tight">
                <strong className="truncate font-[family-name:var(--font-display)] text-[1rem] tracking-tight text-brand-deep sm:text-[1.15rem]">
                  {APP_NAME}
                </strong>
                <small className="hidden max-w-[220px] text-[0.62rem] font-normal leading-snug text-muted sm:block">
                  {APP_SHORT_TAGLINE}
                </small>
              </span>
            </Link>

            {user ? (
              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="min-w-0 text-right">
                  <strong className="block max-w-[96px] truncate text-xs sm:max-w-[180px] sm:text-sm">
                    {user.name}
                  </strong>
                  <small className="text-[0.65rem] capitalize text-muted sm:text-xs">{user.role}</small>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-xl border border-line bg-transparent px-2.5 py-2 text-xs font-semibold text-ink-soft sm:px-3 sm:text-sm"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          {nav ? (
            <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 text-[0.82rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium no-underline transition ${
                    item.active
                      ? "bg-brand-soft text-brand-deep"
                      : "text-ink-soft hover:bg-brand-soft hover:text-brand-deep"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      <main className="relative z-[1] mx-auto w-[min(1180px,calc(100%-1rem))] py-4 pb-10 sm:w-[min(1180px,calc(100%-2rem))] sm:py-6 sm:pb-12">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer relative z-[1] mt-4">
      <div className="site-footer-rule" aria-hidden />
      <div className="mx-auto flex w-[min(1180px,calc(100%-1rem))] flex-col items-center gap-3 px-2 py-8 text-center sm:w-[min(1180px,calc(100%-2rem))] sm:py-10">
        <p className="m-0 font-[family-name:var(--font-display)] text-[0.7rem] font-medium uppercase tracking-[0.22em] text-brand/70">
          Crafted for campus
        </p>
        <p className="site-footer-credit m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.95rem] text-ink-soft sm:text-[1.05rem]">
          <span>Made with</span>
          <span className="site-footer-heart inline-flex items-center justify-center" aria-label="love">
            <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" fill="currentColor" aria-hidden>
              <path d="M12 21s-6.7-4.35-9.33-8.1C.7 9.95 1.5 6.4 4.4 5.05 6.55 4.05 9.05 4.7 12 7.15c2.95-2.45 5.45-3.1 7.6-2.1 2.9 1.35 3.7 4.9 1.73 7.85C18.7 16.65 12 21 12 21z" />
            </svg>
          </span>
          <span>
            by{" "}
            <span className="font-[family-name:var(--font-display)] text-[1.05em] font-semibold tracking-tight text-brand-deep">
              Harsh Srivastava
            </span>
          </span>
        </p>
        <div className="flex items-center gap-3 text-[0.72rem] text-muted">
          <span className="h-px w-8 bg-[rgba(51,77,147,0.22)]" aria-hidden />
          <span>© {year}</span>
          <span className="h-px w-8 bg-[rgba(51,77,147,0.22)]" aria-hidden />
        </div>
      </div>
    </footer>
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
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="m-0 break-words font-[family-name:var(--font-display)] text-[clamp(1.4rem,5vw,2.3rem)] tracking-tight">
          {title}
        </h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
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
      className={`mb-4 rounded-[16px] border border-line bg-white/78 p-4 shadow-[var(--shadow)] backdrop-blur-sm animate-rise sm:rounded-[18px] sm:p-5 ${className}`}
    >
      {title ? (
        <h2 className="mt-0 font-[family-name:var(--font-display)] text-lg tracking-tight sm:text-xl">
          {title}
        </h2>
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
  if (["pending", "pending_admin", "forming", "under_review", "submitted"].includes(status)) {
    return "warn";
  }
  if (["revision", "rejected", "archived"].includes(status)) {
    return status === "archived" ? "muted" : "danger";
  }
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
  "w-full max-w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base text-ink outline-none transition focus:border-brand focus:shadow-[0_0_0_4px_rgba(51,77,147,0.14)] sm:px-3.5 sm:py-3 sm:text-[0.95rem]";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#334d93] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(51,77,147,0.28)] transition hover:bg-[#243771] sm:min-h-0 sm:py-3 sm:hover:-translate-y-0.5";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#d9e1f5] px-4 py-2.5 text-sm font-semibold text-[#1a2440] transition hover:bg-[#c5d0ec] sm:min-h-0 sm:py-3";

export const btnGhost =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-transparent px-3 py-2 text-sm font-semibold text-ink-soft";

export const btnAccent =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#d62027] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(214,32,39,0.25)] transition hover:bg-[#b91b21] sm:min-h-0 sm:py-3 sm:hover:-translate-y-0.5";
