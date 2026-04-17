"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Content } from "@/components/ui/Content";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/admin";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-ink-border bg-ink-soft/40 p-8 backdrop-blur"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black tracking-tight text-paper">
          Admin inloggen
        </h1>
        <Content
          size="sm"
          muted
          value="Alleen voor beheerders. Credentials worden handmatig aangemaakt in Supabase."
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted">
          E-mail
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-ink-border bg-ink px-4 py-3 text-paper focus-ring focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted">
          Wachtwoord
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-ink-border bg-ink px-4 py-3 text-paper focus-ring focus:border-accent"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-alarm/50 bg-alarm/10 px-4 py-3 text-sm text-alarm">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth>
        <LogIn className="size-5" aria-hidden />
        Inloggen
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <Suspense
        fallback={
          <div className="mx-auto h-96 w-full max-w-md animate-pulse rounded-2xl bg-ink-soft" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
