# Releasing the Relay API contract

A merge to `main` publishes the contract: the Deploy workflow builds the site
and rolls it out to Cloud Run at https://docs.pocketmoney.global. One site
documents both Sandbox and Production; there is no separate Sandbox docs
deployment. Run the commands below from the repository root, after
`source bin/activate-hermit`.

## Before the first production release

0.7.0 is the current Sandbox release candidate; API paths remain `/v1`.

V1 uses a resettable development baseline before its first production release.
After an accepted contract change:

1. Update the source contract, then run `pnpm spec:release` and review
   `release/openapi.yaml`.
2. Run `pnpm baseline:reset 1`.
3. Review the resulting baseline diff.
4. Commit the contract and baseline changes together.

This reset is only for an API major that has never been released to production.
It is how an intentional pre-release breaking change is recorded in review.

## Publishing a production release

1. Confirm the deployed implementation matches the reviewed contract commit,
   and that the Deploy workflow for that commit succeeded.
2. Create and push an immutable tag for that commit, for example
   `relay-api-v1-0.7.0`.
3. In `compatibility/baselines.json`, change V1 from `development` to `release`.
4. Set `ref` to the new tag and `path` to the contract path at that tag,
   relative to `openapi/relay`: `release/openapi.yaml`.
5. Remove the development snapshot that is no longer referenced.
6. Confirm the Check workflow resolves and checks the tagged contract.

Do not move or replace a published tag. Do not advance the configured release
baseline until publication has been verified.

For a later compatible V1 release, repeat these steps and then advance V1's
`ref` to the newly published tag. The new tag becomes the baseline for the next
change.
