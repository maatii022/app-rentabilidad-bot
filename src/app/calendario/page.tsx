"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AccountRelation =
  | {
      alias: string;
      numero_cuenta: string;
    }
  | {
      alias: string;
      numero_cuenta: string;
    }[]
  | null;

type DailyResult = {
  id: number;
  fecha: string;
  pnl_usd: number;
  pnl_porcentaje: number;
  red_day: boolean;
  account_id: number;
  accounts: AccountRelation;
};

type AccountEvent = {
  id: number;
  fecha: string;
  tipo_evento: string;
  descripcion?: string | null;
  account_id?: number | null;
  pack_id?: number | null;
  accounts?: AccountRelation;
};

type AccountOption = {
  id: number;
  label: string;
};

type CalendarDayData = {
  fecha: string;
  totalUsd: number;
  totalPct: number;
  resultCount: number;
  redDayCount: number;
  events: CalendarEventItem[];
};

type CalendarEventItem = {
  id: string;
  kind: "sord" | "perdida" | "fondeada" | "reemplazo" | "otro";
  label: string;
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getAccountData(accounts: AccountRelation) {
  if (!accounts) return null;
  return Array.isArray(accounts) ? accounts[0] : accounts;
}

function formatUsd(value: number) {
  const abs = Math.abs(value);

  if (abs >= 1000) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return `${value >= 0 ? "$" : "-$"}${Math.abs(value).toFixed(2)}`;
}

function formatPct(value: number) {
  return `${value.toFixed(2)}%`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseSlotFromText(text?: string | null) {
  if (!text) return null;
  const match = text.match(/slot\s+([A-Z])/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function mapEventKind(tipo: string): CalendarEventItem["kind"] {
  const normalized = tipo.toLowerCase();

  if (normalized.includes("sord")) return "sord";
  if (normalized.includes("perdida")) return "perdida";
  if (normalized.includes("fondeada")) return "fondeada";
  if (normalized.includes("reemplazo")) return "reemplazo";
  return "otro";
}

function buildEventLabel(event: AccountEvent) {
  const tipo = event.tipo_evento.toLowerCase();

  if (tipo === "perdida") return "Cuenta perdida";
  if (tipo === "fondeada") return "Cuenta fondeada";
  if (tipo.includes("reemplazo")) return "Reemplazo";

  return event.tipo_evento;
}

function buildCalendarMatrix(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const startDate = new Date(year, month, 1 - firstWeekday);

  const cells: Date[] = [];

  for (let i = 0; i < 42; i += 1) {
    const cell = new Date(startDate);
    cell.setDate(startDate.getDate() + i);
    cells.push(cell);
  }

  return cells;
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
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {right ? <div className="flex flex-wrap gap-2">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-emerald-300/20 bg-emerald-400 text-black"
          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20"
    >
      {children}
    </select>
  );
}

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyResults, setDailyResults] = useState<DailyResult[]>([]);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [viewMode, setViewMode] = useState<"pnl" | "events">("pnl");
  const [selectedAccountId, setSelectedAccountId] = useState("total");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  async function cargarDatos() {
    setLoading(true);
    setError("");

    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const startKey = toDateKey(monthStart);
    const endKey = toDateKey(monthEnd);

    const dailyQuery = supabase
      .from("daily_results")
      .select(`
        id,
        fecha,
        pnl_usd,
        pnl_porcentaje,
        red_day,
        account_id,
        accounts (
          alias,
          numero_cuenta
        )
      `)
      .gte("fecha", startKey)
      .lte("fecha", endKey)
      .order("fecha", { ascending: true });

    const eventQuery = supabase
      .from("account_events")
      .select(`
        id,
        fecha,
        tipo_evento,
        descripcion,
        account_id,
        pack_id,
        accounts (
          alias,
          numero_cuenta
        )
      `)
      .gte("fecha", startKey)
      .lte("fecha", endKey)
      .order("fecha", { ascending: true });

    const accountsQuery = supabase
      .from("accounts")
      .select("id, alias, numero_cuenta")
      .order("alias", { ascending: true });

    const [dailyResponse, eventResponse, accountResponse] = await Promise.all([
      dailyQuery,
      eventQuery,
      accountsQuery,
    ]);

    if (dailyResponse.error) {
      setError(dailyResponse.error.message);
      setLoading(false);
      return;
    }

    if (eventResponse.error) {
      setError(eventResponse.error.message);
      setLoading(false);
      return;
    }

    if (accountResponse.error) {
      setError(accountResponse.error.message);
      setLoading(false);
      return;
    }

    setDailyResults((dailyResponse.data || []) as DailyResult[]);
    setEvents((eventResponse.data || []) as AccountEvent[]);
    setAccounts(
      (accountResponse.data || []).map((account) => ({
        id: account.id,
        label: `${account.alias} · ${account.numero_cuenta}`,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, [currentMonth]);

  const filteredResults = useMemo(() => {
    if (selectedAccountId === "total") return dailyResults;
    const accountId = Number(selectedAccountId);
    return dailyResults.filter((item) => item.account_id === accountId);
  }, [dailyResults, selectedAccountId]);

  const filteredEvents = useMemo(() => {
    if (selectedAccountId === "total") return events;
    const accountId = Number(selectedAccountId);
    return events.filter((item) => item.account_id === accountId);
  }, [events, selectedAccountId]);

  const dailyMap = useMemo(() => {
    const resultMap = new Map<string, CalendarDayData>();

    filteredResults.forEach((result) => {
      const key = result.fecha;
      const existing = resultMap.get(key) ?? {
        fecha: key,
        totalUsd: 0,
        totalPct: 0,
        resultCount: 0,
        redDayCount: 0,
        events: [],
      };

      existing.totalUsd += Number(result.pnl_usd || 0);
      existing.totalPct += Number(result.pnl_porcentaje || 0);
      existing.resultCount += 1;

      if (result.red_day) {
        existing.redDayCount += 1;
      }

      resultMap.set(key, existing);
    });

    const groupedByDatePack = new Map<string, { out?: string; in?: string }>();

    filteredEvents.forEach((event) => {
      const dateKey = event.fecha;
      const target = resultMap.get(dateKey) ?? {
        fecha: dateKey,
        totalUsd: 0,
        totalPct: 0,
        resultCount: 0,
        redDayCount: 0,
        events: [],
      };

      const kind = mapEventKind(event.tipo_evento);

      if (kind === "sord" && event.pack_id) {
        const groupKey = `${dateKey}_${event.pack_id}`;
        const group = groupedByDatePack.get(groupKey) ?? {};

        if (event.tipo_evento.toLowerCase() === "sord out") {
          group.out = parseSlotFromText(event.descripcion) ?? undefined;
        }

        if (event.tipo_evento.toLowerCase() === "sord in") {
          group.in = parseSlotFromText(event.descripcion) ?? undefined;
        }

        groupedByDatePack.set(groupKey, group);
      } else {
        target.events.push({
          id: `${event.id}`,
          kind,
          label: buildEventLabel(event),
        });
      }

      resultMap.set(dateKey, target);
    });

    groupedByDatePack.forEach((value, groupKey) => {
      const [dateKey] = groupKey.split("_");
      const target = resultMap.get(dateKey);

      if (!target) return;

      if (value.out && value.in) {
        target.events.push({
          id: `sord_${groupKey}`,
          kind: "sord",
          label: `${value.out}>${value.in}`,
        });
        return;
      }

      if (value.out || value.in) {
        target.events.push({
          id: `sord_partial_${groupKey}`,
          kind: "sord",
          label: `SORD ${value.out ?? "?"}>${value.in ?? "?"}`,
        });
      }
    });

    resultMap.forEach((day) => {
      day.events = day.events.slice(0, 4);
    });

    return resultMap;
  }, [filteredResults, filteredEvents]);

  const calendarCells = useMemo(() => buildCalendarMatrix(currentMonth), [currentMonth]);

  const monthSummary = useMemo(() => {
    const values = Array.from(dailyMap.values());

    return values.reduce(
      (acc, day) => {
        acc.totalUsd += day.totalUsd;
        acc.totalPct += day.totalPct;
        acc.totalEvents += day.events.length;
        acc.daysWithResults += day.resultCount > 0 ? 1 : 0;
        return acc;
      },
      {
        totalUsd: 0,
        totalPct: 0,
        totalEvents: 0,
        daysWithResults: 0,
      }
    );
  }, [dailyMap]);

  function previousMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  function getDayTone(day: CalendarDayData | undefined) {
    if (!day) return "border-white/5 bg-white/[0.02]";
    if (viewMode === "events") return "border-white/10 bg-white/[0.03]";
    if (day.totalUsd > 0) return "border-emerald-400/25 bg-emerald-400/[0.08]";
    if (day.totalUsd < 0) return "border-rose-400/25 bg-rose-400/[0.08]";
    return "border-white/10 bg-white/[0.03]";
  }

  function getEventPillClasses(kind: CalendarEventItem["kind"]) {
    if (kind === "sord") return "border-sky-300/20 bg-sky-300/[0.10] text-sky-200";
    if (kind === "perdida") return "border-amber-300/20 bg-amber-300/[0.10] text-amber-200";
    if (kind === "fondeada") return "border-violet-300/20 bg-violet-300/[0.10] text-violet-200";
    if (kind === "reemplazo") return "border-emerald-300/20 bg-emerald-300/[0.10] text-emerald-200";
    return "border-white/10 bg-white/[0.05] text-zinc-300";
  }

  return (
    <div className="space-y-5 text-white">
      <SectionCard
        title="Trading Calendar"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <div className="flex gap-1">
                <ActionButton
                  onClick={() => setViewMode("pnl")}
                  active={viewMode === "pnl"}
                >
                  PNL
                </ActionButton>
                <ActionButton
                  onClick={() => setViewMode("events")}
                  active={viewMode === "events"}
                >
                  Events
                </ActionButton>
              </div>
            </div>

            <Select
              value={selectedAccountId}
              onChange={setSelectedAccountId}
            >
              <option value="total">Total, todas las cuentas</option>
              {accounts.map((account) => (
                <option key={account.id} value={String(account.id)}>
                  {account.label}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              PnL mes USD
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatUsd(monthSummary.totalUsd)}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              PnL mes %
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPct(monthSummary.totalPct)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              Días con resultados
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {monthSummary.daysWithResults}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              Eventos del mes
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {monthSummary.totalEvents}
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={previousMonth}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300 transition hover:bg-white/[0.06]"
          >
            ←
          </button>

          <p className="text-xl font-semibold capitalize text-white">
            {getMonthLabel(currentMonth)}
          </p>

          <button
            type="button"
            onClick={nextMonth}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300 transition hover:bg-white/[0.06]"
          >
            →
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
            Cargando calendario...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-6 text-sm text-rose-200">
            Error: {error}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((date) => {
                const dateKey = toDateKey(date);
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const dayData = dailyMap.get(dateKey);
                const hasVisibleContent =
                  (viewMode === "pnl" && !!dayData?.resultCount) ||
                  (viewMode === "events" && !!dayData?.events.length);

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[118px] rounded-2xl border p-3 transition ${getDayTone(
                      dayData
                    )} ${!isCurrentMonth ? "opacity-35" : "opacity-100"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg font-semibold text-white">
                        {date.getDate()}
                      </p>

                      {dayData && dayData.resultCount > 0 && (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-400">
                          {dayData.resultCount}
                        </span>
                      )}
                    </div>

                    {hasVisibleContent ? (
                      viewMode === "pnl" ? (
                        <div className="mt-4 space-y-1">
                          <p
                            className={`text-3xl font-semibold leading-none ${
                              dayData && dayData.totalUsd > 0
                                ? "text-emerald-300"
                                : dayData && dayData.totalUsd < 0
                                ? "text-rose-300"
                                : "text-white"
                            }`}
                          >
                            {dayData ? formatUsd(dayData.totalUsd) : "-"}
                          </p>

                          <p
                            className={`text-sm font-medium ${
                              dayData && dayData.totalPct > 0
                                ? "text-emerald-300"
                                : dayData && dayData.totalPct < 0
                                ? "text-rose-300"
                                : "text-zinc-300"
                            }`}
                          >
                            {dayData ? formatPct(dayData.totalPct) : "-"}
                          </p>

                          <p className="pt-1 text-[11px] text-zinc-500">
                            {dayData?.redDayCount
                              ? `${dayData.redDayCount} red day`
                              : `${dayData?.resultCount ?? 0} cuenta${dayData?.resultCount === 1 ? "" : "s"}`}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-col gap-1.5">
                          {dayData?.events.map((event) => (
                            <span
                              key={event.id}
                              className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-medium ${getEventPillClasses(
                                event.kind
                              )}`}
                            >
                              {event.label}
                            </span>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="mt-4 text-xs text-zinc-600">
                        {isCurrentMonth ? " " : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}