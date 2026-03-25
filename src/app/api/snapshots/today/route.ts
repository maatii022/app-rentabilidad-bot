import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

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

export async function GET() {
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

    const numeroCuentaById = new Map<number, string>();

    for (const account of typedAccounts) {
      if (account.numero_cuenta) {
        numeroCuentaById.set(account.id, account.numero_cuenta);
      }
    }

    const data: Record<
      string,
      {
        pnl_hoy_usd: number | null;
        pnl_hoy_pct: number | null;
        profit_total_pct: number | null;
        trades_abiertos: number | null;
        live_status: string | null;
      }
    > = {};

    for (const snapshot of typedSnapshots) {
      const numeroCuenta = numeroCuentaById.get(snapshot.account_id);

      if (!numeroCuenta) continue;

      data[numeroCuenta] = {
        pnl_hoy_usd: snapshot.pnl_hoy_usd,
        pnl_hoy_pct: snapshot.pnl_hoy_pct,
        profit_total_pct: snapshot.profit_total_pct,
        trades_abiertos: snapshot.trades_abiertos,
        live_status: snapshot.live_status,
      };
    }

    return NextResponse.json({
      ok: true,
      date: today,
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