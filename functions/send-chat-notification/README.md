# send-chat-notification

Sends email notification to the property owner when a **new conversation** is started by a client.
Only triggers on the **first message** of a conversation - subsequent messages do not send emails.
Also sends a CC copy to the platform owner (root).

## Execution Contract

- Type: HTTP Function (called from frontend).
- Method: POST.
- `execute` permission: `any` (authenticated users call it).
- Actor scope/role: authenticated user.

## Minimum API key scopes

- `databases.read`

## Input Payload

```json
{
  "conversationId": "string (required)",
  "messageId": "string (required)",
  "senderName": "string (required)",
  "body": "string (required)"
}
```

## Output

```json
{
  "ok": true
}
```

## Environment Variables

| Variable                               | Required | Description                                      |
| -------------------------------------- | -------- | ------------------------------------------------ |
| `APPWRITE_FUNCTION_ENDPOINT`           | yes      | Appwrite endpoint                                |
| `APPWRITE_FUNCTION_PROJECT_ID`         | yes      | Appwrite project ID                              |
| `APPWRITE_FUNCTION_API_KEY`            | yes      | Appwrite API key                                 |
| `APPWRITE_DATABASE_ID`                 | yes      | Database ID                                      |
| `APPWRITE_COLLECTION_CONVERSATIONS_ID` | yes      | Conversations collection ID                      |
| `APPWRITE_COLLECTION_MESSAGES_ID`      | yes      | Messages collection ID                           |
| `APPWRITE_COLLECTION_USERS_ID`         | yes      | Users collection ID                              |
| `EMAIL_SMTP_HOST`                      | yes      | SMTP host                                        |
| `EMAIL_SMTP_PORT`                      | no       | SMTP port (default: 587)                         |
| `EMAIL_SMTP_SECURE`                    | no       | Use TLS (default: auto)                          |
| `EMAIL_SMTP_USER`                      | yes      | SMTP username                                    |
| `EMAIL_SMTP_PASS`                      | yes      | SMTP password                                    |
| `EMAIL_FROM_ADDRESS`                   | yes      | Sender email address                             |
| `EMAIL_FROM_NAME`                      | no       | Sender name (default: Inmobo)                    |
| `PLATFORM_OWNER_EMAIL`                 | no       | CC notifications to platform owner               |
| `APP_BASE_URL`                         | no       | Application URL (default: http://localhost:5173) |
