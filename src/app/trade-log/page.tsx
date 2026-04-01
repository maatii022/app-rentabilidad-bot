"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TradeItem = {
  id: number;
  account_id: number;
  preset_id: number | null;
  numero_cuenta: string;
  alias: string | null;
  magic: number | null;
  ticket: number;
  position_id: number;
  symbol: string;
  side: "buy" | "sell";
  entry_time: string;
  exit_time: string;
  business_date: string;
  entry_price: number | null;
  exit_price: number | null;
  sl_price: number | null;
  tp_price: number | null;
  close_reason: "tp" | "sl" | "fin_dia" | "manual" | "unknown";
  pnl_usd: number;
  pnl_pct: number;
  commission: number;
  swap: number;
  volume: number;
  source: "sync" | "historical_import" | "manual";
  preset_nombre: string | null;
  tipo_cuenta: string | null;
  account_size: string | null;
  prop_firm_nombre: string | null;
};

type TradeLogResponse = {
  ok: boolean;
  error?: string;
  trades?: TradeItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: {
    totalTrades: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    pnlTotal: number;
    profitFactor: number | null;
  };
  options?: {
    presets: { id: number; nombre: string }[];
    accounts: { id: number; label: string }[];
    symbols: string[];
  };
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return value.toFixed(5);
}

