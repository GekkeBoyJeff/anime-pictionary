import { Link } from "@/components/ui/Link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 md:px-10">
      <header className="flex items-center justify-between border-b border-ink-border pb-4">
        <Link
          variant="nav"
          href="/admin"
          className="font-display text-xl font-black tracking-tight text-paper"
        >
          Admin Dashboard
        </Link>
        <Link variant="nav" href="/">
          ← Naar speler-flow
        </Link>
      </header>
      {children}
    </div>
  );
}
