/*
 * useSupabaseHealth — lightweight health probe for the Supabase backend.
 *
 * Purpose: render a status indicator so the presenter can see at a glance
 * whether the admin CRUD flow will work. This does NOT affect the player
 * flow (which is static + offline) — it is purely operational visibility.
 *
 * Strategy: one `select count head` every 60 seconds. Uses `Promise.race`
 * against a 2.5s timeout so a dead Supabase doesn't hang the UI.
 */

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const PROBE_INTERVAL_MS = 60_000;
const PROBE_TIMEOUT_MS = 2_500;

/** @returns {"unknown" | "ok" | "offline" | "unconfigured"} */
export const useSupabaseHealth = () => {
    const [status, setStatus] = useState("unknown");

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setStatus("unconfigured");
            return;
        }

        let cancelled = false;

        const probe = async () => {
            const timeout = new Promise((resolve) =>
                setTimeout(() => resolve({ error: "timeout" }), PROBE_TIMEOUT_MS)
            );
            const request = supabase
                .from("custom_anime_hints")
                .select("*", { count: "exact", head: true })
                .limit(1);

            const result = await Promise.race([request, timeout]);
            if (cancelled) return;
            setStatus(result?.error ? "offline" : "ok");
        };

        probe();
        const id = window.setInterval(probe, PROBE_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, []);

    return status;
};
