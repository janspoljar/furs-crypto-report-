import { NextResponse } from "next/server";
import { parseCsvByBroker } from "@/lib/parsers";
import type { BrokerType } from "@/lib/types";
import { runFifo } from "@/lib/fifo";

export async function GET() {
  return NextResponse.json({
    ok: true,
    fifoLoaded: typeof runFifo === "function",
    message: "API route dela",
  });
}