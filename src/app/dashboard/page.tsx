"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PackSlot = {
  id: number;
  slot: string;
  es_activa: boolean;
  pendiente_reemplazo: boolean;
  orden: number;
  accounts?: {
    id: number;
    alias: string;
    numero_cuenta: string;
    estado: string;
    tipo_cuenta: string;
  };
};

type Pack = {
  id: number;
  nombre: string;
  tipo_pack: string;
  presets?: {
    nombre: string;
  };
  pack_slots: PackSlot[];
};

type AccountEvent = {
  id: number;
  fecha: string;
  tipo_evento: string;
  descripcion?: string;
  accounts?: {
    alias: string;
    numero_cuenta: string;
  };
};

type PendingSlotOption = {
  value: string;
  slotId?: number;
  packId: number;
  slot: string;
  label: string;
};

type DashboardSummary = {
  fondeadasHistoricas: number;
  perdidasHistoricas: number;
};

type ResultadoRevisionDiaria = {
  packId: number;
  packNombre: string;
  ok: boolean;
  mensaje: string;
};

type LiveStatusItem = {
  preset?: string;
  pnl_actual?: number | null;
  pnl_pct_actual?: number | null;
  pnl_hoy_usd?: number | null;
  pnl_hoy_pct?: number | null;
  profit_total_pct?: number | null;
  trades_abiertos?: number | null;
  balance?: number | null;
  error?: string;
};

type LiveStatusMap = Record<string, LiveStatusItem>;

type ReplaceTarget = {
  slotId?: number;
  packId: number;
  slot: string;
};

type DayPnlCacheMap = Record<
  string,
  {
    date: string;
    pct: number | null;
    usd: number | null;
    totalPct: number | null;
  }
>;

const LIVE_STATUS_CACHE_KEY = "app_rentabilidad_bot_live_status_cache_v1";
const LIVE_DAY_PNL_CACHE_KEY = "app_rentabilidad_bot_live_day_pnl_cache_v1";
const REQUIRED_SLOTS = ["A", "B", "C"];

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "blue" | "amber" | "green" | "violet" | "red";
}) {
  const toneClasses = {
    neutral:
      "border-white/10 bg-white/[0.03] shadow-[0_12px_28px_rgba(255,255,255,0.03)]",
    blue:
      "border-sky-400/20 bg-sky-400/[0.08] shadow-[0_14px_30px_rgba(56,189,248,0.08)]",
    amber:
      "border-amber-300/20 bg-amber-300/[0.08] shadow-[0_14px_30px_rgba(251,191,36,0.08)]",
    green:
      "border-emerald-400/20 bg-emerald-400/[0.08] shadow-[0_14px_30px_rgba(16,185,129,0.08)]",
    violet:
      "border-violet-400/20 bg-violet-400/[0.08] shadow-[0_14px_30px_rgba(167,139,250,0.08)]",
    red:
      "border-rose-400/20 bg-rose-400/[0.08] shadow-[0_14px_30px_rgba(244,63,94,0.08)]",
  };

  return (
    <div className={`rounded-2xl border p-3 ${toneClasses[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-white">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "warning";
}) {
  const styles = {
    primary:
      "border border-white/10 bg-white text-black shadow-[0_12px_26px_rgba(255,255,255,0.08)] hover:bg-zinc-200",
    secondary:
      "border border-white/10 bg-white/[0.04] text-white shadow-[0_10px_24px_rgba(255,255,255,0.03)] hover:bg-white/[0.08]",
    danger:
      "border border-white/10 bg-zinc-800 text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] hover:bg-zinc-700",
    ghost:
      "border border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.05] hover:text-white",
    warning:
      "border border-amber-300/20 bg-amber-300/[0.10] text-amber-100 shadow-[0_12px_26px_rgba(251,191,36,0.10)] hover:bg-amber-300/[0.14]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] text-zinc-400">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-black/30 ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:bg-black/30 ${props.className || ""}`}
    />
  );
}

