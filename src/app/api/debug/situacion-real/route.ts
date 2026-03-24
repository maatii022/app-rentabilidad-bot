import { NextResponse } from "next/server";
import { marcarCuentaPerdida, marcarCuentaFondeada } from "@/lib/sord";

export async function POST() {
  // Trump A perdida (id 1)
  await marcarCuentaPerdida(1);

  // Fernet B fondeada (id 5)
  await marcarCuentaFondeada(5);

  return NextResponse.json({ ok: true });
}