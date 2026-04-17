/*
 * Random anime picker helpers.
 *
 * The swipe-deck on home uses `pickFromCatalog` with an `excludeMalId` so the
 * same anime never appears twice in a row. Duplicates across the deck are
 * explicitly allowed — with many players the deck is a random walk, not a
 * ledger.
 */

import { CUSTOM_HINTS } from "../data/custom-hints.js";

const pickRandom = (arr) =>
    arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];

/** Pick any baseline-curated series. Falls back to the full catalog path. */
export const pickAnyBaseline = () => pickRandom(CUSTOM_HINTS)?.mal_id ?? null;

/**
 * Pick any entry from the full catalog. Pass `excludeMalId` to avoid returning
 * the same entry twice in a row (used by the swipe-deck).
 */
export const pickFromCatalog = (catalog, excludeMalId = null) => {
    const pool =
        excludeMalId === null
            ? catalog.data
            : catalog.data.filter((entry) => entry.mal_id !== excludeMalId);
    const entry = pickRandom(pool);
    return entry?.mal_id ?? null;
};
