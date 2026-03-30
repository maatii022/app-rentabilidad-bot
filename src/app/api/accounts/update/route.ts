import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      accountId,
      alias,
      numeroCuenta,
      presetId,
      tipoCuenta,
      estado,
      accountSize,
      propFirmId,
      activaEnFiltros,
    } = body;

    if (!accountId || !Number.isFinite(Number(accountId))) {
      return NextResponse.json({ error: "Cuenta no válida." }, { status: 400 });
    }

    if (!alias || !String(alias).trim()) {
      return NextResponse.json({ error: "El alias es obligatorio." }, { status: 400 });
    }

    if (!numeroCuenta || !String(numeroCuenta).trim()) {
      return NextResponse.json(
        { error: "El número de cuenta es obligatorio." },
        { status: 400 }
      );
    }

    if (!presetId || !Number.isFinite(Number(presetId))) {
      return NextResponse.json({ error: "El preset es obligatorio." }, { status: 400 });
    }

    if (tipoCuenta !== "prueba" && tipoCuenta !== "fondeada") {
      return NextResponse.json(
        { error: "El tipo de cuenta no es válido." },
        { status: 400 }
      );
    }

    if (!["activa", "fondeada", "perdida"].includes(String(estado))) {
      return NextResponse.json(
        { error: "El estado no es válido." },
        { status: 400 }
      );
    }

    const { data: currentAccount, error: currentError } = await supabaseAdmin
      .from("accounts")
      .select("fecha_fondeo, fecha_perdida")
      .eq("id", Number(accountId))
      .single();

    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }

    const patch: Record<string, unknown> = {
      alias: String(alias).trim(),
      numero_cuenta: String(numeroCuenta).trim(),
      preset_id: Number(presetId),
      tipo_cuenta: tipoCuenta,
      estado,
      account_size: accountSize || null,
      prop_firm_id: propFirmId ? Number(propFirmId) : null,
      activa_en_filtros: Boolean(activaEnFiltros),
    };

    if (estado === "fondeada" && !currentAccount?.fecha_fondeo) {
      patch.fecha_fondeo = todayDate();
    }

    if (estado === "perdida" && !currentAccount?.fecha_perdida) {
      patch.fecha_perdida = todayDate();
    }

    const { data, error } = await supabaseAdmin
      .from("accounts")
      .update(patch)
      .eq("id", Number(accountId))
      .select(`
        id,
        alias,
        numero_cuenta,
        preset_id,
        tipo_cuenta,
        estado,
        account_size,
        prop_firm_id,
        activa_en_filtros,
        fecha_inicio,
        fecha_perdida,
        fecha_fondeo
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      account: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}