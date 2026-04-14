import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("packs")
    .select(`
      id,
      nombre,
      tipo_pack,
      preset_id,
      presets (
        nombre
      ),
      pack_slots (
        id,
        slot,
        es_activa,
        pendiente_reemplazo,
        orden,
        account_id,
        accounts (
          id,
          alias,
          numero_cuenta,
          estado,
          tipo_cuenta,
          account_size
        )
      )
    `)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    packs: data || [],
  });
}