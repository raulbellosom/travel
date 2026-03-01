# respond-proposal

Creates an actionable proposal response message (`kind=proposal_response`) from a client.

## Runtime contract

- Method: `POST`
- Execute permission: `users`
- Actor role: `client`

## Payload

```json
{
  "conversationId": "CONVERSATION_ID",
  "proposalMessageId": "PROPOSAL_MESSAGE_ID",
  "response": "accept",
  "comment": "Confirmado",
  "suggestedSlots": [
    {
      "startDateTime": "2026-04-16T16:00:00.000Z",
      "endDateTime": "2026-04-16T16:30:00.000Z",
      "timezone": "America/Mexico_City"
    }
  ]
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