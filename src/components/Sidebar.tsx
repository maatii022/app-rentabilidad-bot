"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="min-h-screen w-64 border-r border-white/10 bg-[linear-gradient(180deg,#07101d_0%,#091425_45%,#08101c_100%)] px-3 py-4 text-white">
      <div className="sticky top-4">
        <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
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
                  className={`group flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.13),rgba(56,189,248,0.05))] text-white shadow-[0_0_0_1px_rgba(125,211,252,0.05)]"
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
    </aside>
  );
}