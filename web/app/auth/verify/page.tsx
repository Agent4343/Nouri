"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

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
    return <p className="pt-6 text-ink">Signing you in…</p>;
  }

  if (state === "ok") {
    return (
      <section className="flex flex-col gap-3 pt-6">
        <h1 className="text-2xl font-medium">You're in.</h1>
        <p className="text-ink">Signed in as {email}. Sending you home…</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 pt-6">
      <h1 className="text-2xl font-medium">Couldn't sign in</h1>
      <p className="text-ink">{errMsg}</p>
      <Link
        href="/auth/sign-in"
        className="self-start rounded-xl2 bg-sage px-4 py-3 text-cream shadow-sm hover:bg-sageDark"
      >
        Try again
      </Link>
    </section>
  );
}
