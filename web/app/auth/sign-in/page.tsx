"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

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
      <section className="flex flex-col gap-4 pt-6">
        <h1 className="text-2xl font-medium">Check your inbox</h1>
        <p className="text-ink">
          We sent a sign-in link to <strong>{email}</strong>. Tap it to finish — the link expires in
          15 minutes.
        </p>
        <p className="text-sm text-muted">
          Didn't get it? Check spam, or{" "}
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="underline"
          >
            try a different address
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
    <section className="flex flex-col gap-5 pt-6">
      <div>
        <h1 className="text-2xl font-medium">Sign in</h1>
        <p className="mt-1 text-sm text-ink">
          Optional — sign in so your meals follow you across devices. We'll email you a link, no
          password to remember.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl2 bg-card px-4 py-3 text-ink ring-1 ring-sand outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={working || !email.trim()}
          className="rounded-xl2 bg-sage px-5 py-4 text-cream shadow-sm hover:bg-sageDark disabled:opacity-60"
        >
          {working ? "Sending…" : "Email me a link"}
        </button>

        {err && <p className="text-sm text-ink">{err}</p>}
      </form>

      <Link href="/" className="text-center text-sm text-muted underline-offset-4 hover:underline">
        Not now — keep using anonymously
      </Link>
    </section>
  );
}
