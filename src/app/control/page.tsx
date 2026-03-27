"use client";

import { useEffect, useMemo, useState } from "react";

type PresetOption = {
  id: number;
  nombre: string;
};

type PropFirmOption = {
  id: number;
  nombre: string;
};

type TypeOption = "prueba" | "fondeada";
type AccountSizeOption = "5K" | "10K" | "25K" | "50K" | "100K";

const ACCOUNT_SIZES: AccountSizeOption[] = ["5K", "10K", "25K", "50K", "100K"];

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
      {children}
    </p>
  );
}

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${className}`}
    >
      {children}
    </section>
  );
}

function CompactInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-12 w-full rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 placeholder:text-zinc-500 focus:border-sky-300/20 focus:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
    />
  );
}

function TinySegment({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-[16px] border px-4 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.12)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.028))] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function TypeSwitch({
  value,
  onChange,
}: {
  value: TypeOption;
  onChange: (value: TypeOption) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <TinySegment
        label="Prueba"
        active={value === "prueba"}
        onClick={() => onChange("prueba")}
      />
      <TinySegment
        label="Fondeada"
        active={value === "fondeada"}
        onClick={() => onChange("fondeada")}
      />
    </div>
  );
}

function InlinePicker<T extends string | number>({
  label,
  triggerLabel,
  selectedLabel,
  options,
  selectedValue,
  open,
  onToggle,
  onSelect,
  emptyText,
}: {
  label: string;
  triggerLabel: string;
  selectedLabel?: string;
  options: { value: T; label: string }[];
  selectedValue: T | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
  emptyText?: string;
}) {
  const hasOptions = options.length > 0;

  return (
    <div>
      <MiniLabel>{label}</MiniLabel>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => hasOptions && onToggle()}
          className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 ${
            open
              ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.12)]"
              : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
          } ${!hasOptions ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <span>{triggerLabel}</span>
          <span
            className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
              open ? "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]" : "bg-white/20"
            }`}
          />
        </button>

        {open ? (
          hasOptions ? (
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    selectedValue === option.value
                      ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.12)]"
                      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-200/80">{emptyText || "Sin opciones disponibles."}</p>
          )
        ) : (
          <p className="text-sm text-zinc-400">{selectedLabel || "Sin seleccionar"}</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  presetLabel,
  tipoCuenta,
  accountSize,
  propFirmLabel,
}: {
  presetLabel: string;
  tipoCuenta: TypeOption;
  accountSize: string;
  propFirmLabel: string;
}) {
  const items = [
    { label: "Preset", value: presetLabel || "Sin preset" },
    { label: "Tipo", value: tipoCuenta === "prueba" ? "Prueba" : "Fondeada" },
    { label: "Tamaño", value: accountSize || "Sin tamaño" },
    { label: "Prop firm", value: propFirmLabel || "Sin prop firm" },
  ];

  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              {item.label}
            </p>
            <p className="mt-2 truncate text-sm font-medium text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ControlPage() {
  const [alias, setAlias] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [presetId, setPresetId] = useState<number | null>(null);
  const [tipoCuenta, setTipoCuenta] = useState<TypeOption>("prueba");
  const [accountSize, setAccountSize] = useState<AccountSizeOption>("10K");
  const [propFirmId, setPropFirmId] = useState<number | null>(null);

  const [presets, setPresets] = useState<PresetOption[]>([]);
  const [propFirms, setPropFirms] = useState<PropFirmOption[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );

  const [openControls, setOpenControls] = useState<Record<Exclude<OpenControl, null>, boolean>>({
    preset: false,
    size: false,
    propfirm: false,
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        const res = await fetch("/api/control-data", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        setPresets(data.presets || []);
        setPropFirms(data.propFirms || []);
      } catch {
        setPresets([]);
        setPropFirms([]);
      }
    }

    void cargarDatos();
  }, []);

  const presetItems = useMemo(
    () =>
      presets.map((preset) => ({
        value: preset.id,
        label: preset.nombre,
      })),
    [presets]
  );

  const propFirmItems = useMemo(
    () =>
      propFirms.map((firm) => ({
        value: firm.id,
        label: firm.nombre,
      })),
    [propFirms]
  );

  const selectedPresetLabel =
    presets.find((preset) => preset.id === presetId)?.nombre || "";

  const selectedPropFirmLabel =
    propFirms.find((firm) => firm.id === propFirmId)?.nombre || "";

  function toggleControl(key: Exclude<OpenControl, null>) {
    setOpenControls((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function crearCuenta() {
    setFeedback(null);

    if (!alias.trim()) {
      setFeedback({ type: "error", message: "Introduce un alias válido." });
      return;
    }

    if (!numeroCuenta.trim()) {
      setFeedback({ type: "error", message: "Introduce un número de cuenta válido." });
      return;
    }

    if (!presetId) {
      setFeedback({ type: "error", message: "Selecciona un preset." });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alias: alias.trim(),
          numeroCuenta: numeroCuenta.trim(),
          presetId,
          tipoCuenta,
          accountSize,
          propFirmId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data?.error || "No se pudo crear la cuenta.",
        });
        return;
      }

      setFeedback({
        type: "ok",
        message: "Cuenta creada correctamente.",
      });

      setAlias("");
      setNumeroCuenta("");
      setPresetId(null);
      setTipoCuenta("prueba");
      setAccountSize("10K");
      setPropFirmId(null);
    } catch {
      setFeedback({
        type: "error",
        message: "No se pudo crear la cuenta.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 text-white">
      <HeroCard />

      <SectionCard title="Crear cuenta">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div>
              <MiniLabel>Nombre</MiniLabel>
              <CompactInput
                value={alias}
                onChange={setAlias}
                placeholder="Ej. Fernet del Mati"
              />
            </div>

            <div>
              <MiniLabel>Número de cuenta</MiniLabel>
              <CompactInput
                value={numeroCuenta}
                onChange={setNumeroCuenta}
                placeholder="Ej. 1111111"
              />
            </div>

            <div>
              <MiniLabel>Tipo de cuenta</MiniLabel>
              <TypeSwitch value={tipoCuenta} onChange={setTipoCuenta} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <InlinePicker
                label="Preset"
                triggerLabel="Preset"
                selectedLabel={selectedPresetLabel}
                options={presetItems}
                selectedValue={presetId}
                open={openControls.preset}
                onToggle={() => toggleControl("preset")}
                onSelect={setPresetId}
                emptyText="No hay presets disponibles."
              />

              <InlinePicker
                label="Tamaño de cuenta"
                triggerLabel="Tamaño"
                selectedLabel={accountSize}
                options={ACCOUNT_SIZES.map((size) => ({
                  value: size,
                  label: size,
                }))}
                selectedValue={accountSize}
                open={openControls.size}
                onToggle={() => toggleControl("size")}
                onSelect={setAccountSize}
              />

              <InlinePicker
                label="Prop firm"
                triggerLabel="Prop firm"
                selectedLabel={selectedPropFirmLabel}
                options={propFirmItems}
                selectedValue={propFirmId}
                open={openControls.propfirm}
                onToggle={() => toggleControl("propfirm")}
                onSelect={setPropFirmId}
                emptyText="No hay prop firms creadas todavía."
              />
            </div>

            <div className="space-y-4">
              <SummaryCard
                presetLabel={selectedPresetLabel}
                tipoCuenta={tipoCuenta}
                accountSize={accountSize}
                propFirmLabel={selectedPropFirmLabel}
              />

              {feedback ? (
                <div
                  className={`rounded-[20px] border px-4 py-3 text-sm ${
                    feedback.type === "ok"
                      ? "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))] text-emerald-100"
                      : "border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.12),rgba(244,63,94,0.04))] text-rose-100"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={crearCuenta}
                  disabled={saving}
                  className="h-12 rounded-[18px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] px-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(56,189,248,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-300/30 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.24),rgba(56,189,248,0.10))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creando..." : "Crear cuenta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}