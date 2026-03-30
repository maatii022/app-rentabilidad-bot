import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const [presets, propFirms, availableAccounts] = await Promise.all([
    supabaseAdmin.from("presets").select("id, nombre").order("nombre", { ascending: true }),
    supabaseAdmin.from("prop_firms").select("id, nombre").order("nombre", { ascending: true }),
    supabaseAdmin
      .from("accounts")
      .select("id, alias, numero_cuenta, preset_id, tipo_cuenta, estado")
      .not("id", "in", `(${
        (
          await supabaseAdmin
            .from("pack_slots")
            .select("account_id")
            .not("account_id", "is", null)
        ).data || []
      )
        .map((row) => row.account_id)
        .filter(Boolean)
        .join(",") || "0"})`)
      .order("alias", { ascending: true }),
  ]);

  return NextResponse.json({
    presets: presets.data || [],
    propFirms: propFirms.data || [],
    availableAccounts: availableAccounts.data || [],
  });
}