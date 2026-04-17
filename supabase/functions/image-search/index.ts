/*
 * image-search — Supabase Edge Function.
 *
 * Scrapes DuckDuckGo's image search endpoint server-side so the browser
 * never has to deal with CORS or a third-party search API key.
 *
 * Why DuckDuckGo instead of Google/Bing:
 *   - No API key, no auth, no rate-limit quota to track.
 *   - The result surface is large enough for pictionary reference use.
 *   - The two-step "vqd token then JSON" flow is easy enough to replicate.
 *
 * How it works:
 *   1. GET the DuckDuckGo search HTML page — this page embeds a `vqd` token
 *      that is required for subsequent JSON calls. The token is per-query
 *      and expires fast, so we fetch fresh every time.
 *   2. GET the `/i.js` JSON endpoint with the vqd token. That returns a
 *      structured result list with image URLs and thumbnail URLs.
 *   3. Slice to the requested count and return JSON with CORS headers open.
 *
 * Usage from the browser:
 *   GET https://<project-ref>.supabase.co/functions/v1/image-search?q=<query>&count=3
 *   → { "images": ["https://…", "https://…", "https://…"], "source": "duckduckgo" }
 *
 * If DuckDuckGo starts blocking Deno Deploy IPs, swap to Bing's HTML search
 * page (parse `m='{"murl":"…"}'` attributes) — that's the recommended next
 * fallback and keeps the same public contract for the frontend.
 */

// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const jsonResponse = (body: any, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
        },
    });

const fetchVqdToken = async (query: string): Promise<string | null> => {
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const html = await res.text();

    // The vqd token appears in multiple shapes depending on the page variant.
    // Covers: vqd="4-12345", vqd='4-12345', vqd=4-12345&, vqd=4-12345"
    const patterns = [
        /vqd=["']([\d-]+)["']/,
        /vqd=([\d-]+)&/,
        /vqd="([\d-]+)"/,
    ];
    for (const rx of patterns) {
        const m = html.match(rx);
        if (m) return m[1];
    }
    return null;
};

const fetchImages = async (
    query: string,
    vqd: string,
    count: number
): Promise<string[]> => {
    const url =
        `https://duckduckgo.com/i.js?l=us-en&o=json` +
        `&q=${encodeURIComponent(query)}` +
        `&vqd=${encodeURIComponent(vqd)}` +
        `&f=,,,,,&p=1`;

    const res = await fetch(url, {
        headers: {
            "User-Agent": UA,
            "Referer": "https://duckduckgo.com/",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
        },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return results
        .slice(0, count)
        .map((r: any) => r.image ?? r.thumbnail)
        .filter((u: unknown): u is string => typeof u === "string" && u.length > 0);
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const rawCount = Number.parseInt(url.searchParams.get("count") ?? "3", 10);
    const count = Number.isFinite(rawCount) ? Math.min(Math.max(rawCount, 1), 10) : 3;

    if (!q) return jsonResponse({ images: [], source: "duckduckgo" });

    try {
        const vqd = await fetchVqdToken(q);
        if (!vqd) return jsonResponse({ images: [], error: "no vqd token" });

        const images = await fetchImages(q, vqd, count);
        return jsonResponse({ images, source: "duckduckgo" });
    } catch (err) {
        // Swallow upstream failures — the caller treats empty results as
        // "fall back to the manual Google link" rather than "broken state".
        return jsonResponse({
            images: [],
            error: err instanceof Error ? err.message : "unknown",
        });
    }
});
