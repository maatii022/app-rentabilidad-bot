import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ResultadoError = {
  error: unknown;
};

type ResultadoOk = {
  success?: boolean;
  mensaje?: string;
  anterior?: string;
  nuevo?: string;
  cuenta?: unknown;
  slot?: unknown;
  slotCreado?: boolean;
};

type ResultadoEvaluacionPack = {
  packId: number;
  packNombre: string;
  ok: boolean;
  mensaje: string;
};

type ReemplazoInput = {
  slotId?: number;
  packId?: number;
  slot?: string;
  numeroCuenta: string;
  alias: string;
};

type DailyResultRow = {
  id: number;
  account_id: number;
  fecha: string;
  pnl_usd: number | null;
  pnl_porcentaje: number | null;
  numero_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  red_day: boolean | null;
};

type TradeLogRow = {
  id: number;
  account_id: number;
  business_date: string;
  pnl_usd: number | null;
};

function normalizarSlot(slot: string | undefined) {
  return String(slot || "").trim().toUpperCase();
}

function getOrdenDesdeSlot(slot: string) {
  if (slot === "A") return 1;
  if (slot === "B") return 2;
  if (slot === "C") return 3;
  return 999;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return 0;
}

function getFechaHoyLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function obtenerOCrearSlotParaReemplazo({
  slotId,
  packId,
  slot,
}: {
  slotId?: number;
  packId?: number;
  slot?: string;
}) {
  if (slotId && slotId > 0) {
    const { data: slotExistente, error: errorSlotExistente } = await supabaseAdmin
      .from("pack_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (errorSlotExistente || !slotExistente) {
      return {
        error: errorSlotExistente ?? { message: "No se encontró el slot" },
      };
    }

    return {
      slot: slotExistente,
      slotCreado: false,
    };
  }

  const slotNormalizado = normalizarSlot(slot);

  if (!packId || !slotNormalizado) {
    return {
      error: {
        message:
          "Faltan datos para resolver el slot. Debes enviar slotId real o packId + slot",
      },
    };
  }

  const { data: slotPorPack, error: errorBusqueda } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("pack_id", packId)
    .eq("slot", slotNormalizado)
    .maybeSingle();

  if (errorBusqueda) {
    return { error: errorBusqueda };
  }

  if (slotPorPack) {
    return {
      slot: slotPorPack,
      slotCreado: false,
    };
  }

  const { data: nuevoSlot, error: errorCrearSlot } = await supabaseAdmin
    .from("pack_slots")
    .insert({
      pack_id: packId,
      slot: slotNormalizado,
      orden: getOrdenDesdeSlot(slotNormalizado),
      es_activa: false,
      pendiente_reemplazo: false,
      account_id: null,
    })
    .select()
    .single();

  if (errorCrearSlot || !nuevoSlot) {
    return {
      error:
        errorCrearSlot ?? { message: "No se pudo crear el slot faltante" },
    };
  }

  return {
    slot: nuevoSlot,
    slotCreado: true,
  };
}

async function obtenerResultadoDiarioCuenta(accountId: number, fecha: string) {
  const { data: resultado, error: errorResultado } = await supabaseAdmin
    .from("daily_results")
    .select(
      "id, account_id, fecha, pnl_usd, pnl_porcentaje, numero_trades, winning_trades, losing_trades, red_day"
    )
    .eq("account_id", accountId)
    .eq("fecha", fecha)
    .maybeSingle<DailyResultRow>();

  if (!errorResultado && resultado) {
    return {
      ok: true as const,
      source: "daily_results" as const,
      resultado,
    };
  }

  const { data: trades, error: errorTrades } = await supabaseAdmin
    .from("trade_log")
    .select("id, account_id, business_date, pnl_usd")
    .eq("account_id", accountId)
    .eq("business_date", fecha)
    .returns<TradeLogRow[]>();

  if (errorTrades) {
    return {
      ok: false as const,
      error: errorTrades,
    };
  }

  const rows = trades ?? [];

  if (rows.length === 0) {
    return {
      ok: false as const,
      error: {
        message: "No hay daily result ni trades para la cuenta activa en esta fecha",
      },
    };
  }

  const pnlUsd = rows.reduce((acc, row) => acc + toNumber(row.pnl_usd), 0);
  const numeroTrades = rows.length;
  const winningTrades = rows.filter((row) => toNumber(row.pnl_usd) > 0).length;
  const losingTrades = rows.filter((row) => toNumber(row.pnl_usd) < 0).length;

  const reconstruido: DailyResultRow = {
    id: -1,
    account_id: accountId,
    fecha,
    pnl_usd: Number(pnlUsd.toFixed(2)),
    pnl_porcentaje: null,
    numero_trades: numeroTrades,
    winning_trades: winningTrades,
    losing_trades: losingTrades,
    red_day: pnlUsd < 0,
  };

  return {
    ok: true as const,
    source: "trade_log" as const,
    resultado: reconstruido,
  };
}

