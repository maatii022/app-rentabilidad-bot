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

const ACCOUNT_SIZES: AccountSizeOption[] = ["5K", "10K", "25K", "50K", "100K"];
const SLOT_KEYS: SlotKey[] = ["A", "B", "C"];

function HeroCard() {
  return (
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
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
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

function EstadoSwitch({
  value,
  onChange,
}: {
  value: AccountEstado;
  onChange: (value: AccountEstado) => void;
}) {
  const options: AccountEstado[] = ["activa", "fondeada", "perdida"];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
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
      className={`relative overflow-hidden rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
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

function InlinePicker<T extends string | number>({
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
  options: { value: T; label: string }[];
  selectedValue: T | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T) => void;
}) {
  const hasOptions = options.length > 0;

  return (
    <div>
      {label ? <MiniLabel>{label}</MiniLabel> : null}

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => hasOptions && onToggle()}
            className={`relative shrink-0 overflow-hidden rounded-full border transition-all duration-300 ${
              open
                ? "h-11 w-11 border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.12)]"
                : "h-11 min-w-[116px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
            } ${!hasOptions ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {open ? (
              <div className="flex h-full items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]" />
              </div>
            ) : (
              <div className="flex h-full items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">
                  {triggerLabel}
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/25" />
              </div>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              open ? "max-w-[1400px] max-h-24 opacity-100" : "max-w-0 max-h-0 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="flex flex-wrap gap-2">
              {options.map((option, index) => (
                <GlowOptionButton
                  key={String(option.value)}
                  label={option.label}
                  active={selectedValue === option.value}
                  delayMs={index * 45}
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className={`relative shrink-0 overflow-hidden rounded-full border transition-all duration-300 ${
              open
                ? "h-11 w-11 border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.07))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(56,189,248,0.12)]"
                : "h-11 min-w-[100px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.12)] hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
            }`}
          >
            {open ? (
              <div className="flex h-full items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]" />
              </div>
            ) : (
              <div className="flex h-full items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">
                  {triggerLabel}
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/25" />
              </div>
            )}
          </button>

          {!open ? (
            <GlowOptionButton
              label={selectedLabel}
              active={selectedValue !== 0}
              visible={true}
              delayMs={0}
              onClick={() => onSelect(selectedValue)}
            />
          ) : null}
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-[220px] opacity-100" : "max-h-0 opacity-0"
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
                  delayMs={index * 35}
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
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
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

  const [saving, setSaving] = useState(false);
  const [savingPack, setSavingPack] = useState(false);
  const [savingEditor, setSavingEditor] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );
  const [packFeedback, setPackFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );
  const [editorFeedback, setEditorFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(
    null
  );

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
        setAvailableAccounts(data.availableAccounts || []);
        setEditableAccounts(data.editableAccounts || []);
      } catch {
        setPresets([]);
        setPropFirms([]);
        setAvailableAccounts([]);
        setEditableAccounts([]);
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
          return [...prev, createdAccount].sort((a, b) =>
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
    } catch {
      setEditorFeedback({
        type: "error",
        message: "No se pudo guardar la cuenta.",
      });
    } finally {
      setSavingEditor(false);
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
      <HeroCard />

      <SectionCard title="Crear cuenta">
        <div className="grid items-start grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_740px]">
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
              label="Tamaño de cuenta"
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

          <div className="space-y-4">
            <div>
              <MiniLabel>Tipo de cuenta</MiniLabel>
              <TypeSwitch value={tipoCuenta} onChange={setTipoCuenta} />
            </div>

            <SummaryCard items={accountSummaryItems} />

            <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
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
      </SectionCard>

      <SectionCard title="Crear pack">
        <div className="grid items-start grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_720px]">
          <div className="space-y-5">
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {SLOT_KEYS.map((slot) => (
                <div
                  key={slot}
                  className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]"
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

                  <div className="mt-3 rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
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
            <div>
              <MiniLabel>Tipo del pack</MiniLabel>
              <TypeSwitch value={packTipo} onChange={setPackTipo} />
            </div>

            <SummaryCard items={packSummaryItems} />

            {packFeedback ? (
              <div
                className={`rounded-[20px] border px-4 py-3 text-sm ${
                  packFeedback.type === "ok"
                    ? "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))] text-emerald-100"
                    : "border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.12),rgba(244,63,94,0.04))] text-rose-100"
                }`}
              >
                {packFeedback.message}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={crearPack}
                disabled={savingPack}
                className="h-12 rounded-[18px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] px-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(56,189,248,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-300/30 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.24),rgba(56,189,248,0.10))] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPack ? "Creando..." : "Crear pack"}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Editor de cuentas">
        <div className="grid items-start grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_720px]">
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
              <MiniLabel>Tipo de cuenta</MiniLabel>
              <TypeSwitch value={editorTipoCuenta} onChange={setEditorTipoCuenta} />
            </div>

            <div>
              <MiniLabel>Estado</MiniLabel>
              <EstadoSwitch value={editorEstado} onChange={setEditorEstado} />
            </div>

            <SummaryCard items={editorSummaryItems} />

            {selectedEditableAccount ? (
              <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(0,0,0,0.18)]">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Inicio
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {selectedEditableAccount.fecha_inicio || "-"}
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Fondeo
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {selectedEditableAccount.fecha_fondeo || "-"}
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3">
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

            {editorFeedback ? (
              <div
                className={`rounded-[20px] border px-4 py-3 text-sm ${
                  editorFeedback.type === "ok"
                    ? "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))] text-emerald-100"
                    : "border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.12),rgba(244,63,94,0.04))] text-rose-100"
                }`}
              >
                {editorFeedback.message}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={guardarEdicionCuenta}
                disabled={savingEditor || !editorAccountId}
                className="h-12 rounded-[18px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] px-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_rgba(56,189,248,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-300/30 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.24),rgba(56,189,248,0.10))] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEditor ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}