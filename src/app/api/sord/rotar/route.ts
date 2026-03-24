import { NextRequest, NextResponse } from "next/server";
import { activarSiguienteSlot } from "@/lib/sord";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packId } = body;

    const resultado = await activarSiguienteSlot(Number(packId));

    if ("error" in resultado && resultado.error) {
      return NextResponse.json(
        {
          ok: false,
          error: resultado.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      resultado,
    });
  } catch (error) {
    console.error("Error en /api/sord/rotar:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}