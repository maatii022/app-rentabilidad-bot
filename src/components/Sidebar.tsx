"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendario", label: "Calendario" },
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/control", label: "Control" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 border-r border-white/10 bg-[linear-gradient(180deg,#07101d_0%,#091425_45%,#08101c_100%)] transition-all duration-300 ${
        expanded ? "w-72" : "w-20"
      }`}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.08]"
        >
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </div>
        </button>

        <div className={`mt-4 rounded-[26px] border border-white/10 bg-white/[0.03] shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all duration-300 ${expanded ? "p-3" : "p-2"}`}>
          <nav className="space-y-1.5">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center rounded-2xl border transition ${
                    expanded
                      ? "justify-between px-3 py-3 text-sm"
                      : "justify-center px-2 py-3"
                  } ${
                    active
                      ? "border-sky-300/20 bg-sky-400/[0.12] text-white"
                      : "border-transparent text-zinc-300 hover:bg-white/[0.05]"
                  }`}
                >
                  {expanded ? (
                    <>
                      <span>{link.label}</span>
                      <span className={`h-2 w-2 rounded-full ${active ? "bg-sky-300" : "bg-white/20"}`} />
                    </>
                  ) : (
                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-sky-300" : "bg-white/20"}`} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}