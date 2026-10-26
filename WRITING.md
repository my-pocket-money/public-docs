# Writing docs

These pages are public. Readers are engineers at companies integrating with Pocket Money, who don't know our systems, our codebase or our internal names. Write the shortest page that answers their question with facts.

## Rules

- **Lead with the answer.** The first sentence states the main point. Detail and steps follow.
- **Be brief.** Delete every sentence the reader doesn't need to act or understand. Keep sentences under 30 words.
- **Use data, not adjectives.** Write "expires after 24 hours", not "expires quickly". Delete words like "simply", "just", "easily", "robust" and "seamless".
- **Leave no room for interpretation.** Name the exact endpoint, field, value and environment. If two readers could do different things after reading a sentence, rewrite it.
- **Describe what is true now.** Write about the API, not how it got there. History goes in the changelog, the commit message or the pull request.
- **Write prose, not bullet fragments.** Use lists only for steps or for items that are genuinely parallel. Number steps, one action per step, each starting with a verb.
- **Use the active voice.** Write "Send the key in the `Authorization` header", not "The key should be sent".

Review an agent's draft as you would a teammate's. Cut anything about the session that produced it, repeated context, and claims you have not checked.

## What never goes in

This repository and its history are public. Never commit secrets, real API keys, customer or partner data, partner names, internal hostnames, or unreleased plans. Pages must not mention internal systems, private repositories or Slack; maintainer files such as READMEs may name Pocket's private repositories. Use obviously fake example values, such as `cus_…` IDs from the spec's examples.

## Pages

Each page is a Markdown or MDX file under `src/content/docs/`. The file path becomes the URL. Each product (Relay, Connect) is a topic with its own sidebar, configured in `astro.config.mjs`.

Every page needs `title` and `description` frontmatter. Starlight renders the title as the page's heading, so the body starts at `##`. Set `sidebar.order` when a page needs a fixed position.

Keep a table to two or three short columns so it doesn't scroll sideways. Otherwise, use a list or a section per item.

Use Starlight's callout syntax, one callout per point:

```md
:::caution
Body text.
:::
```

Use `note` for context, `tip` for a shortcut, `caution` for a step that can go wrong, and `danger` for anything irreversible or that moves money.

## API references

Endpoint behavior lives in the OpenAPI document, not in pages: see [`openapi/relay/README.md`](openapi/relay/README.md). Pages explain workflows across endpoints and link to the reference at `/relay/api/`.

## Checking your work

Run these from the repository root, after `source bin/activate-hermit`.

Run `pnpm build` before committing. It fails on an invalid or stale contract, invalid frontmatter, MDX errors and broken internal links. Fix a broken link rather than working around it.

To preview, run `pnpm dev` and open http://localhost:4321.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), such as `docs(relay): explain batch retries`.
