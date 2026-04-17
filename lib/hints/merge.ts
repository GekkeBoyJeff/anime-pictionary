import { getAnimeById } from "@/lib/jikan/client";
import type { JikanAnimeFull, JikanImageSet } from "@/lib/jikan/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  customAnimeHintRowSchema,
  parseHintRowNullable,
  type AnimeCategory,
  type CustomAnimeHintRow,
} from "./schema";

export type { AnimeCategory, CustomAnimeHintRow };

export interface MergedHint {
  malId: number;
  title: string;
  hints: readonly [string, string, string];
  categorie: AnimeCategory;
  cover: {
    src: string;
    breakpoints: Record<string, string>;
  };
  synopsis: string;
  year: number | null;
  characters: { name: string; role: string }[];
}

function buildCoverSources(images: JikanAnimeFull["images"]) {
  const jpg: JikanImageSet = images.jpg;
  return {
    src: jpg.large_image_url ?? jpg.image_url,
    breakpoints: {
      "320": jpg.small_image_url ?? jpg.image_url,
      "768": jpg.image_url,
      "1280": jpg.large_image_url ?? jpg.image_url,
    },
  };
}

export async function fetchHintsByCategory(
  categorie: AnimeCategory
): Promise<CustomAnimeHintRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_anime_hints")
    .select("*")
    .eq("categorie", categorie)
    .order("title", { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return customAnimeHintRowSchema.array().parse(data ?? []);
}

export async function fetchAllHints(): Promise<CustomAnimeHintRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_anime_hints")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return customAnimeHintRowSchema.array().parse(data ?? []);
}

export async function fetchCategoryCounts(): Promise<
  Record<AnimeCategory, number>
> {
  const supabase = await createSupabaseServerClient();
  const categories: AnimeCategory[] = ["Klassieker", "Modern", "Nieuwe Hype"];

  const results = await Promise.all(
    categories.map((categorie) =>
      supabase
        .from("custom_anime_hints")
        .select("*", { count: "exact", head: true })
        .eq("categorie", categorie)
    )
  );

  const counts: Record<AnimeCategory, number> = {
    Klassieker: 0,
    Modern: 0,
    "Nieuwe Hype": 0,
  };
  categories.forEach((cat, i) => {
    const { count, error } = results[i];
    if (error) throw new Error(`Supabase error: ${error.message}`);
    counts[cat] = count ?? 0;
  });
  return counts;
}

export async function getMergedHint(malId: number): Promise<MergedHint | null> {
  const supabase = await createSupabaseServerClient();

  const [{ data: hintData, error: hintErr }, anime] = await Promise.all([
    supabase
      .from("custom_anime_hints")
      .select("*")
      .eq("mal_id", malId)
      .maybeSingle(),
    getAnimeById(malId).catch(() => null),
  ]);

  if (hintErr) throw new Error(`Supabase error: ${hintErr.message}`);
  const row = parseHintRowNullable(hintData);
  if (!row) return null;

  return {
    malId: row.mal_id,
    title: anime?.title ?? row.title,
    hints: [row.hint_1, row.hint_2, row.hint_3] as const,
    categorie: row.categorie,
    cover: anime
      ? buildCoverSources(anime.images)
      : {
          src:
            row.image_url ??
            "https://cdn.myanimelist.net/images/anime/placeholder.jpg",
          breakpoints: {},
        },
    synopsis: anime?.synopsis ?? "",
    year: anime?.year ?? null,
    characters: [],
  };
}

export async function getRandomMalIdByCategory(
  categorie: AnimeCategory
): Promise<number | null> {
  const rows = await fetchHintsByCategory(categorie);
  if (rows.length === 0) return null;
  const pick = rows[Math.floor(Math.random() * rows.length)];
  return pick.mal_id;
}

export async function getRandomMalId(): Promise<number | null> {
  const rows = await fetchAllHints();
  if (rows.length === 0) return null;
  const pick = rows[Math.floor(Math.random() * rows.length)];
  return pick.mal_id;
}
