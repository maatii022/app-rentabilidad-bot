import { supabase } from "@/lib/supabase";

export default async function CuentasPage() {
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
        presets (
          nombre
      )
    `)
    .order("id", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Cuentas</h1>

      {error && <p>Error: {error.message}</p>}

      <div className="space-y-3">
        {data?.map((cuenta) => (
          <div
            key={cuenta.id}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <p>Número: {cuenta.numero_cuenta}</p>
            <p>Alias: {cuenta.alias ?? "Sin alias"}</p>
            <p>Preset: {cuenta.presets?.nombre}</p>
            <p>Tipo: {cuenta.tipo_cuenta}</p>
            <p>Estado: {cuenta.estado}</p>
          </div>
        ))}
      </div>
    </div>
  );
}