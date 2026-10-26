---
title: Payroll integration model
description: How a payroll integration uses Customers, Recipients, Accounts and Batches, and the scopes each step needs.
sidebar:
  order: 1
---

A payroll integration uses an API key for one active, unblocked business
Customer. That Customer owns the Recipient roster and the source Accounts,
and submits each Batch. Employees are destination Customers, not Accounts or
Recipient IDs. Adding a Recipient does not create a Customer.

The normal flow is:

1. Add each employee as a Recipient using an existing Customer ID or an exact
   supported identity lookup. Store both the Recipient ID and its destination
   Customer ID.
2. Select the source Account and check that Account's available USD balance.
3. Submit a Batch with either the Customer in `source.customer_id` to use its
   default Account, or a chosen Account in `source.account_id`. The resolved
   source Account is fixed when the Batch is accepted.
4. Save the returned Batch ID and reconcile its items and resulting Transfers.
   Acceptance is asynchronous; it does not reserve the Batch total or guarantee
   that every item will be paid.

Recipient reads require `recipients:read`; Recipient writes require
`recipients:write`. Submitting a Batch requires both `batches:write` and
`transfers:write`. Reading Batches and their items requires `batches:read`;
listing a Batch's Transfers also requires `transfers:read`. Scopes and Customer
eligibility are checked again on retries.

Use the public `/v1` endpoints for this integration. The Relay console's CSV
preview/execute workflow and its operator permissions are a separate API
surface; a public Batch submission queues execution directly.
