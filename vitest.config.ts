import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute path to the core sources.
 *
 * The workspace alias below lets adapter packages (and any future test) import
 * `nprogress-next` by its public name *before* `dist/` exists, so tests never
 * depend on build order.
 */
const coreSrc = fileURLToPath(new URL("./packages/core/src/", import.meta.url));

export default defineConfig({
  resolve: {
    // Order matters: the longer, more specific specifier has to win, otherwise
    // `nprogress-next/styles.css` would resolve to `nprogress-next` + `/styles.css`.
    alias: [
      { find: /^nprogress-next\/styles\.css$/, replacement: `${coreSrc}styles.css` },
      { find: /^nprogress-next\/global$/, replacement: `${coreSrc}global.ts` },
      { find: /^nprogress-next$/, replacement: `${coreSrc}index.ts` },
    ],
  },
  /**
   * NOTE: Vite 8 / Vitest 5 transpile `.tsx` through Oxc, not esbuild, so the
   * `esbuild: { jsx }` option is ignored (Vite warns about the conflict).
   * Oxc's default JSX runtime is `automatic`, matching the root
   * `tsconfig.json`, so adapter tests run without importing React.
   *
   * NOTE: the React and Vue vitest plugins are intentionally *not* installed
   * yet — a later phase adds them together with the adapter packages.
   */
  test: {
    environment: "jsdom",
    include: ["packages/*/test/**/*.test.ts?(x)"],
    globals: true,
    passWithNoTests: true,
    // Adapter tests share a single jsdom document, so every test must start
    // from a clean slate regardless of what the previous one left behind.
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
});