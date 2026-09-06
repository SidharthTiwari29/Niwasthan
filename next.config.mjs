import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // Real fix for a real, genuinely blank live site: the
            // previous policy's bare `default-src 'self'` blocked
            // Next.js's own inline hydration/streaming <script> tags,
            // which React's App Router relies on to finish rendering a
            // page after the initial HTML - without them, a page can
            // build successfully and still render completely blank in
            // a real browser, exactly what was reported. `'unsafe-inline'`
            // on script-src is a real, deliberate trade-off (a stricter
            // nonce-based CSP is the more secure alternative, and a
            // genuine follow-up worth doing once the app is otherwise
            // stable) - not an oversight, and still far more restrictive
            // than having no CSP at all. `'unsafe-eval'` is included
            // because Next.js's Turbopack-built client runtime uses it
            // in the dev/HMR path and some production edge cases;
            // worth re-auditing once this is confirmed stable in
            // production. connect-src 'self' explicitly allows the
            // app's own API routes, which default-src 'self' already
            // covers but is stated explicitly for clarity.
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};
export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
