import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type TradeLogViewRow = {
  id: number;
  account_id: number;
  preset_id: number | null;
  numero_cuenta: string;
  alias: string | null;
  magic: number | null;
  ticket: number;
  position_id: number;
  symbol: string;
  side: "buy" | "sell";
  entry_time: string;
  exit_time: string;
  business_date: string;
  entry_price: number | null;
  exit_price: number | null;
  sl_price: number | null;
  tp_price: number | null;
  close_reason: "tp" | "sl" | "fin_dia" | "manual" | "unknown";
  pnl_usd: number;
  pnl_pct: number;
  commission: number;
  swap: number;
  volume: number;
  source: "sync" | "historical_import" | "manual";
  created_at: string;
  updated_at: string;
  preset_nombre: string | null;
  tipo_cuenta: string | null;
  account_size: string | null;
  prop_firm_nombre: string | null;
};

function toNumber(value: unknown) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return 0;
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const presetId = searchParams.get("presetId") || "";
    const accountId = searchParams.get("accountId") || "";
    const symbol = searchParams.get("symbol") || "";
    const closeReason = searchParams.get("closeReason") || "";
    const tipoCuenta = searchParams.get("tipoCuenta") || "";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 100);

    let baseQuery = supabaseAdmin
      .from("trade_log_view")
      .select("*", { count: "exact" })
      .order("exit_time", { ascending: false });

    if (from) {
      baseQuery = baseQuery.gte("business_date", from);
    }

    if (to) {
      baseQuery = baseQuery.lte("business_date", to);
    }

    if (presetId) {
      baseQuery = baseQuery.eq("preset_id", Number(presetId));
    }

    if (accountId) {
      baseQuery = baseQuery.eq("account_id", Number(accountId));
    }

    if (symbol) {
      baseQuery = baseQuery.eq("symbol", symbol);
    }

    if (closeReason) {
      baseQuery = baseQuery.eq("close_reason", closeReason);
    }

    if (tipoCuenta) {
      baseQuery = baseQuery.eq("tipo_cuenta", tipoCuenta);
    }

    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    const { data, error, count } = await baseQuery.range(fromIndex, toIndex);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as TradeLogViewRow[];

    let statsQuery = supabaseAdmin
      .from("trade_log_view")
      .select("id, pnl_usd, close_reason");

    if (from) {
      statsQuery = statsQuery.gte("business_date", from);
    }

    if (to) {
      statsQuery = statsQuery.lte("business_date", to);
    }

    if (presetId) {
      statsQuery = statsQuery.eq("preset_id", Number(presetId));
    }

    if (accountId) {
      statsQuery = statsQuery.eq("account_id", Number(accountId));
    }

    if (symbol) {
      statsQuery = statsQuery.eq("symbol", symbol);
    }

    if (closeReason) {
      statsQuery = statsQuery.eq("close_reason", closeReason);
    }

    if (tipoCuenta) {
      statsQuery = statsQuery.eq("tipo_cuenta", tipoCuenta);
    }

    const { data: statsData, error: statsError } = await statsQuery.limit(5000);

    if (statsError) {
      return NextResponse.json(
        { ok: false, error: statsError.message },
        { status: 500 }
      );
    }

    const statRows = (statsData ?? []) as Array<{
      id: number;
      pnl_usd: number;
      close_reason: string;
    }>;

    const wins = statRows.filter((row) => toNumber(row.pnl_usd) > 0).length;
    const losses = statRows.filter((row) => toNumber(row.pnl_usd) < 0).length;
    const breakeven = statRows.filter((row) => toNumber(row.pnl_usd) === 0).length;
    const totalTrades = statRows.length;
    const pnlTotal = statRows.reduce((acc, row) => acc + toNumber(row.pnl_usd), 0);

    const grossProfit = statRows
      .filter((row) => toNumber(row.pnl_usd) > 0)
      .reduce((acc, row) => acc + toNumber(row.pnl_usd), 0);

    const grossLoss = Math.abs(
      statRows
        .filter((row) => toNumber(row.pnl_usd) < 0)
        .reduce((acc, row) => acc + toNumber(row.pnl_usd), 0)
    );

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

    const { data: optionsData, error: optionsError } = await supabaseAdmin
      .from("trade_log_view")
      .select("preset_id, preset_nombre, account_id, alias, numero_cuenta, symbol")
      .order("exit_time", { ascending: false })
      .limit(5000);

    if (optionsError) {
      return NextResponse.json(
        { ok: false, error: optionsError.message },
        { status: 500 }
      );
    }

    const optionRows = (optionsData ?? []) as Array<{
      preset_id: number | null;
      preset_nombre: string | null;
      account_id: number;
      alias: string | null;
      numero_cuenta: string;
      symbol: string;
    }>;

    const presetMap = new Map<number, { id: number; nombre: string }>();
    const accountMap = new Map<number, { id: number; label: string }>();
    const symbolSet = new Set<string>();

    optionRows.forEach((row) => {
      if (typeof row.preset_id === "number" && row.preset_nombre) {
        presetMap.set(row.preset_id, {
          id: row.preset_id,
          nombre: row.preset_nombre,
        });
      }

      if (typeof row.account_id === "number") {
        accountMap.set(row.account_id, {
          id: row.account_id,
          label: `${row.alias || "Sin alias"} · ${row.numero_cuenta}`,
        });
      }

      if (row.symbol) {
        symbolSet.add(row.symbol);
      }
    });

    return NextResponse.json({
      ok: true,
      trades: rows,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      },
      stats: {
        totalTrades,
        wins,
        losses,
        breakeven,
        winRate: Number(winRate.toFixed(2)),
        pnlTotal: Number(pnlTotal.toFixed(2)),
        profitFactor: profitFactor === null ? null : Number(profitFactor.toFixed(2)),
      },
      options: {
        presets: Array.from(presetMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)),
        accounts: Array.from(accountMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
        symbols: Array.from(symbolSet).sort((a, b) => a.localeCompare(b)),
      },
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