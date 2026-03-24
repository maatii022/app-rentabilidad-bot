import { NextRequest, NextResponse } from "next/server";
import { evaluarSORD } from "@/lib/sord";
import { getBusinessDate } from "@/lib/business-date";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packId } = body;

    const fechaNegocio = getBusinessDate();
    const resultado = await evaluarSORD(Number(packId), fechaNegocio);

    if ("error" in resultado && resultado.error) {
      return NextResponse.json(
        {
          ok: false,
          error: resultado.error,
          fechaEvaluada: fechaNegocio,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      resultado,
      fechaEvaluada: fechaNegocio,
    });
  } catch (error) {
    console.error("Error en /api/sord/evaluar:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}