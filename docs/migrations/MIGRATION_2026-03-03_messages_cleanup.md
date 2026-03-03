# Migration: messages — eliminar `readBySender` y `idx_msg_sender`

**Fecha:** 2026-03-03
**Colección:** `messages`
**Base de datos:** `main`
**Riesgo:** Bajo — el atributo nunca se lee y el índice no tiene queries asociadas.

---

## Contexto

La auditoría de la colección `messages` reveló:

1. **`readBySender`** (boolean, default `true`) — siempre se escribía como `true` y **ningún código lo lee nunca**. Campo muerto.
2. **`idx_msg_sender`** (key en `senderUserId`) — ninguna query del backend ni frontend usa `Query.equal("senderUserId", ...)`. Todo el filtrado por sender se hace client-side en JavaScript.

Se eliminaron las escrituras de `readBySender` del código (5 archivos). Ahora hay que eliminar el atributo y el índice de Appwrite.

---

## Paso 1 — Eliminar el índice `idx_msg_sender`

1. Abrir Appwrite Console → `main` → `messages` → **Indexes**
2. Localizar `idx_msg_sender` (key en `senderUserId`)
3. Eliminar el índice

## Paso 2 — Eliminar el atributo `readBySender`

> ⚠️ **Importante:** Eliminar un atributo en Appwrite borra el dato de TODOS los documentos existentes. Como el campo siempre fue `true` y nunca se lee, no hay impacto.

1. Ir a **Attributes** de la colección `messages`
2. Localizar `readBySender` (boolean)
3. Eliminar el atributo

## Paso 3 — Verificación

- [ ] `idx_msg_sender` ya no aparece en la pestaña Indexes
- [ ] `readBySender` ya no aparece en la pestaña Attributes
- [ ] La colección `messages` tiene 10 atributos (antes 11)
- [ ] El índice `idx_msg_conversation` sigue intacto con keys `(conversationId, enabled, $createdAt)`
- [ ] Probar: enviar un mensaje de chat desde el frontend → se crea correctamente sin el campo `readBySender`

---

## Rollback

Si fuera necesario restaurar:

1. Crear atributo `readBySender` tipo `boolean`, default `true`, no required
2. Crear índice `idx_msg_sender` tipo `key` en columna `senderUserId`, sort ASC

Los documentos existentes ya no tendrán el valor — el default `true` aplicará para nuevos documentos.

---

## Archivos modificados en código

| Archivo                                         | Cambio                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/services/chatService.js`                   | Eliminado `readBySender: true` del create                                                         |
| `functions/create-lead/src/index.js`            | Eliminado `readBySender: true` de 2 creates                                                       |
| `functions/send-proposal/src/index.js`          | Eliminado `readBySender: true` del create                                                         |
| `functions/respond-proposal/src/index.js`       | Eliminado `readBySender: true` del create                                                         |
| `src/utils/chatParticipants.js`                 | Agregada `resolveMessageSenderRole()`                                                             |
| `src/contexts/ChatContext.jsx`                  | `senderRole` ahora usa `resolveMessageSenderRole(user.role)` en vez de `senderSide \|\| chatRole` |
| `functions/send-chat-notification/src/index.js` | Fix `propertyTitle` → `resourceTitle` + `enabled` filter                                          |
| `docs/core/03_appwrite_db_schema.md`            | Actualizada sección `messages`                                                                    |
