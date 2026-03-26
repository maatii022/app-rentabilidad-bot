import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type AccountRow = {
  id: number;
  numero_cuenta: string | null;
  estado: string | null;
  baseline_profit_total_pct: number | null;
};

type DailyResultRow = {
  account_id: number;
  fecha: string | null;
  pnl_porcentaje: number | null;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const today = getTodayDate();

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("accounts")
      .select("id, numero_cuenta, estado, baseline_profit_total_pct");

    if (accountsError) {
      return NextResponse.json(
        { ok: false, error: accountsError.message },
        { status: 500 }
      );
    }

    const { data: dailyResults, error: resultsError } = await supabaseAdmin
      .from("daily_results")
      .select("account_id, fecha, pnl_porcentaje");

    if (resultsError) {
      return NextResponse.json(
        { ok: false, error: resultsError.message },
        { status: 500 }
      );
    }

    const typedAccounts = (accounts ?? []) as AccountRow[];
    const typedResults = (dailyResults ?? []) as DailyResultRow[];

    const totalPctMap = new Map<number, number>();
    const todayPctMap = new Map<number, number>();

    for (const row of typedResults) {
      const accountId = row.account_id;
      const pnlPct = Number(row.pnl_porcentaje ?? 0);

      totalPctMap.set(accountId, (totalPctMap.get(accountId) ?? 0) + pnlPct);

      if (row.fecha === today) {
        todayPctMap.set(accountId, (todayPctMap.get(accountId) ?? 0) + pnlPct);
      }
    }

    const data: Record<
      string,
      {
        total_pct: number;
        today_pct: number;
        live_status: string | null;
      }
    > = {};

    for (const account of typedAccounts) {
      if (!account.numero_cuenta) continue;

      const baselinePct = Number(account.baseline_profit_total_pct ?? 0);
      const dailyTotalPct = Number(totalPctMap.get(account.id) ?? 0);
      const todayPct = Number(todayPctMap.get(account.id) ?? 0);

      data[account.numero_cuenta] = {
        total_pct: baselinePct + dailyTotalPct,
        today_pct: todayPct,
        live_status: account.estado ?? null,
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
      { ok: false, error: message },
      { status: 500 }
    );
  }
}