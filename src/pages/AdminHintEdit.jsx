/*
 * AdminHintEdit — create or update a single custom hint row in Supabase.
 *
 * Fields:
 *   - hint_1 / hint_2 / hint_3 — trimmed, 1..80 chars each.
 *
 * The old "categorie" enum field was removed in favour of MAL-derived
 * metadata. The Supabase column still exists (nullable + default) so old
 * rows are untouched, but we never read or write it here.
 */

import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "../components/ui/Button.jsx";
import { Link } from "../components/ui/Link.jsx";
import { Media } from "../components/ui/Media.jsx";
import { Content } from "../components/ui/Content.jsx";
import { DacLogo } from "../components/brand/DacLogo.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useCatalog } from "../hooks/useCatalog.js";
import { findInCatalog } from "../lib/catalog.js";
import { findCustomHint } from "../data/custom-hints.js";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const HINT_MAX = 80;
const trimToMax = (s) => s.trim().slice(0, HINT_MAX);

export const AdminHintEdit = () => {
    const auth = useAuth();
    const params = useParams();
    const [, setLocation] = useLocation();
    const catalog = useCatalog();
    const malId = Number.parseInt(params.malId, 10);

    const [hint1, setHint1] = useState("");
    const [hint2, setHint2] = useState("");
    const [hint3, setHint3] = useState("");

    const [existing, setExisting] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedMessage, setSavedMessage] = useState(null);

    useEffect(() => {
        if (auth.status === "anonymous") {
            setLocation(`/admin/login?redirect=/admin/hints/${params.malId}`);
        }
    }, [auth.status, setLocation, params.malId]);

    // Seed form values from Supabase (preferred) or the baseline JS data.
    useEffect(() => {
        if (!Number.isFinite(malId) || !isSupabaseConfigured()) return;
        let cancelled = false;

        const seed = async () => {
            const { data } = await supabase
                .from("custom_anime_hints")
                .select("*")
                .eq("mal_id", malId)
                .maybeSingle();

            if (cancelled) return;
            if (data) {
                setExisting(data);
                setHint1(data.hint_1 ?? "");
                setHint2(data.hint_2 ?? "");
                setHint3(data.hint_3 ?? "");
                return;
            }
            const fallback = findCustomHint(malId);
            if (fallback) {
                setHint1(fallback.hints[0]);
                setHint2(fallback.hints[1]);
                setHint3(fallback.hints[2]);
            }
        };

        seed();
        return () => {
            cancelled = true;
        };
    }, [malId]);

    const catalogEntry =
        catalog.status === "ready" ? findInCatalog(catalog.data, malId) : null;

    const handleSave = async (event) => {
        event.preventDefault();
        setError(null);
        setSavedMessage(null);

        const h1 = trimToMax(hint1);
        const h2 = trimToMax(hint2);
        const h3 = trimToMax(hint3);
        if (!h1 || !h2 || !h3) {
            setError("Alle drie de hints zijn verplicht.");
            return;
        }

        setLoading(true);
        try {
            const { error: upsertError } = await supabase
                .from("custom_anime_hints")
                .upsert(
                    {
                        mal_id: malId,
                        title: catalogEntry?.title ?? "Onbekend",
                        image_url: catalogEntry?.picture ?? null,
                        hint_1: h1,
                        hint_2: h2,
                        hint_3: h3,
                    },
                    { onConflict: "mal_id" }
                );
            if (upsertError) {
                setError(upsertError.message);
                return;
            }
            setSavedMessage("Opgeslagen!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Opslaan mislukt");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existing) return;
        if (!window.confirm(`"${existing.title}" verwijderen?`)) return;
        setLoading(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from("custom_anime_hints")
                .delete()
                .eq("mal_id", malId);
            if (deleteError) {
                setError(deleteError.message);
                return;
            }
            setLocation("/admin");
        } finally {
            setLoading(false);
        }
    };

    if (!Number.isFinite(malId)) {
        return (
            <main className="mx-auto max-w-2xl flex-1 p-6 text-center">
                <Content muted value="Ongeldig MAL id." />
            </main>
        );
    }

    return (
        <main className="page-fade-in mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-10">
            <nav className="flex items-center justify-between">
                <Link variant="nav" href="/admin" className="inline-flex items-center gap-1.5">
                    <span aria-hidden>←</span> Terug naar dashboard
                </Link>
                <DacLogo size={24} className="text-sumi/70" />
            </nav>

            <header className="grid grid-cols-[104px_1fr] gap-4 md:grid-cols-[160px_1fr] md:gap-6">
                {catalogEntry?.picture ? (
                    <Media
                        src={catalogEntry.picture}
                        alt=""
                        width={160}
                        height={240}
                        figureClassName="overflow-hidden rounded-md border border-sumi/15"
                        className="aspect-2/3 object-cover"
                    />
                ) : null}
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-widest text-muted">
                        MAL id: {malId}
                        {catalogEntry?.year ? ` · ${catalogEntry.year}` : ""}
                        {catalogEntry?.type ? ` · ${catalogEntry.type}` : ""}
                    </span>
                    <h1 className="font-display text-2xl leading-tight text-sumi md:text-3xl">
                        {catalogEntry?.title ?? "Anime"}
                    </h1>
                    {catalogEntry?.tags?.length ? (
                        <ul className="mt-1 flex flex-wrap gap-1">
                            {catalogEntry.tags.slice(0, 4).map((tag) => (
                                <li
                                    key={tag}
                                    className="rounded-full border border-sumi/15 bg-washi-soft px-2 py-0.5 text-[11px] text-muted"
                                >
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </header>

            <form
                onSubmit={handleSave}
                noValidate
                className="flex flex-col gap-4 rounded-lg border border-sumi/15 bg-washi-soft p-5 md:p-6 shadow-(--shadow-card)"
            >
                {[
                    { label: "Tekenbaar object 1", value: hint1, setValue: setHint1 },
                    { label: "Tekenbaar object 2", value: hint2, setValue: setHint2 },
                    { label: "Tekenbaar object 3", value: hint3, setValue: setHint3 },
                ].map((field, i) => (
                    <label key={i} className="flex flex-col gap-1.5">
                        <span className="font-serif text-xs font-semibold uppercase tracking-widest text-muted">
                            {field.label}
                        </span>
                        <input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.setValue(e.target.value)}
                            maxLength={HINT_MAX}
                            className="h-11 rounded-md border border-sumi/20 bg-washi px-4 font-sans text-base text-sumi focus:border-spirit focus-ring"
                        />
                    </label>
                ))}

                {error ? (
                    <p
                        role="alert"
                        className="rounded-md border border-vermillion/50 bg-vermillion/10 px-4 py-3 text-sm text-vermillion"
                    >
                        {error}
                    </p>
                ) : null}
                {savedMessage ? (
                    <p className="rounded-md border border-lantern-deep/50 bg-lantern/20 px-4 py-3 text-sm text-lantern-deep">
                        {savedMessage}
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Button type="submit" variant="primary" size="lg" loading={loading}>
                        {existing ? "Bijwerken" : "Opslaan"}
                    </Button>
                    {existing ? (
                        <Button type="button" variant="danger" size="md" onClick={handleDelete}>
                            Verwijderen
                        </Button>
                    ) : null}
                </div>
            </form>
        </main>
    );
};
