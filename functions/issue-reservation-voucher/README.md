# issue-reservation-voucher

Issues reservation voucher when a reservation is eligible.

## Execution Contract

- Type: HTTP Function interna.
- Appwrite trigger: invocacion interna por `Functions.createExecution` desde webhooks de pago.
- Method: `POST`.
- `execute` permission: `[]`.
- Actor scope/role: no depende de usuario autenticado.

## Minimum API key scopes

- `databases.read`
- `databases.write`

## Payload

```json
{
  "reservationId": "RESERVATION_ID"
}
```

## Rules

- Reservation must be enabled.
- Reservation status must be `confirmed` or `completed`.
- Payment status must be `paid`.
- Prevents duplicates by returning an existing voucher.
