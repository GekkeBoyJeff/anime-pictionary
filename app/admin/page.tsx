import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { JikanSearch } from "@/components/admin/JikanSearch";
import { Link } from "@/components/ui/Link";
import { Content } from "@/components/ui/Content";
import { SignOutButton } from "./SignOutButton";
import { fetchAllHints } from "@/lib/hints/merge";
import { requireAdminUser } from "@/lib/supabase/guard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminUser();
  const hints = await fetchAllHints();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-black tracking-tight text-paper">
            Beheer hints
          </h1>
          <Content
            size="md"
            muted
            value={`${hints.length} series · Zoek hieronder om nieuwe anime toe te voegen.`}
          />
        </div>
        <SignOutButton />
      </div>

      <section
        aria-labelledby="search-heading"
        className="rounded-2xl border border-ink-border bg-ink-soft/40 p-6 md:p-8"
      >
        <div className="mb-4 flex items-center gap-3">
          <Plus className="size-5 text-signal" aria-hidden />
          <h2
            id="search-heading"
            className="font-display text-xl font-bold tracking-tight text-paper"
          >
            Nieuwe anime zoeken op MyAnimeList
          </h2>
        </div>
        <Suspense
          fallback={<div className="h-16 animate-pulse rounded-xl bg-ink" />}
        >
          <JikanSearch />
        </Suspense>
      </section>

      <section aria-labelledby="existing-heading" className="flex flex-col gap-4">
        <h2
          id="existing-heading"
          className="font-display text-xl font-bold tracking-tight text-paper"
        >
          Bestaande hints ({hints.length})
        </h2>
        {hints.length === 0 ? (
          <Content
            muted
            value="Nog geen hints. Voeg er een toe via het zoekveld hierboven."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {hints.map((hint) => (
              <li key={hint.id}>
                <Link
                  href={`/admin/hints/${hint.mal_id}`}
                  variant="inline"
                  className="group flex items-start gap-4 rounded-xl border border-ink-border bg-ink-soft/60 p-4 no-underline transition-colors hover:border-accent"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-semibold text-paper">
                      {hint.title}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-accent">
                      {hint.categorie}
                    </span>
                    <span className="truncate text-sm text-muted">
                      {hint.hint_1} · {hint.hint_2} · {hint.hint_3}
                    </span>
                  </div>
                  <Pencil
                    className="size-4 flex-none text-muted group-hover:text-accent"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
