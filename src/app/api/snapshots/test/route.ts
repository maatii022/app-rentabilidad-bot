import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      account_id,
      snapshot_date,
      pnl_hoy_usd = 0,
      pnl_hoy_pct = 0,
      profit_total_pct = 0,
      trades_abiertos = 0,
      live_status = "activa",
    } = body ?? {};

    if (!account_id) {
      return NextResponse.json(
        { ok: false, error: "Falta account_id" },
        { status: 400 }
      );
    }

    if (!snapshot_date) {
      return NextResponse.json(
        { ok: false, error: "Falta snapshot_date" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("account_daily_snapshots")
      .upsert(
        [
          {
            account_id,
            snapshot_date,
            pnl_hoy_usd,
            pnl_hoy_pct,
            profit_total_pct,
            trades_abiertos,
            live_status,
          },
        ],
        {
          onConflict: "account_id,snapshot_date",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      snapshot: data,
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