export async function activarSiguienteSlot(
  packId: number
): Promise<ResultadoError | ResultadoOk> {
  const { data: slots, error } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("pack_id", packId)
    .order("orden", { ascending: true });

  if (error) {
    return { error };
  }

  if (!slots || slots.length === 0) {
    return { error: { message: "No se encontraron slots para este pack" } };
  }

  const slotActivo = slots.find((slot) => slot.es_activa);

  if (!slotActivo) {
    return { error: { message: "No hay slot activo en este pack" } };
  }

  const slotsDisponibles = slots.filter(
    (slot) =>
      slot.id !== slotActivo.id &&
      slot.account_id &&
      !slot.pendiente_reemplazo
  );

  if (slotsDisponibles.length === 0) {
    return {
      error: {
        message: "No hay slots disponibles para activar en este pack",
      },
    };
  }

  const siguienteSlot =
    slotsDisponibles.find((slot) => slot.orden > slotActivo.orden) ??
    slotsDisponibles[0];

  const { error: errorDesactivarPack } = await supabaseAdmin
    .from("pack_slots")
    .update({ es_activa: false })
    .eq("pack_id", packId);

  if (errorDesactivarPack) {
    return { error: errorDesactivarPack };
  }

  const { error: errorActivar } = await supabaseAdmin
    .from("pack_slots")
    .update({ es_activa: true })
    .eq("id", siguienteSlot.id);

  if (errorActivar) {
    return { error: errorActivar };
  }

  const fechaHoy = getFechaHoyLocal();

  const { error: errorEventoOut } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: slotActivo.account_id,
      pack_id: packId,
      fecha: fechaHoy,
      tipo_evento: "SORD out",
      descripcion: `La cuenta del slot ${slotActivo.slot} salió de rotación`,
    });

  if (errorEventoOut) {
    return { error: errorEventoOut };
  }

  const { error: errorEventoIn } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: siguienteSlot.account_id,
      pack_id: packId,
      fecha: fechaHoy,
      tipo_evento: "SORD in",
      descripcion: `La cuenta del slot ${siguienteSlot.slot} entró en rotación`,
    });

  if (errorEventoIn) {
    return { error: errorEventoIn };
  }

  return {
    success: true,
    anterior: slotActivo.slot,
    nuevo: siguienteSlot.slot,
  };
}

export async function evaluarSORD(
  packId: number,
  fecha: string
): Promise<ResultadoError | ResultadoOk> {
  const { data: slots, error: errorSlots } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("pack_id", packId)
    .order("orden", { ascending: true });

  if (errorSlots) {
    return { error: errorSlots };
  }

  const slotActivo = slots?.find((s) => s.es_activa);

  if (!slotActivo || !slotActivo.account_id) {
    return { error: { message: "No hay slot activo" } };
  }

  const resultadoCuenta = await obtenerResultadoDiarioCuenta(slotActivo.account_id, fecha);

  if (!resultadoCuenta.ok) {
    return {
      error:
        resultadoCuenta.error ??
        { message: "No hay daily result para la cuenta activa en esta fecha" },
    };
  }

  const resultado = resultadoCuenta.resultado;

  if (!resultado.red_day) {
    return {
      mensaje:
        resultadoCuenta.source === "trade_log"
          ? "No hay red day, no se rota, calculado desde trade log"
          : "No hay red day, no se rota",
    };
  }

  const rotacion = await activarSiguienteSlot(packId);

  if ("error" in rotacion && rotacion.error) {
    return { error: rotacion.error };
  }

  return {
    mensaje:
      resultadoCuenta.source === "trade_log"
        ? "SORD ejecutado, calculado desde trade log"
        : "SORD ejecutado",
    ...rotacion,
  };
}

