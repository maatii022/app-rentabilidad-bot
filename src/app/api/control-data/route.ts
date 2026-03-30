import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const [presetsRes, propFirmsRes, assignedSlotsRes] = await Promise.all([
      supabaseAdmin
        .from("presets")
        .select("id, nombre")
        .order("nombre", { ascending: true }),

      supabaseAdmin
        .from("prop_firms")
        .select("id, nombre")
        .order("nombre", { ascending: true }),

      supabaseAdmin
        .from("pack_slots")
        .select("account_id")
        .not("account_id", "is", null),
    ]);

    if (presetsRes.error) {
      return NextResponse.json({ error: presetsRes.error.message }, { status: 500 });
    }

    if (propFirmsRes.error) {
      return NextResponse.json({ error: propFirmsRes.error.message }, { status: 500 });
    }

    if (assignedSlotsRes.error) {
      return NextResponse.json({ error: assignedSlotsRes.error.message }, { status: 500 });
    }

    const assignedAccountIds = Array.from(
      new Set(
        (assignedSlotsRes.data || [])
          .map((row) => row.account_id)
          .filter((value): value is number => typeof value === "number")
      )
    );

    let accountsQuery = supabaseAdmin
      .from("accounts")
      .select("id, alias, numero_cuenta, preset_id, tipo_cuenta, estado")
      .order("alias", { ascending: true });

    if (assignedAccountIds.length > 0) {
      accountsQuery = accountsQuery.not("id", "in", `(${assignedAccountIds.join(",")})`);
    }

    const availableAccountsRes = await accountsQuery;

    if (availableAccountsRes.error) {
      return NextResponse.json(
        { error: availableAccountsRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      presets: presetsRes.data || [],
      propFirms: propFirmsRes.data || [],
      availableAccounts: availableAccountsRes.data || [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}