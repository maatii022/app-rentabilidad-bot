"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.07),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
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
    <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-zinc-500">
      {children}
    </label>
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
      className="w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 placeholder:text-zinc-500 focus:border-sky-300/25 focus:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.08)]"
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
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.08))] text-white shadow-[0_12px_28px_rgba(56,189,248,0.14)]"
          : "border-white/10 bg-white/[0.03] text-zinc-300 shadow-[0_10px_22px_rgba(255,255,255,0.03)] hover:bg-white/[0.06] hover:text-white"
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
    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <div className="grid grid-cols-2 gap-1">
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
    </div>
  );
}

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return ref;
}

function DropdownCard<T extends string | number>({
  label,
  valueLabel,
  placeholder,
  items,
  selectedValue,
  onSelect,
  emptyMessage,
}: {
  label: string;
  valueLabel?: string;
  placeholder: string;
  items: { value: T; label: string }[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));

  const hasItems = items.length > 0;

  return (
    <div ref={ref} className="relative">
      <FieldLabel>{label}</FieldLabel>

      <button
        type="button"
        onClick={() => hasItems && setOpen((prev) => !prev)}
        className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 ${
          hasItems
            ? "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
            : "cursor-not-allowed border-white/8 bg-white/[0.02] opacity-75"
        }`}
      >
        <span className={`${valueLabel ? "text-white" : "text-zinc-500"} text-sm`}>
          {valueLabel || placeholder}
        </span>

        <span
          className={`text-xs text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {!hasItems && emptyMessage ? (
        <p className="mt-2 text-xs text-amber-200/80">{emptyMessage}</p>
      ) : null}

      {open && hasItems ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,25,0.96),rgba(7,11,21,0.96))] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div className="space-y-1">
            {items.map((item) => {
              const active = item.value === selectedValue;

              return (
                <button
                  key={String(item.value)}
                  type="button"
                  onClick={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all duration-200 ${
                    active
                      ? "border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(56,189,248,0.07))] text-white shadow-[0_10px_24px_rgba(56,189,248,0.12)]"
                      : "border border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {active ? <span className="text-sky-300">●</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
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
      <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
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

      <SectionCard
        title="Crear cuenta"
        description="Nueva cuenta operativa dentro del sistema."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

          <DropdownCard
            label="Preset"
            valueLabel={selectedPresetLabel}
            placeholder="Selecciona preset"
            items={presetItems}
            selectedValue={presetId}
            onSelect={setPresetId}
            emptyMessage="No hay presets disponibles."
          />

          <div>
            <FieldLabel>Tipo de cuenta</FieldLabel>
            <TypeSwitch value={tipoCuenta} onChange={setTipoCuenta} />
          </div>

          <DropdownCard
            label="Tamaño de cuenta"
            valueLabel={accountSize}
            placeholder="Selecciona tamaño"
            items={ACCOUNT_SIZES.map((size) => ({
              value: size,
              label: size,
            }))}
            selectedValue={accountSize}
            onSelect={setAccountSize}
          />

          <DropdownCard
            label="Prop firm"
            valueLabel={selectedPropFirmLabel}
            placeholder="Selecciona prop firm"
            items={propFirmItems}
            selectedValue={propFirmId}
            onSelect={setPropFirmId}
            emptyMessage="No hay prop firms creadas todavía."
          />
        </div>

        {feedback ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm shadow-[0_10px_24px_rgba(0,0,0,0.16)] ${
              feedback.type === "ok"
                ? "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-100"
                : "border-rose-300/20 bg-rose-400/[0.08] text-rose-100"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={crearCuenta}
            disabled={saving}
            className="rounded-2xl border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(56,189,248,0.14)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-300/30 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.22),rgba(56,189,248,0.09))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}