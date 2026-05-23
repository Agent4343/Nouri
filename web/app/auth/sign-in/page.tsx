"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LeafMark } from "@/components/LeafMark";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setWorking(true);
    setErr(null);
    try {
      await api.authStart(email.trim().toLowerCase());
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr("Email send failed. " + msg);
    } finally {
      setWorking(false);
    }
  }

  if (sent) {
    return (
      <section className="flex min-h-[68vh] flex-col items-center justify-center gap-5 text-center">
        <LeafMark className="h-12 w-12" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium">Check your inbox</h1>
          <p className="max-w-xs text-sm text-ink">
            We sent a sign-in link to <strong>{email}</strong>. Tap it to finish — it expires in 15
            minutes.
          </p>
        </div>
        <p className="text-sm text-muted">
          Didn't get it? Check spam, or{" "}
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="text-sage underline-offset-4 hover:underline"
          >
            try another address
          </button>
          .
        </p>
        <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">
          ← back to home
        </Link>
      </section>
    );
  }

  return (
    <section className="flex min-h-[68vh] flex-col justify-center gap-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <LeafMark className="h-12 w-12" />
        <h1 className="text-2xl font-medium">Take Nouri with you</h1>
        <p className="max-w-xs text-sm text-muted">
          Sign in and your meals follow you between devices. We'll email a link — no password to
          remember.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-xl2 bg-card px-4 py-4 text-center text-ink ring-1 ring-sand outline-none"
        />
        <button
          type="submit"
          disabled={working || !email.trim()}
          className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {working ? "Sending…" : "Email me a link"}
        </button>
        {err && <p className="text-center text-sm text-ink">{err}</p>}
      </form>

      <Link href="/" className="text-center text-sm text-muted underline-offset-4 hover:underline">
        Not now — keep going anonymously
      </Link>
    </section>
  );
}
