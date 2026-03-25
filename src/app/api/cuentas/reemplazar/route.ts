import { NextRequest, NextResponse } from "next/server";
import { reemplazarCuentaEnSlot } from "@/lib/sord";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, packId, slot, numeroCuenta, alias } = body;

    const resultado = await reemplazarCuentaEnSlot({
      slotId:
        typeof slotId === "number" && Number.isFinite(slotId) && slotId > 0
          ? slotId
          : undefined,
      packId:
        typeof packId === "number" && Number.isFinite(packId) && packId > 0
          ? packId
          : undefined,
      slot: typeof slot === "string" ? slot : undefined,
      numeroCuenta,
      alias,
    });

    console.log("Resultado reemplazo:", resultado);

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
    console.error("Error en /api/cuentas/reemplazar:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}