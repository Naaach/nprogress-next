import type { APIRoute } from "astro";
import { gzipSizeBadge } from "../../lib/size";

/**
 * Shields [endpoint badge](https://shields.io/badges/endpoint-badge) with the
 * measured gzip size of the core bundle. Prerendered to `dist/badges/size.json`
 * at build time, so the README badge and the docs always agree with the build.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(gzipSizeBadge()), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
