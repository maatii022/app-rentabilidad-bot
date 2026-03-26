"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AccountRow = {
  id: number;
  preset_id: number | null;
  numero_cuenta: string | null;
  alias: string | null;
  tipo_cuenta: string | null;
  estado: string | null;
  activa_en_filtro: boolean | null;
  presets:
    | {
        nombre: string | null;
      }
    | {
        nombre: string | null;
      }[]
    | null;
  pack_slots?:
    | {
        pack_id: number;
        packs:
          | {
              id: number;
              nombre: string | null;
            }
          | {
              id: number;
              nombre: string | null;
            }[]
          | null;
      }[]
    | null;
};

type LiveStatusItem = {
  profit_total_pct?: number | null;
  profit_total_pct_current?: number | null;
  pnl_pct_actual?: number | null;
  error?: string;
};

type LiveStatusMap = Record<string, LiveStatusItem>;

type PersistedPerformanceItem = {
  total_pct?: number;
  today_pct?: number;
  live_status?: string | null;
};

type PersistedPerformanceMap = Record<string, PersistedPerformanceItem>;

type AccountCardItem = {
  id: number;
  alias: string;
  numeroCuenta: string;
  presetNombre: string;
  tipoCuenta: string;
  estado: string;
  activaEnFiltro: boolean;
  packId: number | null;
  packNombre: string | null;
};

function getPresetName(
  value:
    | {
        nombre: string | null;
      }
    | {
        nombre: string | null;
      }[]
    | null
) {
  if (!value) return "Sin preset";
  if (Array.isArray(value)) return value[0]?.nombre ?? "Sin preset";
  return value.nombre ?? "Sin preset";
}

