/*
 * Countdown persistence — session-survives-refresh logic for the Tekenscherm.
 *
 * Problem we are solving: on stage, a bumped laptop can cause a refresh
 * mid-round. We want the countdown to keep its remaining time rather than
 * restart a fresh 60 seconds (which would give the drawer an unfair reset).
 *
 * How: when a round starts we stamp `startedAt` (Date.now()) in sessionStorage
 * keyed by MAL id. On mount we read the stamp and compute "elapsed = now - startedAt".
 * The timer renders `max(0, totalSeconds - elapsed)`.
 *
 * sessionStorage (not localStorage) scopes to the tab — closing the tab ends
 * the round. That is what we want: leaving the stage ends the round.
 */

const STORAGE_PREFIX = "ap:round:";
const keyFor = (malId) => `${STORAGE_PREFIX}${malId}`;

/**
 * Start a new round for a given MAL id. Overwrites any previous stamp for the
 * same id (starting a second round on the same anime is a valid use-case).
 */
export const startRound = (malId) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(keyFor(malId), String(Date.now()));
};

/**
 * Compute the remaining seconds for a round. Returns `totalSeconds` if no
 * stamp exists yet (round not started); returns 0 when time has run out.
 */
export const getRemainingSeconds = (malId, totalSeconds) => {
    if (typeof window === "undefined") return totalSeconds;
    const raw = sessionStorage.getItem(keyFor(malId));
    if (!raw) return totalSeconds;
    const startedAt = Number.parseInt(raw, 10);
    if (!Number.isFinite(startedAt)) return totalSeconds;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, totalSeconds - elapsed);
};

/** Clear a round stamp. Used after the user taps "Volgende ronde". */
export const clearRound = (malId) => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(keyFor(malId));
};
