---
title: Changelog
description: Changes to the Relay API contract, by release.
sidebar:
  order: 3
---

## 0.7.0 — Sandbox release candidate

Adds Counterparties and transfers to them: 16 new operations. Transfers are
now read as transactions, so `GET /v1/transfers/{transfer_id}` and
`GET /v1/transfers` are removed, for 37 operations in all.

### Breaking changes

- `GET /v1/transfers/{transfer_id}` is removed. A transfer is a transaction:
  read it with `GET /v1/transactions/{transaction_id}`, which needs
  `transactions:read`.
- `GET /v1/transfers` is removed. List transfers with
  `GET /v1/transactions?kind=transfer`, which needs `transactions:read`. Its
  `account_id` filter replaces `source_account_id`; there is no destination
  filter.
- A created transfer's `Location` is
  `/v1/transactions/{transaction_id}?account_id={source_account_id}`, the
  transaction viewed from its source Account, instead of
  `/v1/transfers/{transfer_id}`.

### Counterparties

A Counterparty (`tcp_…`) is a bank account outside Pocket that the Customer can
send transfers to: a `pk_bank_account` in Pakistan, paid in PKR, or a
`us_bank_account`, paid in USD. New scopes `counterparties:read` and
`counterparties:write` guard them.

| Operation | Method and path |
| --- | --- |
| List Counterparties | `GET /v1/counterparties` |
| Create a Pakistani bank account Counterparty | `POST /v1/transfers/pk_bank_account/counterparties` |
| Create a US bank account Counterparty | `POST /v1/transfers/us_bank_account/counterparties` |
| Update a Pakistani bank account Counterparty | `PATCH /v1/transfers/pk_bank_account/counterparties/{counterparty_id}` |
| Update a US bank account Counterparty | `PATCH /v1/transfers/us_bank_account/counterparties/{counterparty_id}` |
| Retrieve a Counterparty | `GET /v1/counterparties/{counterparty_id}` |
| Delete a Counterparty | `DELETE /v1/counterparties/{counterparty_id}` |

### Transfers to Counterparties

| Operation | Method and path |
| --- | --- |
| Retrieve PKR rate | `GET /v1/transfers/pk_bank_account/rate` |
| List available delivery options to a PK bank account | `GET /v1/transfers/pk_bank_account/options` |
| List available purpose codes that can be used when transferring funds to a PK bank account | `GET /v1/transfers/pk_bank_account/purpose_codes` |
| Request a quote for transferring PKR to a PK bank account | `POST /v1/transfers/pk_bank_account/quotes` |
| Send USD to a Pakistani bank account | `POST /v1/transfers/pk_bank_account` |
| Retrieve USD rate | `GET /v1/transfers/us_bank_account/rate` |
| List available delivery options to a US bank account | `GET /v1/transfers/us_bank_account/options` |
| Request a quote for transferring USD to a US bank account | `POST /v1/transfers/us_bank_account/quotes` |
| Send USD to a US bank account | `POST /v1/transfers/us_bank_account` |

Prices are per Customer. `GET /v1/transfers/{type}/rate` and
`GET /v1/transfers/{type}/options` give the Customer's rate and each option's
fee schedule, so a price can be shown before an amount is entered. Every
transfer is created from a quote, which fixes its fee, rate and payout for five
minutes.

These Transfers have `method` `ibft` or `ach`, and `destination.counterparty_id`.
`TransferDestination` and `TransactionSideReference` gain `counterparty_id`.

### Adopting 0.7.0

Regenerate clients from this contract. Accept `counterparty_id` as a Transfer
destination, and the new error codes `fx_rate_expired`, `quote_expired`,
`counterparty_not_approved` and `conflict`. List transfers with
`GET /v1/transactions?kind=transfer` and read one with
`GET /v1/transactions/{transaction_id}`, or follow the `Location` a create
returns, and grant `transactions:read` to keys that do.

## 0.6.1 — Sandbox release candidate

### Breaking changes

- Account `status` is removed. Accounts no longer return `status`, and
  `GET /v1/accounts` and `GET /v1/balances` no longer accept a `status` filter.
  Every Account could only ever be `active`; `is_default` still marks the
  Account that Customer-addressed transfers use.

### Payment amount formatting

Payment inputs accept thousands commas, a single leading `$`, surrounding
whitespace and whitespace after `$`. For example, `"$ 1,234.56"` and `"1234.56"`
mean the same USD amount and have the same Batch idempotency fingerprint.
Malformed comma groups remain invalid.

### Adopting 0.6.1

Regenerate clients from this contract. Stop reading Account `status` and stop
sending the `status` filter on Account and balance lists.

## 0.6.0 — Sandbox release candidate

Same `/v1` paths and 23 public operations. No new resource families.

### Idempotency

Request keys move from the body to the `Idempotency-Key` header. Recipient
removal gains optional saved-response protection.

