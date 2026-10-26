A transfer sends money from one of your Accounts to:

1. A counterparty, which is a bank account outside Pocket.
2. Another Pocket customer.
3. Another of your Accounts.

The money always leaves your Account in USD. The
[Transfers guide](https://docs.pocketmoney.global/relay/transfers/) explains
each part in more detail.

## Types

Each type has its own create endpoint, `POST /v1/transfers/{type}`.

- **`internal`** sends USD to another Pocket customer, by `customer_id`, or to
  another of your Accounts, by `account_id`. Its `method` is `internal`.
- **`pk_bank_account`** sends to a counterparty's bank or wallet account in
  Pakistan, paid out in PKR. Its `method` is `ibft`.
- **`us_bank_account`** sends USD to a counterparty's checking or savings
  account at a US bank. Its `method` is `ach`.

## Sending to a counterparty

Every transfer to a counterparty is created from a quote:

1. **Get the price inputs.** `GET /v1/transfers/{type}/rate` returns your rate,
   and `GET /v1/transfers/{type}/options` returns your delivery options with
   their fee schedules. Both change rarely, so fetch them once.
2. **Quote it.** `POST /v1/transfers/{type}/quotes` returns the exact fee and
   payout, fixed for five minutes.
3. **Send it.** `POST /v1/transfers/{type}` with the quote's `id` and the
   `counterparty_id`. A transfer to Pakistan also needs a `purpose_code`.

Rates, options, purpose codes and quotes require `transfers:read`.

`payin_amount` is the USD that leaves your Account, fee included:

- `fee = base_amount + min(percentage% × payin_amount, cap_amount)`, rounded
  half away from zero to two decimal places.
- `payout = (payin_amount − fee) × rate`, rounded half to even to two decimal
  places. A USD payout's rate is `1`.

## Following a transfer

Creating a transfer requires `transfers:write` and an `Idempotency-Key` header.
It returns `201 Created` with a `Location`. `201` means Pocket accepted the
transfer, not that it settled.

A transfer is a transaction. Read one with
`GET /v1/transactions/{transaction_id}`, and list them with
`GET /v1/transactions?kind=transfer`. Both require `transactions:read`. A
transfer's `status` is `pending`, `settled`, `failed` or `voided`.