export async function evaluarTodosLosPacksDelDia(
  fecha: string
): Promise<ResultadoEvaluacionPack[]> {
  const { data: packs, error } = await supabaseAdmin
    .from("packs")
    .select("id, nombre, activo")
    .eq("activo", true)
    .order("id", { ascending: true });

  if (error || !packs) {
    return [
      {
        packId: -1,
        packNombre: "General",
        ok: false,
        mensaje: "No se pudieron cargar los packs activos",
      },
    ];
  }

  const resultados: ResultadoEvaluacionPack[] = [];

  for (const pack of packs) {
    const resultado = await evaluarSORD(pack.id, fecha);

    if ("error" in resultado && resultado.error) {
      let mensaje = "Error desconocido";

      if (
        typeof resultado.error === "object" &&
        resultado.error !== null &&
        "message" in resultado.error
      ) {
        mensaje = String((resultado.error as { message?: unknown }).message);
      }

      resultados.push({
        packId: pack.id,
        packNombre: pack.nombre,
        ok: false,
        mensaje,
      });
    } else {
      const mensaje =
        typeof resultado === "object" &&
        resultado !== null &&
        "mensaje" in resultado &&
        typeof resultado.mensaje === "string"
          ? resultado.mensaje
          : "Evaluación completada";

      resultados.push({
        packId: pack.id,
        packNombre: pack.nombre,
        ok: true,
        mensaje,
      });
    }
  }

  return resultados;
}

export async function marcarCuentaPerdida(
  accountId: number
): Promise<ResultadoError | ResultadoOk> {
  const fechaHoy = getFechaHoyLocal();

  const { data: slot, error: errorSlot } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("account_id", accountId)
    .single();

  if (errorSlot || !slot) {
    return {
      error: errorSlot ?? { message: "No se encontró slot para esta cuenta" },
    };
  }

  const { error: errorCuenta } = await supabaseAdmin
    .from("accounts")
    .update({
      estado: "perdida",
      fecha_perdida: fechaHoy,
      activa_en_filtros: false,
    })
    .eq("id", accountId);

  if (errorCuenta) {
    return { error: errorCuenta };
  }

  const { error: errorSlotUpdate } = await supabaseAdmin
    .from("pack_slots")
    .update({
      pendiente_reemplazo: true,
      es_activa: false,
    })
    .eq("id", slot.id);

  if (errorSlotUpdate) {
    return { error: errorSlotUpdate };
  }

  const { error: errorEventoPerdida } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: accountId,
      pack_id: slot.pack_id,
      fecha: fechaHoy,
      tipo_evento: "perdida",
      descripcion: `La cuenta del slot ${slot.slot} fue marcada como perdida`,
    });

  if (errorEventoPerdida) {
    return { error: errorEventoPerdida };
  }

  const { data: slots, error: errorSlots } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("pack_id", slot.pack_id)
    .order("orden", { ascending: true });

  if (errorSlots || !slots) {
    return {
      error:
        errorSlots ?? { message: "No se pudieron cargar los slots del pack" },
    };
  }

  const candidatos = slots.filter(
    (s) => s.id !== slot.id && s.account_id && !s.pendiente_reemplazo
  );

  if (candidatos.length === 0) {
    return {
      success: true,
      mensaje: "Cuenta perdida, no hay otra cuenta disponible para activar",
    };
  }

  let siguiente = candidatos.find((s) => s.orden > slot.orden);
  if (!siguiente) {
    siguiente = candidatos[0];
  }

  const { error: errorDesactivarPack } = await supabaseAdmin
    .from("pack_slots")
    .update({ es_activa: false })
    .eq("pack_id", slot.pack_id);

  if (errorDesactivarPack) {
    return { error: errorDesactivarPack };
  }

  const { error: errorActivar } = await supabaseAdmin
    .from("pack_slots")
    .update({ es_activa: true })
    .eq("id", siguiente.id);

  if (errorActivar) {
    return { error: errorActivar };
  }

  const { error: errorOut } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: accountId,
      pack_id: slot.pack_id,
      fecha: fechaHoy,
      tipo_evento: "SORD out",
      descripcion: `La cuenta del slot ${slot.slot} salió de rotación por pérdida`,
    });

  if (errorOut) {
    return { error: errorOut };
  }

  const { error: errorIn } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: siguiente.account_id,
      pack_id: slot.pack_id,
      fecha: fechaHoy,
      tipo_evento: "SORD in",
      descripcion: `La cuenta del slot ${siguiente.slot} entró en rotación tras pérdida`,
    });

  if (errorIn) {
    return { error: errorIn };
  }

  return {
    success: true,
    mensaje: "Cuenta marcada como perdida y SORD ejecutado",
  };
}

