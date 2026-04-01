import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type AccountRow = {
  id: number;
  alias: string | null;
  numero_cuenta: string | null;
  preset_id: number | null;
  tipo_cuenta: string | null;
};

type DailyResultRow = {
  id: number;
  account_id: number;
  fecha: string;
  pnl_usd: number | null;
  pnl_porcentaje: number | null;
  numero_trades: number | null;
  red_day: boolean | null;
};

type AccountEventRow = {
  id: number;
  account_id: number;
  fecha: string;
  tipo_evento: string | null;
  descripcion: string | null;
};

type TradeLogCountRow = {
  account_id: number;
  business_date: string;
};

type DayBucket = {
  fecha: string;
  pnl_usd: number;
  pnl_pct: number;
  trades: number;
  red_day: boolean;
  results: Array<{
    id: number;
    account_id: number;
    alias: string;
    numero_cuenta: string;
    pnl_usd: number;
    pnl_pct: number;
    red_day: boolean;
    numero_trades: number;
  }>;
  events: {
    perdida: number;
    fondeada: number;
    reemplazo: number;
    sord_in: number;
    sord_out: number;
    otros: number;
    items: Array<{
      id: number;
      tipo: string;
      descripcion: string | null;
      account_id: number;
      alias: string;
      numero_cuenta: string;
    }>;
  };
};

function toNumber(value: unknown) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return 0;
}

function normalizeEventType(value: string | null | undefined) {
  const tipo = String(value || "").trim().toLowerCase();

  if (tipo === "perdida") return "perdida";
  if (tipo === "fondeada") return "fondeada";
  if (tipo === "reemplazo asignado") return "reemplazo";
  if (tipo === "sord in") return "sord_in";
  if (tipo === "sord out") return "sord_out";

  return "otros";
}

