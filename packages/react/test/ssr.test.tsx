import { renderToStaticMarkup, renderToString } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProgressBar, useProgress } from "../src/index";
import { resetDom, teardown } from "./support";

/**
 * Everything below runs in the same jsdom document the DOM tests use, so "no
 * `window`/`document` access" has to be asserted structurally: the markup must
 * come out complete and nothing may be mounted, scheduled or injected.
 *
 * The bar is gated on `isStarted`, which is exactly the point: the server
 * snapshot is the idle one, so a server render of a fresh hook produces no bar
 * at all — and a client render produces the same thing, which is what keeps
 * hydration quiet.
 */
function Harness(): ReactElement {
  const { status, isStarted } = useProgress({ trickle: false, speed: 0 });
  // One template literal, not three children: `renderToString` puts a
  // `<!-- -->` separator between adjacent text nodes, which would make the
  // server markup unreadable to assert against.
  const readout = `${isStarted ? "started" : "idle"}:${status === null ? "null" : status.toFixed(2)}`;
  return (
    <>
      <output data-testid="readout">{readout}</output>
      <ProgressBar progress={status ?? 0} visible={isStarted} label="Server" />
    </>
  );
}

beforeEach(() => {
  resetDom();
});

afterEach(async () => {
  await teardown();
});

describe("server rendering", () => {
  it("renderToString(<ProgressBar />) produces the full markup", () => {
    const html = renderToString(<ProgressBar progress={0.4} />);

    expect(html).toContain('class="np-root"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain('aria-label="Loading"');
    expect(html).toContain('class="np-bar"');
    expect(html).toContain('class="np-peg"');
    expect(html).toContain('class="np-spinner"');
    expect(html).toContain('class="np-spinner-icon"');
    expect(html).toContain("translate3d(-60%,0,0)");
    expect(html).toContain("--np-height:2px");
  });

  it("renderToStaticMarkup(<ProgressBar />) honours every prop", () => {
    const html = renderToStaticMarkup(
      <ProgressBar
        progress={0.75}
        spinner={false}
        label="Uploading"
        height="4px"
        color="#f43f5e"
        zIndex={4242}
        speed={350}
        easing="ease-in"
        className="app"
      />,
    );

    expect(html).toContain('aria-valuenow="75"');
    expect(html).toContain('aria-label="Uploading"');
    expect(html).toContain('class="np-root app"');
    expect(html).toContain("--np-color:#f43f5e");
    expect(html).toContain("--np-height:4px");
    expect(html).toContain("--np-z:4242");
    expect(html).toContain("all 350ms ease-in");
    expect(html).not.toContain("np-spinner");
  });

  it("renderToString of a component calling useProgress() does not throw", () => {
    const html = renderToString(<Harness />);

    expect(html).toContain("idle:null");
    // The hook's server snapshot is idle, so `visible` is false and the bar is
    // not rendered — exactly what the first client render will produce too.
    expect(html).not.toContain("np-root");
    expect(html).not.toContain("progressbar");
  });

  it("renderToString of a component calling useProgress() with a visible bar works", () => {
    const html = renderToString(
      <ProgressBar progress={0.25} visible label="Server" spinner={false} />,
    );

    expect(html).toContain('class="np-root"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain('aria-label="Server"');
    expect(html).toContain('class="np-bar"');
    expect(html).toContain('class="np-peg"');
  });

  it("mounts nothing, schedules nothing and injects no styles on the server", () => {
    const before = document.head.childElementCount;
    renderToString(<Harness />);

    expect(document.getElementById("nprogress")).toBeNull();
    expect(document.getElementById("nprogress-next-styles")).toBeNull();
    expect(document.body.innerHTML).toBe("");
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
    expect(document.head.childElementCount).toBe(before);
  });

  it("reports the idle snapshot as the server snapshot", () => {
    // `useSyncExternalStore` calls `getServerSnapshot` on the server; a hook that
    // returned live values there would make `isStarted` true and break hydration.
    expect(renderToString(<Harness />)).toContain("idle:null");
  });
});