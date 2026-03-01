# 13_CHAT_MESSAGING_SCHEMA - RESOURCE-CENTRIC

## Objective

Define the chat schema for platform resources with actionable proposal messages and clear archive/finalize behavior.

---

## Collection: conversations

Purpose: client <-> owner/staff thread bound to a resource.

| Attribute       | Type     | Size | Required | Default  | Notes                               |
| --------------- | -------- | ---- | -------- | -------- | ----------------------------------- |
| `resourceId`    | string   | 64   | yes      | -        | FK logical `resources.$id`          |
| `resourceTitle` | string   | 200  | yes      | -        | denormalized for UI                 |
| `clientUserId`  | string   | 64   | yes      | -        | FK `users.$id`                      |
| `clientName`    | string   | 120  | yes      | -        | denormalized                        |
| `ownerUserId`   | string   | 64   | yes      | -        | FK `users.$id`                      |
| `ownerName`     | string   | 120  | yes      | -        | denormalized                        |
| `lastMessage`   | string   | 200  | no       | `""`     | preview                             |
| `lastMessageAt` | datetime | -    | no       | -        | ISO 8601 UTC                        |
| `clientUnread`  | integer  | -    | no       | 0        | min 0, max 9999                     |
| `ownerUnread`   | integer  | -    | no       | 0        | min 0, max 9999                     |
| `status`        | enum     | -    | no       | `active` | `active`,`archived`,`closed`        |
| `enabled`       | boolean  | -    | no       | true     | soft delete                         |

Indexes:

- `idx_conv_client` (`clientUserId ?`, `enabled ?`)
- `idx_conv_owner` (`ownerUserId ?`, `enabled ?`)
- `idx_conv_resource` (`resourceId ?`, `enabled ?`)
- `idx_conv_lastmsg` (`lastMessageAt ?`)
- `uq_conv_client_resource` (`clientUserId ?`, `resourceId ?`)

---

## Collection: messages

Purpose: individual messages in a conversation, including actionable proposal payloads.

| Attribute         | Type    | Size | Required | Default | Notes                                                |
| ----------------- | ------- | ---- | -------- | ------- | ---------------------------------------------------- |
| `conversationId`  | string  | 64   | yes      | -       | FK `conversations.$id`                               |
| `senderUserId`    | string  | 64   | yes      | -       | FK `users.$id`                                       |
| `senderName`      | string  | 120  | yes      | -       | denormalized                                         |
| `senderRole`      | enum    | -    | yes      | -       | `client`,`owner`,`staff`,`root`                      |
| `body`            | string  | 4000 | yes      | -       | visible text summary                                 |
| `kind`            | enum    | -    | no       | `text`  | `text`,`system`,`proposal`,`proposal_response`       |
| `payloadJson`     | string  | 8000 | no       | -       | JSON payload for structured/actionable message cards |
| `relatedLeadId`   | string  | 64   | no       | -       | optional FK logical `leads.$id`                      |
| `readBySender`    | boolean | -    | no       | true    | -                                                    |
| `readByRecipient` | boolean | -    | no       | false   | -                                                    |
| `enabled`         | boolean | -    | no       | true    | soft delete                                          |

Indexes:

- `idx_msg_conversation` (`conversationId ?`, `enabled ?`, `$createdAt ?`)
- `idx_msg_sender` (`senderUserId ?`)

---

## Proposal Payload Contracts

### `kind = "proposal"` -> `payloadJson`

```json
{
  "proposalType": "visit",
  "timeStart": "2026-04-15T16:00:00.000Z",
  "timeEnd": "2026-04-15T16:30:00.000Z",
  "timezone": "America/Mexico_City",
  "meetingType": "on_site",
  "location": "Address or call link",
  "fromResourceAddress": true,
  "status": "pending",
  "expiresAt": "2026-04-14T00:00:00.000Z",
  "createdByRole": "owner"
}
```

Rules:

- `proposalType`: `visit | booking_manual`
- `meetingType`: required for `visit` (`on_site | video_call`)
- `status`: `pending | accepted | rejected | reschedule_requested`
- `createdByRole`: `owner | staff | root`

### `kind = "proposal_response"` -> `payloadJson`

```json
{
  "response": "request_change",
  "comment": "Can we move it to tomorrow?",
  "suggestedSlots": [
    {
      "startDateTime": "2026-04-16T16:00:00.000Z",
      "endDateTime": "2026-04-16T16:30:00.000Z",
      "timezone": "America/Mexico_City"
    }
  ]
}
```

Rules:

- `response`: `accept | reject | request_change`
- `suggestedSlots` is optional and used when requesting changes.

---

## Archive vs Finalize Semantics

Archive (inbox/UI only):

- `conversations.status = archived`
- `leads.isArchived = true`
- does not force `leads.status` pipeline change.

Finalize (resolved outcome):

- `conversations.status = closed`
- lead must end in `closed_won` or `closed_lost`
- optional closure reason is stored in `leads.metaJson.closureReason`.

Reopen policy:

- If client sends a new message on an archived thread, reopen to `active` and set `leads.isArchived = false`.
- If a thread is closed, a new request should create a new lead instance for clean analytics.
  Current implementation reuses the conversation record (status back to `active`) and creates a new lead when no open lead exists.

---

## Permissions

Collection-level:

- `Role.users("verified")`: create/read/update
- `Role.label("root")`: create/read/update/delete

Document-level:

- Function-created permissions restrict access to the conversation participants.

---

## Function Integration

- `create-lead`: writes initial `kind="text"` message and canonical `payloadJson` metadata (`intent`,`contactChannel`).
- `send-proposal`: internal actor writes `kind="proposal"`.
- `respond-proposal`: client actor writes `kind="proposal_response"` and updates original proposal status.

---

Last update: 2026-03-01
Version: 3.0.0
