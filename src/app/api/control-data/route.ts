import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const [presets, propFirms] = await Promise.all([
    supabaseAdmin.from("presets").select("id, nombre"),
    supabaseAdmin.from("prop_firms").select("id, nombre"),
  ]);

  return NextResponse.json({
    presets: presets.data || [],
    propFirms: propFirms.data || [],
  });
}