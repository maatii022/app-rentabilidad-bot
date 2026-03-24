import { supabase } from "@/lib/supabase";

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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Calendario</h1>

      {error && <p>Error: {error.message}</p>}

      <div className="space-y-3">
        {data?.map((resultado) => (
          <div
            key={resultado.id}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <p>Fecha: {resultado.fecha}</p>
            <p>Cuenta: {resultado.accounts?.alias}</p>
            <p>Número: {resultado.accounts?.numero_cuenta}</p>
            <p>PnL USD: {resultado.pnl_usd}</p>
            <p>PnL %: {resultado.pnl_porcentaje}</p>
            <p>Red day: {resultado.red_day ? "Sí" : "No"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}