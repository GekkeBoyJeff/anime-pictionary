/*
 * AdminDashboard — list of existing custom hints (baseline + Supabase) and
 * a search box to add new ones from the catalog.
 *
 * The auth "guard" is a client-side redirect; the real security is Supabase
 * RLS. This page exists so presenters can edit hints backstage without
 * hopping to a separate tool.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/Button.jsx";
import { Content } from "../components/ui/Content.jsx";
import { Link } from "../components/ui/Link.jsx";
import { BackendStatus } from "../components/status/BackendStatus.jsx";
import { DacLogo } from "../components/brand/DacLogo.jsx";
import { displayTitle } from "../lib/catalog.js";
import { useAuth } from "../hooks/useAuth.js";
import { useCatalog } from "../hooks/useCatalog.js";
import { CUSTOM_HINTS } from "../data/custom-hints.js";
import { fetchSupabaseHints } from "../lib/hints-merge.js";
import { supabase } from "../lib/supabase.js";

const useDebounced = (value, delay = 180) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(id);
    }, [value, delay]);
    return debounced;
};

const SignOutButton = () => {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(false);
    const handleSignOut = async () => {
        setLoading(true);
        try {
            await supabase?.auth.signOut();
            setLocation("/admin/login");
        } finally {
            setLoading(false);
        }
    };
    return (
        <Button variant="ghost" size="sm" onClick={handleSignOut} loading={loading}>
            Uitloggen
        </Button>
    );
};

export const AdminDashboard = () => {
    const auth = useAuth();
    const [, setLocation] = useLocation();
    const catalog = useCatalog();

    const [supabaseHints, setSupabaseHints] = useState([]);
    const [supabaseLoaded, setSupabaseLoaded] = useState(false);

    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounced(query, 160);

    // Client-side auth guard. The real security is RLS on the DB.
    useEffect(() => {
        if (auth.status === "anonymous") {
            setLocation("/admin/login?redirect=/admin");
        }
    }, [auth.status, setLocation]);

    useEffect(() => {
        let cancelled = false;
        fetchSupabaseHints().then((data) => {
            if (!cancelled) {
                setSupabaseHints(data);
                setSupabaseLoaded(true);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Merge baseline + Supabase for display. Supabase wins on conflicts so
    // ad-hoc admin overrides show first.
    const mergedHintsByMalId = useMemo(() => {
        const map = new Map();
        for (const h of CUSTOM_HINTS) {
            map.set(h.mal_id, {
                mal_id: h.mal_id,
                title: h.title,
                hints: h.hints,
                source: "baseline",
            });
        }
        for (const h of supabaseHints) {
            map.set(h.mal_id, {
                mal_id: h.mal_id,
                title: h.title,
                hints: [h.hint_1, h.hint_2, h.hint_3],
                source: "supabase",
            });
        }
        return map;
    }, [supabaseHints]);

    // Limit to 12 results; filtering 30k entries on every keystroke is still
    // fast, but rendering 30k cards is not. Match against romaji title +
    // AniList English title only (no synonyms — they're multilingual and
    // drag in false positives). Sort by popularity so the 1M-tracked
    // series beats the niche spin-off sharing a substring.
    const searchResults = useMemo(() => {
        if (catalog.status !== "ready") return [];
        const q = debouncedQuery.trim().toLowerCase();
        if (q.length < 2) return [];
        const matches = [];
        for (const entry of catalog.data.data) {
            const inTitle = entry.title?.toLowerCase().includes(q);
            const inEnglish = entry.title_english?.toLowerCase().includes(q);
            if (inTitle || inEnglish) matches.push(entry);
        }
        matches.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        return matches.slice(0, 12);
    }, [catalog.status, catalog.data, debouncedQuery]);

    if (auth.status === "loading") {
        return (
            <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-10">
                <Content muted value="Sessie controleren…" />
            </main>
        );
    }

    if (auth.status === "unconfigured") {
        return (
            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-5 py-10 text-center">
                <h1 className="font-display text-3xl text-sumi">Admin is uit</h1>
                <Content
                    muted
                    value="Deze build heeft geen Supabase-configuratie. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY om admin in te schakelen."
                />
                <Link variant="button" href="/">
                    Terug naar speler-flow
                </Link>
            </main>
        );
    }

    const hints = Array.from(mergedHintsByMalId.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
    );

    return (
        <main className="page-fade-in mx-auto flex w-full max-w-5xl flex-1 flex-col gap-7 px-5 py-6 md:px-8 md:py-10">
            <header className="flex flex-col gap-3 border-b border-sumi/10 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <DacLogo size={36} className="text-sumi" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-serif text-xs uppercase tracking-widest text-spirit">
                            Anime Pictionary
                        </span>
                        <h1 className="font-display text-3xl leading-none text-sumi md:text-4xl">
                            Admin Dashboard
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <BackendStatus variant="prominent" />
                    <SignOutButton />
                </div>
            </header>

            <section
                aria-labelledby="search-heading"
                className="flex flex-col gap-3 rounded-lg border border-sumi/15 bg-washi-soft p-5 md:p-6 shadow-(--shadow-card)"
            >
                <div className="flex flex-col gap-1">
                    <h2 id="search-heading" className="font-display text-2xl leading-none text-sumi">
                        Nieuwe hint toevoegen
                    </h2>
                    <Content
                        size="sm"
                        muted
                        value="Zoek in de offline catalog (9.700+ series). Klik een resultaat om hints toe te voegen."
                    />
                </div>

                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Zoek anime (bijv. Tokyo Ghoul, Monster, Cyberpunk)…"
                    autoComplete="off"
                    maxLength={80}
                    className="h-12 rounded-md border border-sumi/20 bg-washi px-4 font-sans text-base text-sumi focus:border-spirit focus-ring"
                />

                {searchResults.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {searchResults.map((entry) => (
                            <li key={entry.mal_id}>
                                <Link
                                    href={`/admin/hints/${entry.mal_id}`}
                                    variant="nav"
                                    className="group flex items-start gap-3 rounded-md border border-sumi/15 bg-washi p-2.5 hover:border-spirit/60 hover:bg-washi-soft"
                                >
                                    {entry.picture ? (
                                        <img
                                            src={entry.picture}
                                            alt=""
                                            width={48}
                                            height={72}
                                            loading="lazy"
                                            className="h-18 w-12 flex-none rounded-md border border-sumi/10 object-cover"
                                        />
                                    ) : null}
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <span className="truncate font-serif font-semibold text-sumi group-hover:text-spirit">
                                            {displayTitle(entry)}
                                        </span>
                                        <span className="text-xs text-muted">
                                            {entry.type}
                                            {entry.year ? ` · ${entry.year}` : ""}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : debouncedQuery.length >= 2 ? (
                    <Content size="sm" muted value="Geen resultaten." />
                ) : null}
            </section>

            <section aria-labelledby="hints-heading" className="flex flex-col gap-3">
                <h2 id="hints-heading" className="font-display text-2xl leading-none text-sumi">
                    Bestaande hints ({hints.length})
                    {!supabaseLoaded ? (
                        <span className="ml-3 font-sans text-sm font-normal text-muted">
                            · Supabase laadt…
                        </span>
                    ) : null}
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {hints.map((hint) => (
                        <li key={hint.mal_id}>
                            <Link
                                href={`/admin/hints/${hint.mal_id}`}
                                variant="nav"
                                className="flex flex-col gap-1 rounded-md border border-sumi/15 bg-washi-soft p-3.5 hover:border-spirit/60"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="truncate font-serif font-semibold text-sumi">
                                        {hint.title}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted">
                                        {hint.source === "baseline" ? "code" : "db"}
                                    </span>
                                </div>
                                <span className="truncate text-sm text-muted">
                                    {hint.hints.join(" · ")}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
};
