---
title: Set up an employee for payroll
description: Add an employee to a business Customer's recipient roster and keep the destination Customer ID for payments.
sidebar:
  order: 2
---

Add each employee to the authenticated business Customer's recipient roster.
The Recipient has its own `rcp_…` ID for roster management. Its linked
`customer_id` is the destination to use in a Batch; never send the Recipient ID
as a payment destination.

```text
POST /v1/customers/cus_01j8ma3wv3mepwabfxxs0yc395/recipients
Authorization: Bearer eak_v1_...
Idempotency-Key: add-employee-1042
Content-Type: application/json
```

```json
{
  "customer_id": "cus_01jm0defbbct46vh2ev5dkkhej",
  "label": "Taylor Reed",
  "reference": "EMP-1042",
  "metadata": {"department": "Operations"}
}
```

Supply a nonblank label and at least one of `customer_id`, `paytag`, `email`,
or `phone`. If several identifiers are supplied, all must resolve uniquely to
the same existing, active, unblocked Customer other than the source Customer.
Unresolved, conflicting or unavailable matches return the same
privacy-preserving `404` with `details.code: recipient_not_found`. This
operation does not create pending Recipients or onboard employees. Existing
pending records remain readable, have `customer_id: null`, and cannot be used
as Batch destinations.

A new Recipient returns `201 Created` and a relative `Location`. An existing
non-removed Recipient returns `200 OK` without applying the submitted label,
reference or metadata. A new request to re-add a removed Customer restores the
same Recipient ID with the submitted fields and returns `200 OK`.

Creation requires `Idempotency-Key`. An unchanged retry within 24 hours returns
the saved original response, status and Location where present, even after
later edits or removal. It does not restore or update the Recipient. Use GET
for current state, especially `capabilities.can_receive_transfers`: a replay's
capability value is a saved snapshot. The current capability checks roster and
Customer eligibility, not wallet readiness, source funds, limits or the final
payment outcome. Batch acceptance and execution perform further checks.

PUT replaces all four mutable fields: `label`, `reference`, `status` and
`metadata`. Supply `reference: null` to clear it and `metadata: {}` to clear
metadata; `status` may be `active` or `inactive`. DELETE soft-removes the
Recipient and returns `204 No Content`. Removed records remain readable but
are excluded from unfiltered lists.

PUT and DELETE accept an optional `Idempotency-Key`. Use one to make a retry
return the original response without reapplying an old edit or deleting a
subsequently restored Recipient. Keys are scoped by business Customer and
operation for 24 hours, not by API-key credential or Recipient ID. Changing the
target or normalized input under an unexpired idempotency key returns `409` with
`details.code: idempotency_conflict`. Use a new key for a new operation.
