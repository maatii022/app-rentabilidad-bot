"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
  { href: "/estadisticas", label: "Estadísticas", icon: AnalyticsIcon },
  { href: "/control", label: "Control", icon: ControlIcon },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarToggleIcon() {
  return (
    <div className="flex flex-col gap-1">
      <span className="block h-0.5 w-5 rounded-full bg-white" />
      <span className="block h-0.5 w-5 rounded-full bg-white" />
      <span className="block h-0.5 w-5 rounded-full bg-white" />
    </div>
  );
}

function BotTrackerLogo() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
      <div className="absolute inset-[6px] rounded-[10px] border border-amber-300/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%),linear-gradient(180deg,rgba(13,18,30,0.95),rgba(9,13,24,0.95))]" />

      <svg
        viewBox="0 0 64 64"
        className="relative z-10 h-5.5 w-5.5"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 21c3-7 11-11 16-11s13 4 16 11"
          stroke="url(#hat)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M13 25c2-4 7-6 19-6s17 2 19 6"
          stroke="url(#hat)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <rect
          x="22"
          y="28"
          width="20"
          height="14"
          rx="7"
          stroke="url(#face)"
          strokeWidth="2.8"
        />
        <circle cx="28.5" cy="34.5" r="1.8" fill="#86d8ff" />
        <circle cx="35.5" cy="34.5" r="1.8" fill="#86d8ff" />
        <path
          d="M28 39c1.4 1 2.7 1.5 4 1.5s2.6-.5 4-1.5"
          stroke="#c8a97d"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="hat" x1="14" y1="12" x2="50" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0d6ad" />
            <stop offset="1" stopColor="#b98457" />
          </linearGradient>
          <linearGradient id="face" x1="22" y1="28" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b98457" />
            <stop offset="1" stopColor="#8e623e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function DashboardIcon({ active }: { active?: boolean }) {
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
      {active ? <path d="M4 18h16" /> : null}
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

function ControlIcon() {
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
      <path d="M12 3.5v17" />
      <path d="M5.5 8.5h4" />
      <path d="M14.5 15.5h4" />
      <circle cx="12" cy="8.5" r="2.2" />
      <circle cx="12" cy="15.5" r="2.2" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,#050b15_0%,#081120_45%,#07101c_100%)] transition-all duration-300 ${
        expanded ? "w-[272px]" : "w-[88px]"
      }`}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.08]"
        >
          <SidebarToggleIcon />
        </button>

        <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] shadow-[0_22px_50px_rgba(0,0,0,0.22)]">
          {expanded ? (
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-center gap-3">
                <BotTrackerLogo />
                <div className="min-w-0">
                  <p className="truncate text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Sistema
                  </p>
                  <p className="truncate text-[1.1rem] font-semibold tracking-tight text-white">
                    Bot Tracker
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center border-b border-white/8 px-2 py-4">
              <BotTrackerLogo />
            </div>
          )}

          <nav className={`${expanded ? "p-2.5" : "p-2"}`}>
            <div className="space-y-1.5">
              {links.map((link) => {
                const active = isActivePath(pathname, link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center rounded-2xl border transition-all duration-200 ${
                      expanded ? "gap-3 px-3 py-3.5" : "justify-center px-2 py-3.5"
                    } ${
                      active
                        ? "border-emerald-400/12 bg-[linear-gradient(90deg,rgba(16,185,129,0.18),rgba(16,185,129,0.08))] text-emerald-300 shadow-[0_12px_28px_rgba(16,185,129,0.08)]"
                        : "border-transparent text-zinc-300 hover:border-white/6 hover:bg-white/[0.045] hover:text-white"
                    }`}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                    ) : null}

                    <span
                      className={`flex shrink-0 items-center justify-center ${
                        active ? "text-emerald-300" : "text-zinc-400 group-hover:text-white"
                      }`}
                    >
                      <Icon active={active} />
                    </span>

                    {expanded ? (
                      <>
                        <span className="flex-1 truncate text-[15px] font-medium">
                          {link.label}
                        </span>

                        <span
                          className={`h-2.5 w-2.5 rounded-full transition-all ${
                            active
                              ? "bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]"
                              : "bg-white/20 group-hover:bg-white/35"
                          }`}
                        />
                      </>
                    ) : null}
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