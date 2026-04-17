"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Uitloggen mislukt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        loading={loading}
      >
        <LogOut className="size-4" aria-hidden />
        Uitloggen
      </Button>
      {error ? (
        <span className="text-xs text-alarm" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
