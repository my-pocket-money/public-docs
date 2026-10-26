An asynchronous group of internal transfers from one authenticated business
Customer to destination Customers. Every item has its own status and may fail
without changing the result of another item.

The public API supports USD Batch submission, retrieval, Batch listing, item
listing and listing the Transfers created by a Batch. POST accepts and queues
the work in one operation; it is not the Relay console's CSV preview/execute
workflow. It does not reserve funds, guarantee settlement, guarantee execution
order, or offer cancellation.

Use Batch counts and item states to track progress. `pending` means every item
is still pending, not necessarily that processing has not started. `processing`
means some items have finished and others remain pending. Terminal states are
`completed` (all settled), `partially_completed` (some settled), or `failed`
(none settled). An individual item is `pending`, `settled`, `failed` or
`voided`.

Lists return `data`, `has_more` and `next_cursor`; the final cursor is `null`.
The default limit is 25 and the maximum is 100. Batch lists default to newest
first and accept `order=asc`; item lists always use `(created_at ASC, item_id
ASC)`, and Transfer lists use `(created_at ASC, id ASC)`. Repeat the same filters
when using a cursor; the page size may change. Results are current views, not a
frozen multi-page snapshot. When reconciling items whose status may have changed,
start again from the first page using the same filters.

Send an `Idempotency-Key` header. Matching retries within 24 hours return the
original response. Reads return current state.

Pocket retries each batch payment using the same idempotency key. If its outcome
remains unknown after 24 hours, Pocket stops automatic retries to avoid duplicate payments.

Keep the Batch ID and your submitted item IDs. An `item_id` only identifies a
payment within its Batch. Check uncertain payment outcomes before submitting a
replacement Batch; reusing an `item_id` in a new Batch can pay the recipient again.
