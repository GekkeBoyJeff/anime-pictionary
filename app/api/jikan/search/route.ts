import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/jikan/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ success: true, data: [] });
  }
  if (query.length > 100) {
    return NextResponse.json(
      { success: false, error: "Query too long" },
      { status: 400 }
    );
  }

  try {
    const results = await searchAnime(query);
    const slim = results.map((anime) => ({
      mal_id: anime.mal_id,
      title: anime.title,
      title_english: anime.title_english,
      year: anime.year,
      image_url:
        anime.images.jpg.image_url ?? anime.images.webp.image_url ?? null,
    }));
    return NextResponse.json({ success: true, data: slim });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
