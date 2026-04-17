/*
 * image-search — thin browser client for our Supabase Edge Function scraper.
 *
 * The actual DuckDuckGo scraping lives server-side in
 * `supabase/functions/image-search/index.ts`. This file just calls that
 * function and caches results in sessionStorage so a mid-round refresh does
 * not re-hit the upstream.
 *
 * Why tab-scoped cache (sessionStorage) and not localStorage:
 *   - Image URLs on DuckDuckGo expire after a while; a stale localStorage
 *     entry is worse than no cache at all.
 *   - Each tab is a fresh event, so session scope matches the mental model.
 */

import { isSupabaseConfigured } from "./supabase.js";

const CACHE_PREFIX = "ap:img:";

const cacheKey = (query) => `${CACHE_PREFIX}${query.toLowerCase()}`;

const readCache = (query) => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(cacheKey(query));
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const writeCache = (query, urls) => {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(cacheKey(query), JSON.stringify(urls));
    } catch {
        // sessionStorage full / disabled — tolerable, we'll just re-fetch.
    }
};

/** Manual fallback link for the "Meer referenties op Google →" button. */
export const googleImagesSearchUrl = (query) =>
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

/**
 * Search for reference images for one hint. Returns an array of image URLs,
 * or an empty array on any failure — the UI interprets empty as "fall back
 * to the external Google link" rather than a hard error state.
 *
 * @param {object} opts
 * @param {string} opts.animeTitle  — bundled into the query for better context.
 * @param {string} opts.hint        — the specific drawable object text.
 * @param {number} [opts.count=3]
 * @param {AbortSignal} [opts.signal]
 */
export const searchHintImages = async ({ animeTitle, hint, count = 3, signal }) => {
    const query = `${animeTitle} ${hint}`.trim();
    if (!query) return [];

    const cached = readCache(query);
    if (cached) return cached.slice(0, count);

    if (!isSupabaseConfigured()) return [];

    const url =
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-search` +
        `?q=${encodeURIComponent(query)}&count=${count}`;

    try {
        const res = await fetch(url, { signal });
        if (!res.ok) return [];
        const body = await res.json();
        const urls = Array.isArray(body?.images) ? body.images.slice(0, count) : [];
        writeCache(query, urls);
        return urls;
    } catch {
        return [];
    }
};
