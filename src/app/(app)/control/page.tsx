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

type AvailableAccountOption = {
  id: number;
  alias: string | null;
  numero_cuenta: string | null;
  preset_id: number | null;
  tipo_cuenta: string | null;
  estado: string | null;
};

type EditableAccount = {
  id: number;
  alias: string | null;
  numero_cuenta: string | null;
  preset_id: number | null;
  tipo_cuenta: string | null;
  estado: string | null;
  account_size: string | null;
  prop_firm_id: number | null;
  activa_en_filtros: boolean | null;
  fecha_inicio: string | null;
  fecha_perdida: string | null;
  fecha_fondeo: string | null;
};

type TypeOption = "prueba" | "fondeada";
type AccountSizeOption = "5K" | "10K" | "25K" | "50K" | "100K";
type SlotKey = "A" | "B" | "C";
type AccountEstado = "activa" | "fondeada" | "perdida";

type ControlPackSlotAccount = {
  id: number;
  alias: string | null;
  numero_cuenta: string | null;
  estado: string | null;
  tipo_cuenta: string | null;
  account_size: string | null;
};

type ControlPackSlot = {
  id: number;
  slot: string;
  es_activa: boolean;
  pendiente_reemplazo: boolean;
  orden: number;
  account_id: number | null;
  accounts: ControlPackSlotAccount | null;
};

type ControlPack = {
  id: number;
  nombre: string;
  tipo_pack: TypeOption;
  preset_id: number | null;
  presets: {
    nombre: string | null;
  } | null;
  pack_slots: ControlPackSlot[];
};

