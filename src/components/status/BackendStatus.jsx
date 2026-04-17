/*
 * BackendStatus — small badge that tells you whether Supabase is reachable.
 *
 * Usage:
 *   - In the Keuzescherm footer (subtle), so the presenter knows whether
 *     admin CRUD will work without distracting the audience.
 *   - In the admin dashboard header (prominent), so the admin sees it
 *     immediately when about to add/edit a hint.
 *
 * Status meanings:
 *   - ok           → Supabase reached, admin flow will write successfully.
 *   - offline      → Supabase unreachable (network, project paused, RLS deny).
 *   - unconfigured → env vars missing. Player still works; admin is disabled.
 *   - unknown      → probe hasn't completed yet.
 */

import { useSupabaseHealth } from "../../hooks/useSupabaseHealth.js";
import { cn } from "../../lib/cn.js";

const labels = {
    ok: "Supabase online",
    offline: "Supabase onbereikbaar",
    unconfigured: "Geen backend geconfigureerd",
    unknown: "Backend controleren…",
};

const dotClass = {
    ok: "bg-emerald-600",
    offline: "bg-vermillion",
    unconfigured: "bg-muted",
    unknown: "bg-muted animate-pulse",
};

export const BackendStatus = ({ variant = "subtle", className }) => {
    const status = useSupabaseHealth();

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 rounded-full font-sans",
                variant === "subtle"
                    ? "px-3 py-1 text-xs text-muted"
                    : "px-4 py-1.5 text-sm border border-sumi/20 bg-washi-soft text-sumi",
                className
            )}
            role="status"
            aria-live="polite"
        >
            <span className={cn("size-2 rounded-full", dotClass[status])} aria-hidden />
            <span>{labels[status]}</span>
        </div>
    );
};
