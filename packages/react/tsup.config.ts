import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";

/**
 * Everything is resolved from the config file's own location, rather than from
 * `process.cwd()`, so `tsup --config packages/react/tsup.config.ts` behaves
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
 * `react` and `react-dom` stay external so the host app's copy is the one that
 * runs — two Reacts in one tree is a hard crash, and the hook is built on
 * `useSyncExternalStore`, which only exists in the host's copy.
 *
 * `nprogress-next` is external too (it is a published dependency, not source
 * to inline); tsup externalises every `dependencies`/`peerDependencies` entry
 * on its own, and it is listed explicitly here so the intent survives a
 * dependency being moved between the two fields.
 *
 * `treeshake` is deliberately left off (same reason as the core package): it
 * routes the bundle through a second rollup pass whose `compact` output is both
 * slightly larger than esbuild's minifier and blind to esbuild's
 * `injectStyle`/`footer` hooks, which would silently undo the stylesheet
 * capture above.
 */
export default defineConfig({
  entry: { index: resolve(pkgRoot, "src/index.ts") },
  outDir,
  tsconfig,
  format: ["esm", "cjs"],
  platform: "browser",
  target: "es2020",
  external: ["react", "react-dom", "nprogress-next"],
  dts: true,
  sourcemap: true,
  minify: true,
  cjsInterop: true,
  injectStyle: captureCss,
  onSuccess: async () => {
    if (!minifiedCss) {
      throw new Error("nprogress-next-react: the stylesheet was not captured during the build");
    }
    writeFileSync(resolve(outDir, "styles.css"), minifiedCss, "utf8");
  },
});