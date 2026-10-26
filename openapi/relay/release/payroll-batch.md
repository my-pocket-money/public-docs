Submit one asynchronous Batch from the authenticated business Customer to its
employee Customers:

```text
POST /v1/batches
Authorization: Bearer eak_v1_...
Idempotency-Key: a15e4ae4-52f3-460c-9c1c-5f6b7b90cc44
Content-Type: application/json
```

```json
{
  "source": {
    "account_id": "acc_01j8ma3wv3mepwabfxxs0yc395"
  },
  "recipient_policy": "recipients_only",
  "items": [
    {
      "item_id": "line-001",
      "destination": {
        "customer_id": "cus_01jm0defbbct46vh2ev5dkkhej"
      },
      "amount": "100.00",
      "currency": "USD",
      "reference": "EMP-1042"
    }
  ],
  "reference": "northwind-payroll-2026-07"
}
```

Use a new key for each pay run and keep the same key and input for retries of
that submission. Send 1–4,096 items, each with a unique, case-sensitive,
nonblank `item_id` of at most 255 characters. Amounts are positive USD decimal
strings with at most two decimal places. Thousands commas, a single leading `$`,
surrounding whitespace and whitespace after `$` are accepted; for example,
`"$ 1,234.56"` means 1234.56 USD. Every destination must be another
Customer; Batch items do not accept Account destinations.

`recipients_only` checks the entire request before acceptance: each destination
must be an active eligible roster member. Pocket also checks that the destination
can receive the payment.
`can_receive_transfers: true` does not guarantee that the recipient can receive this payment.
A failed pre-check returns `400`, `details.code: recipient_policy_failed`, and
`details.failures` entries containing `item_id`, an indexed `param`, and a
privacy-preserving failure `code`. No Batch is created. Omitting the policy
selects `any_customer`, which skips the roster pre-check and checks destination
eligibility and payability when each item first executes.

Success returns `202 Accepted`, a Batch body, and
`Location: /v1/batches/{batch_id}`. Acceptance does not reserve the whole Batch
amount. Each item checks the pinned source Account's available balance and
applicable transfer rules when it runs; processing order is not guaranteed.
The roster policy is not checked again after acceptance. There is no public
cancel endpoint for an accepted Batch.

An unchanged retry within 24 hours returns the saved initial `202` response
and Location, without resubmitting items or refreshing counts. GET the Batch
for progress. A changed request under the same unexpired idempotency key returns `409` with
`details.code: idempotency_conflict`; it does not include an existing Batch ID.
Retries do not extend the 24-hour window. After expiry the key can create another Batch.

Use `GET /v1/batches/{batch_id}/items` to reconcile every submitted `item_id`.
A `pending` item, or an `internal_error` item with `transfer_id: null`, is not
proof that no payment started.
The Transfer list contains only linked, visible Transfers, so an empty list is
not proof that the Batch did nothing. If a submission result is lost, retry
within the replay window using the same input and key. For an older uncertain
result, locate the Batch by its saved ID or list/filter by your reference and
creation time, then reconcile its items and source activity before submitting
anything again. References are not unique and `item_id` only identifies a line
within one Batch. Escalate an unresolved payment outcome for reconciliation;
do not automatically copy ambiguous lines into a new Batch.
