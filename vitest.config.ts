import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
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
  /**
   * `@vitejs/plugin-react` and `@vitejs/plugin-vue` are registered globally so
   * `packages/react/test/**` and `packages/vue/test/**` are transformed without
   * any per-package config. Both plugins are inert for files they do not own
   * (the Vue plugin only claims `.vue`, the React plugin only enables JSX for
   * `.jsx`/`.tsx`), so a single root config drives every package.
   *
   * `react`/`react-dom`/`vue` themselves are root devDependencies: the adapter
   * packages only declare them as peers, so they are installed once here.
   */
  plugins: [react(), vue()],
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
   * `@vitejs/plugin-react` configures that Oxc JSX transform itself
   * (`oxc.jsx.runtime = "automatic"`), so no extra `oxc`/`esbuild` option is
   * needed here — verified by `packages/react/test/*.test.tsx`.
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