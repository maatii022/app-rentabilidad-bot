import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();

  const { alias, numeroCuenta, presetId, tipoCuenta, accountSize, propFirmId } = body;

  const { error } = await supabaseAdmin.from("accounts").insert({
    alias,
    numero_cuenta: numeroCuenta,
    preset_id: Number(presetId),
    tipo_cuenta: tipoCuenta,
    estado: "activa",
    account_size: accountSize,
    prop_firm_id: propFirmId ? Number(propFirmId) : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}