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
type OpenControl = "preset" | "size" | "propfirm" | null;

const ACCOUNT_SIZES: AccountSizeOption[] = ["5K", "10K", "25K", "50K", "100K"];

function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="space-y-5 text-white">{children}</div>;
}

function HeroCard() {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_20px_44px_rgba(0,0,0,0.24)]">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          App rentabilidad bot
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
          Control
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Gestión operativa de cuentas, packs y empresas de fondeo.
        </p>
      </div>
    </section>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] p-6 shadow-[0_20px_44px_rgba(0,0,0,0.24)]">
      <div className="mb-6">
        <h2 className="text-[30px] font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-zinc-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-zinc-500">
      {children}
    </label>
  );
}

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function PremiumInput({
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
      className="w-full rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 placeholder:text-zinc-500 focus:border-sky-300/25 focus:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.08)]"
    />
  );
}

function SegmentedButton({
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
      className={`rounded-[18px] border px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_14px_30px_rgba(56,189,248,0.14)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.14)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:text-white"
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
    <GlassPanel className="p-1">
      <div className="grid grid-cols-2 gap-1.5">
        <SegmentedButton
          label="Prueba"
          active={value === "prueba"}
          onClick={() => onChange("prueba")}
        />
        <SegmentedButton
          label="Fondeada"
          active={value === "fondeada"}
          onClick={() => onChange("fondeada")}
        />
      </div>
    </GlassPanel>
  );
}

function PickerOption({
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
      className={`whitespace-nowrap rounded-full border px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(56,189,248,0.12)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.14)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ExpandingPillPicker<T extends string | number>({
  label,
  triggerLabel,
  selectedLabel,
  options,
  selectedValue,
  open,
  onToggle,
  onSelect,
  emptyMessage,
}: {
  label: string;
  triggerLabel: string;
  selectedLabel?: string;
  options: { value: T; label: string }[];
  selectedValue: T | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
  emptyMessage?: string;
}) {
  const hasOptions = options.length > 0;

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => hasOptions && onToggle()}
          className={`group relative shrink-0 overflow-hidden rounded-full border px-4 transition-all duration-300 ${
            open
              ? "h-14 w-14 border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_34px_rgba(56,189,248,0.16)]"
              : "h-14 min-w-[180px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_26px_rgba(0,0,0,0.16)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))]"
          } ${!hasOptions ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <div className="relative flex h-full items-center justify-center">
            <span
              className={`absolute text-sm font-medium text-white transition-all duration-300 ${
                open ? "scale-75 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              {triggerLabel}
            </span>

            <span
              className={`absolute text-base text-white transition-all duration-300 ${
                open ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
              }`}
            >
              →
            </span>
          </div>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-w-[1200px] opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <PickerOption
                key={String(option.value)}
                label={option.label}
                active={option.value === selectedValue}
                onClick={() => {
                  onSelect(option.value);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[20px]">
        {!open ? (
          selectedLabel ? (
            <p className="text-sm text-zinc-300">{selectedLabel}</p>
          ) : emptyMessage ? (
            <p className="text-xs text-amber-200/80">{emptyMessage}</p>
          ) : (
            <p className="text-sm text-zinc-500">Sin seleccionar</p>
          )
        ) : null}
      </div>
    </div>
  );
}

function SummaryStrip({
  presetLabel,
  sizeLabel,
  propFirmLabel,
  tipoCuenta,
}: {
  presetLabel: string;
  sizeLabel: string;
  propFirmLabel: string;
  tipoCuenta: TypeOption;
}) {
  const items = [
    { label: "Preset", value: presetLabel || "Sin preset" },
    { label: "Tipo", value: tipoCuenta === "prueba" ? "Prueba" : "Fondeada" },
    { label: "Tamaño", value: sizeLabel || "Sin tamaño" },
    { label: "Prop firm", value: propFirmLabel || "Sin prop firm" },
  ];

  return (
    <GlassPanel className="p-3">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
    </GlassPanel>
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

  const [openControl, setOpenControl] = useState<OpenControl>(null);

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
      setOpenControl(null);
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
    <PageShell>
      <HeroCard />

      <SectionCard
        title="Crear cuenta"
        description="Nueva cuenta operativa dentro del sistema."
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div>
                <FieldLabel>Nombre</FieldLabel>
                <PremiumInput
                  value={alias}
                  onChange={setAlias}
                  placeholder="Ej. Fernet del Mati"
                />
              </div>

              <div>
                <FieldLabel>Número de cuenta</FieldLabel>
                <PremiumInput
                  value={numeroCuenta}
                  onChange={setNumeroCuenta}
                  placeholder="Ej. 1111111"
                />
              </div>
            </div>

            <GlassPanel className="p-4">
              <div className="grid grid-cols-1 gap-5">
                <ExpandingPillPicker
                  label="Preset"
                  triggerLabel="Preset"
                  selectedLabel={selectedPresetLabel}
                  options={presetItems}
                  selectedValue={presetId}
                  open={openControl === "preset"}
                  onToggle={() =>
                    setOpenControl((prev) => (prev === "preset" ? null : "preset"))
                  }
                  onSelect={(value) => {
                    setPresetId(value);
                    setOpenControl(null);
                  }}
                  emptyMessage="No hay presets disponibles."
                />

                <ExpandingPillPicker
                  label="Tamaño de cuenta"
                  triggerLabel="Tamaño"
                  selectedLabel={accountSize}
                  options={ACCOUNT_SIZES.map((size) => ({
                    value: size,
                    label: size,
                  }))}
                  selectedValue={accountSize}
                  open={openControl === "size"}
                  onToggle={() =>
                    setOpenControl((prev) => (prev === "size" ? null : "size"))
                  }
                  onSelect={(value) => {
                    setAccountSize(value);
                    setOpenControl(null);
                  }}
                />

                <ExpandingPillPicker
                  label="Prop firm"
                  triggerLabel="Prop firm"
                  selectedLabel={selectedPropFirmLabel}
                  options={propFirmItems}
                  selectedValue={propFirmId}
                  open={openControl === "propfirm"}
                  onToggle={() =>
                    setOpenControl((prev) => (prev === "propfirm" ? null : "propfirm"))
                  }
                  onSelect={(value) => {
                    setPropFirmId(value);
                    setOpenControl(null);
                  }}
                  emptyMessage={
                    propFirmItems.length === 0
                      ? "No hay prop firms creadas todavía."
                      : undefined
                  }
                />
              </div>
            </GlassPanel>
          </div>

          <div className="space-y-5">
            <div>
              <FieldLabel>Tipo de cuenta</FieldLabel>
              <TypeSwitch value={tipoCuenta} onChange={setTipoCuenta} />
            </div>

            <SummaryStrip
              presetLabel={selectedPresetLabel}
              sizeLabel={accountSize}
              propFirmLabel={selectedPropFirmLabel}
              tipoCuenta={tipoCuenta}
            />

            {feedback ? (
              <div
                className={`rounded-[22px] border px-4 py-4 text-sm shadow-[0_12px_28px_rgba(0,0,0,0.16)] ${
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
                className="rounded-[20px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] px-6 py-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_32px_rgba(56,189,248,0.14)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-300/30 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.24),rgba(56,189,248,0.10))] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creando..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}