# 13_CHAT_MESSAGING_SCHEMA - RESOURCE-CENTRIC

## Objetivo

Definir schema de chat para arquitectura v3 donde el hilo se vincula a `resourceId`.

---

## Collection: conversations

Purpose: hilo cliente <-> owner/staff con referencia al recurso.

| Attribute | Type | Size | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `resourceId` | string | 64 | yes | - | FK logical `resources.$id` (canonico) |
| `resourceTitle` | string | 200 | yes | - | denormalizado |
| `propertyId` | string | 64 | no | - | alias legacy temporal |
| `propertyTitle` | string | 200 | no | - | alias legacy temporal |
| `clientUserId` | string | 64 | yes | - | FK `users.$id` |
| `clientName` | string | 120 | yes | - | denormalizado |
| `ownerUserId` | string | 64 | yes | - | FK `users.$id` |
| `ownerName` | string | 120 | yes | - | denormalizado |
| `lastMessage` | string | 200 | no | `""` | preview |
| `lastMessageAt` | datetime | - | no | - | ultimo mensaje |
| `clientUnread` | integer | - | no | 0 | contador |
| `ownerUnread` | integer | - | no | 0 | contador |
| `status` | enum | - | no | `active` | `active`,`archived`,`closed` |
| `enabled` | boolean | - | no | true | soft delete |

Indexes recomendados:

- `idx_conv_client` (`clientUserId ↑`, `enabled ↑`)
- `idx_conv_owner` (`ownerUserId ↑`, `enabled ↑`)
- `idx_conv_resource` (`resourceId ↑`, `enabled ↑`)
- `idx_conv_lastmsg` (`lastMessageAt ↓`)
- `uq_conv_client_resource` (`clientUserId ↑`, `resourceId ↑`)

---

## Collection: messages

Purpose: mensajes individuales dentro del hilo.

| Attribute | Type | Size | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `conversationId` | string | 64 | yes | - | FK `conversations.$id` |
| `senderUserId` | string | 64 | yes | - | FK `users.$id` |
| `senderName` | string | 120 | yes | - | denormalizado |
| `senderRole` | enum | - | yes | - | `client`,`owner`,`staff`,`root` |
| `body` | string | 4000 | yes | - | contenido |
| `readBySender` | boolean | - | no | true | - |
| `readByRecipient` | boolean | - | no | false | - |
| `enabled` | boolean | - | no | true | soft delete |

Indexes:

- `idx_msg_conversation` (`conversationId ↑`, `enabled ↑`, `$createdAt ↑`)
- `idx_msg_sender` (`senderUserId ↑`)

---

## Permisos recomendados

Collection-level:

- `Role.users("verified")`: create/read/update
- `Role.label("root")`: create/read/update/delete

Documento:

- Seguridad por filtros de query + pertenencia a la conversacion.

---

## Flujo lead + chat (v3)

1. Cliente inicia contacto desde detalle del recurso.
2. Se crea/actualiza lead (`resourceId` canonico).
3. Se crea/obtiene conversacion por (`clientUserId`, `resourceId`).
4. Mensajes en tiempo real por Appwrite Realtime.
5. Si receptor offline, se dispara `send-chat-notification`.

---

## Compatibilidad temporal

- Se aceptan `propertyId/propertyTitle` solo para migracion.
- Nuevo codigo debe leer/escribir `resourceId/resourceTitle` como prioridad.

---

Ultima actualizacion: 2026-02-18
Version: 2.0.0
