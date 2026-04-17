/*
 * useAuth — exposes the current Supabase user (or null) and updates when
 * the session changes (sign-in, sign-out, token refresh).
 *
 * Used by the admin pages to client-side-guard routes. The real security
 * enforcement lives in Supabase RLS — this hook only shapes the UI.
 */

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

/** @returns {{ user: object | null, status: "loading" | "authenticated" | "anonymous" | "unconfigured" }} */
export const useAuth = () => {
    const [state, setState] = useState({ user: null, status: "loading" });

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setState({ user: null, status: "unconfigured" });
            return;
        }

        let cancelled = false;

        supabase.auth.getUser().then(({ data }) => {
            if (cancelled) return;
            setState({
                user: data.user,
                status: data.user ? "authenticated" : "anonymous",
            });
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (cancelled) return;
            setState({
                user: session?.user ?? null,
                status: session?.user ? "authenticated" : "anonymous",
            });
        });

        return () => {
            cancelled = true;
            sub.subscription.unsubscribe();
        };
    }, []);

    return state;
};
