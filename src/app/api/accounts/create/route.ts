import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SlotKey = "A" | "B" | "C";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      presetId,
      tipoPack,
      slotAssignments,
    }: {
      nombre?: string;
      presetId?: number | string;
      tipoPack?: "prueba" | "fondeada";
      slotAssignments?: Partial<Record<SlotKey, number | null>>;
    } = body;

    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: "El nombre del pack es obligatorio." }, { status: 400 });
    }

    if (!presetId) {
      return NextResponse.json({ error: "El preset es obligatorio." }, { status: 400 });
    }

    if (tipoPack !== "prueba" && tipoPack !== "fondeada") {
      return NextResponse.json({ error: "El tipo de pack no es válido." }, { status: 400 });
    }

    const normalizedAssignments: Record<SlotKey, number | null> = {
      A: slotAssignments?.A ? Number(slotAssignments.A) : null,
      B: slotAssignments?.B ? Number(slotAssignments.B) : null,
      C: slotAssignments?.C ? Number(slotAssignments.C) : null,
    };

    const assignedIds = Object.values(normalizedAssignments).filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value)
    );

    const uniqueAssignedIds = new Set(assignedIds);

    if (uniqueAssignedIds.size !== assignedIds.length) {
      return NextResponse.json(
        { error: "No puedes asignar la misma cuenta a varios slots." },
        { status: 400 }
      );
    }

    if (assignedIds.length > 0) {
      const { data: existingAssignments, error: existingAssignmentsError } = await supabaseAdmin
        .from("pack_slots")
        .select("account_id")
        .in("account_id", assignedIds);

      if (existingAssignmentsError) {
        return NextResponse.json(
          { error: existingAssignmentsError.message },
          { status: 500 }
        );
      }

      if ((existingAssignments || []).length > 0) {
        return NextResponse.json(
          { error: "Una o más cuentas ya están asignadas a otro pack." },
          { status: 400 }
        );
      }
    }

    const { data: packInserted, error: packError } = await supabaseAdmin
      .from("packs")
      .insert({
        nombre: String(nombre).trim(),
        preset_id: Number(presetId),
        tipo_pack: tipoPack,
        activo: true,
      })
      .select("id")
      .single();

    if (packError || !packInserted) {
      return NextResponse.json(
        { error: packError?.message || "No se pudo crear el pack." },
        { status: 500 }
      );
    }

    const packId = packInserted.id;

    const slotsPayload = [
      {
        pack_id: packId,
        slot: "A",
        account_id: normalizedAssignments.A,
        es_activa: true,
        pendiente_reemplazo: false,
        orden: 1,
      },
      {
        pack_id: packId,
        slot: "B",
        account_id: normalizedAssignments.B,
        es_activa: false,
        pendiente_reemplazo: false,
        orden: 2,
      },
      {
        pack_id: packId,
        slot: "C",
        account_id: normalizedAssignments.C,
        es_activa: false,
        pendiente_reemplazo: false,
        orden: 3,
      },
    ];

    const { error: slotsError } = await supabaseAdmin.from("pack_slots").insert(slotsPayload);

    if (slotsError) {
      await supabaseAdmin.from("packs").delete().eq("id", packId);

      return NextResponse.json(
        { error: slotsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      packId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}