| Operation | Header | Matching retry within 24 hours replays |
| --- | --- | --- |
| Create internal Transfer | Required | Saved `201` body and `Location`. |
| Create Batch | Required | Saved `202` body and `Location`, not execution progress. |
| Create Recipient | Required | Saved original response: `201` for new, `200` for existing or restored. |
| Create Account | Required | Saved `201` body and `Location`. |
| Update Account (PATCH) | Optional | Saved `200` body. |
| Replace Recipient (PUT) | Optional | Saved `200` body. |
| Remove Recipient (DELETE) | Optional | Saved `204`, without removing a re-added Recipient. |

Keys are scoped to the Customer and operation. Replays return the original response,
not current state; use GET for that. Changed input under an unexpired idempotency key returns `409`
with outer `aborted`, `details.code: idempotency_conflict` and
`details.param: Idempotency-Key`, without `existing_id`. Replay does not extend
the 24-hour window. After expiry, reusing the key can create another resource
or payment.

Changing between `destination.customer_id` and `destination.account_id` while
reusing the same idempotency key within 24 hours returns `409 Conflict`.
Authentication, authorization and request validation still apply to retries.

### Behavior changes

- Payments that exceed the Customer's 30-day sending limit are rejected.
  Direct transfer requests return `429 rate_limited` without creating a Transfer.
  Batch items report `limit_exceeded`.
- Filtering transactions by an Account that does not exist or belongs to another
  Customer returns `404` instead of `500`. The `account_id` filter is optional.
- Pocket retries each batch payment using the same idempotency key. If its outcome
  remains unknown after 24 hours, Pocket stops automatic retries to avoid duplicate payments.

### Documentation

- Added Sandbox URLs and release-candidate labelling.
- Error schemas now include maintenance `503` responses, which use
  `details.maintenance` and `details.retry_after_seconds` instead of a Pocket
  reason and request ID.

### Adopting 0.6.0

Regenerate clients from this contract. Send request keys in the `Idempotency-Key` header,
remove the body attribute, and keep the same key for retries of one operation.
Retries return the original response. Use GET for current state and check the
payment outcome before resubmitting after 24 hours.

## 0.5.0

- Restored Accounts as the stable funds identity while retaining the focused
  Recipient, Transfer, Deposit and Batch surface introduced in 0.4.0.
- Added Account create, list, retrieve, balance and presentation-update operations,
  plus `accounts:read` and `accounts:write` scopes.
- Changed balances and activity to return Account-relative views. A same-Customer
  Account transfer appears once for its source Account and once for its destination
  Account, sharing one Transaction ID.
- Transfer and Batch sources accept either the authenticated Customer in
  `source.customer_id`, which selects its default Account, or an owned Account in
  `source.account_id`. A Customer destination still uses `destination.customer_id` and
  receives into its immutable default Account.
- Added same-Customer Account-to-Account transfers through the existing internal
  Transfer operation. Existing Customer-to-Customer money movement remains P2P.

## 0.4.0

### Customer-scoped V1

- Replaced the Account-scoped API with a smaller Customer-scoped API for
  balances, Recipients, Transactions, Transfers, Deposits and Batches.
- Scoped balances and activity to the Customer represented by the API key.
  0.4.0 returns that Customer's single USD balance.
- Changed Transfer and Batch sources to use the authenticated Customer's ID and
  kept destination Customer IDs separate.
- Limited Transfer creation to internal Customer-to-Customer transfers.
- Added ascending and descending creation-time ordering to Recipient,
  Transaction, Transfer, Deposit and Batch lists.

### Recipients

- Added stable Recipient IDs (`rcp_…`). Retrieve, replace and remove operations
  now address the Recipient rather than its linked Customer.
- Changed Recipient replacement from `PATCH` to `PUT`. The request supplies the
  complete mutable state: `label`, `reference`, `status` and `metadata`.
- Added exact paytag matching during Recipient creation, alongside exact
  Customer ID, email and phone matching. Removed government-ID lookup and the
  separate Recipient search operation.
- Removed creation of unmatched Customers and pending Recipients. An incomplete
  or conflicting match returns `404 recipient_not_found` and creates nothing.
- Recipient responses contain the stable Recipient ID, linked Customer ID when
  available, business-owned label, reference and metadata, association and
  relationship status, transfer capability, and timestamps. Contact details
  and Customer onboarding state are not returned.

### Requests and retries

- Recipient creation and Batch creation are idempotent for 24 hours. Recipient
  replacement has the same guarantee when an `idempotency_key` is supplied.
  Other operations may accept an idempotency key, but V1 does not guarantee
  replay or duplicate suppression for them.
- Bound Recipient list cursors to the owning Customer and normalized filters.
  0.4.0 does not define a cursor lifetime. An invalid or mismatched cursor
  returns `400`, and the caller can restart from the first page.
- Changed all errors to the `{ code, message, details }` envelope. Recipient
  operations document more specific error detail schemas and HTTP responses.
  `Retry-After` is optional on rate-limit responses.
