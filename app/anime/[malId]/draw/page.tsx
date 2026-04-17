import { notFound } from "next/navigation";
import { TimerCountdown } from "@/components/player/TimerCountdown";

interface PageProps {
  params: Promise<{ malId: string }>;
  searchParams: Promise<{
    h1?: string;
    h2?: string;
    h3?: string;
    title?: string;
  }>;
}

const MAX_HINT_LENGTH = 80;

function validHint(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= MAX_HINT_LENGTH
  );
}

export default async function TekenschermPage({
  params,
  searchParams,
}: PageProps) {
  const { malId } = await params;
  const sp = await searchParams;
  if (!malId) notFound();
  if (!validHint(sp.h1) || !validHint(sp.h2) || !validHint(sp.h3)) notFound();

  const hints: readonly [string, string, string] = [sp.h1, sp.h2, sp.h3];

  return <TimerCountdown hints={hints} />;
}