const ACCOUNT_SIZES: AccountSizeOption[] = ["5K", "10K", "25K", "50K", "100K"];
const SLOT_KEYS: SlotKey[] = ["A", "B", "C"];

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "blue" | "green" | "violet" | "amber";
}) {
  const toneClasses = {
    neutral:
      "border-white/10 bg-white/[0.03] shadow-[0_12px_28px_rgba(255,255,255,0.03)]",
    blue:
      "border-sky-400/20 bg-sky-400/[0.08] shadow-[0_14px_30px_rgba(56,189,248,0.08)]",
    green:
      "border-emerald-400/20 bg-emerald-400/[0.08] shadow-[0_14px_30px_rgba(16,185,129,0.08)]",
    violet:
      "border-violet-400/20 bg-violet-400/[0.08] shadow-[0_14px_30px_rgba(167,139,250,0.08)]",
    amber:
      "border-amber-300/20 bg-amber-300/[0.08] shadow-[0_14px_30px_rgba(251,191,36,0.08)]",
  };

  return (
    <div className={`rounded-2xl border p-3 ${toneClasses[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-white">{value}</p>
    </div>
  );
}

function HeroCard({
  summary,
}: {
  summary: {
    presets: number;
    propFirms: number;
    cuentasDisponibles: number;
    cuentasEditables: number;
    cuentasActivas: number;
  };
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
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

        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
          <StatCard label="Presets" value={summary.presets} tone="blue" />
          <StatCard label="Prop firms" value={summary.propFirms} tone="violet" />
          <StatCard label="Disponibles" value={summary.cuentasDisponibles} tone="green" />
          <StatCard label="Editables" value={summary.cuentasEditables} tone="neutral" />
          <StatCard label="Activas" value={summary.cuentasActivas} tone="amber" />
        </div>
      </div>
    </section>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
      {children}
    </p>
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
      className="h-11 w-full rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 placeholder:text-zinc-500 focus:border-sky-300/20 focus:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
    />
  );
}

function CompactSelect({
  value,
  onChange,
  children,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 text-sm text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 focus:border-sky-300/20 focus:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
    >
      {children}
    </select>
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
      className={`h-11 rounded-[14px] border px-4 text-sm font-medium transition-all duration-200 ${
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
    <div className="grid grid-cols-2 gap-2 rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
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

function EstadoSwitch({
  value,
  onChange,
}: {
  value: AccountEstado;
  onChange: (value: AccountEstado) => void;
}) {
  const options: AccountEstado[] = ["activa", "fondeada", "perdida"];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      {options.map((option) => (
        <TinySegment
          key={option}
          label={option.charAt(0).toUpperCase() + option.slice(1)}
          active={value === option}
          onClick={() => onChange(option)}
        />
      ))}
    </div>
  );
}

function GlowOptionButton({
  label,
  active,
  visible = true,
  delayMs = 0,
  onClick,
}: {
  label: string;
  active?: boolean;
  visible?: boolean;
  delayMs?: number;
  onClick?: () => void;
}) {
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setGlow({ x, y });
      }}
      className={`relative overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
        active
          ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.12)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:text-white"
      } ${
        visible ? "translate-x-0 opacity-100 blur-0" : "-translate-x-4 opacity-0 blur-[2px]"
      }`}
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(125,211,252,0.16), transparent 45%)`,
        }}
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function InlinePicker<T extends string | number>(props: {
  label: string;
  triggerLabel: string;
  options: { value: T; label: string }[];
  selectedValue: T | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
}) {
  const { label, triggerLabel, options, selectedValue, open, onToggle, onSelect } = props;
  const hasOptions = options.length > 0;

  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label || "";

  return (
    <div>
      {label ? <MiniLabel>{label}</MiniLabel> : null}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => hasOptions && onToggle()}
          className={`flex h-11 w-full items-center justify-between rounded-[16px] border px-4 text-sm font-medium transition-all duration-300 ${
            open
              ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(56,189,248,0.05))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(56,189,248,0.10)]"
              : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
          } ${!hasOptions ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <span className="truncate">
            {selectedLabel || triggerLabel}
          </span>

          <span
            className={`ml-3 shrink-0 text-xs text-zinc-400 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-[240px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-2 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
            <div className="flex max-h-[180px] flex-wrap gap-2 overflow-y-auto pr-1">
              {options.map((option, index) => (
                <GlowOptionButton
                  key={String(option.value)}
                  label={option.label}
                  active={selectedValue === option.value}
                  delayMs={index * 30}
                  visible={open}
                  onClick={() => onSelect(option.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotAssignmentPicker({
  label,
  triggerLabel,
  options,
  selectedValue,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  triggerLabel: string;
  options: { value: number; label: string }[];
  selectedValue: number;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: number) => void;
}) {
  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label || "Vacío";

  return (
    <div>
      {label ? <MiniLabel>{label}</MiniLabel> : null}

      <div className="space-y-2">
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-11 w-full items-center justify-between rounded-[16px] border px-4 text-sm font-medium transition-all duration-300 ${
            open
              ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(56,189,248,0.05))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_rgba(56,189,248,0.10)]"
              : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
          }`}
        >
          <span className="truncate">
            {selectedLabel || triggerLabel}
          </span>

          <span
            className={`ml-3 shrink-0 text-xs text-zinc-400 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-[240px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-2 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
            <div className="max-h-[180px] space-y-2 overflow-y-auto pr-1">
              {options.map((option, index) => (
                <GlowOptionButton
                  key={option.value}
                  label={option.label}
                  active={selectedValue === option.value}
                  visible={open}
                  delayMs={index * 30}
                  onClick={() => onSelect(option.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-3"
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

function FeedbackBox({
  feedback,
}: {
  feedback: { type: "ok" | "error"; message: string } | null;
}) {
  if (!feedback) return null;

  return (
    <div
      className={`rounded-[18px] border px-4 py-3 text-sm ${
        feedback.type === "ok"
          ? "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))] text-emerald-100"
          : "border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.12),rgba(244,63,94,0.04))] text-rose-100"
      }`}
    >
      {feedback.message}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-11 rounded-[16px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] px-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(56,189,248,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-300/30 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.24),rgba(56,189,248,0.10))] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-11 rounded-[16px] border border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.18),rgba(244,63,94,0.08))] px-5 text-sm font-medium text-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(244,63,94,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:border-rose-300/30 hover:bg-[linear-gradient(180deg,rgba(244,63,94,0.22),rgba(244,63,94,0.10))] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function normalizeTipoCuenta(value: string | null | undefined): TypeOption | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "prueba") return "prueba";
  if (normalized === "fondeada") return "fondeada";
  return null;
}

function normalizeEstado(value: string | null | undefined): AccountEstado {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "fondeada") return "fondeada";
  if (normalized === "perdida") return "perdida";
  return "activa";
}

function buildAccountLabel(account: AvailableAccountOption) {
  const alias = account.alias || "Sin alias";
  const numero = account.numero_cuenta || "-";
  return `${alias} · ${numero}`;
}

function getSlotKey(packId: number, slotId: number) {
  return `${packId}-${slotId}`;
}

export default function ControlPage() {
  const [alias, setAlias] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [presetId, setPresetId] = useState<number | null>(null);
  const [tipoCuenta, setTipoCuenta] = useState<TypeOption>("prueba");
  const [accountSize, setAccountSize] = useState<AccountSizeOption>("10K");
  const [propFirmId, setPropFirmId] = useState<number | null>(null);
  const [preassignSlot, setPreassignSlot] = useState<SlotKey | null>(null);

  const [packNombre, setPackNombre] = useState("");
  const [packPresetId, setPackPresetId] = useState<number | null>(null);
  const [packTipo, setPackTipo] = useState<TypeOption>("prueba");
  const [slotAssignments, setSlotAssignments] = useState<Record<SlotKey, number | null>>({
    A: null,
    B: null,
    C: null,
  });

  const [editorAccountId, setEditorAccountId] = useState<number | null>(null);
  const [editorAlias, setEditorAlias] = useState("");
  const [editorNumeroCuenta, setEditorNumeroCuenta] = useState("");
  const [editorPresetId, setEditorPresetId] = useState<number | null>(null);
  const [editorTipoCuenta, setEditorTipoCuenta] = useState<TypeOption>("prueba");
  const [editorEstado, setEditorEstado] = useState<AccountEstado>("activa");
  const [editorAccountSize, setEditorAccountSize] = useState<AccountSizeOption>("10K");
  const [editorPropFirmId, setEditorPropFirmId] = useState<number | null>(null);
  const [editorActivaEnFiltros, setEditorActivaEnFiltros] = useState(true);
  const [showAllEditorAccounts, setShowAllEditorAccounts] = useState(false);

  const [presets, setPresets] = useState<PresetOption[]>([]);
  const [propFirms, setPropFirms] = useState<PropFirmOption[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccountOption[]>([]);
  const [editableAccounts, setEditableAccounts] = useState<EditableAccount[]>([]);
  const [controlPacks, setControlPacks] = useState<ControlPack[]>([]);
  const [slotAccountSelections, setSlotAccountSelections] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [savingPack, setSavingPack] = useState(false);
  const [savingEditor, setSavingEditor] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [actingSlotKey, setActingSlotKey] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );
  const [packFeedback, setPackFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );
  const [editorFeedback, setEditorFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );
  const [packsEditorFeedback, setPacksEditorFeedback] = useState<{
    type: "ok" | "error";
    message: string;
  } | null>(null);

  const [openControls, setOpenControls] = useState<Record<string, boolean>>({
    preset: false,
    size: false,
    propfirm: false,
    packPreset: false,
    slotA: false,
    slotB: false,
    slotC: false,
    editorAccount: false,
    editorPreset: false,
    editorSize: false,
    editorPropFirm: false,
  });

  async function cargarDatosControl() {
    const res = await fetch("/api/control-data", {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    setPresets(data.presets || []);
    setPropFirms(data.propFirms || []);
    setAvailableAccounts(data.availableAccounts || []);
    setEditableAccounts(data.editableAccounts || []);
  }

  async function cargarPacksControl() {
    setLoadingPacks(true);
    try {
      const res = await fetch("/api/control/packs", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setControlPacks([]);
        return;
      }

      setControlPacks(data.packs || []);
    } finally {
      setLoadingPacks(false);
    }
  }

  async function recargarTodoControl() {
    await Promise.all([cargarDatosControl(), cargarPacksControl()]);
  }

  useEffect(() => {
    void recargarTodoControl();
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

  const editorVisibleAccounts = useMemo(() => {
    if (showAllEditorAccounts) return editableAccounts;
    return editableAccounts.filter((account) => normalizeEstado(account.estado) === "activa");
  }, [editableAccounts, showAllEditorAccounts]);

  const editorAccountItems = useMemo(
    () =>
      editorVisibleAccounts.map((account) => ({
        value: account.id,
        label: `${account.alias || "Sin alias"} · ${account.numero_cuenta || "-"}`,
      })),
    [editorVisibleAccounts]
  );

  const selectedPresetLabel =
    presets.find((preset) => preset.id === presetId)?.nombre || "";

  const selectedPropFirmLabel =
    propFirms.find((firm) => firm.id === propFirmId)?.nombre || "";

  const selectedPackPresetLabel =
    presets.find((preset) => preset.id === packPresetId)?.nombre || "";

  const selectedEditorPresetLabel =
    presets.find((preset) => preset.id === editorPresetId)?.nombre || "";

  const selectedEditorPropFirmLabel =
    propFirms.find((firm) => firm.id === editorPropFirmId)?.nombre || "";

  const selectedEditorAccountLabel =
    editorVisibleAccounts.find((account) => account.id === editorAccountId)
      ? `${editorVisibleAccounts.find((account) => account.id === editorAccountId)?.alias || "Sin alias"} · ${editorVisibleAccounts.find((account) => account.id === editorAccountId)?.numero_cuenta || "-"}`
      : "";

  const filteredPackAccounts = useMemo(() => {
    return availableAccounts.filter((account) => {
      const tipo = normalizeTipoCuenta(account.tipo_cuenta);
      const sameTipo = tipo === packTipo;
      const samePreset = packPresetId ? account.preset_id === packPresetId : true;
      return sameTipo && samePreset;
    });
  }, [availableAccounts, packPresetId, packTipo]);

  useEffect(() => {
    setSlotAssignments((prev) => {
      const allowedIds = new Set(filteredPackAccounts.map((account) => account.id));
      const next = { ...prev };
      let changed = false;

      for (const slot of SLOT_KEYS) {
        const value = prev[slot];
        if (value !== null && !allowedIds.has(value)) {
          next[slot] = null;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [filteredPackAccounts]);

  useEffect(() => {
    if (!editorAccountId) return;

    const current = editableAccounts.find((account) => account.id === editorAccountId);
    if (!current) return;

    setEditorAlias(current.alias || "");
    setEditorNumeroCuenta(current.numero_cuenta || "");
    setEditorPresetId(current.preset_id || null);
    setEditorTipoCuenta(normalizeTipoCuenta(current.tipo_cuenta) || "prueba");
    setEditorEstado(normalizeEstado(current.estado));
    setEditorAccountSize((current.account_size as AccountSizeOption) || "10K");
    setEditorPropFirmId(current.prop_firm_id || null);
    setEditorActivaEnFiltros(Boolean(current.activa_en_filtros));
  }, [editorAccountId, editableAccounts]);

  const summary = useMemo(() => {
    return {
      presets: presets.length,
      propFirms: propFirms.length,
      cuentasDisponibles: availableAccounts.length,
      cuentasEditables: editableAccounts.length,
      cuentasActivas: editableAccounts.filter(
        (account) => normalizeEstado(account.estado) === "activa"
      ).length,
    };
  }, [presets, propFirms, availableAccounts, editableAccounts]);

  function toggleControl(key: string) {
    setOpenControls((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function getAccountById(accountId: number | null) {
    if (!accountId) return null;
    return availableAccounts.find((account) => account.id === accountId) || null;
  }

  function getSlotOptions(slot: SlotKey) {
    const usedInOtherSlots = new Set(
      SLOT_KEYS.filter((item) => item !== slot)
        .map((item) => slotAssignments[item])
        .filter((value): value is number => typeof value === "number")
    );

    const accountOptions = filteredPackAccounts
      .filter((account) => {
        if (slotAssignments[slot] === account.id) return true;
        return !usedInOtherSlots.has(account.id);
      })
      .map((account) => ({
        value: account.id,
        label: buildAccountLabel(account),
      }));

    return [{ value: 0, label: "Vacío" }, ...accountOptions];
  }

  function applyPackAutofillFromAccount(account: AvailableAccountOption | null) {
    if (!account) return;

    const accountPresetId =
      typeof account.preset_id === "number" ? account.preset_id : null;
    const accountTipo = normalizeTipoCuenta(account.tipo_cuenta);

    if (accountPresetId && !packPresetId) {
      setPackPresetId(accountPresetId);
    }

    if (accountTipo && !packTipo) {
      setPackTipo(accountTipo);
    }

    if (accountTipo && packTipo !== accountTipo && !SLOT_KEYS.some((slot) => slotAssignments[slot] !== null)) {
      setPackTipo(accountTipo);
    }
  }

  function setSlotAccount(slot: SlotKey, value: number) {
    const nextValue = value === 0 ? null : value;

    setSlotAssignments((prev) => ({
      ...prev,
      [slot]: nextValue,
    }));

    if (nextValue !== null) {
      const account = getAccountById(nextValue);
      applyPackAutofillFromAccount(account);
    }
  }

  function getAssignableAccountsForPack(pack: ControlPack) {
    return availableAccounts
      .filter((account) => {
        const estado = normalizeEstado(account.estado);
        const sameType = normalizeTipoCuenta(account.tipo_cuenta) === pack.tipo_pack;
        return estado !== "perdida" && sameType;
      })
      .sort((a, b) =>
        `${a.alias || ""}${a.numero_cuenta || ""}`.localeCompare(
          `${b.alias || ""}${b.numero_cuenta || ""}`
        )
      );
  }

  async function ejecutarAccionSlot(
    body: {
      action: "assign" | "remove" | "set_active" | "toggle_pending";
      slotId: number;
      packId: number;
      accountId?: number;
      pendiente?: boolean;
    },
    successMessage: string
  ) {
    const slotKey = `${body.packId}-${body.slotId}`;
    setActingSlotKey(slotKey);
    setPacksEditorFeedback(null);

    try {
      const res = await fetch("/api/control/packs/slot-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setPacksEditorFeedback({
          type: "error",
          message: data?.error || "No se pudo actualizar el slot.",
        });
        return;
      }

      setSlotAccountSelections((prev) => ({
        ...prev,
        [slotKey]: "",
      }));

      await recargarTodoControl();

      setPacksEditorFeedback({
        type: "ok",
        message: successMessage,
      });
    } catch {
      setPacksEditorFeedback({
        type: "error",
        message: "No se pudo actualizar el slot.",
      });
    } finally {
      setActingSlotKey(null);
    }
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

      const createdAccount = data?.account as AvailableAccountOption | undefined;

      if (createdAccount) {
        setAvailableAccounts((prev) => {
          const exists = prev.some((item) => item.id === createdAccount.id);
          if (exists) return prev;
          return [...prev].concat(createdAccount).sort((a, b) =>
            String(a.alias || "").localeCompare(String(b.alias || ""))
          );
        });

        setEditableAccounts((prev) => {
          const exists = prev.some((item) => item.id === createdAccount.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              ...createdAccount,
              account_size: accountSize,
              prop_firm_id: propFirmId,
              activa_en_filtros: true,
              fecha_inicio: null,
              fecha_perdida: null,
              fecha_fondeo: null,
            },
          ].sort((a, b) => String(a.alias || "").localeCompare(String(b.alias || "")));
        });

        if (preassignSlot) {
          const accountPreset =
            typeof createdAccount.preset_id === "number"
              ? createdAccount.preset_id
              : Number(presetId);

          const accountTipo =
            normalizeTipoCuenta(createdAccount.tipo_cuenta) || tipoCuenta;

          setPackPresetId(accountPreset);
          setPackTipo(accountTipo);
          setSlotAssignments((prev) => ({
            ...prev,
            [preassignSlot]: createdAccount.id,
          }));
        }
      }

      setFeedback({
        type: "ok",
        message: preassignSlot
          ? `Cuenta creada y preasignada al slot ${preassignSlot}.`
          : "Cuenta creada correctamente.",
      });

      setAlias("");
      setNumeroCuenta("");
      setPresetId(null);
      setTipoCuenta("prueba");
      setAccountSize("10K");
      setPropFirmId(null);
      setPreassignSlot(null);
    } catch {
      setFeedback({
        type: "error",
        message: "No se pudo crear la cuenta.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function crearPack() {
    setPackFeedback(null);

    if (!packNombre.trim()) {
      setPackFeedback({ type: "error", message: "Introduce un nombre de pack válido." });
      return;
    }

    if (!packPresetId) {
      setPackFeedback({ type: "error", message: "Selecciona un preset para el pack." });
      return;
    }

    setSavingPack(true);

    try {
      const res = await fetch("/api/packs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: packNombre.trim(),
          presetId: packPresetId,
          tipoPack: packTipo,
          slotAssignments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPackFeedback({
          type: "error",
          message: data?.error || "No se pudo crear el pack.",
        });
        return;
      }

      const assignedIds = SLOT_KEYS.map((slot) => slotAssignments[slot]).filter(
        (value): value is number => typeof value === "number"
      );

      if (assignedIds.length > 0) {
        setAvailableAccounts((prev) =>
          prev.filter((account) => !assignedIds.includes(account.id))
        );
      }

      setPackFeedback({
        type: "ok",
        message: "Pack creado correctamente.",
      });

      setPackNombre("");
      setPackPresetId(null);
      setPackTipo("prueba");
      setSlotAssignments({
        A: null,
        B: null,
        C: null,
      });

      await recargarTodoControl();
    } catch {
      setPackFeedback({
        type: "error",
        message: "No se pudo crear el pack.",
      });
    } finally {
      setSavingPack(false);
    }
  }

  async function guardarEdicionCuenta() {
    setEditorFeedback(null);

    if (!editorAccountId) {
      setEditorFeedback({ type: "error", message: "Selecciona una cuenta." });
      return;
    }

    if (!editorAlias.trim()) {
      setEditorFeedback({ type: "error", message: "Introduce un alias válido." });
      return;
    }

    if (!editorNumeroCuenta.trim()) {
      setEditorFeedback({ type: "error", message: "Introduce un número válido." });
      return;
    }

    if (!editorPresetId) {
      setEditorFeedback({ type: "error", message: "Selecciona un preset." });
      return;
    }

    setSavingEditor(true);

    try {
      const res = await fetch("/api/accounts/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: editorAccountId,
          alias: editorAlias.trim(),
          numeroCuenta: editorNumeroCuenta.trim(),
          presetId: editorPresetId,
          tipoCuenta: editorTipoCuenta,
          estado: editorEstado,
          accountSize: editorAccountSize,
          propFirmId: editorPropFirmId,
          activaEnFiltros: editorActivaEnFiltros,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditorFeedback({
          type: "error",
          message: data?.error || "No se pudo guardar la cuenta.",
        });
        return;
      }

      const updatedAccount = data?.account as EditableAccount | undefined;

      if (updatedAccount) {
        setEditableAccounts((prev) =>
          prev.map((account) =>
            account.id === updatedAccount.id ? updatedAccount : account
          )
        );
      }

      setEditorFeedback({
        type: "ok",
        message: "Cuenta actualizada correctamente.",
      });

      await recargarTodoControl();
    } catch {
      setEditorFeedback({
        type: "error",
        message: "No se pudo guardar la cuenta.",
      });
    } finally {
      setSavingEditor(false);
    }
  }

  async function eliminarCuenta() {
    setEditorFeedback(null);

    if (!editorAccountId) {
      setEditorFeedback({ type: "error", message: "Selecciona una cuenta." });
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar esta cuenta? Solo se podrá eliminar si no está asignada a ningún pack."
    );

    if (!confirmed) return;

    setDeletingAccount(true);

    try {
      const res = await fetch("/api/accounts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: editorAccountId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditorFeedback({
          type: "error",
          message: data?.error || "No se pudo eliminar la cuenta.",
        });
        return;
      }

      setEditorFeedback({
        type: "ok",
        message: data?.message || "Cuenta eliminada correctamente.",
      });

      setEditorAccountId(null);
      setEditorAlias("");
      setEditorNumeroCuenta("");
      setEditorPresetId(null);
      setEditorTipoCuenta("prueba");
      setEditorEstado("activa");
      setEditorAccountSize("10K");
      setEditorPropFirmId(null);
      setEditorActivaEnFiltros(true);

      await recargarTodoControl();
    } catch {
      setEditorFeedback({
        type: "error",
        message: "No se pudo eliminar la cuenta.",
      });
    } finally {
      setDeletingAccount(false);
    }
  }

  const accountSummaryItems = [
    { label: "Preset", value: selectedPresetLabel || "Sin preset" },
    { label: "Tipo", value: tipoCuenta === "prueba" ? "Prueba" : "Fondeada" },
    { label: "Tamaño", value: accountSize || "Sin tamaño" },
    { label: "Prop firm", value: selectedPropFirmLabel || "Sin prop firm" },
  ];

  const packSummaryItems = [
    { label: "Preset", value: selectedPackPresetLabel || "Sin preset" },
    { label: "Tipo", value: packTipo === "prueba" ? "Prueba" : "Fondeada" },
    {
      label: "Slots",
      value: `${SLOT_KEYS.filter((slot) => slotAssignments[slot] !== null).length}/3`,
    },
    {
      label: "Activa",
      value: getAccountById(slotAssignments.A)?.alias || "Slot A vacío",
    },
  ];

  const editorSummaryItems = [
    { label: "Preset", value: selectedEditorPresetLabel || "Sin preset" },
    { label: "Tipo", value: editorTipoCuenta === "prueba" ? "Prueba" : "Fondeada" },
    { label: "Estado", value: editorEstado.charAt(0).toUpperCase() + editorEstado.slice(1) },
    { label: "Prop firm", value: selectedEditorPropFirmLabel || "Sin prop firm" },
  ];

  const selectedEditableAccount = editableAccounts.find((account) => account.id === editorAccountId);

  return (
    <div className="space-y-5 text-white">
      <HeroCard summary={summary} />

      <SectionCard
        title="Crear cuenta"
        subtitle="Alta rápida y preasignación opcional a un slot del próximo pack."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <InlinePicker
                label="Preset"
                triggerLabel="Preset"
                options={presetItems}
                selectedValue={presetId}
                open={openControls.preset}
                onToggle={() => toggleControl("preset")}
                onSelect={setPresetId}
              />

              <InlinePicker
                label="Tamaño"
                triggerLabel="Tamaño"
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
                options={propFirmItems}
                selectedValue={propFirmId}
                open={openControls.propfirm}
                onToggle={() => toggleControl("propfirm")}
                onSelect={setPropFirmId}
              />
            </div>

            <div>
              <MiniLabel>Tipo de cuenta</MiniLabel>
              <TypeSwitch value={tipoCuenta} onChange={setTipoCuenta} />
            </div>
          </div>

          <div className="space-y-4">
            <SummaryCard items={accountSummaryItems} />

            <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
              <MiniLabel>Preasignar a nuevo pack</MiniLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {SLOT_KEYS.map((slot) => (
                  <GlowOptionButton
                    key={slot}
                    label={`Slot ${slot}`}
                    active={preassignSlot === slot}
                    onClick={() =>
                      setPreassignSlot((prev) => (prev === slot ? null : slot))
                    }
                  />
                ))}
              </div>
            </div>

            <FeedbackBox feedback={feedback} />

            <div className="flex justify-end">
              <PrimaryButton onClick={crearCuenta} disabled={saving}>
                {saving ? "Creando..." : "Crear cuenta"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Crear pack"
        subtitle="Asignación compacta de slots, con foco en preset, tipo y cuenta activa."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
              <div>
                <MiniLabel>Nombre del pack</MiniLabel>
                <CompactInput
                  value={packNombre}
                  onChange={setPackNombre}
                  placeholder="Ej. Pack 1 Fernet"
                />
              </div>

              <InlinePicker
                label="Preset"
                triggerLabel="Preset"
                options={presetItems}
                selectedValue={packPresetId}
                open={openControls.packPreset}
                onToggle={() => toggleControl("packPreset")}
                onSelect={setPackPresetId}
              />
            </div>

            <div>
              <MiniLabel>Tipo del pack</MiniLabel>
              <TypeSwitch value={packTipo} onChange={setPackTipo} />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {SLOT_KEYS.map((slot) => (
                <div
                  key={slot}
                  className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Slot {slot}</p>
                    {slot === "A" ? (
                      <span className="rounded-full border border-sky-300/20 bg-sky-300/[0.10] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-sky-100">
                        Activa
                      </span>
                    ) : null}
                  </div>

                  <SlotAssignmentPicker
                    label=""
                    triggerLabel={`Elegir ${slot}`}
                    options={getSlotOptions(slot)}
                    selectedValue={slotAssignments[slot] ?? 0}
                    open={openControls[`slot${slot}`]}
                    onToggle={() => toggleControl(`slot${slot}`)}
                    onSelect={(value) => setSlotAccount(slot, Number(value))}
                  />

                  <div className="mt-3 rounded-[14px] border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Cuenta
                    </p>
                    <p className="mt-2 truncate text-sm font-medium text-white">
                      {getAccountById(slotAssignments[slot])?.alias || "Vacío"}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {getAccountById(slotAssignments[slot])?.numero_cuenta || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SummaryCard items={packSummaryItems} />
            <FeedbackBox feedback={packFeedback} />

            <div className="flex justify-end">
              <PrimaryButton onClick={crearPack} disabled={savingPack}>
                {savingPack ? "Creando..." : "Crear pack"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Editar packs"
        subtitle="Quita cuentas de slots, asigna cuentas libres, cambia el slot activo y controla pendientes de reemplazo."
      >
        <div className="space-y-4">
          <FeedbackBox feedback={packsEditorFeedback} />

          {loadingPacks ? (
            <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-400">
              Cargando packs...
            </div>
          ) : controlPacks.length === 0 ? (
            <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-zinc-400">
              No hay packs disponibles.
            </div>
          ) : (
            controlPacks.map((pack) => (
              <div
                key={pack.id}
                className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_34px_rgba(0,0,0,0.18)]"
              >
                <div className="mb-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pack.nombre}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                        Preset: {pack.presets?.nombre || "-"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                        Tipo: {pack.tipo_pack}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  {pack.pack_slots
                    .slice()
                    .sort((a, b) => a.orden - b.orden)
                    .map((slot) => {
                      const slotKey = getSlotKey(pack.id, slot.id);
                      const availableForThisPack = getAssignableAccountsForPack(pack);
                      const selectedFreeAccount = slotAccountSelections[slotKey] || "";
                      const isActing = actingSlotKey === slotKey;

                      return (
                        <div
                          key={slot.id}
                          className={`rounded-[18px] border p-3 ${
                            slot.es_activa
                              ? "border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.03))]"
                              : slot.pendiente_reemplazo
                              ? "border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.10),rgba(251,191,36,0.03))]"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                                Slot {slot.slot}
                              </p>
                              <p className="mt-1 text-sm font-medium text-white">
                                {slot.accounts?.alias || "Vacío"}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">
                                {slot.accounts?.numero_cuenta || "-"}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                                  slot.es_activa
                                    ? "border-sky-300/20 bg-sky-300/[0.10] text-sky-100"
                                    : "border-white/10 bg-white/[0.04] text-zinc-300"
                                }`}
                              >
                                {slot.es_activa ? "Activa" : "Inactiva"}
                              </span>

                              {slot.pendiente_reemplazo ? (
                                <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.10] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-100">
                                  Pendiente
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-[14px] border border-white/8 bg-black/20 p-3">
                              <MiniLabel>Asignar cuenta libre</MiniLabel>

                              <CompactSelect
                                value={selectedFreeAccount}
                                onChange={(value) =>
                                  setSlotAccountSelections((prev) => ({
                                    ...prev,
                                    [slotKey]: value,
                                  }))
                                }
                              >
                                <option value="">Selecciona una cuenta libre</option>
                                {availableForThisPack.map((account) => (
                                  <option key={account.id} value={String(account.id)}>
                                    {buildAccountLabel(account)}
                                  </option>
                                ))}
                              </CompactSelect>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <PrimaryButton
                                  disabled={!selectedFreeAccount || isActing}
                                  onClick={() =>
                                    void ejecutarAccionSlot(
                                      {
                                        action: "assign",
                                        packId: pack.id,
                                        slotId: slot.id,
                                        accountId: Number(selectedFreeAccount),
                                      },
                                      `Cuenta asignada al slot ${slot.slot} de ${pack.nombre}.`
                                    )
                                  }
                                >
                                  Asignar al slot
                                </PrimaryButton>

                                <DangerButton
                                  disabled={!slot.accounts?.id || isActing}
                                  onClick={() =>
                                    void ejecutarAccionSlot(
                                      {
                                        action: "remove",
                                        packId: pack.id,
                                        slotId: slot.id,
                                      },
                                      `Cuenta quitada del slot ${slot.slot} de ${pack.nombre}.`
                                    )
                                  }
                                >
                                  Quitar cuenta
                                </DangerButton>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              <PrimaryButton
                                disabled={!slot.accounts?.id || slot.es_activa || isActing}
                                onClick={() =>
                                  void ejecutarAccionSlot(
                                    {
                                      action: "set_active",
                                      packId: pack.id,
                                      slotId: slot.id,
                                    },
                                    `Slot ${slot.slot} marcado como activo en ${pack.nombre}.`
                                  )
                                }
                              >
                                Marcar activa
                              </PrimaryButton>

                              <PrimaryButton
                                disabled={isActing}
                                onClick={() =>
                                  void ejecutarAccionSlot(
                                    {
                                      action: "toggle_pending",
                                      packId: pack.id,
                                      slotId: slot.id,
                                      pendiente: !slot.pendiente_reemplazo,
                                    },
                                    slot.pendiente_reemplazo
                                      ? `Pendiente de reemplazo quitado en ${pack.nombre}, slot ${slot.slot}.`
                                      : `Pendiente de reemplazo activado en ${pack.nombre}, slot ${slot.slot}.`
                                  )
                                }
                              >
                                {slot.pendiente_reemplazo
                                  ? "Quitar pendiente"
                                  : "Marcar pendiente"}
                              </PrimaryButton>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Editor de cuentas"
        subtitle="Edición rápida de cuenta, estado operativo, visibilidad en filtros y borrado seguro."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[320px] flex-1">
                <InlinePicker
                  label="Seleccionar cuenta"
                  triggerLabel="Cuenta"
                  options={editorAccountItems}
                  selectedValue={editorAccountId}
                  open={openControls.editorAccount}
                  onToggle={() => toggleControl("editorAccount")}
                  onSelect={(value) => setEditorAccountId(Number(value))}
                />
              </div>

              <GlowOptionButton
                label={showAllEditorAccounts ? "Mostrar solo activas" : "Mostrar todas"}
                active={showAllEditorAccounts}
                onClick={() => setShowAllEditorAccounts((prev) => !prev)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div>
                <MiniLabel>Alias</MiniLabel>
                <CompactInput
                  value={editorAlias}
                  onChange={setEditorAlias}
                  placeholder="Alias"
                />
              </div>

              <div>
                <MiniLabel>Número de cuenta</MiniLabel>
                <CompactInput
                  value={editorNumeroCuenta}
                  onChange={setEditorNumeroCuenta}
                  placeholder="Número de cuenta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <InlinePicker
                label="Preset"
                triggerLabel="Preset"
                options={presetItems}
                selectedValue={editorPresetId}
                open={openControls.editorPreset}
                onToggle={() => toggleControl("editorPreset")}
                onSelect={setEditorPresetId}
              />

              <InlinePicker
                label="Tamaño"
                triggerLabel="Tamaño"
                options={ACCOUNT_SIZES.map((size) => ({
                  value: size,
                  label: size,
                }))}
                selectedValue={editorAccountSize}
                open={openControls.editorSize}
                onToggle={() => toggleControl("editorSize")}
                onSelect={(value) => setEditorAccountSize(value as AccountSizeOption)}
              />

              <InlinePicker
                label="Prop firm"
                triggerLabel="Prop firm"
                options={propFirmItems}
                selectedValue={editorPropFirmId}
                open={openControls.editorPropFirm}
                onToggle={() => toggleControl("editorPropFirm")}
                onSelect={setEditorPropFirmId}
              />
            </div>

            <div>
              <MiniLabel>Tipo de cuenta</MiniLabel>
              <TypeSwitch value={editorTipoCuenta} onChange={setEditorTipoCuenta} />
            </div>

            <div>
              <MiniLabel>Activa en filtros</MiniLabel>
              <div className="flex flex-wrap gap-2">
                <GlowOptionButton
                  label="Sí"
                  active={editorActivaEnFiltros}
                  onClick={() => setEditorActivaEnFiltros(true)}
                />
                <GlowOptionButton
                  label="No"
                  active={!editorActivaEnFiltros}
                  onClick={() => setEditorActivaEnFiltros(false)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <MiniLabel>Estado</MiniLabel>
              <EstadoSwitch value={editorEstado} onChange={setEditorEstado} />
            </div>

            <SummaryCard items={editorSummaryItems} />

            {selectedEditableAccount ? (
              <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedEditorAccountLabel || "Cuenta seleccionada"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Fechas relevantes de la cuenta.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Inicio
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {selectedEditableAccount.fecha_inicio || "-"}
                    </p>
                  </div>

                  <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Fondeo
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {selectedEditableAccount.fecha_fondeo || "-"}
                    </p>
                  </div>

                  <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Pérdida
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {selectedEditableAccount.fecha_perdida || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <FeedbackBox feedback={editorFeedback} />

            <div className="flex flex-wrap justify-end gap-2">
              <DangerButton
                onClick={eliminarCuenta}
                disabled={deletingAccount || savingEditor || !editorAccountId}
              >
                {deletingAccount ? "Eliminando..." : "Eliminar cuenta"}
              </DangerButton>

              <PrimaryButton
                onClick={guardarEdicionCuenta}
                disabled={savingEditor || deletingAccount || !editorAccountId}
              >
                {savingEditor ? "Guardando..." : "Guardar cambios"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}