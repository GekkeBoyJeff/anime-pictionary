import { notFound } from "next/navigation";
import { Timer, ArrowLeft } from "lucide-react";
import { Content } from "@/components/ui/Content";
import { Link } from "@/components/ui/Link";
import { Media } from "@/components/ui/Media";
import { Button } from "@/components/ui/Button";
import { InspirationGrid } from "@/components/player/InspirationGrid";
import { getMergedHint } from "@/lib/hints/merge";

interface PageProps {
  params: Promise<{ malId: string }>;
}

export const revalidate = 3600;

export default async function InspiratieSchermPage({ params }: PageProps) {
  const { malId: malIdParam } = await params;
  const malId = Number.parseInt(malIdParam, 10);
  if (!Number.isFinite(malId)) notFound();

  const merged = await getMergedHint(malId);
  if (!merged) notFound();

  const hintsQueryString = new URLSearchParams({
    h1: merged.hints[0],
    h2: merged.hints[1],
    h3: merged.hints[2],
    title: merged.title,
  }).toString();

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 md:px-10 md:py-16">
      <nav>
        <Link variant="nav" href="/" className="inline-flex items-center gap-2">
          <ArrowLeft className="size-4" aria-hidden />
          Terug naar keuze
        </Link>
      </nav>

      <header className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(200px,280px)_1fr] md:items-start">
        <Media
          src={merged.cover.src}
          breakpoints={merged.cover.breakpoints}
          alt={`${merged.title} cover`}
          priority
          width={400}
          height={600}
          figureClassName="overflow-hidden rounded-2xl border border-ink-border shadow-[0_30px_80px_-30px_oklch(70%_0.25_340/.4)]"
          className="aspect-2/3 object-cover"
        />
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            {merged.categorie}
            {merged.year ? (
              <span className="text-muted"> · {merged.year}</span>
            ) : null}
          </span>
          <h1 className="font-display text-hero font-black leading-[0.95] tracking-tight text-paper">
            {merged.title}
          </h1>
        </div>
      </header>

      <section aria-labelledby="hints-heading" className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="hints-heading"
            className="font-display text-section font-black tracking-tight text-paper"
          >
            Teken deze 3 dingen
          </h2>
          <span className="text-sm uppercase tracking-widest text-muted">
            60 seconden
          </span>
        </div>
        <InspirationGrid hints={merged.hints} />
      </section>

      <section
        aria-labelledby="synopsis-heading"
        className="flex flex-col gap-4"
      >
        <h3
          id="synopsis-heading"
          className="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Context (voor als je het nodig hebt)
        </h3>
        {merged.synopsis ? (
          <Content size="md" value={merged.synopsis} muted />
        ) : (
          <Content size="md" value="Geen samenvatting beschikbaar." muted />
        )}
      </section>

      <div className="sticky bottom-6 mt-auto flex justify-center">
        <Link
          variant="button"
          href={`/anime/${merged.malId}/draw?${hintsQueryString}`}
          className="h-16 bg-signal px-10 text-xl font-black text-ink shadow-[0_20px_60px_-10px_oklch(82%_0.18_90/.8)] hover:bg-signal/90 animate-pulse hover:animate-none"
        >
          <Timer className="size-6" aria-hidden />
          Start 60 Seconden Timer
        </Link>
      </div>
    </main>
  );
}
