/*
 * Keuzescherm — entry page.
 *
 * Two actions share the screen:
 *   1. Search + filters (top) — for players who already know what they want.
 *   2. Swipe deck (bottom) — for "just give me something".
 *
 * Primary interaction stays above the fold on mobile. DAC logo + AnimeCon
 * banner sit in the header as brand identity — not celebratory hero art,
 * just a clear "this is ours".
 */

import { Link } from "../components/ui/Link.jsx";
import { Content } from "../components/ui/Content.jsx";
import { DacLogo } from "../components/brand/DacLogo.jsx";
import { AnimeConBanner } from "../components/brand/AnimeConBanner.jsx";
import { AnimeSwipeDeck } from "../components/player/AnimeSwipeDeck.jsx";
import { AnimeSearch } from "../components/search/AnimeSearch.jsx";
import { useCatalog } from "../hooks/useCatalog.js";

const LoadingShell = () => (
    <main className="page-fade-in mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-5 py-16">
        <Content size="md" muted value="Catalog opent zich…" />
    </main>
);

const ErrorShell = ({ error }) => (
    <main className="page-fade-in mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        <h1 className="font-display text-4xl text-sumi">Catalog niet bereikbaar</h1>
        <Content muted value={error?.message ?? "Onbekende fout"} />
    </main>
);

export const Keuzescherm = () => {
    const catalog = useCatalog();

    if (catalog.status === "loading") return <LoadingShell />;
    if (catalog.status === "error") return <ErrorShell error={catalog.error} />;

    return (
        <main className="page-fade-in relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-6 md:gap-10 md:px-8 md:py-10">
            <header className="flex flex-col gap-4">
                {/* Brand row: DAC mark + app title on the left, AnimeCon banner
                    on the right. On mobile it wraps; on md+ they sit side by side. */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/"
                        variant="nav"
                        className="flex items-center gap-2.5 text-sumi hover:text-spirit no-underline"
                    >
                        <DacLogo size={40} className="transition-transform duration-300 hover:scale-105" />
                        <span className="font-display text-2xl leading-none md:text-3xl">
                            Anime Pictionary
                        </span>
                    </Link>
                    <AnimeConBanner height={52} className="max-w-[55%]" />
                </div>

                <Content
                    size="md"
                    muted
                    value="Kies een anime uit de stapel of zoek een specifieke titel."
                />
            </header>

            <AnimeSearch catalog={catalog.data} />

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                <span className="h-px flex-1 bg-sumi/15" aria-hidden />
                <span>Of laat het toeval beslissen</span>
                <span className="h-px flex-1 bg-sumi/15" aria-hidden />
            </div>

            <AnimeSwipeDeck catalog={catalog.data} />

            <footer className="flex items-center justify-center gap-3 pt-4 font-serif text-xs text-muted">
                <span>Dutch Anime Community · AnimeCon 2026</span>
                <span aria-hidden>·</span>
                <Link variant="nav" href="/admin">
                    Admin
                </Link>
            </footer>
        </main>
    );
};
