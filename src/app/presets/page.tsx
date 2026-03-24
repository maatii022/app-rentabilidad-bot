import { supabase } from "@/lib/supabase";

export default async function PresetsPage() {
  const { data, error } = await supabase.from("presets").select("*");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Presets</h1>

      {error && <p>Error: {error.message}</p>}

      <ul className="space-y-2">
        {data?.map((preset) => (
          <li
            key={preset.id}
            className="p-3 rounded-lg bg-white/5 border border-white/10"
          >
            {preset.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}