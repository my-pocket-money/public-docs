# Pocket Money Docs

Pocket Money's public developer documentation, served at
https://docs.pocketmoney.global. It is a [Starlight](https://starlight.astro.build)
site with an API reference for each product rendered by
[Scalar](https://scalar.com).

| Path | Product |
| --- | --- |
| `/relay/` | Relay: guides, changelog and the API reference at `/relay/api/` |
| `/connect/` | Connect: placeholder until its docs are published |

## Development

The toolchain (Node 24, pnpm 12) comes from [hermit](https://cashapp.github.io/hermit/):

```sh
source bin/activate-hermit
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # checks the API contracts, then builds the site into dist/
```

- Pages: `src/content/docs/`. Read [`WRITING.md`](WRITING.md) first.
- Relay API contract: `openapi/relay/`. Read its [README](openapi/relay/README.md).
- Site and sidebar configuration, including Scalar's: `astro.config.mjs`.

Scalar's browser bundle is served from this site at the version pinned in
`package.json` (`@scalar/api-reference`), not loaded from a CDN. Upgrade it
deliberately and check `/relay/api/` before merging.

## Deploy

Every merge to `main` deploys: `.github/workflows/deploy.yml` builds the
`Dockerfile` (the site served by nginx on port 8080) and rolls it out to Cloud
Run. Pull requests run `.github/workflows/check.yml`, which builds the site and
checks the Relay contract for breaking changes.

To run the production image locally:

```sh
docker build -t public-docs .
docker run --rm -p 8080:8080 public-docs   # http://localhost:8080
```