function formatEventDate(value: string) {
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

function getEventTone(tipo: string) {
  if (tipo === "SORD in") return "text-emerald-300";
  if (tipo === "SORD out") return "text-rose-300";
  if (tipo === "perdida") return "text-amber-300";
  if (tipo === "fondeada") return "text-violet-300";
  return "text-zinc-200";
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
}

function normalizeSlotName(slot: string | undefined) {
  return String(slot || "").trim().toUpperCase();
}

function buildPendingSlotValue(target: ReplaceTarget) {
  return `${target.packId}__${target.slot}__${target.slotId ?? ""}`;
}

function parsePendingSlotValue(value: string): ReplaceTarget | null {
  if (!value) return null;

  const [packIdRaw, slotRaw, slotIdRaw] = value.split("__");
  const packId = Number(packIdRaw);
  const slot = normalizeSlotName(slotRaw);

  if (!Number.isFinite(packId) || packId <= 0 || !slot) {
    return null;
  }

  const slotId = Number(slotIdRaw);

  return {
    packId,
    slot,
    slotId: Number.isFinite(slotId) && slotId > 0 ? slotId : undefined,
  };
}

function getPackFlags(pack: Pack) {
  const slots = pack.pack_slots ?? [];
  const presentSlots = new Set(slots.map((slot) => normalizeSlotName(slot.slot)));

  const hasPendingReplacement = slots.some((slot) => slot.pendiente_reemplazo);
  const hasMissingAccount = slots.some((slot) => !slot.accounts?.id);
  const hasMissingRequiredSlot = REQUIRED_SLOTS.some((required) => !presentSlots.has(required));

  return {
    hasPendingReplacement,
    hasMissingAccount,
    hasMissingRequiredSlot,
    isIncomplete: hasMissingAccount || hasMissingRequiredSlot,
  };
}

function buildDisplaySlots(pack: Pack): PackSlot[] {
  const original = [...(pack.pack_slots ?? [])];
  const existing = new Set(original.map((slot) => normalizeSlotName(slot.slot)));

  for (const requiredSlot of REQUIRED_SLOTS) {
    if (!existing.has(requiredSlot)) {
      const orden =
        requiredSlot === "A" ? 1 : requiredSlot === "B" ? 2 : 3;

      original.push({
        id: -(pack.id * 100 + orden),
        slot: requiredSlot,
        es_activa: false,
        pendiente_reemplazo: false,
        orden,
      });
    }
  }

  return original.sort((a, b) => a.orden - b.orden);
}

function readLiveStatusCache(): LiveStatusMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LIVE_STATUS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as LiveStatusMap;
  } catch {
    return {};
  }
}

function writeLiveStatusCache(data: LiveStatusMap) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIVE_STATUS_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function readLiveDayPnlCache(): DayPnlCacheMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LIVE_DAY_PNL_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as DayPnlCacheMap;
  } catch {
    return {};
  }
}

function writeLiveDayPnlCache(data: DayPnlCacheMap) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIVE_DAY_PNL_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function resolveDisplayDayPct(
  numeroCuenta: string,
  live: LiveStatusItem | undefined,
  dayPnlCache: DayPnlCacheMap
) {
  const todayKey = getTodayKey();
  const cached = dayPnlCache[numeroCuenta];

  const incomingPct =
    typeof live?.pnl_hoy_pct === "number" && !Number.isNaN(live.pnl_hoy_pct)
      ? live.pnl_hoy_pct
      : typeof live?.pnl_pct_actual === "number" && !Number.isNaN(live.pnl_pct_actual)
      ? live.pnl_pct_actual
      : null;

  if (cached && cached.date === todayKey) {
    if (incomingPct === null || incomingPct === 0) {
      return cached.pct;
    }
    return incomingPct;
  }

  return incomingPct;
}

function resolveDisplayTotalPct(
  numeroCuenta: string,
  live: LiveStatusItem | undefined,
  dayPnlCache: DayPnlCacheMap
) {
  const todayKey = getTodayKey();
  const cached = dayPnlCache[numeroCuenta];

  const incomingTotalPct =
    typeof live?.profit_total_pct === "number" && !Number.isNaN(live.profit_total_pct)
      ? live.profit_total_pct
      : null;

  const displayDayPct = resolveDisplayDayPct(numeroCuenta, live, dayPnlCache);

  if (incomingTotalPct === null) {
    return null;
  }

  if (cached && cached.date === todayKey && cached.totalPct !== null) {
    if (displayDayPct !== null && cached.pct !== null) {
      return cached.totalPct + (displayDayPct - cached.pct);
    }

    return cached.totalPct;
  }

  return incomingTotalPct;
}

