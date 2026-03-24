import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const accountId = Number(body.accountId);
    const fecha = String(body.fecha || "").trim();
    const pnlUsd = Number(body.pnlUsd);
    const pnlPorcentaje = Number(body.pnlPorcentaje);
    const numeroTrades = Number(body.numeroTrades || 0);
    const notas = String(body.notas || "").trim();

    if (!accountId || !fecha || Number.isNaN(pnlUsd) || Number.isNaN(pnlPorcentaje)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan campos obligatorios o hay valores no válidos",
        },
        { status: 400 }
      );
    }

    const redDay = pnlPorcentaje < -0.2;

    const { data: existente, error: errorExistente } = await supabase
      .from("daily_results")
      .select("id")
      .eq("account_id", accountId)
      .eq("fecha", fecha)
      .maybeSingle();

    if (errorExistente) {
      return NextResponse.json(
        {
          ok: false,
          error: errorExistente.message,
        },
        { status: 500 }
      );
    }

    if (existente?.id) {
      const { error: errorUpdate } = await supabase
        .from("daily_results")
        .update({
          pnl_usd: pnlUsd,
          pnl_porcentaje: pnlPorcentaje,
          numero_trades: numeroTrades,
          notas,
          red_day: redDay,
        })
        .eq("id", existente.id);

      if (errorUpdate) {
        return NextResponse.json(
          {
            ok: false,
            error: errorUpdate.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        modo: "update",
        mensaje: "Daily result actualizado correctamente",
        redDay,
      });
    }

    const { error: errorInsert } = await supabase.from("daily_results").insert({
      account_id: accountId,
      fecha,
      pnl_usd: pnlUsd,
      pnl_porcentaje: pnlPorcentaje,
      numero_trades: numeroTrades,
      notas,
      red_day: redDay,
    });

    if (errorInsert) {
      return NextResponse.json(
        {
          ok: false,
          error: errorInsert.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      modo: "insert",
      mensaje: "Daily result creado correctamente",
      redDay,
    });
  } catch (error) {
    console.error("Error en /api/daily-results/crear:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}