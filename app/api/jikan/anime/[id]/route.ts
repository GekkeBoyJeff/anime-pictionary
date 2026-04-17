import { NextResponse } from "next/server";
import { getAnimeById } from "@/lib/jikan/client";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const malId = Number.parseInt(id, 10);

  if (!Number.isFinite(malId) || malId <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid mal_id" },
      { status: 400 }
    );
  }

  try {
    const anime = await getAnimeById(malId);
    return NextResponse.json({ success: true, data: anime });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
