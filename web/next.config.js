// Proxy /api/* on the web service to the backend, server-side. The browser
// only ever talks to this Next.js app — no CORS, no NEXT_PUBLIC_API_URL baked
// at build time. Configure BACKEND_URL on the web service at runtime; rotate
// it freely without rebuilding.
const RAW_BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_URL = (RAW_BACKEND_URL || "http://localhost:8000").trim().replace(/\/+$/, "");

// Print loudly at server startup so misconfiguration is obvious in the Deploy log.
console.log(`[nouri/web] BACKEND_URL=${BACKEND_URL}${RAW_BACKEND_URL ? "" : "  (DEFAULT — env var not set!)"}`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

module.exports = nextConfig;
