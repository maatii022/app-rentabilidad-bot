import { supabase } from "@/lib/supabase";
import PresetsClient from "./PresetsClient";

export type Preset = {
  id: number;
  nombre: string;
  activo: boolean | null;
};

export type Pack = {
  id: number;
  preset_id: number | null;
  nombre: string | null;
};

export type AccountRow = {
  id: number;
  preset_id: number | null;
  numero_cuenta: string | null;
  alias: string | null;
  tipo_cuenta: string | null;
  estado: string | null;
  activa_en_filtros: boolean | null;
  pack_slots?:
    | {
        pack_id: number;
        packs:
          | {
              id: number;
              nombre: string | null;
            }
          | {
              id: number;
              nombre: string | null;
            }[]
          | null;
      }[]
    | null;
};

export type TradeLogMetricRow = {
  account_id: number;
  preset_id: number | null;
  pnl_usd: number | null;
};

export default async function EstadisticasPage() {
  const [presetsResponse, packsResponse, accountsResponse, tradeLogResponse] =
    await Promise.all([
      supabase
        .from("presets")
        .select("id, nombre, activo")
        .eq("activo", true)
        .order("nombre", { ascending: true }),

      supabase
        .from("packs")
        .select("id, preset_id, nombre")
        .order("nombre", { ascending: true }),

      supabase
        .from("accounts")
        .select(`
          id,
          preset_id,
          numero_cuenta,
          alias,
          tipo_cuenta,
          estado,
          activa_en_filtros,
          pack_slots (
            pack_id,
            packs (
              id,
              nombre
            )
          )
        `)
        .order("id", { ascending: true }),

      supabase
        .from("trade_log_view")
        .select("account_id, preset_id, pnl_usd"),
    ]);

  const error =
    presetsResponse.error ||
    packsResponse.error ||
    accountsResponse.error ||
    tradeLogResponse.error;

  if (error) {
    return (
      <div className="space-y-5 text-white">
        <section className="rounded-[28px] border border-rose-400/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(244,63,94,0.04))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200/70">
            App rentabilidad bot
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
            Estadísticas
          </h1>
          <p className="mt-3 text-sm text-rose-200">
            Error cargando la página de estadísticas: {error.message}
          </p>
        </section>
      </div>
    );
  }

  const presets = (presetsResponse.data || []) as Preset[];
  const packs = (packsResponse.data || []) as Pack[];
  const accounts = (accountsResponse.data || []) as AccountRow[];
  const tradeLogRows = (tradeLogResponse.data || []) as TradeLogMetricRow[];

  return (
    <PresetsClient
      presets={presets}
      packs={packs}
      accounts={accounts}
      tradeLogRows={tradeLogRows}
    />
  );
}