# reservation-created-notification

Trigger function executed when a reservation is created.

## Type

- Event trigger (`reservations.create`)

## Behavior

- Reads reservation document.
- Emits structured log for notification dispatch.
- Writes optional activity audit entry.
- Placeholder for SMTP provider integration.
