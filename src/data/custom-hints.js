/*
 * Baseline spotlight series — hand-curated pictionary hints.
 *
 * Why these live in code rather than Supabase:
 *   - The stage flow must always work, even when Supabase is unreachable.
 *   - Git history gives provenance: every change is reviewed and reversible.
 *   - These are evergreen — they stay recognisable year after year.
 *
 * Next steps for adding series:
 *   - Permanent additions → append below and commit.
 *   - Ad-hoc additions during an event → use /admin (writes to Supabase).
 *     Supabase entries get merged on top of this baseline at runtime.
 */

/**
 * @typedef {object} CustomHint
 * @property {number} mal_id                      MyAnimeList id (stable key).
 * @property {string} title                       Official title.
 * @property {[string, string, string]} hints     Three drawable objects.
 */

/** @type {CustomHint[]} */
export const CUSTOM_HINTS = [
    {
        mal_id: 20,
        title: "Naruto",
        hints: ["Oranje jumpsuit", "Hoofdband met ninja-symbool", "Kunai-mes"],
    },
    {
        mal_id: 21,
        title: "One Piece",
        hints: ["Rode strohoed", "Skull-and-crossbones vlag", "Log Pose kompas"],
    },
    {
        mal_id: 1535,
        title: "Death Note",
        hints: ["Zwart notitieboek", "Appel", "Doodsengel Ryuk"],
    },
    {
        mal_id: 813,
        title: "Dragon Ball Z",
        hints: ["Dragon Ball (4-ster)", "Saiyan scouter", "Kamehameha-straal"],
    },
    {
        mal_id: 5114,
        title: "Fullmetal Alchemist: Brotherhood",
        hints: ["Rode alchemie-cirkel", "Metalen arm", "Witte handschoen"],
    },
    {
        mal_id: 269,
        title: "Bleach",
        hints: ["Zanpakutou-zwaard", "Hollow masker", "Shinigami-robe"],
    },
    {
        mal_id: 11061,
        title: "Hunter x Hunter",
        hints: ["Hunter-licentiekaart", "Gon's visrod", "Kurapika's kettingen"],
    },
    {
        mal_id: 16498,
        title: "Attack on Titan",
        hints: ["3D-manoeuvregear", "Scout-regiment vleugels", "Kolossale titan"],
    },
    {
        mal_id: 31964,
        title: "My Hero Academia",
        hints: ["All Might silhouet", "Groene haarplukken (Deku)", "Rode cape"],
    },
    {
        mal_id: 38000,
        title: "Demon Slayer",
        hints: ["Geruit haori-patroon", "Nichirin katana", "Bamboe mondstuk"],
    },
    {
        mal_id: 40748,
        title: "Jujutsu Kaisen",
        hints: ["Blauwe blinddoek", "Zwarte vinger (Sukuna)", "Domain expansion-bol"],
    },
    {
        mal_id: 44511,
        title: "Chainsaw Man",
        hints: ["Kettingzaag-hoofd", "Pochita hondje", "Duivelscontract-papier"],
    },
    {
        mal_id: 50265,
        title: "Spy x Family",
        hints: ["Anya's roze haarspeld", "Peanut", "Stealth pistol"],
    },
    {
        mal_id: 52991,
        title: "Frieren: Beyond Journey's End",
        hints: ["Elf met spitse oren", "Witte toverstaf", "Flikkerend leesboek"],
    },
    {
        mal_id: 52299,
        title: "Solo Leveling",
        hints: ["Dagger met blauwe gloed", "Schaduwsoldaat (Igris)", "Status-venster UI"],
    },
];

/**
 * Find a baseline hint by MAL id. Returns null instead of throwing so callers
 * can silently fall through to remote (Supabase) or catalog-only data.
 */
export const findCustomHint = (malId) =>
    CUSTOM_HINTS.find((hint) => hint.mal_id === malId) ?? null;
