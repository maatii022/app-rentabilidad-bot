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
  const [open, setOpen] = useState(true);

  return (
    <>
      <aside className="relative min-h-screen shrink-0">
        <div className="sticky top-0 flex h-screen">
          <div className="relative z-30 flex w-16 shrink-0 flex-col items-center border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,16,29,0.92),rgba(7,16,29,0.82))] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.08]"
            >
              <div className="flex flex-col gap-1">
                <span className="block h-0.5 w-5 rounded-full bg-white" />
                <span className="block h-0.5 w-5 rounded-full bg-white" />
                <span className="block h-0.5 w-5 rounded-full bg-white" />
              </div>
            </button>
          </div>

          <div
            className={`absolute left-16 top-0 z-20 h-screen w-64 transition-all duration-300 ${
              open
                ? "translate-x-0 opacity-100"
                : "-translate-x-5 opacity-0 pointer-events-none"
            }`}
          >
            <div className="h-full px-3 py-4">
              <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),linear-gradient(180deg,rgba(10,18,32,0.58),rgba(8,16,28,0.44))] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                <div className="mb-4 px-2">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    App rentabilidad bot
                  </p>
                </div>

                <nav className="space-y-1.5">
                  {links.map((link) => {
                    const active = isActivePath(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`group flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                          active
                            ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(56,189,248,0.05))] text-white shadow-[0_0_0_1px_rgba(125,211,252,0.05)]"
                            : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span>{link.label}</span>

                        <span
                          className={`h-2 w-2 rounded-full transition ${
                            active
                              ? "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]"
                              : "bg-white/10 group-hover:bg-white/20"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 bg-black/10"
        />
      )}
    </>
  );
}