---
title: Relay API
description: What the Relay API covers, its environments, and the rules every request follows, from authentication to idempotency, errors and settlement.
sidebar:
  label: Overview
  order: 1
---

The Relay API lets Pocket Customers manage Accounts and recipients, move
money, submit Batches of transfers, and reconcile Account-relative balances
and activity.

- A **Customer** (`cus_…`) is the person or business represented by the API key.
- An **Account** (`acc_…`) holds a Customer's funds and has its own ID.
  A Customer can own multiple Accounts in the same currency.
- A **Recipient** is another Pocket Customer saved for future transfers.
- A **Transfer** is an outbound movement from an owned Account, either to
  another owned Account or to another Pocket Customer.
- A **Deposit** is the inbound view of a movement into an owned Account.
- A **Batch** groups one or more Customer-to-Customer transfers for submission
  and reconciliation.

Pocket publishes the Relay API as an OpenAPI specification rather than client
SDKs. Browse it in the [API reference](/relay/api/), or download
[`openapi.yaml`](/relay/openapi.yaml) to generate a client.

## API surface

| Resource | Purpose |
| --- | --- |
| Accounts | Create, list, retrieve and label the Customer's funds containers. |
| Balances | Read current funds by Account. |
| Recipients | Manage a business Customer's payout roster. |
| Transactions | Read inbound and outbound activity together. |
| Transfers | Create and reconcile same-Customer Account transfers and Customer-to-Customer P2P. |
| Deposits | Reconcile money received by the Customer. |
| Batch transfers | Submit and reconcile asynchronous Customer-to-Customer payouts. |

Specification **0.6.1** uses the existing `/v1` paths. This is the Sandbox
release candidate; it does not establish what is deployed to production.

## Environments

| Environment | API base URL |
| --- | --- |
| Sandbox | `https://api.relay.sandbox.pocketmoney.global` |
| Production | `https://api.relay.pocketmoney.global` |

Use a key issued in the environment you are calling. Do not use a production
key or production funds for Sandbox tests. Paths and JSON examples below are
relative to the selected API base URL. Replace example IDs with resources in
that environment. Use a new idempotency key for each new operation, and reuse
that key when retrying the same operation.

For example, read Sandbox Accounts with an environment-specific bearer key:

```sh
curl 'https://api.relay.sandbox.pocketmoney.global/v1/accounts' \
  -H "Authorization: Bearer $RELAY_SANDBOX_API_KEY"
```

## Supported scope and availability

The release contains **23 public operations** across the seven resource
families above. New Accounts, internal Transfers and Batches use **USD**.
An Account's owner, currency and default designation cannot
be changed through these endpoints. Account updates change the label, reference
and metadata.

Operations require appropriate permissions and eligible Customers and Accounts.
Payments also require sufficient funds. Customer-to-Customer payments may have a limit
on the total sent in the previous 30 days. This includes pending and settled
payments. The limit can vary by Customer. Batch acceptance confirms submission;
check each item's status to confirm payment.

## Authentication and ownership

Send the API key as a bearer token:

```text
Authorization: Bearer eak_v1_...
```

Every request runs as the Customer attached to that key. A source `account_id`
must belong to it. Direct retrieval of another Customer's resource returns
`404` as if it did not exist. List-filter error behaviour is described on each
operation. Recipient, Account-create and Batch operations require an
active, unblocked business Customer. Pending, suspended, closed, blocked or
non-business Customers cannot use those business-only operations.

The key must also contain every scope named by the operation. The V1 scopes are
`accounts:read`, `accounts:write`, `balances:read`, `recipients:read`, `recipients:write`, `transactions:read`,
`transfers:read`, `transfers:write`, `deposits:read`, `batches:read` and
`batches:write`. Broad `read` grants every read scope; broad `write` grants
every read and write scope. Each granular write scope also grants its matching
read scope (for example, `accounts:write` includes `accounts:read`, but not
`balances:read`). Batch creation needs both `batches:write` and
`transfers:write`; listing Batch Transfers needs both `batches:read` and
`transfers:read`.

Keys authenticate API requests, not Relay browser sessions. Current key validity,
ownership, scopes and applicable business eligibility are checked on retries
too: an idempotency key is not an authorization bypass.

## Transfers, deposits and transactions

An accepted internal transfer creates one `txn_…` ID. The source Account sees
a Transfer and the receiving Account sees a Deposit. Addressing another Customer
credits its immutable default Account. Addressing another Account owned by the
same Customer creates an Account transfer with one debit and one credit view.

Accepted outbound money moves from `available` to `reserved`. At settlement it
leaves the source balance and is credited to the destination balance. A failed
or voided movement remains visible and the reservation is released.

## Amounts

Amounts are decimal strings in major currency units. New payments must be
positive USD amounts with at most two decimal places and no more than
`9999999999999999.99` per payment. Commas may group thousands, and a single
leading `$` is optional: `"$ 1,234.56"` and `"1234.56"` mean the same USD amount.
Surrounding whitespace and whitespace after `$` are ignored. Malformed comma
groups, whitespace within the number, JSON numbers, other currency symbols,
scientific notation and negative values are rejected. Monetary amounts returned in
balance and activity views follow the response schemas; a zero balance is valid.

