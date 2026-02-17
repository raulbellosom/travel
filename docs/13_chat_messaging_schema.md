# Chat & Messaging System — Appwrite DB Schema

## Overview

The chat system extends the existing leads pipeline with real-time messaging.
When a client contacts a property, both a **lead** (for CRM tracking) and a
**conversation** (for real-time messaging) can be created.

---

## Collection: `conversations`

Stores the metadata for each chat thread between a client and a property owner.

| Attribute       | Type     | Size | Required | Default      | Constraint / Notes                          |
| --------------- | -------- | ---- | -------- | ------------ | ------------------------------------------- |
| `propertyId`    | string   | 64   | yes      | —            | FK → `properties.$id`                       |
| `propertyTitle` | string   | 200  | yes      | —            | Denormalized for display                    |
| `clientUserId`  | string   | 64   | yes      | —            | FK → `users.$id` (the client who initiated) |
| `clientName`    | string   | 120  | yes      | —            | Denormalized                                |
| `ownerUserId`   | string   | 64   | yes      | —            | FK → `users.$id` (property owner/manager)   |
| `ownerName`     | string   | 120  | yes      | —            | Denormalized                                |
| `lastMessage`   | string   | 200  | no       | `""`         | Truncated preview of last message           |
| `lastMessageAt` | datetime | —    | no       | `$createdAt` | ISO timestamp of latest message             |
| `clientUnread`  | integer  | —    | no       | `0`          | Unread count for the client                 |
| `ownerUnread`   | integer  | —    | no       | `0`          | Unread count for the owner                  |
| `status`        | enum     | —    | no       | `active`     | `active`, `archived`, `closed`              |
| `enabled`       | boolean  | —    | no       | `true`       | Soft delete                                 |

### Indexes

| Index Name                 | Type   | Attributes                   | Order |
| -------------------------- | ------ | ---------------------------- | ----- |
| `idx_conv_client`          | key    | `clientUserId`, `enabled`    | ASC   |
| `idx_conv_owner`           | key    | `ownerUserId`, `enabled`     | ASC   |
| `idx_conv_property`        | key    | `propertyId`, `enabled`      | ASC   |
| `idx_conv_lastmsg`         | key    | `lastMessageAt`              | DESC  |
| `idx_conv_client_property` | unique | `clientUserId`, `propertyId` | ASC   |

### Permissions

```
read("user:{clientUserId}")
update("user:{clientUserId}")
read("user:{ownerUserId}")
update("user:{ownerUserId}")
read("label:root")
update("label:root")
delete("label:root")
```

---

## Collection: `messages`

Stores individual messages within a conversation.

| Attribute         | Type    | Size | Required | Default | Constraint / Notes                 |
| ----------------- | ------- | ---- | -------- | ------- | ---------------------------------- |
| `conversationId`  | string  | 64   | yes      | —       | FK → `conversations.$id`           |
| `senderUserId`    | string  | 64   | yes      | —       | FK → `users.$id`                   |
| `senderName`      | string  | 120  | yes      | —       | Denormalized                       |
| `senderRole`      | enum    | —    | yes      | —       | `client`, `owner`, `staff`, `root` |
| `body`            | string  | 4000 | yes      | —       | Message text content               |
| `readBySender`    | boolean | —    | no       | `true`  | —                                  |
| `readByRecipient` | boolean | —    | no       | `false` | —                                  |
| `enabled`         | boolean | —    | no       | `true`  | Soft delete                        |

### Indexes

| Index Name             | Type | Attributes                                | Order |
| ---------------------- | ---- | ----------------------------------------- | ----- |
| `idx_msg_conversation` | key  | `conversationId`, `enabled`, `$createdAt` | ASC   |
| `idx_msg_sender`       | key  | `senderUserId`                            | ASC   |

### Permissions

Messages inherit conversation permissions. When creating a message,
set document-level permissions:

```
read("user:{clientUserId}")
read("user:{ownerUserId}")
update("user:{senderUserId}")
read("label:root")
delete("label:root")
```

---

## Environment Variables

Add to your `.env` file:

```bash
# Chat collections
APPWRITE_COLLECTION_CONVERSATIONS_ID=conversations
APPWRITE_COLLECTION_MESSAGES_ID=messages

# Chat notification function
APPWRITE_FUNCTION_SEND_CHAT_NOTIFICATION_ID=send-chat-notification

# Platform owner email (receives CC on all chat notifications)
PLATFORM_OWNER_EMAIL=admin@yourdomain.com
```

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│                                                              │
│  PropertyDetail Page                                         │
│  ┌──────────────┐  ┌──────────────────┐                     │
│  │ Contact Form  │  │ Start Chat Btn   │                     │
│  │ (Lead only)   │  │ (Chat + Lead)    │                     │
│  └──────┬───────┘  └───────┬──────────┘                     │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  create-lead-public   ChatContext.startConversation()        │
│                            │                                 │
│                      ┌─────┴──────┐                          │
│                      │ Find or    │                          │
│                      │ Create     │                          │
│                      │ Convo      │                          │
│                      └─────┬──────┘                          │
│                            │                                 │
│                      ┌─────▼──────┐                          │
│                      │  ChatBubble │ ← Floating widget       │
│                      │  ChatWindow │                         │
│                      │  Messages   │ ← Appwrite Realtime     │
│                      └─────┬──────┘                          │
│                            │                                 │
│                      send-chat-notification                  │
│                      (if recipient offline)                  │
│                            │                                 │
│                      ┌─────▼──────┐                          │
│                      │   Email    │                          │
│                      │ to owner + │                          │
│                      │ CC root    │                          │
│                      └────────────┘                          │
│                                                              │
│  Dashboard (/app/conversations)                              │
│  ┌────────────────────────────────────────────┐              │
│  │ Split Panel View                           │              │
│  │ ┌──────────┐ ┌───────────────────────────┐│              │
│  │ │ Conv     │ │ Messages + Input          ││              │
│  │ │ List     │ │                           ││              │
│  │ │          │ │  [msg1]    [msg2]         ││              │
│  │ │          │ │       [msg3]              ││              │
│  │ │          │ │ ┌────────────────────┐    ││              │
│  │ │          │ │ │ Type a message...  │    ││              │
│  │ │          │ │ └────────────────────┘    ││              │
│  │ └──────────┘ └───────────────────────────┘│              │
│  └────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## Appwrite Console Setup Steps

1. **Create `conversations` collection** in your database with the schema above
2. **Create `messages` collection** in your database with the schema above
3. **Create all indexes** listed above
4. **Deploy `send-chat-notification` function**:
   - Runtime: Node.js 18+
   - Entrypoint: `src/index.js`
   - Execute permission: `any`
   - Set all required environment variables
5. **Add env vars** to your frontend `.env` file
6. **Enable Appwrite Realtime** for both collections (enabled by default)
