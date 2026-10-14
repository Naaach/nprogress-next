import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";

/**
 * Everything is resolved from the config file's own location, rather than from
 * `process.cwd()`, so `tsup --config packages/core/tsup.config.ts` behaves
 * identically to running `tsup` from inside the package.
 */
const pkgRoot = import.meta.dirname;

/** Every format lands here. */
const outDir = resolve(pkgRoot, "dist");

/** The package's own tsconfig, pinned so the build does not depend on `cwd`. */
const tsconfig = resolve(pkgRoot, "tsconfig.json");

/**
 * The minified stylesheet, captured during the build. See `captureCss`.
 */
let minifiedCss = "";

/**
 * `injectStyle` is called by tsup with the stylesheet *after* it has been run
 * through esbuild's CSS minifier, and must return the JS module that replaces
 * `styles.css` as an import.
 *
 * Returning `export default "<css>"` keeps `src/styles.ts` and
 * `src/globals.d.ts` untouched, but the string baked into `dist/index.js` is
 * now minified instead of the raw, commented source — worth ~160 bytes of
 * gzip on every consumer.
 *
 * Capturing it here also guarantees that the stylesheet inlined into the bundle
 * and the shipped `dist/styles.css` are byte-identical: there is exactly one
 * stylesheet and exactly one minified form of it.
 */
const captureCss = (css: string): string => {
  // tsup hands over `JSON.stringify(css)`; normalise the trailing newline once
  // so the inlined string and `dist/styles.css` are byte-identical.
  const normalised = `${JSON.parse(css).trimEnd()}\n`;
  minifiedCss = normalised;
  return `export default ${JSON.stringify(normalised)}`;
};

/**
 * The original NProgress ships `module.exports = NProgress`, so a CJS app that
 * swaps the dependency string expects the singleton itself. esbuild's interop
 * shim hands back a namespace object instead, turning `NProgress.start()` into
 * `TypeError: NProgress.start is not a function`. Re-export the singleton with
 * the named exports attached to it.
 */
const dropInCjsFooter = ({ format }: { format: string }): { js: string } | Record<string, never> =>
  format === "cjs"
    ? { js: "module.exports = Object.assign(module.exports.default, module.exports);" }
    : {};

/**
 * `tsup` runs every config object in the array as an independent, concurrent
 * build. `clean: true` is therefore unsafe here — whichever process happens to
 * finish cleaning first can delete the other one's output. `dist` is wiped
 * explicitly by the package's `build` script instead.
 *
 * Note also that `treeshake` is deliberately left off: it routes the bundle
 * through a second rollup pass whose `compact` output is both slightly larger
 * than esbuild's minifier and blind to esbuild's `footer`, which would silently
 * undo the CJS drop-in fix above.
 */
export default defineConfig([
  {
    entry: { index: resolve(pkgRoot, "src/index.ts") },
    outDir,
    tsconfig,
    format: ["esm", "cjs"],
    platform: "browser",
    target: "es2020",
    dts: true,
    sourcemap: true,
    minify: true,
    cjsInterop: true,
    injectStyle: captureCss,
    footer: dropInCjsFooter,
    onSuccess: async () => {
      if (!minifiedCss) {
        throw new Error("nprogress-next: the stylesheet was not captured during the build");
      }
      writeFileSync(resolve(outDir, "styles.css"), minifiedCss, "utf8");
    },
  },
  {
    // Named `nprogress-next` so the artifact is exactly
    // `dist/nprogress-next.global.js` — the path `unpkg`/`jsdelivr` advertise.
    //
    // NOTE: `globalName` is deliberately NOT set. Setting it makes the IIFE
    // assign the whole module namespace (`{ default, … }`) to the global,
    // which overwrites the `globalThis.NProgressNext = facade` performed inside
    // `src/global.ts`. That left CDN users with `NProgressNext.configure is not
    // a function` — they had to reach through `NProgressNext.default`. The
    // manual assignment is the single source of truth for the global.
    entry: { "nprogress-next": resolve(pkgRoot, "src/global.ts") },
    outDir,
    tsconfig,
    format: ["iife"],
    platform: "browser",
    target: "es2020",
    sourcemap: true,
    minify: true,
    injectStyle: captureCss,
  },
]);