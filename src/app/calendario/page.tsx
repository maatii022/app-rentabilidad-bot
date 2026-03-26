"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PresetOption = {
  id: number;
  nombre: string;
};

type AccountOption = {
  id: number;
  alias: string;
  numero_cuenta: string;
  preset_id: number | null;
  tipo_cuenta: string | null;
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
        tipo_pack: string | null;
      }
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
        tipo_pack: string | null;
      }[]
    | null;
};

type PackFilterItem = {
  id: number;
  nombre: string;
  preset_id: number | null;
  tipo_pack: string | null;
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
    numeroTrades: number;
  }[];
  eventDetails: {
    id: number;
    tipo: string;
    descripcion: string;
    alias: string;
    numeroCuenta: string;
  }[];
};

type TradingMode = "pnl" | "events";
type CuentaTipoFiltro = "prueba" | "fondeada";

type CalendarApiResultItem = {
  id: number;
  account_id: number;
  alias: string;
  numero_cuenta: string;
  pnl_usd: number;
  pnl_pct: number;
  red_day: boolean;
  numero_trades: number;
};

type CalendarApiEventItem = {
  id: number;
  tipo: string;
  descripcion: string | null;
  account_id: number;
  alias: string;
  numero_cuenta: string;
};

type CalendarApiDay = {
  fecha: string;
  pnl_usd: number;
  pnl_pct: number;
  trades: number;
  red_day: boolean;
  results: CalendarApiResultItem[];
  events: {
    perdida: number;
    fondeada: number;
    reemplazo: number;
    sord_in: number;
    sord_out: number;
    otros: number;
    items: CalendarApiEventItem[];
  };
};

