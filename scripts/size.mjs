/**
 * Bundle size gate for the core package.
 *
 * Prints the gzipped size of every published artifact and fails the build when
 * the ESM bundle exceeds `BUDGET_GZIP`. Run after `pnpm build`.
 *
 * The budget exists so the size advertised in the README cannot silently rot.
 */
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Gzipped budget for the ESM bundle, in bytes. */
const BUDGET_GZIP = 3072; // 3 KB

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "core", "dist");

/** @type {Array<{ name: string, budget: boolean }>} */
const artifacts = [
  { name: "index.js", budget: true },
  { name: "index.cjs", budget: false },
  { name: "nprogress-next.global.js", budget: false },
  { name: "styles.css", budget: false },
];

const kib = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;
let overBudget = false;

for (const { name, budget } of artifacts) {
  const bytes = readFileSync(join(dist, name));
  const gzip = gzipSync(bytes, { level: 9 }).length;
  const flag = budget ? (gzip > BUDGET_GZIP ? "OVER" : "ok") : "";
  if (budget && gzip > BUDGET_GZIP) overBudget = true;
  console.log(
    `${name.padEnd(26)} ${kib(bytes.length).padStart(10)} raw ${kib(gzip).padStart(10)} gzip  ${flag}`,
  );
}

if (overBudget) {
  console.error(`\nCore ESM bundle exceeds the ${kib(BUDGET_GZIP)} gzip budget.`);
  process.exit(1);
}