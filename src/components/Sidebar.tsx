"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
  { href: "/estadisticas", label: "Estadísticas", icon: AnalyticsIcon },
  { href: "/control", label: "Control", icon: SettingsIcon },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 13h3v7H4z" />
      <path d="M10.5 8h3v12h-3z" />
      <path d="M17 4h3v16h-3z" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M7 3.8v2.8" />
      <path d="M17 3.8v2.8" />
      <path d="M3.5 9.5h17" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 18l5-6 4 3 7-9" />
      <path d="M17 6h3v3" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.8v2.1" />
      <path d="M12 19.1v2.1" />
      <path d="M4.93 4.93l1.49 1.49" />
      <path d="M17.58 17.58l1.49 1.49" />
      <path d="M2.8 12h2.1" />
      <path d="M19.1 12h2.1" />
      <path d="M4.93 19.07l1.49-1.49" />
      <path d="M17.58 6.42l1.49-1.49" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-[92px] shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,#020814_0%,#040b16_35%,#050d18_68%,#030914_100%)]">
      <div className="relative flex h-full flex-col items-center px-3 py-5">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.06),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.035),transparent_22%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.025),transparent_20%)]" />

        <div className="relative z-10 w-full overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.008))] shadow-[0_22px_50px_rgba(0,0,0,0.24)] backdrop-blur-sm">
          <nav className="p-2.5">
            <div className="space-y-1.5">
              {links.map((link) => {
                const active = isActivePath(pathname, link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    title={link.label}
                    className={`group relative flex items-center justify-center rounded-2xl border px-2 py-3.5 transition-all duration-200 ${
                      active
                        ? "border-emerald-400/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(16,185,129,0.08))] text-emerald-300 shadow-[0_10px_24px_rgba(16,185,129,0.08)]"
                        : "border-transparent text-zinc-400 hover:border-white/6 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {active ? (
                      <>
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
                        <span className="absolute inset-x-3 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(52,211,153,0.35),transparent)]" />
                      </>
                    ) : null}

                    <span className="flex items-center justify-center">
                      <Icon />
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}