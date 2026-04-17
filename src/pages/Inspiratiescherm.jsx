/*
 * Inspiratiescherm — "here is what you're drawing".
 *
 * Shows cover, title, year, genre tags, and the three drawable prompts with
 * their reference image strips. Clicking any thumb opens a full gallery
 * modal where the user can browse all 9 references with arrow keys / swipes.
 *
 * We deliberately do NOT block rendering on Supabase — a flaky DB should not
 * delay the drawer from seeing the hints.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "../components/ui/Button.jsx";
import { Link } from "../components/ui/Link.jsx";
import { Content } from "../components/ui/Content.jsx";
import { Media } from "../components/ui/Media.jsx";
import { ImageViewer } from "../components/ui/ImageViewer.jsx";
import { DacLogo } from "../components/brand/DacLogo.jsx";
import { HintReferenceImages } from "../components/player/HintReferenceImages.jsx";
import { useCatalog } from "../hooks/useCatalog.js";
import { resolveHint } from "../lib/hints-merge.js";
import { startRound } from "../lib/countdown.js";

const LoadingState = () => (
    <main className="page-fade-in mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-5 py-16">
        <Content muted value="Een oproep doen aan de geesten…" />
    </main>
);

const MissingState = () => (
    <main className="page-fade-in mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
        <h1 className="font-display text-4xl text-sumi">Geest niet gevonden</h1>
        <Content muted value="Deze anime zit niet in onze catalog. Probeer een andere." />
        <Link variant="button" href="/">
            Terug naar keuze
        </Link>
    </main>
);

export const Inspiratiescherm = () => {
    const params = useParams();
    const [, setLocation] = useLocation();
    const catalog = useCatalog();
    const malId = Number.parseInt(params.malId, 10);
    const [merged, setMerged] = useState(null);
    const [status, setStatus] = useState("loading");

    /*
     * Per-hint URL arrays are reported back from HintReferenceImages via the
     * onThumbClick callback — we stash them here so the gallery viewer can
     * show all references flattened across the three hints.
     */
    const [hintImageBuckets, setHintImageBuckets] = useState([[], [], []]);
    const [viewer, setViewer] = useState({ open: false, startIndex: 0 });

    useEffect(() => {
        if (catalog.status !== "ready") return;
        if (!Number.isFinite(malId)) {
            setStatus("missing");
            return;
        }

        let cancelled = false;
        resolveHint(malId, catalog.data)
            .then((result) => {
                if (cancelled) return;
                if (!result) {
                    setStatus("missing");
                    return;
                }
                setMerged(result);
                setStatus("ready");
                // Reset any previous images when switching anime.
                setHintImageBuckets([[], [], []]);
            })
            .catch(() => {
                if (!cancelled) setStatus("missing");
            });

        return () => {
            cancelled = true;
        };
    }, [catalog.status, catalog.data, malId]);

    // Flattened gallery array — Hint 1's images first, then Hint 2, then Hint 3.
    // Caption-friendly metadata lives alongside so the viewer can label each slide.
    const gallery = useMemo(() => {
        if (!merged) return [];
        return hintImageBuckets.flatMap((urls, hintIndex) =>
            urls.map((url, imgIndex) => ({
                url,
                hintIndex,
                hintLabel: merged.hints[hintIndex],
                imgIndex,
            }))
        );
    }, [merged, hintImageBuckets]);

    if (catalog.status === "loading" || status === "loading") return <LoadingState />;
    if (status === "missing" || !merged) return <MissingState />;

    /*
     * Each HintReferenceImages reports its fetched URLs via the third argument
     * the first time a thumb is clicked. We compute the viewer's absolute
     * start index against the *next* bucket state (since setState is async
     * and the `gallery` memo below rebuilds from the updated buckets on the
     * next render).
     */
    const handleThumbClick = (hintIndex, imageIndex, urls) => {
        const nextBuckets = hintImageBuckets.map((b, i) => (i === hintIndex ? urls : b));
        setHintImageBuckets(nextBuckets);

        const offset =
            nextBuckets.slice(0, hintIndex).reduce((sum, b) => sum + b.length, 0) +
            imageIndex;
        setViewer({ open: true, startIndex: offset });
    };

    const handleStart = () => {
        startRound(merged.mal_id);
        setLocation(`/anime/${merged.mal_id}/draw`);
    };

    return (
        <main className="page-fade-in relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-5 py-6 md:gap-10 md:px-8 md:py-10">
            <nav className="flex items-center justify-between gap-3">
                <Link variant="nav" href="/" className="inline-flex items-center gap-1.5">
                    <span aria-hidden>←</span> Terug naar keuze
                </Link>
                <Link
                    href="/"
                    variant="nav"
                    className="flex items-center gap-1.5 text-sumi/70 hover:text-sumi no-underline"
                    aria-label="Dutch Anime Community home"
                >
                    <DacLogo size={24} />
                </Link>
            </nav>

            <header className="grid grid-cols-[104px_1fr] gap-4 md:grid-cols-[180px_1fr] md:gap-6">
                {merged.picture ? (
                    <Media
                        src={merged.picture}
                        alt={`${merged.title} cover`}
                        priority
                        width={400}
                        height={600}
                        figureClassName="overflow-hidden rounded-lg border border-sumi/15 shadow-(--shadow-card)"
                        className="aspect-2/3 object-cover"
                    />
                ) : null}
                <div className="flex min-w-0 flex-col gap-2">
                    {merged.year ? (
                        <span className="font-serif text-xs uppercase tracking-[0.22em] text-spirit">
                            {merged.year}
                        </span>
                    ) : null}
                    <h1 className="font-display text-3xl leading-[1.05] tracking-tight text-sumi md:text-hero">
                        {merged.title}
                    </h1>
                    {merged.tags?.length ? (
                        <ul className="mt-1 flex flex-wrap gap-1">
                            {merged.tags.slice(0, 5).map((tag) => (
                                <li
                                    key={tag}
                                    className="rounded-full border border-sumi/15 bg-washi-soft px-2 py-0.5 text-[11px] tracking-wide text-muted"
                                >
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </header>

            <section aria-labelledby="hints-heading" className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-3">
                    <h2
                        id="hints-heading"
                        className="font-display text-2xl leading-none tracking-tight text-sumi md:text-section"
                    >
                        Teken deze 3 dingen
                    </h2>
                    <span className="font-serif text-xs uppercase tracking-widest text-muted">
                        60 sec
                    </span>
                </div>
                <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                    {merged.hints.map((hint, index) => (
                        <li
                            key={hint}
                            className="stagger-in flex flex-col gap-3 rounded-lg border border-sumi/15 bg-washi-soft p-4 shadow-(--shadow-card)"
                            style={{ "--stagger-index": index }}
                        >
                            <div className="flex items-baseline gap-3">
                                <span
                                    aria-hidden
                                    className="font-display text-3xl leading-none text-spirit/40"
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="font-serif text-lg font-bold leading-snug text-sumi md:text-xl">
                                    {hint}
                                </span>
                            </div>
                            <HintReferenceImages
                                animeTitle={merged.title}
                                hint={hint}
                                hintIndex={index}
                                onThumbClick={handleThumbClick}
                            />
                        </li>
                    ))}
                </ol>
            </section>

            <div className="sticky bottom-4 z-10 flex justify-center md:bottom-6">
                <Button
                    variant="danger"
                    size="xl"
                    onClick={handleStart}
                    className="w-full max-w-sm"
                >
                    Start 60 sec timer
                </Button>
            </div>

            <ImageViewer
                variant="gallery"
                open={viewer.open}
                onClose={() => setViewer({ open: false, startIndex: 0 })}
                startIndex={viewer.startIndex}
                images={gallery.map((g) => g.url)}
                caption={(_url, i) => {
                    const item = gallery[i];
                    if (!item) return null;
                    return `Hint ${item.hintIndex + 1} · ${item.hintLabel}`;
                }}
            />
        </main>
    );
};
