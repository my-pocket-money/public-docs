Each Account holds USD and has its own Account ID. Accounts belong to the Customer
attached to your API key. A Customer can have more than one Account in the same
currency. Use `GET /v1/accounts` (`accounts:read`) to discover them and
`GET /v1/accounts/{account_id}` to read an Account's label, reference and metadata.

An eligible business Customer can create an additional, non-default Account with
`POST /v1/accounts` (`accounts:write`). Pocket creates the default Account; this
API cannot change ownership, currency or default selection.
Account creation requires a default Account and its payment setup.
Supplied labels must be unique within the Customer. References are not unique.

`PATCH /v1/accounts/{account_id}` updates supplied `label`, `reference` or
`metadata` fields. Omitted fields remain unchanged, `null` clears a label or
reference, and `{}` replaces metadata with an empty object. At least one field is
required. Creation requires `Idempotency-Key`; updates support it optionally.
Within 24 hours, matching keyed retries return the original Account
response without reapplying the operation. Read the Account to see later changes.

`GET /v1/balances` requires `balances:read` and returns one page of Account
balances, not one aggregated balance per currency:

```json
{
  "data": [
    {
      "account_id": "acc_01j8ma3wv3mepwabfxxs0yc395",
      "currency": "USD",
      "reference": null,
      "available": "2500.00",
      "settled": "2500.00",
      "reserved": "0.00",
      "as_of": "2026-07-31T09:15:00Z"
    }
  ],
  "has_more": false,
  "next_cursor": null
}
```

Accounts with no ledger activity are included with zero amounts. `settled` is the
posted balance; `reserved` is the amount held for pending outbound movements;
`available = settled - reserved`. Pending incoming money is not spendable and
does not increase these balances before settlement. Amounts are decimal strings;
do not depend on a fixed number of trailing zeroes.

Account and balance lists accept `currency=USD`, an exact `reference`,
`limit` (1–100, default 25) and an opaque `cursor`. They are ordered newest
Account first, by creation time and Account ID. Keep the same filters and follow
`next_cursor` while `has_more` is true. For one current balance, use
`GET /v1/accounts/{account_id}/balance` with `balances:read`.

Use `/v1/transactions` for the combined activity feed, `/v1/transfers` for
outbound movements and `/v1/deposits` for inbound movements. Every returned
`account_id` identifies the exact Account-relative view. A transfer between two
of your Accounts appears twice in the combined feed: one outbound view and one
inbound view sharing the same transaction ID. Another Customer's private
balances and activity are not accessible with your key.
