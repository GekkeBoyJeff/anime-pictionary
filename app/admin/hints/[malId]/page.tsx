import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HintForm } from "@/components/admin/HintForm";
import { Link } from "@/components/ui/Link";
import { Media } from "@/components/ui/Media";
import { Content } from "@/components/ui/Content";
import { getAnimeById } from "@/lib/jikan/client";
import { parseHintRowNullable } from "@/lib/hints/schema";
import { requireAdminUser } from "@/lib/supabase/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ malId: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminHintPage({ params }: PageProps) {
  await requireAdminUser();
  const { malId: malIdParam } = await params;
  const malId = Number.parseInt(malIdParam, 10);
  if (!Number.isFinite(malId)) notFound();

  const supabase = await createSupabaseServerClient();

  const [animeRes, hintRes] = await Promise.all([
    getAnimeById(malId).catch(() => null),
    supabase
      .from("custom_anime_hints")
      .select("*")
      .eq("mal_id", malId)
      .maybeSingle(),
  ]);

  if (!animeRes) notFound();

  const existingRow = parseHintRowNullable(hintRes.data);
  const existing = existingRow
    ? {
        categorie: existingRow.categorie,
        hint_1: existingRow.hint_1,
        hint_2: existingRow.hint_2,
        hint_3: existingRow.hint_3,
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <nav>
        <Link
          variant="nav"
          href="/admin"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Terug naar dashboard
        </Link>
      </nav>

      <header className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:items-start">
        <Media
          src={animeRes.images.jpg.image_url}
          alt={`${animeRes.title} cover`}
          width={200}
          height={300}
          priority
          figureClassName="overflow-hidden rounded-xl border border-ink-border"
          className="aspect-2/3 object-cover"
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm uppercase tracking-widest text-muted">
            MAL ID: {animeRes.mal_id}
            {animeRes.year ? ` · ${animeRes.year}` : ""}
          </span>
          <h1 className="font-display text-3xl font-black tracking-tight text-paper md:text-4xl">
            {animeRes.title}
          </h1>
          {animeRes.title_english && animeRes.title_english !== animeRes.title ? (
            <Content size="sm" muted value={animeRes.title_english} />
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-ink-border bg-ink-soft/40 p-6 md:p-8">
        <HintForm
          malId={animeRes.mal_id}
          title={animeRes.title}
          imageUrl={animeRes.images.jpg.image_url}
          existing={existing}
        />
      </section>
    </div>
  );
}
