"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccountRow, Pack, Preset, TradeLogMetricRow } from "./page";

type LiveStatusItem = {
  profit_total_pct?: number | null;
  profit_total_pct_current?: number | null;
  pnl_pct_actual?: number | null;
};

type LiveStatusMap = Record<string, LiveStatusItem>;

type PersistedPerformanceItem = {
  total_pct?: number;
};

type PersistedPerformanceMap = Record<string, PersistedPerformanceItem>;

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
  tradeWinrate: number | null;
};

type AccountItem = {
  id: number;
  presetId: number;
  presetNombre: string;
  alias: string;
  numeroCuenta: string;
  tipoCuenta: string;
  estado: string;
  activaEnFiltros: boolean;
  packId: number | null;
  packNombre: string | null;
};

type TypeFilter = "todos" | "prueba" | "fondeada";
type StatusFilter = "all" | "activa" | "fondeada" | "perdida";
type ViewMode = "overview" | "overview-exit" | "detail" | "detail-exit";

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizeKey(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
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

function getPctTone(value: number | null) {
  if (typeof value !== "number") {
    return {
      text: "text-zinc-200",
      panel:
        "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
    };
  }

  if (value > 0) {
    return {
      text: "text-emerald-300",
      panel:
        "border-emerald-400/18 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))]",
    };
  }

  if (value < 0) {
    return {
      text: "text-rose-300",
      panel:
        "border-rose-400/18 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(244,63,94,0.03))]",
    };
  }

  return {
    text: "text-zinc-200",
    panel:
      "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  };
}

function buildPresetMetrics(
  presets: Preset[],
  packs: Pack[],
  accounts: AccountItem[],
  tradeLogRows: TradeLogMetricRow[]
): PresetMetric[] {
  const packsByPreset = new Map<number, number>();
  const accountsByPreset = new Map<number, AccountItem[]>();
  const accountToPreset = new Map<number, number>();

  for (const pack of packs) {
    if (typeof pack.preset_id !== "number") continue;
    packsByPreset.set(pack.preset_id, (packsByPreset.get(pack.preset_id) ?? 0) + 1);
  }

  for (const account of accounts) {
    const current = accountsByPreset.get(account.presetId) ?? [];
    current.push(account);
    accountsByPreset.set(account.presetId, current);
    accountToPreset.set(account.id, account.presetId);
  }

  const tradeStatsByPreset = new Map<
    number,
    {
      wins: number;
      losses: number;
    }
  >();

  for (const row of tradeLogRows) {
    const presetId =
      typeof row.preset_id === "number"
        ? row.preset_id
        : accountToPreset.get(row.account_id);

    if (typeof presetId !== "number") continue;

    const pnl = Number(row.pnl_usd || 0);

    const current = tradeStatsByPreset.get(presetId) ?? {
      wins: 0,
      losses: 0,
    };

    if (pnl > 0) {
      current.wins += 1;
    } else if (pnl < 0) {
      current.losses += 1;
    }

    tradeStatsByPreset.set(presetId, current);
  }

  return presets.map((preset) => {
    const presetAccounts = accountsByPreset.get(preset.id) ?? [];

    const cuentasActivas = presetAccounts.filter(
      (account) => normalizeKey(account.estado) === "activa"
    ).length;

    const fondeadas = presetAccounts.filter(
      (account) => normalizeKey(account.estado) === "fondeada"
    ).length;

    const perdidas = presetAccounts.filter(
      (account) => normalizeKey(account.estado) === "perdida"
    ).length;

    const fundedBase = fondeadas + perdidas;
    const fundedWinrate =
      fundedBase > 0 ? (fondeadas / fundedBase) * 100 : null;

    const tradeStats = tradeStatsByPreset.get(preset.id) ?? {
      wins: 0,
      losses: 0,
    };

    const tradeBase = tradeStats.wins + tradeStats.losses;
    const tradeWinrate =
      tradeBase > 0 ? (tradeStats.wins / tradeBase) * 100 : null;

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
      tradeWinrate,
    };
  });
}

function ActionButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary:
      "border border-white/10 bg-white text-black shadow-[0_12px_26px_rgba(255,255,255,0.08)] hover:bg-zinc-200",
    secondary:
      "border border-white/10 bg-white/[0.04] text-white shadow-[0_10px_24px_rgba(255,255,255,0.03)] hover:bg-white/[0.08]",
    ghost:
      "border border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.05] hover:text-white",
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

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "scale-[0.985] border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(56,189,248,0.07))] text-white shadow-[0_12px_28px_rgba(56,189,248,0.14)]"
          : "border-white/10 bg-white/[0.03] text-zinc-200 shadow-[0_10px_22px_rgba(255,255,255,0.03)] hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function MetricSurface({
  label,
  value,
  enabled = false,
  onClick,
}: {
  label: string;
  value: number | string;
  enabled?: boolean;
  onClick?: () => void;
}) {
  const baseClass =
    "relative overflow-hidden rounded-[18px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.028))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.24)]";

  if (!enabled) {
    return (
      <div className={baseClass}>
        <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/14 opacity-80" />
        <div className="relative z-10">
          <p className="text-center text-[10px] uppercase tracking-[0.14em] text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-center text-xl font-semibold leading-none text-white">
            {value}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`metric-button-pulse group cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:border-white/20 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.04),0_18px_34px_rgba(0,0,0,0.28)] active:scale-[0.985] ${baseClass}`}
    >
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/14 opacity-80" />
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

function CompactWinratePanel({
  label,
  value,
  tone = "violet",
}: {
  label: string;
  value: number | null;
  tone?: "violet" | "emerald";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-400/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))]"
      : "border-violet-400/16 bg-[linear-gradient(180deg,rgba(167,139,250,0.10),rgba(167,139,250,0.03))]";

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)] ${toneClasses}`}>
      <p className="text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-center text-3xl font-semibold leading-none text-white">
        {formatPercent(value)}
      </p>
    </div>
  );
}

function AccountCard({
  account,
  totalPct,
  index,
}: {
  account: AccountItem;
  totalPct: number | null;
  index: number;
}) {
  const pctTone = getPctTone(totalPct);

  return (
    <article
      className="account-card-enter overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
      style={{ ["--enter-delay" as string]: `${index * 55}ms` }}
    >
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">
              {account.alias}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                {account.presetNombre}
              </span>
              {account.packNombre ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                  {account.packNombre}
                </span>
              ) : null}
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
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
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Número
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {account.numeroCuenta}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
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

function PresetCard({
  preset,
  interactive = false,
  onBack,
  onMetricClick,
}: {
  preset: PresetMetric;
  interactive?: boolean;
  onBack?: () => void;
  onMetricClick?: (key: "packs" | "activa" | "all" | "fondeada" | "perdida") => void;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.05),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.012))] shadow-[0_18px_38px_rgba(0,0,0,0.20)]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {interactive ? (
              <ActionButton onClick={onBack} variant="ghost">
                ← Volver
              </ActionButton>
            ) : null}
            <p className="truncate text-xl font-semibold tracking-tight text-white">
              {preset.nombre}
            </p>
          </div>

          <span className="rounded-full border border-sky-300/18 bg-sky-300/[0.10] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-sky-100 shadow-[0_8px_18px_rgba(56,189,248,0.06)]">
            Activo
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <MetricSurface
            label="Packs"
            value={preset.packs}
            enabled={interactive}
            onClick={() => onMetricClick?.("packs")}
          />
          <MetricSurface
            label="Activas"
            value={preset.cuentasActivas}
            enabled={interactive}
            onClick={() => onMetricClick?.("activa")}
          />
          <MetricSurface
            label="Totales"
            value={preset.cuentasTotales}
            enabled={interactive}
            onClick={() => onMetricClick?.("all")}
          />
          <MetricSurface
            label="Fondeadas"
            value={preset.fondeadas}
            enabled={interactive}
            onClick={() => onMetricClick?.("fondeada")}
          />
          <MetricSurface
            label="Perdidas"
            value={preset.perdidas}
            enabled={interactive}
            onClick={() => onMetricClick?.("perdida")}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CompactWinratePanel label="Funded winrate" value={preset.fundedWinrate} tone="violet" />
          <CompactWinratePanel label="Winrate por trade" value={preset.tradeWinrate} tone="emerald" />
        </div>
      </div>
    </article>
  );
}

export default function PresetsClient({
  presets,
  packs,
  accounts,
  tradeLogRows,
}: {
  presets: Preset[];
  packs: Pack[];
  accounts: AccountRow[];
  tradeLogRows: TradeLogMetricRow[];
}) {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [persistedPerformance, setPersistedPerformance] =
    useState<PersistedPerformanceMap>({});
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [tipoFilter, setTipoFilter] = useState<TypeFilter>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [packMode, setPackMode] = useState(false);
  const [packFilter, setPackFilter] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [showHint, setShowHint] = useState(true);
  const [hintClosing, setHintClosing] = useState(false);

  useEffect(() => {
    async function cargarPerformance() {
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
        }

        if (liveRes.ok && liveJson?.ok) {
          setLiveStatus(liveJson.data || {});
        }
      } catch {
        setPersistedPerformance({});
        setLiveStatus({});
      }
    }

    void cargarPerformance();
  }, []);

  const accountItems = useMemo<AccountItem[]>(() => {
    const presetNameMap = new Map<number, string>(
      presets.map((preset) => [preset.id, preset.nombre])
    );

    return accounts
      .filter(
        (account): account is AccountRow & { preset_id: number } =>
          typeof account.preset_id === "number"
      )
      .map((account) => {
        const packData = getPackData(account.pack_slots ?? null);

        return {
          id: account.id,
          presetId: account.preset_id,
          presetNombre: presetNameMap.get(account.preset_id) ?? "Sin preset",
          alias: normalizeText(account.alias) || `Cuenta ${account.numero_cuenta ?? account.id}`,
          numeroCuenta: normalizeText(account.numero_cuenta) || "-",
          tipoCuenta: normalizeText(account.tipo_cuenta) || "-",
          estado: normalizeText(account.estado) || "-",
          activaEnFiltros: Boolean(account.activa_en_filtros),
          packId: packData.packId,
          packNombre: packData.packNombre,
        };
      })
      .sort((a, b) => {
        const presetCompare = a.presetNombre.localeCompare(b.presetNombre);
        if (presetCompare !== 0) return presetCompare;
        return a.alias.localeCompare(b.alias);
      });
  }, [accounts, presets]);

  const metrics = useMemo(() => {
    return buildPresetMetrics(presets, packs, accountItems, tradeLogRows);
  }, [presets, packs, accountItems, tradeLogRows]);

  const selectedPreset = useMemo(() => {
    return selectedPresetId === null
      ? null
      : metrics.find((item) => item.id === selectedPresetId) ?? null;
  }, [metrics, selectedPresetId]);

  const selectedPresetAccounts = useMemo(() => {
    if (selectedPresetId === null) return [];
    return accountItems.filter((item) => item.presetId === selectedPresetId);
  }, [accountItems, selectedPresetId]);

  const packOptions = useMemo(() => {
    return Array.from(
      new Set(
        selectedPresetAccounts
          .map((item) => item.packNombre)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [selectedPresetAccounts]);

  useEffect(() => {
    if (packFilter === "todos") return;
    if (!packOptions.includes(packFilter)) {
      setPackFilter("todos");
    }
  }, [packFilter, packOptions]);

  const filteredActiveAccounts = useMemo(() => {
    return selectedPresetAccounts.filter((item) => {
      if (!item.activaEnFiltros) return false;

      const matchesTipo =
        tipoFilter === "todos" || normalizeKey(item.tipoCuenta) === tipoFilter;

      const matchesStatus =
        statusFilter === "all" || normalizeKey(item.estado) === statusFilter;

      const matchesPack =
        packFilter === "todos" || item.packNombre === packFilter;

      return matchesTipo && matchesStatus && matchesPack;
    });
  }, [selectedPresetAccounts, tipoFilter, statusFilter, packFilter]);

  const filteredInactiveAccounts = useMemo(() => {
    return selectedPresetAccounts.filter((item) => {
      if (item.activaEnFiltros) return false;

      const matchesTipo =
        tipoFilter === "todos" || normalizeKey(item.tipoCuenta) === tipoFilter;

      const matchesStatus =
        statusFilter === "all" || normalizeKey(item.estado) === statusFilter;

      const matchesPack =
        packFilter === "todos" || item.packNombre === packFilter;

      return matchesTipo && matchesStatus && matchesPack;
    });
  }, [selectedPresetAccounts, tipoFilter, statusFilter, packFilter]);

  function resetDetailFilters() {
    setTipoFilter("todos");
    setStatusFilter("all");
    setShowInactive(false);
    setPackMode(false);
    setPackFilter("todos");
  }

  function handleSelectPreset(presetId: number) {
    if (viewMode !== "overview") return;

    setHintClosing(true);

    window.setTimeout(() => {
      setShowHint(false);
      setViewMode("overview-exit");

      window.setTimeout(() => {
        setSelectedPresetId(presetId);
        resetDetailFilters();
        setViewMode("detail");
      }, 260);
    }, 320);
  }

  function handleBack() {
    if (viewMode !== "detail") return;

    setViewMode("detail-exit");

    window.setTimeout(() => {
      setSelectedPresetId(null);
      resetDetailFilters();
      setShowHint(true);
      setHintClosing(false);
      setViewMode("overview");
    }, 260);
  }

  function handleMetricClick(key: "packs" | "activa" | "all" | "fondeada" | "perdida") {
    if (key === "packs") {
      setPackMode((prev) => !prev);
      return;
    }

    setPackMode(false);
    setPackFilter("todos");

    if (key === "activa") {
      setStatusFilter("activa");
      setShowInactive(false);
      return;
    }

    if (key === "all") {
      setStatusFilter("all");
      setShowInactive(true);
      return;
    }

    if (key === "fondeada") {
      setStatusFilter("fondeada");
      setShowInactive(true);
      return;
    }

    setStatusFilter("perdida");
    setShowInactive(true);
  }

  return (
    <div className="space-y-5 text-white">
      {showHint && !selectedPreset && viewMode === "overview" ? (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-4">
          <div
            className={`w-full max-w-[360px] ${
              hintClosing ? "hint-floating-out" : "hint-floating"
            }`}
          >
            <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.035))] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Detalle interactivo
              </p>
              <p className="mt-2 text-center text-sm leading-6 text-zinc-200">
                Pulsa un preset para ver todas sus cuentas y activar sus filtros.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes presetCardPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 18px 38px rgba(0, 0, 0, 0.20);
          }
          8% {
            transform: scale(1.01);
            box-shadow: 0 24px 46px rgba(0, 0, 0, 0.24);
          }
          14% {
            transform: scale(1);
            box-shadow: 0 18px 38px rgba(0, 0, 0, 0.20);
          }
        }

        @keyframes metricPulse {
          0%, 100% {
            transform: scale(1);
          }
          8% {
            transform: scale(1.014);
          }
          14% {
            transform: scale(1);
          }
        }

        @keyframes accountEnter {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatingHintIn {
          0% {
            opacity: 0;
            transform: translateY(-80px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatingHintOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0.96);
          }
        }

        .preset-overview-pulse {
          animation: presetCardPulse 5.8s ease-in-out infinite;
          animation-delay: var(--pulse-delay, 0s);
        }

        .metric-button-pulse {
          animation: metricPulse 4.8s ease-in-out infinite;
        }

        .account-card-enter {
          animation: accountEnter 0.42s cubic-bezier(0.2, 0.9, 0.2, 1) both;
          animation-delay: var(--enter-delay, 0ms);
        }

        .hint-floating {
          animation: floatingHintIn 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
        }

        .hint-floating-out {
          animation: floatingHintOut 380ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>

      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              App rentabilidad bot
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Estadísticas
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-[0_10px_24px_rgba(255,255,255,0.03)]">
              {metrics.length} preset{metrics.length === 1 ? "" : "s"} activo{metrics.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <section className="relative rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.05),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white">
            {selectedPreset ? `Preset seleccionado · ${selectedPreset.nombre}` : "Resumen por preset"}
          </h2>
        </div>

        {(viewMode === "overview" || viewMode === "overview-exit") && (
          <div
            className={`transition-all duration-300 ${
              viewMode === "overview"
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-4 scale-[0.985] opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {metrics.map((preset, index) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className="preset-overview-pulse text-left transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.01] hover:brightness-105"
                  style={{ ["--pulse-delay" as string]: `${index * 0.35}s` }}
                >
                  <PresetCard preset={preset} />
                </button>
              ))}
            </div>
          </div>
        )}

        {(viewMode === "detail" || viewMode === "detail-exit") && selectedPreset && (
          <div
            className={`space-y-4 transition-all duration-300 ${
              viewMode === "detail"
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-[0.985] opacity-0"
            }`}
          >
            <div className="mx-auto flex w-full max-w-[980px] flex-col gap-3">
              <PresetCard
                preset={selectedPreset}
                interactive
                onBack={handleBack}
                onMetricClick={handleMetricClick}
              />

              <div className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] p-3 shadow-[0_14px_30px_rgba(0,0,0,0.18)] md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <FilterPill
                    label="Todos los tipos"
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

                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    onClick={() => setShowInactive((prev) => !prev)}
                    variant="secondary"
                  >
                    {showInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
                  </ActionButton>
                </div>
              </div>

              {packMode && packOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2 rounded-[20px] border border-white/10 bg-white/[0.02] p-3">
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
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-white">
                  Cuentas activas · {filteredActiveAccounts.length}
                </h3>
              </div>

              {filteredActiveAccounts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
                  No hay cuentas activas para este filtro.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {filteredActiveAccounts.map((account, index) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      index={index}
                      totalPct={resolveDisplayTotalPct(
                        account.numeroCuenta,
                        persistedPerformance,
                        liveStatus
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {showInactive ? (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-white">
                    Cuentas inactivas · {filteredInactiveAccounts.length}
                  </h3>
                </div>

                {filteredInactiveAccounts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
                    No hay cuentas inactivas para este filtro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    {filteredInactiveAccounts.map((account, index) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        index={index}
                        totalPct={resolveDisplayTotalPct(
                          account.numeroCuenta,
                          persistedPerformance,
                          liveStatus
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}