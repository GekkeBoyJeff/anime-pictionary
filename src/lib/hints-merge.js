/*
 * Hint merge layer.
 *
 * The player flow needs a single MergedHint shape regardless of where the
 * data comes from:
 *   1. Baseline custom-hints.js (always available, in bundle)
 *   2. Supabase custom_anime_hints table (optional, admin-added)
 *   3. Offline catalog (cover art + title for any entry)
 *
 * Supabase overrides baseline; both use catalog for cover art and MAL metadata
 * (year, tags). If a randomizer lands on a title without hints, we still render
 * three generic placeholder prompts so the round can proceed.
 */

import { findInCatalog } from "./catalog.js";
import { findCustomHint } from "../data/custom-hints.js";
import { supabase } from "./supabase.js";

/**
 * @typedef {object} MergedHint
 * @property {number}   mal_id
 * @property {string}   title
 * @property {[string, string, string]} hints
 * @property {string | null} picture
 * @property {string[]} tags
 * @property {number | null} year
 * @property {"baseline" | "supabase" | "catalog"} source
 */

const fetchSupabaseHint = async (malId) => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from("custom_anime_hints")
            .select("*")
            .eq("mal_id", malId)
            .maybeSingle();
        if (error || !data) return null;
        return data;
    } catch {
        return null;
    }
};

/**
 * Resolve a MergedHint for a specific MAL id, given an already-loaded catalog.
 * Preference order: Supabase > baseline JS > catalog-only fallback.
 */
export const resolveHint = async (malId, catalog) => {
    const catalogEntry = findInCatalog(catalog, malId);

    const supabaseRow = await fetchSupabaseHint(malId);
    if (supabaseRow) {
        return {
            mal_id: supabaseRow.mal_id,
            title: supabaseRow.title ?? catalogEntry?.title ?? "Onbekend",
            hints: [supabaseRow.hint_1, supabaseRow.hint_2, supabaseRow.hint_3],
            picture: catalogEntry?.picture ?? supabaseRow.image_url ?? null,
            tags: catalogEntry?.tags ?? [],
            year: catalogEntry?.year ?? null,
            source: "supabase",
        };
    }

    const baseline = findCustomHint(malId);
    if (baseline) {
        return {
            mal_id: baseline.mal_id,
            title: catalogEntry?.title ?? baseline.title,
            hints: baseline.hints,
            picture: catalogEntry?.picture ?? null,
            tags: catalogEntry?.tags ?? [],
            year: catalogEntry?.year ?? null,
            source: "baseline",
        };
    }

    // Catalog-only fallback. Random picks often land here — we invent three
    // generic prompts so the round can still proceed.
    if (catalogEntry) {
        return {
            mal_id: catalogEntry.mal_id,
            title: catalogEntry.title,
            hints: [
                "Een hoofdpersoon",
                "Een wapen of signature item",
                "De titel in Japanse kalligrafie",
            ],
            picture: catalogEntry.picture,
            tags: catalogEntry.tags,
            year: catalogEntry.year,
            source: "catalog",
        };
    }

    return null;
};

/**
 * Fetch all Supabase hints for the admin dashboard list. Failures return an
 * empty array so the admin still sees the baseline series from CUSTOM_HINTS.
 */
export const fetchSupabaseHints = async () => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from("custom_anime_hints")
            .select("*")
            .order("title", { ascending: true });
        if (error) return [];
        return data ?? [];
    } catch {
        return [];
    }
};
