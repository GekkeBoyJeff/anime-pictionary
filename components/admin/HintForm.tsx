"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnimeCategory } from "@/lib/hints/merge";

const hintSchema = z.object({
  categorie: z.enum(["Klassieker", "Modern", "Nieuwe Hype"]),
  hint_1: z.string().min(2, "Minstens 2 tekens").max(80, "Max 80 tekens"),
  hint_2: z.string().min(2, "Minstens 2 tekens").max(80, "Max 80 tekens"),
  hint_3: z.string().min(2, "Minstens 2 tekens").max(80, "Max 80 tekens"),
});

type HintFormValues = z.infer<typeof hintSchema>;

interface HintFormProps {
  malId: number;
  title: string;
  imageUrl: string | null;
  existing: {
    categorie: AnimeCategory;
    hint_1: string;
    hint_2: string;
    hint_3: string;
  } | null;
}

const CATEGORIES: AnimeCategory[] = ["Klassieker", "Modern", "Nieuwe Hype"];

export function HintForm({ malId, title, imageUrl, existing }: HintFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HintFormValues>({
    resolver: zodResolver(hintSchema),
    defaultValues: existing ?? {
      categorie: "Klassieker",
      hint_1: "",
      hint_2: "",
      hint_3: "",
    },
  });

  const onSubmit = async (values: HintFormValues) => {
    setErrorMessage(null);
    setStatusMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("custom_anime_hints").upsert(
      {
        mal_id: malId,
        title,
        image_url: imageUrl,
        categorie: values.categorie,
        hint_1: values.hint_1,
        hint_2: values.hint_2,
        hint_3: values.hint_3,
      },
      { onConflict: "mal_id" }
    );

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setStatusMessage("Opgeslagen!");
    startTransition(() => {
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!window.confirm(`"${title}" verwijderen?`)) return;

    setErrorMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("custom_anime_hints")
      .delete()
      .eq("mal_id", malId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.push("/admin");
    startTransition(() => router.refresh());
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold uppercase tracking-widest text-muted">
          Categorie
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="cursor-pointer rounded-lg border border-ink-border bg-ink-soft px-4 py-2 text-sm font-medium text-paper/80 transition-colors hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:text-paper"
            >
              <input
                type="radio"
                value={cat}
                {...register("categorie")}
                className="sr-only"
              />
              {cat}
            </label>
          ))}
        </div>
      </fieldset>

      {([1, 2, 3] as const).map((n) => {
        const key = `hint_${n}` as const;
        return (
          <label key={key} className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-widest text-muted">
              Tekenbaar object {n}
            </span>
            <input
              type="text"
              {...register(key)}
              className="rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-lg text-paper focus-ring focus:border-accent"
              autoComplete="off"
              maxLength={80}
            />
            {errors[key] ? (
              <span className="text-sm text-alarm">
                {errors[key]?.message}
              </span>
            ) : null}
          </label>
        );
      })}

      {errorMessage ? (
        <p className="rounded-lg border border-alarm/50 bg-alarm/10 px-4 py-3 text-sm text-alarm">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="rounded-lg border border-signal/50 bg-signal/10 px-4 py-3 text-sm text-signal">
          {statusMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting || isPending}
        >
          <Save className="size-5" aria-hidden />
          {existing ? "Bijwerken" : "Opslaan"}
        </Button>
        {existing ? (
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" aria-hidden />
            Verwijderen
          </Button>
        ) : null}
      </div>
    </form>
  );
}
