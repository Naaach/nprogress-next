/**
 * tsup's CSS-in-JS plugin turns a plain `import css from "./styles.css"` into a
 * default-exported string, so `src/styles.ts` can hand the same stylesheet to
 * consumers inlined. Declared here rather than in `tsconfig` so the package
 * builds with no CSS types dependency.
 */
declare module "*.css" {
  const content: string;
  export default content;
}