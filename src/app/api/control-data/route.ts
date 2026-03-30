import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const [presetsRes, propFirmsRes, assignedSlotsRes, editableAccountsRes] = await Promise.all([
      supabaseAdmin
        .from("presets")
        .select("id, nombre")
        .order("nombre", { ascending: true }),

      supabaseAdmin
        .from("prop_firms")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre", { ascending: true }),

      supabaseAdmin
        .from("pack_slots")
        .select("account_id")
        .not("account_id", "is", null),

      supabaseAdmin
        .from("accounts")
        .select(`
          id,
          alias,
          numero_cuenta,
          preset_id,
          tipo_cuenta,
          estado,
          account_size,
          prop_firm_id,
          activa_en_filtros,
          fecha_inicio,
          fecha_perdida,
          fecha_fondeo
        `)
        .order("alias", { ascending: true }),
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

    if (editableAccountsRes.error) {
      return NextResponse.json({ error: editableAccountsRes.error.message }, { status: 500 });
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
      .eq("estado", "activa")
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
      editableAccounts: editableAccountsRes.data || [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}