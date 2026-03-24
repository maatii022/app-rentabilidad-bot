import { supabase } from "@/lib/supabase";

type AccountRelation =
  | {
      alias: string;
      numero_cuenta: string;
    }
  | {
      alias: string;
      numero_cuenta: string;
    }[]
  | null;

type DailyResult = {
  id: number;
  fecha: string;
  pnl_usd: number;
  pnl_porcentaje: number;
  red_day: boolean;
  accounts: AccountRelation;
};

function getAccountData(accounts: AccountRelation) {
  if (!accounts) return null;
  return Array.isArray(accounts) ? accounts[0] : accounts;
}

export default async function CalendarioPage() {
  const { data, error } = await supabase
    .from("daily_results")
    .select(`
      id,
      fecha,
      pnl_usd,
      pnl_porcentaje,
      red_day,
      accounts (
        alias,
        numero_cuenta
      )
    `)
    .order("fecha", { ascending: false });

  const resultados = (data || []) as DailyResult[];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Calendario</h1>

      {error && <p>Error: {error.message}</p>}

      <div className="space-y-3">
        {resultados.map((resultado) => {
          const cuenta = getAccountData(resultado.accounts);

          return (
            <div
              key={resultado.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p>Fecha: {resultado.fecha}</p>
              <p>Cuenta: {cuenta?.alias ?? "-"}</p>
              <p>Número: {cuenta?.numero_cuenta ?? "-"}</p>
              <p>PnL USD: {resultado.pnl_usd}</p>
              <p>PnL %: {resultado.pnl_porcentaje}</p>
              <p>Red day: {resultado.red_day ? "Sí" : "No"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}