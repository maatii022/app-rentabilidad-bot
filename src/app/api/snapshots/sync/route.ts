import { NextResponse } from "next/server";
import { syncDailySnapshots } from "@/lib/snapshots";

export async function POST() {
  try {
    const result = await syncDailySnapshots();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}