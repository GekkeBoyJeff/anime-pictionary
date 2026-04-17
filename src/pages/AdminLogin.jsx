/*
 * AdminLogin — email + password form against Supabase Auth.
 *
 * After a successful sign-in we redirect to `/admin` (or `?redirect=` when
 * the auth guard kicked the user here). The `?redirect=` value is
 * whitelisted — only local paths, never an external URL.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/Button.jsx";
import { Content } from "../components/ui/Content.jsx";
import { Link } from "../components/ui/Link.jsx";
import { DacLogo } from "../components/brand/DacLogo.jsx";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

/**
 * Only allow `/`-rooted paths as redirect targets. This prevents an
 * open-redirect where `?redirect=https://evil` hijacks the user post-login.
 */
const sanitizeRedirect = (raw) => {
    if (!raw) return "/admin";
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";
};

export const AdminLogin = () => {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = sanitizeRedirect(searchParams.get("redirect"));

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isSupabaseConfigured()) {
            setError("Geen Supabase geconfigureerd.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) {
                setError(authError.message);
                return;
            }
            setLocation(redirectTo);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Inloggen mislukt");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page-fade-in mx-auto flex w-full max-w-md flex-1 items-center px-5 py-10 md:py-16">
            <form
                onSubmit={handleSubmit}
                noValidate
                className="flex w-full flex-col gap-6 rounded-lg border border-sumi/15 bg-washi-soft p-6 md:p-8 shadow-(--shadow-pop)"
            >
                <div className="flex items-center gap-3">
                    <DacLogo size={36} className="text-sumi" />
                    <div className="flex flex-col gap-1">
                        <h1 className="font-display text-4xl leading-none text-sumi">Admin</h1>
                        <Content
                            size="sm"
                            muted
                            value="Alleen voor podium-beheerders."
                        />
                    </div>
                </div>

                <label className="flex flex-col gap-1.5">
                    <span className="font-serif text-sm font-semibold text-sumi">E-mail</span>
                    <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-md border-2 border-sumi/30 bg-washi px-4 py-3 font-sans text-base text-sumi focus:border-spirit focus-ring"
                    />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="font-serif text-sm font-semibold text-sumi">Wachtwoord</span>
                    <input
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-md border-2 border-sumi/30 bg-washi px-4 py-3 font-sans text-base text-sumi focus:border-spirit focus-ring"
                    />
                </label>

                {error ? (
                    <p
                        role="alert"
                        className="rounded-md border-2 border-vermillion/60 bg-vermillion/10 px-4 py-3 text-sm text-vermillion"
                    >
                        {error}
                    </p>
                ) : null}

                <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth>
                    Inloggen
                </Button>

                <div className="text-center text-sm text-muted">
                    <Link variant="inline" href="/">
                        ← Naar speler-flow
                    </Link>
                </div>
            </form>
        </main>
    );
};
