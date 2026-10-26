# AGENTS.md

This repository is Pocket Money's public developer documentation at https://docs.pocketmoney.global. It is a [Starlight](https://starlight.astro.build) site: pages are Markdown or MDX files under `src/content/docs/`, and each API reference is rendered by [Scalar](https://scalar.com) from an OpenAPI document under `openapi/`. The repository is public, so everything committed here is published.

- Before writing or editing a page, read [`WRITING.md`](WRITING.md) and follow it.
- Before changing the Relay API contract, read [`openapi/relay/README.md`](openapi/relay/README.md). Edit `openapi/relay/openapi.yaml`, never the generated `release/openapi.yaml` by hand.
- Use the hermit toolchain: `source bin/activate-hermit`, then `pnpm`. Run `pnpm build` before committing.
