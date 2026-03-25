"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumen general",
  },
  {
    href: "/calendario",
    label: "Calendario",
    description: "Fechas y control",
  },
  {
    href: "/presets",
    label: "Presets",
    description: "Configuración base",
  },
  {
    href: "/cuentas",
    label: "Cuentas",
    description: "Gestión operativa",
  },
  {
    href: "/importacion",
    label: "Importación",
    description: "Carga de datos",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-72 border-r border-white/10 bg-[linear-gradient(180deg,#081120_0%,#0a1325_45%,#09101d_100%)] px-4 py-5 text-white">
      <div className="sticky top-0">
        <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              App rentabilidad bot
            </p>

            <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Panel principal
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Control de rendimiento, seguimiento diario y sistema SORD.
            </p>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group block rounded-2xl border px-3 py-3 transition ${
                    active
                      ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(56,189,248,0.06))] shadow-[0_0_0_1px_rgba(125,211,252,0.05)]"
                      : "border-white/8 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium transition ${
                          active
                            ? "text-white"
                            : "text-zinc-200 group-hover:text-white"
                        }`}
                      >
                        {link.label}
                      </p>

                      <p
                        className={`mt-1 text-xs transition ${
                          active
                            ? "text-sky-100/80"
                            : "text-zinc-500 group-hover:text-zinc-400"
                        }`}
                      >
                        {link.description}
                      </p>
                    </div>

                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${
                        active
                          ? "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.75)]"
                          : "bg-white/10 group-hover:bg-white/20"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Navegación
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Acceso rápido a las secciones principales de la app.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}