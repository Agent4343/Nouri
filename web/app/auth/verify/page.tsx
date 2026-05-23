"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { track } from "@/lib/track";
import { LeafMark } from "@/components/LeafMark";

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="pt-6 text-ink">Signing you in…</p>}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [email, setEmail] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setErrMsg("This link is missing its token. Try signing in again.");
      return;
    }
    api
      .authVerify({ device_id: getDeviceId(), token })
      .then((me) => {
        setEmail(me.email);
        setState("ok");
        track("sign_in_completed");
        setTimeout(() => router.replace("/"), 1500);
      })
      .catch((e) => {
        setState("error");
        setErrMsg(
          String(e).includes("expired")
            ? "This link expired. Sign in again to get a fresh one."
            : "We couldn't verify that link. Sign in again.",
        );
      });
  }, [params, router]);

  if (state === "working") {
    return (
      <section className="flex min-h-[68vh] flex-col items-center justify-center gap-4 text-center">
        <LeafMark className="h-12 w-12" />
        <p className="text-muted">Signing you in…</p>
      </section>
    );
  }

  if (state === "ok") {
    return (
      <section className="flex min-h-[68vh] flex-col items-center justify-center gap-3 text-center">
        <LeafMark className="h-12 w-12" />
        <h1 className="text-2xl font-medium">You're in.</h1>
        <p className="text-sm text-muted">Signed in as {email}. Taking you home…</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center gap-4 text-center">
      <LeafMark className="h-12 w-12" />
      <h1 className="text-2xl font-medium">Couldn't sign in</h1>
      <p className="max-w-xs text-sm text-ink">{errMsg}</p>
      <Link
        href="/auth/sign-in"
        className="rounded-xl2 bg-sage px-5 py-3 text-cream shadow-sm hover:bg-sageDark"
      >
        Try again
      </Link>
    </section>
  );
}
