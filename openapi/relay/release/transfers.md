Money leaving one of the authenticated Customer's Accounts. V1 creates
internal transfers to another owned Account or another Pocket Customer.
Transfer reads also expose supported outbound activity already processed by
Pocket; this does not enable ACH, wire, onchain or IBFT creation through Relay.
Card spends appear only in the transaction feed.

Reads require `transfers:read`; internal transfer creation requires
`transfers:write`. Creation is not restricted to business Customers by this
operation, but the source credential, Customer and Accounts must be eligible.
Customer-to-Customer transfers may have a 30-day sending limit. Transfers between
your own Accounts are not subject to this limit.

`GET /v1/transfers` accepts repeated `method` values, `source_account_id`,
`destination_id`, `status`, amount and timestamp bounds, exact `reference`,
`order`, `limit` and `cursor`. A destination filter can identify an owned Account,
a counterparty Customer, or an external instrument visible on a transfer.
Unowned Account filters return `404`; an unmatched Customer or instrument filter
returns an empty page. Historical transfers without an instrument ID cannot
match that instrument filter. Page size defaults to 25 (maximum 100), newest
first. Retain filters and order when following the returned cursor.

`GET /v1/transfers/{transfer_id}` returns the current outbound view, including
its exact source Account, status and transition timestamps. For an internal
movement, the same transaction ID identifies the destination's Deposit view.
For an owned-Account transfer, both views are accessible to the same Customer.
Otherwise, the destination Customer's private activity remains hidden.

Creation requires `Idempotency-Key` and returns `201` with a relative `Location`.
For 24 hours, an unchanged retry replays the saved initial response; it does not
refresh status or send money again. A changed request using an unexpired idempotency key returns
`409`. Reads return current state. A created, pending transfer is accepted, not
settled. Preserve its ID and poll the read endpoint to reconcile the outcome.

The Transfer response does not expose method-specific details or FX
data.