## Idempotency

Send the request key in the **`Idempotency-Key` HTTP header**, not in JSON.
Create Account, Recipient, Transfer and Batch require it. Account PATCH,
Recipient PUT and Recipient DELETE accept it optionally; omitting it does not
provide saved-response protection. Keep the same key and input for retries of
one operation. Do not generate a new key merely because the connection timed out.

Keys apply to a Customer and operation, even if the Customer uses another API
key. For transfers, changing between `destination.customer_id` and
`destination.account_id` while reusing the same key within 24 hours returns
`409 Conflict`. For updates and removals, using the same key for a different
resource also returns `409 Conflict`.

After a request succeeds, matching retries within 24 hours return the original response:

| Operation | Saved response |
| --- | --- |
| Create Account | Initial `201` Account body and `Location`. |
| Update Account | `200` Account body from that update, even after later edits. |
| Create Recipient | Original `201` for a new Recipient, or `200` for an existing or restored one; original body and `Location` when present. |
| Replace Recipient | `200` Recipient body from that replacement, even after later edits or removal. |
| Remove Recipient | `204`, without removing a subsequently re-added Recipient. |
| Create internal Transfer | Initial `201` Transfer body and `Location`, even after settlement or failure. |
| Create Batch | Initial `202` Batch body and `Location`, with the original counts. |

Replay does not reapply an edit, restore a removed Recipient or send money again.
Use GET for current state. It is not proof of settlement.

Concurrent matching requests wait for the first transaction to finish. If it
commits, they replay its response; being in flight alone is not a conflict.
A changed, valid request under an unexpired idempotency key returns `409` with
`details.code: idempotency_conflict` and `details.param: Idempotency-Key`, without
an `existing_id`. Each operation defines how it normalizes input before comparing
it. Request validation still runs, so invalid input can return `400` instead.
Authentication, authorization and maintenance checks also apply to retries.

Replay does not extend the 24-hour window. At or after expiry, the same key can
identify new work, including another payment. Save resource IDs separately and
reconcile uncertain outcomes before resubmitting. Use a new key for each new
intent, not for a retry of an uncertain one.

## Pagination

List operations use opaque cursors. Pass `next_cursor` back as `cursor` with
the same filters and ordering. Do not parse or construct cursors. Stop when
`has_more` is false. An invalid or mismatched
cursor returns `400`; restart from the first page. Pagination is not a frozen
snapshot of resources that continue changing.

## Errors

Errors use `{ code, message, details }`. The outer `code` describes the HTTP
error class; `details.code`, when present, is Pocket's machine-readable reason.
Do not branch on message text. Details may be `null` for transport/authentication
failures. Preserve unknown reason codes, and record `details.request_id` when
provided for support.

| HTTP status | Meaning and next step |
| --- | --- |
| `400` | Invalid fields, IDs, filters or cursor; inspect `details.param` and correct the request. Recipient policy rejection can include per-item `failures`. |
| `401` | Missing, invalid, expired or revoked API credential, or wrong audience. Check the environment and key. |
| `402` | Direct Transfer rejected for insufficient available funds (`insufficient_funds`); no accepted Transfer is returned. |
| `403` | Insufficient scopes, Customer eligibility or permission. Retrying the same request does not grant access. |
| `404` | Resource missing or not visible to this Customer. Recipient resolution can use `recipient_not_found` without revealing the private cause. |
| `409` | State conflict or live-key input mismatch. Idempotency conflicts use outer `aborted`, reason `idempotency_conflict` and parameter `Idempotency-Key`; no `existing_id` is supplied. |
| `429` | Rate or rolling-send limit (`rate_limited`). Respect `Retry-After` when present; no fixed requests-per-second allowance is promised. |
| `500` | Internal failure; reconcile an uncertain mutation and retry with the same key within its replay window. |
| `503` | Temporary dependency unavailability or maintenance. Back off and use the same intent/key when retrying. |

During maintenance, `503` can instead have `details: { "maintenance": true,
"retry_after_seconds": 60 }`, without a Pocket reason or request ID. Maintenance
headers (`X-Pocket-Maintenance`, `Retry-After`) may be present; authentication
can reject the request before those headers are attached. The body remains the
maintenance indicator.

## Acceptance, settlement and uncertain outcomes

`201 Created` for a Transfer means it was accepted, not settled. `202 Accepted`
for a Batch means the Batch was saved for asynchronous execution, not that its
items succeeded. GET returns current progress; replaying POST returns the
original acceptance response. A terminal Batch can be `completed`,
`partially_completed` or `failed`; reconcile each item, not just the Batch status.

If a response is lost, retry the same request with the same key within 24 hours.
Once you have the resource ID, reconcile using GET and, for a Batch, its items
and resulting Transfers. Retain each item's `item_id` and Transaction ID, and
use terminal movement status to determine the payment outcome.

If the replay window has elapsed, or the outcome remains uncertain, do not
blindly resubmit with the old or a new key: either can create another payment.
Reconcile saved IDs and activity first, and contact Pocket when an outcome cannot
be established. A `reference` is a reconciliation label, not a uniqueness
constraint. Do not assume a failed HTTP request proves no money movement was
accepted.
