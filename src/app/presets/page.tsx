import { supabase } from "@/lib/supabase";

type Preset = {
  id: number;
  nombre: string;
  activo: boolean | null;
};

type Pack = {
  id: number;
  preset_id: number | null;
};

type Account = {
  id: number;
  preset_id: number | null;
  estado: string | null;
};

type PresetMetric = {
  id: number;
  nombre: string;
  activo: boolean;
  packs: number;
  cuentasActivas: number;
  cuentasTotales: number;
  fondeadas: number;
  perdidas: number;
  fundedWinrate: number | null;
};

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
}

function normalizeEstado(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function buildPresetMetrics(
  presets: Preset[],
  packs: Pack[],
  accounts: Account[]
): PresetMetric[] {
  const packsByPreset = new Map<number, number>();
  const accountsByPreset = new Map<number, Account[]>();

  for (const pack of packs) {
    if (typeof pack.preset_id !== "number") continue;
    packsByPreset.set(pack.preset_id, (packsByPreset.get(pack.preset_id) ?? 0) + 1);
  }

  for (const account of accounts) {
    if (typeof account.preset_id !== "number") continue;

    const current = accountsByPreset.get(account.preset_id) ?? [];
    current.push(account);
    accountsByPreset.set(account.preset_id, current);
  }

  return presets.map((preset) => {
    const presetAccounts = accountsByPreset.get(preset.id) ?? [];

    const cuentasActivas = presetAccounts.filter(
      (account) => normalizeEstado(account.estado) === "activa"
    ).length;

    const fondeadas = presetAccounts.filter(
      (account) => normalizeEstado(account.estado) === "fondeada"
    ).length;

    const perdidas = presetAccounts.filter(
      (account) => normalizeEstado(account.estado) === "perdida"
    ).length;

    const fundedBase = fondeadas + perdidas;
    const fundedWinrate =
      fundedBase > 0 ? (fondeadas / fundedBase) * 100 : null;

    return {
      id: preset.id,
      nombre: preset.nombre,
      activo: Boolean(preset.activo),
      packs: packsByPreset.get(preset.id) ?? 0,
      cuentasActivas,
      cuentasTotales: presetAccounts.length,
      fondeadas,
      perdidas,
      fundedWinrate,
    };
  });
}

function MetricButton({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <button
      type="button"
      className="group relative cursor-pointer overflow-hidden rounded-[18px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-[2px] hover:border-white/24 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04),0_18px_34px_rgba(0,0,0,0.30)] active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_20px_rgba(0,0,0,0.22)]"
      title="Más adelante abrirá la página de cuentas con este filtro"
    >
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/20 opacity-80" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_58%)] opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="pointer-events-none absolute -left-10 top-0 h-full w-16 rotate-[18deg] bg-white/6 blur-md transition-all duration-300 group-hover:left-[110%]" />

      <div className="relative z-10">
        <p className="text-center text-[10px] uppercase tracking-[0.14em] text-zinc-400 transition-colors duration-200 group-hover:text-zinc-300">
          {label}
        </p>
        <p className="mt-2 text-center text-xl font-semibold leading-none text-white transition-transform duration-200 group-hover:scale-[1.03]">
  {value}
</p>
      </div>
    </button>
  );
}

function WinratePanel({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-violet-400/16 bg-[linear-gradient(180deg,rgba(167,139,250,0.10),rgba(167,139,250,0.03))] px-4 py-5 shadow-[0_14px_30px_rgba(167,139,250,0.06)]">
      <p className="text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-center text-4xl font-semibold leading-none text-white">
        {formatPercent(value)}
      </p>
    </div>
  );
}

function PresetCard({ preset }: { preset: PresetMetric }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.05),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.012))] shadow-[0_18px_38px_rgba(0,0,0,0.20)] transition-all duration-300 hover:shadow-[0_22px_44px_rgba(0,0,0,0.24)]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xl font-semibold tracking-tight text-white">
            {preset.nombre}
          </p>

          <span className="rounded-full border border-sky-300/18 bg-sky-300/[0.10] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-sky-100 shadow-[0_8px_18px_rgba(56,189,248,0.06)]">
            Activo
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <MetricButton label="Packs" value={preset.packs} />
          <MetricButton label="Activas" value={preset.cuentasActivas} />
          <MetricButton label="Totales" value={preset.cuentasTotales} />
          <MetricButton label="Fondeadas" value={preset.fondeadas} />
          <MetricButton label="Perdidas" value={preset.perdidas} />
        </div>

        <div className="mt-3">
          <WinratePanel label="Funded winrate" value={preset.fundedWinrate} />
        </div>
      </div>
    </article>
  );
}

export default async function PresetsPage() {
  const [presetsResponse, packsResponse, accountsResponse] = await Promise.all([
    supabase
      .from("presets")
      .select("id, nombre, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true }),

    supabase.from("packs").select("id, preset_id"),

    supabase.from("accounts").select("id, preset_id, estado"),
  ]);

  const error =
    presetsResponse.error ||
    packsResponse.error ||
    accountsResponse.error;

  if (error) {
    return (
      <div className="space-y-5 text-white">
        <section className="rounded-[28px] border border-rose-400/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(244,63,94,0.04))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200/70">
            App rentabilidad bot
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
            Presets
          </h1>
          <p className="mt-3 text-sm text-rose-200">
            Error cargando la página de presets: {error.message}
          </p>
        </section>
      </div>
    );
  }

  const presets = (presetsResponse.data || []) as Preset[];
  const packs = (packsResponse.data || []) as Pack[];
  const accounts = (accountsResponse.data || []) as Account[];

  const metrics = buildPresetMetrics(presets, packs, accounts);

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              App rentabilidad bot
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Presets
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-[0_10px_24px_rgba(255,255,255,0.03)]">
              {metrics.length} preset{metrics.length === 1 ? "" : "s"} activo{metrics.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.05),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white">Presets activos</h2>
        </div>

        {metrics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
            No hay presets activos para mostrar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {metrics.map((preset) => (
              <PresetCard key={preset.id} preset={preset} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}