type CalendarApiResponse = {
  ok: boolean;
  error?: string;
  days?: CalendarApiDay[];
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const SLOT_ORDER = ["A", "B", "C"];

function getSinglePack(
  pack:
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
        tipo_pack: string | null;
      }
    | {
        id: number;
        nombre: string;
        preset_id: number | null;
        tipo_pack: string | null;
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
  const text = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
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

function buildEventLabel(tipoEvento: string) {
  const tipo = tipoEvento.toLowerCase();

  if (tipo === "perdida") return "Cuenta perdida";
  if (tipo === "fondeada") return "Cuenta fondeada";
  if (tipo.includes("reemplazo")) return "Reemplazo";

  return tipoEvento;
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

function SegmentedButton({
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
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-emerald-300/20 bg-emerald-400 text-black shadow-[0_12px_30px_rgba(16,185,129,0.18)]"
          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06] hover:shadow-[0_10px_24px_rgba(255,255,255,0.04)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  compact = false,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border text-sm font-medium transition-all duration-200 ${
        compact ? "px-3 py-2" : "px-4 py-2.5"
      } ${
        active
          ? "scale-[0.985] border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(56,189,248,0.07))] text-white shadow-[0_12px_30px_rgba(56,189,248,0.16)]"
          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_10px_24px_rgba(255,255,255,0.04)]"
      }`}
    >
      {label}
    </button>
  );
}

function SlotButton({
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
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "scale-[0.985] border-emerald-300/20 bg-emerald-300/[0.14] text-emerald-200 shadow-[0_10px_24px_rgba(16,185,129,0.14)]"
          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06] hover:shadow-[0_8px_18px_rgba(255,255,255,0.04)]"
      }`}
    >
      {label}
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const styles = {
    primary:
      "border border-white/10 bg-white text-black shadow-[0_12px_26px_rgba(255,255,255,0.08)] hover:bg-zinc-200",
    secondary:
      "border border-white/10 bg-white/[0.04] text-white shadow-[0_10px_24px_rgba(255,255,255,0.03)] hover:bg-white/[0.08]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function getEventPillClasses(kind: CalendarEventItem["kind"]) {
  if (kind === "perdida") return "border-amber-300/20 bg-amber-300/[0.10] text-amber-200 shadow-[0_8px_18px_rgba(251,191,36,0.08)]";
  if (kind === "fondeada") return "border-violet-300/20 bg-violet-300/[0.10] text-violet-200 shadow-[0_8px_18px_rgba(167,139,250,0.08)]";
  if (kind === "reemplazo") return "border-emerald-300/20 bg-emerald-300/[0.10] text-emerald-200 shadow-[0_8px_18px_rgba(16,185,129,0.08)]";
  return "border-white/10 bg-white/[0.05] text-zinc-300";
}

function getToneByValue(value: number) {
  if (value > 0) {
    return "border-emerald-400/25 bg-emerald-400/[0.08] shadow-[0_14px_30px_rgba(16,185,129,0.08)]";
  }

  if (value < 0) {
    return "border-rose-400/25 bg-rose-400/[0.08] shadow-[0_14px_30px_rgba(244,63,94,0.08)]";
  }

  return "border-white/10 bg-white/[0.03] shadow-[0_10px_24px_rgba(255,255,255,0.03)]";
}

function hasVisibleResult(result: CalendarApiResultItem) {
  return (
    Number(result.numero_trades || 0) > 0 ||
    Number(result.pnl_usd || 0) !== 0 ||
    Number(result.pnl_pct || 0) !== 0
  );
}

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarDays, setCalendarDays] = useState<CalendarApiDay[]>([]);
  const [presets, setPresets] = useState<PresetOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [packs, setPacks] = useState<PackFilterItem[]>([]);
  const [reloading, setReloading] = useState(false);

  const [viewMode, setViewMode] = useState<TradingMode>("pnl");
  const [selectedCuentaTipo, setSelectedCuentaTipo] =
    useState<CuentaTipoFiltro>("prueba");

  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(["all"]);
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  async function cargarDatos(showReloadState = false) {
    if (showReloadState) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    setError("");

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

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
        tipo_cuenta
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
          preset_id,
          tipo_pack
        )
      `)
      .order("pack_id", { ascending: true });

    const calendarQuery = fetch(
      `/api/calendar-data?year=${year}&month=${month}`,
      {
        cache: "no-store",
      }
    ).then((res) => res.json() as Promise<CalendarApiResponse>);

    const [
      presetsResponse,
      accountsResponse,
      packSlotsResponse,
      calendarResponse,
    ] = await Promise.all([
      presetsQuery,
      accountsQuery,
      packSlotsQuery,
      calendarQuery,
    ]);

    if (presetsResponse.error) {
      setError(presetsResponse.error.message);
      setLoading(false);
      setReloading(false);
      return;
    }

    if (accountsResponse.error) {
      setError(accountsResponse.error.message);
      setLoading(false);
      setReloading(false);
      return;
    }

    if (packSlotsResponse.error) {
      setError(packSlotsResponse.error.message);
      setLoading(false);
      setReloading(false);
      return;
    }

    if (!calendarResponse.ok) {
      setError(calendarResponse.error || "Error cargando calendar-data");
      setLoading(false);
      setReloading(false);
      return;
    }

    const mappedAccounts = (accountsResponse.data || []) as AccountOption[];

    const rawPackSlots = (packSlotsResponse.data || []) as PackSlotRow[];
    const packMap = new Map<number, PackFilterItem>();

    rawPackSlots.forEach((row) => {
      const pack = getSinglePack(row.packs);
      if (!pack) return;

      const existing = packMap.get(pack.id) ?? {
        id: pack.id,
        nombre: pack.nombre,
        preset_id: pack.preset_id,
        tipo_pack: pack.tipo_pack,
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

    setCalendarDays(calendarResponse.days || []);
    setPresets((presetsResponse.data || []) as PresetOption[]);
    setAccounts(mappedAccounts);
    setPacks(mappedPacks);
    setLoading(false);
    setReloading(false);
  }

  useEffect(() => {
    void cargarDatos();
  }, [currentMonth]);

  useEffect(() => {
    setSelectedPackId(null);
    setSelectedSlots([]);
    setSelectedDayKey(null);
    setIsDetailOpen(false);
  }, [selectedCuentaTipo]);

  const filteredPresets = useMemo(() => {
    const presetIdsForType = new Set(
      accounts
        .filter((account) => account.tipo_cuenta === selectedCuentaTipo)
        .map((account) => account.preset_id)
        .filter((id): id is number => id !== null)
    );

    return presets.filter((preset) => presetIdsForType.has(preset.id));
  }, [accounts, presets, selectedCuentaTipo]);

  useEffect(() => {
    const allowedPresetIds = new Set(filteredPresets.map((preset) => String(preset.id)));

    if (selectedPresetIds.includes("all")) return;

    const next = selectedPresetIds.filter((id) => allowedPresetIds.has(id));

    if (next.length === 0) {
      setSelectedPresetIds(["all"]);
      setSelectedPackId(null);
      setSelectedSlots([]);
      return;
    }

    if (next.length !== selectedPresetIds.length) {
      setSelectedPresetIds(next);
      setSelectedPackId(null);
      setSelectedSlots([]);
    }
  }, [filteredPresets, selectedPresetIds]);

  const isAllSelected = selectedPresetIds.includes("all");

  const selectedSinglePresetId = useMemo(() => {
    if (isAllSelected) return null;
    return selectedPresetIds.length === 1 ? Number(selectedPresetIds[0]) : null;
  }, [isAllSelected, selectedPresetIds]);

  const filteredPacks = useMemo(() => {
    if (selectedSinglePresetId === null) return [];

    return packs.filter(
      (pack) =>
        pack.preset_id === selectedSinglePresetId &&
        (pack.tipo_pack ?? "").toLowerCase() === selectedCuentaTipo
    );
  }, [packs, selectedSinglePresetId, selectedCuentaTipo]);

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

  function togglePreset(presetId: string) {
    if (presetId === "all") {
      setSelectedPresetIds(["all"]);
      setSelectedPackId(null);
      setSelectedSlots([]);
      setSelectedDayKey(null);
      setIsDetailOpen(false);
      return;
    }

    if (isAllSelected) {
      setSelectedPresetIds([presetId]);
      setSelectedPackId(null);
      setSelectedSlots([]);
      setSelectedDayKey(null);
      setIsDetailOpen(false);
      return;
    }

    const exists = selectedPresetIds.includes(presetId);
    const next = exists
      ? selectedPresetIds.filter((id) => id !== presetId)
      : [...selectedPresetIds, presetId];

    if (next.length === 0) {
      setSelectedPresetIds(["all"]);
      setSelectedPackId(null);
      setSelectedSlots([]);
      setSelectedDayKey(null);
      setIsDetailOpen(false);
      return;
    }

    setSelectedPresetIds(next);
    setSelectedPackId(null);
    setSelectedSlots([]);
    setSelectedDayKey(null);
    setIsDetailOpen(false);
  }

  const allowedAccountIds = useMemo(() => {
    let baseAccounts = accounts.filter(
      (account) => (account.tipo_cuenta ?? "").toLowerCase() === selectedCuentaTipo
    );

    if (!isAllSelected) {
      const selectedPresetNumbers = new Set(selectedPresetIds.map((id) => Number(id)));
      baseAccounts = baseAccounts.filter(
        (account) =>
          account.preset_id !== null && selectedPresetNumbers.has(account.preset_id)
      );
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
  }, [accounts, isAllSelected, selectedCuentaTipo, selectedPack, selectedPresetIds, selectedSlots]);

  const dailyMap = useMemo(() => {
    const resultMap = new Map<string, CalendarDayData>();

    calendarDays.forEach((day) => {
      const filteredResults = (day.results || []).filter(
        (result) => allowedAccountIds.has(result.account_id) && hasVisibleResult(result)
      );

      const importantItems = (day.events?.items || []).filter(
        (event) => allowedAccountIds.has(event.account_id) && isImportantEvent(event.tipo)
      );

      const totalUsd = filteredResults.reduce((acc, item) => acc + Number(item.pnl_usd || 0), 0);
      const totalPct = filteredResults.reduce((acc, item) => acc + Number(item.pnl_pct || 0), 0);
      const redDayCount = filteredResults.filter((item) => item.red_day).length;

      const resultDetails = filteredResults
        .map((result) => ({
          id: result.id,
          accountId: result.account_id,
          alias: result.alias ?? "-",
          numeroCuenta: result.numero_cuenta ?? "-",
          pnlUsd: Number(result.pnl_usd || 0),
          pnlPct: Number(result.pnl_pct || 0),
          redDay: !!result.red_day,
          numeroTrades: Number(result.numero_trades || 0),
        }))
        .sort((a, b) => a.alias.localeCompare(b.alias));

      const eventDetails = importantItems
        .map((event) => ({
          id: event.id,
          tipo: buildEventLabel(event.tipo),
          descripcion: event.descripcion ?? "",
          alias: event.alias ?? "-",
          numeroCuenta: event.numero_cuenta ?? "-",
        }))
        .sort((a, b) => a.tipo.localeCompare(b.tipo));

      const grouped = new Map<string, CalendarEventItem>();

      importantItems.forEach((event) => {
        const kind = mapEventKind(event.tipo);
        const label = buildEventLabel(event.tipo);
        const key = `${kind}_${label}`;
        const existing = grouped.get(key);

        if (existing) {
          existing.count = (existing.count ?? 1) + 1;
        } else {
          grouped.set(key, {
            id: `${event.id}`,
            kind,
            label,
            count: 1,
          });
        }
      });

      const events = Array.from(grouped.values())
        .map((event) => ({
          ...event,
          label:
            event.count && event.count > 1
              ? `${event.label} ×${event.count}`
              : event.label,
        }))
        .slice(0, 4);

      resultMap.set(day.fecha, {
        fecha: day.fecha,
        totalUsd,
        totalPct,
        resultCount: resultDetails.length,
        redDayCount,
        events,
        resultDetails,
        eventDetails,
      });
    });

    return resultMap;
  }, [calendarDays, allowedAccountIds]);

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
        ? "border-white/10 bg-white/[0.03] shadow-[0_10px_24px_rgba(255,255,255,0.03)]"
        : "border-white/5 bg-white/[0.02]";
    }
    if (day.totalUsd > 0) {
      return "border-emerald-400/25 bg-emerald-400/[0.08] shadow-[0_14px_30px_rgba(16,185,129,0.08)]";
    }
    if (day.totalUsd < 0) {
      return "border-rose-400/25 bg-rose-400/[0.08] shadow-[0_14px_30px_rgba(244,63,94,0.08)]";
    }
    return "border-white/10 bg-white/[0.03] shadow-[0_10px_24px_rgba(255,255,255,0.03)]";
  }

  return (
    <div className="space-y-5 text-white">
      <SectionCard
        title="Trading Calendar"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              onClick={() => void cargarDatos(true)}
              disabled={loading || reloading}
              variant="secondary"
            >
              {reloading ? "Recargando..." : "Recargar"}
            </ActionButton>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-1 shadow-[0_12px_30px_rgba(255,255,255,0.03)]">
              <div className="flex gap-1">
                <SegmentedButton
                  label="PNL"
                  active={viewMode === "pnl"}
                  onClick={() => setViewMode("pnl")}
                />
                <SegmentedButton
                  label="Events"
                  active={viewMode === "events"}
                  onClick={() => setViewMode("events")}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-1 shadow-[0_12px_30px_rgba(255,255,255,0.03)]">
              <div className="flex gap-1">
                <SegmentedButton
                  label="Pruebas"
                  active={selectedCuentaTipo === "prueba"}
                  onClick={() => setSelectedCuentaTipo("prueba")}
                />
                <SegmentedButton
                  label="Fondeadas"
                  active={selectedCuentaTipo === "fondeada"}
                  onClick={() => setSelectedCuentaTipo("fondeada")}
                />
              </div>
            </div>
          </div>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_2fr]">
          <div className={`rounded-2xl border p-3 ${getToneByValue(monthSummary.totalUsd)}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              PnL mes USD
            </p>
            <p className={`mt-2 text-2xl font-semibold ${monthUsdColor}`}>
              {formatUsd(monthSummary.totalUsd)}
            </p>
          </div>

          <div className={`rounded-2xl border p-3 ${getToneByValue(monthSummary.totalPct)}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              PnL mes %
            </p>
            <p className={`mt-2 text-2xl font-semibold ${monthPctColor}`}>
              {formatPct(monthSummary.totalPct)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_12px_30px_rgba(255,255,255,0.03)]">
            <div className="flex h-full flex-wrap items-center gap-2">
              <FilterButton
                label="All"
                active={isAllSelected}
                onClick={() => togglePreset("all")}
              />

              {filteredPresets.map((preset) => (
                <FilterButton
                  key={preset.id}
                  label={preset.nombre}
                  active={selectedPresetIds.includes(String(preset.id))}
                  onClick={() => togglePreset(String(preset.id))}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_12px_30px_rgba(255,255,255,0.03)]">
            {selectedSinglePresetId === null ? (
              <div className="text-sm text-zinc-500">
                Selecciona un solo preset para ver sus packs.
              </div>
            ) : filteredPacks.length === 0 ? (
              <div className="text-sm text-zinc-500">
                No hay packs disponibles para este preset y este tipo de cuenta.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {filteredPacks.map((pack) => {
                  const active = selectedPackId === pack.id;

                  return (
                    <div
                      key={pack.id}
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        active ? "scale-[0.99]" : ""
                      }`}
                    >
                      <FilterButton
                        label={pack.nombre}
                        active={active}
                        compact={active}
                        onClick={() => {
                          if (selectedPackId === pack.id) {
                            setSelectedPackId(null);
                            setSelectedSlots([]);
                            return;
                          }

                          setSelectedPackId(pack.id);
                          setSelectedSlots([]);
                        }}
                      />

                      <div
                        className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
                          active ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0"
                        }`}
                      >
                        {availableSlots.map((slot) => (
                          <SlotButton
                            key={`${pack.id}_${slot}`}
                            label={slot}
                            active={selectedSlots.includes(slot)}
                            onClick={() => {
                              setSelectedSlots((prev) =>
                                prev.includes(slot)
                                  ? prev.filter((item) => item !== slot)
                                  : [...prev, slot]
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={previousMonth}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300 shadow-[0_10px_24px_rgba(255,255,255,0.03)] transition hover:bg-white/[0.06]"
            >
              ←
            </button>

            <p className="text-xl font-semibold text-white">
              {getMonthLabel(currentMonth)}
            </p>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300 shadow-[0_10px_24px_rgba(255,255,255,0.03)] transition hover:bg-white/[0.06]"
            >
              →
            </button>
          </div>
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
                    className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 shadow-[0_8px_18px_rgba(255,255,255,0.02)]"
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
                          className={`rounded-2xl border p-3 text-left transition-all duration-200 ${getDayTone(
                            dayData
                          )} ${
                            !isCurrentMonth ? "opacity-35" : "opacity-100"
                          } ${
                            selectedDayKey === dateKey && isDetailOpen
                              ? "shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_18px_36px_rgba(255,255,255,0.04)]"
                              : "hover:shadow-[0_12px_28px_rgba(255,255,255,0.03)]"
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
                                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-400 shadow-[0_6px_14px_rgba(255,255,255,0.03)]">
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
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
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
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 shadow-[0_10px_24px_rgba(255,255,255,0.03)] transition hover:bg-white/[0.06]"
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
                      <div
                        className={`rounded-2xl border p-3 ${getToneByValue(
                          selectedDay.totalUsd
                        )}`}
                      >
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

                      <div
                        className={`rounded-2xl border p-3 ${getToneByValue(
                          selectedDay.totalPct
                        )}`}
                      >
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
                            className={`rounded-2xl border p-3 ${getToneByValue(
                              result.pnlUsd
                            )}`}
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
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_10px_24px_rgba(255,255,255,0.03)]"
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