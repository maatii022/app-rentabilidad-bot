import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type SnapshotRow = {
  account_id: number;
  pnl_hoy_usd: number | null;
  pnl_hoy_pct: number | null;
  profit_total_pct: number | null;
  trades_abiertos: number | null;
  live_status: string | null;
};

type AccountRow = {
  id: number;
  numero_cuenta: string | null;
};

type LiveStatusItem = {
  preset?: string;
  balance?: number | null;
  account_size_inferred?: number | null;
  pnl_actual?: number | null;
  pnl_hoy_usd?: number | null;
  pnl_pct_actual?: number | null;
  pnl_hoy_pct?: number | null;
  profit_total_pct?: number | null;
  trades_abiertos?: number | null;
  error?: string;
};

type LiveStatusResponse = {
  ok?: boolean;
  data?: Record<string, LiveStatusItem>;
};

type TodaySnapshotItem = {
  pnl_hoy_usd: number | null;
  pnl_hoy_pct: number | null;
  profit_total_pct: number | null;
  trades_abiertos: number | null;
  live_status: string | null;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function getOriginFromRequest(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  try {
    const today = getTodayDate();

    const { data: snapshots, error: snapshotsError } = await supabaseAdmin
      .from("account_daily_snapshots")
      .select(
        "account_id, pnl_hoy_usd, pnl_hoy_pct, profit_total_pct, trades_abiertos, live_status"
      )
      .eq("snapshot_date", today);

    if (snapshotsError) {
      return NextResponse.json(
        {
          ok: false,
          error: snapshotsError.message,
        },
        { status: 500 }
      );
    }

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("accounts")
      .select("id, numero_cuenta");

    if (accountsError) {
      return NextResponse.json(
        {
          ok: false,
          error: accountsError.message,
        },
        { status: 500 }
      );
    }

    const typedSnapshots = (snapshots ?? []) as SnapshotRow[];
    const typedAccounts = (accounts ?? []) as AccountRow[];

    const snapshotByNumeroCuenta: Record<string, TodaySnapshotItem> = {};
    const numeroCuentaByAccountId = new Map<number, string>();

    for (const account of typedAccounts) {
      if (account.numero_cuenta) {
        numeroCuentaByAccountId.set(account.id, account.numero_cuenta);
      }
    }

    for (const snapshot of typedSnapshots) {
      const numeroCuenta = numeroCuentaByAccountId.get(snapshot.account_id);

      if (!numeroCuenta) continue;

      snapshotByNumeroCuenta[numeroCuenta] = {
        pnl_hoy_usd: snapshot.pnl_hoy_usd,
        pnl_hoy_pct: snapshot.pnl_hoy_pct,
        profit_total_pct: snapshot.profit_total_pct,
        trades_abiertos: snapshot.trades_abiertos,
        live_status: snapshot.live_status,
      };
    }

    let liveData: Record<string, LiveStatusItem> = {};

    try {
      const origin = getOriginFromRequest(request);

      const liveResponse = await fetch(`${origin}/api/live-status`, {
        method: "GET",
        cache: "no-store",
      });

      if (liveResponse.ok) {
        const liveJson = (await liveResponse.json()) as LiveStatusResponse;

        if (liveJson?.ok && liveJson.data && typeof liveJson.data === "object") {
          liveData = liveJson.data;
        }
      }
    } catch {
      liveData = {};
    }

    const allAccountNumbers = new Set<string>([
      ...Object.keys(snapshotByNumeroCuenta),
      ...Object.keys(liveData),
    ]);

    const merged: Record<string, TodaySnapshotItem> = {};

    for (const numeroCuenta of allAccountNumbers) {
      const snapshot = snapshotByNumeroCuenta[numeroCuenta];
      const live = liveData[numeroCuenta];

      const livePnlHoyUsd = isValidNumber(live?.pnl_hoy_usd)
        ? live!.pnl_hoy_usd!
        : isValidNumber(live?.pnl_actual)
        ? live!.pnl_actual!
        : null;

      const livePnlHoyPct = isValidNumber(live?.pnl_hoy_pct)
        ? live!.pnl_hoy_pct!
        : isValidNumber(live?.pnl_pct_actual)
        ? live!.pnl_pct_actual!
        : null;

      const liveProfitTotalPct = isValidNumber(live?.profit_total_pct)
        ? live!.profit_total_pct!
        : null;

      const liveTradesAbiertos = isValidNumber(live?.trades_abiertos)
        ? live!.trades_abiertos!
        : null;

      merged[numeroCuenta] = {
        pnl_hoy_usd:
          livePnlHoyUsd !== null
            ? livePnlHoyUsd
            : snapshot?.pnl_hoy_usd ?? null,

        pnl_hoy_pct:
          livePnlHoyPct !== null
            ? livePnlHoyPct
            : snapshot?.pnl_hoy_pct ?? null,

        profit_total_pct:
          liveProfitTotalPct !== null
            ? liveProfitTotalPct
            : snapshot?.profit_total_pct ?? null,

        trades_abiertos:
          liveTradesAbiertos !== null
            ? liveTradesAbiertos
            : snapshot?.trades_abiertos ?? null,

        live_status: snapshot?.live_status ?? null,
      };
    }

    return NextResponse.json({
      ok: true,
      date: today,
      data: merged,
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