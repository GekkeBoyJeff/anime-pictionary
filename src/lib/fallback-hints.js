/*
 * Fallback hints — contextual pictionary prompts for catalog entries that
 * don't have curated hints (i.e. everything outside src/data/custom-hints.js
 * and any admin-added Supabase rows).
 *
 * Strategy:
 *   1. Map the entry's MAL tags to drawable-object suggestions via TAG_HINTS.
 *     Each tag can propose one or two ideas — we gather all candidates
 *     from matching tags.
 *   2. Mix with a broad anime-agnostic pool (GENERIC_POOL) so every round
 *     still gets fresh rotation, even for entries with exotic tag sets.
 *   3. Pick three unique prompts. Tag-derived ones are preferred so the
 *     result feels related to the series rather than wallpaper-generic.
 *
 * Why not AI-generate: offline-first, zero runtime cost, deterministic
 * enough to review in PRs but randomised enough that repeat rolls of the
 * same catalog-only entry still feel fresh across sessions.
 */

/**
 * Tag → candidate-hint map. Multiple tags may fire for one anime (a "mecha"
 * + "school" + "drama" title gets three pools to draw from). Keys are
 * lowercased MAL/manami tag strings.
 *
 * Dutch prompts because the rest of the UI is in Dutch. Keep each line
 * drawable in under 60 seconds — no "an entire castle on a mountain".
 */
const TAG_HINTS = {
    "action": ["Een dynamische vechthouding", "Een snelheidslijn-effect"],
    "adventure": ["Een reisrugzak", "Een kaart of kompas"],
    "comedy": ["Een overdreven grimas", "Een sweatdrop-zweetdruppel"],
    "drama": ["Een tranende oog-close-up"],
    "fantasy": ["Een magische staf", "Een draak of fantasy-wezen"],
    "horror": ["Een lege ogen-silhouet", "Bloedspatten op een muur"],
    "mystery": ["Een notitieboek met aantekeningen", "Een vergrootglas"],
    "romance": ["Twee silhouetten onder bloesems", "Een hart in de handen"],
    "sci-fi": ["Een ruimteschip", "Een laser-zwaard"],
    "science fiction": ["Een ruimteschip", "Een laser-zwaard"],
    "science-fiction": ["Een ruimteschip", "Een laser-zwaard"],
    "slice of life": ["Een bento-lunchbox", "Een dampend kopje thee"],
    "sports": ["Een bal in beweging", "Een scorebord"],
    "supernatural": ["Een transparant geest-wezen", "Een magisch zegel"],
    "thriller": ["Een bedreigende schaduw in een steeg"],

    "mecha": ["Een robot-cockpit", "Een mecha-vuist"],
    "magic": ["Een toverstaf met sterren", "Een magisch spreuk-cirkel"],
    "martial arts": ["Een vuist-pose", "Een vechtsport-uniform"],
    "military": ["Een uniform met rangen", "Een tank of jeep"],
    "historical": ["Een katana", "Een kimono"],
    "samurai": ["Een katana getrokken uit een schede"],
    "ninja": ["Een shuriken", "Een gezicht in zwarte doek"],
    "school": ["Een school-uniform", "Een schoolbord met krijt"],
    "school life": ["Een school-tas", "Een bento-lunchbox"],
    "music": ["Een microfoon", "Een gitaar"],
    "idol": ["Een microfoon met glitter", "Een fan-lightstick"],
    "cooking": ["Een koksmuts", "Een stomende maaltijd"],
    "food": ["Een ramen-kom met stokjes", "Een rijsttriangel (onigiri)"],
    "vampire": ["Een vleermuis", "Twee vampier-tanden"],
    "demons": ["Een duivelshoorns-silhouet", "Een demonisch teken"],
    "super power": ["Een energiebal in de handen", "Een aura-effect"],
    "space": ["Een planeet met ringen", "Een sterrenhemel"],
    "cyberpunk": ["Een neon-bord in een steeg", "Een bionisch oog"],
    "post-apocalyptic": ["Een verlaten ruïne", "Een gasmasker"],
    "time travel": ["Een zakhorloge", "Een tijdportaal"],
    "parody": ["Een chibi-versie van iets serieus"],
    "psychological": ["Twee gezichten die in elkaar overlopen"],
    "ecchi": ["Een karakter met een flirterige blik"],

    "shounen": ["De hoofdpersoon met een gebalde vuist"],
    "shoujo": ["Glitter-ogen en bloesems"],
    "seinen": ["Een volwassen karakter met sigaret of koffie"],
    "josei": ["Een werkende volwassene in kantoor-outfit"],

    "cats": ["Een kat met een strik"],
    "dogs": ["Een hond met een halsband"],
    "animals": ["Een mascotte-dier"],
    "family": ["Drie figuren in een silhouet"],
    "friendship": ["Twee handen in een high-five"],

    "detective": ["Een pijprokende detective-silhouet"],
    "medical": ["Een stethoscoop"],
    "politics": ["Een vlag of embleem"],
    "crime": ["Een handboei"],
};

/**
 * Fallback pool when tag-derived options don't fill three slots. Broad
 * anime-agnostic prompts that always work.
 */
const GENERIC_POOL = [
    "De hoofdpersoon in profiel",
    "Een kenmerkend accessoire van het hoofdpersonage",
    "Een opvallend kledingstuk uit de serie",
    "Een symbool of embleem uit de serie",
    "Een bijzondere kracht of vaardigheid",
    "Een karakteristiek haartype",
    "Een signature-wapen of item",
    "De setting waarin de anime speelt",
    "Een typisch moment uit de opening",
    "Een sidekick of huisdier",
    "Een voertuig uit de serie",
    "Een gebouw dat vaak voorkomt",
];

/**
 * Pick `count` unique items from the given array, uniformly at random.
 * Returns fewer than `count` if the array is smaller — caller tops up.
 */
const pickUnique = (arr, count) => {
    const pool = [...arr];
    const out = [];
    while (out.length < count && pool.length > 0) {
        const i = Math.floor(Math.random() * pool.length);
        out.push(pool.splice(i, 1)[0]);
    }
    return out;
};

/**
 * Generate 3 fallback hints for a catalog entry.
 *
 * @param {{ tags?: string[] }} entry  Catalog record (manami shape).
 * @returns {[string, string, string]}
 */
export const generateFallbackHints = (entry) => {
    const tags = (entry?.tags ?? []).map((t) => t.toLowerCase());

    // 1. Gather tag-derived candidates, deduped.
    const tagCandidates = new Set();
    for (const tag of tags) {
        const options = TAG_HINTS[tag];
        if (!options) continue;
        for (const opt of options) tagCandidates.add(opt);
    }

    // 2. Prefer tag-derived (up to 2 of 3 to keep series-specific flavour);
    //    mix in generic for the rest so adjacent rolls of the same entry still
    //    produce variety.
    const fromTags = pickUnique(Array.from(tagCandidates), 2);
    const need = 3 - fromTags.length;
    const fromGeneric = pickUnique(
        GENERIC_POOL.filter((g) => !fromTags.includes(g)),
        need
    );

    const combined = [...fromTags, ...fromGeneric];

    // 3. If we're still short (extremely tag-poor edge case), top up from the
    //    remaining generic pool — deterministic fill rather than undefined.
    while (combined.length < 3) {
        const next = GENERIC_POOL.find((g) => !combined.includes(g));
        if (!next) break;
        combined.push(next);
    }

    // Shuffle so the tag-derived isn't always first — feels less mechanical.
    combined.sort(() => Math.random() - 0.5);

    return [combined[0], combined[1], combined[2]];
};