function formatUsd(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function getPnlClass(value?: number | null) {
  if (typeof value !== "number") return "text-zinc-300";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-zinc-300";
}

function getCloseReasonLabel(value: TradeItem["close_reason"]) {
  if (value === "tp") return "TP";
  if (value === "sl") return "SL";
  if (value === "fin_dia") return "Fin de día";
  if (value === "manual") return "Manual";
  return "Unknown";
}

function getCloseReasonClass(value: TradeItem["close_reason"]) {
  if (value === "tp") {
    return "border-emerald-300/20 bg-emerald-400/[0.10] text-emerald-200";
  }

  if (value === "sl") {
    return "border-rose-300/20 bg-rose-400/[0.10] text-rose-200";
  }

  if (value === "fin_dia") {
    return "border-amber-300/20 bg-amber-300/[0.10] text-amber-100";
  }

  if (value === "manual") {
    return "border-white/10 bg-white/[0.05] text-zinc-300";
  }

  return "border-white/10 bg-white/[0.05] text-zinc-400";
}

function getSideClass(value: TradeItem["side"]) {
  return value === "buy"
    ? "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-200"
    : "border-sky-300/20 bg-sky-400/[0.08] text-sky-200";
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "green" | "red" | "neutral" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/[0.08]"
      : tone === "red"
      ? "border-rose-400/20 bg-rose-400/[0.08]"
      : tone === "blue"
      ? "border-sky-400/20 bg-sky-400/[0.08]"
      : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)] ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-white">{value}</p>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] text-zinc-400">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-black/30 ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-black/30 ${props.className || ""}`}
    />
  );
}

export default function TradeLogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [stats, setStats] = useState<TradeLogResponse["stats"]>({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    breakeven: 0,
    winRate: 0,
    pnlTotal: 0,
    profitFactor: null,
  });
  const [options, setOptions] = useState<TradeLogResponse["options"]>({
    presets: [],
    accounts: [],
    symbols: [],
  });
  const [pagination, setPagination] = useState<TradeLogResponse["pagination"]>({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [presetId, setPresetId] = useState(searchParams.get("presetId") || "");
  const [accountId, setAccountId] = useState(searchParams.get("accountId") || "");
  const [symbol, setSymbol] = useState(searchParams.get("symbol") || "");
  const [closeReason, setCloseReason] = useState(searchParams.get("closeReason") || "");
  const [tipoCuenta, setTipoCuenta] = useState(searchParams.get("tipoCuenta") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || "1"));

  useEffect(() => {
    const params = new URLSearchParams();

    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (presetId) params.set("presetId", presetId);
    if (accountId) params.set("accountId", accountId);
    if (symbol) params.set("symbol", symbol);
    if (closeReason) params.set("closeReason", closeReason);
    if (tipoCuenta) params.set("tipoCuenta", tipoCuenta);
    if (page > 1) params.set("page", String(page));

    router.replace(`${pathname}?${params.toString()}`);
  }, [from, to, presetId, accountId, symbol, closeReason, tipoCuenta, page, pathname, router]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (presetId) params.set("presetId", presetId);
        if (accountId) params.set("accountId", accountId);
        if (symbol) params.set("symbol", symbol);
        if (closeReason) params.set("closeReason", closeReason);
        if (tipoCuenta) params.set("tipoCuenta", tipoCuenta);
        params.set("page", String(page));
        params.set("limit", "100");

        const res = await fetch(`/api/trade-log?${params.toString()}`, {
          cache: "no-store",
        });

        const data = (await res.json()) as TradeLogResponse;

        if (!res.ok || !data.ok) {
          setError(data.error || "No se pudo cargar el trade log.");
          setLoading(false);
          return;
        }

        setTrades(data.trades || []);
        setStats(
          data.stats || {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            breakeven: 0,
            winRate: 0,
            pnlTotal: 0,
            profitFactor: null,
          }
        );
        setOptions(
          data.options || {
            presets: [],
            accounts: [],
            symbols: [],
          }
        );
        setPagination(
          data.pagination || {
            page: 1,
            limit: 100,
            total: 0,
            totalPages: 1,
          }
        );
      } catch {
        setError("No se pudo cargar el trade log.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [from, to, presetId, accountId, symbol, closeReason, tipoCuenta, page]);

  const pnlTone = useMemo(() => {
    if ((stats?.pnlTotal ?? 0) > 0) return "green";
    if ((stats?.pnlTotal ?? 0) < 0) return "red";
    return "neutral";
  }, [stats?.pnlTotal]);

  function resetFilters() {
    setFrom("");
    setTo("");
    setPresetId("");
    setAccountId("");
    setSymbol("");
    setCloseReason("");
    setTipoCuenta("");
    setPage(1);
  }

  return (
    <div className="space-y-4 text-white">
      <section className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Registro operativo
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-[2rem]">
              Trade Log
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-6">
          <div>
            <FilterLabel>Desde</FilterLabel>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </div>

          <div>
            <FilterLabel>Hasta</FilterLabel>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>

          <div>
            <FilterLabel>Preset</FilterLabel>
            <Select value={presetId} onChange={(e) => { setPresetId(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              {options?.presets?.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FilterLabel>Cuenta</FilterLabel>
            <Select value={accountId} onChange={(e) => { setAccountId(e.target.value); setPage(1); }}>
              <option value="">Todas</option>
              {options?.accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FilterLabel>Par</FilterLabel>
            <Select value={symbol} onChange={(e) => { setSymbol(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              {options?.symbols?.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FilterLabel>Cierre</FilterLabel>
            <Select value={closeReason} onChange={(e) => { setCloseReason(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="tp">TP</option>
              <option value="sl">SL</option>
              <option value="fin_dia">Fin de día</option>
              <option value="manual">Manual</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div>
            <FilterLabel>Tipo cuenta</FilterLabel>
            <Select value={tipoCuenta} onChange={(e) => { setTipoCuenta(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="prueba">Prueba</option>
              <option value="fondeada">Fondeada</option>
            </Select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Trades" value={String(stats?.totalTrades ?? 0)} tone="blue" />
        <StatCard
          label="Winrate"
          value={`${(stats?.winRate ?? 0).toFixed(2)}%`}
          tone={(stats?.winRate ?? 0) >= 50 ? "green" : "red"}
        />
        <StatCard
          label="PnL total"
          value={formatUsd(stats?.pnlTotal ?? 0)}
          tone={pnlTone}
        />
        <StatCard
          label="Profit factor"
          value={stats?.profitFactor === null ? "-" : stats.profitFactor.toFixed(2)}
          tone="neutral"
        />
      </div>

      <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] shadow-[0_18px_38px_rgba(0,0,0,0.20)]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-sm text-zinc-400">Cargando trade log...</div>
          ) : error ? (
            <div className="p-6 text-sm text-rose-200">Error: {error}</div>
          ) : trades.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">
              No hay trades para los filtros actuales.
            </div>
          ) : (
            <table className="min-w-[1320px] w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Preset</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Cuenta</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Par</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Dir</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Entrada</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Salida</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">SL</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">TP</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">Cierre</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">PnL $</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-zinc-500">PnL %</th>
                </tr>
              </thead>

              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-white/6 transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 align-top text-sm text-zinc-200">
                      <div className="space-y-0.5">
                        <p>{trade.business_date}</p>
                        <p className="text-xs text-zinc-500">{formatDateTime(trade.exit_time)}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top text-sm text-white">
                      <div className="space-y-1">
                        <p>{trade.preset_nombre || "-"}</p>
                        {trade.prop_firm_nombre ? (
                          <span className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2 py-0.5 text-[10px] text-violet-200">
                            {trade.prop_firm_nombre}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top text-sm text-white">
                      <div className="space-y-0.5">
                        <p>{trade.alias || "-"}</p>
                        <p className="text-xs text-zinc-500">{trade.numero_cuenta}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top text-sm font-medium text-white">
                      {trade.symbol}
                    </td>

                    <td className="px-4 py-3 align-top text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${getSideClass(trade.side)}`}>
                        {trade.side === "buy" ? "Buy" : "Sell"}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top text-sm text-zinc-200">
                      {formatPrice(trade.entry_price)}
                    </td>

                    <td className="px-4 py-3 align-top text-sm text-zinc-200">
                      {formatPrice(trade.exit_price)}
                    </td>

                    <td className="px-4 py-3 align-top text-sm">
                      <span className="text-rose-300">{formatPrice(trade.sl_price)}</span>
                    </td>

                    <td className="px-4 py-3 align-top text-sm">
                      <span className="text-emerald-300">{formatPrice(trade.tp_price)}</span>
                    </td>

                    <td className="px-4 py-3 align-top text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${getCloseReasonClass(trade.close_reason)}`}>
                        {getCloseReasonLabel(trade.close_reason)}
                      </span>
                    </td>

                    <td className={`px-4 py-3 align-top text-sm font-medium ${getPnlClass(trade.pnl_usd)}`}>
                      {formatUsd(trade.pnl_usd)}
                    </td>

                    <td className={`px-4 py-3 align-top text-sm font-medium ${getPnlClass(trade.pnl_pct)}`}>
                      {formatPercent(trade.pnl_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Página {pagination.page} de {pagination.totalPages}, {pagination.total} trade{pagination.total === 1 ? "" : "s"}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}