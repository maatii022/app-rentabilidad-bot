import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("packs")
    .select(`
      id,
      nombre,
      tipo_pack,
      presets (
        nombre
      ),
      pack_slots (
        id,
        slot,
        es_activa,
        pendiente_reemplazo,
        orden,
        accounts (
  id,
  alias,
  numero_cuenta,
  estado,
  tipo_cuenta,
  account_size,
  prop_firms (
    nombre
  )
)
    `)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packs: data });
}