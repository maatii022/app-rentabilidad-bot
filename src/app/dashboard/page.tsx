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
  balance?: number | null;
  equity?: number | null;
  account_size_inferred?: number | null;
  pnl_realizado_hoy?: number | null;
  pnl_abierto?: number | null;
  pnl_actual?: number | null;
  pnl_hoy_usd?: number | null;
  pnl_pct_actual?: number | null;
  pnl_hoy_pct?: number | null;
  profit_total_pct?: number | null;
  profit_total_pct_current?: number | null;
  trades_abiertos?: number | null;
  error?: string;
};

type LiveStatusMap = Record<string, LiveStatusItem>;

type PersistedPerformanceItem = {
  total_pct?: number;
  today_pct?: number;
  live_status?: string | null;
};

type PersistedPerformanceMap = Record<string, PersistedPerformanceItem>;

type ReplaceTarget = {
  slotId?: number;
  packId: number;
  slot: string;
};

type NoticeTone = "info" | "success" | "warning" | "danger";

type NoticeState = {
  open: boolean;
  tone: NoticeTone;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  mode: "alert" | "confirm";
};

type RefreshState = "idle" | "loading" | "success";

const REQUIRED_SLOTS = ["A", "B", "C"];

function SectionCard({
  title,
  children,
  right,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.07),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))] shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${
        compact ? "p-4" : "p-4 md:p-5"
      }`}
    >
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
      "border-white/10 bg-white/[0.03] shadow-[0_10px_24px_rgba(255,255,255,0.03)]",
    blue:
      "border-sky-400/20 bg-sky-400/[0.08] shadow-[0_12px_24px_rgba(56,189,248,0.08)]",
    amber:
      "border-amber-300/20 bg-amber-300/[0.08] shadow-[0_12px_24px_rgba(251,191,36,0.08)]",
    green:
      "border-emerald-400/20 bg-emerald-400/[0.08] shadow-[0_12px_24px_rgba(16,185,129,0.08)]",
    violet:
      "border-violet-400/20 bg-violet-400/[0.08] shadow-[0_12px_24px_rgba(167,139,250,0.08)]",
    red:
      "border-rose-400/20 bg-rose-400/[0.08] shadow-[0_12px_24px_rgba(244,63,94,0.08)]",
  };

  return (
    <div className={`rounded-2xl border p-3 ${toneClasses[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-1.5 text-xl font-semibold leading-none text-white md:text-2xl">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "warning";
  className?: string;
  title?: string;
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
      title={title}
      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
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
      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
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

function formatAccountSize(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return null;

  if (value >= 1000) {
    const k = value / 1000;
    return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}K`;
  }

  return `${Math.round(value)}`;
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
      const orden = requiredSlot === "A" ? 1 : requiredSlot === "B" ? 2 : 3;

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

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function resolveDisplayDayPct(
  numeroCuenta: string,
  persistedPerformance: PersistedPerformanceMap,
  liveStatus: LiveStatusMap
) {
  const live = liveStatus[numeroCuenta];
  const persisted = persistedPerformance[numeroCuenta];

  if (isValidNumber(live?.pnl_hoy_pct)) {
    return live.pnl_hoy_pct;
  }

  if (isValidNumber(live?.pnl_pct_actual)) {
    return live.pnl_pct_actual;
  }

  if (isValidNumber(persisted?.today_pct)) {
    return persisted.today_pct;
  }

  return null;
}

function resolveDisplayTotalPct(
  numeroCuenta: string,
  persistedPerformance: PersistedPerformanceMap,
  liveStatus: LiveStatusMap
) {
  const live = liveStatus[numeroCuenta];
  const persisted = persistedPerformance[numeroCuenta];

  if (isValidNumber(live?.profit_total_pct_current)) {
    return live.profit_total_pct_current;
  }

  if (isValidNumber(live?.profit_total_pct)) {
    return live.profit_total_pct;
  }

  if (isValidNumber(persisted?.total_pct)) {
    return persisted.total_pct;
  }

  return null;
}

function ModalNotice({
  state,
  onClose,
  onConfirm,
}: {
  state: NoticeState;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!state.open) return null;

  const toneStyles: Record<NoticeTone, { icon: string; badge: string }> = {
    info: {
      icon: "●",
      badge:
        "border-sky-300/20 bg-sky-400/[0.10] text-sky-200 shadow-[0_12px_24px_rgba(56,189,248,0.12)]",
    },
    success: {
      icon: "✓",
      badge:
        "border-emerald-300/20 bg-emerald-400/[0.10] text-emerald-200 shadow-[0_12px_24px_rgba(16,185,129,0.12)]",
    },
    warning: {
      icon: "!",
      badge:
        "border-amber-300/20 bg-amber-300/[0.10] text-amber-100 shadow-[0_12px_24px_rgba(251,191,36,0.12)]",
    },
    danger: {
      icon: "×",
      badge:
        "border-rose-300/20 bg-rose-400/[0.10] text-rose-200 shadow-[0_12px_24px_rgba(244,63,94,0.12)]",
    },
  };

  const tone = toneStyles[state.tone];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_center,rgba(56,189,248,0.08),transparent_26%),linear-gradient(180deg,rgba(12,14,20,0.96),rgba(10,11,16,0.94))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          ×
        </button>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.25)]">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl font-semibold ${tone.badge}`}
          >
            {tone.icon}
          </div>
        </div>

        <div className="mt-6 text-center">
          <h3 className="text-2xl font-semibold tracking-tight text-white">{state.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{state.message}</p>
        </div>

        <div className="mx-auto mt-6 h-px w-full max-w-[420px] bg-white/8" />

        <div className="mt-6 flex items-center justify-center gap-2">
          {state.mode === "confirm" && (
            <ActionButton onClick={onClose} variant="ghost" className="min-w-[110px]">
              {state.cancelLabel || "Cancelar"}
            </ActionButton>
          )}

          <ActionButton
            onClick={onConfirm}
            variant={state.tone === "danger" ? "danger" : "primary"}
            className="min-w-[140px]"
          >
            {state.confirmLabel || "Aceptar"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function RefreshStatusButton({
  state,
  onClick,
  disabled,
  title,
}: {
  state: RefreshState;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const classes =
    state === "success"
      ? "border-emerald-300/20 bg-emerald-400/[0.10] text-emerald-200 hover:bg-emerald-400/[0.12]"
      : "border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.05] hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "loading"}
      title={title}
      className={`flex h-[34px] w-[34px] items-center justify-center rounded-xl border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {state === "loading" ? (
        <RefreshIcon spinning />
      ) : state === "success" ? (
        <CheckIcon />
      ) : (
        <RefreshIcon />
      )}
    </button>
  );
}

export default function DashboardPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
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
  const [persistedPerformance, setPersistedPerformance] = useState<PersistedPerformanceMap>({});
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [packRefreshState, setPackRefreshState] = useState<Record<number, RefreshState>>({});
  const [globalRefreshState, setGlobalRefreshState] = useState<RefreshState>("idle");

  const [notice, setNotice] = useState<NoticeState>({
    open: false,
    tone: "info",
    title: "",
    message: "",
    mode: "alert",
  });

  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
  const refreshTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reemplazoRef = useRef<HTMLDivElement | null>(null);

  function showAlert(
    title: string,
    message: string,
    tone: NoticeTone = "info",
    confirmLabel = "Aceptar"
  ) {
    setNotice({
      open: true,
      tone,
      title,
      message,
      confirmLabel,
      mode: "alert",
    });
  }

  function showConfirm(
    title: string,
    message: string,
    tone: NoticeTone = "warning",
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar"
  ) {
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setNotice({
        open: true,
        tone,
        title,
        message,
        confirmLabel,
        cancelLabel,
        mode: "confirm",
      });
    });
  }

  function closeNotice(result = false) {
    setNotice((prev) => ({ ...prev, open: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
  }

  function clearRefreshTimeout(key: string) {
    if (refreshTimeoutsRef.current[key]) {
      clearTimeout(refreshTimeoutsRef.current[key]);
      delete refreshTimeoutsRef.current[key];
    }
  }

  function markRefreshLoading(key: string, setter: () => void) {
    clearRefreshTimeout(key);
    setter();
  }

  function markRefreshSuccess(
    key: string,
    setterSuccess: () => void,
    setterIdle: () => void
  ) {
    clearRefreshTimeout(key);
    setterSuccess();
    refreshTimeoutsRef.current[key] = setTimeout(() => {
      setterIdle();
      delete refreshTimeoutsRef.current[key];
    }, 1200);
  }

  async function cargarDatos() {
    const res = await fetch("/api/dashboard-packs", { cache: "no-store" });
    const data = await res.json();
    setPacks(data.packs || []);

    const resEventos = await fetch("/api/account-events", { cache: "no-store" });
    const dataEventos = await resEventos.json();
    setEvents(dataEventos.events || []);
  }

  async function cargarResumenHistorico() {
    const params = new URLSearchParams({
      modo: "todo",
      preset: presetFilter,
      tipo: tipoFilter,
    });

    const res = await fetch(`/api/dashboard-summary?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();

    setSummary({
      fondeadasHistoricas: data.fondeadasHistoricas ?? 0,
      perdidasHistoricas: data.perdidasHistoricas ?? 0,
    });
  }

  async function cargarPerformancePersistida(silent = false) {
    setLoadingPerformance(true);

    try {
      const res = await fetch("/api/accounts/performance-map", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        if (!silent) {
          showAlert(
            "No se pudo cargar la performance",
            json?.error || "Error desconocido",
            "danger"
          );
        }
        return;
      }

      setPersistedPerformance(json.data || {});
    } catch (error) {
      console.error("Error cargando performance persistida:", error);
      if (!silent) {
        showAlert(
          "No se pudo cargar la performance",
          "Se produjo un error al cargar la performance persistida.",
          "danger"
        );
      }
    } finally {
      setLoadingPerformance(false);
    }
  }

  async function cargarLiveStatus(silent = false) {
    setLoadingLive(true);

    try {
      const res = await fetch("/api/live-status", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setLiveStatus({});
        return;
      }

      setLiveStatus(json.data || {});
    } catch (error) {
      console.error("Error cargando live status:", error);
      setLiveStatus({});
      if (!silent) {
        showAlert(
          "No se pudo cargar el estado live",
          "Se produjo un error al actualizar el estado live.",
          "danger"
        );
      }
    } finally {
      setLoadingLive(false);
    }
  }

  async function recargarEstadoSilencioso() {
    await Promise.all([cargarPerformancePersistida(true), cargarLiveStatus(true)]);
  }

  async function recargarEstadoGlobal() {
    markRefreshLoading("global", () => setGlobalRefreshState("loading"));

    try {
      await recargarEstadoSilencioso();
      markRefreshSuccess(
        "global",
        () => setGlobalRefreshState("success"),
        () => setGlobalRefreshState("idle")
      );
    } catch (error) {
      console.error("Error en recarga global silenciosa:", error);
      setGlobalRefreshState("idle");
    }
  }

  async function recargarEstadoPack(packId: number) {
    markRefreshLoading(`pack-${packId}`, () =>
      setPackRefreshState((prev) => ({ ...prev, [packId]: "loading" }))
    );

    try {
      await recargarEstadoSilencioso();
      markRefreshSuccess(
        `pack-${packId}`,
        () =>
          setPackRefreshState((prev) => ({
            ...prev,
            [packId]: "success",
          })),
        () =>
          setPackRefreshState((prev) => ({
            ...prev,
            [packId]: "idle",
          }))
      );
    } catch (error) {
      console.error("Error en recarga silenciosa del pack:", error);
      setPackRefreshState((prev) => ({
        ...prev,
        [packId]: "idle",
      }));
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
        showAlert(
          "Error en la revisión diaria",
          data?.error || "Error desconocido",
          "danger"
        );
        return;
      }

      setResultadosRevision(data.resultados || []);
      await cargarDatos();
      await cargarResumenHistorico();
      await recargarEstadoSilencioso();

      showAlert(
        "Revisión diaria ejecutada",
        `La revisión diaria se ejecutó para la fecha de negocio ${data?.fecha}.`,
        "success"
      );
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
        showAlert(
          `Error al rotar ${packNombre}`,
          data?.error?.message || JSON.stringify(data?.error) || "Error desconocido",
          "danger"
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();
      await recargarEstadoSilencioso();

      showAlert(
        "Rotación completada",
        `La rotación se ejecutó correctamente en ${packNombre}.`,
        "success"
      );
    } finally {
      setLoading(false);
    }
  }

  async function marcarPerdida(accountId: number) {
    const confirmed = await showConfirm(
      "Marcar cuenta como perdida",
      "Esta acción cambiará el estado de la cuenta a perdida. ¿Quieres continuar?",
      "warning",
      "Sí, marcar",
      "Cancelar"
    );

    if (!confirmed) return;

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
        showAlert(
          "Error al marcar pérdida",
          data?.error?.message || JSON.stringify(data?.error) || "Error desconocido",
          "danger"
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();
      await recargarEstadoSilencioso();
      showAlert(
        "Cuenta actualizada",
        "La cuenta se ha marcado como perdida correctamente.",
        "success"
      );
    } finally {
      setLoading(false);
    }
  }

  async function marcarFondeada(accountId: number) {
    const confirmed = await showConfirm(
      "Marcar cuenta como fondeada",
      "Esta acción cambiará el estado de la cuenta a fondeada. ¿Quieres continuar?",
      "warning",
      "Sí, marcar",
      "Cancelar"
    );

    if (!confirmed) return;

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
        showAlert(
          "Error al marcar fondeada",
          data?.error?.message || JSON.stringify(data?.error) || "Error desconocido",
          "danger"
        );
        return;
      }

      await cargarDatos();
      await cargarResumenHistorico();
      await recargarEstadoSilencioso();
      showAlert(
        "Cuenta actualizada",
        "La cuenta se ha marcado como fondeada correctamente.",
        "success"
      );
    } finally {
      setLoading(false);
    }
  }

  async function reemplazarCuenta() {
    const target = parsePendingSlotValue(selectedPendingSlotValue);

    if (!target) {
      showAlert(
        "Slot no válido",
        "Selecciona un slot pendiente válido antes de continuar.",
        "warning"
      );
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
        showAlert(
          "Error al reemplazar cuenta",
          data?.error?.message || JSON.stringify(data?.error) || "Error desconocido",
          "danger"
        );
        return;
      }

      setSelectedPendingSlotValue("");
      setNumeroCuenta("");
      setAlias("");

      await cargarDatos();
      await cargarResumenHistorico();
      await recargarEstadoSilencioso();
      showAlert(
        "Reemplazo completado",
        "La cuenta se ha reemplazado correctamente.",
        "success"
      );
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
    let cuentasConAlertas = 0;

    packsFiltrados.forEach((pack) => {
      const displaySlots = buildDisplaySlots(pack);

      displaySlots.forEach((slot) => {
        const missingAccount = !slot.accounts?.id;
        const hasAlert = slot.pendiente_reemplazo || missingAccount;

        if (hasAlert) {
          cuentasConAlertas += 1;
        }
      });
    });

    const cuentasActivas = packsFiltrados.reduce((acc, pack) => {
      return acc + (pack.pack_slots?.filter((slot) => slot.accounts?.estado === "activa").length ?? 0);
    }, 0);

    return {
      packsVisibles: packsFiltrados.length,
      cuentasActivas,
      cuentasConAlertas,
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
    async function init() {
      await Promise.all([
        cargarDatos(),
        cargarResumenHistorico(),
        cargarPerformancePersistida(true),
        cargarLiveStatus(true),
      ]);
    }

    void init();
  }, []);

  useEffect(() => {
    void cargarResumenHistorico();
  }, [presetFilter, tipoFilter]);

  useEffect(() => {
    return () => {
      Object.values(refreshTimeoutsRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  return (
    <>
      <div className="space-y-4 text-white">
        <section className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                App rentabilidad bot
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-[2rem]">
                  Dashboard
                </h1>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  Vista operativa
                </span>
              </div>
              <p className="mt-1.5 max-w-3xl text-sm text-zinc-400">
                Control diario de packs, incidencias, rotación y seguimiento de cuentas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RefreshStatusButton
                state={globalRefreshState}
                onClick={recargarEstadoGlobal}
                disabled={loading}
                title="Recargar estado"
              />

              <ActionButton
                onClick={ejecutarRevisionDiaria}
                disabled={loading}
                variant="primary"
              >
                {loading ? "Procesando..." : "Ejecutar revisión diaria"}
              </ActionButton>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-5">
            <StatCard label="Packs" value={resumen.packsVisibles} tone="blue" />
            <StatCard label="Cuentas activas" value={resumen.cuentasActivas} tone="green" />
            <StatCard label="Alertas" value={resumen.cuentasConAlertas} tone="amber" />
            <StatCard label="Fondeadas" value={summary.fondeadasHistoricas} tone="violet" />
            <StatCard label="Perdidas" value={summary.perdidasHistoricas} tone="red" />
          </div>
        </section>

        <SectionCard
          title="Filtros y estado"
          compact
          right={
            <ActionButton
              onClick={() => setSoloIncidencias((prev) => !prev)}
              variant={soloIncidencias ? "warning" : "secondary"}
            >
              Alertas
            </ActionButton>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                Presets
              </span>

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
              <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                Tipo
              </span>

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
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_380px]">
          <div className="space-y-4">
            <SectionCard
              title="Packs activos"
              right={
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  {packsFiltrados.length} visibles
                </span>
              }
            >
              <div className="space-y-3">
                {packsFiltrados.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
                    No hay packs que coincidan con los filtros actuales.
                  </div>
                )}

                {packsFiltrados.map((pack) => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                    persistedPerformance={persistedPerformance}
                    liveStatus={liveStatus}
                    loading={loading}
                    refreshState={packRefreshState[pack.id] ?? "idle"}
                    onRotar={rotarPack}
                    onPerder={marcarPerdida}
                    onFondear={marcarFondeada}
                    onSelectReplace={seleccionarSlotPendiente}
                    onRefresh={() => recargarEstadoPack(pack.id)}
                    getLivePnlClass={getLivePnlClass}
                  />
                ))}
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            {pendingSlotOptions.length > 0 && (
              <SectionCard title="Incidencias y reemplazos" compact>
                <div ref={reemplazoRef} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3 shadow-[0_12px_28px_rgba(251,191,36,0.06)]">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        Pendientes
                      </p>
                      <p className="mt-1.5 text-2xl font-semibold text-white">
                        {pendingSlotOptions.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_28px_rgba(255,255,255,0.03)]">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        Estado
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-zinc-200">
                        Acción rápida
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_28px_rgba(255,255,255,0.03)]">
                    <div className="space-y-2.5">
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

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
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
                      </div>

                      <ActionButton
                        onClick={reemplazarCuenta}
                        disabled={loading || !selectedPendingSlotValue || !numeroCuenta || !alias}
                        variant="primary"
                        className="w-full justify-center py-2"
                      >
                        Reemplazar cuenta
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {resultadosRevision.length > 0 && (
              <SectionCard title="Resultado de la revisión" compact>
                <div className="space-y-2">
                  {resultadosRevision.map((resultado) => (
                    <div
                      key={`${resultado.packId}-${resultado.packNombre}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_28px_rgba(255,255,255,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-medium text-white">
                          {resultado.packNombre}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                            resultado.ok
                              ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200"
                              : "border-amber-300/20 bg-amber-300/[0.08] text-amber-200"
                          }`}
                        >
                          {resultado.ok ? "Correcto" : "Revisar"}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-zinc-400">
                        {resultado.mensaje}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Actividad reciente" compact>
              <div className="space-y-2">
                {eventosRecientes.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                    No hay actividad reciente.
                  </div>
                )}

                {eventosRecientes.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_12px_28px_rgba(255,255,255,0.03)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${getEventTone(event.tipo_evento)}`}>
                          {event.tipo_evento}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-400">
                          {event.accounts?.alias ?? "-"} · {event.accounts?.numero_cuenta ?? "-"}
                        </p>
                      </div>
                      <p className="shrink-0 text-[11px] text-zinc-500">
                        {formatEventDate(event.fecha)}
                      </p>
                    </div>

                    {event.descripcion ? (
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-400">
                        {event.descripcion}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>

      <ModalNotice
        state={notice}
        onClose={() => closeNotice(false)}
        onConfirm={() => closeNotice(true)}
      />
    </>
  );
}

function PackCard({
  pack,
  persistedPerformance,
  liveStatus,
  loading,
  refreshState,
  onRotar,
  onPerder,
  onFondear,
  onSelectReplace,
  onRefresh,
  getLivePnlClass,
}: {
  pack: Pack;
  persistedPerformance: PersistedPerformanceMap;
  liveStatus: LiveStatusMap;
  loading: boolean;
  refreshState: RefreshState;
  onRotar: (packId: number, packNombre: string) => void;
  onPerder: (accountId: number) => void;
  onFondear: (accountId: number) => void;
  onSelectReplace: (target: ReplaceTarget) => void;
  onRefresh: () => void;
  getLivePnlClass: (value?: number | null) => string;
}) {
  const flags = getPackFlags(pack);
  const displaySlots = buildDisplaySlots(pack);

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_18px_38px_rgba(0,0,0,0.20)]">
      <div className="border-b border-white/8 px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-medium text-white">{pack.nombre}</h3>

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

            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-zinc-400">
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
              disabled={loading || refreshState === "loading"}
              variant="secondary"
            >
              Rotar
            </ActionButton>

            <RefreshStatusButton
              state={refreshState}
              onClick={onRefresh}
              disabled={loading}
              title="Recargar estado"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 p-3 md:grid-cols-3">
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
          const missingAccount = !slot.accounts?.id;
          const live = numeroCuenta ? liveStatus[numeroCuenta] : undefined;
          const hasOpenTrade = (live?.trades_abiertos ?? 0) > 0;
          const accountSizeLabel = formatAccountSize(live?.account_size_inferred);

          const displayHoyPct = numeroCuenta
            ? resolveDisplayDayPct(numeroCuenta, persistedPerformance, liveStatus)
            : null;

          const displayTotalPct = numeroCuenta
            ? resolveDisplayTotalPct(numeroCuenta, persistedPerformance, liveStatus)
            : null;

          return (
            <div
              key={`${slot.id}-${slot.slot}`}
              className={`rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-[1px] ${
                slot.es_activa
                  ? "border-sky-300/25 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.05))] shadow-[0_0_0_1px_rgba(125,211,252,0.06),0_14px_30px_rgba(56,189,248,0.08)]"
                  : slot.pendiente_reemplazo || missingAccount
                  ? "border-amber-300/20 bg-amber-300/[0.08] shadow-[0_14px_30px_rgba(251,191,36,0.06)]"
                  : "border-white/10 bg-black/20 shadow-[0_12px_26px_rgba(255,255,255,0.02)]"
              }`}
            >
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    Slot {slot.slot}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {slot.accounts?.alias ?? "Vacío"}
                    </p>

                    {accountSizeLabel ? (
                      <span className="shrink-0 rounded-full border border-sky-300/20 bg-sky-400/[0.10] px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-sky-100 shadow-[0_10px_22px_rgba(56,189,248,0.10)]">
                        {accountSizeLabel}
                      </span>
                    ) : null}
                  </div>
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
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.10] px-2 py-0.5 text-[10px] text-amber-100 shadow-[0_8px_18px_rgba(251,191,36,0.08)]">
                      Sin cuenta
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                <p className="truncate">Número: {slot.accounts?.numero_cuenta ?? "-"}</p>
                <p className="truncate">Estado: {slot.accounts?.estado ?? "-"}</p>
                <p className="truncate">Tipo: {slot.accounts?.tipo_cuenta ?? "-"}</p>
                <div className="flex items-center justify-start">
                  {hasOpenTrade ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/[0.08] px-2 py-1 shadow-[0_8px_18px_rgba(16,185,129,0.10)]">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-200">
                        En curso
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                      Sin trade
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-black/20 p-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
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

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <ActionButton
                  onClick={() => slot.accounts?.id && onPerder(slot.accounts.id)}
                  disabled={loading || refreshState === "loading" || !puedePerder}
                  variant="ghost"
                >
                  Perder
                </ActionButton>

                <ActionButton
                  onClick={() => slot.accounts?.id && onFondear(slot.accounts.id)}
                  disabled={loading || refreshState === "loading" || !puedeFondear}
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
                    disabled={loading || refreshState === "loading"}
                    variant="secondary"
                  >
                    Reemplazo
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