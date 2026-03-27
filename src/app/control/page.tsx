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

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <h2 className="text-lg mb-4">Crear cuenta</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <input
            placeholder="Alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="input"
          />

          <input
            placeholder="Número cuenta"
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value)}
            className="input"
          />

          <select onChange={(e) => setPresetId(e.target.value)} className="input">
            <option>Preset</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <select onChange={(e) => setTipoCuenta(e.target.value)} className="input">
            <option value="prueba">Prueba</option>
            <option value="fondeada">Fondeada</option>
          </select>

          <select onChange={(e) => setAccountSize(e.target.value)} className="input">
            <option>5K</option>
            <option>10K</option>
            <option>25K</option>
            <option>50K</option>
            <option>100K</option>
          </select>

          <select onChange={(e) => setPropFirmId(e.target.value)} className="input">
            <option>Prop firm</option>
            {propFirms.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

        </div>

        <button
          onClick={crearCuenta}
          className="mt-4 rounded-xl bg-white text-black px-4 py-2"
        >
          Crear cuenta
        </button>
      </section>
    </div>
  );
}