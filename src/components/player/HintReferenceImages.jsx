/*
 * HintReferenceImages — asynchronous 3-up reference grid for a single hint.
 *
 * Renders 3 skeletons immediately, then swaps in thumbnails as the tiered
 * image-search resolves. If the search returns nothing, we render dashed
 * placeholders and keep the "Meer op Google" link as an escape hatch — the
 * thumbs are not clickable in that state.
 *
 * Clicking a thumb fires `onThumbClick(hintIndex, imageIndex)` — the parent
 * page owns viewer state and picks the viewer variant (gallery vs peek).
 * We intentionally do NOT open a new tab from here.
 */

import { useEffect, useState } from "react";
import { cn } from "../../lib/cn.js";
import { googleImagesSearchUrl, searchHintImages } from "../../lib/image-search.js";

const THUMB_COUNT = 3;

const Skeleton = () => (
    <div className="skeleton aspect-square w-full rounded" aria-hidden />
);

const ImageThumb = ({ url, alt, onClick }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group relative block aspect-square w-full overflow-hidden rounded",
                "bg-washi-deep focus-ring",
                "transition-transform duration-150 hover:scale-[1.03]"
            )}
            aria-label={`Bekijk referentie: ${alt}`}
        >
            <img
                src={url}
                alt={alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                data-loaded={loaded ? "true" : undefined}
                onLoad={() => setLoaded(true)}
                className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    loaded ? "opacity-100" : "opacity-0"
                )}
            />
        </button>
    );
};

export const HintReferenceImages = ({
    animeTitle,
    hint,
    hintIndex = 0,
    onThumbClick,
    className,
}) => {
    const [state, setState] = useState({ status: "loading", urls: [] });

    useEffect(() => {
        const controller = new AbortController();
        setState({ status: "loading", urls: [] });

        searchHintImages({
            animeTitle,
            hint,
            hintIndex,
            count: THUMB_COUNT,
            signal: controller.signal,
        })
            .then((urls) => {
                if (controller.signal.aborted) return;
                setState({ status: urls.length > 0 ? "ready" : "empty", urls });
            })
            .catch(() => {
                if (!controller.signal.aborted) setState({ status: "empty", urls: [] });
            });

        return () => controller.abort();
    }, [animeTitle, hint, hintIndex]);

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="grid grid-cols-3 gap-2">
                {state.status === "loading"
                    ? Array.from({ length: THUMB_COUNT }).map((_, i) => (
                          <Skeleton key={i} />
                      ))
                    : state.urls.length > 0
                      ? state.urls.map((url, i) => (
                            <ImageThumb
                                key={url}
                                url={url}
                                alt={`${hint} — ${i + 1}`}
                                onClick={
                                    onThumbClick
                                        ? () => onThumbClick(hintIndex, i, state.urls)
                                        : undefined
                                }
                            />
                        ))
                      : Array.from({ length: THUMB_COUNT }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square w-full rounded border border-dashed border-sumi/20 bg-washi-soft"
                                aria-hidden
                            />
                        ))}
            </div>

            {state.status !== "loading" ? (
                <a
                    href={googleImagesSearchUrl(`${animeTitle} ${hint}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-xs text-muted hover:text-spirit focus-ring"
                >
                    <span aria-hidden>🔎</span>
                    Meer referenties op Google →
                </a>
            ) : null}
        </div>
    );
};
