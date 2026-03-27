"use client";

import { useEffect, useState } from "react";

export default function ControlPage() {
  const [alias, setAlias] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [presetId, setPresetId] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("prueba");
  const [accountSize, setAccountSize] = useState("10K");
  const [propFirmId, setPropFirmId] = useState("");

  const [presets, setPresets] = useState<any[]>([]);
  const [propFirms, setPropFirms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/control-data")
      .then((res) => res.json())
      .then((data) => {
        setPresets(data.presets || []);
        setPropFirms(data.propFirms || []);
      });
  }, []);

  async function crearCuenta() {
    const res = await fetch("/api/accounts/create", {
      method: "POST",
      body: JSON.stringify({
        alias,
        numeroCuenta,
        presetId,
        tipoCuenta,
        accountSize,
        propFirmId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Cuenta creada correctamente");

    setAlias("");
    setNumeroCuenta("");
  }

  return (
    <div className="space-y-5 text-white">

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <h1 className="text-3xl font-semibold">Control</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Gestión operativa de cuentas, packs y empresas de fondeo.
        </p>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">

  <div className="mb-5">
    <h2 className="text-lg font-medium text-white">Crear cuenta</h2>
    <p className="text-sm text-zinc-500 mt-1">
      Nueva cuenta operativa dentro del sistema
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <input
      placeholder="Alias"
      value={alias}
      onChange={(e) => setAlias(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40 focus:bg-white/[0.06]"
    />

    <input
      placeholder="Número de cuenta"
      value={numeroCuenta}
      onChange={(e) => setNumeroCuenta(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40 focus:bg-white/[0.06]"
    />

    <select
      onChange={(e) => setPresetId(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40"
    >
      <option value="">Preset</option>
      {presets.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>

    <select
      onChange={(e) => setTipoCuenta(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40"
    >
      <option value="prueba">Prueba</option>
      <option value="fondeada">Fondeada</option>
    </select>

    <select
      onChange={(e) => setAccountSize(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40"
    >
      <option value="5K">5K</option>
      <option value="10K">10K</option>
      <option value="25K">25K</option>
      <option value="50K">50K</option>
      <option value="100K">100K</option>
    </select>

    <select
      onChange={(e) => setPropFirmId(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40"
    >
      <option value="">Prop firm</option>
      {propFirms.map((p) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>

  </div>

  <div className="mt-5 flex justify-end">
    <button
      onClick={crearCuenta}
      className="rounded-xl border border-sky-400/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.25),rgba(56,189,248,0.10))] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(56,189,248,0.18)] transition hover:scale-[1.02] hover:border-sky-400/40 active:scale-[0.98]"
    >
      Crear cuenta
    </button>
  </div>

</section>
    </div>
  );
}