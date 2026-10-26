# Relay API contract

The OpenAPI contract for the Relay API, rendered at
https://docs.pocketmoney.global/relay/api/ and downloadable from
https://docs.pocketmoney.global/relay/openapi.yaml.

Specification **0.6.1** is the current Sandbox release candidate; API paths
remain `/v1`.

| Environment | API |
| --- | --- |
| Sandbox | https://api.relay.sandbox.pocketmoney.global |
| Production | https://api.relay.pocketmoney.global |

One docs site covers both environments. The contract lists both servers.

## Files

| Path | What it is |
| --- | --- |
| `openapi.yaml` | Source contract. Edit this. |
| `release/openapi.yaml` | Locked public contract, generated from the source. |
| `release/*.md` | Resource tag descriptions, applied by `redocly.yaml`. |
| `compatibility/` | Breaking-change baselines, one per API major. |
| `redocly.yaml` | Lint rules and the decorators that build the release. |

This repository is public, so the source contains only released surface.
Design unreleased operations elsewhere and add them here when they ship; the
build fails if the source marks anything with `x-release-status`. The overview,
workflow guides and changelog are site pages in `src/content/docs/relay/`, not
part of the contract.

## Changing the contract

Run these from the repository root, after `source bin/activate-hermit`.

1. Edit `openapi/relay/openapi.yaml`.
2. Run `pnpm spec:check` to lint the source.
3. Run `pnpm spec:release` to regenerate `release/openapi.yaml` from it. Review
   the diff: it is exactly what readers and client generators see.
4. Run `pnpm build`. It fails if the source marks unreleased surface or
   `release/openapi.yaml` is stale, then builds the site.
5. Add a changelog entry to `src/content/docs/relay/changelog.md`.
6. Commit the source, the release and the changelog together.

Then update the backend's `docs/plans/pocket-api.openapi.yaml` and provenance
lock in my-pocket-money/pocket from that exact commit, retaining API major 1,
and run its `pocket-api-spec-check` and `pocket-api-contract` recipes.

## Compatibility baseline

The Check workflow compares each public API major's contract with its baseline
using oasdiff and fails on any breaking change or warning. The active baselines
are listed in `compatibility/baselines.json`, with paths relative to this
directory.

V1 is still in development, so its baseline is a checked-in snapshot. Keep that
snapshot at the latest reviewed release candidate. After rebuilding and
reviewing `release/openapi.yaml`, reset the development baseline with:

```sh
pnpm baseline:reset 1
```

Commit the contract and baseline changes together. For an intentional breaking
change, the baseline diff records that the pre-release break was accepted.

After the first production V1 release, the baseline points to that release's
immutable Git tag, and the reset command refuses to change it. See
[`RELEASING.md`](RELEASING.md).
