# send-proposal

Creates an actionable chat proposal message (`kind=proposal`) inside an existing conversation.

## Runtime contract

- Method: `POST`
- Execute permission: `users`
- Actor roles: `owner`, `root`, `staff_*`

## Payload

```json
{
  "conversationId": "CONVERSATION_ID",
  "proposalType": "visit",
  "timeStart": "2026-04-15T16:00:00.000Z",
  "timeEnd": "2026-04-15T16:30:00.000Z",
  "timezone": "America/Mexico_City",
  "meetingType": "on_site",
  "location": "Address or call link",
  "expiresAt": "2026-04-14T00:00:00.000Z"
}
```

## Response

```json
{
  "ok": true,
  "success": true,
  "messageId": "msg_xxx",
  "conversationId": "conv_xxx",
  "leadId": "lead_xxx"
}
```