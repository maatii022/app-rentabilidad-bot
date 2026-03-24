import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function estaEnPeriodo(
  fecha: string | null,
  modo: string,
  anio?: number | null,
  mes?: number | null
): boolean {
  if (!fecha) return false;
  if (modo === "todo") return true;

  const d = new Date(fecha);

  if (modo === "anio") {
    if (!anio) return false;
    return d.getFullYear() === anio;
  }

  if (modo === "mes") {
    if (!anio || !mes) return false;
    return d.getFullYear() === anio && d.getMonth() + 1 === mes;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const modo = searchParams.get("modo") ?? "todo";
  const preset = searchParams.get("preset") ?? "todos";
  const tipo = searchParams.get("tipo") ?? "todos";

  const anioRaw = searchParams.get("anio");
  const mesRaw = searchParams.get("mes");

  const anio = anioRaw ? Number(anioRaw) : null;
  const mes = mesRaw ? Number(mesRaw) : null;

  let presetId: number | null = null;

  if (preset !== "todos") {
    const { data: presetData, error: presetError } = await supabase
      .from("presets")
      .select("id")
      .eq("nombre", preset)
      .single();

    if (presetError || !presetData) {
      return NextResponse.json({
        fondeadasHistoricas: 0,
        perdidasHistoricas: 0,
      });
    }

    presetId = presetData.id;
  }

  let query = supabase
    .from("accounts")
    .select("estado, fecha_fondeo, fecha_perdida, preset_id, tipo_cuenta");

  if (presetId !== null) {
    query = query.eq("preset_id", presetId);
  }

  if (tipo !== "todos") {
    query = query.eq("tipo_cuenta", tipo);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const fondeadasHistoricas =
    data?.filter(
      (cuenta) =>
        cuenta.estado === "fondeada" &&
        estaEnPeriodo(cuenta.fecha_fondeo, modo, anio, mes)
    ).length ?? 0;

  const perdidasHistoricas =
    data?.filter(
      (cuenta) =>
        cuenta.estado === "perdida" &&
        estaEnPeriodo(cuenta.fecha_perdida, modo, anio, mes)
    ).length ?? 0;

  return NextResponse.json({
    fondeadasHistoricas,
    perdidasHistoricas,
  });
}