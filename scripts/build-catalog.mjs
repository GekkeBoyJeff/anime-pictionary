#!/usr/bin/env node
/*
 * Build script for the offline anime catalog.
 *
 * WHAT this does:
 *   - Downloads the open-source anime-offline-database from manami-project
 *     (weekly-updated, 40k+ entries, MIT-licensed).
 *   - Filters to anime that matter for pictionary (TV/MOVIE/ONA/OVA only,
 *     skip standalone music videos) but keeps the set as broad as possible —
 *     including UPCOMING series so "the one I'm watching this season" still
 *     shows up.
 *   - Writes public/anime-catalog.json — the Vite build picks it up as a
 *     static asset.
 *
 * WHY no top-N cut-off:
 *   - Users expect to find obscure / current-season titles. Any popularity
 *     proxy will drop them.
 *   - Raw uncompressed JSON is ~10-12 MB for the full set; Brotli over HTTP
 *     gets it to ~3 MB. The bundle cost is one-time per CDN cache cold hit.
 *   - 40k entries × ~250 B = still well under anything that would harm
 *     JavaScript parse time, since we never iterate all of them at once
 *     outside of filter callbacks.
 *
 * HOW to run:
 *   - `npm run catalog` — takes 30s-2min depending on bandwidth.
 *   - The generated JSON is committed so CI does not re-download.
 *   - Re-run weekly (or whenever manami publishes a new release) to keep
 *     the list current.
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

// Only drop entries that have NO cross-references at all (orphan records)
// and entries that cannot possibly be drawn (standalone music videos, etc).
const KEEP_TYPES = new Set(["TV", "MOVIE", "ONA", "OVA", "SPECIAL"]);

const extractMalId = (anime) => {
    const mal = (anime.sources ?? []).find((s) =>
        s.startsWith("https://myanimelist.net/anime/")
    );
    if (!mal) return null;
    const match = mal.match(/\/anime\/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : null;
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
    console.log(`   tag: ${release.tag_name}, asset: ${asset.name}`);

    console.log("→ Downloading manami-project catalog…");
    const res = await fetch(asset.browser_download_url);
    if (!res.ok) {
        throw new Error(`Download failed: HTTP ${res.status}`);
    }
    const raw = await res.json();
    const source = Array.isArray(raw?.data) ? raw.data : [];
    console.log(`   ${source.length.toLocaleString("en-US")} entries fetched`);

    // Narrow to pictionary-compatible content only.
    const filtered = source.filter((anime) => {
        if (!anime?.title) return false;
        if (!KEEP_TYPES.has(anime.type)) return false;
        // Require a MAL id so runtime merges (hints, Jikan lookups) work.
        if (!extractMalId(anime)) return false;
        return true;
    });
    console.log(
        `   ${filtered.length.toLocaleString("en-US")} survive after type + MAL-id filter`
    );

    // Narrow record shape — every byte ends up in the browser, keep only
    // what the UI actually renders.
    const catalog = filtered.map((anime) => ({
        mal_id: extractMalId(anime),
        title: anime.title,
        synonyms: (anime.synonyms ?? []).slice(0, 4),
        type: anime.type,
        episodes: anime.episodes ?? null,
        status: anime.status,
        year: anime.animeSeason?.year ?? null,
        season: anime.animeSeason?.season ?? null,
        picture: anime.picture ?? null,
        thumbnail: anime.thumbnail ?? null,
        tags: anime.tags ?? [],
    }));

    // Sort alphabetically so the JSON has a stable diff between runs.
    catalog.sort((a, b) => a.title.localeCompare(b.title));

    console.log(`   ${catalog.length.toLocaleString("en-US")} entries written`);

    const json = JSON.stringify({
        generated_at: new Date().toISOString(),
        source: asset.browser_download_url,
        release: release.tag_name,
        total: catalog.length,
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
