/*
 * `cn` — tiny class-name helper used throughout the UI.
 *
 * Combines clsx (conditional class composition) with tailwind-merge
 * (dedupes conflicting Tailwind utilities, so `cn("p-2", "p-4")` yields "p-4"
 * instead of both classes racing in the cascade).
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => twMerge(clsx(inputs));
