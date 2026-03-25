"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type PresetOption = {
  id: number;
  nombre: string;
};

type AccountOption = {
  id: number;
  alias: string;
  numero_cuenta: string;
  preset_id: number | null;
  preset_nombre: string;
  label: string;
};

type PackSlotRow = {
  id: number;
  pack_id: number;
  slot: string;
  account_id: number | null;
  packs:
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
      }
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
      }[]
    | null;
};

type PackFilterItem = {
  id: number;
  nombre: string;
  preset_id: number | null;
  slots: {
    slot: string;
    account_id: number | null;
  }[];
};

type CalendarEventItem = {
  id: string;
  kind: "perdida" | "fondeada" | "reemplazo" | "otro";
  label: string;
  count?: number;
};

type CalendarDayData = {
  fecha: string;
  totalUsd: number;
  totalPct: number;
  resultCount: number;
  redDayCount: number;
  events: CalendarEventItem[];
  resultDetails: {
    id: number;
    accountId: number;
    alias: string;
    numeroCuenta: string;
    pnlUsd: number;
    pnlPct: number;
    redDay: boolean;
  }[];
  eventDetails: {
    id: number;
    tipo: string;
    descripcion: string;
    alias: string;
    numeroCuenta: string;
  }[];
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const SLOT_ORDER = ["A", "B", "C"];

function getAccountData(accounts?: AccountRelation) {
  if (!accounts) return null;
  return Array.isArray(accounts) ? accounts[0] : accounts;
}

function getSinglePack(
  pack:
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
      }
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
      }[]
    | null
) {
  if (!pack) return null;
  return Array.isArray(pack) ? pack[0] : pack;
}

