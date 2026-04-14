import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accountId = Number(body?.accountId);

    if (!Number.isFinite(accountId) || accountId <= 0) {
      return NextResponse.json(
        { ok: false, error: "accountId inválido" },
        { status: 400 }
      );
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from("accounts")
      .select("id, alias, numero_cuenta")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { ok: false, error: "No se encontró la cuenta" },
        { status: 404 }
      );
    }

    const { data: slots, error: slotsError } = await supabaseAdmin
      .from("pack_slots")
      .select("id, pack_id, slot")
      .eq("account_id", accountId);

    if (slotsError) {
      return NextResponse.json(
        { ok: false, error: slotsError.message },
        { status: 500 }
      );
    }

    if ((slots ?? []).length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No puedes eliminar una cuenta que sigue asignada a un pack",
        },
        { status: 400 }
      );
    }

    const { error: deleteEventsError } = await supabaseAdmin
      .from("account_events")
      .delete()
      .eq("account_id", accountId);

    if (deleteEventsError) {
      return NextResponse.json(
        { ok: false, error: deleteEventsError.message },
        { status: 500 }
      );
    }

    const { error: deleteDailyResultsError } = await supabaseAdmin
      .from("daily_results")
      .delete()
      .eq("account_id", accountId);

    if (deleteDailyResultsError) {
      return NextResponse.json(
        { ok: false, error: deleteDailyResultsError.message },
        { status: 500 }
      );
    }

    const { error: deleteTradeLogError } = await supabaseAdmin
      .from("trade_log")
      .delete()
      .eq("account_id", accountId);

    if (deleteTradeLogError) {
      return NextResponse.json(
        { ok: false, error: deleteTradeLogError.message },
        { status: 500 }
      );
    }

    const { error: deleteAccountError } = await supabaseAdmin
      .from("accounts")
      .delete()
      .eq("id", accountId);

    if (deleteAccountError) {
      return NextResponse.json(
        { ok: false, error: deleteAccountError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Cuenta eliminada correctamente: ${account.alias || "Sin alias"} · ${account.numero_cuenta || "-"}`,
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