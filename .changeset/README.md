# Changesets

This folder is used by [Changesets](https://github.com/changesets/changesets)
to track version bumps and generate changelogs for the published packages
(`nprogress-next`, `nprogress-next-react`, `nprogress-next-vue`).

## Adding a changeset

When your change should be released, run:

```sh
pnpm changeset
```

Pick the affected packages, choose a bump type (`patch` / `minor` / `major`) and
write a short summary. This creates a markdown file inside `.changeset/` that
must be committed together with your code.

## Releasing

```sh
pnpm version   # applies pending changesets, bumps versions, writes CHANGELOGs
pnpm release   # builds every package and publishes to npm
```

`access` is set to `public` in `config.json` so packages are published publicly
under the unscoped names above.
