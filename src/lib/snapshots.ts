import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function syncDailySnapshots() {
  const today = getTodayDate();

  // 1. Cargar cuentas
  const { data: accounts, error: accountsError } = await supabaseAdmin
    .from("accounts")
    .select("*");

  if (accountsError) {
    throw new Error("Error cargando accounts: " + accountsError.message);
  }

  if (!accounts || accounts.length === 0) {
    return { ok: true, message: "No hay cuentas" };
  }

  // 2. Cargar resultados del día
  const { data: results, error: resultsError } = await supabaseAdmin
    .from("daily_results")
    .select("*")
    .eq("fecha", today);

  if (resultsError) {
    throw new Error("Error cargando daily_results: " + resultsError.message);
  }

  // Crear mapa por account_id
  const resultsMap = new Map<number, any>();

  for (const r of results ?? []) {
    resultsMap.set(r.account_id, r);
  }

  const snapshots = [];

  for (const acc of accounts) {
    const result = resultsMap.get(acc.id);

    const pnlUsd = result?.pnl_usd ?? 0;
    const pnlPct = result?.pnl_porcentaje ?? 0;
    const trades = result?.numero_trades ?? 0;

    // live_status basado en estado actual
    let liveStatus = acc.estado ?? "inactiva";

    snapshots.push({
      account_id: acc.id,
      snapshot_date: today,
      pnl_hoy_usd: pnlUsd,
      pnl_hoy_pct: pnlPct,
      profit_total_pct: pnlPct, // provisional
      trades_abiertos: trades,
      live_status: liveStatus,
    });
  }

  // 3. Guardar en batch con upsert
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