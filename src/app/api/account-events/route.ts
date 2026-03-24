import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
  .from("account_events")
  .select(`
    id,
    fecha,
    tipo_evento,
    descripcion,
    accounts (
      alias,
      numero_cuenta
    )
  `)
  .order("id", { ascending: false })
  .limit(10);

  if (error) {
    console.error("Error leyendo account_events:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ events: data });
}