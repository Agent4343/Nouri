"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    api
      .authMe(getDeviceId())
      .then((me) => setEmail(me.email))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    setWorking(true);
    try {
      await api.authSignOut(getDeviceId());
      setEmail(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl2 bg-card p-4 ring-1 ring-sand">
      <div>
        <div className="text-sm text-muted">Account</div>
        <div className="mt-0.5 text-base text-ink">
          {loading ? "…" : email ? email : "Not signed in"}
        </div>
        <div className="mt-1 text-xs text-muted">
          {email
            ? "Your meals follow this address across devices."
            : "Sign in to keep your data when you switch devices. Anonymous works fine too."}
        </div>
      </div>

      {email ? (
        <button
          onClick={signOut}
          disabled={working}
          className="self-start rounded-full bg-card px-3 py-1.5 text-sm text-muted ring-1 ring-sand hover:text-ink disabled:opacity-60"
        >
          {working ? "Signing out…" : "Sign out"}
        </button>
      ) : (
        <Link
          href="/auth/sign-in"
          className="self-start rounded-xl2 bg-sage px-4 py-2 text-sm text-cream shadow-sm hover:bg-sageDark"
        >
          Sign in with email
        </Link>
      )}
    </div>
  );
}
