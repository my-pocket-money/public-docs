Money arriving in an Account owned by the authenticated Customer. Both Deposit
endpoints require `deposits:read`. Deposits are read-only: Pocket creates them
from incoming payments and the destination side of an internal transfer. Card
refunds are transaction-feed entries, not Deposit resources.

`GET /v1/deposits` accepts repeated `method` values, `account_id`, `status`,
amount and timestamp bounds, exact `reference`, `order`, `limit` and `cursor`.
Page size defaults to 25 (maximum 100), newest first. Amount and time bounds are
inclusive; settlement-time filters exclude entries without a settlement time.
An Account filter must identify an owned Account. Keep the same filters and
order when following `next_cursor`.

`GET /v1/deposits/{deposit_id}` returns the current inbound view. The top-level
`account_id` and `destination.account_id` identify the same Account. `source` can
be `null` when the external sender has no visible Pocket resource. For an
internal payment from another Customer, their Customer ID and memo can be
visible, but their private reference is not. Moving money between your own
Accounts preserves your reference in both views.

An accepted internal transfer creates a pending Deposit with the same `txn_…`
ID as the source Transfer. It does not increase destination funds before
settlement. Failure or voiding leaves the Deposit visible with the terminal
status and no destination credit. Fetching a Deposit outside your Customer's
visible inbound activity returns `404`.

The response reports the Account's USD movement amount and common movement
fields. It does not expose method-specific details, original foreign amounts or
fee breakdowns.
