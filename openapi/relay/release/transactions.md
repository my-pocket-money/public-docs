Account-relative money movement visible to the authenticated Customer. Both
transaction endpoints require `transactions:read`. Each `(id, account_id)` pair
identifies one view: outbound (`kind: transfer`) or inbound (`kind: deposit`).
A transfer between two owned Accounts produces two views with the same `txn_…`
ID. A transfer to another Customer exposes only your own Account's view and the
counterparty Customer ID, not their Account ID or balance.

`GET /v1/transactions` supports `account_id`, `kind`, repeated `method` values,
`status`, `amount_min`, `amount_max`, exact `reference`, creation and settlement
time ranges, `order`, `limit` and `cursor`. Amount and time bounds are inclusive;
settlement-time filters exclude entries without a settlement timestamp. Lists
default to 25 items, newest first; the maximum page size is 100. Use `order=asc`
for oldest first. Keep the same filters and order when following `next_cursor`.
An Account filter must refer to an owned Account.

The `account_id` filter is optional. If supplied, it must identify an existing
Account you own; otherwise the API returns `404`. A malformed Account ID returns
`400`. An owned Account with no matching activity returns an empty page.

`GET /v1/transactions/{transaction_id}` returns current state. If the transaction
touches two of your Accounts, supply `?account_id=acc_…` to select one view;
omitting it returns `400`. An inaccessible transaction, or a transaction that
does not touch the selected Account, returns `404`.

Accepted internal movements appear as `pending` before settlement. Their source
and destination views share the terminal status: `settled`, `failed` or `voided`.
Use the corresponding Transfer or Deposit endpoint for its resource view. Card
activity is feed-only and has no Transfer or Deposit resource. Verification
microdeposits and zero-net Account activity are excluded.
