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
    <>
      <aside className="relative z-40 h-screen shrink-0">
        <div className="sticky top-0 flex h-screen">
          <div className="flex w-16 shrink-0 flex-col items-center border-r border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96),rgba(7,12,22,0.88))] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.07]"
            >
              <div className="flex flex-col gap-1">
                <span className="block h-0.5 w-5 rounded-full bg-white" />
                <span className="block h-0.5 w-5 rounded-full bg-white" />
                <span className="block h-0.5 w-5 rounded-full bg-white" />
              </div>
            </button>
          </div>

          <div
            className={`absolute left-16 top-0 h-screen w-64 transition-all duration-300 ${
              open
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0 pointer-events-none"
            }`}
          >
            <div className="h-full border-r border-white/10 bg-[linear-gradient(180deg,rgba(9,15,28,0.78),rgba(9,15,28,0.68))] px-3 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <nav className="mt-14 flex flex-col gap-1.5">
                {links.map((link) => {
                  const active = isActivePath(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-white/[0.10] text-white border border-white/10"
                          : "text-zinc-300 border border-transparent hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/15"
        />
      )}
    </>
  );
}