function getDateRange(year: number | null, month: number | null) {
  if (!year) return null;

  if (!month) {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    };
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);

  return { from, to };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const preset = searchParams.get("preset") ?? "todos";
    const tipo = searchParams.get("tipo") ?? "todos";

    const yearRaw = searchParams.get("year");
    const monthRaw = searchParams.get("month");

    const year = yearRaw ? Number(yearRaw) : null;
    const month = monthRaw ? Number(monthRaw) : null;

    if (yearRaw && (!Number.isFinite(year) || year < 2000 || year > 2100)) {
      return NextResponse.json(
        { ok: false, error: "Parámetro year inválido" },
        { status: 400 }
      );
    }

    if (monthRaw && (!Number.isFinite(month) || month < 1 || month > 12)) {
      return NextResponse.json(
        { ok: false, error: "Parámetro month inválido" },
        { status: 400 }
      );
    }

    let presetId: number | null = null;

    if (preset !== "todos") {
      const { data: presetData, error: presetError } = await supabaseAdmin
        .from("presets")
        .select("id")
        .eq("nombre", preset)
        .single();

      if (presetError || !presetData) {
        return NextResponse.json({
          ok: true,
          filters: { preset, tipo, year, month },
          days: [],
          byDate: {},
        });
      }

      presetId = presetData.id;
    }

    let accountsQuery = supabaseAdmin
      .from("accounts")
      .select("id, alias, numero_cuenta, preset_id, tipo_cuenta");

    if (presetId !== null) {
      accountsQuery = accountsQuery.eq("preset_id", presetId);
    }

    if (tipo !== "todos") {
      accountsQuery = accountsQuery.eq("tipo_cuenta", tipo);
    }

    const { data: accountsData, error: accountsError } = await accountsQuery;

    if (accountsError) {
      return NextResponse.json(
        { ok: false, error: accountsError.message },
        { status: 500 }
      );
    }

    const accounts = (accountsData ?? []) as AccountRow[];
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return NextResponse.json({
        ok: true,
        filters: { preset, tipo, year, month },
        days: [],
        byDate: {},
      });
    }

    const accountMap = new Map<number, AccountRow>();
    accounts.forEach((account) => {
      accountMap.set(account.id, account);
    });

    const range = getDateRange(year, month);

    let dailyResultsQuery = supabaseAdmin
      .from("daily_results")
      .select("id, account_id, fecha, pnl_usd, pnl_porcentaje, numero_trades, red_day")
      .in("account_id", accountIds)
      .order("fecha", { ascending: true });

    let accountEventsQuery = supabaseAdmin
      .from("account_events")
      .select("id, account_id, fecha, tipo_evento, descripcion")
      .in("account_id", accountIds)
      .order("fecha", { ascending: true });

    let tradeCountsQuery = supabaseAdmin
      .from("trade_log_view")
      .select("account_id, business_date")
      .in("account_id", accountIds);

    if (range) {
      dailyResultsQuery = dailyResultsQuery.gte("fecha", range.from).lte("fecha", range.to);
      accountEventsQuery = accountEventsQuery.gte("fecha", range.from).lte("fecha", range.to);
      tradeCountsQuery = tradeCountsQuery
        .gte("business_date", range.from)
        .lte("business_date", range.to);
    }

    const [
      { data: dailyResultsData, error: dailyResultsError },
      { data: accountEventsData, error: accountEventsError },
      { data: tradeCountsData, error: tradeCountsError },
    ] = await Promise.all([
      dailyResultsQuery,
      accountEventsQuery,
      tradeCountsQuery,
    ]);

    if (dailyResultsError) {
      return NextResponse.json(
        { ok: false, error: dailyResultsError.message },
        { status: 500 }
      );
    }

    if (accountEventsError) {
      return NextResponse.json(
        { ok: false, error: accountEventsError.message },
        { status: 500 }
      );
    }

    if (tradeCountsError) {
      return NextResponse.json(
        { ok: false, error: tradeCountsError.message },
        { status: 500 }
      );
    }

    const dailyResults = (dailyResultsData ?? []) as DailyResultRow[];
    const accountEvents = (accountEventsData ?? []) as AccountEventRow[];
    const tradeCounts = (tradeCountsData ?? []) as TradeLogCountRow[];

    const tradesByDateAndAccount = new Map<string, number>();

    for (const trade of tradeCounts) {
      const key = `${trade.business_date}__${trade.account_id}`;
      tradesByDateAndAccount.set(key, (tradesByDateAndAccount.get(key) ?? 0) + 1);
    }

    const byDate: Record<string, DayBucket> = {};

    for (const row of dailyResults) {
      const fecha = row.fecha;
      const account = accountMap.get(row.account_id);

      if (!byDate[fecha]) {
        byDate[fecha] = {
          fecha,
          pnl_usd: 0,
          pnl_pct: 0,
          trades: 0,
          red_day: false,
          results: [],
          events: {
            perdida: 0,
            fondeada: 0,
            reemplazo: 0,
            sord_in: 0,
            sord_out: 0,
            otros: 0,
            items: [],
          },
        };
      }

      const tradeKey = `${fecha}__${row.account_id}`;
      const realTradeCount = tradesByDateAndAccount.get(tradeKey) ?? 0;

      byDate[fecha].pnl_usd += toNumber(row.pnl_usd);
      byDate[fecha].pnl_pct += toNumber(row.pnl_porcentaje);
      byDate[fecha].trades += realTradeCount;

      if (row.red_day === true) {
        byDate[fecha].red_day = true;
      }

      byDate[fecha].results.push({
        id: row.id,
        account_id: row.account_id,
        alias: account?.alias ?? "-",
        numero_cuenta: account?.numero_cuenta ?? "-",
        pnl_usd: toNumber(row.pnl_usd),
        pnl_pct: toNumber(row.pnl_porcentaje),
        red_day: row.red_day === true,
        numero_trades: realTradeCount,
      });
    }

    for (const event of accountEvents) {
      const fecha = event.fecha;
      const tipoNormalizado = normalizeEventType(event.tipo_evento);
      const account = accountMap.get(event.account_id);

      if (!byDate[fecha]) {
        byDate[fecha] = {
          fecha,
          pnl_usd: 0,
          pnl_pct: 0,
          trades: 0,
          red_day: false,
          results: [],
          events: {
            perdida: 0,
            fondeada: 0,
            reemplazo: 0,
            sord_in: 0,
            sord_out: 0,
            otros: 0,
            items: [],
          },
        };
      }

      byDate[fecha].events[tipoNormalizado] += 1;
      byDate[fecha].events.items.push({
        id: event.id,
        tipo: event.tipo_evento ?? "otros",
        descripcion: event.descripcion ?? null,
        account_id: event.account_id,
        alias: account?.alias ?? "-",
        numero_cuenta: account?.numero_cuenta ?? "-",
      });
    }

    const days = Object.values(byDate)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((day) => ({
        ...day,
        pnl_usd: Number(day.pnl_usd.toFixed(2)),
        pnl_pct: Number(day.pnl_pct.toFixed(4)),
        results: [...day.results].sort((a, b) => a.alias.localeCompare(b.alias)),
        events: {
          ...day.events,
          items: [...day.events.items].sort((a, b) => a.tipo.localeCompare(b.tipo)),
        },
      }));

    return NextResponse.json({
      ok: true,
      filters: {
        preset,
        tipo,
        year,
        month,
      },
      days,
      byDate,
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