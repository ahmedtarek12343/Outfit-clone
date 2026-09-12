import type { NextConfig } from "next";

/**
 * `STATIC_EXPORT=1 next build` produces a fully static `out/` directory with
 * no Node server required — useful for previews and for hosting on any static
 * file server (GitHub Pages, S3, Netlify).
 *
 * It is env-gated rather than always-on because static export gives up the
 * Image Optimization API: `unoptimized: true` means the original AVIFs are
 * served as-is instead of being resized per breakpoint. For the real deploy
 * you want the default (server) output so `next/image` can do its job.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        // The optimizer is a server route; a static export has no server.
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