export async function marcarCuentaFondeada(
  accountId: number
): Promise<ResultadoError | ResultadoOk> {
  const fechaHoy = getFechaHoyLocal();

  const { data: slot, error: errorSlot } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("account_id", accountId)
    .single();

  if (errorSlot || !slot) {
    return { error: errorSlot ?? { message: "No se encontró slot" } };
  }

  const { error: errorCuenta } = await supabaseAdmin
    .from("accounts")
    .update({
      estado: "fondeada",
      fecha_fondeo: fechaHoy,
      activa_en_filtros: false,
    })
    .eq("id", accountId);

  if (errorCuenta) {
    return { error: errorCuenta };
  }

  const { error: errorSlotUpdate } = await supabaseAdmin
    .from("pack_slots")
    .update({
      pendiente_reemplazo: true,
      es_activa: false,
    })
    .eq("id", slot.id);

  if (errorSlotUpdate) {
    return { error: errorSlotUpdate };
  }

  const { error: errorEventoFondeo } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: accountId,
      pack_id: slot.pack_id,
      fecha: fechaHoy,
      tipo_evento: "fondeada",
      descripcion: `La cuenta del slot ${slot.slot} se fondeó`,
    });

  if (errorEventoFondeo) {
    return { error: errorEventoFondeo };
  }

  const { data: slots, error: errorSlots } = await supabaseAdmin
    .from("pack_slots")
    .select("*")
    .eq("pack_id", slot.pack_id)
    .order("orden", { ascending: true });

  if (errorSlots || !slots) {
    return {
      error:
        errorSlots ?? { message: "No se pudieron cargar los slots del pack" },
    };
  }

  const candidatos = slots.filter(
    (s) => s.id !== slot.id && s.account_id && !s.pendiente_reemplazo
  );

  if (candidatos.length === 0) {
    return {
      success: true,
      mensaje: "Cuenta fondeada, no hay otra cuenta disponible para activar",
    };
  }

  let siguiente = candidatos.find((s) => s.orden > slot.orden);
  if (!siguiente) {
    siguiente = candidatos[0];
  }

  const { error: errorDesactivarPack } = await supabaseAdmin
    .from("pack_slots")
    .update({ es_activa: false })
    .eq("pack_id", slot.pack_id);

  if (errorDesactivarPack) {
    return { error: errorDesactivarPack };
  }

  const { error: errorActivar } = await supabaseAdmin
    .from("pack_slots")
    .update({ es_activa: true })
    .eq("id", siguiente.id);

  if (errorActivar) {
    return { error: errorActivar };
  }

  const { error: errorOut } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: accountId,
      pack_id: slot.pack_id,
      fecha: fechaHoy,
      tipo_evento: "SORD out",
      descripcion: `Salida por fondeo del slot ${slot.slot}`,
    });

  if (errorOut) {
    return { error: errorOut };
  }

  const { error: errorIn } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: siguiente.account_id,
      pack_id: slot.pack_id,
      fecha: fechaHoy,
      tipo_evento: "SORD in",
      descripcion: `Entrada tras fondeo en slot ${siguiente.slot}`,
    });

  if (errorIn) {
    return { error: errorIn };
  }

  return { success: true };
}

