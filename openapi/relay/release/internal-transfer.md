Create an internal transfer from the authenticated Customer to another Pocket
Customer using a key with `transfers:write`:

```text
POST /v1/transfers/internal
Authorization: Bearer eak_v1_...
Idempotency-Key: d9f80740-7f8e-4f16-b5cc-4fd5bf7d3b21
Content-Type: application/json
```

```json
{
  "source": {
    "account_id": "acc_01j8ma3wv3mepwabfxxs0yc395"
  },
  "destination": {
    "customer_id": "cus_01jm0defbbct46vh2ev5dkkhej"
  },
  "amount": "100.00",
  "currency": "USD",
  "reference": "payrun-2026-07",
  "memo": "July salary"
}
```

Supply exactly one source selector and one destination selector.
`source.customer_id` may instead identify the Customer attached to the API key,
in which case Pocket uses its immutable default Account. An explicit source
Account must belong to that Customer. A Customer destination must be a different
Customer; it receives into its default Account. Its private Account ID, balance
and unrelated activity are never exposed to the sender. The destination uses a
Customer ID, not a Recipient relationship ID.

To move money between your own Accounts, set `destination.account_id` to another
owned Account instead. It must differ from the resolved source Account. You
cannot select another Customer's Account directly.

`amount` is a positive USD string with at most two decimal places. Thousands
commas, a single leading `$`, surrounding whitespace and whitespace after `$`
are accepted; for example, `"$ 1,234.56"` means 1234.56 USD.
`reference` (up to 255 characters) and `memo` (up to 100) are optional strings,
not `null`. The reference is private to your Customer and is not a uniqueness
constraint. The destination Customer can see the memo.

Both destination types require the `Idempotency-Key` header. Matching retries
within 24 hours return the original response. Keep the same key and body when
retrying a payment. Changing between `destination.customer_id` and
`destination.account_id` with the same key returns `409 Conflict`, as does
changing the amount. Retries return the original `201`, `Location`, status and
timestamps. Reusing an expired key can create another transfer.

`201 Created` means the payment was accepted. While pending, the source amount
is reserved and its available balance decreases; the destination is not yet
credited. Settlement posts the source debit and destination credit. Failure or
voiding releases the reservation without a destination credit. Use
`GET /v1/transfers/{transfer_id}` with `transfers:read` to observe current state.
For an owned-Account move, the transaction feed contains both Account views.

Transfers between your own Accounts are not subject to the 30-day sending limit.
A Customer-to-Customer payment that exceeds this limit returns `429`.
Insufficient funds return `402`. Both responses reject the new payment.
If a response is lost, retry with the same key within its 24-hour window. After expiry, reconcile known
transaction IDs and references before deciding whether to send again; a reference
alone does not prevent duplicates.
