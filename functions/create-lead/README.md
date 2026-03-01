# create-lead

Create or upsert an authenticated lead (`resourceId + userId`) for platform resources, reuse/reopen the conversation, and write the first chat message.

## Runtime contract

- Type: authenticated HTTP function.
- Method: `POST`.
- Execute permission: `users`.
- Actor role: authenticated `client` only.

## API key scopes

- `databases.read`
- `databases.write`
- `users.read`

## Payload

```json
{
  "resourceId": "RESOURCE_ID",
  "message": "Hola, me interesa este recurso.",
  "contactChannel": "resource_chat",
  "intent": "visit_request",
  "meta": {
    "booking": {
      "guests": 2,
      "startDate": "2026-04-15T00:00:00.000Z",
      "endDate": "2026-04-18T00:00:00.000Z"
    },
    "visit": {
      "meetingType": "on_site",
      "preferredSlots": [
        {
          "startDateTime": "2026-04-15T16:00:00.000Z",
          "endDateTime": "2026-04-15T16:30:00.000Z",
          "timezone": "America/Mexico_City"
        }
      ]
    },
    "contactPrefs": {
      "preferredLanguage": "es",
      "phone": "+52 5512345678"
    }
  }
}
```

Notes:

- `contactChannel`: `resource_chat | resource_cta_form` (defaults to `resource_chat`).
- `intent`: `booking_request | booking_request_manual | visit_request | info_request`.
- `metaJson` max length enforced: `8000`.
- Canonical `metaJson` always stores: `resourceSnapshot`, `booking`, `visit`, `contactPrefs`.

## Response

```json
{
  "ok": true,
  "success": true,
  "leadId": "lead_xxx",
  "conversationId": "conv_xxx",
  "intent": "visit_request",
  "contactChannel": "resource_chat"
}
```