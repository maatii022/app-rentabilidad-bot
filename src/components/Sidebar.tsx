"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0b1220]/90 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:bg-[#111a2c]"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        <div className="flex flex-col gap-1">
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
        </div>
      </button>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/10 bg-[#08101d]/95 px-4 py-20 text-white backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white text-black"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}