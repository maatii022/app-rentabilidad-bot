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
  const [open, setOpen] = useState(false);

  return (
    <aside className="relative h-screen shrink-0">
      <div className="sticky top-0 flex h-screen">
        <div className="relative z-30 flex w-16 shrink-0 flex-col items-center border-r border-white/10 bg-[rgba(5,10,20,0.88)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]"
          >
            <div className="flex flex-col gap-1">
              <span className="block h-0.5 w-5 rounded-full bg-white" />
              <span className="block h-0.5 w-5 rounded-full bg-white" />
              <span className="block h-0.5 w-5 rounded-full bg-white" />
            </div>
          </button>
        </div>

        <div
          className={`pointer-events-none absolute left-16 top-0 z-20 h-screen w-[272px] transition-all duration-300 ${
            open ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
          }`}
        >
          <div className="pointer-events-auto h-full border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,13,24,0.82),rgba(7,13,24,0.72))] px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
            <nav className="mt-14 flex flex-col gap-2">
              {links.map((link) => {
                const active = isActivePath(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "border border-white/10 bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.10)]"
                        : "border border-transparent text-zinc-200 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {open && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-black/20"
          />
        )}
      </div>
    </aside>
  );
}