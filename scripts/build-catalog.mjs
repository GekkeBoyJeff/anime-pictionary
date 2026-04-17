#!/usr/bin/env node
/*
 * Build script for the offline anime catalog.
 *
 * WHAT this does:
 *   - Downloads manami-project's anime-offline-database.
 *   - Keeps TV/MOVIE/ONA/OVA/SPECIAL entries that have a MAL id.
 *   - Enriches each entry with AniList GraphQL data (by MAL id):
 *       * title_english — for UI display + search match
 *       * popularity    — user-tracking count, used as ranking signal
 *       * score         — average community score (0-100)
 *   - Writes public/anime-catalog.json, sorted by popularity so the JSON
 *     diff stays stable between runs.
 *
 * WHY AniList enrichment:
 *   - Manami has no popularity signal → niche series clutter search results.
 *   - Manami's primary `title` is romaji → users typing English titles
 *     often miss.
 *   - AniList's batch-by-MAL-id GraphQL gets 50 entries per request, so
 *     enrichment for 30k entries takes ~8 minutes instead of Jikan's hours.
 *
 * HOW to run:
 *   - `npm run catalog` — ~8-10 minutes over a good connection.
 *   - The JSON is committed to git so CI re-downloads nothing.
 *
 * NEXT STEPS if needed:
 *   - If AniList blocks the scraper IP (they rarely do), add a User-Agent
 *     header identifying the project + a backup via Kitsu's REST API.
 *   - To speed up dev iteration without re-enriching, persist
 *     public/anilist-cache.json and only fetch missing ids on subsequent
 *     runs.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RELEASE_API =
    "https://api.github.com/repos/manami-project/anime-offline-database/releases/latest";
const ASSET_NAME = "anime-offline-database-minified.json";
const OUTPUT_PATH = resolve(__dirname, "..", "public", "anime-catalog.json");

const ANILIST_ENDPOINT = "https://graphql.anilist.co/";
const ANILIST_BATCH_SIZE = 50;
// AniList's rate limit is 90 requests/minute. 700ms between requests keeps
// us under with headroom (actual pace ≈ 85 requests/minute).
const ANILIST_DELAY_MS = 700;

const KEEP_TYPES = new Set(["TV", "MOVIE", "ONA", "OVA", "SPECIAL"]);

const extractMalId = (anime) => {
    const mal = (anime.sources ?? []).find((s) =>
        s.startsWith("https://myanimelist.net/anime/")
    );
    if (!mal) return null;
    const match = mal.match(/\/anime\/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : null;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch AniList metadata for up to `ANILIST_BATCH_SIZE` MAL ids in one
 * request. Returns a Map keyed on MAL id. Failures resolve to an empty Map
 * so the caller can keep going without aborting the whole build.
 */
const fetchAniListBatch = async (malIds) => {
    const query = `
        query ($ids: [Int]) {
            Page(page: 1, perPage: ${ANILIST_BATCH_SIZE}) {
                media(idMal_in: $ids, type: ANIME) {
                    idMal
                    title { english romaji }
                    popularity
                    averageScore
                }
            }
        }
    `;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(ANILIST_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "anime-pictionary-build-script (github.com/GekkeBoyJeff/anime-pictionary)",
                },
                body: JSON.stringify({ query, variables: { ids: malIds } }),
            });

            if (res.status === 429) {
                // Rate limited — back off harder.
                await sleep(5000 * (attempt + 1));
                continue;
            }
            if (!res.ok) {
                await sleep(1000);
                continue;
            }

            const json = await res.json();
            const items = json?.data?.Page?.media ?? [];
            const out = new Map();
            for (const m of items) {
                if (m?.idMal) out.set(m.idMal, m);
            }
            return out;
        } catch {
            await sleep(1500);
        }
    }
    return new Map();
};

const main = async () => {
    console.log("→ Resolving latest manami release…");
    const releaseRes = await fetch(RELEASE_API, {
        headers: { Accept: "application/vnd.github+json" },
    });
    if (!releaseRes.ok) {
        throw new Error(`Release lookup failed: HTTP ${releaseRes.status}`);
    }
    const release = await releaseRes.json();
    const asset = (release.assets ?? []).find((a) => a.name === ASSET_NAME);
    if (!asset) {
        throw new Error(`Asset ${ASSET_NAME} not found in release ${release.tag_name}`);
    }
    console.log(`   tag: ${release.tag_name}`);

    console.log("→ Downloading manami-project catalog…");
    const res = await fetch(asset.browser_download_url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const raw = await res.json();
    const source = Array.isArray(raw?.data) ? raw.data : [];
    console.log(`   ${source.length.toLocaleString("en-US")} entries fetched`);

    const filtered = source.filter((anime) => {
        if (!anime?.title) return false;
        if (!KEEP_TYPES.has(anime.type)) return false;
        if (!extractMalId(anime)) return false;
        return true;
    });
    console.log(
        `   ${filtered.length.toLocaleString("en-US")} pass the type + MAL-id filter`
    );

    const catalog = filtered.map((anime) => ({
        mal_id: extractMalId(anime),
        title: anime.title,
        synonyms: (anime.synonyms ?? []).slice(0, 6),
        type: anime.type,
        episodes: anime.episodes ?? null,
        status: anime.status,
        year: anime.animeSeason?.year ?? null,
        season: anime.animeSeason?.season ?? null,
        picture: anime.picture ?? null,
        thumbnail: anime.thumbnail ?? null,
        tags: anime.tags ?? [],
        // Placeholders — AniList enrichment fills these in below.
        title_english: null,
        popularity: null,
        score: null,
    }));

    console.log(`→ Enriching with AniList (batches of ${ANILIST_BATCH_SIZE})…`);
    const total = catalog.length;
    let enriched = 0;
    let hits = 0;

    for (let i = 0; i < total; i += ANILIST_BATCH_SIZE) {
        const batch = catalog.slice(i, i + ANILIST_BATCH_SIZE);
        const batchIds = batch.map((e) => e.mal_id);
        const data = await fetchAniListBatch(batchIds);

        for (const entry of batch) {
            const m = data.get(entry.mal_id);
            if (m) {
                entry.title_english = m.title?.english ?? null;
                entry.popularity = m.popularity ?? null;
                entry.score = m.averageScore ?? null;
                hits++;
            }
        }

        enriched = Math.min(i + ANILIST_BATCH_SIZE, total);
        const pct = ((enriched / total) * 100).toFixed(1);
        process.stdout.write(
            `\r   ${enriched.toLocaleString("en-US")}/${total.toLocaleString("en-US")} (${pct}%) · hits ${hits.toLocaleString("en-US")}`
        );

        if (enriched < total) await sleep(ANILIST_DELAY_MS);
    }
    process.stdout.write("\n");

    // Sort by popularity desc (null = 0) so the JSON diff is stable and
    // search results land on the popular ones first even if something ever
    // short-circuits the sort at runtime.
    catalog.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    console.log(`   ${hits.toLocaleString("en-US")} entries got AniList metadata`);

    const json = JSON.stringify({
        generated_at: new Date().toISOString(),
        source: asset.browser_download_url,
        release: release.tag_name,
        total: catalog.length,
        enriched: hits,
        data: catalog,
    });

    await writeFile(OUTPUT_PATH, json, "utf-8");
    const sizeMb = (json.length / 1024 / 1024).toFixed(2);
    console.log(`✓ Wrote ${OUTPUT_PATH} (${sizeMb} MB)`);
};

main().catch((err) => {
    console.error("✗ Catalog build failed:", err);
    process.exit(1);
});
