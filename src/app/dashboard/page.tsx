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

const LIVE_STATUS_URL = "/api/live-status";

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

    console.log("Respuesta /api/live-status:", json);

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
      console.log("Respuesta revisión diaria:", data);

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

      const cumplePreset =
        presetFilter === "todos" || presetNombre === presetFilter;

      const cumpleTipo =
        tipoFilter === "todos" || pack.tipo_pack === tipoFilter;

      const tieneIncidencia =
        pack.pack_slots?.some((slot) => slot.pendiente_reemplazo) ?? false;

      const cumpleIncidencia = !soloIncidencias || tieneIncidencia;

      return cumplePreset && cumpleTipo && cumpleIncidencia;
    });
  }, [packs, presetFilter, tipoFilter, soloIncidencias]);

  const resumen = useMemo(() => {
    const packsConIncidencias = packsFiltrados.filter((pack) =>
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
      packsConIncidencias,
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
    if (typeof value !== "number") return "text-gray-400";
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-gray-300";
  }

  useEffect(() => {
    cargarDatos();
    cargarResumenHistorico();
  }, []);

  useEffect(() => {
    cargarResumenHistorico();
  }, [historicoModo, historicoAnio, historicoMes, presetFilter, tipoFilter]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={recargarEstado}
            disabled={loadingLive}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {loadingLive ? "Recargando..." : "Recargar estado"}
          </button>

          <button
            onClick={ejecutarRevisionDiaria}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Ejecutar revisión diaria"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-300">Período histórico</label>

        <select
          value={historicoModo}
          onChange={(e) => setHistoricoModo(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
        >
          <option value="todo">Todo</option>
          <option value="anio">Año concreto</option>
          <option value="mes">Mes concreto</option>
        </select>

        {(historicoModo === "anio" || historicoModo === "mes") && (
          <select
            value={historicoAnio}
            onChange={(e) => setHistoricoAnio(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}

        {historicoModo === "mes" && (
          <select
            value={historicoMes}
            onChange={(e) => setHistoricoMes(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-gray-400">Packs visibles</p>
          <p className="mt-2 text-2xl font-semibold">{resumen.packsVisibles}</p>
        </div>

        <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-4">
          <p className="text-sm text-yellow-300">Packs con incidencias</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-200">
            {resumen.packsConIncidencias}
          </p>
        </div>

        <div className="rounded-xl border border-orange-400/40 bg-orange-400/10 p-4">
          <p className="text-sm text-orange-300">Slots pendientes</p>
          <p className="mt-2 text-2xl font-semibold text-orange-200">
            {resumen.slotsPendientes}
          </p>
        </div>

        <div className="rounded-xl border border-green-400/40 bg-green-400/10 p-4">
          <p className="text-sm text-green-300">Cuentas activas</p>
          <p className="mt-2 text-2xl font-semibold text-green-200">
            {resumen.cuentasActivas}
          </p>
        </div>

        <div className="rounded-xl border border-purple-400/40 bg-purple-400/10 p-4">
          <p className="text-sm text-purple-300">Fondeadas históricas</p>
          <p className="mt-2 text-2xl font-semibold text-purple-200">
            {summary.fondeadasHistoricas}
          </p>
        </div>

        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-4">
          <p className="text-sm text-red-300">Perdidas históricas</p>
          <p className="mt-2 text-2xl font-semibold text-red-200">
            {summary.perdidasHistoricas}
          </p>
        </div>
      </div>

      {resultadosRevision.length > 0 && (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-xl font-semibold">Resultado de la revisión diaria</h2>

          <div className="space-y-3">
            {resultadosRevision.map((resultado) => (
              <div
                key={`${resultado.packId}-${resultado.packNombre}`}
                className="rounded-lg border border-white/10 bg-[#111827] p-4"
              >
                <p className="font-medium">{resultado.packNombre}</p>
                <p className={resultado.ok ? "text-green-400" : "text-yellow-400"}>
                  {resultado.mensaje}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={dailyResultRef}
        className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5"
      >
        <h2 className="mb-4 text-xl font-semibold">Cargar daily result manual</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Cuenta activa</label>
            <select
              value={dailyAccountId}
              onChange={(e) => setDailyAccountId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
            >
              <option value="">Selecciona una cuenta</option>
              {activeAccountOptions.map((option) => (
                <option key={option.accountId} value={option.accountId}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Fecha</label>
            <input
              type="date"
              value={dailyFecha}
              onChange={(e) => setDailyFecha(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">PnL USD</label>
            <input
              value={dailyPnlUsd}
              onChange={(e) => setDailyPnlUsd(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
              placeholder="Ej. -120"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">PnL %</label>
            <input
              value={dailyPnlPorcentaje}
              onChange={(e) => setDailyPnlPorcentaje(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
              placeholder="Ej. -0.25"
            />
            <p className="mt-1 text-xs text-gray-400">
              Red day se calcula automáticamente si el PnL % es menor que -0.2
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Número de trades</label>
            <input
              value={dailyNumeroTrades}
              onChange={(e) => setDailyNumeroTrades(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
              placeholder="Ej. 3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Notas</label>
            <input
              value={dailyNotas}
              onChange={(e) => setDailyNotas(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
              placeholder="Ej. Día rojo por noticia"
            />
          </div>
        </div>

        <button
          onClick={crearDailyResult}
          disabled={
            loading ||
            !dailyAccountId ||
            !dailyFecha ||
            dailyPnlUsd === "" ||
            dailyPnlPorcentaje === ""
          }
          className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          Guardar daily result
        </button>
      </div>

      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-xl font-semibold">Filtros</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Preset</label>
            <select
              value={presetFilter}
              onChange={(e) => setPresetFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
            >
              <option value="todos">Todos</option>
              {presetOptions.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Tipo de pack</label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
            >
              <option value="todos">Todos</option>
              <option value="prueba">Prueba</option>
              <option value="fondeada">Fondeada</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={soloIncidencias}
                onChange={(e) => setSoloIncidencias(e.target.checked)}
              />
              Solo packs con incidencias
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setPresetFilter("todos");
                setTipoFilter("todos");
                setSoloIncidencias(false);
              }}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {packsFiltrados.map((pack) => (
          <div
            key={pack.id}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{pack.nombre}</h2>
                <p className="text-sm text-gray-400">
                  Preset: {pack.presets?.nombre} | Tipo: {pack.tipo_pack}
                </p>

                {pack.pack_slots?.some((slot) => slot.pendiente_reemplazo) && (
                  <p className="mt-2 text-sm text-yellow-400">
                    Advertencia: este pack tiene al menos una cuenta pendiente de reemplazo.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => rotarPack(pack.id, pack.nombre)}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Rotar pack
                </button>

                <button
                  onClick={() => evaluarPack(pack.id, pack.nombre)}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Evaluar SORD
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                      className={`rounded-lg border p-4 ${
                        slot.pendiente_reemplazo
                          ? "border-yellow-400 bg-[#2a2112]"
                          : "border-white/10 bg-[#111827]"
                      }`}
                    >
                      <p className="mb-2 text-lg font-semibold">Slot {slot.slot}</p>

                      <p>Cuenta: {slot.accounts?.alias ?? "Sin cuenta"}</p>
                      <p>Número: {slot.accounts?.numero_cuenta ?? "-"}</p>
                      <p>Estado: {slot.accounts?.estado ?? "-"}</p>
                      <p>Tipo: {slot.accounts?.tipo_cuenta ?? "-"}</p>

                      <p className="mt-3">Activa: {slot.es_activa ? "Sí" : "No"}</p>

                      {slot.es_activa && (
  <p className="mt-2">
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
                        <span
                          className={slot.pendiente_reemplazo ? "text-yellow-400" : "text-white"}
                        >
                          {slot.pendiente_reemplazo ? "Sí" : "No"}
                        </span>
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => slot.accounts?.id && marcarPerdida(slot.accounts.id)}
                          disabled={loading || !puedePerder}
                          className="rounded-lg bg-yellow-600 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-500 disabled:opacity-40"
                        >
                          Perder
                        </button>

                        <button
                          onClick={() => slot.accounts?.id && marcarFondeada(slot.accounts.id)}
                          disabled={loading || !puedeFondear}
                          className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-40"
                        >
                          Fondear
                        </button>

                        {slot.accounts?.id && slot.accounts?.estado === "activa" && (
                          <button
                            onClick={() => seleccionarCuentaParaDaily(slot.accounts!.id)}
                            disabled={loading}
                            className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-40"
                          >
                            Cargar daily
                          </button>
                        )}

                        {slot.pendiente_reemplazo && (
                          <button
                            onClick={() => seleccionarSlotPendiente(slot.id)}
                            disabled={loading}
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-40"
                          >
                            Usar en reemplazo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div
        ref={reemplazoRef}
        className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5"
      >
        <h2 className="mb-4 text-xl font-semibold">Reemplazar cuenta pendiente</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Slot pendiente
            </label>
            <select
              value={selectedPendingSlotId}
              onChange={(e) => setSelectedPendingSlotId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
            >
              <option value="">Selecciona un slot pendiente</option>
              {pendingSlotOptions.map((option) => (
                <option key={option.slotId} value={option.slotId}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Número de cuenta</label>
            <input
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
              placeholder="Ej. 128999"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Alias</label>
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-white outline-none"
              placeholder="Ej. Fernet B2"
            />
          </div>
        </div>

        <button
          onClick={reemplazarCuenta}
          disabled={loading || !selectedPendingSlotId || !numeroCuenta || !alias}
          className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
        >
          Reemplazar cuenta
        </button>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Eventos recientes</h2>

        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p>Fecha: {event.fecha}</p>
              <p>
                Tipo:{" "}
                <span
                  className={
                    event.tipo_evento === "SORD in"
                      ? "text-green-400"
                      : event.tipo_evento === "SORD out"
                      ? "text-red-400"
                      : event.tipo_evento === "perdida"
                      ? "text-yellow-400"
                      : event.tipo_evento === "fondeada"
                      ? "text-purple-400"
                      : "text-white"
                  }
                >
                  {event.tipo_evento}
                </span>
              </p>
              <p>Cuenta: {event.accounts?.alias ?? "-"}</p>
              <p>Número: {event.accounts?.numero_cuenta ?? "-"}</p>
              <p>Descripción: {event.descripcion ?? "-"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}