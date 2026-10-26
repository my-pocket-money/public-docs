# Writing docs

Write the shortest page that answers the reader's question with facts. These rules apply to everyone who writes Pocket Money's public docs, people and agents alike. They are Docket's writing guide, adapted for a public site.

## Where a doc goes

This site, https://docs.pocketmoney.global, holds what a developer outside Pocket needs to integrate with a Pocket Money API: guides to workflows that span endpoints, and each product's API reference.

Endpoint behavior belongs in the product's OpenAPI document under `openapi/`, which Scalar renders as the API reference. Link to the reference from a page instead of restating it, so there is one copy to keep current.

Internal material, such as setup, runbooks, how our systems fit together and unreleased plans, belongs in Docket.

## Rules

Write for an engineer at a partner company in their first week of integrating. A page that works for them works for an agent too, so don't write separate instructions for agents.

- **Lead with the answer.** The first sentence states the main point. Detail and steps follow.
- **Be brief.** Delete every sentence the reader doesn't need to act or understand. Keep sentences under 30 words.
- **Use data, not adjectives.** Write "expires after 24 hours", not "expires quickly". Write "fails when the batch has over 1,000 items", not "sometimes fails on large batches". Delete words like "simply", "just", "easily", "robust" and "significantly".
- **Leave no room for interpretation.** Name the exact endpoint, field, value and environment. If two readers could do different things after reading a sentence, rewrite it.
- **Pass the "so what?" test.** Every paragraph tells the reader something they need. If it doesn't, delete it.
- **Describe what is true now.** Write about the API, not how you learned it, what was tried, or the conversation that produced the page. History goes in the changelog, the commit message or the pull request.
- **Write prose, not bullet fragments.** Use lists only for steps or for items that are genuinely parallel. Number steps, one action per step, each starting with a verb.
- **Use the active voice.** Write "Send the key in the `Authorization` header", not "The key should be sent".

> [!CAUTION]
> Review an agent's draft as you would a teammate's. Cut anything about the session that produced it, repeated context, and claims you have not checked.

## Facts

Check every endpoint, field, value and default against the released contract, such as `openapi/relay/release/openapi.yaml`, before writing it down. Link to the API reference, not to source code: readers can't see Pocket's repositories.

Give commands exactly as they are typed. List environments in the order Sandbox, production.

Never put secrets, credentials, customer or partner data, partner names, internal hostnames or unreleased plans in a doc. The site, this repository and its history are all public.

Don't point readers to Slack channels or to individuals. Point them to their Pocket contact.

## Callouts

Use a callout to break up long text or to flag something the reader must not miss. One callout per point: a page full of them hides the one that matters.

Site pages use Starlight's syntax:

```md
:::note
Body text.
:::
```

Use `note` for context, `tip` for a shortcut, `caution` for a step that can go wrong, and `danger` for anything irreversible or that moves money.

Markdown that GitHub renders, such as this guide or a README, uses GitHub's syntax:

```md
> [!NOTE]
> Body text.
```

GitHub supports `NOTE`, `TIP`, `IMPORTANT`, `WARNING` and `CAUTION`.

> [!CAUTION]
> The two syntaxes don't mix. On the site, `> [!NOTE]` renders as a plain quote. On GitHub, `:::note` renders as plain text.

## Pages

Each page is a Markdown or MDX file under `src/content/docs/`. The file path becomes the URL. Each product, such as Relay, is a topic with its own sidebar, set in `astro.config.mjs`. A new section needs an entry in its topic's `items`, or its pages don't appear in the sidebar.

Every page needs `title` and `description` frontmatter. Starlight renders the title as the page's heading, so the body starts at `##`. Set `sidebar.order` in the frontmatter when a page needs a fixed position.

Keep a table to two or three short columns so it doesn't scroll sideways. Otherwise, use a list or a section per item.

Wrap a placeholder such as `<customer id>` in backticks. Outside code, Markdown reads it as an HTML tag and hides it.

## Checking your work

Run these from the root of this repository, after `source bin/activate-hermit`.

Run `pnpm build` before committing. It fails on an invalid or stale API contract, invalid frontmatter, MDX errors and broken internal links. Fix a broken link rather than working around it.

To preview, start the dev server in the background with `pnpm astro dev --background`. Manage it with `pnpm astro dev status`, `pnpm astro dev logs` and `pnpm astro dev stop`.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), such as `docs(relay): explain batch retries`.
