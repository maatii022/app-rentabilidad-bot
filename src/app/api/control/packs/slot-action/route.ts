import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type SlotActionBody = {
  action?: "assign" | "remove" | "set_active" | "toggle_pending";
  packId?: number;
  slotId?: number;
  accountId?: number;
  pendiente?: boolean;
};

function parseErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SlotActionBody;

    const action = body.action;
    const packId = Number(body.packId);
    const slotId = Number(body.slotId);
    const accountId =
      typeof body.accountId === "number" && Number.isFinite(body.accountId)
        ? body.accountId
        : null;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Falta action" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(packId) || packId <= 0) {
      return NextResponse.json(
        { ok: false, error: "packId inválido" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(slotId) || slotId <= 0) {
      return NextResponse.json(
        { ok: false, error: "slotId inválido" },
        { status: 400 }
      );
    }

    const { data: pack, error: packError } = await supabaseAdmin
      .from("packs")
      .select("id, preset_id, tipo_pack")
      .eq("id", packId)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { ok: false, error: "No se encontró el pack" },
        { status: 404 }
      );
    }

    const { data: slot, error: slotError } = await supabaseAdmin
      .from("pack_slots")
      .select("id, pack_id, slot, orden, es_activa, pendiente_reemplazo, account_id")
      .eq("id", slotId)
      .eq("pack_id", packId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { ok: false, error: "No se encontró el slot" },
        { status: 404 }
      );
    }

    const { data: packSlots, error: packSlotsError } = await supabaseAdmin
      .from("pack_slots")
      .select("id, pack_id, slot, orden, es_activa, pendiente_reemplazo, account_id")
      .eq("pack_id", packId)
      .order("orden", { ascending: true });

    if (packSlotsError || !packSlots) {
      return NextResponse.json(
        { ok: false, error: "No se pudieron cargar los slots del pack" },
        { status: 500 }
      );
    }

    if (action === "assign") {
      if (!accountId || accountId <= 0) {
        return NextResponse.json(
          { ok: false, error: "Debes indicar una cuenta para asignar" },
          { status: 400 }
        );
      }

      if (slot.account_id) {
        return NextResponse.json(
          { ok: false, error: "Este slot ya tiene una cuenta asignada, quítala antes de asignar otra" },
          { status: 400 }
        );
      }

      const { data: accountInAnyPack, error: accountInAnyPackError } = await supabaseAdmin
        .from("pack_slots")
        .select("id")
        .eq("account_id", accountId)
        .maybeSingle();

      if (accountInAnyPackError) {
        return NextResponse.json(
          { ok: false, error: accountInAnyPackError.message },
          { status: 500 }
        );
      }

      if (accountInAnyPack) {
        return NextResponse.json(
          { ok: false, error: "La cuenta seleccionada ya está asignada a un pack" },
          { status: 400 }
        );
      }

      const { data: account, error: accountError } = await supabaseAdmin
        .from("accounts")
        .select("id, estado")
        .eq("id", accountId)
        .single();

      if (accountError || !account) {
        return NextResponse.json(
          { ok: false, error: "No se encontró la cuenta" },
          { status: 404 }
        );
      }

      const { error: updateAccountError } = await supabaseAdmin
        .from("accounts")
        .update({
          preset_id: pack.preset_id,
          tipo_cuenta: pack.tipo_pack,
          activa_en_filtros: true,
        })
        .eq("id", accountId);

      if (updateAccountError) {
        return NextResponse.json(
          { ok: false, error: updateAccountError.message },
          { status: 500 }
        );
      }

      const hasActiveSlot = packSlots.some((item) => item.es_activa && item.account_id);

      const { error: updateSlotError } = await supabaseAdmin
        .from("pack_slots")
        .update({
          account_id: accountId,
          pendiente_reemplazo: false,
          es_activa: hasActiveSlot ? slot.es_activa : true,
        })
        .eq("id", slotId);

      if (updateSlotError) {
        return NextResponse.json(
          { ok: false, error: updateSlotError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      const currentAccountId = slot.account_id;

      const { error: clearSlotError } = await supabaseAdmin
        .from("pack_slots")
        .update({
          account_id: null,
          pendiente_reemplazo: false,
          es_activa: false,
        })
        .eq("id", slotId);

      if (clearSlotError) {
        return NextResponse.json(
          { ok: false, error: clearSlotError.message },
          { status: 500 }
        );
      }

      if (slot.es_activa) {
        const nextActive = packSlots.find(
          (item) => item.id !== slotId && item.account_id
        );

        if (nextActive) {
          const { error: deactivateAllError } = await supabaseAdmin
            .from("pack_slots")
            .update({ es_activa: false })
            .eq("pack_id", packId);

          if (deactivateAllError) {
            return NextResponse.json(
              { ok: false, error: deactivateAllError.message },
              { status: 500 }
            );
          }

          const { error: activateNextError } = await supabaseAdmin
            .from("pack_slots")
            .update({ es_activa: true })
            .eq("id", nextActive.id);

          if (activateNextError) {
            return NextResponse.json(
              { ok: false, error: activateNextError.message },
              { status: 500 }
            );
          }
        }
      }

      if (currentAccountId) {
        const { error: releaseAccountError } = await supabaseAdmin
          .from("accounts")
          .update({
            activa_en_filtros: true,
          })
          .eq("id", currentAccountId);

        if (releaseAccountError) {
          return NextResponse.json(
            { ok: false, error: releaseAccountError.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "set_active") {
      if (!slot.account_id) {
        return NextResponse.json(
          { ok: false, error: "No puedes activar un slot vacío" },
          { status: 400 }
        );
      }

      const { error: deactivateAllError } = await supabaseAdmin
        .from("pack_slots")
        .update({ es_activa: false })
        .eq("pack_id", packId);

      if (deactivateAllError) {
        return NextResponse.json(
          { ok: false, error: deactivateAllError.message },
          { status: 500 }
        );
      }

      const { error: activateSlotError } = await supabaseAdmin
        .from("pack_slots")
        .update({ es_activa: true })
        .eq("id", slotId);

      if (activateSlotError) {
        return NextResponse.json(
          { ok: false, error: activateSlotError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_pending") {
      const pendiente = Boolean(body.pendiente);

      const { error: pendingError } = await supabaseAdmin
        .from("pack_slots")
        .update({
          pendiente_reemplazo: pendiente,
        })
        .eq("id", slotId);

      if (pendingError) {
        return NextResponse.json(
          { ok: false, error: pendingError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Acción no soportada" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: parseErrorMessage(error, "Error inesperado"),
      },
      { status: 500 }
    );
  }
}