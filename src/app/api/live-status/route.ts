import { NextResponse } from "next/server";

const VPS_LIVE_STATUS_URL = "http://5.134.118.153:5050/live-status";

export async function GET() {
  try {
    const res = await fetch(VPS_LIVE_STATUS_URL, {
      method: "GET",
      cache: "no-store",
    });

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

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error en /api/live-status:", error);

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}