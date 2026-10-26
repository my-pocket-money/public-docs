Money leaving one of the authenticated Customer's Accounts. V1 creates
internal transfers to another owned Account or another Pocket Customer, and
transfers to a Counterparty: a bank account outside Pocket.
Transfer reads also expose supported outbound activity already processed by
Pocket. Card spends appear only in the transaction feed.

Reads require `transfers:read`; creating a transfer requires
`transfers:write`. Creation is not restricted to business Customers by these
operations, but the source credential, Customer and Accounts must be eligible.
Customer-to-Customer transfers may have a 30-day sending limit. Transfers between
your own Accounts are not subject to this limit.

## Sending to a Counterparty

Every transfer to a Counterparty is created from a quote. Each Counterparty type
has its routes under `/v1/transfers/{type}`, where `{type}` is `pk_bank_account`
or `us_bank_account`:

1. **Show the price.** `GET /v1/transfers/{type}/rate` returns the Customer's
   rate, and `GET /v1/transfers/{type}/options` returns the delivery options they
   can use, each with its fee schedule. Both change rarely, so fetch them once and
   compute the price as the Customer types. Computing it is optional.
2. **Quote it.** `POST /v1/transfers/{type}/quotes` with the chosen option, the
   payin and the rate's `id` returns Pocket's exact fee and payout. A rate that's
   no longer the Customer's returns `fx_rate_expired`; fetch it again and
   recompute.
3. **Send it.** `POST /v1/transfers/{type}` with the quote's `id`, the
   Counterparty and, for Pakistan, a purpose code from
   `GET /v1/transfers/pk_bank_account/purpose_codes`. A quote can be used once,
   within five minutes; an expired one returns `quote_expired`. The Counterparty
   must be `approved`, or the request returns `counterparty_not_approved`.

`payin_amount` is the USD leaving the Account, fee included. The fee is in USD and
comes out of it:

- `fee = base_amount + min(percentage% × payin, cap_amount)`, rounded half away from
  zero to two decimal places.
- `payout = (payin - fee) × rate`, rounded half to even to two decimal places. A USD
  payout's rate is `1`.

The resulting Transfer has `method` `ibft` (Pakistan) or `ach` (US) and a
`destination` of `{counterparty_id}`.

## Reading transfers

A transfer is a transaction, so transfers are read through the transaction
endpoints with `transactions:read`. List them with
`GET /v1/transactions?kind=transfer`, which accepts `account_id`, repeated
`method` values, `status`, amount and timestamp bounds, exact `reference`,
`order`, `limit` and `cursor`. Read one's current state with
`GET /v1/transactions/{transaction_id}`. The `Location`
a create returns names the source `account_id`, so it resolves to the outbound
view even when both Accounts are the Customer's. For an internal movement, the
same transaction ID identifies the destination's Deposit view.
For an owned-Account transfer, both views are accessible to the same Customer.
Otherwise, the destination Customer's private activity remains hidden.

Creation requires `Idempotency-Key` and returns `201` with a relative `Location`.
For 24 hours, an unchanged retry replays the saved initial response; it does not
refresh status or send money again. A changed request using an unexpired idempotency key returns
`409`. Reads return current state. A created, pending transfer is accepted, not
settled. Preserve its ID and poll the read endpoint to reconcile the outcome.

The Transfer response does not expose method-specific details or FX
data. The quote carries the fee, payout and rate.
