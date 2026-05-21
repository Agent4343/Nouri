// Browser only talks to this Next.js app. Requests under /api/* are handled
// by web/app/api/[...path]/route.ts which proxies to BACKEND_URL at request
// time. This file deliberately does NOT use Next.js rewrites because, with
// output: "standalone", rewrites are evaluated at build time and bake the
// BACKEND_URL value into the build artifacts.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

module.exports = nextConfig;
