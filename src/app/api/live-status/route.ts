import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type UpstreamLiveStatusItem = {
  preset?: string;
  balance?: number | null;
  equity?: number | null;
  account_size_inferred?: number | null;
  pnl_realizado_hoy?: number | null;
  pnl_abierto?: number | null;
  pnl_actual?: number | null;
  pnl_hoy_usd?: number | null;
  pnl_pct_actual?: number | null;
  pnl_hoy_pct?: number | null;
  profit_total_pct?: number | null;
  profit_total_pct_current?: number | null;
  trades_abiertos?: number | null;
  error?: string;
};

type UpstreamResponse = Record<string, UpstreamLiveStatusItem>;

type AccountRow = {
  numero_cuenta: string | null;
  account_size: string | null;
};

function getBaseUrl() {
  const raw =
    process.env.LIVE_STATUS_SERVER_URL ||
    process.env.NEXT_PUBLIC_LIVE_STATUS_SERVER_URL ||
    "";

  return raw.trim().replace(/\/+$/, "");
}

function parseAccountSize(value: string | null | undefined): number | null {
  const text = String(value || "").trim().toUpperCase().replace(/\s+/g, "");

  if (!text) return null;

  if (text.endsWith("K")) {
    const raw = Number(text.slice(0, -1));
    if (Number.isFinite(raw) && raw > 0) {
      return raw * 1000;
    }
    return null;
  }

  const raw = Number(text);
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }

  return null;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function GET() {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return NextResponse.json({
      ok: true,
      liveAvailable: false,
      error: "Falta LIVE_STATUS_SERVER_URL",
      data: {},
    });
  }

  const upstreamUrl = `${baseUrl}/live-status`;

  try {
    const [upstreamResponse, accountsResponse] = await Promise.all([
      fetch(upstreamUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }),
      supabaseAdmin
        .from("accounts")
        .select("numero_cuenta, account_size"),
    ]);

    if (!upstreamResponse.ok) {
      return NextResponse.json({
        ok: true,
        liveAvailable: false,
        error: `Upstream live-status respondió ${upstreamResponse.status}`,
        data: {},
      });
    }

    if (accountsResponse.error) {
      return NextResponse.json({
        ok: true,
        liveAvailable: false,
        error: accountsResponse.error.message,
        data: {},
      });
    }

    const upstreamJson = (await upstreamResponse.json()) as UpstreamResponse;
    const accounts = (accountsResponse.data ?? []) as AccountRow[];

    const accountSizeMap = new Map<string, number>();

    for (const account of accounts) {
      if (!account.numero_cuenta) continue;
      const parsedSize = parseAccountSize(account.account_size);
      if (parsedSize) {
        accountSizeMap.set(account.numero_cuenta, parsedSize);
      }
    }

    const data: Record<string, UpstreamLiveStatusItem> = {};

    for (const [accountNumber, item] of Object.entries(upstreamJson ?? {})) {
      if (!item || typeof item !== "object") continue;

      const balance =
        typeof item.balance === "number" && !Number.isNaN(item.balance)
          ? item.balance
          : null;

      const pnlHoyUsd =
        typeof item.pnl_hoy_usd === "number" && !Number.isNaN(item.pnl_hoy_usd)
          ? item.pnl_hoy_usd
          : null;

      const upstreamAccountSize =
        typeof item.account_size_inferred === "number" &&
        !Number.isNaN(item.account_size_inferred) &&
        item.account_size_inferred > 0
          ? item.account_size_inferred
          : null;

      const dbAccountSize = accountSizeMap.get(accountNumber) ?? null;
      const resolvedAccountSize = upstreamAccountSize ?? dbAccountSize;

      let pnlHoyPct =
        typeof item.pnl_hoy_pct === "number" && !Number.isNaN(item.pnl_hoy_pct)
          ? item.pnl_hoy_pct
          : null;

      let pnlPctActual =
        typeof item.pnl_pct_actual === "number" && !Number.isNaN(item.pnl_pct_actual)
          ? item.pnl_pct_actual
          : null;

      let profitTotalPct =
        typeof item.profit_total_pct === "number" && !Number.isNaN(item.profit_total_pct)
          ? item.profit_total_pct
          : null;

      let profitTotalPctCurrent =
        typeof item.profit_total_pct_current === "number" &&
        !Number.isNaN(item.profit_total_pct_current)
          ? item.profit_total_pct_current
          : null;

      if (resolvedAccountSize && resolvedAccountSize > 0) {
        if (pnlHoyPct === null && pnlHoyUsd !== null) {
          pnlHoyPct = round((pnlHoyUsd / resolvedAccountSize) * 100, 4);
        }

        if (pnlPctActual === null && pnlHoyUsd !== null) {
          pnlPctActual = round((pnlHoyUsd / resolvedAccountSize) * 100, 4);
        }

        if (profitTotalPct === null && balance !== null) {
          profitTotalPct = round(((balance - resolvedAccountSize) / resolvedAccountSize) * 100, 4);
        }

        if (profitTotalPctCurrent === null && balance !== null) {
          profitTotalPctCurrent = round(((balance - resolvedAccountSize) / resolvedAccountSize) * 100, 4);
        }
      }

      data[accountNumber] = {
        preset: item.preset ?? undefined,
        balance,
        equity:
          typeof item.equity === "number" && !Number.isNaN(item.equity)
            ? item.equity
            : null,
        account_size_inferred: resolvedAccountSize,
        pnl_realizado_hoy:
          typeof item.pnl_realizado_hoy === "number" && !Number.isNaN(item.pnl_realizado_hoy)
            ? item.pnl_realizado_hoy
            : null,
        pnl_abierto:
          typeof item.pnl_abierto === "number" && !Number.isNaN(item.pnl_abierto)
            ? item.pnl_abierto
            : null,
        pnl_actual:
          typeof item.pnl_actual === "number" && !Number.isNaN(item.pnl_actual)
            ? item.pnl_actual
            : null,
        pnl_hoy_usd: pnlHoyUsd,
        pnl_pct_actual: pnlPctActual,
        pnl_hoy_pct: pnlHoyPct,
        profit_total_pct: profitTotalPct,
        profit_total_pct_current: profitTotalPctCurrent,
        trades_abiertos:
          typeof item.trades_abiertos === "number" && !Number.isNaN(item.trades_abiertos)
            ? item.trades_abiertos
            : null,
        error: item.error ?? undefined,
      };
    }

    return NextResponse.json({
      ok: true,
      liveAvailable: true,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json({
      ok: true,
      liveAvailable: false,
      error: message,
      data: {},
    });
  }
}