import type {
  JikanAnimeFull,
  JikanAnimeListItem,
  JikanCharacter,
  JikanResponse,
} from "./types";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const USER_AGENT = "Anime-Pictionary-Stage/1.0";

interface JikanFetchOptions {
  revalidate?: number;
  signal?: AbortSignal;
}

async function jikanFetch<T>(
  path: string,
  options: JikanFetchOptions = {}
): Promise<T> {
  const { revalidate = 3600, signal } = options;
  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${JIKAN_BASE}${path}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        next: { revalidate },
        signal,
      });

      if (res.status === 429) {
        const backoff = 2 ** (attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        lastError = new Error(`Jikan rate-limited (attempt ${attempt})`);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Jikan ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (error: unknown) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 500));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Jikan request failed");
}

export async function searchAnime(
  query: string,
  options: JikanFetchOptions = {}
): Promise<JikanAnimeListItem[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: query,
    limit: "10",
    sfw: "true",
    order_by: "popularity",
    sort: "asc",
  });
  const res = await jikanFetch<JikanResponse<JikanAnimeListItem[]>>(
    `/anime?${params.toString()}`,
    { revalidate: 300, ...options }
  );
  return res.data;
}

export async function getAnimeById(
  malId: number,
  options: JikanFetchOptions = {}
): Promise<JikanAnimeFull> {
  const res = await jikanFetch<JikanResponse<JikanAnimeFull>>(
    `/anime/${malId}/full`,
    options
  );
  return res.data;
}

export async function getAnimeCharacters(
  malId: number,
  options: JikanFetchOptions = {}
): Promise<JikanCharacter[]> {
  const res = await jikanFetch<JikanResponse<JikanCharacter[]>>(
    `/anime/${malId}/characters`,
    options
  );
  return res.data;
}
