import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { alias, numeroCuenta, presetId, tipoCuenta, accountSize, propFirmId } = body;

    if (!alias || !String(alias).trim()) {
      return NextResponse.json(
        { error: "El alias es obligatorio." },
        { status: 400 }
      );
    }

    if (!numeroCuenta || !String(numeroCuenta).trim()) {
      return NextResponse.json(
        { error: "El número de cuenta es obligatorio." },
        { status: 400 }
      );
    }

    if (!presetId) {
      return NextResponse.json(
        { error: "El preset es obligatorio." },
        { status: 400 }
      );
    }

    if (tipoCuenta !== "prueba" && tipoCuenta !== "fondeada") {
      return NextResponse.json(
        { error: "El tipo de cuenta no es válido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("accounts")
      .insert({
        alias: String(alias).trim(),
        numero_cuenta: String(numeroCuenta).trim(),
        preset_id: Number(presetId),
        tipo_cuenta: tipoCuenta,
        estado: "activa",
        account_size: accountSize,
        prop_firm_id: propFirmId ? Number(propFirmId) : null,
        activa_en_filtros: true,
      })
      .select("id, alias, numero_cuenta, preset_id, tipo_cuenta, estado")
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