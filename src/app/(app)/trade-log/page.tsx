import { Suspense } from "react";
import TradeLogClient from "./TradeLogClient";

export const dynamic = "force-dynamic";

export default function TradeLogPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-white">
          <section className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:p-5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Registro operativo
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-[2rem]">
                Trade Log
              </h1>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.01))] p-6 shadow-[0_18px_38px_rgba(0,0,0,0.20)]">
            <p className="text-sm text-zinc-400">Cargando trade log...</p>
          </section>
        </div>
      }
    >
      <TradeLogClient />
    </Suspense>
  );
}