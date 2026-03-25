import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS_LIVE_STATUS_URL = "http://5.134.118.153:5050/live-status";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(VPS_LIVE_STATUS_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Error consultando VPS: HTTP ${res.status}`,
        },
        { status: 500 }
      );
    }

    const data = await res.json();

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    clearTimeout(timeout);

    const message =
      error instanceof Error ? error.message : "Error desconocido en live-status";

    console.error("Error en /api/live-status:", message);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}