/*
 * Catalog filter helpers.
 *
 * The home-page search combines four independent filter dimensions:
 *   - text   : fuzzy match against title + synonyms
 *   - season : MAL season tuple { year, season }
 *   - genres : one-of (AND) against the catalog.tags field
 *
 * Every filter is applied client-side over the in-memory catalog. At ~10k
 * entries an `Array.filter` chain still runs in <30ms on a modern phone.
 */

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
const SEASON_ORDER = new Map(SEASONS.map((s, i) => [s, i]));

/*
 * Type buckets. Users complained that movies (especially series spin-off
 * movies like "Demon Slayer: Mugen Train") crowd the results when they're
 * looking for the original series. Bucketing lets us default the search +
 * swipe deck to "Series" but keep everything else reachable via the picker.
 */
export const TYPE_BUCKETS = {
    series: { label: "Series", types: ["TV", "ONA"] },
    film: { label: "Films", types: ["MOVIE"] },
    all: { label: "Alles", types: ["TV", "ONA", "MOVIE", "OVA", "SPECIAL"] },
};
export const DEFAULT_TYPE_BUCKET = "series";

/**
 * Which anime-season the given Date falls into. Used as the "now" upper
 * bound so we can drop future seasons from the dropdown — nobody picks
 * pictionary for a show that hasn't aired.
 */
const seasonForDate = (date) => {
    const month = date.getMonth(); // 0-indexed
    if (month <= 2) return "WINTER";
    if (month <= 5) return "SPRING";
    if (month <= 8) return "SUMMER";
    return "FALL";
};

const isFuture = (entry, now) => {
    if (entry.year > now.year) return true;
    if (entry.year < now.year) return false;
    return (SEASON_ORDER.get(entry.season) ?? 0) > (SEASON_ORDER.get(now.season) ?? 0);
};

/**
 * Return the list of seasons present in the catalog, newest first.
 *
 * Filters out:
 *   - Entries missing season or year.
 *   - manami's "UNDEFINED" season marker (they use it when the season isn't
 *     known yet — that's the "Undefined 2029" you were seeing).
 *   - Anything strictly in the future. A show announced for Summer 2029 is
 *     not a pictionary candidate today.
 */
export const getAvailableSeasons = (catalog, limit = 8) => {
    const today = new Date();
    const now = { year: today.getFullYear(), season: seasonForDate(today) };

    const seen = new Map();
    for (const entry of catalog.data) {
        if (!entry.year || !entry.season) continue;
        if (!SEASON_ORDER.has(entry.season)) continue; // drops "UNDEFINED"
        if (isFuture(entry, now)) continue;

        const key = `${entry.year}-${entry.season}`;
        if (seen.has(key)) continue;
        seen.set(key, { year: entry.year, season: entry.season });
    }

    const list = Array.from(seen.values());
    list.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return (SEASON_ORDER.get(b.season) ?? 0) - (SEASON_ORDER.get(a.season) ?? 0);
    });
    return list.slice(0, limit);
};

/**
 * Every unique tag in the catalog, sorted by frequency (most common first)
 * but with no hard cap — all genres show up so a niche pick like
 * "post-apocalyptic" is still reachable.
 *
 * Tags below a minimum count are dropped because a tag used once is nearly
 * always a typo or a manami-internal annotation, not a useful filter.
 */
export const getAllGenres = (catalog, { minCount = 3 } = {}) => {
    const counts = new Map();
    for (const entry of catalog.data) {
        for (const tag of entry.tags ?? []) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }
    const list = Array.from(counts.entries()).filter(([, n]) => n >= minCount);
    list.sort((a, b) => b[1] - a[1]);
    return list.map(([tag]) => tag);
};

/** Backwards-compatible alias kept for any remaining callers. */
export const getTopGenres = (catalog) => getAllGenres(catalog);

/** Lower-case + trim — used for case-insensitive text matching. */
const norm = (s) => (s ?? "").toLowerCase().trim();

/**
 * Apply the full filter pipeline. Pass only the filters you care about;
 * the rest default to "no constraint" (except type, which defaults to
 * `series` so drawers looking for Demon Slayer do not get hit with the
 * Mugen Train Movie first).
 *
 * Results are ranked by popularity (AniList user count) descending so the
 * series most viewers have actually added to their lists bubble to the top
 * — otherwise niche spin-offs with matching substrings would crowd out the
 * ones players recognise.
 *
 * @param {object} catalog           Already-loaded catalog object
 * @param {object} [opts]
 * @param {string} [opts.text]       Search text; splits on whitespace, all tokens must match.
 * @param {object} [opts.season]     { year, season } tuple
 * @param {string[]} [opts.genres]   List of tag names; entry must match ALL of them
 * @param {string}   [opts.typeBucket]  "series" | "film" | "all"; default "series"
 * @param {number} [opts.limit]      Max results; default 60
 */
export const filterCatalog = (catalog, opts = {}) => {
    const {
        text,
        season,
        genres,
        typeBucket = DEFAULT_TYPE_BUCKET,
        limit = 60,
    } = opts;
    const tokens = text ? norm(text).split(/\s+/).filter(Boolean) : [];
    const genreSet = genres?.length ? new Set(genres) : null;
    const allowedTypes = new Set(
        (TYPE_BUCKETS[typeBucket] ?? TYPE_BUCKETS[DEFAULT_TYPE_BUCKET]).types
    );

    const matches = [];
    for (const entry of catalog.data) {
        // Type bucket filter — cheap, check first.
        if (!allowedTypes.has(entry.type)) continue;

        // Seasonal filter.
        if (season && (entry.year !== season.year || entry.season !== season.season)) {
            continue;
        }

        // Genre filter — must contain ALL selected genres.
        if (genreSet) {
            const entryTags = entry.tags ?? [];
            let ok = true;
            for (const g of genreSet) {
                if (!entryTags.includes(g)) {
                    ok = false;
                    break;
                }
            }
            if (!ok) continue;
        }

        // Text filter — all tokens must appear in the romaji title OR the
        // AniList English title. Synonyms used to be included, but they
        // contain every language (Italian, French, Chinese, Spanish,
        // German…) which dragged in false positives like "Onigiri" matching
        // "demon slayer" because its Chinese translation happens to be
        // "Demon Slayer". Sticking to Japanese + English means AniList
        // enrichment is doing the heavy lifting for English discovery.
        if (tokens.length > 0) {
            const haystack = `${norm(entry.title)} ${norm(entry.title_english)}`;
            let ok = true;
            for (const t of tokens) {
                if (!haystack.includes(t)) {
                    ok = false;
                    break;
                }
            }
            if (!ok) continue;
        }

        matches.push(entry);
    }

    // Rank by AniList popularity (null → 0 so unranked stays at the bottom).
    matches.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    return matches.slice(0, limit);
};

/**
 * Human-readable label for a season tuple. Seasons names are capitalised
 * English — we keep them that way because MAL does; translation layer is
 * a future concern if it ever matters.
 */
export const formatSeason = ({ season, year }) => {
    const label = season.charAt(0) + season.slice(1).toLowerCase();
    return `${label} ${year}`;
};
