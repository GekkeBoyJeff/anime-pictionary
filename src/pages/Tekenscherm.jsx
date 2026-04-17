/*
 * Tekenscherm — wraps StageTimer and resolves the hints + title from the
 * catalog so the timer component can render them.
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { StageTimer } from "../components/player/StageTimer.jsx";
import { useCatalog } from "../hooks/useCatalog.js";
import { resolveHint } from "../lib/hints-merge.js";

export const Tekenscherm = () => {
    const params = useParams();
    const catalog = useCatalog();
    const malId = Number.parseInt(params.malId, 10);
    const [resolved, setResolved] = useState(null);

    useEffect(() => {
        if (catalog.status !== "ready" || !Number.isFinite(malId)) return;
        let cancelled = false;
        resolveHint(malId, catalog.data).then((merged) => {
            if (!cancelled && merged) setResolved(merged);
        });
        return () => {
            cancelled = true;
        };
    }, [catalog.status, catalog.data, malId]);

    if (!resolved) {
        return (
            <main className="flex flex-1 items-center justify-center">
                <span className="font-display text-3xl text-muted">…</span>
            </main>
        );
    }

    return (
        <StageTimer
            malId={resolved.mal_id}
            hints={resolved.hints}
            animeTitle={resolved.title}
        />
    );
};
