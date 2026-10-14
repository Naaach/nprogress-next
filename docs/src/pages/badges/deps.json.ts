import type { APIRoute } from "astro";
import { dependencyBadge } from "../../lib/size";

/**
 * Shields [endpoint badge](https://shields.io/badges/endpoint-badge) with the
 * core's runtime dependency count, read from its manifest. Prerendered to
 * `dist/badges/deps.json` at build time.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(dependencyBadge()), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