export async function reemplazarCuentaEnSlot({
  slotId,
  packId,
  slot,
  numeroCuenta,
  alias,
}: ReemplazoInput): Promise<ResultadoError | ResultadoOk> {
  const fechaHoy = getFechaHoyLocal();

  const slotResuelto = await obtenerOCrearSlotParaReemplazo({
    slotId,
    packId,
    slot,
  });

  if ("error" in slotResuelto && slotResuelto.error) {
    return { error: slotResuelto.error };
  }

  const slotObjetivo = slotResuelto.slot;
  const slotCreado = slotResuelto.slotCreado;

  const { data: pack, error: errorPack } = await supabaseAdmin
    .from("packs")
    .select("*")
    .eq("id", slotObjetivo.pack_id)
    .single();

  if (errorPack || !pack) {
    return {
      error: errorPack ?? { message: "No se encontró el pack" },
    };
  }

  const numeroCuentaNormalizado = String(numeroCuenta || "").trim();
  const aliasNormalizado = String(alias || "").trim();

  if (!numeroCuentaNormalizado || !aliasNormalizado) {
    return {
      error: { message: "Número de cuenta y alias son obligatorios" },
    };
  }

  const { data: cuentaExistente, error: errorCuentaExistente } = await supabaseAdmin
    .from("accounts")
    .select("id, numero_cuenta, alias, estado")
    .eq("numero_cuenta", numeroCuentaNormalizado)
    .maybeSingle();

  if (errorCuentaExistente) {
    return { error: errorCuentaExistente };
  }

  let cuentaAsignada:
    | {
        id: number;
        numero_cuenta: string;
        alias: string;
        estado: string;
      }
    | null = null;

  if (cuentaExistente) {
    const { data: slotsCuentaExistente, error: errorSlotsCuentaExistente } =
      await supabaseAdmin
        .from("pack_slots")
        .select("id")
        .eq("account_id", cuentaExistente.id);

    if (errorSlotsCuentaExistente) {
      return { error: errorSlotsCuentaExistente };
    }

    const estaEnPack = (slotsCuentaExistente ?? []).length > 0;

    if (estaEnPack) {
      return {
        error: {
          message: "La cuenta seleccionada ya está asignada a un pack",
        },
      };
    }

    const { data: cuentaActualizada, error: errorActualizarCuenta } =
      await supabaseAdmin
        .from("accounts")
        .update({
          preset_id: pack.preset_id,
          numero_cuenta: numeroCuentaNormalizado,
          alias: aliasNormalizado,
          tipo_cuenta: pack.tipo_pack,
          estado: "activa",
          fecha_inicio: fechaHoy,
          activa_en_filtros: true,
        })
        .eq("id", cuentaExistente.id)
        .select("id, numero_cuenta, alias, estado")
        .single();

    if (errorActualizarCuenta || !cuentaActualizada) {
      return {
        error:
          errorActualizarCuenta ??
          { message: "No se pudo actualizar la cuenta existente" },
      };
    }

    cuentaAsignada = cuentaActualizada;
  } else {
    const { data: nuevaCuenta, error: errorNuevaCuenta } = await supabaseAdmin
      .from("accounts")
      .insert({
        preset_id: pack.preset_id,
        numero_cuenta: numeroCuentaNormalizado,
        alias: aliasNormalizado,
        tipo_cuenta: pack.tipo_pack,
        estado: "activa",
        fecha_inicio: fechaHoy,
        activa_en_filtros: true,
      })
      .select("id, numero_cuenta, alias, estado")
      .single();

    if (errorNuevaCuenta || !nuevaCuenta) {
      return {
        error:
          errorNuevaCuenta ?? { message: "No se pudo crear la nueva cuenta" },
      };
    }

    cuentaAsignada = nuevaCuenta;
  }

  const { error: errorUpdateSlot } = await supabaseAdmin
    .from("pack_slots")
    .update({
      account_id: cuentaAsignada.id,
      pendiente_reemplazo: false,
    })
    .eq("id", slotObjetivo.id);

  if (errorUpdateSlot) {
    return { error: errorUpdateSlot };
  }

  const { error: errorEvento } = await supabaseAdmin
    .from("account_events")
    .insert({
      account_id: cuentaAsignada.id,
      pack_id: slotObjetivo.pack_id,
      fecha: fechaHoy,
      tipo_evento: "reemplazo asignado",
      descripcion: `Nueva cuenta asignada al slot ${slotObjetivo.slot}`,
    });

  if (errorEvento) {
    return { error: errorEvento };
  }

  return {
    success: true,
    cuenta: cuentaAsignada,
    slot: slotObjetivo,
    slotCreado,
    mensaje: slotCreado
      ? `Se creó el slot ${slotObjetivo.slot} y se asignó la cuenta`
      : `Se asignó la cuenta al slot ${slotObjetivo.slot}`,
  };
}