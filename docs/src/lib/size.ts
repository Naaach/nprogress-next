/**
 * Real size of the core bundle, measured from its build output.
 *
 * `packages/core/dist/index.js` exists by the time the docs build runs, because
 * `pnpm build` resolves workspace packages in topological order. Measuring the
 * actual artifact — instead of hard-coding a number — keeps the docs, the
 * shields badge and the `pnpm size` gate in agreement: they all read the same
 * bytes, so they cannot drift apart.
 *
 * Everything degrades to `null` when the artifact is missing (a fresh clone
 * that has not been built yet), so a missing measurement can never break the
 * docs build.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/** Locates a file inside `packages/`, whichever directory Astro is run from. */
function inPackages(relative: string): string | null {
  const candidates = [
    join(process.cwd(), "..", "packages", relative), // cwd = docs/
    join(process.cwd(), "packages", relative), // cwd = repository root
  ];
  return candidates.find(existsSync) ?? null;
}

export interface CoreSize {
  /** Uncompressed bytes of the ESM bundle. */
  raw: number;
  /** Gzipped bytes of the ESM bundle. */
  gzip: number;
}

/** Measures `packages/core/dist/index.js`, or `null` when it has not been built. */
export function measureCoreSize(): CoreSize | null {
  const bundle = inPackages(join("core", "dist", "index.js"));
  if (!bundle) return null;

  const raw = readFileSync(bundle);
  return { raw: raw.byteLength, gzip: gzipSync(raw).byteLength };
}

/** `3033` → `"3.0 KB"`. One decimal is what both our gate and Bundlephobia round to. */
export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Prose form used across the docs: `≈ 3 KB`. */
export function sizeLabel(): string {
  const size = measureCoreSize();
  return size ? `≈ ${Math.round(size.gzip / 1024)} KB` : "≈ 3 KB";
}

/** Payload for a shields [endpoint badge](https://shields.io/badges/endpoint-badge). */
export interface EndpointBadge {
  schemaVersion: 1;
  label: string;
  message: string;
  color: string;
}

/** `![gzip size](…/badges/size.json)` — measured, never hard-coded. */
export function gzipSizeBadge(): EndpointBadge {
  const size = measureCoreSize();
  return {
    schemaVersion: 1,
    label: "gzip size",
    message: size ? formatKilobytes(size.gzip) : "n/a",
    color: size ? "blue" : "lightgrey",
  };
}

/** `![dependencies](…/badges/deps.json)` — read from the core manifest. */
export function dependencyBadge(): EndpointBadge {
  const manifest = inPackages(join("core", "package.json"));
  const count = manifest
    ? Object.keys(
        (
          JSON.parse(readFileSync(manifest, "utf8")) as {
            dependencies?: Record<string, string>;
          }
        ).dependencies ?? {},
      ).length
    : null;

  return {
    schemaVersion: 1,
    label: "dependencies",
    message: count === null ? "n/a" : String(count),
    color: count === null ? "lightgrey" : count === 0 ? "brightgreen" : "orange",
  };
}
