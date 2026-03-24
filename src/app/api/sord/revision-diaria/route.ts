import { NextRequest, NextResponse } from "next/server";
import { evaluarTodosLosPacksDelDia } from "@/lib/sord";
import { getBusinessDate } from "@/lib/business-date";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const fecha = body?.fecha || getBusinessDate();
    const resultados = await evaluarTodosLosPacksDelDia(fecha);

    return NextResponse.json({
      ok: true,
      fecha,
      resultados,
    });
  } catch (error) {
    console.error("Error en /api/sord/revision-diaria:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}