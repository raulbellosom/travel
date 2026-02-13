# reservation-created-notification

Function triggered after a reservation document is created.

## Execution Contract

- Type: Event Trigger Function.
- Appwrite trigger: `databases.*.collections.reservations.documents.*.create`.
- Method: no aplica (evento de Appwrite).
- `execute` permission: `[]`.
- Actor scope/role: no aplica.

## Minimum API key scopes

- `databases.read`
- `databases.write`

## Behavior

- Reads reservation document.
- Emits structured notification log.
- Writes optional audit entry in `activity_logs`.
