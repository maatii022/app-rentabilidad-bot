import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS_LIVE_STATUS_URL = "http://5.134.118.153:5050/live-status";

type RawLiveStatusItem = {
  preset?: unknown;
  pnl_actual?: unknown;
  pnl_pct_actual?: unknown;
  trades_abiertos?: unknown;
  balance?: unknown;
  error?: unknown;
};

type NormalizedLiveStatusItem = {
  preset?: string;
  pnl_actual?: number | null;
  pnl_pct_actual?: number | null;
  trades_abiertos?: number | null;
  balance?: number | null;
  error?: string;
};

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeItem(item: RawLiveStatusItem): NormalizedLiveStatusItem {
  const pnlActual = toNumberOrNull(item.pnl_actual);
  const pnlPctActualDirect = toNumberOrNull(item.pnl_pct_actual);
  const balance = toNumberOrNull(item.balance);
  const tradesAbiertos = toNumberOrNull(item.trades_abiertos);

  let pnlPctActual: number | null = pnlPctActualDirect;

  if (pnlPctActual === null && pnlActual !== null && balance !== null && balance > 0) {
    pnlPctActual = (pnlActual / balance) * 100;
  }

  return {
    preset: toStringOrUndefined(item.preset),
    pnl_actual: pnlActual,
    pnl_pct_actual: pnlPctActual,
    trades_abiertos: tradesAbiertos,
    balance,
    error: toStringOrUndefined(item.error),
  };
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(VPS_LIVE_STATUS_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Error consultando VPS: HTTP ${res.status}`,
        },
        { status: 500 }
      );
    }

    const data = await res.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        {
          ok: false,
          error: "La respuesta de la VPS no tiene el formato esperado",
        },
        { status: 500 }
      );
    }

    const normalized = Object.fromEntries(
      Object.entries(data).map(([accountNumber, rawItem]) => {
        const item = (rawItem ?? {}) as RawLiveStatusItem;
        return [accountNumber, normalizeItem(item)];
      })
    );

    return NextResponse.json(
      {
        ok: true,
        data: normalized,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    clearTimeout(timeout);

    const message =
      error instanceof Error ? error.message : "Error desconocido en live-status";

    console.error("Error en /api/live-status:", message);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}