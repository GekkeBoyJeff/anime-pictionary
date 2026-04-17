"use server";

import {
  getRandomMalId,
  getRandomMalIdByCategory,
} from "@/lib/hints/merge";

export async function pickRandomClassic(): Promise<string | null> {
  const malId = await getRandomMalIdByCategory("Klassieker");
  return malId ? `/anime/${malId}` : null;
}

export async function pickRandomModern(): Promise<string | null> {
  const malId = await getRandomMalIdByCategory("Modern");
  return malId ? `/anime/${malId}` : null;
}

export async function pickRandomHype(): Promise<string | null> {
  const malId = await getRandomMalIdByCategory("Nieuwe Hype");
  return malId ? `/anime/${malId}` : null;
}

export async function pickRandomAny(): Promise<string | null> {
  const malId = await getRandomMalId();
  return malId ? `/anime/${malId}` : null;
}