- Removed unsupported request-body size promises and the corresponding `413`
  responses.
- Rejected the NUL character in Recipient idempotency keys, labels, references,
  metadata and text filters.

### Changes since 0.2.0

| 0.2.0 | 0.4.0 |
| --- | --- |
| Account-scoped balances and activity using `account_id` | Customer-scoped balance and activity using `customer_id`. Accounts are not included. |
| Internal, ACH, wire, onchain and IBFT Transfer creation | Internal Customer-to-Customer Transfer creation only. |
| Recipients addressed through their linked Customer ID and updated with `PATCH` | Stable `rcp_…` Recipient IDs and complete replacement with `PUT`. Responses no longer include contact or onboarding fields. |
| Instruments, funding rules, FX quotes, events and webhooks | These operations are not included. |
| Flat `{ code, message, param, request_id }` errors | `{ code, message, details }` errors. |
| At least 24 hours of idempotent replay for every operation that accepted a key | 24 hours of replay for Recipient creation, Recipient replacement when a key is supplied, and Batch creation. Other operations do not guarantee replay or duplicate suppression. |

These are historical 0.4.0 contract notes, not the supported surface or retry
rules for 0.6.0. Use the current operation definitions when integrating.

## 0.2.0

- Renamed the specification from **Pocket Money API** to **Pocket Money - Relay
  API** and moved its base URL from `api.pocketmoney.host` to
  `api.relay.pocketmoney.global`.
- Replaced API-created business subcustomers (`cus_…`) with Customer-owned
  **Accounts** (`acc_…`) as directly addressable funds containers. Removed the
  public Customer hierarchy and subcustomer management operations.
- Changed balances, transactions, deposits, Transfer sources, Batch sources and
  funding rules to address Accounts. Added same-Customer Account-to-Account
  transfers and default receiving Account selection when an internal Transfer
  addresses a Customer.
- Replaced business-member resources with Customer-to-Customer **Recipients**.
  Added Recipient endpoints, scopes and the `recipients_only` Batch policy.
- Added Customer-owned external **instruments** (`epi_…`) for bank accounts and
  wallet addresses, including Customer-held and third-party bank holders.
- Added outbound ACH and wire Transfers. The 0.1.0 specification supported only
  internal Transfer creation.
- Added onchain Transfers to reusable wallet-address instruments and exposed
  incoming onchain Deposits.
- Added FX quotes and USD-to-PKR IBFT Transfers, including supported-bank and
  purpose-code lists, Transfer-level purpose codes and third-party PKR
  destinations.

### Migrating from 0.1.0

Regenerate typed clients from the 0.2.0 specification before switching
endpoints. API keys remain associated with one Customer. Update integrations
that used the 0.1.0 subcustomer model as follows:

| 0.1.0 integration | Required 0.2.0 change |
| --- | --- |
| Create, list, retrieve or update subcustomers through `/v1/customers` | Use `/v1/accounts` and `/v1/accounts/{account_id}`. Store the returned `acc_…` ID. Do not derive it from or substitute a previous `cus_…` ID. |
| Address balances and money activity by `customer_id` | Use `account_id`. This includes `source.account_id`, Account-relative balance, Transaction and Deposit fields, and the `account_id` or `source_account_id` list filters. A Customer destination for an internal Transfer still uses `destination.customer_id`. |
| Read `/v1/customers/{customer_id}/balances` or filter balances by `parent_customer_id` | For one Account, use `/v1/accounts/{account_id}/balance`. For a list, use `/v1/accounts` and `/v1/balances`. |
| Manage funding rules below `/v1/customers/{customer_id}/funding_rules` with `destination_customer_id` | Use `/v1/accounts/{account_id}/funding_rules`. Supply `destination_account_id`. Responses use `source_account_id` and `destination_account_id`. |
| Use member endpoints, `members:*` scopes or `recipient_policy=payable_members` | Use Recipient endpoints, `recipients:*` scopes and `recipient_policy=recipients_only`. |
| Submit Batches with `source.customer_id` | Keep the authenticated Customer to use its default Account, or submit a specific owned Account as `source.account_id`. Batch-item Customer destinations remain `destination.customer_id`. |
| Persist 0.1.0 list cursors or handle `member` event resource references | Restart pagination without the saved cursor. Handle `recipient` and new Account-related resource references, and continue accepting unknown event types and resource identifiers. |
| Grant `customers:read` or `customers:write` | Grant `accounts:read` or `accounts:write`. Grant the new `instruments:*` scopes only when using instrument operations. |

Do not mechanically replace every `customer_id`. Customer destinations,
instrument ownership paths and the top-level `Event.customer_id` continue to
use `cus_…` identifiers.

## 0.1.0

- Introduced the initial API specification for Customer balances and activity,
  internal Transfers, Deposits, Batch transfers, funding rules, members, events
  and webhook endpoints.
- Used API-created business subcustomers (`cus_…`) as separate money holders
  and Transfer or Batch sources.