function getPackData(
  value:
    | {
        pack_id: number;
        packs:
          | {
              id: number;
              nombre: string | null;
            }
          | {
              id: number;
              nombre: string | null;
            }[]
          | null;
      }[]
    | null
) {
  if (!value || value.length === 0) {
    return {
      packId: null,
      packNombre: null,
    };
  }

  const first = value[0];
  const pack = Array.isArray(first.packs) ? first.packs[0] : first.packs;

  return {
    packId: pack?.id ?? first.pack_id ?? null,
    packNombre: pack?.nombre ?? null,
  };
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizeKey(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
}

function resolveDisplayTotalPct(
  numeroCuenta: string,
  persistedPerformance: PersistedPerformanceMap,
  liveStatus: LiveStatusMap
) {
  const live = liveStatus[numeroCuenta];
  const persisted = persistedPerformance[numeroCuenta];

  if (typeof live?.profit_total_pct_current === "number") {
    return live.profit_total_pct_current;
  }

  if (typeof live?.profit_total_pct === "number") {
    return live.profit_total_pct;
  }

  if (typeof live?.pnl_pct_actual === "number") {
    return live.pnl_pct_actual;
  }

  if (typeof persisted?.total_pct === "number") {
    return persisted.total_pct;
  }

  return null;
}

function getPctTone(value?: number | null) {
  if (typeof value !== "number") {
    return {
      text: "text-zinc-300",
      panel:
        "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_14px_30px_rgba(255,255,255,0.03)]",
    };
  }

  if (value > 0) {
    return {
      text: "text-emerald-300",
      panel:
        "border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))] shadow-[0_14px_30px_rgba(16,185,129,0.08)]",
    };
  }

  if (value < 0) {
    return {
      text: "text-rose-300",
      panel:
        "border-rose-400/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(244,63,94,0.03))] shadow-[0_14px_30px_rgba(244,63,94,0.08)]",
    };
  }

  return {
    text: "text-zinc-300",
    panel:
      "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_14px_30px_rgba(255,255,255,0.03)]",
  };
}

function getInitialFilters() {
  if (typeof window === "undefined") {
    return {
      preset: "todos",
      tipo: "todos",
      estado: "todos",
      pack: "todos",
      showInactive: false,
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    preset: params.get("preset") ?? "todos",
    tipo: params.get("tipo") ?? "todos",
    estado: params.get("estado") ?? "todos",
    pack: params.get("pack") ?? "todos",
    showInactive: params.get("showInactive") === "true",
  };
}

function updateUrl(params: {
  preset: string;
  tipo: string;
  estado: string;
  pack: string;
  showInactive: boolean;
}) {
  if (typeof window === "undefined") return;

  const search = new URLSearchParams();

  if (params.preset !== "todos") search.set("preset", params.preset);
  if (params.tipo !== "todos") search.set("tipo", params.tipo);
  if (params.estado !== "todos") search.set("estado", params.estado);
  if (params.pack !== "todos") search.set("pack", params.pack);
  if (params.showInactive) search.set("showInactive", "true");

  const query = search.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;

  window.history.replaceState({}, "", nextUrl);
}

function FilterPill({
  label,
  active,
  onClick,
  tone = "blue",
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  tone?: "blue" | "amber";
}) {
  const activeClasses =
    tone === "amber"
      ? "border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(251,191,36,0.07))] text-amber-100 shadow-[0_12px_28px_rgba(251,191,36,0.14)]"
      : "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(56,189,248,0.07))] text-white shadow-[0_12px_28px_rgba(56,189,248,0.14)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? `scale-[0.985] ${activeClasses}`
          : "border-white/10 bg-white/[0.03] text-zinc-200 shadow-[0_10px_22px_rgba(255,255,255,0.03)] hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "warning";
}) {
  const styles = {
    primary:
      "border border-white/10 bg-white text-black shadow-[0_12px_26px_rgba(255,255,255,0.08)] hover:bg-zinc-200",
    secondary:
      "border border-white/10 bg-white/[0.04] text-white shadow-[0_10px_24px_rgba(255,255,255,0.03)] hover:bg-white/[0.08]",
    warning:
      "border border-amber-300/20 bg-amber-300/[0.10] text-amber-100 shadow-[0_12px_26px_rgba(251,191,36,0.10)] hover:bg-amber-300/[0.14]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function SectionCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-medium text-white">{title}</h2>
        {right ? <div className="flex flex-wrap gap-2">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function AccountCard({
  account,
  totalPct,
}: {
  account: AccountCardItem;
  totalPct: number | null;
}) {
  const pctTone = getPctTone(totalPct);

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_18px_38px_rgba(0,0,0,0.20)]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">
              {account.alias}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 shadow-[0_10px_20px_rgba(255,255,255,0.03)]">
                {account.presetNombre}
              </span>

              {account.packNombre ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 shadow-[0_10px_20px_rgba(255,255,255,0.03)]">
                  {account.packNombre}
                </span>
              ) : null}
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] shadow-[0_10px_20px_rgba(255,255,255,0.03)] ${
              normalizeKey(account.estado) === "activa"
                ? "border-sky-300/18 bg-sky-300/[0.10] text-sky-100"
                : normalizeKey(account.estado) === "fondeada"
                ? "border-violet-300/18 bg-violet-300/[0.10] text-violet-100"
                : normalizeKey(account.estado) === "perdida"
                ? "border-amber-300/18 bg-amber-300/[0.10] text-amber-100"
                : "border-white/10 bg-white/[0.05] text-zinc-300"
            }`}
          >
            {account.estado}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Número
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {account.numeroCuenta}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Tipo
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {account.tipoCuenta}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${pctTone.panel}`}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Resultado actual
          </p>
          <p className={`mt-3 text-3xl font-semibold leading-none ${pctTone.text}`}>
            {formatPercent(totalPct)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CuentasPage() {
  const [accounts, setAccounts] = useState<AccountCardItem[]>([]);
  const [persistedPerformance, setPersistedPerformance] =
    useState<PersistedPerformanceMap>({});
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [loading, setLoading] = useState(true);
  const [loadingPct, setLoadingPct] = useState(true);
  const [error, setError] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);

  const [presetFilter, setPresetFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [packFilter, setPackFilter] = useState("todos");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    const initial = getInitialFilters();
    setPresetFilter(initial.preset);
    setTipoFilter(initial.tipo);
    setEstadoFilter(initial.estado);
    setPackFilter(initial.pack);
    setShowInactive(initial.showInactive);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;

    updateUrl({
      preset: presetFilter,
      tipo: tipoFilter,
      estado: estadoFilter,
      pack: packFilter,
      showInactive,
    });
  }, [presetFilter, tipoFilter, estadoFilter, packFilter, showInactive, filtersReady]);

  useEffect(() => {
    async function cargarCuentas() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("accounts")
        .select(`
          id,
          preset_id,
          numero_cuenta,
          alias,
          tipo_cuenta,
          estado,
          activa_en_filtro,
          presets (
            nombre
          ),
          pack_slots (
            pack_id,
            packs (
              id,
              nombre
            )
          )
        `)
        .order("preset_id", { ascending: true })
        .order("alias", { ascending: true });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped = ((data || []) as AccountRow[]).map((item) => {
        const packData = getPackData(item.pack_slots ?? null);

        return {
          id: item.id,
          alias: normalizeText(item.alias) || `Cuenta ${item.numero_cuenta ?? item.id}`,
          numeroCuenta: normalizeText(item.numero_cuenta) || "-",
          presetNombre: getPresetName(item.presets),
          tipoCuenta: normalizeText(item.tipo_cuenta) || "-",
          estado: normalizeText(item.estado) || "-",
          activaEnFiltro: Boolean(item.activa_en_filtro),
          packId: packData.packId,
          packNombre: packData.packNombre,
        };
      });

      mapped.sort((a, b) => {
        const presetCompare = a.presetNombre.localeCompare(b.presetNombre);
        if (presetCompare !== 0) return presetCompare;

        const aliasCompare = a.alias.localeCompare(b.alias);
        if (aliasCompare !== 0) return aliasCompare;

        return a.numeroCuenta.localeCompare(b.numeroCuenta);
      });

      setAccounts(mapped);
      setLoading(false);
    }

    void cargarCuentas();
  }, []);

  useEffect(() => {
    async function cargarPerformance() {
      setLoadingPct(true);

      try {
        const [performanceRes, liveRes] = await Promise.all([
          fetch("/api/accounts/performance-map", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/live-status", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const performanceJson = await performanceRes.json();
        const liveJson = await liveRes.json();

        if (performanceRes.ok && performanceJson?.ok) {
          setPersistedPerformance(performanceJson.data || {});
        } else {
          setPersistedPerformance({});
        }

        if (liveRes.ok && liveJson?.ok) {
          setLiveStatus(liveJson.data || {});
        } else {
          setLiveStatus({});
        }
      } catch {
        setPersistedPerformance({});
        setLiveStatus({});
      } finally {
        setLoadingPct(false);
      }
    }

    void cargarPerformance();
  }, []);

  const presetOptions = useMemo(() => {
    return Array.from(new Set(accounts.map((item) => item.presetNombre))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [accounts]);

  const packOptions = useMemo(() => {
    const base =
      presetFilter === "todos"
        ? accounts
        : accounts.filter((item) => item.presetNombre === presetFilter);

    return Array.from(
      new Set(base.map((item) => item.packNombre).filter((value): value is string => Boolean(value)))
    ).sort((a, b) => a.localeCompare(b));
  }, [accounts, presetFilter]);

  useEffect(() => {
    if (packFilter === "todos") return;
    if (!packOptions.includes(packFilter)) {
      setPackFilter("todos");
    }
  }, [packFilter, packOptions]);

  const filteredActiveAccounts = useMemo(() => {
    return accounts.filter((item) => {
      if (!item.activaEnFiltro) return false;

      const matchesPreset =
        presetFilter === "todos" || item.presetNombre === presetFilter;

      const matchesTipo =
        tipoFilter === "todos" || normalizeKey(item.tipoCuenta) === normalizeKey(tipoFilter);

      const matchesEstado =
        estadoFilter === "todos" || normalizeKey(item.estado) === normalizeKey(estadoFilter);

      const matchesPack =
        packFilter === "todos" || item.packNombre === packFilter;

      return matchesPreset && matchesTipo && matchesEstado && matchesPack;
    });
  }, [accounts, presetFilter, tipoFilter, estadoFilter, packFilter]);

  const filteredInactiveAccounts = useMemo(() => {
    return accounts.filter((item) => {
      if (item.activaEnFiltro) return false;

      const matchesPreset =
        presetFilter === "todos" || item.presetNombre === presetFilter;

      const matchesTipo =
        tipoFilter === "todos" || normalizeKey(item.tipoCuenta) === normalizeKey(tipoFilter);

      const matchesEstado =
        estadoFilter === "todos" || normalizeKey(item.estado) === normalizeKey(estadoFilter);

      const matchesPack =
        packFilter === "todos" || item.packNombre === packFilter;

      return matchesPreset && matchesTipo && matchesEstado && matchesPack;
    });
  }, [accounts, presetFilter, tipoFilter, estadoFilter, packFilter]);

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              App rentabilidad bot
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Cuentas
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Vista consolidada de todas las cuentas, ordenadas por preset y con filtros operativos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={() => setShowInactive((prev) => !prev)}
              variant={showInactive ? "warning" : "secondary"}
            >
              {showInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
            </ActionButton>
          </div>
        </div>
      </section>

      <SectionCard title="Filtros">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              label="Todos los presets"
              active={presetFilter === "todos"}
              onClick={() => setPresetFilter("todos")}
            />
            {presetOptions.map((preset) => (
              <FilterPill
                key={preset}
                label={preset}
                active={presetFilter === preset}
                onClick={() => setPresetFilter(preset)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              label="Todos los packs"
              active={packFilter === "todos"}
              onClick={() => setPackFilter("todos")}
            />
            {packOptions.map((pack) => (
              <FilterPill
                key={pack}
                label={pack}
                active={packFilter === pack}
                onClick={() => setPackFilter(pack)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              label="Todos"
              active={tipoFilter === "todos"}
              onClick={() => setTipoFilter("todos")}
            />
            <FilterPill
              label="Prueba"
              active={tipoFilter === "prueba"}
              onClick={() => setTipoFilter("prueba")}
            />
            <FilterPill
              label="Fondeada"
              active={tipoFilter === "fondeada"}
              onClick={() => setTipoFilter("fondeada")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              label="Todos los estados"
              active={estadoFilter === "todos"}
              onClick={() => setEstadoFilter("todos")}
              tone="amber"
            />
            <FilterPill
              label="Activas"
              active={estadoFilter === "activa"}
              onClick={() => setEstadoFilter("activa")}
              tone="amber"
            />
            <FilterPill
              label="Fondeadas"
              active={estadoFilter === "fondeada"}
              onClick={() => setEstadoFilter("fondeada")}
              tone="amber"
            />
            <FilterPill
              label="Perdidas"
              active={estadoFilter === "perdida"}
              onClick={() => setEstadoFilter("perdida")}
              tone="amber"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={`Cuentas activas${loading ? "" : ` · ${filteredActiveAccounts.length}`}`}
      >
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
            Cargando cuentas...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-5 text-sm text-rose-200">
            Error: {error}
          </div>
        ) : filteredActiveAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
            No hay cuentas activas que coincidan con los filtros actuales.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {filteredActiveAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                totalPct={resolveDisplayTotalPct(
                  account.numeroCuenta,
                  persistedPerformance,
                  liveStatus
                )}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {showInactive && (
        <SectionCard
          title={`Cuentas inactivas${loading ? "" : ` · ${filteredInactiveAccounts.length}`}`}
        >
          {filteredInactiveAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
              No hay cuentas inactivas que coincidan con los filtros actuales.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {filteredInactiveAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  totalPct={resolveDisplayTotalPct(
                    account.numeroCuenta,
                    persistedPerformance,
                    liveStatus
                  )}
                />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {loadingPct && !loading ? (
        <div className="text-center text-sm text-zinc-500">
          Cargando rendimiento actual...
        </div>
      ) : null}
    </div>
  );
}