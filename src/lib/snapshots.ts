import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

type AccountRow = {
  id: number;
  estado: string | null;
  baseline_balance?: number | null;
  baseline_profit_total_usd?: number | null;
  baseline_profit_total_pct?: number | null;
};

type DailyResultRow = {
  account_id: number;
  fecha: string;
  pnl_usd: number | null;
  pnl_porcentaje: number | null;
  numero_trades: number | null;
};

export async function syncDailySnapshots() {
  const today = getTodayDate();

  const { data: accounts, error: accountsError } = await supabaseAdmin
    .from("accounts")
    .select(
      "id, estado, baseline_balance, baseline_profit_total_usd, baseline_profit_total_pct"
    );

  if (accountsError) {
    throw new Error("Error cargando accounts: " + accountsError.message);
  }

  if (!accounts || accounts.length === 0) {
    return { ok: true, count: 0, message: "No hay cuentas" };
  }

  const { data: allResults, error: resultsError } = await supabaseAdmin
    .from("daily_results")
    .select("account_id, fecha, pnl_usd, pnl_porcentaje, numero_trades");

  if (resultsError) {
    throw new Error("Error cargando daily_results: " + resultsError.message);
  }

  const typedAccounts = (accounts ?? []) as AccountRow[];
  const typedResults = (allResults ?? []) as DailyResultRow[];

  const todayResultsMap = new Map<number, DailyResultRow>();
  const historicalPctMap = new Map<number, number>();

  for (const row of typedResults) {
    const accountId = row.account_id;
    const pnlPct = Number(row.pnl_porcentaje ?? 0);

    if (row.fecha === today) {
      todayResultsMap.set(accountId, row);
    }

    historicalPctMap.set(accountId, (historicalPctMap.get(accountId) ?? 0) + pnlPct);
  }

  const snapshots = typedAccounts.map((acc) => {
    const todayResult = todayResultsMap.get(acc.id);

    const pnlHoyUsd = Number(todayResult?.pnl_usd ?? 0);
    const pnlHoyPct = Number(todayResult?.pnl_porcentaje ?? 0);
    const tradesAbiertos = Number(todayResult?.numero_trades ?? 0);

    const baselineProfitTotalPct = Number(acc.baseline_profit_total_pct ?? 0);
    const dailyResultsAccumulatedPct = Number(historicalPctMap.get(acc.id) ?? 0);

    const profitTotalPct = baselineProfitTotalPct + dailyResultsAccumulatedPct;

    return {
      account_id: acc.id,
      snapshot_date: today,
      pnl_hoy_usd: pnlHoyUsd,
      pnl_hoy_pct: pnlHoyPct,
      profit_total_pct: profitTotalPct,
      trades_abiertos: tradesAbiertos,
      live_status: acc.estado ?? "inactiva",
    };
  });

  const { error: upsertError } = await supabaseAdmin
    .from("account_daily_snapshots")
    .upsert(snapshots, {
      onConflict: "account_id,snapshot_date",
    });

  if (upsertError) {
    throw new Error("Error guardando snapshots: " + upsertError.message);
  }

  return {
    ok: true,
    count: snapshots.length,
  };
}