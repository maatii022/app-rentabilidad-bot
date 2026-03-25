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
  slotId: number;
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

type ActiveAccountOption = {
  accountId: number;
  label: string;
};

type LiveStatusItem = {
  preset?: string;
  pnl_actual?: number;
  trades_abiertos?: number;
  error?: string;
};

type LiveStatusMap = Record<string, LiveStatusItem>;

const MONTH_OPTIONS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

function SectionCard({
  title,
  description,
  children,
  right,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-medium text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          ) : null}
        </div>
        {right ? <div className="flex flex-wrap gap-2">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
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
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary:
      "border border-white/10 bg-white text-black hover:bg-zinc-200",
    secondary:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10",
    danger:
      "border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700",
    ghost:
      "border border-white/10 bg-transparent text-zinc-300 hover:bg-white/5",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm text-zinc-400">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-black/30 ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20 focus:bg-black/30 ${props.className || ""}`}
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
  if (tipo === "SORD in") return "text-zinc-100";
  if (tipo === "SORD out") return "text-zinc-300";
  if (tipo === "perdida") return "text-zinc-300";
  if (tipo === "fondeada") return "text-zinc-100";
  return "text-zinc-200";
}

export default function DashboardPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);

  const [selectedPendingSlotId, setSelectedPendingSlotId] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [alias, setAlias] = useState("");

  const [presetFilter, setPresetFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [soloIncidencias, setSoloIncidencias] = useState(false);

  const currentDate = new Date();
  const [historicoModo, setHistoricoModo] = useState("todo");
  const [historicoAnio, setHistoricoAnio] = useState(String(currentDate.getFullYear()));
  const [historicoMes, setHistoricoMes] = useState(String(currentDate.getMonth() + 1));

  const [summary, setSummary] = useState<DashboardSummary>({
    fondeadasHistoricas: 0,
    perdidasHistoricas: 0,
  });

  const [resultadosRevision, setResultadosRevision] = useState<ResultadoRevisionDiaria[]>([]);
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});

  const [dailyAccountId, setDailyAccountId] = useState("");
  const [dailyFecha, setDailyFecha] = useState(new Date().toISOString().split("T")[0]);
  const [dailyPnlUsd, setDailyPnlUsd] = useState("");
  const [dailyPnlPorcentaje, setDailyPnlPorcentaje] = useState("");
  const [dailyNumeroTrades, setDailyNumeroTrades] = useState("");
  const [dailyNotas, setDailyNotas] = useState("");

  const reemplazoRef = useRef<HTMLDivElement | null>(null);
  const dailyResultRef = useRef<HTMLDivElement | null>(null);

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
      modo: historicoModo,
      preset: presetFilter,
      tipo: tipoFilter,
    });

    if (historicoModo === "anio" || historicoModo === "mes") {
      params.set("anio", historicoAnio);
    }

    if (historicoModo === "mes") {
      params.set("mes", historicoMes);
    }

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

      setLiveStatus(json.data || {});
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
    setLoading(true);

    try {
      const res = await fetch("/api/cuentas/reemplazar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: Number(selectedPendingSlotId),
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

      setSelectedPendingSlotId("");
      setNumeroCuenta("");
      setAlias("");

      await cargarDatos();
      await cargarResumenHistorico();
      alert("Cuenta reemplazada correctamente");
    } finally {
      setLoading(false);
    }
  }

  async function crearDailyResult() {
    setLoading(true);

    try {
      const res = await fetch("/api/daily-results/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: Number(dailyAccountId),
          fecha: dailyFecha,
          pnlUsd: Number(dailyPnlUsd),
          pnlPorcentaje: Number(dailyPnlPorcentaje),
          numeroTrades: Number(dailyNumeroTrades || 0),
          notas: dailyNotas,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error al crear daily result: ${data?.error || "Error desconocido"}`);
        return;
      }

      const mensajeRedDay = data?.redDay ? "Sí" : "No";

      setDailyPnlUsd("");
      setDailyPnlPorcentaje("");
      setDailyNumeroTrades("");
      setDailyNotas("");

      await cargarDatos();
      await cargarResumenHistorico();

      alert(`Daily result guardado correctamente. Red day: ${mensajeRedDay}`);
    } finally {
      setLoading(false);
    }
  }

  const pendingSlotOptions = useMemo<PendingSlotOption[]>(() => {
    const options: PendingSlotOption[] = [];

    packs.forEach((pack) => {
      const presetNombre = pack.presets?.nombre ?? "Sin preset";

      pack.pack_slots
        ?.filter((slot) => slot.pendiente_reemplazo)
        .sort((a, b) => a.orden - b.orden)
        .forEach((slot) => {
          const aliasCuenta = slot.accounts?.alias ?? "Sin alias";
          const label = `${presetNombre}, ${pack.nombre}, slot ${slot.slot}, ${aliasCuenta}`;

          options.push({
            slotId: slot.id,
            label,
          });
        });
    });

    return options;
  }, [packs]);

  const activeAccountOptions = useMemo<ActiveAccountOption[]>(() => {
    const options: ActiveAccountOption[] = [];

    packs.forEach((pack) => {
      const presetNombre = pack.presets?.nombre ?? "Sin preset";

      pack.pack_slots
        ?.filter((slot) => slot.accounts?.id && slot.accounts?.estado === "activa")
        .sort((a, b) => a.orden - b.orden)
        .forEach((slot) => {
          options.push({
            accountId: slot.accounts!.id,
            label: `${presetNombre}, ${pack.nombre}, slot ${slot.slot}, ${slot.accounts!.alias}, ${slot.accounts!.numero_cuenta}`,
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

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    const currentYear = new Date().getFullYear();
    years.add(currentYear);

    events.forEach((event) => {
      if (event.fecha) {
        years.add(new Date(event.fecha).getFullYear());
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [events]);

  const packsFiltrados = useMemo(() => {
    return packs.filter((pack) => {
      const presetNombre = pack.presets?.nombre ?? "";

      const cumplePreset = presetFilter === "todos" || presetNombre === presetFilter;
      const cumpleTipo = tipoFilter === "todos" || pack.tipo_pack === tipoFilter;
      const tieneIncidencia =
        pack.pack_slots?.some((slot) => slot.pendiente_reemplazo) ?? false;
      const cumpleIncidencia = !soloIncidencias || tieneIncidencia;

      return cumplePreset && cumpleTipo && cumpleIncidencia;
    });
  }, [packs, presetFilter, tipoFilter, soloIncidencias]);

  const packsConIncidencias = useMemo(() => {
    return packsFiltrados.filter((pack) =>
      pack.pack_slots?.some((slot) => slot.pendiente_reemplazo)
    );
  }, [packsFiltrados]);

  const packsSinIncidencias = useMemo(() => {
    return packsFiltrados.filter(
      (pack) => !pack.pack_slots?.some((slot) => slot.pendiente_reemplazo)
    );
  }, [packsFiltrados]);

  const resumen = useMemo(() => {
    const packsConIncidenciasCount = packsFiltrados.filter((pack) =>
      pack.pack_slots?.some((slot) => slot.pendiente_reemplazo)
    ).length;

    const slotsPendientes = packsFiltrados.reduce((acc, pack) => {
      return acc + (pack.pack_slots?.filter((slot) => slot.pendiente_reemplazo).length ?? 0);
    }, 0);

    const cuentasActivas = packsFiltrados.reduce((acc, pack) => {
      return acc + (pack.pack_slots?.filter((slot) => slot.accounts?.estado === "activa").length ?? 0);
    }, 0);

    return {
      packsVisibles: packsFiltrados.length,
      packsConIncidencias: packsConIncidenciasCount,
      slotsPendientes,
      cuentasActivas,
    };
  }, [packsFiltrados]);

  function seleccionarSlotPendiente(slotId: number) {
    setSelectedPendingSlotId(String(slotId));

    setTimeout(() => {
      reemplazoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function seleccionarCuentaParaDaily(accountId: number) {
    setDailyAccountId(String(accountId));

    setTimeout(() => {
      dailyResultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function getLivePnlClass(value?: number) {
    if (typeof value !== "number") return "text-zinc-500";
    if (value > 0) return "text-zinc-100";
    if (value < 0) return "text-zinc-300";
    return "text-zinc-400";
  }

  useEffect(() => {
    cargarDatos();
    cargarResumenHistorico();
  }, []);

  useEffect(() => {
    cargarResumenHistorico();
  }, [historicoModo, historicoAnio, historicoMes, presetFilter, tipoFilter]);

  return (
    <div className="space-y-8 text-white">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              App Rentabilidad Bot
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Dashboard
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">
              Vista operativa de packs, incidencias, revisión diaria y actividad reciente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={recargarEstado}
              disabled={loadingLive}
              variant="secondary"
            >
              {loadingLive ? "Recargando estado..." : "Recargar estado"}
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

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Packs visibles" value={resumen.packsVisibles} />
          <StatCard label="Packs con incidencias" value={resumen.packsConIncidencias} />
          <StatCard label="Slots pendientes" value={resumen.slotsPendientes} />
          <StatCard label="Cuentas activas" value={resumen.cuentasActivas} />
          <StatCard label="Fondeadas históricas" value={summary.fondeadasHistoricas} />
          <StatCard label="Perdidas históricas" value={summary.perdidasHistoricas} />
        </div>
      </section>

      <SectionCard
        title="Filtros"
        description="Ajusta la vista del dashboard y del resumen histórico."
        right={
          <ActionButton
            onClick={() => {
              setPresetFilter("todos");
              setTipoFilter("todos");
              setSoloIncidencias(false);
              setHistoricoModo("todo");
              setHistoricoAnio(String(currentDate.getFullYear()));
              setHistoricoMes(String(currentDate.getMonth() + 1));
            }}
            variant="ghost"
          >
            Limpiar filtros
          </ActionButton>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <FieldLabel>Período histórico</FieldLabel>
            <Select
              value={historicoModo}
              onChange={(e) => setHistoricoModo(e.target.value)}
            >
              <option value="todo">Todo</option>
              <option value="anio">Año concreto</option>
              <option value="mes">Mes concreto</option>
            </Select>
          </div>

          {(historicoModo === "anio" || historicoModo === "mes") && (
            <div>
              <FieldLabel>Año</FieldLabel>
              <Select
                value={historicoAnio}
                onChange={(e) => setHistoricoAnio(e.target.value)}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {historicoModo === "mes" && (
            <div>
              <FieldLabel>Mes</FieldLabel>
              <Select
                value={historicoMes}
                onChange={(e) => setHistoricoMes(e.target.value)}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <FieldLabel>Preset</FieldLabel>
            <Select
              value={presetFilter}
              onChange={(e) => setPresetFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              {presetOptions.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel>Tipo de pack</FieldLabel>
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="prueba">Prueba</option>
              <option value="fondeada">Fondeada</option>
            </Select>
          </div>

          <div className="flex items-end xl:col-span-2">
            <label className="inline-flex min-h-[44px] items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={soloIncidencias}
                onChange={(e) => setSoloIncidencias(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Solo packs con incidencias
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Packs activos"
        description="Bloque principal de seguimiento y acciones por pack."
      >
        <div className="space-y-8">
          {packsConIncidencias.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-white">Con incidencias</h3>
                  <p className="text-sm text-zinc-500">
                    Packs con al menos una cuenta pendiente de reemplazo.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">
                  {packsConIncidencias.length} packs
                </div>
              </div>

              <div className="space-y-4">
                {packsConIncidencias.map((pack) => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                    liveStatus={liveStatus}
                    loading={loading}
                    onRotar={rotarPack}
                    onEvaluar={evaluarPack}
                    onPerder={marcarPerdida}
                    onFondear={marcarFondeada}
                    onSelectDaily={seleccionarCuentaParaDaily}
                    onSelectReplace={seleccionarSlotPendiente}
                    getLivePnlClass={getLivePnlClass}
                  />
                ))}
              </div>
            </div>
          )}

          {packsSinIncidencias.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-white">Sin incidencias</h3>
                  <p className="text-sm text-zinc-500">
                    Packs operativos sin pendientes de reemplazo.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">
                  {packsSinIncidencias.length} packs
                </div>
              </div>

              <div className="space-y-4">
                {packsSinIncidencias.map((pack) => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                    liveStatus={liveStatus}
                    loading={loading}
                    onRotar={rotarPack}
                    onEvaluar={evaluarPack}
                    onPerder={marcarPerdida}
                    onFondear={marcarFondeada}
                    onSelectDaily={seleccionarCuentaParaDaily}
                    onSelectReplace={seleccionarSlotPendiente}
                    getLivePnlClass={getLivePnlClass}
                  />
                ))}
              </div>
            </div>
          )}

          {packsFiltrados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-zinc-500">
              No hay packs que coincidan con los filtros actuales.
            </div>
          )}
        </div>
      </SectionCard>

      {pendingSlotOptions.length > 0 && (
        <SectionCard
          title="Incidencias y reemplazos"
          description="Gestiona slots pendientes sin mezclarlo con el bloque principal de packs."
        >
          <div
            ref={reemplazoRef}
            className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]"
          >
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-sm font-medium text-white">Resumen</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Hay {pendingSlotOptions.length} slots pendientes de reemplazo.
              </p>
              <p className="mt-3 text-sm text-zinc-500">
                Puedes seleccionar un slot y asignarle una nueva cuenta desde este bloque.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel>Slot pendiente</FieldLabel>
                  <Select
                    value={selectedPendingSlotId}
                    onChange={(e) => setSelectedPendingSlotId(e.target.value)}
                  >
                    <option value="">Selecciona un slot pendiente</option>
                    {pendingSlotOptions.map((option) => (
                      <option key={option.slotId} value={option.slotId}>
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
                    disabled={loading || !selectedPendingSlotId || !numeroCuenta || !alias}
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
        <SectionCard
          title="Resultado de la revisión diaria"
          description="Último resultado devuelto por la ejecución manual o automática."
        >
          <div className="space-y-3">
            {resultadosRevision.map((resultado) => (
              <div
                key={`${resultado.packId}-${resultado.packNombre}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium text-white">{resultado.packNombre}</p>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      resultado.ok
                        ? "border-white/10 bg-white/5 text-zinc-200"
                        : "border-white/10 bg-white/5 text-zinc-400"
                    }`}
                  >
                    {resultado.ok ? "Correcto" : "Revisar"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-400">{resultado.mensaje}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Eventos recientes"
          description="Historial reciente de movimientos y cambios de estado."
        >
          <div className="space-y-3">
            {events.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
                No hay eventos recientes.
              </div>
            )}

            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
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
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{event.descripcion}</p>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard
            title="Carga manual"
            description="Bloque secundario para añadir daily results manualmente cuando haga falta."
          >
            <div ref={dailyResultRef} className="grid grid-cols-1 gap-4">
              <div>
                <FieldLabel>Cuenta activa</FieldLabel>
                <Select
                  value={dailyAccountId}
                  onChange={(e) => setDailyAccountId(e.target.value)}
                >
                  <option value="">Selecciona una cuenta</option>
                  {activeAccountOptions.map((option) => (
                    <option key={option.accountId} value={option.accountId}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Fecha</FieldLabel>
                  <Input
                    type="date"
                    value={dailyFecha}
                    onChange={(e) => setDailyFecha(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>Número de trades</FieldLabel>
                  <Input
                    value={dailyNumeroTrades}
                    onChange={(e) => setDailyNumeroTrades(e.target.value)}
                    placeholder="Ej. 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>PnL USD</FieldLabel>
                  <Input
                    value={dailyPnlUsd}
                    onChange={(e) => setDailyPnlUsd(e.target.value)}
                    placeholder="Ej. -120"
                  />
                </div>

                <div>
                  <FieldLabel>PnL %</FieldLabel>
                  <Input
                    value={dailyPnlPorcentaje}
                    onChange={(e) => setDailyPnlPorcentaje(e.target.value)}
                    placeholder="Ej. -0.25"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Notas</FieldLabel>
                <Input
                  value={dailyNotas}
                  onChange={(e) => setDailyNotas(e.target.value)}
                  placeholder="Ej. Día rojo por noticia"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Red day se calcula automáticamente si el PnL % es menor que -0.2.
                </p>
              </div>

              <div>
                <ActionButton
                  onClick={crearDailyResult}
                  disabled={
                    loading ||
                    !dailyAccountId ||
                    !dailyFecha ||
                    dailyPnlUsd === "" ||
                    dailyPnlPorcentaje === ""
                  }
                  variant="secondary"
                >
                  Guardar daily result
                </ActionButton>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function PackCard({
  pack,
  liveStatus,
  loading,
  onRotar,
  onEvaluar,
  onPerder,
  onFondear,
  onSelectDaily,
  onSelectReplace,
  getLivePnlClass,
}: {
  pack: Pack;
  liveStatus: LiveStatusMap;
  loading: boolean;
  onRotar: (packId: number, packNombre: string) => void;
  onEvaluar: (packId: number, packNombre: string) => void;
  onPerder: (accountId: number) => void;
  onFondear: (accountId: number) => void;
  onSelectDaily: (accountId: number) => void;
  onSelectReplace: (slotId: number) => void;
  getLivePnlClass: (value?: number) => string;
}) {
  const tieneIncidencia =
    pack.pack_slots?.some((slot) => slot.pendiente_reemplazo) ?? false;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-white">{pack.nombre}</h3>
            {tieneIncidencia ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
                Incidencia
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                Estable
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            Preset: {pack.presets?.nombre ?? "-"} · Tipo: {pack.tipo_pack}
          </p>

          {tieneIncidencia ? (
            <p className="mt-3 text-sm text-zinc-400">
              Este pack tiene al menos una cuenta pendiente de reemplazo.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            onClick={() => onRotar(pack.id, pack.nombre)}
            disabled={loading}
            variant="secondary"
          >
            Rotar pack
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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {pack.pack_slots
          ?.sort((a, b) => a.orden - b.orden)
          .map((slot) => {
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

            return (
              <div
                key={slot.id}
                className={`rounded-2xl border p-4 ${
                  slot.pendiente_reemplazo
                    ? "border-white/15 bg-white/[0.04]"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.14em] text-zinc-500">
                      Slot {slot.slot}
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {slot.accounts?.alias ?? "Sin cuenta"}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
                    {slot.es_activa ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-zinc-400">
                  <p>Número: {slot.accounts?.numero_cuenta ?? "-"}</p>
                  <p>Estado: {slot.accounts?.estado ?? "-"}</p>
                  <p>Tipo: {slot.accounts?.tipo_cuenta ?? "-"}</p>

                  {slot.es_activa && (
                    <p>
                      PnL actual:{" "}
                      <span className={getLivePnlClass(live?.pnl_actual)}>
                        {typeof live?.pnl_actual === "number"
                          ? live.pnl_actual.toFixed(2)
                          : "-"}
                      </span>
                    </p>
                  )}

                  <p>
                    Pendiente reemplazo:{" "}
                    <span className={slot.pendiente_reemplazo ? "text-zinc-200" : "text-zinc-500"}>
                      {slot.pendiente_reemplazo ? "Sí" : "No"}
                    </span>
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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

                  {slot.accounts?.id && slot.accounts?.estado === "activa" && (
                    <ActionButton
                      onClick={() => onSelectDaily(slot.accounts!.id)}
                      disabled={loading}
                      variant="ghost"
                    >
                      Cargar daily
                    </ActionButton>
                  )}

                  {slot.pendiente_reemplazo && (
                    <ActionButton
                      onClick={() => onSelectReplace(slot.id)}
                      disabled={loading}
                      variant="secondary"
                    >
                      Usar en reemplazo
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