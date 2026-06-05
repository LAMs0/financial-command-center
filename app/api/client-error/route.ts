import { NextResponse } from "next/server";
import { notifyMonitoring } from "@/lib/logger";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    payload = { message: "Invalid client error payload" };
  }

  await notifyMonitoring("client.error", new Error("Client error reported"), {
    payload,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