function formatUsd(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
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

function mapEventKind(tipo: string): CalendarEventItem["kind"] {
  const normalized = tipo.toLowerCase();

  if (normalized.includes("perdida")) return "perdida";
  if (normalized.includes("fondeada")) return "fondeada";
  if (normalized.includes("reemplazo")) return "reemplazo";
  return "otro";
}

function isImportantEvent(tipo: string) {
  const normalized = tipo.toLowerCase();
  return (
    normalized.includes("perdida") ||
    normalized.includes("fondeada") ||
    normalized.includes("reemplazo")
  );
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

function getEventPillClasses(kind: CalendarEventItem["kind"]) {
  if (kind === "perdida") return "border-amber-300/20 bg-amber-300/[0.10] text-amber-200";
  if (kind === "fondeada") return "border-violet-300/20 bg-violet-300/[0.10] text-violet-200";
  if (kind === "reemplazo") return "border-emerald-300/20 bg-emerald-300/[0.10] text-emerald-200";
  return "border-white/10 bg-white/[0.05] text-zinc-300";
}

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyResults, setDailyResults] = useState<DailyResult[]>([]);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [presets, setPresets] = useState<PresetOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [packs, setPacks] = useState<PackFilterItem[]>([]);

  const [viewMode, setViewMode] = useState<"pnl" | "events">("pnl");

  const [selectedPresetId, setSelectedPresetId] = useState("todos");
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const presetDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        presetDropdownRef.current &&
        !presetDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPresetDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    const presetsQuery = supabase
      .from("presets")
      .select("id, nombre")
      .order("nombre", { ascending: true });

    const accountsQuery = supabase
      .from("accounts")
      .select(`
        id,
        alias,
        numero_cuenta,
        preset_id,
        presets (
          nombre
        )
      `)
      .order("alias", { ascending: true });

    const packSlotsQuery = supabase
      .from("pack_slots")
      .select(`
        id,
        pack_id,
        slot,
        account_id,
        packs (
          id,
          nombre,
          preset_id
        )
      `)
      .order("pack_id", { ascending: true })
      .order("slot", { ascending: true });

    const [
      dailyResponse,
      eventResponse,
      presetsResponse,
      accountsResponse,
      packSlotsResponse,
    ] = await Promise.all([
      dailyQuery,
      eventQuery,
      presetsQuery,
      accountsQuery,
      packSlotsQuery,
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

    if (presetsResponse.error) {
      setError(presetsResponse.error.message);
      setLoading(false);
      return;
    }

    if (accountsResponse.error) {
      setError(accountsResponse.error.message);
      setLoading(false);
      return;
    }

    if (packSlotsResponse.error) {
      setError(packSlotsResponse.error.message);
      setLoading(false);
      return;
    }

    const rawAccounts = (accountsResponse.data || []) as Array<{
      id: number;
      alias: string;
      numero_cuenta: string;
      preset_id: number | null;
      presets?: { nombre: string } | { nombre: string }[] | null;
    }>;

    const mappedAccounts: AccountOption[] = rawAccounts.map((account) => {
      const presetRaw = Array.isArray(account.presets)
        ? account.presets[0]
        : account.presets;

      const presetNombre = presetRaw?.nombre ?? "Sin preset";

      return {
        id: account.id,
        alias: account.alias,
        numero_cuenta: account.numero_cuenta,
        preset_id: account.preset_id,
        preset_nombre: presetNombre,
        label: `${account.alias} · ${account.numero_cuenta}`,
      };
    });

    const rawPackSlots = (packSlotsResponse.data || []) as PackSlotRow[];
    const packMap = new Map<number, PackFilterItem>();

    rawPackSlots.forEach((row) => {
      const pack = getSinglePack(row.packs);
      if (!pack) return;

      const existing = packMap.get(pack.id) ?? {
        id: pack.id,
        nombre: pack.nombre,
        preset_id: pack.preset_id,
        slots: [],
      };

      existing.slots.push({
        slot: String(row.slot || "").trim().toUpperCase(),
        account_id: row.account_id,
      });

      packMap.set(pack.id, existing);
    });

    const mappedPacks = Array.from(packMap.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );

    setDailyResults((dailyResponse.data || []) as DailyResult[]);
    setEvents((eventResponse.data || []) as AccountEvent[]);
    setPresets((presetsResponse.data || []) as PresetOption[]);
    setAccounts(mappedAccounts);
    setPacks(mappedPacks);
    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, [currentMonth]);

  const presetName = useMemo(() => {
    if (selectedPresetId === "todos") return "Todos los presets";
    return (
      presets.find((preset) => String(preset.id) === selectedPresetId)?.nombre ??
      "Preset"
    );
  }, [presets, selectedPresetId]);

  const filteredPacks = useMemo(() => {
    if (selectedPresetId === "todos") return packs;
    const presetId = Number(selectedPresetId);
    return packs.filter((pack) => pack.preset_id === presetId);
  }, [packs, selectedPresetId]);

  useEffect(() => {
    if (
      selectedPackId !== null &&
      !filteredPacks.some((pack) => pack.id === selectedPackId)
    ) {
      setSelectedPackId(null);
      setSelectedSlots([]);
    }
  }, [filteredPacks, selectedPackId]);

  const selectedPack = useMemo(() => {
    if (selectedPackId === null) return null;
    return filteredPacks.find((pack) => pack.id === selectedPackId) ?? null;
  }, [filteredPacks, selectedPackId]);

  const availableSlots = useMemo(() => {
    if (!selectedPack) return [];
    const set = new Set(
      selectedPack.slots
        .map((slot) => slot.slot)
        .filter((slot) => SLOT_ORDER.includes(slot))
    );

    return SLOT_ORDER.filter((slot) => set.has(slot));
  }, [selectedPack]);

  useEffect(() => {
    setSelectedSlots((prev) => prev.filter((slot) => availableSlots.includes(slot)));
  }, [availableSlots]);

  const allowedAccountIds = useMemo(() => {
    let baseAccounts = accounts;

    if (selectedPresetId !== "todos") {
      const presetId = Number(selectedPresetId);
      baseAccounts = baseAccounts.filter((account) => account.preset_id === presetId);
    }

    let allowedIds = new Set(baseAccounts.map((account) => account.id));

    if (selectedPack) {
      const packAccountIds = new Set(
        selectedPack.slots
          .filter((slot) => slot.account_id !== null)
          .map((slot) => slot.account_id as number)
      );

      allowedIds = new Set(
        Array.from(allowedIds).filter((id) => packAccountIds.has(id))
      );
    }

    if (selectedPack && selectedSlots.length > 0) {
      const slotAccountIds = new Set(
        selectedPack.slots
          .filter(
            (slot) =>
              selectedSlots.includes(slot.slot) && slot.account_id !== null
          )
          .map((slot) => slot.account_id as number)
      );

      allowedIds = new Set(
        Array.from(allowedIds).filter((id) => slotAccountIds.has(id))
      );
    }

    return allowedIds;
  }, [accounts, selectedPresetId, selectedPack, selectedSlots]);

  const filteredResults = useMemo(() => {
    return dailyResults.filter((item) => allowedAccountIds.has(item.account_id));
  }, [dailyResults, allowedAccountIds]);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      if (!item.account_id) return true;
      return allowedAccountIds.has(item.account_id);
    });
  }, [events, allowedAccountIds]);

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
        resultDetails: [],
        eventDetails: [],
      };

      const account = getAccountData(result.accounts);

      existing.totalUsd += Number(result.pnl_usd || 0);
      existing.totalPct += Number(result.pnl_porcentaje || 0);
      existing.resultCount += 1;

      if (result.red_day) {
        existing.redDayCount += 1;
      }

      existing.resultDetails.push({
        id: result.id,
        accountId: result.account_id,
        alias: account?.alias ?? "-",
        numeroCuenta: account?.numero_cuenta ?? "-",
        pnlUsd: Number(result.pnl_usd || 0),
        pnlPct: Number(result.pnl_porcentaje || 0),
        redDay: result.red_day,
      });

      resultMap.set(key, existing);
    });

    filteredEvents.forEach((event) => {
      if (!isImportantEvent(event.tipo_evento)) {
        return;
      }

      const dateKey = event.fecha;
      const target = resultMap.get(dateKey) ?? {
        fecha: dateKey,
        totalUsd: 0,
        totalPct: 0,
        resultCount: 0,
        redDayCount: 0,
        events: [],
        resultDetails: [],
        eventDetails: [],
      };

      const account = getAccountData(event.accounts);
      const kind = mapEventKind(event.tipo_evento);

      target.eventDetails.push({
        id: event.id,
        tipo: buildEventLabel(event),
        descripcion: event.descripcion ?? "",
        alias: account?.alias ?? "-",
        numeroCuenta: account?.numero_cuenta ?? "-",
      });

      target.events.push({
        id: `${event.id}`,
        kind,
        label: buildEventLabel(event),
      });

      resultMap.set(dateKey, target);
    });

    resultMap.forEach((day) => {
      const grouped = new Map<string, CalendarEventItem>();

      day.events.forEach((event) => {
        const key = `${event.kind}_${event.label}`;
        const existing = grouped.get(key);

        if (existing) {
          existing.count = (existing.count ?? 1) + 1;
        } else {
          grouped.set(key, { ...event, count: 1 });
        }
      });

      day.events = Array.from(grouped.values())
        .map((event) => ({
          ...event,
          label:
            event.count && event.count > 1
              ? `${event.label} ×${event.count}`
              : event.label,
        }))
        .slice(0, 4);

      day.resultDetails.sort((a, b) => a.alias.localeCompare(b.alias));
      day.eventDetails.sort((a, b) => a.tipo.localeCompare(b.tipo));
    });

    return resultMap;
  }, [filteredResults, filteredEvents]);

  const calendarCells = useMemo(() => buildCalendarMatrix(currentMonth), [currentMonth]);

  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];

    for (let i = 0; i < calendarCells.length; i += 7) {
      weeks.push(calendarCells.slice(i, i + 7));
    }

    return weeks;
  }, [calendarCells]);

  const compactWeekFlags = useMemo(() => {
    return calendarWeeks.map((week) => {
      return !week.some((date) => {
        const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
        if (!isCurrentMonth) return false;

        const dayData = dailyMap.get(toDateKey(date));

        if (!dayData) return false;
        if (dayData.resultCount > 0) return true;
        if (dayData.events.length > 0) return true;

        return false;
      });
    });
  }, [calendarWeeks, currentMonth, dailyMap]);

  const monthSummary = useMemo(() => {
    const values = Array.from(dailyMap.values());

    return values.reduce(
      (acc, day) => {
        acc.totalUsd += day.totalUsd;
        acc.totalPct += day.totalPct;
        return acc;
      },
      {
        totalUsd: 0,
        totalPct: 0,
      }
    );
  }, [dailyMap]);

  const selectedDay = selectedDayKey ? dailyMap.get(selectedDayKey) : undefined;

  const monthUsdColor =
    monthSummary.totalUsd > 0
      ? "text-emerald-300"
      : monthSummary.totalUsd < 0
      ? "text-rose-300"
      : "text-white";

  const monthPctColor =
    monthSummary.totalPct > 0
      ? "text-emerald-300"
      : monthSummary.totalPct < 0
      ? "text-rose-300"
      : "text-white";

  function previousMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
    setSelectedDayKey(null);
    setIsDetailOpen(false);
  }

  function nextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
    setSelectedDayKey(null);
    setIsDetailOpen(false);
  }

  function getDayTone(day: CalendarDayData | undefined) {
    if (!day) return "border-white/5 bg-white/[0.02]";
    if (viewMode === "events") {
      return day.events.length > 0
        ? "border-white/10 bg-white/[0.03]"
        : "border-white/5 bg-white/[0.02]";
    }
    if (day.totalUsd > 0) return "border-emerald-400/25 bg-emerald-400/[0.08]";
    if (day.totalUsd < 0) return "border-rose-400/25 bg-rose-400/[0.08]";
    return "border-white/10 bg-white/[0.03]";
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

            <div className="relative" ref={presetDropdownRef}>
              <button
                type="button"
                onClick={() => setShowPresetDropdown((prev) => !prev)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  showPresetDropdown
                    ? "border-sky-300/20 bg-sky-300/[0.10] text-white"
                    : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                }`}
              >
                Presets
              </button>

              {showPresetDropdown && (
                <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,32,0.92),rgba(8,16,28,0.88))] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPresetId("todos");
                      setSelectedPackId(null);
                      setSelectedSlots([]);
                      setShowPresetDropdown(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      selectedPresetId === "todos"
                        ? "bg-white/[0.08] text-white"
                        : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    Todos los presets
                  </button>

                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => {
                        setSelectedPresetId(String(preset.id));
                        setSelectedPackId(null);
                        setSelectedSlots([]);
                        setShowPresetDropdown(false);
                      }}
                      className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedPresetId === String(preset.id)
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {preset.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200">
              {presetName}
            </div>
          </div>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              PnL mes USD
            </p>
            <p className={`mt-2 text-2xl font-semibold ${monthUsdColor}`}>
              {formatUsd(monthSummary.totalUsd)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              PnL mes %
            </p>
            <p className={`mt-2 text-2xl font-semibold ${monthPctColor}`}>
              {formatPct(monthSummary.totalPct)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-center gap-2">
              {filteredPacks.length === 0 ? (
                <div className="text-sm text-zinc-500">No hay packs para este preset.</div>
              ) : (
                filteredPacks.map((pack) => {
                  const active = selectedPackId === pack.id;

                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => {
                        if (selectedPackId === pack.id) {
                          setSelectedPackId(null);
                          setSelectedSlots([]);
                          return;
                        }

                        setSelectedPackId(pack.id);
                        setSelectedSlots([]);
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "border-sky-300/20 bg-sky-300/[0.10] text-white"
                          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                      }`}
                    >
                      {pack.nombre}
                    </button>
                  );
                })
              )}

              {selectedPack &&
                availableSlots.map((slot) => {
                  const active = selectedSlots.includes(slot);

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedSlots((prev) =>
                          prev.includes(slot)
                            ? prev.filter((item) => item !== slot)
                            : [...prev, slot]
                        );
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "border-emerald-300/20 bg-emerald-300/[0.12] text-emerald-200"
                          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
            </div>
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
          <div
            className={`grid grid-cols-1 gap-4 ${
              isDetailOpen ? "xl:grid-cols-[1fr_340px]" : ""
            }`}
          >
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

              {calendarWeeks.map((week, weekIndex) => {
                const compactWeek = compactWeekFlags[weekIndex];

                return (
                  <div key={`week_${weekIndex}`} className="grid grid-cols-7 gap-2">
                    {week.map((date) => {
                      const dateKey = toDateKey(date);
                      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                      const dayData = dailyMap.get(dateKey);
                      const hasVisibleContent =
                        (viewMode === "pnl" && !!dayData?.resultCount) ||
                        (viewMode === "events" && !!dayData?.events.length);

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => {
                            if (!isCurrentMonth) return;

                            if (selectedDayKey === dateKey && isDetailOpen) {
                              setIsDetailOpen(false);
                              return;
                            }

                            setSelectedDayKey(dateKey);
                            setIsDetailOpen(true);
                          }}
                          className={`rounded-2xl border p-3 text-left transition ${getDayTone(
                            dayData
                          )} ${
                            !isCurrentMonth ? "opacity-35" : "opacity-100"
                          } ${
                            selectedDayKey === dateKey && isDetailOpen
                              ? "shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                              : ""
                          } ${
                            compactWeek ? "min-h-[74px]" : "min-h-[138px]"
                          }`}
                        >
                          <div className="flex h-full flex-col">
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

                            <div className="flex flex-1 items-center justify-center">
                              {hasVisibleContent ? (
                                viewMode === "pnl" ? (
                                  <div className="w-full text-center">
                                    <p
                                      className={`text-2xl font-semibold leading-none ${
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
                                      className={`mt-2 text-sm font-medium ${
                                        dayData && dayData.totalPct > 0
                                          ? "text-emerald-300"
                                          : dayData && dayData.totalPct < 0
                                          ? "text-rose-300"
                                          : "text-zinc-300"
                                      }`}
                                    >
                                      {dayData ? formatPct(dayData.totalPct) : "-"}
                                    </p>

                                    <p className="mt-2 text-[11px] text-zinc-500">
                                      {dayData?.redDayCount
                                        ? `${dayData.redDayCount} red day`
                                        : `${dayData?.resultCount ?? 0} cuenta${
                                            dayData?.resultCount === 1 ? "" : "s"
                                          }`}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex w-full flex-col items-center gap-1.5">
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
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {isDetailOpen && (
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      Fecha
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {selectedDayKey ?? "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06]"
                  >
                    ✕
                  </button>
                </div>

                {!selectedDay ? (
                  <div className="flex min-h-[240px] items-center justify-center text-center text-sm text-zinc-500">
                    No hay datos para este día.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                          USD
                        </p>
                        <p
                          className={`mt-2 text-xl font-semibold ${
                            selectedDay.totalUsd > 0
                              ? "text-emerald-300"
                              : selectedDay.totalUsd < 0
                              ? "text-rose-300"
                              : "text-white"
                          }`}
                        >
                          {formatUsd(selectedDay.totalUsd)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                          %
                        </p>
                        <p
                          className={`mt-2 text-xl font-semibold ${
                            selectedDay.totalPct > 0
                              ? "text-emerald-300"
                              : selectedDay.totalPct < 0
                              ? "text-rose-300"
                              : "text-white"
                          }`}
                        >
                          {formatPct(selectedDay.totalPct)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">Resultados</p>

                      {selectedDay.resultDetails.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-500">
                          Sin resultados.
                        </div>
                      ) : (
                        selectedDay.resultDetails.map((result) => (
                          <div
                            key={result.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <p className="text-sm font-medium text-white">
                              {result.alias} · {result.numeroCuenta}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                              <span
                                className={
                                  result.pnlUsd > 0
                                    ? "text-emerald-300"
                                    : result.pnlUsd < 0
                                    ? "text-rose-300"
                                    : "text-zinc-300"
                                }
                              >
                                {formatUsd(result.pnlUsd)}
                              </span>
                              <span
                                className={
                                  result.pnlPct > 0
                                    ? "text-emerald-300"
                                    : result.pnlPct < 0
                                    ? "text-rose-300"
                                    : "text-zinc-300"
                                }
                              >
                                {formatPct(result.pnlPct)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">Eventos</p>

                      {selectedDay.eventDetails.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-500">
                          Sin eventos.
                        </div>
                      ) : (
                        selectedDay.eventDetails.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <p className="text-sm font-medium text-white">{event.tipo}</p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {event.alias} · {event.numeroCuenta}
                            </p>
                            {event.descripcion ? (
                              <p className="mt-2 text-sm text-zinc-500">{event.descripcion}</p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}