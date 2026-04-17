import { z } from "zod";

export const animeCategorySchema = z.enum([
  "Klassieker",
  "Modern",
  "Nieuwe Hype",
]);
export type AnimeCategory = z.infer<typeof animeCategorySchema>;

export const customAnimeHintRowSchema = z.object({
  id: z.string().uuid(),
  mal_id: z.number().int().positive(),
  title: z.string(),
  image_url: z.string().nullable(),
  categorie: animeCategorySchema,
  hint_1: z.string().min(1).max(80),
  hint_2: z.string().min(1).max(80),
  hint_3: z.string().min(1).max(80),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CustomAnimeHintRow = z.infer<typeof customAnimeHintRowSchema>;

export function parseHintRow(row: unknown): CustomAnimeHintRow {
  return customAnimeHintRowSchema.parse(row);
}

export function parseHintRowNullable(
  row: unknown
): CustomAnimeHintRow | null {
  if (row === null || row === undefined) return null;
  return customAnimeHintRowSchema.parse(row);
}
