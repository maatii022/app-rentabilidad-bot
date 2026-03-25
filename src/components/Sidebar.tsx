"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendario", label: "Calendario" },
  { href: "/presets", label: "Presets" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/importacion", label: "Importación" },
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
          aria-label={expanded ? "Cerrar menú" : "Abrir menú"}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.08]"
        >
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 rounded-full bg-white" />
            <span className="block h-0.5 w-5 rounded-full bg-white" />
            <span className="block h-0.5 w-5 rounded-full bg-white" />
          </div>
        </button>

        <div
          className={`mt-4 rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),linear-gradient(180deg,rgba(10,18,32,0.58),rgba(8,16,28,0.44))] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 ${
            expanded ? "p-3" : "p-2"
          }`}
        >

          <nav className="space-y-1.5">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center rounded-2xl border transition ${
                    expanded
                      ? "justify-between px-3 py-3 text-sm font-medium"
                      : "justify-center px-2 py-3"
                  } ${
                    active
                      ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(56,189,248,0.05))] text-white shadow-[0_0_0_1px_rgba(125,211,252,0.05)]"
                      : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  title={!expanded ? link.label : undefined}
                >
                  {expanded ? (
                    <>
                      <span>{link.label}</span>
                      <span
                        className={`h-2 w-2 rounded-full transition ${
                          active
                            ? "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]"
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}
                      />
                    </>
                  ) : (
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        active
                          ? "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]"
                          : "bg-white/20 group-hover:bg-white/40"
                      }`}
                    />
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