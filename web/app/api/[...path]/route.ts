import type { NextRequest } from "next/server";

// Proxy /api/* to the backend. Runs on every request (Node runtime), so
// BACKEND_URL is read at request time — no rebuild needed when it changes.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backendBase(): string {
  const raw = process.env.BACKEND_URL;
  if (!raw) {
    console.warn("[nouri/web] BACKEND_URL not set — proxy will fail");
    return "http://localhost:8000";
  }
  return raw.trim().replace(/\/+$/, "");
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(req: NextRequest, ctx: { params: { path: string[] } }) {
  const base = backendBase();
  const path = ctx.params.path.join("/");
  const search = req.nextUrl.search;
  const target = `${base}/${path}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) init.body = body;
  }

  try {
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.set(key, value);
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`[nouri/web] proxy failed: ${target}`, err);
    return new Response(
      JSON.stringify({ error: "upstream unreachable", backend: base }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
