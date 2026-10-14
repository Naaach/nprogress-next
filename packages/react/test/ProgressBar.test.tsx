import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProgressBar } from "../src/index";
import { resetDom, teardown } from "./support";

const root = (container: HTMLElement): HTMLElement => container.firstElementChild as HTMLElement;

beforeEach(() => {
  resetDom();
});

afterEach(async () => {
  await teardown();
});

describe("<ProgressBar />", () => {
  it("renders the documented markup contract", () => {
    const { container } = render(<ProgressBar progress={0.4} />);
    const el = root(container);

    expect(el.tagName).toBe("DIV");
    expect(el.className).toBe("np-root");
    expect(el.getAttribute("role")).toBe("progressbar");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("1");
    expect(el.getAttribute("aria-valuenow")).toBe("40");
    expect(el.getAttribute("aria-label")).toBe("Loading");
    expect(el.children).toHaveLength(2);

    const bar = el.querySelector<HTMLElement>(".np-bar");
    expect(bar).not.toBeNull();
    expect(bar?.style.transform).toBe("translate3d(-60%,0,0)");
    expect(bar?.style.transition).toBe("all 200ms linear");
    // Geometry is inline so the component works with zero CSS imports.
    expect(bar?.style.position).toBe("fixed");
    expect(bar?.style.top).toBe("0px");
    expect(bar?.style.left).toBe("0px");
    expect(bar?.style.width).toBe("100%");
    expect(bar?.style.height).toBe("var(--np-height)");
    expect(bar?.style.background).toBe("var(--np-color)");
    expect(bar?.style.zIndex).toBe("var(--np-z)");
    expect(bar?.firstElementChild?.className).toBe("np-peg");

    const spinner = el.querySelector<HTMLElement>(".np-spinner");
    expect(spinner).not.toBeNull();
    expect(spinner?.getAttribute("aria-hidden")).toBe("true");
    expect(spinner?.style.position).toBe("fixed");
    expect(spinner?.style.top).toBe("15px");
    expect(spinner?.style.right).toBe("15px");
    expect(spinner?.style.zIndex).toBe("var(--np-z)");
    expect(spinner?.firstElementChild?.className).toBe("np-spinner-icon");
  });

  it("exposes aria-valuenow as a rounded 0..100 percentage", () => {
    const cases: Array<[number, string]> = [
      [0, "0"],
      [0.005, "1"],
      [0.4, "40"],
      [0.456, "46"],
      [0.999, "100"],
      [1, "100"],
    ];

    for (const [progress, expected] of cases) {
      const { container, unmount } = render(<ProgressBar progress={progress} />);
      expect(root(container).getAttribute("aria-valuenow")).toBe(expected);
      unmount();
    }
  });

  it("clamps progress below 0 and above 1", () => {
    const low = render(<ProgressBar progress={-5} />);
    expect(root(low.container).getAttribute("aria-valuenow")).toBe("0");
    expect(root(low.container).querySelector<HTMLElement>(".np-bar")?.style.transform).toBe(
      "translate3d(-100%,0,0)",
    );
    low.unmount();

    const high = render(<ProgressBar progress={42} />);
    expect(root(high.container).getAttribute("aria-valuenow")).toBe("100");
    expect(root(high.container).querySelector<HTMLElement>(".np-bar")?.style.transform).toBe(
      "translate3d(0%,0,0)",
    );
    high.unmount();
  });

  it("treats a non-finite progress as 0", () => {
    const { container } = render(<ProgressBar progress={Number.NaN} />);
    expect(root(container).getAttribute("aria-valuenow")).toBe("0");
  });

  it("defaults to 0 progress, spinner on and label 'Loading'", () => {
    const { container } = render(<ProgressBar />);
    const el = root(container);

    expect(el.getAttribute("aria-valuenow")).toBe("0");
    expect(el.getAttribute("aria-label")).toBe("Loading");
    expect(el.querySelector(".np-spinner")).not.toBeNull();
    expect(el.style.getPropertyValue("--np-color")).toBe("#29d");
    expect(el.style.getPropertyValue("--np-height")).toBe("2px");
    expect(el.style.getPropertyValue("--np-z")).toBe("1031");
  });

  it("renders nothing when visible is false", () => {
    const { container } = render(<ProgressBar visible={false} progress={0.5} />);
    expect(container.innerHTML).toBe("");
  });

  it("omits the spinner subtree when spinner is false", () => {
    const { container } = render(<ProgressBar spinner={false} />);
    const el = root(container);

    expect(el.querySelector(".np-spinner")).toBeNull();
    expect(el.querySelector(".np-spinner-icon")).toBeNull();
    // The bar itself is untouched.
    expect(el.children).toHaveLength(1);
    expect(el.firstElementChild?.className).toBe("np-bar");
  });

  it("omits aria-label for label={null} and applies a custom label", () => {
    const without = render(<ProgressBar label={null} />);
    expect(root(without.container).hasAttribute("aria-label")).toBe(false);
    without.unmount();

    const custom = render(<ProgressBar label="Uploading files" />);
    expect(root(custom.container).getAttribute("aria-label")).toBe("Uploading files");
  });

  it("emits the CSS custom properties from height, color and zIndex", () => {
    const { container } = render(
      <ProgressBar height="6px" color="#f43f5e" zIndex={9999} progress={0.5} />,
    );
    const el = root(container);

    expect(el.style.getPropertyValue("--np-color")).toBe("#f43f5e");
    expect(el.style.getPropertyValue("--np-height")).toBe("6px");
    expect(el.style.getPropertyValue("--np-z")).toBe("9999");

    const bar = el.querySelector<HTMLElement>(".np-bar");
    expect(bar?.style.height).toBe("var(--np-height)");
    expect(bar?.style.background).toBe("var(--np-color)");
    expect(bar?.style.zIndex).toBe("var(--np-z)");
  });

  it("accepts a string zIndex", () => {
    const { container } = render(<ProgressBar zIndex="var(--my-layer)" />);
    expect(root(container).style.getPropertyValue("--np-z")).toBe("var(--my-layer)");
  });

  it("applies speed and easing to the bar transition", () => {
    const { container } = render(<ProgressBar speed={450} easing="ease-out" />);
    const bar = root(container).querySelector<HTMLElement>(".np-bar");
    expect(bar?.style.transition).toBe("all 450ms ease-out");
  });

  it("merges className and style over the generated values", () => {
    // React's `CSSProperties` does not model custom properties, so the caller
    // needs the same widening the component does internally.
    const themed = {
      opacity: 0.5,
      "--np-color": "red",
    } as CSSProperties & Record<`--${string}`, string>;

    const { container } = render(<ProgressBar className="app-bar" style={themed} />);
    const el = root(container);

    expect(el.className).toBe("np-root app-bar");
    expect(el.style.opacity).toBe("0.5");
    // The caller's declaration wins over the `color` prop's default.
    expect(el.style.getPropertyValue("--np-color")).toBe("red");
  });

  it("re-renders the bar and aria-valuenow when progress changes", () => {
    const { container, rerender } = render(<ProgressBar progress={0.1} />);
    expect(root(container).querySelector<HTMLElement>(".np-bar")?.style.transform).toBe(
      "translate3d(-90%,0,0)",
    );

    rerender(<ProgressBar progress={0.75} />);
    expect(root(container).getAttribute("aria-valuenow")).toBe("75");
    expect(root(container).querySelector<HTMLElement>(".np-bar")?.style.transform).toBe(
      "translate3d(-25%,0,0)",
    );
  });

  it("never touches the DOM outside its own subtree", () => {
    const { container } = render(<ProgressBar progress={0.3} />);
    // No `#nprogress` container: the component is presentational and does not
    // create a core instance.
    expect(document.getElementById("nprogress")).toBeNull();
    expect(container.querySelector("#nprogress")).toBeNull();
  });
});