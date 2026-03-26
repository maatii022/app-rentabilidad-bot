import { supabase } from "@/lib/supabase";

type Preset = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean | null;
  created_at: string | null;
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

type DailyResult = {
  account_id: number;
  winning_trades: number | null;
  losing_trades: number | null;
};

type PresetMetric = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  packs: number;
  cuentas: number;
  fondeadas: number;
  perdidas: number;
  tradesWinrate: number | null;
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
  accounts: Account[],
  dailyResults: DailyResult[]
): PresetMetric[] {
  const packsByPreset = new Map<number, number>();
  const accountsByPreset = new Map<number, Account[]>();
  const presetByAccount = new Map<number, number>();

  for (const pack of packs) {
    if (typeof pack.preset_id !== "number") continue;
    packsByPreset.set(pack.preset_id, (packsByPreset.get(pack.preset_id) ?? 0) + 1);
  }

  for (const account of accounts) {
    if (typeof account.preset_id !== "number") continue;

    const current = accountsByPreset.get(account.preset_id) ?? [];
    current.push(account);
    accountsByPreset.set(account.preset_id, current);
    presetByAccount.set(account.id, account.preset_id);
  }

  const tradesByPreset = new Map<number, { winning: number; losing: number }>();

  for (const result of dailyResults) {
    const presetId = presetByAccount.get(result.account_id);
    if (typeof presetId !== "number") continue;

    const current = tradesByPreset.get(presetId) ?? { winning: 0, losing: 0 };
    current.winning += Number(result.winning_trades ?? 0);
    current.losing += Number(result.losing_trades ?? 0);
    tradesByPreset.set(presetId, current);
  }

  return presets.map((preset) => {
    const presetAccounts = accountsByPreset.get(preset.id) ?? [];

    const fondeadas = presetAccounts.filter(
      (account) => normalizeEstado(account.estado) === "fondeada"
    ).length;

    const perdidas = presetAccounts.filter(
      (account) => normalizeEstado(account.estado) === "perdida"
    ).length;

    const tradeTotals = tradesByPreset.get(preset.id) ?? { winning: 0, losing: 0 };
    const totalResolvedTrades = tradeTotals.winning + tradeTotals.losing;

    const tradesWinrate =
      totalResolvedTrades > 0
        ? (tradeTotals.winning / totalResolvedTrades) * 100
        : null;

    const fundedBase = fondeadas + perdidas;
    const fundedWinrate =
      fundedBase > 0
        ? (fondeadas / fundedBase) * 100
        : null;

    return {
      id: preset.id,
      nombre: preset.nombre,
      descripcion: preset.descripcion,
      activo: Boolean(preset.activo),
      packs: packsByPreset.get(preset.id) ?? 0,
      cuentas: presetAccounts.length,
      fondeadas,
      perdidas,
      tradesWinrate,
      fundedWinrate,
    };
  });
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-3 shadow-[0_10px_24px_rgba(255,255,255,0.025)]">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold leading-none text-white">
        {value}
      </p>
    </div>
  );
}

function RatioBlock({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold leading-none text-white">
        {formatPercent(value)}
      </p>
    </div>
  );
}

function PresetCard({ preset }: { preset: PresetMetric }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-semibold tracking-tight text-white">
                {preset.nombre}
              </h3>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300 shadow-[0_8px_18px_rgba(255,255,255,0.03)]">
                Activo
              </span>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {preset.descripcion?.trim()
                ? preset.descripcion
                : "Preset activo sin descripción adicional."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          <MetricTile label="Packs" value={preset.packs} />
          <MetricTile label="Cuentas" value={preset.cuentas} />
          <MetricTile label="Fondeadas" value={preset.fondeadas} />
          <MetricTile label="Perdidas" value={preset.perdidas} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
          <RatioBlock label="Trades winrate" value={preset.tradesWinrate} />
          <RatioBlock label="Funded winrate" value={preset.fundedWinrate} />
        </div>
      </div>
    </article>
  );
}

export default async function PresetsPage() {
  const [
    presetsResponse,
    packsResponse,
    accountsResponse,
    dailyResultsResponse,
  ] = await Promise.all([
    supabase
      .from("presets")
      .select("id, nombre, descripcion, activo, created_at")
      .eq("activo", true)
      .order("nombre", { ascending: true }),

    supabase
      .from("packs")
      .select("id, preset_id"),

    supabase
      .from("accounts")
      .select("id, preset_id, estado"),

    supabase
      .from("daily_results")
      .select("account_id, winning_trades, losing_trades"),
  ]);

  const error =
    presetsResponse.error ||
    packsResponse.error ||
    accountsResponse.error ||
    dailyResultsResponse.error;

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
  const dailyResults = (dailyResultsResponse.data || []) as DailyResult[];

  const metrics = buildPresetMetrics(presets, packs, accounts, dailyResults);

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              App rentabilidad bot
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Presets
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Vista consolidada de presets activos y sus métricas principales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-[0_10px_24px_rgba(255,255,255,0.03)]">
              {metrics.length} preset{metrics.length === 1 ? "" : "s"} activo{metrics.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <SectionCard title="Presets activos">
        {metrics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
            No hay presets activos para mostrar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {metrics.map((preset) => (
              <PresetCard key={preset.id} preset={preset} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}