function mergeLiveDayPnlCache(
  prev: DayPnlCacheMap,
  incoming: LiveStatusMap
): DayPnlCacheMap {
  const todayKey = getTodayKey();
  const next: DayPnlCacheMap = {};

  Object.entries(prev).forEach(([account, value]) => {
    if (value?.date === todayKey) {
      next[account] = value;
    }
  });

  Object.entries(incoming).forEach(([numeroCuenta, live]) => {
    const existing = next[numeroCuenta];

    const incomingPct =
      typeof live?.pnl_hoy_pct === "number" && !Number.isNaN(live.pnl_hoy_pct)
        ? live.pnl_hoy_pct
        : typeof live?.pnl_pct_actual === "number" && !Number.isNaN(live.pnl_pct_actual)
        ? live.pnl_pct_actual
        : null;

    const incomingUsd =
      typeof live?.pnl_hoy_usd === "number" && !Number.isNaN(live.pnl_hoy_usd)
        ? live.pnl_hoy_usd
        : null;

    const incomingTotalPct =
      typeof live?.profit_total_pct === "number" && !Number.isNaN(live.profit_total_pct)
        ? live.profit_total_pct
        : null;

    const nextPct =
      incomingPct !== null && incomingPct !== 0
        ? incomingPct
        : existing?.date === todayKey
        ? existing.pct
        : null;

    const nextUsd =
      incomingUsd !== null && incomingUsd !== 0
        ? incomingUsd
        : existing?.date === todayKey
        ? existing.usd
        : null;

    const nextTotalPct =
      incomingTotalPct !== null
        ? incomingTotalPct
        : existing?.date === todayKey
        ? existing.totalPct
        : null;

    next[numeroCuenta] = {
      date: todayKey,
      pct: nextPct,
      usd: nextUsd,
      totalPct: nextTotalPct,
    };
  });

  return next;
}

