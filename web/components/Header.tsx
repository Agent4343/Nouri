"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeafMark } from "./LeafMark";

export function Header() {
  const pathname = usePathname();
  // Keep auth pages distraction-free — wordmark only, no nav.
  const minimal = pathname?.startsWith("/auth") ?? false;

  return (
    <header className="flex items-center justify-between pb-6">
      <Link href="/" className="flex items-center gap-2 text-xl font-medium tracking-tight">
        <LeafMark />
        Nouri
      </Link>
      {!minimal && (
        <nav className="flex gap-4 text-sm text-muted">
          <Link href="/saved" className="hover:text-ink">Saved</Link>
          <Link href="/snap" className="hover:text-ink">Snap</Link>
          <Link href="/settings" className="hover:text-ink">Settings</Link>
        </nav>
      )}
    </header>
  );
}
