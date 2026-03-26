import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type UpstreamLiveStatusItem = {
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

type UpstreamResponse = Record<string, UpstreamLiveStatusItem>;

function getLiveStatusUrl() {
  const base =
    process.env.LIVE_STATUS_SERVER_URL ||
    process.env.NEXT_PUBLIC_LIVE_STATUS_SERVER_URL ||
    "";

  if (!base) {
    throw new Error("Falta LIVE_STATUS_SERVER_URL");
  }

  return `${base.replace(/\/+$/, "")}/live-status`;
}

export async function GET() {
  try {
    const url = getLiveStatusUrl();

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Upstream live-status respondió ${response.status}`,
        },
        { status: 502 }
      );
    }

    const upstreamJson = (await response.json()) as UpstreamResponse;

    const data: Record<string, UpstreamLiveStatusItem> = {};

    for (const [accountNumber, item] of Object.entries(upstreamJson ?? {})) {
      data[accountNumber] = {
        preset: item?.preset ?? undefined,
        balance: item?.balance ?? null,
        equity: item?.equity ?? null,
        account_size_inferred: item?.account_size_inferred ?? null,
        pnl_realizado_hoy: item?.pnl_realizado_hoy ?? null,
        pnl_abierto: item?.pnl_abierto ?? null,
        pnl_actual: item?.pnl_actual ?? null,
        pnl_hoy_usd: item?.pnl_hoy_usd ?? null,
        pnl_pct_actual: item?.pnl_pct_actual ?? null,
        pnl_hoy_pct: item?.pnl_hoy_pct ?? null,
        profit_total_pct: item?.profit_total_pct ?? null,
        profit_total_pct_current: item?.profit_total_pct_current ?? null,
        trades_abiertos: item?.trades_abiertos ?? null,
        error: item?.error ?? undefined,
      };
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}