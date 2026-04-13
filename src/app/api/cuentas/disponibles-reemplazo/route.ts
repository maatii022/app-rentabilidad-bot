import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type AccountRow = {
  id: number;
  alias: string | null;
  numero_cuenta: string | null;
  estado: string | null;
  tipo_cuenta: string | null;
  account_size: string | null;
  prop_firms?:
    | {
        nombre: string | null;
      }
    | {
        nombre: string | null;
      }[]
    | null;
  pack_slots?:
    | {
        id: number;
      }[]
    | null;
};

function resolvePropFirmNombre(
  value:
    | {
        nombre: string | null;
      }
    | {
        nombre: string | null;
      }[]
    | null
    | undefined
) {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0]?.nombre ?? null;
  }
  return value.nombre ?? null;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select(`
        id,
        alias,
        numero_cuenta,
        estado,
        tipo_cuenta,
        account_size,
        prop_firms (
          nombre
        ),
        pack_slots (
          id
        )
      `)
      .eq("estado", "activa")
      .order("alias", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as AccountRow[];

    const disponibles = rows
      .filter((account) => {
        const numeroCuenta = String(account.numero_cuenta || "").trim();
        const hasPack = Array.isArray(account.pack_slots) && account.pack_slots.length > 0;
        return Boolean(numeroCuenta) && !hasPack;
      })
      .map((account) => {
        const propFirmNombre = resolvePropFirmNombre(account.prop_firms);
        const sizeLabel = String(account.account_size || "").trim();
        const tipoLabel = String(account.tipo_cuenta || "").trim();
        const alias = String(account.alias || "Sin alias").trim();
        const numeroCuenta = String(account.numero_cuenta || "").trim();

        const meta = [tipoLabel, sizeLabel, propFirmNombre].filter(Boolean).join(" · ");

        return {
          id: account.id,
          alias,
          numero_cuenta: numeroCuenta,
          tipo_cuenta: account.tipo_cuenta ?? null,
          account_size: account.account_size ?? null,
          prop_firm_nombre: propFirmNombre,
          label: meta
            ? `${alias} · ${numeroCuenta} · ${meta}`
            : `${alias} · ${numeroCuenta}`,
        };
      });

    return NextResponse.json({
      ok: true,
      accounts: disponibles,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}