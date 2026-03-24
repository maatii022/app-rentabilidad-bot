import { NextRequest, NextResponse } from "next/server";
import { marcarCuentaFondeada } from "@/lib/sord";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId } = body;

    const resultado = await marcarCuentaFondeada(Number(accountId));

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
    console.error("Error en /api/cuentas/fondear:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}