export default function DashboardPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);

  const [selectedPendingSlotValue, setSelectedPendingSlotValue] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [alias, setAlias] = useState("");

  const [presetFilter, setPresetFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [soloIncidencias, setSoloIncidencias] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary>({
    fondeadasHistoricas: 0,
    perdidasHistoricas: 0,
  });

  const [resultadosRevision, setResultadosRevision] = useState<ResultadoRevisionDiaria[]>([]);
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [dayPnlCache, setDayPnlCache] = useState<DayPnlCacheMap>({});

  const reemplazoRef = useRef<HTMLDivElement | null>(null);

  function guardarLiveStatusEnCache(incoming: LiveStatusMap) {
    setLiveStatus((prev) => {
      const merged = {
        ...prev,
        ...incoming,
      };
      writeLiveStatusCache(merged);
      return merged;
    });

    setDayPnlCache((prev) => {
      const merged = mergeLiveDayPnlCache(prev, incoming);
      writeLiveDayPnlCache(merged);
      return merged;
    });
  }

  async function cargarDatos() {
    const res = await fetch("/api/dashboard-packs");
    const data = await res.json();
    setPacks(data.packs || []);

    const resEventos = await fetch("/api/account-events");
    const dataEventos = await resEventos.json();
    setEvents(dataEventos.events || []);
  }

  async function cargarResumenHistorico() {
    const params = new URLSearchParams({
      modo: "todo",
      preset: presetFilter,
      tipo: tipoFilter,
    });

    const res = await fetch(`/api/dashboard-summary?${params.toString()}`);
    const data = await res.json();

    setSummary({
      fondeadasHistoricas: data.fondeadasHistoricas ?? 0,
      perdidasHistoricas: data.perdidasHistoricas ?? 0,
    });
  }

  async function recargarEstado() {
    setLoadingLive(true);

    try {
      const res = await fetch("/api/live-status", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        alert(`No se pudo recargar el estado en vivo: ${json?.error || "Error desconocido"}`);
        return;
      }

      guardarLiveStatusEnCache(json.data || {});
    } catch (error) {
      console.error("Error recargando estado en vivo:", error);
      alert("No se pudo recargar el estado en vivo");
    } finally {
      setLoadingLive(false);
    }
  }

  async function ejecutarRevisionDiaria() {
    setLoading(true);

    try {
      const res = await fetch("/api/sord/revision-diaria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error en revisión diaria: ${data?.error || "Error desconocido"}`);
        return;
      }

      setResultadosRevision(data.resultados || []);
      await cargarDatos();
      await cargarResumenHistorico();
      alert(`Revisión diaria ejecutada para fecha de negocio ${data?.fecha}`);
    } finally {
      setLoading(false);
    }
  }

  async function rotarPack(packId: number, packNombre: string) {
    setLoading(true);

    try {
      const res = await fetch("/api/sord/rotar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          `Error al rotar ${packNombre}: ${
            data?.error?.message || JSON.stringify(data?.error) || "Error desconocido"
          }`
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();
      alert(`Rotación ejecutada en ${packNombre}`);
    } finally {
      setLoading(false);
    }
  }

  async function evaluarPack(packId: number, packNombre: string) {
    setLoading(true);

    try {
      const res = await fetch("/api/sord/evaluar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          `Error al evaluar ${packNombre}: ${
            data?.error?.message || JSON.stringify(data?.error) || "Error desconocido"
          }`
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();

      const mensaje =
        data?.resultado?.mensaje ||
        data?.resultado?.detalle?.mensaje ||
        `Evaluación ejecutada en ${packNombre}`;

      alert(String(mensaje));
    } finally {
      setLoading(false);
    }
  }

  async function marcarPerdida(accountId: number) {
    if (!confirm("¿Seguro que quieres marcar esta cuenta como perdida?")) return;

    setLoading(true);

    try {
      const res = await fetch("/api/cuentas/perder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          `Error al marcar pérdida: ${
            data?.error?.message || JSON.stringify(data?.error) || "Error desconocido"
          }`
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();
      alert("Cuenta marcada como perdida correctamente");
    } finally {
      setLoading(false);
    }
  }

  async function marcarFondeada(accountId: number) {
    if (!confirm("¿Seguro que quieres marcar esta cuenta como fondeada?")) return;

    setLoading(true);

    try {
      const res = await fetch("/api/cuentas/fondear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          `Error al marcar fondeada: ${
            data?.error?.message || JSON.stringify(data?.error) || "Error desconocido"
          }`
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();
      alert("Cuenta marcada como fondeada correctamente");
    } finally {
      setLoading(false);
    }
  }

  async function reemplazarCuenta() {
    const target = parsePendingSlotValue(selectedPendingSlotValue);

    if (!target) {
      alert("Selecciona un slot pendiente válido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/cuentas/reemplazar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: target.slotId,
          packId: target.packId,
          slot: target.slot,
          numeroCuenta,
          alias,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(
          `Error al reemplazar cuenta: ${
            data?.error?.message || JSON.stringify(data?.error) || "Error desconocido"
          }`
        );
        return;
      }

      setSelectedPendingSlotValue("");
      setNumeroCuenta("");
      setAlias("");

      await cargarDatos();
      await cargarResumenHistorico();
      alert("Cuenta reemplazada correctamente");
    } finally {
      setLoading(false);
    }
  }

  const pendingSlotOptions = useMemo<PendingSlotOption[]>(() => {
    const options: PendingSlotOption[] = [];

    packs.forEach((pack) => {
      const presetNombre = pack.presets?.nombre ?? "Sin preset";

      buildDisplaySlots(pack)
        .filter((slot) => slot.pendiente_reemplazo || !slot.accounts?.id)
        .sort((a, b) => a.orden - b.orden)
        .forEach((slot) => {
          const aliasCuenta = slot.accounts?.alias ?? "Sin cuenta";
          const motivo = slot.pendiente_reemplazo ? "pendiente reemplazo" : "slot vacío";

          const target: ReplaceTarget = {
            packId: pack.id,
            slot: normalizeSlotName(slot.slot),
            slotId: slot.id > 0 ? slot.id : undefined,
          };

          options.push({
            value: buildPendingSlotValue(target),
            slotId: target.slotId,
            packId: target.packId,
            slot: target.slot,
            label: `${presetNombre}, ${pack.nombre}, slot ${slot.slot}, ${aliasCuenta}, ${motivo}`,
          });
        });
    });

    return options;
  }, [packs]);

  const presetOptions = useMemo(() => {
    const nombres = Array.from(
      new Set(
        packs
          .map((pack) => pack.presets?.nombre)
          .filter((nombre): nombre is string => Boolean(nombre))
      )
    );

    return nombres.sort((a, b) => a.localeCompare(b));
  }, [packs]);

  const packsFiltrados = useMemo(() => {
    return packs.filter((pack) => {
      const presetNombre = pack.presets?.nombre ?? "";
      const flags = getPackFlags(pack);

      const cumplePreset = presetFilter === "todos" || presetNombre === presetFilter;
      const cumpleTipo = tipoFilter === "todos" || pack.tipo_pack === tipoFilter;
      const cumpleIncidencia =
        !soloIncidencias || flags.hasPendingReplacement || flags.isIncomplete;

      return cumplePreset && cumpleTipo && cumpleIncidencia;
    });
  }, [packs, presetFilter, tipoFilter, soloIncidencias]);

  const resumen = useMemo(() => {
    const packsConIncidencias = packsFiltrados.filter((pack) => {
      const flags = getPackFlags(pack);
      return flags.hasPendingReplacement || flags.isIncomplete;
    }).length;

    const cuentasActivas = packsFiltrados.reduce((acc, pack) => {
      return acc + (pack.pack_slots?.filter((slot) => slot.accounts?.estado === "activa").length ?? 0);
    }, 0);

    return {
      packsVisibles: packsFiltrados.length,
      packsConIncidencias,
      cuentasActivas,
    };
  }, [packsFiltrados]);

  const eventosRecientes = useMemo(() => {
    return [...events].slice(0, 4);
  }, [events]);

  function seleccionarSlotPendiente(target: ReplaceTarget) {
    setSelectedPendingSlotValue(buildPendingSlotValue(target));

    setTimeout(() => {
      reemplazoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function getLivePnlClass(value?: number | null) {
    if (typeof value !== "number") return "text-zinc-500";
    if (value > 0) return "text-emerald-300";
    if (value < 0) return "text-rose-300";
    return "text-zinc-300";
  }

  useEffect(() => {
    setLiveStatus(readLiveStatusCache());
    setDayPnlCache(readLiveDayPnlCache());
    cargarDatos();
    cargarResumenHistorico();
    recargarEstado();
  }, []);

  useEffect(() => {
    cargarResumenHistorico();
  }, [presetFilter, tipoFilter]);

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              App rentabilidad bot
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Control de rendimiento diario, rotación y seguimiento operativo de cuentas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={recargarEstado}
              disabled={loadingLive}
              variant="secondary"
            >
              {loadingLive ? "Recargando..." : "Recargar estado"}
            </ActionButton>

            <ActionButton
              onClick={ejecutarRevisionDiaria}
              disabled={loading}
              variant="primary"
            >
              {loading ? "Procesando..." : "Ejecutar revisión diaria"}
            </ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 xl:grid-cols-5">
          <StatCard label="Packs" value={resumen.packsVisibles} tone="blue" />
          <StatCard label="Con alertas" value={resumen.packsConIncidencias} tone="amber" />
          <StatCard label="Cuentas activas" value={resumen.cuentasActivas} tone="green" />
          <StatCard label="Fondeadas" value={summary.fondeadasHistoricas} tone="violet" />
          <StatCard label="Perdidas" value={summary.perdidasHistoricas} tone="red" />
        </div>
      </section>

      <SectionCard
        title="Filtros"
        right={
          <ActionButton
            onClick={() => setSoloIncidencias((prev) => !prev)}
            variant={soloIncidencias ? "warning" : "secondary"}
          >
            {soloIncidencias ? "Alertas: sí" : "Alertas"}
          </ActionButton>
        }
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_12px_28px_rgba(255,255,255,0.03)]">
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
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_12px_28px_rgba(255,255,255,0.03)]">
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
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Packs activos">
        <div className="space-y-4">
          {packsFiltrados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
              No hay packs que coincidan con los filtros actuales.
            </div>
          )}

          {packsFiltrados.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              liveStatus={liveStatus}
              dayPnlCache={dayPnlCache}
              loading={loading}
              onRotar={rotarPack}
              onEvaluar={evaluarPack}
              onPerder={marcarPerdida}
              onFondear={marcarFondeada}
              onSelectReplace={seleccionarSlotPendiente}
              getLivePnlClass={getLivePnlClass}
            />
          ))}
        </div>
      </SectionCard>

      {pendingSlotOptions.length > 0 && (
        <SectionCard title="Incidencias y reemplazos">
          <div
            ref={reemplazoRef}
            className="grid grid-cols-1 gap-3 xl:grid-cols-[0.85fr_1.15fr]"
          >
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-[0_12px_28px_rgba(255,255,255,0.03)] transition-all duration-300 hover:shadow-[0_16px_34px_rgba(255,255,255,0.04)]">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Pendientes
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {pendingSlotOptions.length}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Slots pendientes de reemplazo.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-[0_12px_28px_rgba(255,255,255,0.03)] transition-all duration-300 hover:shadow-[0_16px_34px_rgba(255,255,255,0.04)]">
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <FieldLabel>Slot pendiente</FieldLabel>
                  <Select
                    value={selectedPendingSlotValue}
                    onChange={(e) => setSelectedPendingSlotValue(e.target.value)}
                  >
                    <option value="">Selecciona un slot pendiente</option>
                    {pendingSlotOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <FieldLabel>Número de cuenta</FieldLabel>
                  <Input
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    placeholder="Ej. 128999"
                  />
                </div>

                <div>
                  <FieldLabel>Alias</FieldLabel>
                  <Input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Ej. Fernet B2"
                  />
                </div>

                <div>
                  <ActionButton
                    onClick={reemplazarCuenta}
                    disabled={loading || !selectedPendingSlotValue || !numeroCuenta || !alias}
                    variant="primary"
                  >
                    Reemplazar cuenta
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {resultadosRevision.length > 0 && (
        <SectionCard title="Resultado de la revisión diaria">
          <div className="space-y-2.5">
            {resultadosRevision.map((resultado) => (
              <div
                key={`${resultado.packId}-${resultado.packNombre}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_28px_rgba(255,255,255,0.03)] transition-all duration-300 hover:shadow-[0_16px_34px_rgba(255,255,255,0.04)]"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium text-white">{resultado.packNombre}</p>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs shadow-[0_10px_22px_rgba(255,255,255,0.03)] ${
                      resultado.ok
                        ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200"
                        : "border-amber-300/20 bg-amber-300/[0.08] text-amber-200"
                    }`}
                  >
                    {resultado.ok ? "Correcto" : "Revisar"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{resultado.mensaje}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Actividad reciente">
        <div className="space-y-2.5">
          {eventosRecientes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
              No hay actividad reciente.
            </div>
          )}

          {eventosRecientes.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_28px_rgba(255,255,255,0.03)] transition-all duration-300 hover:shadow-[0_16px_34px_rgba(255,255,255,0.04)]"
            >
              <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${getEventTone(event.tipo_evento)}`}>
                    {event.tipo_evento}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {event.accounts?.alias ?? "-"} · {event.accounts?.numero_cuenta ?? "-"}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">{formatEventDate(event.fecha)}</p>
              </div>

              {event.descripcion ? (
                <p className="mt-2 text-sm leading-6 text-zinc-400">{event.descripcion}</p>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function PackCard({
  pack,
  liveStatus,
  dayPnlCache,
  loading,
  onRotar,
  onEvaluar,
  onPerder,
  onFondear,
  onSelectReplace,
  getLivePnlClass,
}: {
  pack: Pack;
  liveStatus: LiveStatusMap;
  dayPnlCache: DayPnlCacheMap;
  loading: boolean;
  onRotar: (packId: number, packNombre: string) => void;
  onEvaluar: (packId: number, packNombre: string) => void;
  onPerder: (accountId: number) => void;
  onFondear: (accountId: number) => void;
  onSelectReplace: (target: ReplaceTarget) => void;
  getLivePnlClass: (value?: number | null) => string;
}) {
  const flags = getPackFlags(pack);
  const displaySlots = buildDisplaySlots(pack);

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_18px_38px_rgba(0,0,0,0.20)]">
      <div className="border-b border-white/8 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-medium text-white">{pack.nombre}</h3>

              {flags.hasPendingReplacement && (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.10] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-100 shadow-[0_10px_20px_rgba(251,191,36,0.08)]">
                  Incidencia
                </span>
              )}

              {!flags.hasPendingReplacement && flags.isIncomplete && (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.10] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-100 shadow-[0_10px_20px_rgba(251,191,36,0.08)]">
                  Incompleto
                </span>
              )}

              {!flags.hasPendingReplacement && !flags.isIncomplete && (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-400 shadow-[0_10px_20px_rgba(255,255,255,0.03)]">
                  Estable
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 shadow-[0_10px_20px_rgba(255,255,255,0.03)]">
                Preset: {pack.presets?.nombre ?? "-"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 shadow-[0_10px_20px_rgba(255,255,255,0.03)]">
                Tipo: {pack.tipo_pack}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <ActionButton
              onClick={() => onRotar(pack.id, pack.nombre)}
              disabled={loading}
              variant="secondary"
            >
              Rotar
            </ActionButton>

            <ActionButton
              onClick={() => onEvaluar(pack.id, pack.nombre)}
              disabled={loading}
              variant="danger"
            >
              Evaluar SORD
            </ActionButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        {displaySlots.map((slot) => {
          const estadoCuenta = slot.accounts?.estado ?? "";
          const puedePerder =
            slot.accounts?.id &&
            estadoCuenta !== "perdida" &&
            estadoCuenta !== "fondeada";

          const puedeFondear =
            slot.accounts?.id &&
            estadoCuenta !== "fondeada" &&
            estadoCuenta !== "perdida";

          const numeroCuenta = slot.accounts?.numero_cuenta ?? "";
          const live = numeroCuenta ? liveStatus[numeroCuenta] : undefined;
          const missingAccount = !slot.accounts?.id;

          const displayHoyPct = numeroCuenta
            ? resolveDisplayDayPct(numeroCuenta, live, dayPnlCache)
            : null;

          const displayTotalPct = numeroCuenta
            ? resolveDisplayTotalPct(numeroCuenta, live, dayPnlCache)
            : null;

          return (
            <div
              key={`${slot.id}-${slot.slot}`}
              className={`rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-[1px] ${
                slot.es_activa
                  ? "border-sky-300/25 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.05))] shadow-[0_0_0_1px_rgba(125,211,252,0.06),0_14px_30px_rgba(56,189,248,0.08)]"
                  : slot.pendiente_reemplazo
                  ? "border-amber-300/20 bg-amber-300/[0.08] shadow-[0_14px_30px_rgba(251,191,36,0.06)]"
                  : missingAccount
                  ? "border-white/10 bg-black/10 shadow-[0_12px_26px_rgba(255,255,255,0.02)]"
                  : "border-white/10 bg-black/20 shadow-[0_12px_26px_rgba(255,255,255,0.02)]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    Slot {slot.slot}
                  </p>
                  <p className="mt-1 truncate text-base font-medium text-white">
                    {slot.accounts?.alias ?? "Vacío"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] shadow-[0_8px_18px_rgba(255,255,255,0.03)] ${
                      slot.es_activa
                        ? "border-sky-300/20 bg-sky-300/[0.12] text-sky-100"
                        : "border-white/10 bg-white/[0.05] text-zinc-400"
                    }`}
                  >
                    {slot.es_activa ? "Activa" : "Inactiva"}
                  </span>

                  {slot.pendiente_reemplazo && (
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.10] px-2 py-0.5 text-[10px] text-amber-100 shadow-[0_8px_18px_rgba(251,191,36,0.08)]">
                      Reemplazo
                    </span>
                  )}

                  {missingAccount && !slot.pendiente_reemplazo && (
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-400 shadow-[0_8px_18px_rgba(255,255,255,0.03)]">
                      Sin cuenta
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-400">
                <p>Número: {slot.accounts?.numero_cuenta ?? "-"}</p>
                <p>Estado: {slot.accounts?.estado ?? "-"}</p>
                <p>Tipo: {slot.accounts?.tipo_cuenta ?? "-"}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-black/20 p-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Total %
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium ${getLivePnlClass(
                        displayTotalPct
                      )}`}
                    >
                      {formatPercent(displayTotalPct)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      Hoy %
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium ${getLivePnlClass(
                        displayHoyPct
                      )}`}
                    >
                      {formatPercent(displayHoyPct)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <ActionButton
                  onClick={() => slot.accounts?.id && onPerder(slot.accounts.id)}
                  disabled={loading || !puedePerder}
                  variant="ghost"
                >
                  Perder
                </ActionButton>

                <ActionButton
                  onClick={() => slot.accounts?.id && onFondear(slot.accounts.id)}
                  disabled={loading || !puedeFondear}
                  variant="ghost"
                >
                  Fondear
                </ActionButton>

                {(slot.pendiente_reemplazo || !slot.accounts?.id) && (
                  <ActionButton
                    onClick={() =>
                      onSelectReplace({
                        packId: pack.id,
                        slot: normalizeSlotName(slot.slot),
                        slotId: slot.id > 0 ? slot.id : undefined,
                      })
                    }
                    disabled={loading}
                    variant="secondary"
                  >
                    Reemplazo.
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}