# create-reservation-manual

Creates manual/offline reservations from internal operations and supports lead conversion.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `create-reservation-manual`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated internal user (`owner`, `root`, `staff_*`) with `reservations.write` scope (or wildcard).

## Minimum API key scopes

- `databases.read`
- `databases.write`

## Payload

```json
{
  "resourceId": "RESOURCE_ID",
  "leadId": "OPTIONAL_LEAD_ID",
  "bookingType": "manual_contact",
  "scheduleType": "date_range",
  "checkInDate": "2026-06-10T15:00:00.000Z",
  "checkOutDate": "2026-06-14T11:00:00.000Z",
  "startDateTime": "2026-06-10T10:00:00.000Z",
  "endDateTime": "2026-06-10T11:00:00.000Z",
  "guestUserId": "OPTIONAL_USER_ID",
  "guestName": "Guest full name",
  "guestEmail": "guest@example.com",
  "guestPhone": "+5215512345678",
  "guestCount": 2,
  "baseAmount": 8000,
  "feesAmount": 0,
  "taxAmount": 0,
  "totalAmount": 8000,
  "currency": "MXN",
  "paymentStatus": "pending",
  "status": "pending",
  "externalRef": "manual-transfer-123",
  "specialRequests": "Pago por transferencia. Esperando validacion admin.",
  "closeLead": false
}
```

## Notes

- `status=pending` + `paymentProvider=manual` is used as draft/pending-approval workflow.
- For `manual_contact`, `scheduleType` (`date_range` or `time_slot`) can be used to register calendar-aware requests.
- If `leadId` is provided, missing guest/schedule fields are auto-resolved from lead metadata when possible.
