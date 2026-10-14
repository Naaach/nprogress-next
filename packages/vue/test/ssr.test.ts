import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, defineComponent, h, nextTick, resolveComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import type { ProgressInstance } from "nprogress-next";
import { NProgressNext, ProgressBar, useProgress } from "../src/index";

/**
 * The stylesheet source, read from disk.
 *
 * Vitest runs with `css: false`, so *any* CSS import — bare, `?inline` or
 * through this package's own `styles` re-export — resolves to an empty string;
 * only the tsup/esbuild build populates it. Reading the file is the only way to
 * assert on the source of truth here. The path is resolved from `cwd`, which
 * the root Vitest config pins to the workspace root.
 */
const stylesheet = readFileSync(
  resolve(process.cwd(), "packages/vue/src/styles.css"),
  "utf8",
);

/* ------------------------------------------------------------------ */
/* SSR                                                                 */
/* ------------------------------------------------------------------ */

const settle = (progress: ProgressInstance): void => {
  progress.configure({ trickle: false, speed: 0 });
  try {
    if (progress.status !== null) progress.done(true);
  } finally {
    progress.remove();
  }
};

const tracked: ProgressInstance[] = [];

afterEach(() => {
  // Unstub *before* touching the DOM: the no-document test leaves `document`
  // as `undefined`, and the cleanup below needs a document to clean.
  vi.unstubAllGlobals();
  for (const progress of tracked.splice(0)) settle(progress);
  document.body.innerHTML = "";
});

describe("server-side rendering", () => {
  it("renders <ProgressBar /> to the same markup the client hydrates to", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(ProgressBar, { progress: 0.42 }),
      }),
    );

    expect(html).toBe(
      `<div class="np-root" role="progressbar" aria-valuemin="0" aria-valuemax="100" ` +
        `aria-valuenow="42" aria-label="Loading" style="--np-color:#29d;--np-height:2px;--np-z:1031;">` +
        `<div class="np-bar" style="position:fixed;top:0;left:0;width:100%;background:var(--np-color, #29d);` +
        `height:var(--np-height, 2px);z-index:var(--np-z);` +
        `transform:translate3d(-58%,0,0);transition:all 200ms linear;">` +
        `<div class="np-peg"></div></div>` +
        `<div class="np-spinner" aria-hidden="true" style="position:fixed;top:15px;right:15px;` +
        `z-index:var(--np-z);"><div class="np-spinner-icon"></div></div></div>`,
    );
  });

  it("renders a comment placeholder when hidden on the server", async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(ProgressBar, { visible: false }) }),
    );
    expect(html).toBe("<!---->");
  });

  it("renders a component that calls useProgress()", async () => {
    const Server = defineComponent({
      setup() {
        const { status, isStarted } = useProgress({ trickle: false, speed: 0 });
        return () =>
          h("main", { class: status.value === null ? "idle" : "busy" }, [
            h(ProgressBar, { progress: status.value ?? 0, visible: isStarted.value }),
          ]);
      },
    });

    const html = await renderToString(createSSRApp(Server));
    expect(html).toBe('<main class="idle"><!----></main>');
  });

  it("does not touch the DOM while there is no document", async () => {
    // The whole point of the guard: `renderToString` runs before hydration, and
    // an unguarded `document` read would throw here.
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("window", undefined);

    const Server = defineComponent({
      setup() {
        const api = useProgress({ trickle: true, speed: 200 });
        tracked.push(api.progress);
        // A no-op on the server — the core's `start()` bails out without a DOM.
        api.start();
        return () => h(ProgressBar, { progress: api.status.value ?? 0 });
      },
    });

    const html = await renderToString(createSSRApp(Server));
    expect(html).toContain('role="progressbar"');
  });

  it("ships a stylesheet that only contains what cannot be inlined", () => {
    expect(stylesheet).toContain(".np-peg");
    expect(stylesheet).toContain(".np-spinner-icon");
    expect(stylesheet).toContain("@keyframes np-next-spin");
    // Geometry is inline, so the stylesheet must not redeclare it.
    expect(stylesheet).not.toMatch(/position:\s*fixed/);
    // Every class selector is namespaced under the component's own `np-*`
    // prefix, so importing it alongside the core stylesheet cannot collide.
    // (`[A-Za-z]` after the dot keeps decimal values such as `0.5` out.)
    const classNames = stylesheet.match(/(?<![\w-])\.[A-Za-z][\w-]*/g) ?? [];
    expect(classNames.length).toBeGreaterThan(0);
    for (const name of classNames) {
      expect(name.startsWith(".np-"), `${name} is not namespaced under .np-`).toBe(true);
    }
  });

  it("falls back to a complete, static ring under reduced motion", () => {
    const reduced = stylesheet.slice(stylesheet.indexOf("@media (prefers-reduced-motion: reduce)"));

    expect(reduced).toContain("animation: none");
    // All four borders are painted, so the frozen spinner reads as a complete
    // dimmed ring instead of a half-drawn arc.
    expect(reduced).toContain("border-top-color");
    expect(reduced).toContain("border-right-color");
    expect(reduced).toContain("border-bottom-color");
    expect(reduced).toContain("border-left-color");
    expect(reduced).toContain("opacity: 0.5");
  });
});

/* ------------------------------------------------------------------ */
/* Plugin                                                              */
/* ------------------------------------------------------------------ */

describe("NProgressNext plugin", () => {
  it("registers <ProgressBar /> globally", () => {
    const app = createApp({ render: () => h("div") });
    app.use(NProgressNext);
    expect(app.component("ProgressBar")).toBe(ProgressBar);
  });

  it("resolves <ProgressBar /> by name after app.use()", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    // A render function has to say `resolveComponent` out loud — a bare
    // `h("ProgressBar")` would build a `<progressbar>` *element*, not the
    // component. This is exactly what the template compiler emits.
    const Root = defineComponent({
      setup() {
        const Bar = resolveComponent("ProgressBar");
        return () => h("main", null, [h(Bar)]);
      },
    });

    const app = createApp(Root);
    app.use(NProgressNext);
    app.mount(host);
    await nextTick();

    expect(host.querySelector(".np-root")).not.toBeNull();
    expect(host.querySelector(".np-root")?.getAttribute("role")).toBe("progressbar");

    app.unmount();
  });

  it("can be installed through test-utils' global plugins", () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const Bar = resolveComponent("ProgressBar");
          return () => h(Bar, { progress: 0.25 });
        },
      }),
      { global: { plugins: [NProgressNext] } },
    );
    expect(wrapper.find(".np-root").attributes("aria-valuenow")).toBe("25");
  });

  it("is a plain plugin object, not a bare install function", () => {
    expect(typeof NProgressNext).toBe("object");
    expect(typeof NProgressNext.install).toBe("function");
  });
});