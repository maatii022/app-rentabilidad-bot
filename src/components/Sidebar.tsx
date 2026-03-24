import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendario", label: "Calendario" },
  { href: "/presets", label: "Presets" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/importacion", label: "Importación" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#111827] border-r border-white/10 p-4">
      <div className="mb-8">
        <h1 className="text-lg font-semibold">App Rendimiento Bot</h1>
        <p className="text-sm text-gray-400 mt-1">Control de rendimiento y SORD</p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}