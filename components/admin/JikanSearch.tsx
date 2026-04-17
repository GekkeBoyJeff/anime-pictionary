"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface JikanSearchResult {
  mal_id: number;
  title: string;
  title_english: string | null;
  year: number | null;
  image_url: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function JikanSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<JikanSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/jikan/search?q=${encodeURIComponent(debounced)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<ApiResponse<JikanSearchResult[]>>)
      .then((res) => {
        if (controller.signal.aborted || !mountedRef.current) return;
        if (!res.success) throw new Error(res.error ?? "Zoekopdracht mislukt");
        setResults(res.data ?? []);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || !mountedRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Onbekende fout");
      })
      .finally(() => {
        if (controller.signal.aborted || !mountedRef.current) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative flex items-center">
        <Search
          className="absolute left-4 size-5 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek anime (bijv. Naruto, Frieren, Chainsaw Man)…"
          className="w-full rounded-xl border border-ink-border bg-ink-soft pl-12 pr-4 py-4 text-lg text-paper placeholder:text-muted focus-ring focus:border-accent"
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
        />
        {loading ? (
          <Loader2
            className="absolute right-4 size-5 animate-spin text-muted"
            aria-hidden
          />
        ) : null}
      </label>

      {error ? (
        <p className="rounded-lg border border-alarm/50 bg-alarm/10 px-4 py-3 text-sm text-alarm">
          {error}
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r) => (
            <li key={r.mal_id}>
              <button
                type="button"
                onClick={() => router.push(`/admin/hints/${r.mal_id}`)}
                className="group flex w-full items-start gap-4 rounded-xl border border-ink-border bg-ink-soft/60 p-3 text-left transition-colors hover:border-accent focus-ring"
              >
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt=""
                    width={72}
                    height={108}
                    loading="lazy"
                    decoding="async"
                    className="h-[108px] w-[72px] flex-none rounded-md object-cover"
                  />
                ) : (
                  <div className="h-[108px] w-[72px] flex-none rounded-md bg-ink" />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-semibold text-paper group-hover:text-accent">
                    {r.title}
                  </span>
                  {r.title_english && r.title_english !== r.title ? (
                    <span className="truncate text-sm text-muted">
                      {r.title_english}
                    </span>
                  ) : null}
                  {r.year ? (
                    <span className="text-xs text-muted">{r.year}</span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {debounced && !loading && !error && results.length === 0 ? (
        <p className="text-muted">Geen resultaten voor &ldquo;{debounced}&rdquo;.</p>
      ) : null}
    </div>
  );
}
